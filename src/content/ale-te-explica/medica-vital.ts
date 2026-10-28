// Contenido de la Guía 01 — "Médica Vital explicado fácil"
// Proyecto educativo: ALE TE EXPLICA.
// Sólo contenido: sin diseño ni JSX, para poder editar textos sin tocar el diseño.

export const GUIA_MV = {
  slug: "medica-vital",
  numero: "Guía 01",
  proyecto: "Ale te explica",
  titulo: "Bienvenido a Médica Vital",
  subtitulo: "La guía que me hubiera gustado tener antes de contratar un seguro.",
  intro:
    "Aquí encontrarás, de forma sencilla y sin palabras complicadas, todo lo que necesitas saber para decidir si Médica Vital realmente es para ti y tu familia.",
} as const;

/* Sección 2 — ¿Qué es Médica Vital? -------------------------------- */

export type Pilar = { icono: "stethoscope" | "hospital" | "ambulance"; titulo: string; texto: string };

export const PILARES: Pilar[] = [
  {
    icono: "stethoscope",
    titulo: "Consultas médicas",
    texto:
      "Cuando algo te preocupa —una gripa que no cede, un dolor raro, un control— puedes ir al médico sin pensar primero en el costo.",
  },
  {
    icono: "hospital",
    titulo: "Hospitalización",
    texto:
      "Si necesitas quedarte internado, el seguro se encarga de los gastos del hospital, el equipo médico y tu recuperación.",
  },
  {
    icono: "ambulance",
    titulo: "Urgencias",
    texto:
      "Un accidente o una emergencia no avisa. En ese momento lo importante es que te atiendan, no cuánto va a costar.",
  },
];

export const NOVEDAD = "Hasta 40 consultas médicas al año por asegurado.";

/* Sección 3 — ¿Para quién sí / probablemente no? ------------------- */

export const PARA_QUIEN_SI: string[] = [
  "Familias",
  "Personas independientes",
  "Emprendedores",
  "Personas que desean atención médica desde enfermedades comunes hasta cirugías.",
];

export const PARA_QUIEN_NO: string[] = [
  "Personas que ya necesitan una cirugía inmediata.",
  "Personas que desean cubrir enfermedades ya diagnosticadas que no sean aceptadas conforme a las condiciones del plan.",
  "Personas que no desean atenderse dentro de la red médica.",
];

/* Sección 4 — ¿Cómo funciona? -------------------------------------- */

export const RUTA_PASOS: { titulo: string; texto: string }[] = [
  { titulo: "Especialistas", texto: "Si hace falta, te canalizan con quien sabe de tu caso." },
  { titulo: "Estudios", texto: "Laboratorios y estudios para saber qué está pasando." },
  { titulo: "Medicamentos", texto: "El tratamiento que el médico te indique." },
  { titulo: "Hospitalización", texto: "Si necesitas quedarte, ya está cubierto." },
  { titulo: "Cirugía", texto: "Quirófano, equipo médico y materiales." },
  { titulo: "Recuperación", texto: "El seguimiento hasta que estés bien otra vez." },
];

/* Sección 5 — ¿Qué sí cubre? --------------------------------------- */

export type Cobertura = {
  titulo: string;
  icono:
    | "stethoscope"
    | "pill"
    | "flask"
    | "scan"
    | "userRound"
    | "ambulance"
    | "hospital"
    | "scissors"
    | "baby"
    | "ribbon"
    | "heart";
};

export const COBERTURAS: Cobertura[] = [
  { titulo: "Consultas", icono: "stethoscope" },
  { titulo: "Medicamentos", icono: "pill" },
  { titulo: "Laboratorios", icono: "flask" },
  { titulo: "Rayos X", icono: "scan" },
  { titulo: "Especialistas", icono: "userRound" },
  { titulo: "Urgencias", icono: "ambulance" },
  { titulo: "Hospital", icono: "hospital" },
  { titulo: "Cirugías", icono: "scissors" },
  { titulo: "Maternidad", icono: "baby" },
  { titulo: "Tratamiento contra cáncer", icono: "ribbon" },
  { titulo: "Trasplantes", icono: "heart" },
];

/* Sección 6 — Antes de contratar ----------------------------------- */

export const ANTES_DE_CONTRATAR: { emoji: string; titulo: string; texto: string }[] = [
  {
    emoji: "🚫",
    titulo: "Enfermedades preexistentes",
    texto:
      "Todo lo que ya existía antes de tu póliza (aunque no lo supieras) se revisa aparte. Un seguro protege lo que viene, no lo que ya venía en camino. Por eso conviene contratar cuando estás bien.",
  },
  {
    emoji: "⏳",
    titulo: "Periodos de espera",
    texto:
      "Algunos padecimientos tienen un tiempo de espera antes de poder usarse. No es un castigo: es la forma de que el plan siga siendo justo para todos. Te explico cuáles son antes de firmar.",
  },
  {
    emoji: "🏥",
    titulo: "Atención dentro de la red médica",
    texto:
      "El plan funciona mejor —y te cuesta menos— cuando te atiendes con hospitales y médicos de la red. Vale la pena revisar juntos que los de tu ciudad te acomoden.",
  },
  {
    emoji: "⚠",
    titulo: "Exclusiones importantes",
    texto:
      "Ningún seguro cubre absolutamente todo. Hay cosas que quedan fuera y es mejor saberlo hoy, con calma, que el día que necesitas usarlo.",
  },
  {
    emoji: "🏄",
    titulo: "Deportes y profesiones de alto riesgo",
    texto:
      "Si haces deportes extremos o tu trabajo implica riesgos, hay que declararlo. Así evitamos sorpresas y buscamos la mejor forma de protegerte.",
  },
];

export const NOTA_INFORMATIVA =
  "La mayoría de los problemas con un seguro no ocurren porque no pague. Ocurren porque nadie explicó antes cómo funciona.";

/* Sección 7 — Videos "Ale te explica" ------------------------------ */

export type VideoGuia = { titulo: string; duracion: string; embedUrl: string };

export const VIDEOS: VideoGuia[] = [
  { titulo: "¿Cómo funcionan los periodos de espera?", duracion: "Próximamente", embedUrl: "" },
  { titulo: "¿Qué pasa si tengo un accidente?", duracion: "Próximamente", embedUrl: "" },
  { titulo: "¿Qué hago si necesito una cirugía?", duracion: "Próximamente", embedUrl: "" },
  { titulo: "¿Cómo usar correctamente Médica Vital?", duracion: "Próximamente", embedUrl: "" },
];

/* Sección 8 — Preguntas frecuentes --------------------------------- */

export const FAQ: { pregunta: string; respuesta: string }[] = [
  {
    pregunta: "¿Tiene deducible?",
    respuesta:
      "Sí. El deducible es la parte inicial que te toca a ti antes de que el seguro empiece a pagar en un evento grande. Las consultas funcionan aparte, con un pago pequeño por visita.",
  },
  {
    pregunta: "¿Cuántas consultas incluye?",
    respuesta: "Hasta 40 consultas médicas al año por asegurado.",
  },
  {
    pregunta: "¿Cómo funcionan las consultas?",
    respuesta:
      "Agendas con un médico de la red, cubres una cuota pequeña y listo. Si el médico te pide estudios o te manda con un especialista, el plan te sigue acompañando.",
  },
  {
    pregunta: "¿Qué hospitales puedo usar?",
    respuesta:
      "Los que están dentro de la red médica del plan. Antes de contratar revisamos juntos los de tu ciudad para que la decisión te haga sentido.",
  },
  {
    pregunta: "¿Puedo atenderme con mi médico?",
    respuesta:
      "Si tu médico está en la red, sí. Si no está, podemos ver alternativas: es justo el tipo de detalle que conviene aclarar antes y no después.",
  },
  {
    pregunta: "¿Qué pasa si viajo?",
    respuesta:
      "Las urgencias fuera de tu ciudad tienen atención según las condiciones del plan. Si viajas seguido, te explico exactamente qué esperar.",
  },
  {
    pregunta: "¿Qué no cubre?",
    respuesta:
      "Enfermedades preexistentes no aceptadas, lo que ocurre dentro de los periodos de espera y las exclusiones del contrato. Te las explico una por una antes de firmar.",
  },
];

/* Sección 9 — Sobre Ale -------------------------------------------- */

export const SOBRE_ALE = {
  titulo: "Hola, soy Ale.",
  parrafos: [
    "Antes de ser agente de seguros, soy mamá, esposa y también tuve que tomar la decisión de cómo proteger a mi familia.",
    "Por eso existe esta guía.",
    "No para convencerte de contratar un seguro.",
    "Sino para ayudarte a entender si realmente es la mejor opción para ti.",
  ],
} as const;

/* Guías futuras ---------------------------------------------------- */

export const GUIAS_FUTURAS: string[] = [
  "Gastos Médicos Mayores explicado fácil",
  "Seguro de Vida explicado fácil",
  "¿Qué hacer cuando te hospitalizan?",
  "Cómo evitar un rechazo en un siniestro",
  "Guía para usar correctamente tu seguro",
];
