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
export const solicitudFlexi = z.object({
  edad: z.number().int().min(18).max(85),
  sexo: z.enum(["M", "F"]),
  fuma: z.enum(["S", "N"]),
  plazo: z.union([z.literal(10), z.literal(20)]),
  suma: importe.max(1000000),
  frecuencia: z.enum(["anual", "semestral", "trimestral", "mensual"]),
  inversiones: z
    .array(
      z.object({
        liquidez,
        inicial: importe.optional(),
        mensual: importe.optional(),
        trimestral: importe.optional(),
        anual: importe.optional(),
      }),
    )
    .max(6),
});

export type SolicitudFlexi = z.infer<typeof solicitudFlexi>;
export type LiquidezFlexi = z.infer<typeof liquidez>;
export type FilaFlexi = {
  mes: number;
  prima: number;
  rescate: number;
  inversiones: { liquidez: LiquidezFlexi; aportacion: number; fondo: number }[];
};
export type RespuestaFlexi =
  { error: string } | { primaAnual: number; primaPago: number; proyeccion: FilaFlexi[] };
