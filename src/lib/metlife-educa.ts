import { z } from "zod";

const importe = z.number().int().min(1).max(2147483647);
const miniDotal = z.union([z.literal(5), z.literal(11), z.literal(14), z.literal(16)]);
export const EDADES_MINIDOTAL = { 5: 0, 11: 6, 14: 9, 16: 11 } as const;
const adulto = z.object({
  edad: z.number().int().min(18).max(70),
  sexo: z.enum(["M", "F"]),
  fuma: z.enum(["S", "N"]),
  suma: importe,
  funerarios: z.boolean().optional(),
});

export const solicitudEduca = z.object({
  titular: adulto,
  conyuge: adulto.optional(),
  menor: z.object({
    edad: z.number().int().min(0).max(18),
    sexo: z.enum(["M", "F"]),
    funerarios: z.boolean().optional(),
  }),
  dotal: z.number().int().min(18).max(23),
  sumaDotal: importe.optional(),
  miniDotales: z
    .array(miniDotal)
    .max(4)
    .refine((edades) => new Set(edades).size === edades.length)
    .optional(),
  moneda: z.enum(["MXN", "USD"]),
  frecuencia: z.enum(["anual", "semestral", "trimestral", "mensual"]),
  adicionales: z.object({
    PASI: importe.optional(),
    IMA: importe.optional(),
    TIBA: importe.optional(),
    EG: importe.optional(),
  }),
});
export type SolicitudEduca = z.infer<typeof solicitudEduca>;
export type RespuestaEduca =
  | { error: string }
  | {
      filas: { nombre: string; suma?: number; prima: number }[];
      anual: number;
      recargo: number;
      pago: number;
      proyeccion: {
        anio: number;
        prima: number;
        acumulada: number;
        rescate: number;
        dotal: number;
        miniDotales: { edad: z.infer<typeof miniDotal>; rescate: number | null }[];
      }[];
    };

export const ADICIONALES_EDUCA = {
  PASI: "Pago anticipado por invalidez",
  IMA: "Muerte accidental",
  TIBA: "Triple indemnización por accidente",
  EG: "Enfermedades graves",
} as const;
