import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { SEGUROS } from "../content";

export default defineTool({
  name: "listar_seguros",
  title: "Listar tipos de seguro",
  description:
    "Lista los tipos de seguro que acompaña AJ Consultoría (gastos médicos mayores, ahorro y retiro, vida, auto, empresarial) con una explicación de para qué sirve cada uno.",
  inputSchema: {
    tipo: z
      .string()
      .optional()
      .describe("Filtro opcional por nombre o parte del nombre del tipo de seguro."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ tipo }) => {
    const needle = tipo?.trim().toLowerCase();
    const items = needle
      ? SEGUROS.filter((s) => s.tipo.toLowerCase().includes(needle))
      : [...SEGUROS];

    return {
      content: [
        {
          type: "text" as const,
          text: items.length
            ? items.map((s) => `${s.tipo}: ${s.para}`).join("\n\n")
            : "No se encontró un tipo de seguro con ese nombre.",
        },
      ],
      structuredContent: { seguros: items },
    };
  },
});
