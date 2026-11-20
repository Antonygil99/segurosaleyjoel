import { z } from "zod";

export const FRECUENCIAS_SALUD = [
  "Anual",
  "Semestral",
  "Semestral TC",
  "Trimestral",
  "Trimestral TC",
  "Mensual",
  "Mensual TC",
] as const;

export const PARENTESCOS = {
  titular: "Titular",
  conyuge: "Cónyuge",
  hijo: "Hijo",
  madre: "Madre",
  padre: "Padre",
  otro: "Otro",
} as const;

const asegurado = z.object({
  edad: z.number().int().min(0).max(99),
  sexo: z.enum(["M", "F"]),
  parentesco: z.enum(["titular", "conyuge", "hijo", "madre", "padre", "otro"]),
  mujer: z.boolean().optional(),
  plus: z.boolean().optional(),
  familiar: z.boolean().optional(),
});

const comun = {
  frecuencia: z.enum(FRECUENCIAS_SALUD),
  asegurados: z.array(asegurado).min(1).max(20),
};

export const solicitudSaludSchema = z.discriminatedUnion("producto", [
  z.object({
    ...comun,
    producto: z.literal("Primordial"),
    ampliada: z.boolean(),
    renovacion: z.boolean(),
  }),
  z.object({
    ...comun,
    producto: z.literal("MetPlus"),
    suma: z.union([z.literal(500000), z.literal(1000000), z.literal(3000000), z.literal(5000000)]),
  }),
]);

export type SolicitudSalud = z.infer<typeof solicitudSaludSchema>;

export type RespuestaSalud =
  | {
      primas: number[];
      neta: number;
      recargo: number;
      derecho: number;
      iva: number;
      total: number;
      primerPago: number;
      subsecuente: number;
      pagos: number;
      coberturas: {
        grupo: string;
        nombre: string;
        monto: number;
        espera?: string;
        deducible?: number;
      }[];
    }
  | { error: string };
