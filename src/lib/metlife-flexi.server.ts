import { PAGOS } from "./metlife";
import { obtenerConexionMetLife } from "./metlife-conexion.server";
import {
  LIQUIDEZ_FLEXI,
  BENEFICIOS_SUENOS,
  type FilaFlexi,
  type LiquidezFlexi,
  type RespuestaFlexi,
  type SolicitudFlexi,
  type SolicitudFlexiSuenos,
  type TipoFondoFlexi,
} from "./metlife-flexi";

type TarifarioFlexi = {
  sumaMin: number;
  recFijo: number;
  qx: Record<"MS" | "MN" | "FS" | "FN", number>[];
  rescate: number[];
  fondos: Record<LiquidezFlexi, number>;
  recargos: Record<number, number>;
  planes: Record<
    number,
    {
      edadMin: number;
      edadMax: number;
      primas: Record<number, number>;
      admin: Record<string, number>;
    }
  >;
};

const sinTarifa = "El tarifario de FlexiLife Inversión 7.6 no está disponible.";

type CuentaFlexi = SolicitudFlexi["inversiones"][number] & { tipo?: TipoFondoFlexi };

function proyectarCuentas(inversiones: CuentaFlexi[], tasaAnual: (cuenta: CuentaFlexi) => number) {
  const cuentas = inversiones.map((cuenta) => ({
    ...cuenta,
    fondo: 0,
    tasa: Math.pow(1 + tasaAnual(cuenta), 1 / 12) - 1,
  }));
  return (indice: number): FilaFlexi["inversiones"] =>
    cuentas.map((cuenta) => {
      const aporte =
        indice === 0
          ? (cuenta.inicial ?? 0)
          : (cuenta.mensual ?? 0) +
            (indice % 3 === 0 ? (cuenta.trimestral ?? 0) : 0) +
            (indice % 12 === 0 ? (cuenta.anual ?? 0) : 0);
      const saldo = cuenta.fondo + aporte;
      cuenta.fondo = saldo + saldo * cuenta.tasa;
      return {
        liquidez: cuenta.liquidez,
        ...(cuenta.tipo ? { tipo: cuenta.tipo } : {}),
        aportacion: aporte,
        fondo: cuenta.fondo,
      };
    });
}

function calcular(solicitud: SolicitudFlexi, datos: TarifarioFlexi): RespuestaFlexi {
  const { edad, sexo, fuma, plazo, suma, frecuencia, inversiones } = solicitud;
  const plan = datos.planes[plazo];
  if (!plan) return { error: sinTarifa };
  if (edad < plan.edadMin || edad > plan.edadMax || suma < datos.sumaMin) {
    return {
      error: `Revisa el rango de edad de ${plan.edadMin} a ${plan.edadMax} años y la suma mínima de ${datos.sumaMin.toLocaleString("es-MX")} MXN.`,
    };
  }
  if (new Set(inversiones.map(({ liquidez }) => liquidez)).size !== inversiones.length) {
    return { error: "Captura una fila por moneda y liquidez." };
  }
  for (const cuenta of inversiones) {
    const { minima, moneda } = LIQUIDEZ_FLEXI[cuenta.liquidez];
    if (cuenta.inicial !== undefined && cuenta.inicial < minima) {
      return {
        error: `La aportación inicial de ${LIQUIDEZ_FLEXI[cuenta.liquidez].etiqueta} debe ser de al menos ${minima.toLocaleString("es-MX")} ${moneda}.`,
      };
    }
  }
  const edadCalculo = Math.max(15, edad - (sexo === "F" ? 3 : 0) - (fuma === "N" ? 2 : 0));
  const tarifa = plan.primas[edadCalculo];
  const adminPrimero = plan.admin[`${edadCalculo}/1`];
  const adminResto = plan.admin[`${edadCalculo}/2`];
  const forma = PAGOS[frecuencia];
  const recargo = frecuencia === "anual" ? 0 : datos.recargos[forma.id];
  if ([tarifa, adminPrimero, adminResto, recargo].some((v) => v === undefined)) {
    return { error: sinTarifa };
  }
  const primaAnual = (suma * tarifa) / 1000 + datos.recFijo;
  const primaPago = (primaAnual + primaAnual * recargo) / forma.pagos;
  const fondos = proyectarCuentas(inversiones, ({ liquidez }) => datos.fondos[liquidez]);
  const tasaTecnica = Math.pow(1.045, 1 / 12) - 1;
  const perfil = `${sexo}${fuma}` as const;
  let reserva = 0;
  const proyeccion: FilaFlexi[] = Array.from({ length: plazo * 12 }, (_, indice) => {
    const mes = indice + 1;
    const anio = Math.floor(indice / 12) + 1;
    const prima = indice % (12 / forma.pagos) === 0 ? primaPago : 0;
    const admin = ((mes <= 12 ? adminPrimero : adminResto) * suma) / 1000;
    const seguro = (datos.qx[edad + anio - 1][perfil] * suma) / 1000;
    const disponible = prima - admin - datos.recFijo / 12 + reserva - seguro;
    reserva = disponible + disponible * tasaTecnica;
    const castigo = mes <= 120 ? datos.rescate[anio] : 0;
    return {
      mes,
      prima,
      rescate: reserva - reserva * castigo,
      inversiones: fondos(indice),
    };
  });
  return { primaAnual, primaPago, proyeccion };
}

type Perfil = "MS" | "MN" | "FS" | "FN";
type Beneficio = keyof typeof BENEFICIOS_SUENOS;
type TarifarioSuenos = {
  sumaMin: number;
  recFijo: number;
  minimoPreferente: number;
  maximoPPR: number;
  maximoCPEA: number;
  tipoCambioDolar: number;
  claves: Record<string, { BAS: string; EP: string; PASI: string; EG: string; tarifaSH: number }>;
  edades: Record<string, { edadMin: number; edadMax: number; edadCan: number }>;
  tasas: Record<TipoFondoFlexi, Record<LiquidezFlexi, number>>;
  tarifas: Record<string, number>;
  admin: Record<string, number>;
  qx: Record<string, Record<Perfil, number>>;
  rescate: number[];
  recargos: Record<number, number>;
  limites: Record<string, { sumaMin: number; sumaMax: number }>;
};

const sinTarifaSuenos = "El tarifario de FlexiLife Sueños 7.6 no está disponible.";
const tarifasAccidente = { IMA: 1.24, DI: 1.64, TI: 2.19 };

function calcularSuenos(solicitud: SolicitudFlexiSuenos, datos: TarifarioSuenos): RespuestaFlexi {
  const { edad, sexo, fuma, plazo, suma, preferente, frecuencia, inversiones, coberturas } =
    solicitud;
  const riesgo = preferente ? 1 : 0;
  const plan = datos.claves[`${plazo}/${riesgo}`];
  const bas = datos.edades[`${plazo}/BAS`];
  const minima = preferente ? datos.minimoPreferente : datos.sumaMin;
  if (edad < bas.edadMin || edad > bas.edadMax || suma < minima) {
    return {
      error: `Revisa el rango de edad de ${bas.edadMin} a ${bas.edadMax} años y la suma mínima de ${minima.toLocaleString("es-MX")} MXN.`,
    };
  }
  if (!inversiones.some(({ inicial }) => inicial)) {
    return { error: "Captura al menos una aportación inicial." };
  }
  if (
    new Set(inversiones.map(({ tipo, liquidez }) => `${tipo}/${liquidez}`)).size !==
    inversiones.length
  ) {
    return { error: "Captura una fila por cuenta, moneda y liquidez." };
  }
  for (const { tipo, liquidez, inicial } of inversiones) {
    if (tipo !== "Ahorro" && plazo !== 65) {
      return { error: "Las cuentas PPR y CPEA se ofrecen en el plazo a los 65 años." };
    }
    const { minima, etiqueta, moneda } = LIQUIDEZ_FLEXI[liquidez];
    if (inicial !== undefined && inicial < minima) {
      return {
        error: `La aportación inicial de ${etiqueta} debe ser de al menos ${minima.toLocaleString("es-MX")} ${moneda}.`,
      };
    }
  }
  for (const [tipo, limite] of [
    ["PPR", datos.maximoPPR],
    ["CPEA", datos.maximoCPEA],
  ] as const) {
    let primero = 0;
    let siguientes = 0;
    for (const cuenta of inversiones.filter((cuenta) => cuenta.tipo === tipo)) {
      const cambio = LIQUIDEZ_FLEXI[cuenta.liquidez].moneda === "USD" ? datos.tipoCambioDolar : 1;
      primero +=
        ((cuenta.inicial ?? 0) + 11 * (cuenta.mensual ?? 0) + 3 * (cuenta.trimestral ?? 0)) *
        cambio;
      siguientes +=
        (12 * (cuenta.mensual ?? 0) + 4 * (cuenta.trimestral ?? 0) + (cuenta.anual ?? 0)) * cambio;
    }
    if (primero > limite || siguientes > limite) {
      return {
        error: `La aportación anual de ${tipo} supera el máximo del cotizador 7.6: ${limite.toLocaleString("es-MX")} MXN.`,
      };
    }
  }
  if ([coberturas.IMA, coberturas.DI, coberturas.TI].filter(Boolean).length > 1) {
    return { error: "Selecciona una sola cobertura por accidente." };
  }
  const reglas = (id: Beneficio) => datos.edades[`${id === "GF" ? 0 : plazo}/${id}`];
  const exencion = reglas("EP");
  const sumas = {
    ...coberturas,
    EP: edad >= exencion.edadMin && edad <= exencion.edadMax,
    GF: coberturas.GF ? datos.limites.GF.sumaMin : undefined,
  };
  for (const id of Object.keys(BENEFICIOS_SUENOS) as Beneficio[]) {
    if (!sumas[id]) continue;
    const { edadMin, edadMax } = reglas(id);
    if (edad < edadMin || edad > edadMax) {
      return {
        error: `${BENEFICIOS_SUENOS[id]} está disponible entre los ${edadMin} y ${edadMax} años.`,
      };
    }
    const limite = datos.limites[id in tarifasAccidente ? "ACC" : id];
    const importe = sumas[id];
    if (
      typeof importe === "number" &&
      (importe < limite.sumaMin || (limite.sumaMax > 0 && importe > limite.sumaMax))
    ) {
      return { error: `Revisa la suma asegurada de ${BENEFICIOS_SUENOS[id].toLowerCase()}.` };
    }
  }

  const perfil = `${sexo}${fuma}` as Perfil;
  const edadCalculo = Math.max(18, edad - (sexo === "F" ? 3 : 0) - (fuma === "N" ? 2 : 0));
  const banda = preferente ? 4 : Math.min(3, Math.floor(suma / 500000));
  const claveTarifa = `${plan.BAS}/${plan.tarifaSH ? edad : edadCalculo}/${banda}/${plan.tarifaSH ? perfil : "MS"}`;
  const admin = `${plan.BAS}/${edad}/${banda}/${perfil}`;
  const tarifaBas = datos.tarifas[claveTarifa];
  const forma = PAGOS[frecuencia];
  const recargo = datos.recargos[forma.id];
  if (
    [tarifaBas, recargo, datos.admin[`${admin}/1/BAS`], datos.admin[`${admin}/2/BAS`]].some(
      (dato) => dato === undefined,
    )
  ) {
    return { error: sinTarifaSuenos };
  }
  const basAnual = (suma * tarifaBas) / 1000 + datos.recFijo;
  const tarifaAdicional = (codigo: string, edadTarifa: number) =>
    datos.tarifas[`${codigo}/${edadTarifa}/0/${perfil}`] ?? 0;
  const prima = (edadActual: number, proyeccion: boolean) => {
    const vigente = (beneficio: Beneficio) =>
      !!sumas[beneficio] && (!proyeccion || edadActual < reglas(beneficio).edadCan);
    const ep = vigente("EP") ? Math.round(basAnual * tarifaAdicional(plan.EP, edad)) / 100 : 0;
    const pasi = vigente("PASI")
      ? ((sumas.PASI ?? 0) * tarifaAdicional(plan.PASI, edad)) / 1000
      : 0;
    const accidente = (["IMA", "DI", "TI"] as const).reduce(
      (total, id) => total + (vigente(id) ? ((sumas[id] ?? 0) * tarifasAccidente[id]) / 1000 : 0),
      0,
    );
    const eg = vigente("EG") ? ((sumas.EG ?? 0) * tarifaAdicional(plan.EG, edadActual)) / 1000 : 0;
    const gf = vigente("GF") ? ((sumas.GF ?? 0) * tarifaAdicional("NGF01F", edadActual)) / 1000 : 0;
    return basAnual + ep + pasi + accidente + eg + gf;
  };
  const primaAnual = prima(edad, false);
  const gastoAccidente = { IMA: 0.1, DI: 0.14, TI: 0.18 };
  const porPeriodo = (anual: number) => (anual + anual * recargo) / forma.pagos;
  const duracion = plazo === 65 ? 65 - edad : plazo;
  const fondos = proyectarCuentas(
    inversiones,
    ({ tipo, liquidez }) => datos.tasas[tipo ?? "Ahorro"][liquidez],
  );
  const tasaTecnica = Math.pow(1.045, 1 / 12) - 1;
  let reserva = 0;
  const proyeccion: FilaFlexi[] = Array.from({ length: duracion * 12 }, (_, indice) => {
    const mes = indice + 1;
    const anio = Math.floor(indice / 12) + 1;
    const edadActual = edad + anio - 1;
    const pago = indice % (12 / forma.pagos) === 0 ? porPeriodo(prima(edadActual, true)) : 0;
    const etapa = anio === 1 ? 1 : 2;
    const tasaAdmin = (id: Beneficio) =>
      datos.admin[`${plan.BAS}/${edad}/0/${perfil}/${etapa}/${id}`] ?? 0;
    const vigente = (id: Beneficio) => edadActual < reglas(id).edadCan && !!sumas[id];
    const cargo =
      (datos.admin[`${admin}/${etapa}/BAS`] * suma) / 1000 +
      (vigente("EP") ? (tasaAdmin("EP") * basAnual) / 100 : 0) +
      (vigente("PASI") ? (tasaAdmin("PASI") * (sumas.PASI ?? 0)) / 1000 : 0) +
      (vigente("IMA") ? (gastoAccidente.IMA * (sumas.IMA ?? 0)) / 1000 : 0) +
      (vigente("DI") ? (gastoAccidente.DI * (sumas.DI ?? 0)) / 1000 : 0) +
      (vigente("TI") ? (gastoAccidente.TI * (sumas.TI ?? 0)) / 1000 : 0) +
      (vigente("EG") ? (tasaAdmin("EG") * (sumas.EG ?? 0)) / 1000 : 0) +
      (vigente("GF")
        ? ((datos.admin[`NUVA00/${edad}/0/${perfil}/0/GF`] ?? 0) * (sumas.GF ?? 0)) / 1000
        : 0);
    const fondoBase = pago - cargo - datos.recFijo / 12 + reserva;
    const coi = (id: string, nivel: number) =>
      datos.qx[`${id}/${nivel}/${edadActual}`]?.[perfil] ?? 0;
    const costoSeguro =
      (coi("BAS", riesgo + 1) * (suma - fondoBase)) / 1000 +
      (coi("EG", 0) * (sumas.EG ?? 0)) / 1000 +
      (coi("GF", 0) * (sumas.GF ?? 0)) / 1000;
    const disponible = fondoBase - costoSeguro;
    reserva = disponible + disponible * tasaTecnica;
    return {
      mes,
      prima: pago,
      rescate: reserva - reserva * (datos.rescate[anio] ?? 0),
      inversiones: fondos(indice),
    };
  });
  return { primaAnual, primaPago: porPeriodo(primaAnual), proyeccion };
}

export async function cotizarFlexiLife(
  solicitud: SolicitudFlexi | SolicitudFlexiSuenos,
): Promise<RespuestaFlexi> {
  const suenos = "modalidad" in solicitud;
  const errorTarifa = suenos ? sinTarifaSuenos : sinTarifa;
  const db = obtenerConexionMetLife();
  if (!db) return { error: errorTarifa };
  try {
    const { rows } = await db.query<{ datos: TarifarioFlexi | TarifarioSuenos }>(
      "SELECT datos FROM metlife_cotizador.flexi_tarifarios WHERE version = $1 AND plan = $2",
      ["7.6", suenos ? 32 : 31],
    );
    const datos = rows[0]?.datos;
    if (!datos) return { error: errorTarifa };
    return suenos
      ? calcularSuenos(solicitud, datos as TarifarioSuenos)
      : calcular(solicitud, datos as TarifarioFlexi);
  } catch (error) {
    const codigo =
      typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    console.error("Consulta de FlexiLife falló", codigo);
    return { error: errorTarifa };
  }
}
