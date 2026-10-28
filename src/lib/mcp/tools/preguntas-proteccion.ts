import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { PREGUNTAS } from "../content";

export default defineTool({
  name: "preguntas_de_proteccion",
  title: "Preguntas para pensar tu protección",
  description:
    "Devuelve las preguntas reflexivas de AJ Consultoría para ayudar a una persona a mirar su situación y pensar qué quiere proteger, con la reflexión que acompaña a cada pregunta.",
  inputSchema: {
    tema: z
      .string()
      .optional()
      .describe("Palabra clave opcional para filtrar preguntas (por ejemplo: salud, auto, retiro, negocio)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ tema }) => {
    const needle = tema?.trim().toLowerCase();
    const items = needle
      ? PREGUNTAS.filter(
          (p) =>
            p.pregunta.toLowerCase().includes(needle) ||
            p.reflexion.toLowerCase().includes(needle),
        )
      : [...PREGUNTAS];

    return {
      content: [
        {
          type: "text" as const,
          text: items.length
            ? items.map((p) => `${p.pregunta}\n${p.reflexion}`).join("\n\n")
            : "No hay preguntas que coincidan con ese tema.",
        },
      ],
      structuredContent: { preguntas: items },
    };
  },
});
