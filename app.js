/* ============================================================
   el pequeño networker — lógica · v5
   carrete de 4 secciones (fundido) · menú = una palabra ·
   contactos / frases / sellos son contadores que tú sumas.
   ============================================================ */

'use strict';

const EVENT = EVENT_SONAR;
const KEY = 'epn_state_v5';
const VOLUME = 0.16;
const PAGES = ['hablar', 'contactos', 'frases', 'tarjetas'];

/* las frases pinchables (con clave estable para contarlas) */
const FRASES = [
  { group: 'tu pitch', items: [{ k: 'pitch', t: EVENT.pitch }] },
  { group: 'para romper el hielo', items: (EVENT.pasos[1].openers || []).map((t, i) => ({ k: 'open' + i, t })) },
  { group: 'para enterarte de qué va', items: (EVENT.pasos[2].openers || []).map((t, i) => ({ k: 'radar' + i, t })) },
  { group: EVENT.servilleta.title, items: EVENT.servilleta.steps.map((t, i) => ({ k: 'serv' + i, t })) },
];

/* ---------- estado ---------- */
function defaultState() {
  return {
    version: 5,
    eventId: EVENT.id,
    thread: null,
    convos: 0,
    contactCounts: { general: 0, cliente: 0, colab: 0 },
    fraseCounts: {},
    cardsGiven: 0,
    cardsMade: 0,
    skin: { web: 0, studio: 0, nubeL: 0, nubeM: 0, nubeS: 0 },
    muted: false,
    fontStep: 0,
  };
}
function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.version === 5 && s.eventId === EVENT.id) return s; }
  } catch (e) { console.warn('estado ilegible:', e); }
  return defaultState();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('no se pudo guardar:', e); } }
let state = loadState();
window.__resetCampaign = function () { state = defaultState(); save(); location.reload(); };

let page = 0;

/* ---------- audio ---------- */
let actx = null, master = null;
function ensureAudio() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    actx = new AC(); master = actx.createGain(); master.gain.value = state.muted ? 0 : VOLUME; master.connect(actx.destination);
  }
  if (actx.state === 'suspended') actx.resume();
}
function tone(freq, dur, type = 'sine', delay = 0) {
  if (!actx) return;
  const t = actx.currentTime + delay;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = freq; o.connect(g); g.connect(master);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  tick() { tone(440, 0.07, 'sine'); },
  add() { tone(560, 0.09, 'triangle'); tone(740, 0.09, 'triangle', 0.05); },
  step() { tone(540, 0.10, 'triangle'); },
  done() { [523.25, 659.25, 783.99].forEach((f, i) => tone(f, 0.12, 'triangle', i * 0.06)); },
};

/* ---------- avisos ---------- */
function nudge(text) {
  const wrap = document.getElementById('turnins');
  const el = document.createElement('div'); el.className = 'turnin'; el.textContent = text;
  wrap.appendChild(el); requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 350); }, 2600);
}
function commit() { save(); render(); }

/* ============================================================
   NAVEGACIÓN (carrete con fundido)
   ============================================================ */
function goTo(i) {
  page = (i + PAGES.length) % PAGES.length;   // cicla (carrete)
  document.querySelectorAll('.page').forEach((p, idx) => p.classList.toggle('active', idx === page));
  document.getElementById('navword').textContent = PAGES[page];
  document.querySelectorAll('#dots .dot').forEach((d, idx) => d.classList.toggle('active', idx === page));
}
function navNext() { goTo(page + 1); }

(function enableSwipe() {
  const vp = document.getElementById('viewport');
  let x0 = 0, y0 = 0, on = false;
  vp.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; x0 = t.clientX; y0 = t.clientY; on = true; }, { passive: true });
  vp.addEventListener('touchend', (e) => {
    if (!on) return; on = false;
    const t = e.changedTouches[0]; const dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) goTo(page + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();

/* ============================================================
   ACCIONES
   ============================================================ */
// conversación
function startConvo() { if (state.thread) return; state.thread = { step: 1, tipo: null, used: [] }; sfx.step(); commit(); }
function advanceConvo() { const th = state.thread; if (!th) return; const prev = EVENT.pasos[th.step - 1]; th.step++; sfx.step(); nudge(`${prev.name} · hecho`); commit(); }
function useOpener(i) { const th = state.thread; if (!th) return; if (!th.used.includes(i)) { th.used.push(i); sfx.tick(); commit(); } }
function classify(tipo) { const th = state.thread; if (!th) return; th.tipo = tipo; th.step = 4; sfx.step(); nudge(`${EVENT.tipos[tipo].label} · anótalo en contactos`); commit(); }
function closeConvo() { const th = state.thread; if (!th) return; state.convos++; state.thread = null; sfx.done(); nudge('conversación cerrada · bien'); commit(); }

// contactos (3 contadores)
function addContact(tipo) { state.contactCounts[tipo] = (state.contactCounts[tipo] || 0) + 1; sfx.add(); commit(); }

// frases (cada línea suma)
function useFrase(k) { state.fraseCounts[k] = (state.fraseCounts[k] || 0) + 1; sfx.tick(); commit(); }

// tarjetas
function giveCard() { state.cardsGiven++; sfx.add(); commit(); }
function makeCard() { state.cardsMade++; sfx.add(); commit(); }
function stampSkin(id) { state.skin[id] = (state.skin[id] || 0) + 1; sfx.add(); commit(); }

// ajustes
function toggleMute() { state.muted = !state.muted; if (master) master.gain.value = state.muted ? 0 : VOLUME; document.getElementById('mute').textContent = state.muted ? 'mute' : 'son.'; save(); }
function bumpFont(d) { state.fontStep = Math.max(-2, Math.min(3, state.fontStep + d)); applyFont(); save(); }
function applyFont() { document.documentElement.style.setProperty('--fs', (1 + state.fontStep * 0.08).toFixed(2) + 'rem'); }

/* ============================================================
   RENDER
   ============================================================ */
function render() {
  document.getElementById('mute').textContent = state.muted ? 'mute' : 'son.';
  renderConvo(); renderContactos(); renderFrases(); renderTarjetas();
}

function renderConvo() {
  const el = document.getElementById('convo'); const th = state.thread;
  if (!th) {
    el.className = '';
    el.innerHTML = `
      <p class="kicker">hablar · cuando veas a alguien</p>
      <p class="desc">empieza una conversación. te llevo paso a paso. con calma.</p>
      <div class="row"><button class="btn primary" data-action="start">empezar una conversación</button></div>
      <p class="note">conversaciones hasta ahora: <span class="mono">${state.convos}</span></p>`;
    return;
  }
  const s = EVENT.pasos[th.step - 1];
  el.className = s.scan ? 'scanning' : '';
  let body = `<div class="step-head"><span class="step-n">${th.step}/4</span><span class="step-name">${s.name}</span></div><p class="desc">${s.desc}</p>`;
  if (s.openers) body += `<ul class="ammo">` + s.openers.map((a, i) => `<li class="${th.used.includes(i) ? 'used' : ''}" data-action="opener" data-i="${i}">«${a}»</li>`).join('') + `</ul>`;
  if (s.scan) {
    body += `<div class="row">` + Object.entries(EVENT.tipos).map(([id, t]) => `<button class="btn" data-action="classify" data-t="${id}">${t.label}</button>`).join('') + `</div>`;
  } else if (s.closes) {
    if (th.tipo === 'cliente' || th.tipo === 'colab') body += `<p class="pitch-box">«${EVENT.pitch}»</p>`;
    body += `<div class="row">` + s.closes.map(c => `<button class="btn ${c.id === 'pitch' ? 'primary' : ''}" data-action="close" data-c="${c.id}">${c.label}</button>`).join('') + `</div>`;
  } else if (s.cta) {
    body += `<div class="row"><button class="btn primary" data-action="advance">${s.cta}</button></div>`;
  }
  body += `<p class="note">${s.note}</p>`;
  el.innerHTML = body;
}

function renderContactos() {
  const cc = state.contactCounts;
  const total = cc.general + cc.cliente + cc.colab;
  const items = Object.entries(EVENT.tipos).map(([id, t]) => {
    const n = cc[id] || 0;
    return `<div class="fbtn lg ${n > 0 ? 'has' : ''}" data-action="addcontact" data-t="${id}">
      <span class="ftext">${t.label}</span><span class="fnum">×${n}</span></div>`;
  }).join('');
  document.getElementById('contactos').innerHTML = `
    <p class="kicker">contactos · toca para sumar</p>
    <div class="flist">${items}</div>
    <p class="note">total: <span class="mono">${total}</span></p>`;
}

function renderFrases() {
  const groups = FRASES.map(g => `
    <div class="fgroup">
      <h3>${g.group}</h3>
      ${g.items.map(it => {
        const n = state.fraseCounts[it.k] || 0;
        return `<div class="fbtn ${n > 0 ? 'has' : ''}" data-action="frase" data-k="${it.k}">
          <span class="ftext">«${it.t}»</span><span class="fnum">×${n}</span>
        </div>`;
      }).join('')}
    </div>`).join('');
  document.getElementById('frases').innerHTML = `<p class="kicker">frases · tócalas al usarlas</p>${groups}`;
}

function renderTarjetas() {
  const skin = EVENT.sellos.map(s => {
    const n = state.skin[s.id] || 0;
    return `<div class="fbtn ${n > 0 ? 'has' : ''}" data-action="skin" data-id="${s.id}">
      <span class="ftext stamp">${s.text}</span><span class="fnum">×${n}</span></div>`;
  }).join('');
  document.getElementById('tarjetas').innerHTML = `
    <p class="kicker">tarjetas · toca para sumar</p>
    <div class="flist">
      <div class="fbtn lg ${state.cardsGiven > 0 ? 'has' : ''}" data-action="givecard">
        <span class="ftext">tarjetas entregadas</span><span class="fnum">×${state.cardsGiven}</span></div>
      <div class="fbtn lg ${state.cardsMade > 0 ? 'has' : ''}" data-action="makecard">
        <span class="ftext">creadas y entregadas<span class="fsub">alguien se hizo la suya con tus sellos</span></span><span class="fnum">×${state.cardsMade}</span></div>
    </div>
    <div class="block">
      <p class="kicker">sellos estampados en piel</p>
      <div class="flist">${skin}</div>
    </div>`;
}

/* ============================================================
   EVENTOS
   ============================================================ */
document.addEventListener('click', (e) => {
  const dot = e.target.closest('#dots .dot');
  if (dot) { ensureAudio(); goTo(+dot.dataset.go); return; }
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  ensureAudio();
  switch (btn.dataset.action) {
    case 'navnext':    navNext(); break;
    case 'start':      startConvo(); break;
    case 'advance':    advanceConvo(); break;
    case 'opener':     useOpener(+btn.dataset.i); break;
    case 'classify':   classify(btn.dataset.t); break;
    case 'close':      closeConvo(); break;
    case 'addcontact': addContact(btn.dataset.t); break;
    case 'frase':      useFrase(btn.dataset.k); break;
    case 'givecard':   giveCard(); break;
    case 'makecard':   makeCard(); break;
    case 'skin':       stampSkin(btn.dataset.id); break;
    case 'mute':       toggleMute(); break;
    case 'textup':     bumpFont(+1); break;
    case 'textdown':   bumpFont(-1); break;
  }
});

/* ---------- arranque ---------- */
function buildDots() {
  document.getElementById('dots').innerHTML = PAGES.map((_, i) => `<button class="dot" data-go="${i}" aria-label="ir a ${PAGES[i]}"></button>`).join('');
}
applyFont();
buildDots();
goTo(0);
render();
