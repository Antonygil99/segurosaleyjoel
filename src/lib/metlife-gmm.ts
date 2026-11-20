import { z } from "zod";
import { FRECUENCIAS_SALUD } from "./metlife-salud";

export const VIGENCIAS_GMM = {
  nueva: "Póliza nueva",
  campana: "Póliza nueva de campaña",
  renovacion: "Renovación (venta actual)",
  anterior: "Renovación anterior",
  anterior2: "Renovación anterior 2",
  anterior3: "Renovación anterior 3",
} as const;

export const vigenciaGmm = z.enum([
  "nueva",
  "campana",
  "renovacion",
  "anterior",
  "anterior2",
  "anterior3",
]);

export const BENEFICIOS_GMM = {
  dental: "MetDental Plus",
  vision: "Visión",
  emergencia: "Emergencia en el extranjero",
  catastroficas: "Enfermedades catastróficas en el extranjero",
  reduccion: "Reducción del deducible por accidente",
  fronteriza: "Franja fronteriza",
  incremento: "Incremento de suma asegurada",
  estudiantes: "Estudiantes en el extranjero",
} as const;

export const solicitudGmm = z.object({
  vigencia: vigenciaGmm,
  plan: z.number().int().nonnegative(),
  municipio: z.number().int().nonnegative(),
  suma: z.number().int().nonnegative(),
  deducible: z.number().int().nonnegative(),
  deducibleExt: z.number().int().nonnegative(),
  coaseguro: z.number().min(0).max(1),
  tabulador: z.number().nonnegative(),
  frecuencia: z.enum(FRECUENCIAS_SALUD),
  conversion: z.enum(["ninguna", "institucional", "colectivo", "grupo"]),
  beneficios: z
    .array(
      z.enum([
        "dental",
        "vision",
        "emergencia",
        "catastroficas",
        "reduccion",
        "fronteriza",
        "incremento",
        "estudiantes",
      ]),
    )
    .max(8),
  muerteAccidental: z.number().nonnegative(),
  ultimosGastos: z.number().nonnegative(),
  rentaDiaria: z.number().nonnegative(),
  asegurados: z
    .array(z.object({ edad: z.number().int().min(0).max(110), sexo: z.enum(["M", "F"]) }))
    .min(1)
    .max(20),
});

export type SolicitudGmm = z.infer<typeof solicitudGmm>;

export type OpcionesGmm = {
  planes: { idPlan: number; Plan: string }[];
  municipios: { idEstado: number; Estado: string; Municipio: string; Fronterizo: string }[];
  sumas: number[];
  deducibles: {
    idPlan: number;
    Producto: number;
    Deducible: number;
    DedExtMin: number;
    DedExtMax: number;
  }[];
  deduciblesExt: number[];
  coaseguros: { CoasMin: number; Coaseguro: number }[];
  tabuladores: number[];
  muerteAccidental: number[];
  ultimosGastos: number[];
  rentaDiaria: number[];
};

export function coaseguroMinimo(vigencia: SolicitudGmm["vigencia"], plan: number) {
  return plan !== 0 && vigencia === "anterior" ? 0 : 10;
}
