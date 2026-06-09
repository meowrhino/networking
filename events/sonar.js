/* ============================================================
   el pequeño networker — datos · sónar+d 2026
   ============================================================ */

const EVENT_SONAR = {
  id: 'sonar-2026',
  name: 'sónar+d 2026',
  when: '18–19 juny · llotja de mar',

  // tipos de contacto (botones-contador en la pestaña "contactos")
  tipos: {
    general: { label: 'contacto general',       tone: 'fog' },
    cliente: { label: 'cliente potencial',      tone: 'ember' },
    colab:   { label: 'colaboración potencial', tone: 'garden' },
  },

  // una conversación, paso a paso (pestaña "hablar")
  pasos: [
    { n: 1, name: 'acércate',
      desc: 'ponte al lado de alguien — en la cola, viendo algo, donde sea. no hace falta hablar aún.',
      note: 'estar cerca ya cuenta. respira.',
      cta: 'ya estoy al lado' },
    { n: 2, name: 'rompe el hielo',
      desc: 'saluda y suelta una. la primera es la tuya:',
      openers: [
        'hola, soy manu y hago webs. ¿cómo te llamas? ¿qué haces por aquí?',
        '¿esto que miras es a medida o usaron algo ya hecho?',
        '¿café o cortado? (y de ahí, lo que salga)',
        'esa pregunta que has hecho ha estado buena',
      ],
      note: 'no tienes que caer bien. solo abrir.',
      cta: 'ya he saludado' },
    { n: 3, name: 'entérate de qué va', scan: true,
      desc: 'pregúntale en qué anda y qué busca. en un minuto sabes qué es:',
      openers: ['¿en qué andas ahora mismo?', '¿y qué esperas encontrar aquí?'],
      note: 'clasificarlo es solo para que TÚ sepas qué hacer luego.' },
    { n: 4, name: 'cierra',
      desc: 'dale tu tarjeta. si te interesa, suelta tu pitch; si no, despídete majo.',
      closes: [
        { id: 'pitch', label: 'tarjeta + tu pitch' },
        { id: 'bye', label: 'tarjeta + «encantado, nos vemos»' },
      ],
      note: 'las dos opciones están bien. nunca te quedas colgado.' },
  ],

  pitch:
    'hago webs a mano, a medida, para que dejes de pagar wix o squarespace ' +
    'y tengas algo acabado y con carácter. busco gente que quiera una web que se sienta suya.',

  // chuleta de venta (pestaña "frases" — cada línea es un botón que cuenta)
  servilleta: {
    title: 'el cálculo de la servilleta',
    hint: 'tu mejor argumento es el número, no el discurso.',
    steps: [
      'suma con la otra persona lo que paga AL AÑO por su web',
      'ponlo al lado de tu pago único: «600 €, una vez, sin mensualidades»',
      '«en dos años ya pagaste tres webs mías»',
    ],
  },

  // los 5 sellos reales (pestaña "tarjetas" → estampados en piel)
  sellos: [
    { id: 'web',    text: '¿quieres una web?' },
    { id: 'studio', text: 'meowrhino.studio' },
    { id: 'nubeL',  text: '☁ nube grande' },
    { id: 'nubeM',  text: '☁ nube mediana' },
    { id: 'nubeS',  text: '☁ nube pequeña' },
  ],
};
