/* ============================================================
   el pequeño networker — lógica · v3 (literal, sin jerga)
   herramienta para consultar y recordarte que hagas networking.
   campaña de todo el finde (sin reset) · el progreso solo sube.
   ============================================================ */

'use strict';

const EVENT = EVENT_SONAR;          // de events/sonar.js
const KEY = 'epn_state_v3';
const VOLUME = 0.16;

/* ---------- estado ---------- */
function defaultState() {
  return {
    version: 3,
    eventId: EVENT.id,
    buenos: 0,                      // buenos contactos (meta 3)
    convos: 0,                      // conversaciones cerradas (meta ~8)
    rep: { colab: 0, cliente: 0, nope: 0 },   // solo sube
    thread: null,                   // { step:1..4, tipo:null, used:[] }
    servilleta: 0,                  // 0..3
    cards: 0,                       // tarjetas hechas juntos
    nightClaimed: false,
    muted: false,
    fontStep: 0,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.version === 3 && s.eventId === EVENT.id) return s;
    }
  } catch (e) { console.warn('estado ilegible:', e); }
  return defaultState();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { console.warn('no se pudo guardar:', e); }
}
let state = loadState();

// reset solo para pruebas (no se reinicia desde la ui)
window.__resetCampaign = function () { state = defaultState(); save(); location.reload(); };

/* ---------- audio (oscilador, sin archivos) ---------- */
let actx = null, master = null;
function ensureAudio() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    actx = new AC();
    master = actx.createGain();
    master.gain.value = state.muted ? 0 : VOLUME;
    master.connect(actx.destination);
  }
  if (actx.state === 'suspended') actx.resume();
}
function tone(freq, dur, type = 'sine', delay = 0) {
  if (!actx) return;
  const t = actx.currentTime + delay;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(master);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.9, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  tick()  { tone(420, 0.07, 'sine'); },
  step()  { tone(540, 0.10, 'triangle'); },
  done()  { [523.25, 659.25, 783.99].forEach((f, i) => tone(f, 0.13, 'triangle', i * 0.07)); },
  big()   { [392, 523.25, 659.25, 784].forEach((f, i) => tone(f, 0.16, 'sine', i * 0.09)); },
};

/* ---------- avisos (cortos y planos, sin emoji) ---------- */
function nudge(text) {
  const wrap = document.getElementById('turnins');
  const el = document.createElement('div');
  el.className = 'turnin';
  el.textContent = text;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 350); }, 3000);
}

/* ---------- helpers ---------- */
const repLevel = (n) => Math.min(n, 3);
const fameLevel = (n) => (n >= 3 ? 2 : n >= 1 ? 1 : 0);
function commit() { save(); render(); }

/* ============================================================
   ACCIONES
   ============================================================ */
function startConvo() {
  if (state.thread) return;
  state.thread = { step: 1, tipo: null, used: [] };
  sfx.step();
  commit();
}
function advanceConvo() {
  const th = state.thread; if (!th) return;
  const prev = EVENT.pasos[th.step - 1];
  th.step++;
  sfx.step();
  nudge(`${prev.name} · hecho`);
  commit();
}
function useOpener(i) {
  const th = state.thread; if (!th) return;
  if (!th.used.includes(i)) { th.used.push(i); sfx.tick(); commit(); }
}
function classify(tipo) {
  const th = state.thread; if (!th) return;
  th.tipo = tipo;
  state.rep[tipo]++;
  th.step = 4;
  sfx.step();
  nudge(`${EVENT.tipos[tipo].label} · anotado`);
  commit();
}
function closeConvo(/* id */) {
  const th = state.thread; if (!th) return;
  state.convos++;
  state.thread = null;
  sfx.done();
  nudge('conversación cerrada · bien hecho');
  commit();
}
function markGood() {
  if (state.buenos >= EVENT.goals.buenos) return;
  state.buenos++;
  sfx.big();
  nudge('buen contacto anotado');
  commit();
}
function toggleServilleta(i) {
  state.servilleta = (state.servilleta === i + 1) ? i : i + 1;
  sfx.tick();
  if (state.servilleta === EVENT.servilleta.steps.length) nudge('lo tienes · suéltalo cuando toque');
  commit();
}
function coCraft() {
  state.cards++;
  sfx.done();
  nudge('tarjeta hecha juntos');
  commit();
}
function nightUnlocked() { return state.buenos >= 1; }
function claimNight() {
  if (!nightUnlocked() || state.nightClaimed) return;
  state.nightClaimed = true;
  sfx.big();
  nudge('te lo has ganado · disfruta');
  commit();
}
function toggleMute() {
  state.muted = !state.muted;
  if (master) master.gain.value = state.muted ? 0 : VOLUME;
  document.getElementById('mute').textContent = state.muted ? 'mute' : 'son.';
  save();
}
function bumpFont(d) {
  state.fontStep = Math.max(-2, Math.min(3, state.fontStep + d));
  applyFont(); save();
}
function applyFont() {
  document.documentElement.style.setProperty('--fs', (1 + state.fontStep * 0.08).toFixed(2) + 'rem');
}

/* ============================================================
   RENDER
   ============================================================ */
function render() {
  document.getElementById('ev').textContent = EVENT.when;
  document.getElementById('mute').textContent = state.muted ? 'mute' : 'son.';
  renderMarcador();
  renderConvo();
  renderTipos();
  renderServilleta();
  renderSellos();
  renderLoot();
}

function renderMarcador() {
  const g = EVENT.goals;
  const bDone = state.buenos >= g.buenos;
  document.getElementById('marcador').innerHTML = `
    <p class="kicker">cómo vas · todo el finde</p>
    <div class="score">
      <div class="score-item">
        <span class="score-num mono count ${state.buenos > 0 ? 'earned' : ''}">${state.buenos}/${g.buenos}</span>
        <span class="score-lbl">buenos contactos</span>
      </div>
      <div class="score-item">
        <span class="score-num mono count ${state.convos > 0 ? 'earned' : ''}">${state.convos}/${g.convos}</span>
        <span class="score-lbl">conversaciones</span>
      </div>
    </div>
    <p class="note">${marcadorHint(bDone)}</p>
    <div class="row">
      <button class="btn ${bDone ? '' : 'primary'}" data-action="good" ${bDone ? 'disabled' : ''}>
        ${bDone ? 'objetivo cumplido' : 'marcar un buen contacto'}
      </button>
    </div>`;
}
function marcadorHint(done) {
  if (done) return 'objetivo cumplido. lo de más es regalo.';
  if (state.buenos > 0) return 'con uno ya merecía la pena. a por el siguiente cuando puedas.';
  if (state.convos > 0) return 'ya estás en marcha. sigue tirando.';
  return 'empieza una conversación cuando te veas. con calma.';
}

function renderConvo() {
  const el = document.getElementById('convo');
  const th = state.thread;
  const zone = document.getElementById('zone-label');

  if (!th) {
    zone.textContent = 'sónar+d';
    el.className = 'hilo';
    el.innerHTML = `
      <p class="kicker">una conversación</p>
      <div class="step-head"><span class="step-name">no estás hablando con nadie</span></div>
      <p class="desc">cuando veas a alguien, empieza. la app te lleva paso a paso.</p>
      <div class="row"><button class="btn primary" data-action="start">empezar una conversación</button></div>`;
    return;
  }

  const s = EVENT.pasos[th.step - 1];
  zone.textContent = s.name;
  el.className = 'hilo' + (s.scan ? ' scanning' : '');

  let body = `
    <p class="kicker">conversación · paso <span class="mono">${th.step}/4</span></p>
    <div class="step-head"><span class="step-n">${th.step}/4</span><span class="step-name">${s.name}</span></div>
    <p class="desc">${s.desc}</p>`;

  if (s.openers) {
    body += `<ul class="ammo">` + s.openers.map((a, i) =>
      `<li class="${th.used.includes(i) ? 'used' : ''}" data-action="opener" data-i="${i}">«${a}»</li>`).join('') + `</ul>`;
  }

  if (s.scan) {
    body += `<div class="row">
      <button class="btn" data-action="classify" data-t="colab">colaborador</button>
      <button class="btn" data-action="classify" data-t="cliente">cliente potencial</button>
      <button class="btn" data-action="classify" data-t="nope">no me interesa</button>
    </div>`;
  } else if (s.closes) {
    if (th.tipo === 'colab' || th.tipo === 'cliente') {
      body += `<p class="pitch-box">«${EVENT.pitch}»</p>`;
    }
    body += `<div class="row">` + s.closes.map(c =>
      `<button class="btn ${c.id === 'pitch' ? 'primary' : ''}" data-action="close" data-c="${c.id}">${c.label}</button>`).join('') + `</div>`;
  } else if (s.cta) {
    body += `<div class="row"><button class="btn primary" data-action="advance">${s.cta}</button></div>`;
  }

  body += `<p class="note">${s.note}</p>`;
  el.innerHTML = body;
}

function renderTipos() {
  const items = Object.entries(EVENT.tipos).map(([id, t]) => {
    const n = state.rep[id];
    const lvl = repLevel(n);
    return `<li class="fac ${t.tone} ${n > 0 ? 'lvl' : ''}">
      <div class="fac-top">
        <span class="fac-label">${t.label}</span>
        <span class="fac-count mono">×${n}</span>
      </div>
      <div class="fac-sub">${t.sub}</div>
      <div class="fac-level">${t.levels[lvl]}</div>
    </li>`;
  }).join('');
  document.getElementById('tipos').innerHTML = `
    <p class="kicker">a quién has conocido</p>
    <ul class="facs">${items}</ul>`;
}

function renderServilleta() {
  const sv = EVENT.servilleta;
  const items = sv.steps.map((t, i) =>
    `<li class="${i < state.servilleta ? 'done' : ''}" data-action="servilleta" data-i="${i}">
       <span class="txt">${t}</span></li>`).join('');
  document.getElementById('servilleta').innerHTML = `
    <p class="kicker">tu jugada de venta</p>
    <div class="step-head"><span class="step-name">${sv.title}</span></div>
    <p class="desc">${sv.hint}</p>
    <ul class="steps">${items}</ul>`;
}

function renderSellos() {
  const items = EVENT.sellos.map(s =>
    `<div class="sello">
       <span class="stamp ${s.id}">${s.text}</span>
       <span class="rol">${s.rol}</span>
     </div>`).join('');
  document.getElementById('sellos').innerHTML = `
    <p class="kicker">tus sellos</p>
    <div class="sellos">${items}</div>
    <div class="line" style="margin-top:16px">
      <span class="count">tarjetas hechas juntos</span>
      <span class="mono count ${state.cards > 0 ? 'earned' : ''}">${state.cards}</span>
    </div>
    <p class="note">${state.cards > 0 ? '«' + EVENT.fame[fameLevel(state.cards)] + '»' : 'que se hagan SU tarjeta con tus sellos.'}</p>
    <div class="row"><button class="btn" data-action="cocraft">alguien se hizo su tarjeta</button></div>`;
}

function renderLoot() {
  const open = nightUnlocked();
  const claimed = state.nightClaimed;
  document.getElementById('loot').className = 'loot' + (open ? ' unlocked' : '');
  document.getElementById('loot').innerHTML = `
    <p class="kicker">la recompensa</p>
    <div class="step-head"><span class="step-name locked">${EVENT.loot.locked}${open ? '' : ' · bloqueada'}</span></div>
    <p class="hint">${EVENT.loot.hint}</p>
    ${open ? `<div class="row">
      <button class="btn primary" data-action="night" ${claimed ? 'disabled' : ''}>
        ${claimed ? 'cobrada · disfruta' : EVENT.loot.claim}
      </button></div>` : ''}`;
}

/* ============================================================
   EVENTOS (delegación)
   ============================================================ */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  ensureAudio();
  switch (btn.dataset.action) {
    case 'start':      startConvo(); break;
    case 'advance':    advanceConvo(); break;
    case 'opener':     useOpener(+btn.dataset.i); break;
    case 'classify':   classify(btn.dataset.t); break;
    case 'close':      closeConvo(btn.dataset.c); break;
    case 'good':       markGood(); break;
    case 'servilleta': toggleServilleta(+btn.dataset.i); break;
    case 'cocraft':    coCraft(); break;
    case 'night':      claimNight(); break;
    case 'mute':       toggleMute(); break;
    case 'textup':     bumpFont(+1); break;
    case 'textdown':   bumpFont(-1); break;
  }
});

/* ---------- arranque ---------- */
applyFont();
render();
