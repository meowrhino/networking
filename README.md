# el pequeño networker 🌲

una pequeña app para acordarte de hacer networking en **sónar+d 2026** (18–19 juny, llotja de mar)
y tirar p'alante sin agobiarte. la abres, miras qué toca hacer, y sigues.

hecha a mano en html/css/js, sin frameworks, sin build, sin servidor. todo el progreso vive en el
navegador (`localStorage`). en vivo: **https://meowrhino.github.io/el-pequeno-networker/**

## qué hace

- **marcador** — los dos números del finde: **buenos contactos** (0/3) y **conversaciones** (0/8).
- **una conversación, paso a paso** — lo más difícil, troceado:
  1. **acércate** (ponte al lado de alguien; no hace falta hablar aún)
  2. **rompe el hielo** (saluda y suelta una frase — con tus aperturas listas)
  3. **entérate de qué va** (dos preguntas y clasificas a la persona)
  4. **cierra** (dale tu tarjeta + pitch, o despídete majo)
- **a quién has conocido** — clasificas en **colaborador** / **cliente potencial** / **no me interesa**, para saber tú qué hacer.
- **el cálculo de la servilleta** — tu jugada de venta: su mensualidad anual vs. tu pago único.
- **tus sellos** — los 3 reales (¿quieres una web? / meowrhino.studio / nube); co-craft.
- **la recompensa** — salir de fiesta sin culpa, se desbloquea con tu primer buen contacto.

es **todo el finde, sin reiniciar**. el progreso solo sube; el color (ámbar/verde) se gana al actuar.

## cómo abrirla en local

```bash
cd "/Users/meowrhino/Desktop/networking"
node serve.js   # o: python3 -m http.server 8000
# abre http://localhost:8000
```

## estructura

```
index.html        estructura + carga de scripts
styles.css        el look: oscuro, sin cajas, color que se gana
app.js            lógica: estado, render, audio, eventos
events/sonar.js   los textos editables (números, pasos, frases, tipos, sellos)
docs/concepto-v2.md   el documento de concepto (no se publica)
serve.js          servidor estático mínimo (solo desarrollo)
```

> todo lo editable (números, pasos, frases de apertura, tipos, sellos) vive en `events/sonar.js`.

## notas

- estado en `localStorage['epn_state_v3']`. reset solo para pruebas: en consola, `__resetCampaign()`.
- arriba a la derecha: `a−` / `a+` (tamaño de texto) y `son./mute`.
- el ☁ del sello "nube" es un placeholder → meter el svg real.
- pendiente: más frases de apertura (las trabajamos), modo "¿qué hago ahora?", y pwa/offline.
