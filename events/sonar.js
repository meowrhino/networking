/* ============================================================
   el pequeño networker — datos · sónar+d 2026
   ============================================================ */

const EVENT_SONAR = {
  id: 'sonar-2026',
  name: 'sónar+d 2026',
  when: '18–20 juny · llotja de mar',

  // días del evento (cada uno guarda sus propios datos). editable para futuros eventos.
  days: [
    { id: '2026-06-18', label: 'jue 18' },
    { id: '2026-06-19', label: 'vie 19' },
    { id: '2026-06-20', label: 'sáb 20' },
  ],
  // a qué hora "cambia el día": antes de esta hora (incl. madrugada) cuenta como el día anterior
  dayCutoffHour: 10,

  // lo que se ve en el modal al tocar el título (2–3 líneas de misión)
  mission: [
    '18–20 juny · llotja de mar.',
    'hoy toca hablar con gente. cada conversación cuenta; no hace falta que salga bien.',
    'el objetivo: una conexión que de verdad merezca la pena.',
  ],

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
        '¿quieres una web?',
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
    'hago webs desde cero contigo, para que no pagues cuotas ni a wix ni a squarespace ni a nadie. ' +
    'te enseño cómo funciona el código para que la mantengas tú si quieres; ' +
    'y si no, tengo una tarifa estándar para cuando quieras actualizarla.',

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
};
