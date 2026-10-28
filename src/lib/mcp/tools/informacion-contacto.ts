import { defineTool } from "@lovable.dev/mcp-js";

import { CONTACT, TEAM, VALORES } from "../content";

export default defineTool({
  name: "informacion_de_contacto",
  title: "Contacto y equipo de AJ Consultoría",
  description:
    "Devuelve la información pública de contacto de AJ Consultoría: WhatsApp, correos y redes sociales de Ale Valencia y Joel Rodríguez, el enlace para agendar la plática de detección de necesidades y los valores de la consultoría.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const texto = [
      `Sitio: ${CONTACT.sitio}`,
      `WhatsApp AJ: ${CONTACT.whatsappAJ}`,
      `Agendar plática: ${CONTACT.calendario}`,
      "",
      ...TEAM.map((p) =>
        [
          `${p.nombre} — ${p.rol}`,
          `WhatsApp: ${p.whatsapp}`,
          `Correo: ${p.correo}`,
          `Instagram: ${p.instagram}`,
          `TikTok: ${p.tiktok}`,
          `Facebook: ${p.facebook}`,
        ].join("\n"),
      ),
      "",
      "Valores:",
      ...VALORES.map((v) => `- ${v.valor}: ${v.detalle}`),
    ].join("\n");

    return {
      content: [{ type: "text" as const, text: texto }],
      structuredContent: { contacto: CONTACT, equipo: TEAM, valores: VALORES },
    };
  },
});
