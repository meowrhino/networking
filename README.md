# el pequeño networker ☁️

una pequeña app para acordarte de hacer networking en **sónar+d 2026** (18–19 juny, llotja de mar)
y tirar p'alante sin agobiarte. estilo "teléfono": 4 pestañas que cambias con **swipe** o con el
**menú de abajo**.

hecha a mano en html/css/js, sin frameworks, sin build, sin servidor. todo el progreso vive en el
navegador (`localStorage`). en vivo: **https://meowrhino.github.io/el-pequeno-networker/**

## las 4 pestañas

1. **hablar** (abre por defecto) — una conversación paso a paso: acércate → rompe el hielo → entérate de qué va → cierra. con tus frases listas.
2. **contactos** — añade a quien conozcas (nombre + tipo: colaborador / cliente potencial / no me interesa + nota). tu lista real de la jornada.
3. **frases** — tu chuleta de jugadas de venta: el pitch, aperturas, preguntas y el cálculo de la servilleta.
4. **tarjetas** — tus 3 sellos + contadores: tarjetas **entregadas** y **creadas y entregadas**.

navegas con **swipe del dedo** (la tira se mueve con `transform: translateX(var(--i)*-100%)`) o tocando el menú de abajo.

## cómo abrirla en local

```bash
cd "/Users/meowrhino/Desktop/networking"
node serve.js   # o: python3 -m http.server 8000
# abre http://localhost:8000
```

## estructura

```
index.html        estructura: 4 páginas en una tira horizontal + menú abajo
styles.css        el look: oscuro, sin cajas, pestañas, swipe
app.js            lógica: estado, navegación, render por pestaña
events/sonar.js   los textos editables (pasos, tipos, frases, sellos)
docs/concepto-v2.md   documento de concepto (no se publica)
serve.js          servidor estático mínimo (solo desarrollo)
```

> todo lo editable (pasos, frases de apertura, tipos, sellos) vive en `events/sonar.js`.

## notas

- estado en `localStorage['epn_state_v4']`. reset solo para pruebas: en consola, `__resetCampaign()`.
- arriba a la derecha: `a−` / `a+` (tamaño de texto) y `son./mute`. favicon = emoji ☁️ (se cambia en una línea en `index.html`).
- el ☁ del sello "nube" es un placeholder → meter el svg real.
- pendiente: pulir frases, conectar "cerrar conversación" con "guardar contacto", y pwa/offline.
