import { defineTool } from "@lovable.dev/mcp-js";

import { CONTACT } from "../content";

export default defineTool({
  name: "agendar_platica",
  title: "Agendar plática de detección de necesidades",
  description:
    "Devuelve el enlace de Google Calendar para agendar la plática de detección de necesidades con AJ Consultoría, junto con una explicación de en qué consiste. No reserva la cita: entrega el enlace para que la persona elija el horario.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: () => ({
    content: [
      {
        type: "text" as const,
        text: [
          "La plática de detección de necesidades es una conversación tranquila, sin costo y sin compromiso de contratar.",
          "Primero escuchamos tu situación, después la entendemos juntos y sólo entonces revisamos qué opciones tienen sentido para ti.",
          "",
          `Agenda tu horario aquí: ${CONTACT.calendario}`,
          `Si prefieres escribir primero: ${CONTACT.whatsappAJ}`,
        ].join("\n"),
      },
    ],
    structuredContent: {
      calendario: CONTACT.calendario,
      whatsapp: CONTACT.whatsappAJ,
    },
  }),
});
