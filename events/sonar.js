/* ============================================================
   el pequeño networker — datos de campaña · sónar+d 2026 (v2)
   ------------------------------------------------------------
   esto son DATOS, no lógica. el cruce sónar × meowrhino vive aquí:
   facciones (jardín / bosque oscuro / caminantes), el hilo de primer
   contacto, el cálculo de la servilleta y los 3 sellos reales.
   ============================================================ */

const EVENT_SONAR = {
  id: 'sonar-2026',
  name: 'sónar+d 2026',
  when: '18–19 juny · llotja de mar',

  // objetivos para TODO el festival (sin reset por día)
  goals: { hogueras: 3, hilos: 8 },

  // pantalla de entrada (la máscara = el permiso)
  entry: {
    manifesto:
      'somos un estudio de diseño web en barcelona. hoy no. ' +
      'hoy eres el pequeño networker. esto es el bosque oscuro: ' +
      'todos escondidos de los builders, las mensualidades, el scroll. ' +
      'tú llevas semillas.',
    flag: 'hagamos networking para que merezca la pena',
    rules:
      'no trabajamos con placeholders. una conversación no se puede ' +
      'fallar: el intento es el turn-in. el código es tuyo; el contacto, ' +
      'también. aceptar estas reglas significa salir a hablar.',
    cta: 'ponerme el sello',
  },

  // los 3 sellos REALES (del pdf de ritagraf)
  sellos: [
    { id: 'gancho',   text: '¿quieres una web?',  rol: 'el opener · abre conversación' },
    { id: 'contacto', text: 'meowrhino.studio',   rol: 'el cierre · cómo te encuentran' },
    { id: 'nube',     text: '☁',                  rol: 'la marca · decoración / relleno' },
  ],

  // facciones: la reputación SOLO sube. cada nivel es una frase oíble.
  factions: {
    jardin: {
      label: 'el jardín', sub: 'afín · colaboración real', tone: 'garden',
      levels: ['—', 'un brote', 'deberíamos hacer algo', 'te escribo esta semana, en serio'],
    },
    bosque: {
      label: 'el bosque oscuro', sub: 'atrapado en wix · cliente a rescatar', tone: 'ember',
      levels: ['—', 'escondido', '¿y eso cuánto me costaría?', 'vale, mándame un presupuesto'],
    },
    caminantes: {
      label: 'los caminantes', sub: 'no es lo mío · salida limpia', tone: 'fog',
      levels: ['—', 'un caminante', 'varios caminantes', 'registrados, sin color'],
    },
  },

  // reputación general (basada en tarjetas co-creadas)
  fame: ['neutral', '¿tú eras el de los sellos?', 'el de los sellos, ven que te presento a alguien'],

  // la cadena de primer contacto: 4 pasos guiados
  hilo: [
    {
      n: 1, name: 'proximidad',
      desc: 'no hay que hablar. todavía.',
      obj: 'ponte a menos de 2 m de alguien y aguanta 30 s',
      clause: 'art. 1.a: la proximidad no obliga a hablar. estar cerca ya computa.',
      cta: 'estoy cerca',
    },
    {
      n: 2, name: 'el comentario lateral',
      desc: 'no te presentes. comenta algo que no seas tú.',
      ammo: [
        'esa pregunta que has hecho ha estado buena',
        '¿café o cortado?',
        'esto, ¿es a medida o usaron algo ya hecho?',
      ],
      clause: 'art. 2: el comentario lateral exime de presentación.',
      cta: 'he comentado',
    },
    {
      n: 3, name: 'el escáner', scan: true,
      desc: 'dos preguntas-radar. en ~60 s sabes de qué facción es.',
      ammo: ['¿en qué andas ahora mismo?', '¿y qué esperas encontrar aquí?'],
      clause: 'art. 1.c: clasificar es calibrar. asigna facción.',
    },
    {
      n: 4, name: 'plantar la semilla',
      desc: 'cierra. las dos ramas son éxito.',
      closes: [
        { id: 'pitch', label: 'tarjeta + tu pitch de 3 frases' },
        { id: 'honor', label: 'tarjeta + salida con honor ("deberías hablar con ___")' },
      ],
      clause: 'art. 1.d: ambas ramas constituyen cierre válido. no queda saldo pendiente.',
    },
  ],

  pitch:
    'soy dev web en barcelona. hago webs a mano, a medida, para que ' +
    'dejes de pagar wix o squarespace y tengas algo acabado y con carácter. ' +
    'busco diseñadores, músicos y artistas que quieran una web que se sienta suya.',

  // el cálculo de la servilleta (tu mecánica comercial)
  servilleta: {
    title: 'el cálculo de la servilleta',
    hint: 'que el número convenza, no el discurso.',
    steps: [
      'saca el móvil y suma con la otra persona lo que paga AL AÑO en su builder',
      'ponlo al lado de tu pago único: «600 €, una vez, sin servidores ni suscripciones»',
      'deja la frase que vende sola: «en dos años ya pagaste tres webs mías»',
    ],
    clause: 'art. 5: el número convence más que el discurso.',
  },

  // el botín de la noche: se desbloquea, no se persigue
  loot: {
    locked: 'la noche · sin culpa',
    hint: 'se enciende con 1 hoguera, o cuando ya eres «el de los sellos».',
    claim: 'cobrar la noche',
    clause: 'art. final: plantaste lo que viniste a plantar. la fiesta no es escape, es saldo a favor. cobra sin culpa.',
  },
};
