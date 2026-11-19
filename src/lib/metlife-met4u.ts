import { z } from "zod";

export const COBERTURAS_MET4U = {
  BAS: "Fallecimiento",
  INV: "Invalidez total y permanente",
  CAN: "Cáncer",
  DIA: "Diabetes",
  GRA: "Enfermedades graves",
} as const;

export const SUMA_MINIMA_MET4U = { 10: 250000, 99: 200000 } as const;

export const ESCENARIOS_MET4U = {
  optimista: { etiqueta: "Optimista", fija: 0.065, variable: 0.12 },
  promedio: { etiqueta: "Promedio", fija: 0.035, variable: 0.08 },
  conservador: { etiqueta: "Conservador", fija: 0.02, variable: 0.02 },
} as const;
const escenario = z.enum(["optimista", "promedio", "conservador"]);

const importe = z.number().int().min(1).max(2147483647);
const anioRetiro = z.number().int().min(10).max(47);

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
  escenarioFijo: escenario.optional(),
  escenarioVariable: escenario.optional(),
  porcentajeVariable: z.number().int().min(0).max(100).optional(),
  retiro: z.object({ monto: importe, desde: anioRetiro, hasta: anioRetiro }).optional(),
  metas: z
    .array(z.object({ anio: anioRetiro, monto: importe }))
    .max(38)
    .optional(),
});

export type FilaMet4U = {
  anio: number;
  mes: number;
  edad: number;
  aportacion: number;
  retiroSolicitado: number;
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
