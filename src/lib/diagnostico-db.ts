import { enviarDiagnosticoCRM } from "./diagnostico-crm";

import type { Nivel, Respuestas } from "@/content/diagnostico";

export type Utm = Record<string, string>;

/** Lee parámetros de origen (utm_*, ref, fbclid, gclid) de la URL actual. */
export function leerUtm(): Utm {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Utm = {};
  params.forEach((valor, clave) => {
    if (/^(utm_|ref$|fbclid$|gclid$)/i.test(clave)) utm[clave] = valor;
  });
  if (document.referrer) utm["referrer"] = document.referrer;
  return utm;
}

export function nuevaSesion(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now());
}

/** Medición: abre, inicia, abandona (con pregunta), termina, clic_whatsapp. */
export async function registrarEvento(input: {
  sesion: string;
  evento: string;
  pregunta?: string | null;
  nivel?: Nivel | null;
  utm?: Utm;
}) {
  // No se envían eventos de navegación: el CRM solo recibe prospectos autorizados.
  void input;
}

export async function guardarDiagnostico(input: {
  nombre: string;
  rango_edad: string;
  ciudad_estado: string;
  proteger: string;
  whatsapp: string;
  autoriza_contacto: boolean;
  respuestas: Respuestas;
  puntaje: number;
  nivel: Nivel;
  intencion: string | null;
  utm: Utm;
}) {
  if (!input.autoriza_contacto) throw new Error('Se requiere autorización de contacto.');
  return enviarDiagnosticoCRM({ data: { ...input, autoriza_contacto: true } });
}

