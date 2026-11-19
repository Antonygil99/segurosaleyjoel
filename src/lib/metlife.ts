import { z } from "zod";

export const MONEDAS = {
  MXN: { etiqueta: "Pesos mexicanos (MXN)", divisa: "MXN" },
  USD: { etiqueta: "Dólares estadounidenses (USD)", divisa: "USD" },
  MXC: { etiqueta: "Pesos crecientes (MXN)", divisa: "MXN" },
} as const;

export const PLANES = {
  1: { nombre: "TempoLife", plazos: { MXN: [1, 5, 10], USD: [1, 5, 10, 15, 20, 65] } },
  2: {
    nombre: "TotaLife",
    plazos: { USD: [5, 10, 15, 20, 65, 100], MXC: [5, 10, 15, 20, 65, 100] },
  },
  6: { nombre: "TempoLife Grandes Sumas", plazos: { MXN: [10, 20], USD: [10, 20] } },
  8: { nombre: "TempoLife Preferente", plazos: { MXN: [10, 20], USD: [10, 20] } },
  10: { nombre: "PerfectLife", plazos: { USD: [5, 10, 15, 20, 65], MXC: [5, 10, 15, 20, 65] } },
  12: { nombre: "Horizonte", plazos: { USD: [50, 55, 60, 65], MXC: [50, 55, 60, 65] } },
} satisfies Record<
  number,
  { nombre: string; plazos: Partial<Record<keyof typeof MONEDAS, readonly number[]>> }
>;

export const COBERTURAS = {
  EP: "Exención de primas por invalidez",
  PASI: "Pago anticipado por invalidez",
  IMA: "Indemnización por muerte accidental",
  DI: "Muerte accidental o pérdidas orgánicas",
  TI: "Muerte accidental o pérdidas orgánicas por accidente colectivo",
  EG: "Enfermedades graves",
  GF: "Gastos funerarios",
} as const;

export type CoberturaVida = keyof typeof COBERTURAS;
export type Accidente = "IMA" | "DI" | "TI";

export const LIQUIDACION_HORIZONTE = {
  unica: "Pago en una sola exhibición",
  vitalicia: "Renta mensual vitalicia",
  10: "Renta mensual con 10 años de garantía",
  15: "Renta mensual con 15 años de garantía",
  20: "Renta mensual con 20 años de garantía",
  30: "Renta mensual con 30 años de garantía",
} as const;

export const REGIMEN_HORIZONTE = {
  noDeduce: "No deducible",
  ahorro: "Cuenta especial de ahorro",
  ppr: "Plan Personal de Retiro (PPR)",
} as const;

export function regimenesHorizonte(moneda: keyof typeof MONEDAS, plazo: number) {
  const disponibles: (keyof typeof REGIMEN_HORIZONTE)[] = ["noDeduce"];
  if (plazo !== 50) disponibles.push("ahorro");
  if (plazo === 65 && moneda === "MXC") disponibles.push("ppr");
  return disponibles;
}
export const PAGOS = {
  anual: { etiqueta: "Anual", id: 1, pagos: 1 },
  semestral: { etiqueta: "Semestral", id: 2, pagos: 2 },
  trimestral: { etiqueta: "Trimestral", id: 3, pagos: 4 },
  mensual: { etiqueta: "Mensual", id: 4, pagos: 12 },
} as const;

const importe = z.number().int().min(1).max(2147483647);
const porcentaje = z
  .number()
  .min(0)
  .max(10000)
  .refine((value) => value === 0 || value > 100);

export const solicitudSchema = z.object({
  plan: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(6),
    z.literal(8),
    z.literal(10),
    z.literal(12),
  ]),
  moneda: z.enum(["MXN", "USD", "MXC"]),
  plazo: z.number().int().positive(),
  edad: z.number().int().min(0).max(99),
  sexo: z.enum(["M", "F"]),
  fuma: z.enum(["S", "N"]),
  suma: importe,
  frecuencia: z.enum(["anual", "semestral", "trimestral", "mensual"]),
  beneficios: z
    .object({
      EP: z.boolean().optional(),
      PASI: importe.optional(),
      accidente: z.object({ tipo: z.enum(["IMA", "DI", "TI"]), suma: importe }).optional(),
      EG: importe.optional(),
      GF: importe.optional(),
    })
    .optional(),
  extraprimas: z
    .object({
      vida: porcentaje.optional(),
      invalidez: porcentaje.optional(),
      accidentes: porcentaje.optional(),
      millar: z.number().min(0).max(10000).optional(),
    })
    .optional(),
  proyeccion: z.boolean().optional(),
  horizonte: z
    .object({
      plazoPago: z.union([z.literal(5), z.literal(10), z.literal(100)]),
      liquidacion: z.enum(["unica", "vitalicia", "10", "15", "20", "30"]),
      regimen: z.enum(["noDeduce", "ahorro", "ppr"]).optional(),
    })
    .optional(),
});

export type SolicitudMetLife = z.infer<typeof solicitudSchema>;

function plazosPlan(
  plan: SolicitudMetLife["plan"],
): Partial<Record<SolicitudMetLife["moneda"], readonly number[]>> {
  return PLANES[plan].plazos;
}

export function monedasDe(plan: SolicitudMetLife["plan"]): SolicitudMetLife["moneda"][] {
  return Object.keys(plazosPlan(plan)) as SolicitudMetLife["moneda"][];
}

export function plazosDe(solicitud: Pick<SolicitudMetLife, "plan" | "moneda">): readonly number[] {
  return plazosPlan(solicitud.plan)[solicitud.moneda] ?? [];
}

export function etiquetaPlazo(plazo: number) {
  if (plazo === 100) return "Vitalicio";
  if (plazo >= 50) return `Hasta los ${plazo} años`;
  return plazo === 1 ? "1 año" : `${plazo} años`;
}
