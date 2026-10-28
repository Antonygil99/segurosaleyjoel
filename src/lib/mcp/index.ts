import { defineMcp } from "@lovable.dev/mcp-js";

import agendarPlaticaTool from "./tools/agendar-platica";
import informacionContactoTool from "./tools/informacion-contacto";
import listarSegurosTool from "./tools/listar-seguros";
import preguntasProteccionTool from "./tools/preguntas-proteccion";

export default defineMcp({
  name: "claridad-y-confianza",
  title: "Claridad y Confianza",
  version: "0.1.0",
  instructions:
    "Herramientas con el contenido público de AJ Consultoría, una consultoría de seguros en México. Usa `listar_seguros` para conocer los tipos de seguro que acompañan, `preguntas_de_proteccion` para preguntas reflexivas que ayudan a pensar qué proteger, `informacion_de_contacto` para WhatsApp, correos y redes del equipo, y `agendar_platica` para el enlace de la plática de detección de necesidades. Responde en español, con tono cálido y claro, sin lenguaje de miedo, sin prometer coberturas específicas y sin dar asesoría de contratación: invita a conversar con AJ.",
  tools: [
    listarSegurosTool,
    preguntasProteccionTool,
    informacionContactoTool,
    agendarPlaticaTool,
  ],
});
