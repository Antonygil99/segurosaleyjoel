import { z } from "zod";

export const LIQUIDEZ_FLEXI = {
  diariaMN: { etiqueta: "Diaria · MXN", moneda: "MXN", minima: 5000 },
  mensualMN: { etiqueta: "Mensual · MXN", moneda: "MXN", minima: 30000 },
  trimestralMN: { etiqueta: "Trimestral · MXN", moneda: "MXN", minima: 70000 },
  semestralMN: { etiqueta: "Semestral · MXN", moneda: "MXN", minima: 100000 },
  diariaDls: { etiqueta: "Diaria · USD", moneda: "USD", minima: 500 },
  mensualDls: { etiqueta: "Mensual · USD", moneda: "USD", minima: 10000 },
} as const;

const liquidez = z.enum([
  "diariaMN",
  "mensualMN",
  "trimestralMN",
  "semestralMN",
  "diariaDls",
  "mensualDls",
]);
const importe = z.number().int().min(1).max(2147483647);
export const TIPO_FONDO_FLEXI = ["Ahorro", "PPR", "CPEA"] as const;
const tipoFondo = z.enum(TIPO_FONDO_FLEXI);
const cuenta = z.object({
  liquidez,
  inicial: importe.optional(),
  mensual: importe.optional(),
  trimestral: importe.optional(),
  anual: importe.optional(),
});
const datosFlexi = z.object({
  edad: z.number().int().min(18).max(85),
  sexo: z.enum(["M", "F"]),
  fuma: z.enum(["S", "N"]),
  frecuencia: z.enum(["anual", "semestral", "trimestral", "mensual"]),
});
const plazoFijo = z.union([z.literal(10), z.literal(20)]);
export const solicitudFlexi = datosFlexi.extend({
  plazo: plazoFijo,
  suma: importe.max(1000000),
  inversiones: z.array(cuenta).max(6),
});
export const BENEFICIOS_SUENOS = {
  EP: "Exención por invalidez",
  PASI: "Pago anticipado por invalidez",
  IMA: "Muerte accidental",
  DI: "Doble indemnización",
  TI: "Triple indemnización",
  EG: "Enfermedades graves",
  GF: "Gastos funerarios",
} as const;
export const solicitudFlexiSuenos = datosFlexi.extend({
  modalidad: z.literal("suenos"),
  plazo: z.union([plazoFijo, z.literal(65)]),
  suma: importe,
  preferente: z.boolean(),
  coberturas: z.object({
    PASI: importe.optional(),
    IMA: importe.optional(),
    DI: importe.optional(),
    TI: importe.optional(),
    EG: importe.optional(),
    GF: z.boolean().optional(),
  }),
  inversiones: z.array(cuenta.extend({ tipo: tipoFondo })).max(18),
});

export type SolicitudFlexi = z.infer<typeof solicitudFlexi>;
export type SolicitudFlexiSuenos = z.infer<typeof solicitudFlexiSuenos>;
export type LiquidezFlexi = z.infer<typeof liquidez>;
export type TipoFondoFlexi = z.infer<typeof tipoFondo>;
export type FilaFlexi = {
  mes: number;
  prima: number;
  rescate: number;
  inversiones: {
    liquidez: LiquidezFlexi;
    tipo?: TipoFondoFlexi;
    aportacion: number;
    fondo: number;
  }[];
};
export type RespuestaFlexi =
  { error: string } | { primaAnual: number; primaPago: number; proyeccion: FilaFlexi[] };
