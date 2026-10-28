// Contenido y lógica de puntuación del autodiagnóstico
// "¿Qué tan protegida está tu libertad de decidir ante una emergencia médica?"
// Los textos viven aquí, separados del diseño.

export type Opcion = {
  id: string;
  texto: string;
  /** Puntos de vulnerabilidad (0 = mejor preparado, 3 = más vulnerable). */
  puntos: number;
  /** Frase personalizada que puede aparecer en el resultado (solo si eligió esta opción). */
  frase?: string;
};

export type Pregunta = {
  id: string;
  numero: number;
  titulo: string;
  opciones: Opcion[];
  /** Pantalla de reflexión que se muestra unos segundos después de responder. */
  reflexion?: string;
  /** Si es true, la respuesta no suma puntos (solo indica intención). */
  soloIntencion?: boolean;
};

export const PREGUNTAS: Pregunta[] = [
  {
    id: "p1",
    numero: 1,
    titulo: "¿Con qué protección médica cuentas actualmente?",
    opciones: [
      {
        id: "privado",
        texto: "Tengo un seguro de gastos médicos o plan médico privado.",
        puntos: 0,
        frase: "Actualmente tienes protección privada; conviene revisar sus límites y condiciones.",
      },
      {
        id: "publico",
        texto: "Tengo IMSS, ISSSTE u otra institución pública.",
        puntos: 1,
        frase: "Ya cuentas con una institución pública, una base valiosa de protección.",
      },
      {
        id: "bolsillo",
        texto: "Pago por mi cuenta las consultas y servicios médicos que necesito.",
        puntos: 3,
        frase:
          "Ya utilizas atención médica particular, pero actualmente esos gastos salen directamente de tus recursos.",
      },
      {
        id: "ninguna",
        texto: "No cuento con ninguna protección médica.",
        puntos: 3,
        frase: "Hoy no cuentas con una protección médica que respalde un evento importante.",
      },
    ],
  },
  {
    id: "p2",
    numero: 2,
    titulo:
      "Cuando tú o alguien de tu familia necesita atención médica, ¿qué hacen normalmente?",
    opciones: [
      {
        id: "publicos",
        texto: "Utilizamos principalmente servicios públicos.",
        puntos: 1,
      },
      {
        id: "mixto",
        texto: "Combinamos servicios públicos con consultas particulares.",
        puntos: 2,
        frase:
          "Normalmente complementas la atención pública con servicios privados que pagas por tu cuenta.",
      },
      {
        id: "particulares",
        texto: "Acudimos normalmente con médicos y clínicas particulares.",
        puntos: 2,
        frase: "Tu atención habitual es privada, con los costos que eso implica.",
      },
      {
        id: "posterga",
        texto: "En ocasiones postergamos la atención o buscamos la opción más económica.",
        puntos: 3,
        frase: "A veces la decisión de atenderse depende del costo y no de la necesidad.",
      },
    ],
  },
  {
    id: "p3",
    numero: 3,
    titulo:
      "Imagina que mañana necesitas una hospitalización de $150,000. ¿Cómo la pagarías?",
    reflexion:
      "Pagar consultas particulares no siempre significa estar preparado para una hospitalización.",
    opciones: [
      {
        id: "seguro",
        texto: "Mi seguro o protección actual cubriría la mayor parte.",
        puntos: 0,
      },
      {
        id: "ahorros-libres",
        texto: "Podría pagarla con mis ahorros sin alterar proyectos importantes.",
        puntos: 1,
      },
      {
        id: "ahorros-planes",
        texto: "Podría pagarla, pero utilizaría ahorros destinados a otros planes.",
        puntos: 2,
        frase: "Una hospitalización podría afectar ahorros destinados a otros proyectos.",
      },
      {
        id: "deuda",
        texto: "Necesitaría pedir prestado, usar tarjetas, vender algo o solicitar ayuda.",
        puntos: 3,
        frase: "Una hospitalización te llevaría a endeudarte o a pedir apoyo.",
      },
      {
        id: "no-se",
        texto: "No sé cómo podría pagarla.",
        puntos: 3,
        frase: "Hoy no tienes claro cómo cubrirías una hospitalización importante.",
      },
    ],
  },
  {
    id: "p4",
    numero: 4,
    titulo:
      "Si dejaras de trabajar durante varias semanas por enfermedad o accidente, ¿qué pasaría con tus ingresos?",
    opciones: [
      { id: "iguales", texto: "Continuaría recibiendo mis ingresos normalmente.", puntos: 0 },
      { id: "bajan-poco", texto: "Disminuirían, pero podría mantener mis gastos.", puntos: 1 },
      {
        id: "bajan-mucho",
        texto: "Disminuirían considerablemente.",
        puntos: 2,
        frase: "Tus ingresos disminuirían si tuvieras que dejar de trabajar.",
      },
      {
        id: "sin-ingresos",
        texto: "Prácticamente dejaría de recibir ingresos.",
        puntos: 3,
        frase: "Si dejaras de trabajar, tus ingresos se detendrían casi por completo.",
      },
    ],
  },
  {
    id: "p5",
    numero: 5,
    titulo: "¿Quiénes dependen de ti o de tus ingresos?",
    opciones: [
      { id: "nadie", texto: "Nadie depende económicamente de mí.", puntos: 0 },
      {
        id: "pareja",
        texto: "Mi pareja o una persona.",
        puntos: 1,
        frase: "Hay una persona que depende económicamente de ti.",
      },
      {
        id: "hijos",
        texto: "Mis hijos.",
        puntos: 3,
        frase: "Tus hijos dependen económicamente de ti.",
      },
      {
        id: "hijos-familia",
        texto: "Mis hijos y otros familiares.",
        puntos: 3,
        frase: "Varias personas de tu familia dependen económicamente de ti.",
      },
    ],
  },
  {
    id: "p6",
    numero: 6,
    titulo:
      "Ante un problema de salud, ¿qué tan importante sería para ti poder elegir médico u hospital?",
    opciones: [
      {
        id: "no-indispensable",
        texto: "No es indispensable; utilizaría la institución que me corresponda.",
        puntos: 0,
      },
      { id: "alternativas", texto: "Me gustaría tener algunas alternativas.", puntos: 1 },
      {
        id: "muy-importante",
        texto: "Es muy importante para mí.",
        puntos: 2,
        frase: "Para ti es importante poder elegir médico u hospital.",
      },
      {
        id: "indispensable",
        texto: "Es indispensable cuando se trata de mi salud o la de mis hijos.",
        puntos: 3,
        frase: "Poder elegir médico y hospital es indispensable para ti y para tu familia.",
      },
    ],
  },
  {
    id: "p7",
    numero: 7,
    titulo:
      "Pensando en tus finanzas actuales, ¿qué tipo de gasto médico podrías enfrentar sin endeudarte ni sacrificar tus planes?",
    opciones: [
      {
        id: "todo",
        texto: "Podría cubrir consultas, estudios y una hospitalización importante.",
        puntos: 0,
      },
      {
        id: "consultas-estudios",
        texto: "Podría cubrir consultas y estudios, pero una hospitalización afectaría mis ahorros.",
        puntos: 2,
        frase: "Consultas y estudios los resuelves, pero una hospitalización tocaría tus ahorros.",
      },
      {
        id: "solo-consultas",
        texto: "Podría resolver consultas, pero necesitaría apoyo para estudios o tratamientos.",
        puntos: 3,
        frase: "Un estudio o tratamiento mayor requeriría apoyo externo.",
      },
      {
        id: "moderado",
        texto: "Incluso un gasto médico moderado desestabilizaría mi economía.",
        puntos: 3,
        frase: "Hoy, incluso un gasto médico moderado desacomodaría tu economía.",
      },
      { id: "no-claro", texto: "No lo tengo claro.", puntos: 2 },
    ],
  },
  {
    id: "p8",
    numero: 8,
    titulo: "¿Alguna vez has postergado una consulta, estudio o tratamiento por su costo?",
    opciones: [
      { id: "no", texto: "No.", puntos: 0 },
      { id: "una", texto: "Sí, una vez.", puntos: 1 },
      {
        id: "varias",
        texto: "Sí, en varias ocasiones.",
        puntos: 2,
        frase: "En varias ocasiones el costo te ha hecho postergar atención médica.",
      },
      {
        id: "ahora",
        texto: "Actualmente estoy postergando alguno.",
        puntos: 3,
        frase: "Hoy mismo hay atención médica que estás postergando por su costo.",
      },
    ],
  },
  {
    id: "p9",
    numero: 9,
    soloIntencion: true,
    titulo:
      "Si descubrieras que tu protección actual tiene un hueco importante, ¿qué te gustaría hacer?",
    opciones: [
      { id: "pronto", texto: "Quiero conocer opciones cuanto antes.", puntos: 0 },
      { id: "costo", texto: "Quiero saber cuánto podría costarme protegerme.", puntos: 0 },
      { id: "con-calma", texto: "Quiero recibir información y revisarla con calma.", puntos: 0 },
      { id: "solo-saber", texto: "Sólo quería conocer mi nivel de vulnerabilidad.", puntos: 0 },
    ],
  },
];

export type Nivel = "verde" | "amarillo" | "rojo";

export const RESULTADOS: Record<
  Nivel,
  { titulo: string; texto: string; boton: string; etiqueta: string }
> = {
  verde: {
    etiqueta: "Protección sólida",
    titulo: "🟢 Tu protección actual parece sólida",
    texto:
      "Cuentas con alternativas que podrían ayudarte a enfrentar un gasto médico sin comprometer gravemente tus finanzas. Aun así, es importante conocer los límites y condiciones de tu protección actual para asegurarte de que responda como esperas.",
    boton: "Quiero revisar si existen huecos",
  },
  amarillo: {
    etiqueta: "Protección limitada",
    titulo: "🟡 Tu protección es limitada",
    texto:
      "Puedes resolver consultas y algunos gastos médicos, pero una hospitalización, cirugía o tratamiento prolongado podría afectar tus ahorros, tus proyectos o tu capacidad para elegir cómo atenderte.",
    boton: "Quiero conocer mis alternativas",
  },
  rojo: {
    etiqueta: "Alta vulnerabilidad médica y financiera",
    titulo: "🔴 Tienes una alta vulnerabilidad médica y financiera",
    texto:
      "Hoy, un evento médico importante podría obligarte a endeudarte, utilizar ahorros destinados a otros planes, solicitar ayuda o limitar tus opciones de atención. Conviene revisar cuanto antes qué alternativas puedes contratar mientras tu estado de salud te lo permita.",
    boton: "Quiero revisar mi caso con Ale",
  },
};

export const AVISO_LEGAL =
  "Este resultado es únicamente orientativo y se basa en las respuestas proporcionadas. No constituye diagnóstico médico, asesoría financiera, cotización ni garantía de aceptación. La contratación y las coberturas están sujetas a evaluación, condiciones generales y políticas de cada compañía.";

export const RANGOS_EDAD = [
  "Menor de 25",
  "25–34",
  "35–44",
  "45–54",
  "55–64",
  "65 o más",
];

export const A_QUIEN_PROTEGER = [
  "Sólo a mí",
  "Mi pareja",
  "Mis hijos",
  "Mi familia completa",
  "Otra persona",
];

export const SEGUIMIENTOS = [
  "nuevo",
  "contactado",
  "cita",
  "cotización",
  "contratado",
  "sin seguimiento",
] as const;

export type Respuestas = Record<string, string>;

export type Resultado = {
  puntaje: number;
  nivel: Nivel;
  razones: string[];
};

function opcionDe(preguntaId: string, opcionId: string | undefined) {
  const pregunta = PREGUNTAS.find((p) => p.id === preguntaId);
  return pregunta?.opciones.find((o) => o.id === opcionId);
}

/**
 * Puntaje 0–24 (P1 a P8) + ajuste por expectativa privada con institución pública.
 * Rangos: 0–7 verde · 8–14 amarillo · 15–24+ rojo.
 * Reglas críticas aplicadas después del puntaje.
 */
export function calcularResultado(respuestas: Respuestas): Resultado {
  let puntaje = 0;
  const razones: string[] = [];

  for (const pregunta of PREGUNTAS) {
    if (pregunta.soloIntencion) continue;
    const opcion = opcionDe(pregunta.id, respuestas[pregunta.id]);
    if (!opcion) continue;
    puntaje += opcion.puntos;
    if (opcion.frase) razones.push(opcion.frase);
  }

  const p1 = respuestas["p1"];
  const p2 = respuestas["p2"];
  const p3 = respuestas["p3"];
  const p6 = respuestas["p6"];

  // Regla 3: institución pública + expectativa o uso de atención privada.
  if (p1 === "publico" && (p2 === "mixto" || p2 === "particulares" || p6 === "indispensable")) {
    puntaje += 1;
  }

  let nivel: Nivel = puntaje <= 7 ? "verde" : puntaje <= 14 ? "amarillo" : "rojo";

  // Regla 1: sin protección alguna y sin manera clara de pagar una hospitalización.
  if (p1 === "ninguna" && (p3 === "deuda" || p3 === "no-se")) {
    nivel = "rojo";
  }

  // Regla 2: uso habitual de medicina privada sin seguro privado y hospitalización que pesa.
  if (
    p2 === "particulares" &&
    p1 !== "privado" &&
    (p3 === "ahorros-planes" || p3 === "deuda" || p3 === "no-se") &&
    nivel === "verde"
  ) {
    nivel = "amarillo";
  }

  // Regla 4: tener seguro privado nunca garantiza verde; siempre recordar la revisión.
  if (p1 === "privado") {
    razones.push(
      "Conviene revisar vigencia, suma asegurada, deducible, coaseguro, red médica y exclusiones de tu protección actual.",
    );
  }

  return { puntaje, nivel, razones: razones.slice(0, 3) };
}

export function intencionDe(respuestas: Respuestas): string | null {
  const opcion = opcionDe("p9", respuestas["p9"]);
  return opcion ? opcion.texto : null;
}
