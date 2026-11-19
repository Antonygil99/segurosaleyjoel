import { z } from "zod";

export const COBERTURAS_MET4U = {
  BAS: "Fallecimiento",
  INV: "Invalidez total y permanente",
  CAN: "Cáncer",
  DIA: "Diabetes",
  GRA: "Enfermedades graves",
} as const;

export const SUMA_MINIMA_MET4U = { 10: 250000, 99: 200000 } as const;

const importe = z.number().int().min(1).max(2147483647);

export const solicitudMet4U = z.object({
  plazo: z.union([z.literal(10), z.literal(99)]),
  edad: z.number().int().min(18).max(50),
  sexo: z.enum(["M", "F"]),
  fuma: z.enum(["S", "N"]),
  frecuencia: z.enum(["anual", "semestral", "trimestral", "mensual"]),
  suma: importe,
  invalidez: z.number().int().min(1).max(999).optional(),
  adicionales: z.object({
    CAN: importe.optional(),
    DIA: importe.optional(),
    GRA: importe.optional(),
  }),
  ahorroAnual: importe.optional(),
  proyeccion: z.boolean().optional(),
});

export type FilaMet4U = {
  anio: number;
  mes: number;
  edad: number;
  aportacion: number;
  fondoBasico: number;
  fondoBasicoRemanente: number;
  fondoAdicional: number;
  rescate: number;
  rescateReporte: number;
  costoSeguro: number;
  sumaBasica: number;
  sumaInvalidez: number;
};

export type SolicitudMet4U = z.infer<typeof solicitudMet4U>;
export type CoberturaMet4U = keyof typeof COBERTURAS_MET4U;
export type RespuestaMet4U =
  | {
      primas: { cobertura: CoberturaMet4U; suma: number; prima: number }[];
      coberturaAnual: number;
      aporteAnual: number;
      aportePorPago: number;
      proyeccion?: FilaMet4U[];
    }
  | { error: string };
