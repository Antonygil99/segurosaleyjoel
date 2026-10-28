// Contenido del Centro AJ — organizado por ramos (tipos de seguro).
//
// Este archivo es SÓLO contenido: no lleva diseño ni JSX. Puedes editar textos,
// agregar series o videos, y activar ramos sin tocar el diseño del sitio.
//
// Todo lo marcado con [PENDIENTE] es un marcador de posición: reemplázalo por
// tus textos definitivos cuando los tengas listos.

/* ------------------------------------------------------------------ */
/* RAMOS (categorías principales del Centro AJ)                        */
/* ------------------------------------------------------------------ */

export type RamoId = "gastos-medicos" | "autos" | "vida" | "danos" | "empresas";

export type Ramo = {
  id: RamoId;
  nombre: string;
  descripcion: string;
  icono: "stethoscope" | "car" | "heart" | "shield" | "building";
  activo: boolean;
  /** Ruta propia del ramo (sólo cuando está activo). */
  ruta?: "/centro-aj/gastos-medicos";
};

export const RAMOS: Ramo[] = [
  {
    id: "gastos-medicos",
    nombre: "Gastos Médicos",
    descripcion:
      "Ruta de aprendizaje en video para entender tu protección médica antes de contratar.",
    icono: "stethoscope",
    activo: true,
    ruta: "/centro-aj/gastos-medicos",
  },
  {
    id: "autos",
    nombre: "Autos",
    descripcion: "[PENDIENTE] Descripción breve del ramo de autos.",
    icono: "car",
    activo: false,
  },
  {
    id: "vida",
    nombre: "Vida",
    descripcion: "[PENDIENTE] Descripción breve del ramo de vida.",
    icono: "heart",
    activo: false,
  },
  {
    id: "danos",
    nombre: "Daños",
    descripcion: "[PENDIENTE] Descripción breve del ramo de daños.",
    icono: "shield",
    activo: false,
  },
  {
    id: "empresas",
    nombre: "Empresas",
    descripcion: "[PENDIENTE] Descripción breve del ramo empresarial.",
    icono: "building",
    activo: false,
  },
];

/* ------------------------------------------------------------------ */
/* RUTA DE APRENDIZAJE: GASTOS MÉDICOS                                 */
/* ------------------------------------------------------------------ */

export type Video = {
  slug: string;
  titulo: string;
  /** URL para incrustar (embed). Déjala vacía mientras no exista el video. */
  embedUrl: string;
  duracion?: string;
  resumen: string;
  ideaPrincipal: string;
};

export type Serie = {
  slug: string;
  /** Etiqueta corta: "Empieza aquí", "Serie 0", "Serie 1"… */
  etiqueta: string;
  titulo: string;
  descripcion: string;
  videos: Video[];
};

function videoPendiente(serie: string, n: number): Video {
  return {
    slug: `${serie}-video-${n}`,
    titulo: `[PENDIENTE] Título del video ${n}`,
    embedUrl: "",
    duracion: "",
    resumen: "[PENDIENTE] Resumen breve del video (2 o 3 líneas).",
    ideaPrincipal: "[PENDIENTE] La idea principal que la persona debe llevarse.",
  };
}

export const GM_SERIES: Serie[] = [
  {
    slug: "empieza-aqui",
    etiqueta: "Empieza aquí",
    titulo: "[PENDIENTE] Título de la bienvenida",
    descripcion:
      "[PENDIENTE] Explicación breve de cómo recorrer esta ruta de aprendizaje.",
    videos: [videoPendiente("empieza-aqui", 1)],
  },
  {
    slug: "serie-0",
    etiqueta: "Serie 0",
    titulo: "[PENDIENTE] Título de la Serie 0",
    descripcion: "[PENDIENTE] De qué trata esta serie.",
    videos: [videoPendiente("serie-0", 1), videoPendiente("serie-0", 2)],
  },
  {
    slug: "serie-1",
    etiqueta: "Serie 1",
    titulo: "[PENDIENTE] Título de la Serie 1",
    descripcion: "[PENDIENTE] De qué trata esta serie.",
    videos: [videoPendiente("serie-1", 1), videoPendiente("serie-1", 2)],
  },
  {
    slug: "serie-2",
    etiqueta: "Serie 2",
    titulo: "[PENDIENTE] Título de la Serie 2",
    descripcion: "[PENDIENTE] De qué trata esta serie.",
    videos: [videoPendiente("serie-2", 1)],
  },
  {
    slug: "serie-3",
    etiqueta: "Serie 3",
    titulo: "[PENDIENTE] Título de la Serie 3",
    descripcion: "[PENDIENTE] De qué trata esta serie.",
    videos: [videoPendiente("serie-3", 1)],
  },
  {
    slug: "serie-4",
    etiqueta: "Serie 4",
    titulo: "[PENDIENTE] Título de la Serie 4",
    descripcion: "[PENDIENTE] De qué trata esta serie.",
    videos: [videoPendiente("serie-4", 1)],
  },
  {
    slug: "serie-5",
    etiqueta: "Serie 5",
    titulo: "[PENDIENTE] Título de la Serie 5",
    descripcion: "[PENDIENTE] De qué trata esta serie.",
    videos: [videoPendiente("serie-5", 1)],
  },
];

/* Secciones de apoyo de la ruta de Gastos Médicos ------------------- */

export type SeccionBloque =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "lista"; items: string[] }
  | { tipo: "faq"; items: { pregunta: string; respuesta: string }[] }
  | { tipo: "terminos"; items: { termino: string; definicion: string }[] };

export type SeccionApoyo = {
  slug: string;
  titulo: string;
  resumen: string;
  icono: "help" | "users" | "file" | "list";
  bloques: SeccionBloque[];
};

export const GM_SECCIONES: SeccionApoyo[] = [
  {
    slug: "preguntas-frecuentes",
    titulo: "Preguntas frecuentes",
    resumen: "[PENDIENTE] Las dudas que más nos preguntan sobre gastos médicos.",
    icono: "help",
    bloques: [
      {
        tipo: "faq",
        items: [
          {
            pregunta: "[PENDIENTE] Pregunta frecuente 1",
            respuesta: "[PENDIENTE] Respuesta clara y breve.",
          },
          {
            pregunta: "[PENDIENTE] Pregunta frecuente 2",
            respuesta: "[PENDIENTE] Respuesta clara y breve.",
          },
          {
            pregunta: "[PENDIENTE] Pregunta frecuente 3",
            respuesta: "[PENDIENTE] Respuesta clara y breve.",
          },
        ],
      },
    ],
  },
  {
    slug: "casos-reales",
    titulo: "Casos reales",
    resumen: "[PENDIENTE] Situaciones reales, contadas con respeto y sin datos personales.",
    icono: "users",
    bloques: [
      { tipo: "parrafo", texto: "[PENDIENTE] Introducción a los casos reales." },
      {
        tipo: "lista",
        items: [
          "[PENDIENTE] Caso 1: qué pasó, qué se hizo y qué se aprendió.",
          "[PENDIENTE] Caso 2: qué pasó, qué se hizo y qué se aprendió.",
        ],
      },
    ],
  },
  {
    slug: "como-usar-tu-seguro",
    titulo: "Cómo usar tu seguro",
    resumen: "[PENDIENTE] Los pasos a seguir el día que necesitas usar tu póliza.",
    icono: "file",
    bloques: [
      { tipo: "parrafo", texto: "[PENDIENTE] Introducción al uso de la póliza." },
      {
        tipo: "lista",
        items: [
          "[PENDIENTE] Paso 1",
          "[PENDIENTE] Paso 2",
          "[PENDIENTE] Paso 3",
        ],
      },
    ],
  },
  {
    slug: "glosario-gastos-medicos",
    titulo: "Glosario de Gastos Médicos",
    resumen: "[PENDIENTE] Las palabras de una póliza médica, en lenguaje cotidiano.",
    icono: "list",
    bloques: [
      {
        tipo: "terminos",
        items: [
          { termino: "[PENDIENTE] Término 1", definicion: "[PENDIENTE] Definición simple." },
          { termino: "[PENDIENTE] Término 2", definicion: "[PENDIENTE] Definición simple." },
          { termino: "[PENDIENTE] Término 3", definicion: "[PENDIENTE] Definición simple." },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* SECCIÓN TRANSVERSAL: FUNDAMENTOS / GLOSARIO AJ                      */
/* (aparece DESPUÉS de los ramos, no los sustituye)                    */
/* ------------------------------------------------------------------ */

export const GLOSARIO_AJ: SeccionApoyo = {
  slug: "glosario",
  titulo: "Glosario AJ",
  resumen:
    "[PENDIENTE] Las palabras que aparecen en cualquier seguro, explicadas en simple.",
  icono: "list",
  bloques: [
    { tipo: "parrafo", texto: "[PENDIENTE] Introducción al glosario transversal." },
    {
      tipo: "terminos",
      items: [
        { termino: "[PENDIENTE] Término 1", definicion: "[PENDIENTE] Definición simple." },
        { termino: "[PENDIENTE] Término 2", definicion: "[PENDIENTE] Definición simple." },
        { termino: "[PENDIENTE] Término 3", definicion: "[PENDIENTE] Definición simple." },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

/** Todos los videos de Gastos Médicos, en orden de ruta. */
export const GM_VIDEOS_ORDENADOS: { serie: Serie; video: Video }[] = GM_SERIES.flatMap(
  (serie) => serie.videos.map((video) => ({ serie, video })),
);

export function getGmVideo(slug: string) {
  const index = GM_VIDEOS_ORDENADOS.findIndex((v) => v.video.slug === slug);
  if (index === -1) return undefined;
  const actual = GM_VIDEOS_ORDENADOS[index]!;
  return {
    ...actual,
    siguiente: GM_VIDEOS_ORDENADOS[index + 1]?.video,
    anterior: GM_VIDEOS_ORDENADOS[index - 1]?.video,
    posicion: index + 1,
    total: GM_VIDEOS_ORDENADOS.length,
  };
}

export function getGmSeccion(slug: string) {
  return GM_SECCIONES.find((s) => s.slug === slug);
}
