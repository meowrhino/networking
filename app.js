/* ============================================================
   el pequeño networker — lógica · v2 (vanilla, sin build)
   campaña de festival (sin reset) · reputación que solo sube ·
   el intento es el turn-in · color que se gana · voz cláusula.
   ============================================================ */

'use strict';

const EVENT = EVENT_SONAR;          // de events/sonar.js
const KEY = 'epn_state_v2';
const VOLUME = 0.16;

/* ---------- estado ---------- */
function defaultState() {
  return {
    version: 2,
    eventId: EVENT.id,
    lit: false,                     // ¿personaje encendido?
    hogueras: 0,                    // contactos que valen (meta 3)
    hilosClosed: 0,                 // acercamientos cerrados (meta ~8)
    rep: { jardin: 0, bosque: 0, caminantes: 0 },  // solo sube
    thread: null,                   // { step:1..4, faction:null, used:[] }
    servilleta: 0,                  // 0..3 pasos hechos
    cards: 0,                       // tarjetas co-creadas
    nightClaimed: false,
    muted: false,
    fontStep: 0,                    // -2..+3 escala de texto
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.version === 2 && s.eventId === EVENT.id) return s;
    }
  } catch (e) { console.warn('estado ilegible:', e); }
  return defaultState();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { console.warn('no se pudo guardar:', e); }
}
let state = loadState();

// reset oculto, solo para pruebas (la campaña NO se reinicia desde la ui)
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
  tick()     { tone(420, 0.07, 'sine'); },
  step()     { tone(540, 0.10, 'triangle'); },
  complete() { [523.25, 659.25, 783.99].forEach((f, i) => tone(f, 0.13, 'triangle', i * 0.07)); },
  bonfire()  { [392, 523.25, 659.25, 784].forEach((f, i) => tone(f, 0.16, 'sine', i * 0.09)); },
};

/* ---------- turn-ins (avisos secos, sin emoji) ---------- */
function turnin(text, ok) {
  const wrap = document.getElementById('turnins');
  const el = document.createElement('div');
  el.className = 'turnin';
  el.innerHTML = text + (ok ? ` <span class="ok">(${ok})</span>` : '');
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 350); }, 3200);
}

/* ---------- helpers ---------- */
const facLevel = (n) => Math.min(n, 3);     // 0..3 → índice de frase
const fameLevel = (n) => (n >= 3 ? 2 : n >= 1 ? 1 : 0);
function commit() { save(); render(); }

/* ============================================================
   ACCIONES
   ============================================================ */
function lightCharacter() {
  state.lit = true;
  sfx.complete();
  commit();
  const entry = document.getElementById('entry');
  entry.classList.add('out');
  setTimeout(() => { entry.hidden = true; }, 600);
}

function openThread() {
  if (state.thread) return;
  state.thread = { step: 1, faction: null, used: [] };
  sfx.step();
  commit();
}

function advanceThread() {
  const th = state.thread; if (!th) return;
  th.step++;
  sfx.step();
  const stepDef = EVENT.hilo[th.step - 2];   // el que acabamos de cerrar
  if (stepDef && stepDef.clause) turnin(stepDef.clause, 'brotó');
  commit();
}

function useAmmo(i) {
  const th = state.thread; if (!th) return;
  if (!th.used.includes(i)) { th.used.push(i); sfx.tick(); commit(); }
}

function assignFaction(fac) {
  const th = state.thread; if (!th) return;
  th.faction = fac;
  state.rep[fac]++;
  sfx.step();
  th.step = 4;
  const f = EVENT.factions[fac];
  turnin(`art. 1.c: ${f.label} registrado.`, fac === 'caminantes' ? 'sin color' : 'brotó');
  commit();
}

function closeThread(/* closeId */) {
  const th = state.thread; if (!th) return;
  state.hilosClosed++;
  state.thread = null;
  sfx.complete();
  turnin(EVENT.hilo[3].clause, 'brotó');
  commit();
}

function lightBonfire() {
  if (state.hogueras >= EVENT.goals.hogueras) return;
  state.hogueras++;
  sfx.bonfire();
  turnin('art. 1: hoguera encendida. el sello de goma es la prueba.', 'brotó');
  commit();
}

function toggleServilleta(i) {
  // marca hasta el paso i inclusive (o desmarca si ya estaba el último)
  state.servilleta = (state.servilleta === i + 1) ? i : i + 1;
  sfx.tick();
  if (state.servilleta === EVENT.servilleta.steps.length) turnin(EVENT.servilleta.clause, 'brotó');
  commit();
}

function coCraft() {
  state.cards++;
  sfx.complete();
  turnin('art. 6: nodo de tu cozy web, no un «scan to add me».', 'brotó');
  commit();
}

function claimNight() {
  if (!nightUnlocked() || state.nightClaimed) return;
  state.nightClaimed = true;
  sfx.bonfire();
  turnin(EVENT.loot.clause, 'cobrada');
  commit();
}
function nightUnlocked() {
  return state.hogueras >= 1 || fameLevel(state.cards) >= 1;
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
  // entrada
  document.getElementById('entry-manifesto').textContent = EVENT.entry.manifesto;
  document.getElementById('entry-flag').textContent = EVENT.entry.flag;
  document.getElementById('entry-rules').textContent = EVENT.entry.rules;
  document.getElementById('light-btn').textContent = EVENT.entry.cta;
  document.getElementById('ev').textContent = EVENT.when;
  document.getElementById('mute').textContent = state.muted ? 'mute' : 'son.';

  const app = document.getElementById('app');
  const entry = document.getElementById('entry');
  if (state.lit) { app.hidden = false; entry.hidden = true; }
  else { app.hidden = true; entry.hidden = false; }
  if (!state.lit) return;

  renderPrincipal();
  renderHilo();
  renderRep();
  renderServilleta();
  renderSellos();
  renderLoot();
}

function renderPrincipal() {
  const g = EVENT.goals.hogueras;
  const done = state.hogueras >= g;
  const earned = state.hogueras > 0 ? 'earned' : '';
  document.getElementById('principal').innerHTML = `
    <p class="kicker">misión principal · todo el festival</p>
    <h2><span class="bang ${done ? 'off' : ''}">!</span>salir del bosque oscuro</h2>
    <div class="line">
      <span class="hogueras">hogueras encendidas</span>
      <span class="mono count ${earned}">${state.hogueras}/${g}</span>
    </div>
    <p class="clause">art. 1: vine solo y a propósito. con una ya merece la pena.</p>
    <div class="row">
      <button class="btn ${done ? '' : 'primary'}" data-action="bonfire" ${done ? 'disabled' : ''}>
        ${done ? 'campaña cumplida' : 'encender una hoguera'}
      </button>
    </div>`;
}

function renderHilo() {
  const el = document.getElementById('hilo');
  const th = state.thread;
  const zone = document.getElementById('zone-label');

  if (!th) {
    zone.textContent = 'el bosque oscuro';
    el.className = 'hilo';
    el.innerHTML = `
      <p class="kicker">el hilo · primer contacto</p>
      <div class="step-head"><span class="step-name">ningún hilo abierto</span></div>
      <p class="desc">cada persona nueva es un hilo. la vergüenza la lleva el personaje, no tú.</p>
      <div class="line" style="margin-top:12px">
        <span class="count">hilos cerrados</span>
        <span class="mono count ${state.hilosClosed > 0 ? 'earned' : ''}">${state.hilosClosed}/${EVENT.goals.hilos}</span>
      </div>
      <div class="row"><button class="btn primary" data-action="open-thread">abrir un hilo</button></div>`;
    return;
  }

  const s = EVENT.hilo[th.step - 1];
  zone.textContent = s.name;
  el.className = 'hilo' + (s.scan ? ' scanning' : '');

  let body = `
    <p class="kicker">el hilo · paso <span class="mono">${th.step}/4</span></p>
    <div class="step-head"><span class="step-n">${th.step}/4</span><span class="step-name">${s.name}</span></div>
    <p class="desc">${s.desc}</p>`;

  if (s.obj) body += `<p class="obj">— ${s.obj}</p>`;

  if (s.ammo) {
    body += `<ul class="ammo">` + s.ammo.map((a, i) =>
      `<li class="${th.used.includes(i) ? 'used' : ''}" data-action="ammo" data-i="${i}">«${a}»</li>`).join('') + `</ul>`;
  }

  if (s.scan) {
    body += `<div class="row">
      <button class="btn" data-action="faction" data-f="jardin">el jardín</button>
      <button class="btn" data-action="faction" data-f="bosque">el bosque oscuro</button>
      <button class="btn" data-action="faction" data-f="caminantes">un caminante</button>
    </div>`;
  } else if (s.closes) {
    if (th.faction === 'jardin' || th.faction === 'bosque') {
      body += `<p class="pitch-box">«${EVENT.pitch}»</p>`;
    }
    body += `<div class="row">` + s.closes.map(c =>
      `<button class="btn ${c.id === 'pitch' ? 'primary' : ''}" data-action="close" data-c="${c.id}">${c.label}</button>`).join('') + `</div>`;
  } else if (s.cta) {
    body += `<div class="row"><button class="btn primary" data-action="advance">${s.cta}</button></div>`;
  }

  body += `<p class="clause">${s.clause}</p>`;
  el.innerHTML = body;
}

function renderRep() {
  const items = Object.entries(EVENT.factions).map(([id, f]) => {
    const n = state.rep[id];
    const lvl = facLevel(n);
    const lit = n > 0 ? 'lvl' : '';
    return `<li class="fac ${f.tone} ${lit}">
      <div class="fac-top">
        <span class="fac-label">${f.label}</span>
        <span class="fac-count mono">×${n}</span>
      </div>
      <div class="fac-sub">${f.sub}</div>
      <div class="fac-level">${f.levels[lvl]}</div>
    </li>`;
  }).join('');
  document.getElementById('rep').innerHTML = `
    <p class="kicker">reputación · solo sube</p>
    <ul class="facs">${items}</ul>`;
}

function renderServilleta() {
  const sv = EVENT.servilleta;
  const items = sv.steps.map((t, i) =>
    `<li class="${i < state.servilleta ? 'done' : ''}" data-action="servilleta" data-i="${i}">
       <span class="txt">${t}</span></li>`).join('');
  document.getElementById('servilleta').innerHTML = `
    <p class="kicker">de oficio · give-first</p>
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
  const fame = EVENT.fame[fameLevel(state.cards)];
  document.getElementById('sellos').innerHTML = `
    <p class="kicker">botín · sellos y co-craft</p>
    <div class="sellos">${items}</div>
    <div class="line" style="margin-top:16px">
      <span class="count">tarjetas co-creadas</span>
      <span class="mono count ${state.cards > 0 ? 'earned' : ''}">${state.cards}</span>
    </div>
    <p class="clause">${state.cards > 0 ? '«' + fame + '»' : 'que se hagan SU tarjeta con tus sellos.'}</p>
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
        ${claimed ? 'cobrada · sin culpa' : EVENT.loot.claim}
      </button></div>` : ''}`;
}

/* ============================================================
   EVENTOS (delegación)
   ============================================================ */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  ensureAudio();
  const a = btn.dataset.action;
  switch (a) {
    case 'light':       lightCharacter(); break;
    case 'open-thread': openThread(); break;
    case 'advance':     advanceThread(); break;
    case 'ammo':        useAmmo(+btn.dataset.i); break;
    case 'faction':     assignFaction(btn.dataset.f); break;
    case 'close':       closeThread(btn.dataset.c); break;
    case 'bonfire':     lightBonfire(); break;
    case 'servilleta':  toggleServilleta(+btn.dataset.i); break;
    case 'cocraft':     coCraft(); break;
    case 'night':       claimNight(); break;
    case 'mute':        toggleMute(); break;
    case 'textup':      bumpFont(+1); break;
    case 'textdown':    bumpFont(-1); break;
  }
});

/* ---------- arranque ---------- */
applyFont();
render();
