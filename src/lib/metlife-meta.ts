import { z } from "zod";

const importe = z.number().int().min(1).max(999999999);
const fondo = z.number().min(0).max(999999999);
const fecha = z.iso.date();
const movimiento = z.object({ anio: z.number().int().min(1).max(81), monto: importe });

export const ESCENARIOS_META = {
  optimista: "Optimista",
  promedio: "Promedio",
  conservador: "Conservador",
} as const;

const escenario = z.enum(["optimista", "promedio", "conservador"]);
export const solicitudMeta = z.object({
  edad: z.number().int().min(18).max(70),
  sexo: z.enum(["M", "F"]),
  fuma: z.enum(["S", "N"]),
  moneda: z.enum(["MXN", "USD"]),
  version: z.enum(["actual", "c"]),
  cobertura: z.enum(["A", "B"]),
  frecuencia: z.enum(["anual", "semestral", "trimestral", "mensual"]),
  modalidad: z.enum(["suma", "prima", "meta"]),
  plazo: z.enum(["vitalicio", "5", "10", "15", "20", "edad60", "edad65"]).default("vitalicio"),
  plazoMeta: z.number().int().min(10).max(47).optional(),
  ahorroAnual: importe.optional(),
  importe,
  invalidez: z.boolean(),
  pagoInvalidez: z.boolean().optional(),
  accidente: z.enum(["MA", "DI", "TI"]).optional(),
  graves: z.boolean(),
  fijo: escenario,
  variable: escenario,
  porcentajeVariable: z.number().min(0).max(100),
  aportacionAnual: importe.optional(),
  aportaciones: z.array(movimiento).max(81),
  metas: z.array(movimiento).max(81),
  retiro: z
    .object({
      desde: z.number().int().min(6).max(81),
      hasta: z.number().int().min(6).max(81),
      monto: importe,
    })
    .optional(),
  reproyeccion: z
    .object({
      inicio: fecha,
      cambio: fecha,
      sumaOriginal: importe,
      fondoBasico: fondo,
      fondoAdicional: fondo,
    })
    .optional(),
});

export type SolicitudMeta = z.infer<typeof solicitudMeta>;
export type FilaMeta = {
  mes: number;
  prima: number;
  aportacion: number;
  aportacionAcumulada: number;
  fondoBasico: number;
  fondoFijo: number;
  fondoVariable: number;
  efectivoBasico: number;
  rescate: number;
  suma: number;
  fallecimiento: number;
  retiro: number;
};
export type RespuestaMeta =
  | { error: string }
  | {
      sumaInicial: number;
      primaAnual: number;
      primaPago: number;
      pagoAnios: number;
      primaAdicional: number;
      rescateMeta?: number;
      mesCambio?: number;
      proyeccion: FilaMeta[];
    };
