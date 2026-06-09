/* ============================================================
   el pequeño networker — datos · sónar+d 2026
   en cristiano: una herramienta para recordarte que hagas
   networking y tirar p'alante. nada de jerga rara.
   ============================================================ */

const EVENT_SONAR = {
  id: 'sonar-2026',
  name: 'sónar+d 2026',
  when: '18–19 juny · llotja de mar',

  // los dos números que importan, para TODO el finde (no por día)
  goals: { buenos: 3, convos: 8 },

  // a quién has conocido (antes "facciones") — clasificas para saber TÚ qué hacer
  tipos: {
    colab: {
      label: 'colaborador', sub: 'alguien con quien harías algo', tone: 'garden',
      levels: ['—', 'buen rollo', 'deberíamos hacer algo', 'te escribo esta semana, en serio'],
    },
    cliente: {
      label: 'cliente potencial', sub: 'tiene una web cara de wix/squarespace', tone: 'ember',
      levels: ['—', 'tiene una web que sufre', '¿y eso cuánto cuesta?', 'mándame un presupuesto'],
    },
    nope: {
      label: 'no me interesa', sub: 'majo, pero no es para ti', tone: 'fog',
      levels: ['—', 'saludado', 'unos cuantos', 'y seguiste, bien hecho'],
    },
  },

  // una conversación, paso a paso (lo más difícil, troceado)
  pasos: [
    {
      n: 1, name: 'acércate',
      desc: 'ponte al lado de alguien — en la cola, viendo algo, donde sea. no hace falta hablar aún.',
      note: 'estar cerca ya cuenta. respira.',
      cta: 'ya estoy al lado',
    },
    {
      n: 2, name: 'rompe el hielo',
      desc: 'saluda y suelta una. la primera es la tuya:',
      openers: [
        'hola, soy manu y hago webs. ¿cómo te llamas? ¿qué haces por aquí?',
        '¿esto que miras es a medida o usaron algo ya hecho?',
        '¿café o cortado? (y de ahí, lo que salga)',
        'esa pregunta que has hecho ha estado buena',
      ],
      note: 'no tienes que caer bien. solo abrir.',
      cta: 'ya he saludado',
    },
    {
      n: 3, name: 'entérate de qué va', scan: true,
      desc: 'pregúntale en qué anda y qué busca. en un minuto sabes qué es:',
      openers: ['¿en qué andas ahora mismo?', '¿y qué esperas encontrar aquí?'],
      note: 'clasificarlo es solo para que TÚ sepas qué hacer luego.',
    },
    {
      n: 4, name: 'cierra',
      desc: 'dale tu tarjeta. si te interesa, suelta tu pitch; si no, despídete majo.',
      closes: [
        { id: 'pitch', label: 'tarjeta + tu pitch' },
        { id: 'bye', label: 'tarjeta + «encantado, nos vemos»' },
      ],
      note: 'las dos opciones están bien. nunca te quedas colgado.',
    },
  ],

  pitch:
    'hago webs a mano, a medida, para que dejes de pagar wix o squarespace ' +
    'y tengas algo acabado y con carácter. busco gente que quiera una web que se sienta suya.',

  // tu mejor argumento de venta
  servilleta: {
    title: 'el cálculo de la servilleta',
    hint: 'tu mejor argumento es el número, no el discurso.',
    steps: [
      'suma con la otra persona lo que paga AL AÑO por su web (wix, squarespace, dominio…)',
      'ponlo al lado de tu pago único: «600 €, una vez, sin mensualidades»',
      'deja que el número hable: «en dos años ya pagaste tres webs mías»',
    ],
  },

  // tus 3 sellos reales
  sellos: [
    { id: 'gancho',   text: '¿quieres una web?', rol: 'para empezar la conversación' },
    { id: 'contacto', text: 'meowrhino.studio',  rol: 'para que te encuentren luego' },
    { id: 'nube',     text: '☁',                 rol: 'tu marca / decoración' },
  ],
  fame: ['—', 'el de los sellos', 'el de los sellos, ven que te presento a alguien'],

  // la recompensa
  loot: {
    locked: 'salir de fiesta, sin culpa',
    hint: 'se desbloquea con tu primer buen contacto. ya cumpliste; disfruta.',
    claim: 'me lo he ganado',
  },
};
