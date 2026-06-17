# el pequeño networker ☁️

una pequeña app para acordarte de hacer networking en **sónar+d 2026** (18–19 juny, llotja de mar)
y tirar p'alante sin agobiarte. menú **arrastrable** (estilo pol roig): la sección activa va en el
centro y las demás asoman a los lados; **arrastras** la que quieras al centro (o tocas), y el
contenido cruza en **fundido**.

hecha a mano en html/css/js, sin frameworks, sin build, sin servidor. el contenido va **centrado**
(vertical y horizontal) y los "botones" son texto, no cajas. todo el progreso vive en el navegador
(`localStorage`). es una **pwa**: se añade a la pantalla de inicio y funciona **offline**. en vivo:
**https://meowrhino.github.io/networking/**

## las 4 secciones

1. **hablar** (abre por defecto) — una conversación paso a paso: acércate → rompe el hielo → entérate de qué va → cierra.
2. **contactos** — 3 botones-contador, toca para sumar: **contacto general** / **cliente potencial** / **colaboración potencial** (+ total).
3. **frases** — tu chuleta; cada frase es un botón que cuenta las veces que la usas (pitch, aperturas, preguntas, el cálculo de la servilleta).
4. **tarjetas** — contadores de **tarjetas entregadas** y **creadas y entregadas**, más **sellos estampados en piel** (un contador por cada uno de los 5).

navegas con el **menú-ruleta** de abajo: lo arrastras a un lado y a otro y la palabra que dejes en el
centro es la sección activa (las demás encogen y se desvanecen). también con **swipe** sobre el contenido.

en cualquier contador (contactos, frases, tarjetas, sellos): **toca para sumar**, **mantén pulsado para restar** (corrige el toque accidental; nunca baja de 0).

## instalar como app

ábrela en el móvil, comparte → **«añadir a pantalla de inicio»**. queda un icono ☁️ y se abre a
pantalla completa, sin barra del navegador. tras la primera carga funciona **sin conexión**.

## cómo abrirla en local

```bash
cd "/Users/meowrhino/Desktop/networking"
node serve.js   # o: python3 -m http.server 8000
# abre http://localhost:8000
```

## estructura

```
index.html            4 secciones (fundido) + menú-ruleta + metadatos pwa
styles.css            el look: oscuro, sin cajas, contenido centrado, ruleta
app.js                lógica: estado, navegación, render, ruleta, restar
events/sonar.js       los textos editables (pasos, tipos, frases, sellos)
manifest.webmanifest  pwa: nombre, color, iconos, pantalla completa
sw.js                 service worker: caché del shell → offline
icon.svg / icon-*.png el icono ☁️ (svg + png 180/192/512)
docs/concepto-v2.md   documento de concepto (no se publica)
serve.js              servidor estático mínimo (solo desarrollo)
```

> todo lo editable (pasos, frases, tipos de contacto, los 5 sellos) vive en `events/sonar.js`.

## notas

- estado en `localStorage['epn_state_v5']`. reset solo para pruebas: en consola, `__resetCampaign()`.
- arriba a la derecha: `a−` / `a+` (tamaño de texto) y `son./mute`. favicon = emoji ☁️.
- el ☁ de los sellos "nube" es placeholder → meter el svg real.
- pwa con caché del shell + caché de fuentes al vuelo; al cambiar archivos, sube la versión `CACHE` en `sw.js`.
- pendiente: pulir frases y conectar conversación → contactos (al cerrar, sumar contacto).
