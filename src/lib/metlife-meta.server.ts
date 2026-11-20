import { PAGOS } from "./metlife";
import { obtenerConexionMetLife } from "./metlife-conexion.server";
import type { FilaMeta, RespuestaMeta, SolicitudMeta } from "./metlife-meta";

type CatalogoMeta = {
  primas: Record<SolicitudMeta["version"], Record<string, number>>;
  recargos: Record<SolicitudMeta["version"], Record<number, number>>;
  castigos: Record<
    "anterior" | SolicitudMeta["version"],
    Record<
      number,
      {
        porCastigoBase: number;
        porCastigoAdi: number;
      }
    >
  >;
  reglas: Record<
    string,
    { edadMin: number; edadMax: number; edadCan: number; sumaMin: number; sumaMax: number }
  >;
  coi: Record<number, Record<string, number>>;
  coiAdicional: Record<string, Record<string, number>>;
  seleccion: Record<number, { facSelMax: number }>;
  adicionales: Record<number, Record<string, number>>;
  recargosAdicionales: Record<number, Record<string, number>>;
  perfecto: Record<string, Record<string, number>>;
  comisiones: Record<string, Record<string, number>>;
};

const sinTarifa = "El tarifario de MetaLife 7.6 no está disponible.";
const accidentes = { MA: 0.067, DI: 0.088, TI: 0.12 } as const;
const rendimientos = {
  MXN: { optimista: [0.065, 0.12], promedio: [0.035, 0.08], conservador: [0.02, 0.02] },
  USD: { optimista: [0.04, 0.04], promedio: [0.03, 0.03], conservador: [0.02, 0.02] },
} as const;
const redondear = (v: number, potencia = 100000) => Math.round(v * potencia) / potencia;
const tasaMes = (tasa: number) => Math.floor((Math.pow(1 + tasa, 1 / 12) - 1) * 1e7) / 1e7;

function mesCalendario(fecha: string) {
  return Number(fecha.slice(0, 4)) * 12 + Number(fecha.slice(5, 7));
}

function calcularMeta(s: SolicitudMeta, tabla: CatalogoMeta): RespuestaMeta {
  const { edad, sexo, fuma, version, frecuencia, accidente, reproyeccion } = s;
  const plazo = s.plazo ?? "vitalicio";
  const pagoAnios =
    plazo === "vitalicio"
      ? 99
      : plazo === "edad60"
        ? 60 - edad
        : plazo === "edad65"
          ? 65 - edad
          : Number(plazo);
  const pesos = s.moneda === "MXN";
  const moneda = pesos ? "P" : "D";
  const perfil = `${sexo}${fuma}`;
  const sufijo = perfil.toLowerCase();
  const conFondo = s.cobertura === "A";
  const horizonte = 99 - edad;
  const cambios = reproyeccion
    ? mesCalendario(reproyeccion.cambio) - mesCalendario(reproyeccion.inicio)
    : 0;
  const mesCambio = reproyeccion ? cambios + 1 : undefined;
  const recargosNuevos = !reproyeccion || reproyeccion.inicio >= "2019-04-01";
  const regla = (id: string) => tabla.reglas[`${moneda}/${id}`];
  if (version === "c" && (!pesos || conFondo || !recargosNuevos)) {
    return { error: "MetaLife C se cotiza en pesos con cobertura B y los recargos vigentes." };
  }
  if (
    (plazo === "edad60" && edad > 55) ||
    (plazo === "edad65" && edad > 60) ||
    (s.modalidad === "meta" && pagoAnios !== 99)
  ) {
    return { error: "Revisa el plazo de pago disponible para esta cotización." };
  }
  if ((!pesos && s.porcentajeVariable > 0) || (pagoAnios === 99 && s.ahorroAnual)) {
    return {
      error:
        "El fondo variable requiere moneda nacional y el ahorro separado requiere un plazo limitado.",
    };
  }
  if (reproyeccion && (s.modalidad !== "suma" || cambios < 2 || cambios >= horizonte * 12)) {
    return {
      error:
        "Para reproyectar, usa la suma asegurada y una fecha de cambio dentro de la póliza, al menos dos meses después del inicio.",
    };
  }
  const { sumaMin, sumaMax, edadMin, edadMax } = regla("BAS");
  if (edad < edadMin || edad > edadMax) {
    return { error: `La edad debe estar entre ${edadMin} y ${edadMax} años.` };
  }
  const elegible = (id: string) => edad >= regla(id).edadMin && edad <= regla(id).edadMax;
  if (
    (s.invalidez && !elegible("EP")) ||
    (s.pagoInvalidez && !elegible("PASI")) ||
    (s.graves && !elegible("GE")) ||
    (accidente && !elegible(accidente))
  ) {
    return { error: "Revisa la edad de contratación para las coberturas adicionales." };
  }
  const agrupar = (movimientos: SolicitudMeta["aportaciones"]) =>
    new Map(movimientos.map(({ anio, monto }) => [anio, monto]));
  const aportaciones = agrupar(s.aportaciones);
  const metas = agrupar(s.metas);
  const anioMeta = s.modalidad === "meta" ? s.plazoMeta : undefined;
  const topeMeta = edad <= 45 ? 65 - edad : 20;
  if (
    aportaciones.size !== s.aportaciones.length ||
    metas.size !== s.metas.length ||
    [...aportaciones.keys(), ...metas.keys()].some((anio) => anio > horizonte) ||
    (s.retiro && (s.retiro.hasta < s.retiro.desde || s.retiro.hasta > horizonte))
  ) {
    return {
      error: "Captura un solo movimiento de cada tipo por año y revisa que esté dentro del plazo.",
    };
  }
  if (
    s.modalidad === "meta" &&
    (!anioMeta || anioMeta > topeMeta || [...metas.keys()].some((anio) => anio >= anioMeta))
  ) {
    return {
      error: `La meta principal debe quedar entre los años 10 y ${topeMeta}, después de los demás retiros puntuales.`,
    };
  }
  const retirosIniciales = s.metas
    .filter(({ anio }) => anio < 6)
    .reduce((n, { monto }) => n + monto, 0);
  if (
    retirosIniciales >
    (s.aportacionAnual ?? 0) * 5 + s.aportaciones.reduce((n, { monto }) => n + monto, 0)
  ) {
    return {
      error: "Las aportaciones adicionales no cubren los retiros de los primeros cinco años.",
    };
  }

  const tarifaPerfil = tabla.primas[version][`${moneda}/${edad}/${perfil}`];
  if (tarifaPerfil === undefined) return { error: sinTarifa };
  const tarifa =
    !conFondo && version === "actual" ? redondear(tarifaPerfil * 1.1, 100) : tarifaPerfil;
  const cargoFijo = (version === "c" ? 2000 : recargosNuevos ? 1300 : 1000) / (pesos ? 1 : 10);
  const tarifaEp = s.invalidez ? (tabla.adicionales[edad]?.[`tarEP${sufijo}`] ?? 0) : 0;
  const tarifaPasi = s.pagoInvalidez ? (tabla.adicionales[edad]?.[`tarPASI${sufijo}`] ?? 0) : 0;
  const tarifaAcc = accidente ? (tabla.adicionales[edad]?.[`tar${accidente}`] ?? 0) : 0;
  const tarifaGe = (anios: number) =>
    s.graves ? (tabla.adicionales[anios]?.[`tarGE${sufijo}`] ?? 0) : 0;
  const maxGe = regla("GE").sumaMax;
  const { pagos } = PAGOS[frecuencia];
  const anualContratado = s.importe * pagos;
  const costoInicial = (suma: number) =>
    ((suma * tarifa) / 1000 + cargoFijo) * (1 + tarifaEp / 100) +
    (suma * tarifaPasi) / 1000 +
    (suma * tarifaAcc) / 1000 +
    (Math.min(suma, maxGe) * tarifaGe(edad)) / 1000;
  let sumaInicial = reproyeccion?.sumaOriginal ?? s.importe;
  if (anioMeta) {
    const paso = pesos ? 500000 : 50000;
    const banda = Math.min(3, Math.floor((s.importe + 1) / paso));
    const perfect = tabla.perfecto?.[`${moneda}/${edad}/${banda}/${perfil}`];
    if (!perfect || !tabla.comisiones) return { error: sinTarifa };
    const tramo = anioMeta <= 15 ? [10, 15] : anioMeta <= 20 ? [15, 20] : [20, 65 - edad];
    const tarifaBaja = perfect[`tarPerfect${tramo[0]}`];
    const tarifaAlta = perfect[`tarPerfect${anioMeta > 20 ? 65 : tramo[1]}`];
    const primaPerfect =
      ((tarifaBaja + ((tarifaAlta - tarifaBaja) * (anioMeta - tramo[0])) / (tramo[1] - tramo[0])) *
        s.importe) /
      1000;
    const comisionPerfect =
      anioMeta < 15 ? "comisPerfect10" : anioMeta < 20 ? "comisPerfect15" : "comisPerfect20";
    const valorPresente = (prima: number, campo: string) =>
      Array.from({ length: 20 }, (_, i) => i + 1).reduce(
        (total, anio) =>
          total +
          ((tabla.comisiones[`${moneda}/${anio}`]?.[campo] ?? 0) * prima) / Math.pow(1.02, anio),
        0,
      );
    const sumaSegunPrima = (prima: number) =>
      Math.max(sumaMin, Math.round(prima / tarifa / 5) * 5000);
    const sumaBase = sumaSegunPrima(primaPerfect);
    const proporcion =
      valorPresente((tarifa * sumaBase) / 1000, "comisMetaLife") /
      valorPresente(primaPerfect, comisionPerfect);
    sumaInicial =
      proporcion > 1 ? sumaBase : sumaSegunPrima((tarifa * sumaBase) / 1000 / proporcion);
  }
  if (s.modalidad === "prima") {
    const pendiente = anualContratado - cargoFijo * (1 + tarifaEp / 100);
    const pendienteSinGe = pendiente - (maxGe * tarifaGe(edad)) / 1000;
    const pendienteTarifa = tarifa * (1 + tarifaEp / 100) + tarifaPasi + tarifaAcc;
    sumaInicial = (pendiente * 1000) / (pendienteTarifa + tarifaGe(edad));
    if (sumaInicial > maxGe) sumaInicial = (pendienteSinGe * 1000) / pendienteTarifa;
  }
  const errorSuma = {
    error: `La suma asegurada debe estar entre ${sumaMin.toLocaleString("es-MX")} y ${sumaMax.toLocaleString("es-MX")} ${s.moneda}.`,
  };
  if (
    !Number.isFinite(sumaInicial) ||
    (s.modalidad !== "prima" && (sumaInicial < sumaMin || sumaInicial > sumaMax)) ||
    (reproyeccion && (s.importe < sumaMin || s.importe > sumaMax))
  )
    return errorSuma;

  const anioTope = edad <= 45 ? 65 - edad + 1 : 20;
  const tasaFija = tasaMes(rendimientos[s.moneda][s.fijo][0]);
  const tasaVariable = tasaMes(rendimientos[s.moneda][s.variable][1]);
  const porcentajeVar = s.porcentajeVariable / 100;
  const vigenciaAcc = accidente ? regla(accidente).edadCan : 0;
  const recargos = tabla.recargos[version];
  const castigos = tabla.castigos[recargosNuevos ? version : "anterior"];
  const adicionales = tabla.recargosAdicionales[edad];
  const invalidez = tabla.coiAdicional[`${moneda}/${edad}`];
  const tasaAsset = 0.01 / 12;
  const proyectar = (sumaInicial: number, aporteCalculado: number) => {
    const incremento = pesos ? sumaInicial * 0.05 : 0;
    const incrementoGe = pesos ? Math.min(sumaInicial, maxGe) * 0.05 : 0;
    let suma = sumaInicial;
    let sumaGe = Math.min(sumaInicial, maxGe);
    let fondoBasico = 0;
    let fondoBaseIntereses = 0;
    let fondoFijo = 0;
    let fondoVariable = 0;
    let aportacionAcumulada = 0;
    let fondoAhorroFijo = 0;
    let fondoAhorroVar = 0;
    let ahorroAcumulado = 0;
    let insuficiente = false;
    let ultimoMesInsuficiente = horizonte * 12 - 1;
    const proyeccion: FilaMeta[] = [];
    for (let indice = 0; indice < horizonte * 12; indice++) {
      const mes = indice + 1;
      const anio = Math.floor(indice / 12) + 1;
      const edadActual = edad + anio - 1;
      const aniversario = indice % 12 === 0;
      const enCambio = !!reproyeccion && mes === mesCambio;
      if (enCambio) {
        suma = s.importe - incremento;
        fondoBasico = fondoBaseIntereses = reproyeccion.fondoBasico;
        fondoFijo = reproyeccion.fondoAdicional;
        const anterior = proyeccion[indice - 1];
        anterior.fondoBasico = fondoBasico;
        anterior.fondoFijo = fondoFijo;
      }
      if (mes > 1 && (aniversario || enCambio) && anio <= anioTope) {
        suma += incremento;
        sumaGe += incrementoGe;
      }
      const cargoPoliza = cargoFijo * (pesos ? 1 + 0.05 * (Math.min(anio, anioTope) - 1) : 1);
      const primaBasicaAnual = (tarifa * suma) / 1000 + cargoPoliza;
      const paga = indice % (12 / pagos) === 0;
      const primaBasica = paga ? redondear(primaBasicaAnual / pagos) : 0;
      const ep = s.invalidez && edadActual < regla("EP").edadCan;
      const pasi = s.pagoInvalidez && edadActual < regla("PASI").edadCan;
      const acc = !!accidente && edadActual < vigenciaAcc;
      const ge = s.graves && edadActual < regla("GE").edadCan;
      const prima =
        primaBasica +
        (ep ? redondear((tarifaEp * primaBasica) / 100) : 0) +
        (paga && pasi ? redondear((tarifaPasi * suma) / pagos / 1000) : 0) +
        (paga && acc ? redondear((tarifaAcc * suma) / pagos / 1000) : 0) +
        (paga && ge ? redondear((tarifaGe(edadActual) * sumaGe) / 1000 / pagos) : 0);
      const aportacionProgramada = (s.aportacionAnual ?? 0) + aporteCalculado;
      const aportando = mes <= 12 * pagoAnios;
      const adicional = !aportando
        ? 0
        : (paga
            ? (aportacionProgramada * (pesos ? 1 + 0.05 * (Math.min(anioTope, anio) - 1) : 1)) /
              pagos
            : 0) + (aniversario ? (aportaciones.get(anio) ?? 0) : 0);
      const adicionalVar = adicional * porcentajeVar;
      const adicionalFijo = adicional * (1 - porcentajeVar);
      const recargoPrima = recargosNuevos
        ? ((tarifa * suma) / 1000 / 12) * recargos[Math.min(anio, 10)] +
          (ep ? (primaBasicaAnual * (adicionales?.[`recargoPrimaEP${sufijo}`] ?? 0)) / 100 : 0) +
          (pasi ? (suma * (adicionales?.[`recargoPrimaPASI${sufijo}`] ?? 0)) / 1000 : 0) +
          (acc ? (suma * (adicionales?.[`recargoPrima${accidente}`] ?? 0)) / 1000 : 0) +
          (ge
            ? (sumaGe * (tabla.recargosAdicionales[edadActual]?.[`recargoPrimaGE${sufijo}`] ?? 0)) /
              1000
            : 0)
        : prima * 0.12;
      const cargo = recargosNuevos ? cargoPoliza / 12 : redondear(cargoFijo / 12);
      const disponible = fondoBasico + prima - recargoPrima - cargo;
      const cargoAsset = redondear(disponible * tasaAsset);
      const neto = disponible - cargoAsset;
      const riesgo = conFondo ? suma - neto : suma;
      const coiBas = redondear(
        (tabla.coi[edadActual][`coiBAS${sufijo}`] / 12) * tabla.seleccion[anio].facSelMax + 1e-7,
      );
      const coi =
        (coiBas * riesgo) / 1000 +
        (ep ? ((invalidez?.[`coiEP${sufijo}`] ?? 0) * primaBasicaAnual) / 100 : 0) +
        (pasi ? ((invalidez?.[`coiPASI${sufijo}`] ?? 0) * suma) / 1000 : 0) +
        (accidente && edadActual < regla("DI").edadCan
          ? (accidentes[accidente] * suma) / 1000
          : 0) +
        (ge
          ? ((tabla.coiAdicional[`${moneda}/${edadActual}`]?.[`coiGE${sufijo}`] ?? 0) * sumaGe) /
            1000
          : 0);
      const interes =
        (fondoBaseIntereses + prima - recargoPrima - cargo - cargoAsset - coi) * tasaFija;
      fondoBasico = neto - coi + interes;
      fondoBaseIntereses = fondoBasico;
      const antesAssetFijo = fondoFijo + adicionalFijo;
      const antesAssetVar = fondoVariable + adicionalVar;
      fondoFijo =
        antesAssetFijo - (recargosNuevos ? 0 : redondear(antesAssetFijo * redondear(tasaAsset)));
      fondoVariable =
        antesAssetVar - (recargosNuevos ? 0 : redondear(antesAssetVar * redondear(tasaAsset)));
      fondoFijo += fondoFijo * tasaFija;
      fondoVariable += fondoVariable * tasaVariable;
      const ahorro = paga ? (s.ahorroAnual ?? 0) / pagos : 0;
      fondoAhorroFijo = (fondoAhorroFijo + ahorro * (1 - porcentajeVar)) * (1 + tasaFija);
      fondoAhorroVar = (fondoAhorroVar + ahorro * porcentajeVar) * (1 + tasaVariable);
      if (!aportando) {
        const deFijo = Math.min(prima, fondoFijo);
        const pendiente = prima - deFijo;
        fondoFijo -= deFijo;
        if (pendiente > 0) {
          if (pendiente >= fondoVariable) insuficiente = true;
          fondoVariable -= Math.min(pendiente, fondoVariable);
        }
      }
      let porRetirar =
        mes % 12 === 0
          ? (metas.get(anio) ?? 0) +
            (s.retiro && anio >= s.retiro.desde && anio <= s.retiro.hasta ? s.retiro.monto : 0)
          : 0;
      const retiroFijo = Math.min(fondoFijo, porRetirar);
      fondoFijo -= retiroFijo;
      porRetirar -= retiroFijo;
      const retiroVar = Math.min(fondoVariable, porRetirar);
      fondoVariable -= retiroVar;
      porRetirar -= retiroVar;
      const retiroBasico = Math.min(porRetirar, fondoBasico * 0.95);
      fondoBasico =
        porRetirar <= fondoBasico * 0.95 ? fondoBasico - porRetirar : fondoBasico * 0.05;
      if (conFondo) suma = Math.max(suma - retiroBasico, fondoBasico > 0 ? fondoBasico * 1.05 : 0);
      const sumaTotal = suma;
      if (conFondo && s.metas.length + (anioMeta ? 1 : 0) <= 1 && !s.retiro) {
        suma = Math.max(sumaMin, suma);
      }
      if (fondoBasico < 0) insuficiente = true;
      if (insuficiente) ultimoMesInsuficiente = mes;
      const castigo = castigos[Math.min(anio, 20)];
      const efectivoBasico = fondoBasico - fondoBasico * castigo.porCastigoBase;
      const efectivoFijo = fondoFijo - fondoFijo * castigo.porCastigoAdi;
      const efectivoVar = fondoVariable - fondoVariable * castigo.porCastigoAdi;
      const aportacion = prima + adicionalFijo + adicionalVar;
      if (aportando) {
        aportacionAcumulada += aportacion;
        ahorroAcumulado += ahorro;
      }
      proyeccion.push({
        mes,
        prima,
        aportacion,
        aportacionAcumulada: aportacionAcumulada + ahorroAcumulado,
        fondoBasico,
        fondoFijo,
        fondoVariable,
        efectivoBasico,
        rescate: efectivoBasico + efectivoFijo + efectivoVar + fondoAhorroFijo + fondoAhorroVar,
        suma: sumaTotal,
        fallecimiento:
          suma +
          (conFondo ? 0 : fondoBasico) +
          fondoFijo +
          efectivoVar +
          fondoAhorroFijo +
          fondoAhorroVar,
        retiro: retiroFijo + retiroVar + retiroBasico,
      });
    }
    return { proyeccion, insuficiente, ultimoMesInsuficiente };
  };

  let primaAdicional = 0;
  let resultado = proyectar(sumaInicial, primaAdicional);
  const fondoFinal = () => {
    const fila = resultado.proyeccion.at(-1)!;
    return fila.fondoFijo + fila.fondoVariable;
  };
  const rescateMeta = () => (anioMeta ? resultado.proyeccion[anioMeta * 12 - 1].rescate : 0);
  if (anioMeta && rescateMeta() < s.importe) {
    const primaBase = (tarifa * sumaInicial) / 1000 + cargoFijo;
    for (let i = 1; i <= 20 && rescateMeta() < s.importe; i++) {
      primaAdicional = primaBase * i;
      resultado = proyectar(sumaInicial, primaAdicional);
    }
    if (rescateMeta() < s.importe)
      return { error: "No se encontró una aportación suficiente para esta meta." };
    let inferior = 0;
    let superior = primaAdicional;
    for (let i = 0; i < 50; i++) {
      primaAdicional = (inferior + superior) / 2;
      resultado = proyectar(sumaInicial, primaAdicional);
      const brecha = rescateMeta() - s.importe;
      if (brecha >= 0 && brecha / s.importe < 1e-7) break;
      if (brecha < 0) inferior = primaAdicional;
      else superior = primaAdicional;
    }
  } else if (pagoAnios < 99 && s.modalidad === "prima") {
    let inferior = 0;
    let superior = 2 * sumaInicial;
    for (let i = 0; i < 50; i++) {
      sumaInicial = (inferior + superior) / 2;
      primaAdicional = anualContratado - costoInicial(sumaInicial);
      resultado = proyectar(sumaInicial, primaAdicional);
      const fila = conFondo
        ? resultado.proyeccion.at(-1)!
        : resultado.proyeccion[resultado.ultimoMesInsuficiente - 1];
      const fondo = fila.fondoFijo + fila.fondoVariable;
      if (fondo > 0 && fondo < 1000) break;
      if (fondo <= 0) superior = sumaInicial;
      else inferior = sumaInicial;
    }
    if (primaAdicional >= 0.01 && primaAdicional < 1) {
      primaAdicional = 0;
      resultado = proyectar(sumaInicial, primaAdicional);
    }
  } else if (pagoAnios < 99 && resultado.insuficiente) {
    const primaBase = (tarifa * sumaInicial) / 1000 + cargoFijo;
    for (let i = 1; i <= 10 && fondoFinal() <= 0; i++) {
      primaAdicional = primaBase * i;
      resultado = proyectar(sumaInicial, primaAdicional);
    }
    if (fondoFinal() <= 0)
      return { error: "No se encontró un fondo suficiente para el plazo solicitado." };
    let inferior = 0;
    let superior = primaAdicional;
    for (let i = 0; i < 50; i++) {
      primaAdicional = (inferior + superior) / 2;
      resultado = proyectar(sumaInicial, primaAdicional);
      const fondo = fondoFinal();
      if (fondo > 0 && fondo < 1000) break;
      if (fondo <= 0) inferior = primaAdicional;
      else superior = primaAdicional;
    }
  }
  if (sumaInicial < sumaMin || sumaInicial > sumaMax || primaAdicional < 0) return errorSuma;
  const primaAnual = costoInicial(sumaInicial);
  return {
    sumaInicial,
    primaAnual,
    primaPago:
      (primaAnual + primaAdicional + (s.aportacionAnual ?? 0) + (s.ahorroAnual ?? 0)) / pagos,
    pagoAnios,
    primaAdicional,
    rescateMeta: anioMeta ? rescateMeta() : undefined,
    mesCambio,
    proyeccion: resultado.proyeccion,
  };
}

export async function cotizarMetaLife(solicitud: SolicitudMeta): Promise<RespuestaMeta> {
  const db = obtenerConexionMetLife();
  if (!db) return { error: sinTarifa };
  try {
    const { rows } = await db.query<{ datos: CatalogoMeta }>(
      "SELECT datos FROM metlife_cotizador.metalife_tarifarios WHERE version = $1",
      ["7.6"],
    );
    return rows[0] ? calcularMeta(solicitud, rows[0].datos) : { error: sinTarifa };
  } catch (error) {
    const codigo =
      typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    console.error("Consulta de MetaLife falló", codigo);
    return { error: sinTarifa };
  }
}
