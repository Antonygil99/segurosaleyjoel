import {
  COBERTURAS,
  PAGOS,
  type Accidente,
  type CoberturaVida,
  type SolicitudMetLife,
} from "./metlife";

export type FactorGarantizado = [rescate: number, saldado: number, anos: number, dias: number];
type Edad = { edadMin: number; edadMax: number; edadCan: number };
type Suma = { sumaMin: number; sumaMax: number };
type Beneficio = CoberturaVida | "BAS" | "VG" | "EPGF";
type Claves = Record<Beneficio, string> & { tarifaSH: number; claveBanda: number };

export interface Tarifario {
  edadMin: number;
  edadMax: number;
  sumaMin: number;
  recFijo: number;
  claves: Record<string, Pick<Claves, "BAS" | "tarifaSH" | "claveBanda"> & Partial<Claves>>;
  bandas: { idBanda: number; sumaInferior: number; sumaSuperior: number }[];
  recargos: Record<string, number>;
  primas: {
    prima: number;
    banda: number;
    edad: number;
    sexo: string;
    fuma: string;
    plan: string;
  }[];
  beneficios?: {
    edades: Record<string, Edad>;
    suscripcion?: Record<string, Pick<Edad, "edadMin" | "edadMax">>;
    sumas: Record<string, Suma>;
    funerario: { GF: number; edad: number; sexo: string; fuma: string }[];
  };
  horizonte?: {
    rentas: { garantia: number; sexo: string; fuma: string; facRenta: number }[];
    ahorro: { edad: number; sexo: string; fuma: string; facAhorro: number }[];
    pagoLimitado?: Record<number, Tarifario>;
  };
}

export interface FilaProyeccion {
  anio: number;
  edad: number;
  prima: number;
  acumulada: number;
  suma: number;
  rescate: number;
  saldado: number;
  prorroga: string | null;
}

type PrimaBeneficio = { cobertura: CoberturaVida; suma: number | null; prima: number };

export type CotizacionVida = {
  basica: number;
  cargoFijo: number;
  primaAnual: number;
  recargo: number;
  pago: number;
  pagos: number;
  beneficios: PrimaBeneficio[];
  proyeccion?: FilaProyeccion[];
  horizonte?: {
    importeLiquidacion: number;
    ahorroPorPago: number;
    proteccionPorPago: number;
  };
};

export type RespuestaCotizacion = { cotizacion: CotizacionVida } | { error: string };

export const NO_DISPONIBLE = "El tarifario 7.6 no está disponible para esta combinación.";

const tarifaFijaAccidentes: Record<Accidente, [regular: number, grandesSumas: number]> = {
  IMA: [1.24, 0.96],
  DI: [1.64, 1.2],
  TI: [2.19, 1.32],
};

export function perfilTarifa(solicitud: SolicitudMetLife, datos: Tarifario) {
  const { plan, edad, sexo, fuma, suma, plazo } = solicitud;
  const clave = datos.claves[plan === 6 || plan === 8 ? fuma : "NA"];
  if (!clave) return;
  const banda =
    clave.claveBanda === 1
      ? datos.bandas.find(
          ({ sumaInferior, sumaSuperior }) =>
            suma >= sumaInferior && (sumaSuperior === 0 || suma <= sumaSuperior),
        )?.idBanda
      : 0;
  const reduccion = (sexo === "F" ? 3 : 0) + (fuma === "N" ? 2 : 0);
  const edadTarifa =
    clave.tarifaSH === 1 || plazo >= 50 ? edad : Math.max(datos.edadMin, edad - reduccion);
  return {
    clave,
    banda,
    edadTarifa,
    reduccion,
    sexoTarifa: clave.tarifaSH === 1 ? sexo : "M",
    fumaTarifa: clave.tarifaSH === 1 ? fuma : "S",
  };
}

function fechaEnMexico() {
  const fecha = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Mexico_City" }).format(
    new Date(),
  );
  return new Date(`${fecha}T00:00:00Z`);
}

function proyectar(
  solicitud: SolicitudMetLife,
  datos: Tarifario,
  perfil: NonNullable<ReturnType<typeof perfilTarifa>>,
  inicial: CotizacionVida,
  factores: FactorGarantizado[],
  tasa: number,
  buscarPrima: (
    codigo: string | undefined,
    edad: number,
    banda: number | undefined,
    sexo: string,
    fuma: string,
  ) => number | undefined,
  primaFuneraria: (edad: number, suma: number) => number,
  tasaEP: number,
): FilaProyeccion[] {
  const { plan, edad, sexo, fuma, suma, plazo, moneda, beneficios, extraprimas } = solicitud;
  const renovable = plan === 1 && plazo === 1;
  const creciente = moneda === "MXC";
  const limites = datos.beneficios?.edades ?? {};
  const plazoLimitado = solicitud.horizonte?.plazoPago ?? 100;
  const plazoPago = renovable
    ? 71 - edad
    : plan === 12 && plazoLimitado < 100
      ? plazoLimitado
      : plazo >= 50
        ? plazo - edad
        : plazo;
  const duracion = renovable ? plazoPago : Math.min(factores.length, 100 - edad);
  const fecha = fechaEnMexico();
  const porVida = (extraprimas?.vida || 100) / 100;
  const porInvalidez = (extraprimas?.invalidez || 100) / 100;
  const millar = extraprimas?.millar ?? 0;
  const inicialSinEP = inicial.basica + inicial.cargoFijo;
  const primaInicial = (cobertura: CoberturaVida) =>
    inicial.beneficios.find((item) => item.cobertura === cobertura)?.prima ?? 0;
  const montoGF = beneficios?.GF ?? 0;
  const primaEPInicial = (inicialSinEP * tasaEP * porInvalidez) / 100;
  let acumulada = 0;
  let anterior = 0;

  return Array.from({ length: duracion }, (_, indice) => {
    const anio = indice + 1;
    const edadAnio = edad + indice;
    const incremento = creciente ? indice * 0.05 : 0;
    const incrementoAcc = creciente ? Math.min(indice, Math.max(0, 60 - edad)) * 0.05 : 0;
    const aumentoSuma =
      plan === 2 && creciente ? (edad <= 60 ? Math.min(indice, 65 - edad) * 0.05 : 0) : incremento;
    const sumaAnio = suma + suma * aumentoSuma;
    const factor = factores[indice];
    const tieneGarantias = !(plan === 1 && plazo <= 5) && factor !== undefined;

    let anual = 0;
    if (anio <= plazoPago) {
      const pagaBeneficio = (tipo: string) => edadAnio < (limites[tipo]?.edadCan ?? 0);
      let primaBase = inicialSinEP * (1 + incremento);
      if (renovable) {
        const tarifa =
          buscarPrima(
            perfil.clave.BAS,
            Math.max(datos.edadMin, edadAnio - perfil.reduccion),
            perfil.banda,
            "M",
            "S",
          ) ?? 0;
        primaBase = (tarifa * suma * porVida) / 1000 + datos.recFijo + (millar * suma) / 1000;
      }
      if (plan === 2 && creciente) {
        if (edad > 60) primaBase = inicialSinEP;
        else if (edadAnio > 65) primaBase = anterior;
      }

      let primaPASI = 0;
      if (pagaBeneficio("PASI")) {
        primaPASI = renovable
          ? ((buscarPrima(perfil.clave.PASI, edadAnio, 0, sexo, fuma) ?? 0) *
              (beneficios?.PASI ?? 0) *
              porInvalidez) /
            1000
          : primaInicial("PASI") * (1 + incrementoAcc);
      }
      const tipoAccidente = beneficios?.accidente?.tipo;
      const pagaAccidente = renovable
        ? edadAnio <= (limites.ACC?.edadMax ?? 0)
        : pagaBeneficio("ACC");
      const primaAccidente =
        tipoAccidente && pagaAccidente ? primaInicial(tipoAccidente) * (1 + incrementoAcc) : 0;
      const primaEG = pagaBeneficio("EG")
        ? ((buscarPrima(perfil.clave.EG, edadAnio, 0, sexo, fuma) ?? 0) *
            (beneficios?.EG ?? 0) *
            (1 + incremento)) /
          1000
        : 0;
      const primaGF = pagaBeneficio("GF")
        ? anio === 1
          ? primaInicial("GF")
          : primaFuneraria(edadAnio, montoGF * (1 + incremento))
        : 0;
      const primaEP =
        beneficios?.EP && pagaBeneficio("EP")
          ? primaEPInicial * (1 + incremento) + (tasaEP * primaGF) / 100
          : 0;
      anual = (primaBase + primaEP + primaPASI + primaAccidente + primaEG + primaGF) * (1 + tasa);
    }
    anterior = anual;
    acumulada += anual;
    const prorrogada =
      tieneGarantias && (factor[2] > 0 || factor[3] > 0)
        ? new Date(
            Date.UTC(
              fecha.getUTCFullYear() + anio + factor[2],
              fecha.getUTCMonth(),
              fecha.getUTCDate() + factor[3],
            ),
          )
            .toISOString()
            .slice(0, 10)
        : null;
    return {
      anio,
      edad: edadAnio,
      prima: anual,
      acumulada,
      suma: sumaAnio,
      rescate: tieneGarantias ? Math.round((factor[0] * sumaAnio) / 1000) : 0,
      saldado: tieneGarantias ? Math.round((factor[1] * sumaAnio) / 1000) : 0,
      prorroga: prorrogada,
    };
  });
}

export function calcularPrima(
  solicitud: SolicitudMetLife,
  datos: Tarifario,
  factores?: FactorGarantizado[],
): RespuestaCotizacion {
  const { plan, edad, sexo, fuma, suma, plazo, beneficios, extraprimas } = solicitud;
  if (edad < datos.edadMin || edad > datos.edadMax) {
    return { error: `La edad debe estar entre ${datos.edadMin} y ${datos.edadMax} años.` };
  }
  if (suma < datos.sumaMin) {
    return { error: `La suma asegurada mínima es ${datos.sumaMin.toLocaleString("es-MX")}.` };
  }

  const perfil = perfilTarifa(solicitud, datos);
  if (!perfil) return { error: NO_DISPONIBLE };
  const { clave, banda, edadTarifa, sexoTarifa, fumaTarifa } = perfil;
  const buscarPrima = (
    codigo: string | undefined,
    edad: number,
    banda: number | undefined,
    sexo: string,
    fuma: string,
  ) =>
    datos.primas.find(
      (fila) =>
        fila.plan === codigo &&
        fila.banda === banda &&
        fila.edad === edad &&
        fila.sexo === sexo &&
        fila.fuma === fuma,
    )?.prima;
  const primaBase = buscarPrima(clave.BAS, edadTarifa, banda, sexoTarifa, fumaTarifa);

  const frecuencia = PAGOS[solicitud.frecuencia];
  const tasa = datos.recargos[frecuencia.id];
  if (!primaBase || !Number.isFinite(tasa)) return { error: NO_DISPONIBLE };
  const porVida = (extraprimas?.vida || 100) / 100;
  const porInvalidez = (extraprimas?.invalidez || 100) / 100;
  const porAccidentes = (extraprimas?.accidentes || 100) / 100;
  const millar = extraprimas?.millar ?? 0;
  const primaFuneraria = (edad: number, suma: number) => {
    const fila = datos.beneficios?.funerario.find(
      (fila) => fila.edad === edad && fila.sexo === sexo && fila.fuma === fuma,
    );
    return ((fila?.GF ?? 0) * suma) / 1000;
  };
  const basica = (suma * primaBase * porVida) / 1000 + (suma * millar) / 1000;
  const adicionales: PrimaBeneficio[] = [];
  const accidente = beneficios?.accidente?.tipo;
  const solicitadas: [CoberturaVida, number | undefined][] = [
    ["PASI", beneficios?.PASI],
    ["EG", beneficios?.EG],
    ["GF", beneficios?.GF],
  ];
  if (accidente) solicitadas.push([accidente, beneficios.accidente?.suma]);

  for (const [cobertura, monto] of solicitadas) {
    if (!monto) continue;
    const esAccidente = cobertura === accidente;
    const grupo = esAccidente ? "ACC" : cobertura;
    const limite = (datos.beneficios?.suscripcion ?? datos.beneficios?.edades)?.[grupo];
    const sumas = datos.beneficios?.sumas[grupo];
    if (
      !limite ||
      !sumas ||
      edad < limite.edadMin ||
      edad > limite.edadMax ||
      (cobertura === "TI" && (plan === 6 || plan === 8))
    ) {
      return {
        error: `La cobertura ${COBERTURAS[cobertura]} no está disponible para este perfil.`,
      };
    }
    if (monto < sumas.sumaMin || (sumas.sumaMax > 0 && monto > sumas.sumaMax)) {
      const maximo = sumas.sumaMax
        ? ` y el máximo es ${sumas.sumaMax.toLocaleString("es-MX")}`
        : "";
      return {
        error: `En ${COBERTURAS[cobertura]}, el mínimo es ${sumas.sumaMin.toLocaleString("es-MX")}${maximo}.`,
      };
    }
    if (cobertura === "GF") {
      const prima =
        plan === 12 && (solicitud.horizonte?.plazoPago ?? 100) < 100
          ? ((buscarPrima(clave.GF, edad, 0, sexo, fuma) ?? 0) * monto) / 1000
          : primaFuneraria(edad, monto);
      if (prima <= 0) return { error: NO_DISPONIBLE };
      adicionales.push({
        cobertura,
        suma: monto,
        prima: prima * porVida + (millar * monto) / 1000,
      });
      continue;
    }
    const multiplicador = esAccidente ? porAccidentes : cobertura === "PASI" ? porInvalidez : 1;
    const tasaFija =
      esAccidente && clave[cobertura] === "NA"
        ? tarifaFijaAccidentes[accidente][plan === 6 || plan === 8 ? 1 : 0]
        : undefined;
    const tarifa = tasaFija ?? buscarPrima(clave[cobertura], edad, 0, sexo, fuma);
    if (!tarifa) return { error: NO_DISPONIBLE };
    adicionales.push({ cobertura, suma: monto, prima: (monto * tarifa * multiplicador) / 1000 });
  }

  let tasaEP = 0;
  if (beneficios?.EP) {
    const limite = (datos.beneficios?.suscripcion ?? datos.beneficios?.edades)?.EP;
    if (!limite || clave.EP === "NA" || edad < limite.edadMin || edad > limite.edadMax) {
      return {
        error: "La exención de primas por invalidez no está disponible para este plazo o edad.",
      };
    }
    const tarifa = buscarPrima(clave.EP, edad, 0, sexo, fuma);
    if (!tarifa) return { error: NO_DISPONIBLE };
    tasaEP = tarifa;
    const funeraria = adicionales.find(({ cobertura }) => cobertura === "GF")?.prima ?? 0;
    adicionales.push({
      cobertura: "EP",
      suma: null,
      prima: ((basica + datos.recFijo + funeraria) * tasaEP * porInvalidez) / 100,
    });
  }

  const primaAnual = adicionales.reduce(
    (total, item) => total + item.prima,
    basica + datos.recFijo,
  );
  const recargo = primaAnual * tasa;
  const cotizacion: CotizacionVida = {
    basica,
    cargoFijo: datos.recFijo,
    primaAnual,
    recargo,
    pago: (primaAnual + recargo) / frecuencia.pagos,
    pagos: frecuencia.pagos,
    beneficios: adicionales,
  };
  if (plan === 12 && datos.horizonte) {
    const { moneda } = solicitud;
    const liquidacion = solicitud.horizonte?.liquidacion ?? "unica";
    const sumaAlcanzada = moneda === "MXC" ? suma + (plazo - edad - 1) * 0.05 * suma : suma;
    const garantia = liquidacion === "vitalicia" ? 0 : Number(liquidacion);
    const renta = datos.horizonte.rentas.find(
      (fila) => fila.garantia === garantia && fila.sexo === sexo && fila.fuma === fuma,
    );
    if (liquidacion !== "unica" && !renta) return { error: NO_DISPONIBLE };
    const ahorro = datos.horizonte.ahorro.find(
      (fila) => fila.edad === edad && fila.sexo === sexo && fila.fuma === fuma,
    );
    const ahorroPorPago = ((ahorro?.facAhorro ?? 0) * basica) / 100 / frecuencia.pagos;
    cotizacion.horizonte = {
      importeLiquidacion:
        liquidacion === "unica"
          ? Math.round(sumaAlcanzada)
          : Math.round(((renta?.facRenta ?? 0) * sumaAlcanzada) / 1000),
      ahorroPorPago,
      proteccionPorPago: cotizacion.pago - ahorroPorPago,
    };
  }
  if (solicitud.proyeccion) {
    if (!factores || (!factores.length && !(plan === 1 && plazo === 1))) {
      return { error: "No hay valores garantizados disponibles para esta combinación." };
    }
    cotizacion.proyeccion = proyectar(
      solicitud,
      datos,
      perfil,
      cotizacion,
      factores,
      tasa,
      buscarPrima,
      primaFuneraria,
      tasaEP,
    );
  }
  return { cotizacion };
}
