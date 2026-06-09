# el pequeño networker ☁️

una pequeña app para acordarte de hacer networking en **sónar+d 2026** (18–19 juny, llotja de mar)
y tirar p'alante sin agobiarte. estilo "carrete": 4 secciones que cambias con **swipe** (o tocando
la **palabra del menú**, que te dice dónde estás), con un **fundido** suave.

hecha a mano en html/css/js, sin frameworks, sin build, sin servidor. todo el progreso vive en el
navegador (`localStorage`). en vivo: **https://meowrhino.github.io/networking/**

## las 4 secciones

1. **hablar** (abre por defecto) — una conversación paso a paso: acércate → rompe el hielo → entérate de qué va → cierra.
2. **contactos** — 3 botones-contador, toca para sumar: **contacto general** / **cliente potencial** / **colaboración potencial** (+ total).
3. **frases** — tu chuleta; cada frase es un botón que cuenta las veces que la usas (pitch, aperturas, preguntas, el cálculo de la servilleta).
4. **tarjetas** — contadores de **tarjetas entregadas** y **creadas y entregadas**, más **sellos estampados en piel** (un contador por cada uno de los 5).

navegas con **swipe del dedo** o tocando la palabra del menú (avanza en bucle). los puntos marcan en cuál estás.

## cómo abrirla en local

```bash
cd "/Users/meowrhino/Desktop/networking"
node serve.js   # o: python3 -m http.server 8000
# abre http://localhost:8000
```

## estructura

```
index.html        4 secciones (fundido) + menú de una palabra
styles.css        el look: oscuro, sin cajas, carrete, contadores
app.js            lógica: estado, navegación, render por sección
events/sonar.js   los textos editables (pasos, tipos, frases, sellos)
docs/concepto-v2.md   documento de concepto (no se publica)
serve.js          servidor estático mínimo (solo desarrollo)
```

> todo lo editable (pasos, frases, tipos de contacto, los 5 sellos) vive en `events/sonar.js`.

## notas

- estado en `localStorage['epn_state_v5']`. reset solo para pruebas: en consola, `__resetCampaign()`.
- arriba a la derecha: `a−` / `a+` (tamaño de texto) y `son./mute`. favicon = emoji ☁️.
- el ☁ de los sellos "nube" es placeholder → meter el svg real.
- pendiente: pulir frases, conectar conversación → contactos, y pwa/offline.
