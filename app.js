/* ============================================================
   el pequeño networker — lógica · v4
   app de 4 pestañas (hablar / contactos / frases / tarjetas)
   navegación: menú abajo + swipe del dedo (tira con translateX).
   ============================================================ */

'use strict';

const EVENT = EVENT_SONAR;
const KEY = 'epn_state_v4';
const VOLUME = 0.16;
const TABS = 4;

/* ---------- estado ---------- */
function defaultState() {
  return {
    version: 4,
    eventId: EVENT.id,
    thread: null,                 // conversación en marcha {step, tipo, used}
    convos: 0,                    // conversaciones cerradas
    contacts: [],                 // [{name, tipo, note}]
    cardsGiven: 0,                // tarjetas entregadas
    cardsMade: 0,                 // tarjetas creadas y entregadas (co-craft)
    muted: false,
    fontStep: 0,
  };
}
function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.version === 4 && s.eventId === EVENT.id) return s; }
  } catch (e) { console.warn('estado ilegible:', e); }
  return defaultState();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { console.warn('no se pudo guardar:', e); }
}
let state = loadState();
window.__resetCampaign = function () { state = defaultState(); save(); location.reload(); };

/* runtime (no se guarda) */
let page = 0;          // pestaña actual (siempre arranca en "hablar")
let formTipo = null;   // tipo elegido en el formulario de contacto

/* ---------- audio ---------- */
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
  tick() { tone(420, 0.07, 'sine'); },
  step() { tone(540, 0.10, 'triangle'); },
  done() { [523.25, 659.25, 783.99].forEach((f, i) => tone(f, 0.13, 'triangle', i * 0.07)); },
};

/* ---------- avisos ---------- */
function nudge(text) {
  const wrap = document.getElementById('turnins');
  const el = document.createElement('div');
  el.className = 'turnin'; el.textContent = text;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 350); }, 2800);
}

function commit() { save(); render(); }

/* ============================================================
   NAVEGACIÓN (menú + swipe)
   ============================================================ */
function goTo(i) {
  page = Math.max(0, Math.min(TABS - 1, i));
  document.getElementById('strip').style.setProperty('--i', page);
  updateTabs();
}
function updateTabs() {
  document.querySelectorAll('#tabbar button').forEach((b, i) =>
    b.classList.toggle('active', i === page));
}

// swipe: decidimos en touchend para no romper el scroll vertical
(function enableSwipe() {
  const vp = document.getElementById('viewport');
  let x0 = 0, y0 = 0, tracking = false;
  vp.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0]; x0 = t.clientX; y0 = t.clientY; tracking = true;
  }, { passive: true });
  vp.addEventListener('touchend', (e) => {
    if (!tracking) return; tracking = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      goTo(page + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });
})();

/* ============================================================
   ACCIONES
   ============================================================ */
// --- conversación ---
function startConvo() { if (state.thread) return; state.thread = { step: 1, tipo: null, used: [] }; sfx.step(); commit(); }
function advanceConvo() {
  const th = state.thread; if (!th) return;
  const prev = EVENT.pasos[th.step - 1];
  th.step++; sfx.step(); nudge(`${prev.name} · hecho`); commit();
}
function useOpener(i) { const th = state.thread; if (!th) return; if (!th.used.includes(i)) { th.used.push(i); sfx.tick(); commit(); } }
function classify(tipo) {
  const th = state.thread; if (!th) return;
  th.tipo = tipo; th.step = 4; sfx.step();
  nudge(`${EVENT.tipos[tipo].label} · anótalo en contactos`); commit();
}
function closeConvo() {
  const th = state.thread; if (!th) return;
  state.convos++; state.thread = null; sfx.done();
  nudge('conversación cerrada · bien'); commit();
}

// --- contactos ---
function setFormTipo(t) {
  formTipo = (formTipo === t) ? null : t;
  document.querySelectorAll('#c-tipo .btn').forEach(b => b.classList.toggle('sel', b.dataset.t === formTipo));
  sfx.tick();
}
function saveContact() {
  const name = (document.getElementById('c-name').value || '').trim();
  const note = (document.getElementById('c-note').value || '').trim();
  if (!name && !formTipo && !note) { nudge('escribe un nombre o elige un tipo'); return; }
  state.contacts.unshift({ name: name || '(sin nombre)', tipo: formTipo, note });
  document.getElementById('c-name').value = '';
  document.getElementById('c-note').value = '';
  formTipo = null;
  document.querySelectorAll('#c-tipo .btn').forEach(b => b.classList.remove('sel'));
  sfx.done(); nudge('contacto guardado'); commit();
}
function delContact(i) { state.contacts.splice(i, 1); sfx.tick(); commit(); }

// --- tarjetas ---
function giveCard() { state.cardsGiven++; sfx.done(); nudge('tarjeta entregada'); commit(); }
function makeCard() { state.cardsMade++; sfx.done(); nudge('tarjeta hecha juntos'); commit(); }

// --- ajustes ---
function toggleMute() {
  state.muted = !state.muted;
  if (master) master.gain.value = state.muted ? 0 : VOLUME;
  document.getElementById('mute').textContent = state.muted ? 'mute' : 'son.';
  save();
}
function bumpFont(d) { state.fontStep = Math.max(-2, Math.min(3, state.fontStep + d)); applyFont(); save(); }
function applyFont() { document.documentElement.style.setProperty('--fs', (1 + state.fontStep * 0.08).toFixed(2) + 'rem'); }

/* ============================================================
   RENDER
   ============================================================ */
function render() {
  document.getElementById('mute').textContent = state.muted ? 'mute' : 'son.';
  renderConvo();
  renderContactos();
  renderFrases();
  renderTarjetas();
}

function renderConvo() {
  const el = document.getElementById('convo');
  const th = state.thread;
  if (!th) {
    el.className = '';
    el.innerHTML = `
      <p class="kicker">cuando veas a alguien</p>
      <p class="desc">empieza una conversación. te llevo paso a paso. con calma.</p>
      <div class="row"><button class="btn primary" data-action="start">empezar una conversación</button></div>
      <p class="note">conversaciones hasta ahora: <span class="mono ${state.convos > 0 ? 'count earned' : 'count'}">${state.convos}</span></p>`;
    return;
  }
  const s = EVENT.pasos[th.step - 1];
  el.className = s.scan ? 'scanning' : '';
  let body = `
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
      <button class="btn" data-action="classify" data-t="nope">no me interesa</button></div>`;
  } else if (s.closes) {
    if (th.tipo === 'colab' || th.tipo === 'cliente') body += `<p class="pitch-box">«${EVENT.pitch}»</p>`;
    body += `<div class="row">` + s.closes.map(c =>
      `<button class="btn ${c.id === 'pitch' ? 'primary' : ''}" data-action="close" data-c="${c.id}">${c.label}</button>`).join('') + `</div>`;
  } else if (s.cta) {
    body += `<div class="row"><button class="btn primary" data-action="advance">${s.cta}</button></div>`;
  }
  body += `<p class="note">${s.note}</p>`;
  el.innerHTML = body;
}

function renderContactos() {
  const c = state.contacts;
  const by = { colab: 0, cliente: 0, nope: 0 };
  c.forEach(x => { if (x.tipo) by[x.tipo]++; });
  const list = c.length
    ? `<ul class="clist">` + c.map((x, i) => {
        const t = x.tipo ? EVENT.tipos[x.tipo].label : '—';
        return `<li class="citem">
          <div class="cmain">
            <div class="cname">${esc(x.name)}</div>
            ${x.note ? `<div class="cnote">${esc(x.note)}</div>` : ''}
          </div>
          <span class="ctipo ${x.tipo || 'nope'}">${t}</span>
          <button class="btn" data-action="delcontact" data-i="${i}" aria-label="borrar" style="padding:4px 9px">×</button>
        </li>`;
      }).join('') + `</ul>`
    : `<p class="note">aún no has guardado a nadie. cada conversación que valga, apúntala aquí.</p>`;
  document.getElementById('contactos-list').innerHTML = `
    <div class="tally">
      <span><b>${c.length}</b> en total</span>
      <span><b>${by.colab}</b> colaboradores</span>
      <span><b>${by.cliente}</b> clientes</span>
    </div>
    ${list}`;
}

function renderFrases() {
  const p = EVENT.pasos;
  const openers = p[1].openers || [];
  const radar = p[2].openers || [];
  const sv = EVENT.servilleta;
  document.getElementById('frases').innerHTML = `
    <p class="kicker">tu chuleta · jugadas de venta</p>
    <div class="fgroup">
      <h3>tu pitch</h3>
      <ul class="ammo plain"><li>«${EVENT.pitch}»</li></ul>
    </div>
    <div class="fgroup">
      <h3>para romper el hielo</h3>
      <ul class="ammo plain">${openers.map(a => `<li>«${a}»</li>`).join('')}</ul>
    </div>
    <div class="fgroup">
      <h3>para enterarte de qué va</h3>
      <ul class="ammo plain">${radar.map(a => `<li>«${a}»</li>`).join('')}</ul>
    </div>
    <div class="fgroup">
      <h3>${sv.title}</h3>
      <p class="note" style="margin-top:2px">${sv.hint}</p>
      <ul class="steps">${sv.steps.map(t => `<li><span class="txt">${t}</span></li>`).join('')}</ul>
    </div>`;
}

function renderTarjetas() {
  const sellos = EVENT.sellos.map(s =>
    `<div class="sello"><span class="stamp ${s.id}">${s.text}</span><span class="rol">${s.rol}</span></div>`).join('');
  document.getElementById('tarjetas').innerHTML = `
    <p class="kicker">tus sellos</p>
    <div class="sellos">${sellos}</div>

    <div class="block">
      <div class="line"><span>tarjetas entregadas</span>
        <span class="bignum mono ${state.cardsGiven > 0 ? 'count earned' : 'count'}">${state.cardsGiven}</span></div>
      <div class="row"><button class="btn" data-action="givecard">di una tarjeta</button></div>
    </div>

    <div class="block">
      <div class="line"><span>creadas y entregadas</span>
        <span class="bignum mono ${state.cardsMade > 0 ? 'count earned' : 'count'}">${state.cardsMade}</span></div>
      <p class="note" style="margin-top:8px">cuando alguien se hace SU tarjeta con tus sellos.</p>
      <div class="row"><button class="btn" data-action="makecard">alguien se hizo la suya</button></div>
    </div>`;
}

function esc(s) { return String(s).replace(/[<>&]/g, m => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[m])); }

/* ============================================================
   EVENTOS
   ============================================================ */
document.addEventListener('click', (e) => {
  const tab = e.target.closest('#tabbar [data-go]');
  if (tab) { ensureAudio(); goTo(+tab.dataset.go); return; }
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  ensureAudio();
  switch (btn.dataset.action) {
    case 'start':      startConvo(); break;
    case 'advance':    advanceConvo(); break;
    case 'opener':     useOpener(+btn.dataset.i); break;
    case 'classify':   classify(btn.dataset.t); break;
    case 'close':      closeConvo(); break;
    case 'ctipo':      setFormTipo(btn.dataset.t); break;
    case 'csave':      saveContact(); break;
    case 'delcontact': delContact(+btn.dataset.i); break;
    case 'givecard':   giveCard(); break;
    case 'makecard':   makeCard(); break;
    case 'mute':       toggleMute(); break;
    case 'textup':     bumpFont(+1); break;
    case 'textdown':   bumpFont(-1); break;
  }
});

/* ---------- arranque ---------- */
applyFont();
goTo(0);
render();
