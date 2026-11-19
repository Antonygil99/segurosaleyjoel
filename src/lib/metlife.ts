import { z } from "zod";

export const PLANES = {
  1: { nombre: "TempoLife", plazos: { MXN: [1, 5, 10], USD: [1, 5, 10, 15, 20, 65] } },
  6: { nombre: "TempoLife Grandes Sumas", plazos: { MXN: [10, 20], USD: [10, 20] } },
  8: { nombre: "TempoLife Preferente", plazos: { MXN: [10, 20], USD: [10, 20] } },
} as const;

export const PAGOS = {
  anual: { etiqueta: "Anual", id: 1, pagos: 1 },
  semestral: { etiqueta: "Semestral", id: 2, pagos: 2 },
  trimestral: { etiqueta: "Trimestral", id: 3, pagos: 4 },
  mensual: { etiqueta: "Mensual", id: 4, pagos: 12 },
} as const;

export const solicitudSchema = z.object({
  plan: z.union([z.literal(1), z.literal(6), z.literal(8)]),
  moneda: z.enum(["MXN", "USD"]),
  plazo: z.number().int().positive(),
  edad: z.number().int().min(15).max(70),
  sexo: z.enum(["M", "F"]),
  fuma: z.enum(["S", "N"]),
  suma: z.number().int().min(1).max(2147483647),
  frecuencia: z.enum(["anual", "semestral", "trimestral", "mensual"]),
});

export type SolicitudMetLife = z.infer<typeof solicitudSchema>;

export function plazosDe(solicitud: Pick<SolicitudMetLife, "plan" | "moneda">): readonly number[] {
  return PLANES[solicitud.plan].plazos[solicitud.moneda];
}

export function etiquetaPlazo(plazo: number) {
  if (plazo === 65) return "Hasta los 65 años";
  return plazo === 1 ? "1 año" : `${plazo} años`;
}
