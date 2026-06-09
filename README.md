# el pequeño networker 🌲

una app-rpg para hacer networking en **sónar+d 2026** (18–19 juny, llotja de mar) sin morir
de vergüenza. convierte el networking en un *quest log* estilo world of warcraft, con la estética
del **bosque oscuro**: el cruce entre el mundo de sónar (*"digital gardens and dark forests"*) y
meowrhino.studio (webs a mano, anti-saas).

hecha a mano en html/css/js, sin frameworks, sin build, sin servidor. todo el progreso vive en el
navegador (`localStorage`). concepto completo en [docs/concepto-v2.md](docs/concepto-v2.md).

## cómo abrirla

```bash
cd "/Users/meowrhino/Desktop/networking"
node serve.js   # o: python3 -m http.server 8000
# abre http://localhost:8000
```

## qué hace

- **la máscara** — entras poniéndote "el sello": activas al personaje (la app arranca casi monocroma; el color se gana).
- **misión principal** — *salir del bosque oscuro*: encender **hogueras** (contactos que valen), 0/3 para todo el festival.
- **el hilo** — cadena de **4 pasos guiados** de primer contacto: proximidad → comentario lateral → escáner → plantar la semilla. con frases sugeridas.
- **facciones** (reputación que **solo sube**): **el jardín** (colaboración real, verde), **el bosque oscuro** (cliente a rescatar de wix), **los caminantes** (no interesa → salida limpia, sin color).
- **el cálculo de la servilleta** — tu give-first comercial: comparar su mensualidad anual con tu pago único.
- **sellos + co-craft** — tus 3 sellos reales (gancho / contacto / nube); la gente se hace su propia tarjeta.
- **la noche, sin culpa** — la fiesta como botín que se desbloquea, no como misión.

todo es **campaña de 2 días, sin reset**. el intento es el turn-in: una conversación no se puede fallar.

## estructura

```
index.html        estructura + carga de scripts (sin header)
styles.css        bosque oscuro, sin cajas, color que se gana, voz cláusula
app.js            lógica: estado, render, audio, eventos
events/sonar.js   datos de campaña (facciones, el hilo, servilleta, sellos) — separados de la lógica
docs/concepto-v2.md   el documento de cruce sónar × meowrhino
serve.js          servidor estático mínimo (solo desarrollo)
```

> el contenido editable (misiones, facciones, frases, sellos) vive en `events/sonar.js`.

## notas de desarrollo

- estado en `localStorage['epn_state_v2']`. reset solo para pruebas: en consola, `__resetCampaign()`.
- controles discretos arriba a la derecha: `a−` / `a+` (tamaño de texto, accesibilidad) y `son./mute`.
- respeta `prefers-reduced-motion`.

## siguientes pasos

- el ☁ del sello "nube" es un placeholder unicode → meter tu svg real de la nube.
- pendiente de co-diseñar: world quests ancladas a instalaciones reales de sónar (astral twin, from0,
  moss soundscape…), bonus objectives, y afinar copys.
- más adelante: pwa + offline (service worker), deploy a cloudflare pages, y luego multi-evento.
