/* ============================================================
   el pequeño networker — lógica · v6
   carrete de 4 secciones (fundido) · menú-ruleta ·
   datos guardados POR DÍA + panel de admin en el modal.
   ============================================================ */

'use strict';

const EVENT = EVENT_SONAR;
const KEY = 'epn_state_v6';
const VOLUME = 0.16;
const PAGES = ['hablar', 'contactos', 'frases', 'tarjetas'];

/* las frases pinchables (con clave estable para contarlas) */
const FRASES = [
  { group: 'tu pitch', items: [{ k: 'pitch', t: EVENT.pitch }] },
  { group: 'para romper el hielo', items: (EVENT.pasos[1].openers || []).map((t, i) => ({ k: 'open' + i, t })) },
  { group: 'para enterarte de qué va', items: (EVENT.pasos[2].openers || []).map((t, i) => ({ k: 'radar' + i, t })) },
  { group: EVENT.servilleta.title, items: EVENT.servilleta.steps.map((t, i) => ({ k: 'serv' + i, t })) },
];

/* ---------- estado (uno por día) ---------- */
function dayState() {
  return {
    thread: null,
    convos: 0,
    contactCounts: { general: 0, cliente: 0, colab: 0 },
    fraseCounts: {},
    cardsGiven: 0,
  };
}
function defaultState() {
  const days = {};
  EVENT.days.forEach(d => { days[d.id] = dayState(); });
  return { version: 6, eventId: EVENT.id, activeDayOverride: null, days, muted: false };
}
function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.version === 6 && s.eventId === EVENT.id) {
        EVENT.days.forEach(d => { if (!s.days[d.id]) s.days[d.id] = dayState(); });  // por si añades días
        return s;
      }
    }
  } catch (e) { console.warn('estado ilegible:', e); }
  return defaultState();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('no se pudo guardar:', e); } }
let state = loadState();
window.__resetCampaign = function () { state = defaultState(); save(); location.reload(); };

/* ---------- qué día está activo ---------- */
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function ymd(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
// el día rueda a las EVENT.dayCutoffHour: antes de esa hora cuenta como el día anterior
function autoDayId() {
  const shifted = new Date(Date.now() - EVENT.dayCutoffHour * 3600 * 1000);
  const key = ymd(shifted);
  const ids = EVENT.days.map(d => d.id);
  if (ids.includes(key)) return key;
  return key < ids[0] ? ids[0] : ids[ids.length - 1];   // fuera del rango → primer/último día
}
function activeDayId() { return state.activeDayOverride || autoDayId(); }
function dayLabel(id) { const d = EVENT.days.find(x => x.id === id); return d ? d.label : id; }
function day() { return state.days[activeDayId()]; }

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
  undo() { tone(380, 0.08, 'sine'); tone(280, 0.10, 'sine', 0.05); },
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
   NAVEGACIÓN (menú arrastrable estilo pol roig + fundido)
   ============================================================ */
const navrail = document.getElementById('navrail');
let railLock = false, lockTimer = null, settleTimer = null;

function buildNav() {
  navrail.innerHTML = PAGES.map((w, i) => `<button class="navitem" data-action="navitem" data-i="${i}">${w}</button>`).join('');
}
function applyPage(i, scrollRail) {
  page = (i + PAGES.length) % PAGES.length;
  document.querySelectorAll('.page').forEach((p, idx) => p.classList.toggle('active', idx === page));
  navrail.querySelectorAll('.navitem').forEach((n, idx) => n.classList.toggle('active', idx === page));
  if (scrollRail) centerNavItem(page);
}
function centerNavItem(i) {
  const it = navrail.querySelectorAll('.navitem')[i]; if (!it) return;
  // instantáneo: con scroll-snap-stop:always el scroll suave se atasca en el 1er anclaje
  railLock = true; clearTimeout(lockTimer);
  navrail.scrollTo({ left: it.offsetLeft + it.offsetWidth / 2 - navrail.clientWidth / 2, behavior: 'auto' });
  updateRail();
  lockTimer = setTimeout(() => { railLock = false; }, 150);
}
// ruleta: cada palabra escala y se desvanece según lo cerca que esté del centro
function updateRail() {
  const center = navrail.scrollLeft + navrail.clientWidth / 2;
  const reach = navrail.clientWidth * 0.5;
  navrail.querySelectorAll('.navitem').forEach((it) => {
    const c = it.offsetLeft + it.offsetWidth / 2;
    const t = Math.min(Math.abs(c - center) / reach, 1);   // 0 centro · 1 borde
    it.style.transform = `scale(${(1.22 - t * 0.5).toFixed(3)})`;
    it.style.opacity = (1 - t * 0.62).toFixed(3);
  });
}
// al arrastrar el menú y soltar, navega a la sección que quede centrada
let railRaf = null;
navrail.addEventListener('scroll', () => {
  if (railRaf == null) railRaf = requestAnimationFrame(() => { railRaf = null; updateRail(); });
  if (railLock) return;
  clearTimeout(settleTimer);
  settleTimer = setTimeout(() => {
    const center = navrail.scrollLeft + navrail.clientWidth / 2;
    let best = 0, bestD = Infinity;
    navrail.querySelectorAll('.navitem').forEach((it, idx) => {
      const c = it.offsetLeft + it.offsetWidth / 2, d = Math.abs(c - center);
      if (d < bestD) { bestD = d; best = idx; }
    });
    if (best !== page) { applyPage(best, false); ensureAudio(); sfx.tick(); }
  }, 110);
}, { passive: true });
window.addEventListener('resize', () => centerNavItem(page));

// swipe en el contenido también cambia de sección (y centra el menú)
(function enableSwipe() {
  const vp = document.getElementById('viewport');
  let x0 = 0, y0 = 0, on = false;
  vp.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; x0 = t.clientX; y0 = t.clientY; on = true; }, { passive: true });
  vp.addEventListener('touchend', (e) => {
    if (!on) return; on = false;
    const t = e.changedTouches[0]; const dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) applyPage(page + (dx < 0 ? 1 : -1), true);
  }, { passive: true });
})();

/* ============================================================
   ACCIONES
   ============================================================ */
// conversación (todo sobre el día activo)
function startConvo() { const d = day(); if (d.thread) return; d.thread = { step: 1, tipo: null, used: [] }; sfx.step(); commit(); }
function advanceConvo() { const th = day().thread; if (!th) return; const prev = EVENT.pasos[th.step - 1]; th.step++; sfx.step(); nudge(`${prev.name} · hecho`); commit(); }
function useOpener(i) { const th = day().thread; if (!th) return; if (!th.used.includes(i)) { th.used.push(i); sfx.tick(); commit(); } }
// clasificar guarda el contacto en su contador (3/4 → contactos)
function classify(tipo) { const d = day(); const th = d.thread; if (!th) return; th.tipo = tipo; th.step = 4; d.contactCounts[tipo] = (d.contactCounts[tipo] || 0) + 1; sfx.add(); nudge(`+1 · ${EVENT.tipos[tipo].label}`); commit(); }
// cerrar siempre entrega una tarjeta (4/4 → tarjetas)
function closeConvo() { const d = day(); if (!d.thread) return; d.convos++; d.cardsGiven++; d.thread = null; sfx.done(); nudge('cerrada · +1 tarjeta entregada'); commit(); }

// contactos (3 contadores con − / +)
function addContact(tipo) { const d = day(); d.contactCounts[tipo] = (d.contactCounts[tipo] || 0) + 1; sfx.add(); commit(); }
function subContact(tipo) { const d = day(); d.contactCounts[tipo] = Math.max(0, (d.contactCounts[tipo] || 0) - 1); sfx.undo(); commit(); }

// frases (cada línea suma; mantener pulsado resta)
function useFrase(k) { const d = day(); d.fraseCounts[k] = (d.fraseCounts[k] || 0) + 1; sfx.tick(); commit(); }

// tarjetas (− / +)
function giveCard() { day().cardsGiven++; sfx.add(); commit(); }
function subCard() { const d = day(); d.cardsGiven = Math.max(0, d.cardsGiven - 1); sfx.undo(); commit(); }

// modal (misión + sonido + admin)
function openModal() { renderModal(); document.getElementById('modal').hidden = false; }
function closeModal() { document.getElementById('modal').hidden = true; }
function toggleMute() { state.muted = !state.muted; if (master) master.gain.value = state.muted ? 0 : VOLUME; document.getElementById('mute').textContent = state.muted ? 'sonido off' : 'sonido on'; save(); }

// admin: cambiar de día, resetear
function setDay(id) { state.activeDayOverride = id; save(); render(); renderModal(); }
function autoDay() { state.activeDayOverride = null; save(); render(); renderModal(); }
function resetDay() {
  const id = activeDayId();
  if (!confirm(`¿borrar los datos de ${dayLabel(id)}?`)) return;
  state.days[id] = dayState(); save(); render(); renderModal();
}
function resetAll() {
  if (!confirm('¿borrar TODOS los datos de todos los días?')) return;
  state = defaultState(); save(); render(); renderModal();
}

/* ============================================================
   RENDER
   ============================================================ */
function renderDayLabel() {
  const el = document.getElementById('evDay');
  el.textContent = '· ' + dayLabel(activeDayId()) + (state.activeDayOverride ? ' (fijado)' : '');
}
function renderMission() {
  document.getElementById('mission').innerHTML =
    `<p class="m-title">${EVENT.name}</p>` + EVENT.mission.map(l => `<p>${l}</p>`).join('');
}
function dayTotals(d) {
  const cc = d.contactCounts;
  return (cc.general + cc.cliente + cc.colab) + 'c · ' + d.cardsGiven + 't · ' + d.convos + ' charlas';
}
function renderAdmin() {
  const auto = autoDayId();
  const active = activeDayId();
  const dayBtns = `<button class="adm-day ${!state.activeDayOverride ? 'on' : ''}" data-action="autoday">auto</button>` +
    EVENT.days.map(d => `<button class="adm-day ${state.activeDayOverride === d.id ? 'on' : ''}" data-action="setday" data-day="${d.id}">${d.label}${d.id === auto ? ' ·' : ''}</button>`).join('');
  const list = EVENT.days.map(d => `<p class="adm-row ${d.id === active ? 'on' : ''}"><span>${d.label}</span><span class="mono">${dayTotals(state.days[d.id])}</span></p>`).join('');
  document.getElementById('admin').innerHTML = `
    <p class="adm-h">día activo · editas el que elijas aquí</p>
    <div class="adm-days">${dayBtns}</div>
    <div class="adm-list">${list}</div>
    <div class="adm-actions">
      <button class="adm-reset" data-action="resetday">borrar este día</button>
      <button class="adm-reset" data-action="resetall">borrar todo</button>
    </div>`;
}
function renderModal() { renderMission(); renderAdmin(); }
function render() {
  document.getElementById('mute').textContent = state.muted ? 'sonido off' : 'sonido on';
  renderDayLabel();
  renderConvo(); renderContactos(); renderFrases(); renderTarjetas();
}

function renderConvo() {
  const el = document.getElementById('convo'); const d = day(); const th = d.thread;
  if (!th) {
    el.className = '';
    el.innerHTML = `
      <p class="kicker">hablar · cuando veas a alguien</p>
      <p class="desc">empieza una conversación. te llevo paso a paso. con calma.</p>
      <div class="row"><button class="btn primary" data-action="start">empezar una conversación</button></div>
      <p class="note">conversaciones hoy: <span class="mono">${d.convos}</span></p>`;
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
  const cc = day().contactCounts;
  const total = cc.general + cc.cliente + cc.colab;
  const items = Object.entries(EVENT.tipos).map(([id, t]) => {
    const n = cc[id] || 0;
    return `<div class="cstep ${n > 0 ? 'has' : ''}">
      <span class="cstep-label">${t.label}</span>
      <span class="cstep-ctrl">
        <button class="cstep-btn" data-action="subcontact" data-t="${id}" aria-label="restar">−</button>
        <span class="cstep-n">${n}</span>
        <button class="cstep-btn" data-action="addcontact" data-t="${id}" aria-label="sumar">+</button>
      </span></div>`;
  }).join('');
  document.getElementById('contactos').innerHTML = `
    <div class="csteps">${items}</div>
    <p class="note">total: <span class="mono">${total}</span></p>`;
}

function renderFrases() {
  const fc = day().fraseCounts;
  const groups = FRASES.map(g => `
    <div class="fgroup">
      <h3>${g.group}</h3>
      ${g.items.map(it => {
        const n = fc[it.k] || 0;
        return `<div class="fbtn ${n > 0 ? 'has' : ''}" data-action="frase" data-k="${it.k}">
          <span class="ftext">«${it.t}»</span><span class="fnum">×${n}</span>
        </div>`;
      }).join('')}
    </div>`).join('');
  document.getElementById('frases').innerHTML = `<p class="kicker">frases · toca al usarlas (se cuentan) · mantén para restar</p>${groups}`;
}

function renderTarjetas() {
  const n = day().cardsGiven;
  document.getElementById('tarjetas').innerHTML = `
    <div class="csteps">
      <div class="cstep ${n > 0 ? 'has' : ''}">
        <span class="cstep-label">tarjetas entregadas</span>
        <span class="cstep-ctrl">
          <button class="cstep-btn" data-action="subcard" aria-label="restar">−</button>
          <span class="cstep-n">${n}</span>
          <button class="cstep-btn" data-action="givecard" aria-label="sumar">+</button>
        </span></div>
    </div>
    <p class="note">también suman solas al cerrar una conversación en «hablar».</p>`;
}

// restar 1 en frases (mantener pulsado) · nunca baja de 0
// (contactos y tarjetas ya tienen su botón − explícito)
const DEC = {
  frase: b => { const k = b.dataset.k; const d = day(); d.fraseCounts[k] = Math.max(0, (d.fraseCounts[k] || 0) - 1); },
};

/* ============================================================
   EVENTOS
   ============================================================ */
// mantener pulsado un contador resta 1 (corrige el toque accidental)
let pressTimer = null, longFired = false, px = 0, py = 0;
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('[data-action]');
  if (!b || !DEC[b.dataset.action]) return;
  px = e.clientX; py = e.clientY; longFired = false;
  pressTimer = setTimeout(() => {
    longFired = true;
    ensureAudio(); DEC[b.dataset.action](b); sfx.undo(); nudge('−1'); commit();
    if (navigator.vibrate) navigator.vibrate(15);
  }, 500);
});
document.addEventListener('pointermove', (e) => {
  if (pressTimer && (Math.abs(e.clientX - px) > 10 || Math.abs(e.clientY - py) > 10)) { clearTimeout(pressTimer); pressTimer = null; }
});
['pointerup', 'pointercancel'].forEach(ev => document.addEventListener(ev, () => { clearTimeout(pressTimer); pressTimer = null; }));

document.addEventListener('click', (e) => {
  if (longFired) { longFired = false; return; }   // fue un mantener-pulsado, no sumes
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  ensureAudio();
  switch (btn.dataset.action) {
    case 'navitem':    applyPage(+btn.dataset.i, true); break;
    case 'start':      startConvo(); break;
    case 'advance':    advanceConvo(); break;
    case 'opener':     useOpener(+btn.dataset.i); break;
    case 'classify':   classify(btn.dataset.t); break;
    case 'close':      closeConvo(); break;
    case 'addcontact': addContact(btn.dataset.t); break;
    case 'subcontact': subContact(btn.dataset.t); break;
    case 'frase':      useFrase(btn.dataset.k); break;
    case 'givecard':   giveCard(); break;
    case 'subcard':    subCard(); break;
    case 'openmodal':  openModal(); break;
    case 'closemodal': closeModal(); break;
    case 'mute':       toggleMute(); break;
    case 'setday':     setDay(btn.dataset.day); break;
    case 'autoday':    autoDay(); break;
    case 'resetday':   resetDay(); break;
    case 'resetall':   resetAll(); break;
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

/* ---------- arranque ---------- */
buildNav();
applyPage(0, false);
renderModal();
render();
requestAnimationFrame(() => centerNavItem(0));

/* ---------- pwa: funciona offline y se añade a la pantalla de inicio ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
