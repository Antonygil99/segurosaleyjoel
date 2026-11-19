import { obtenerConexionMetLife } from "./metlife-conexion.server";
import { coaseguroMinimo, type OpcionesGmm, type SolicitudGmm } from "./metlife-gmm";
import { totalesSalud } from "./metlife-salud.server";
import type { RespuestaSalud } from "./metlife-salud";

type Zona = "A" | "B" | "C";
type Plane = { idPlan: number; Plan: string };
type Amount = { SumaAsegurada: number; FacNal: number; FacExt: number };
type Age = { EdadIni: number; EdadFin: number };
type DatosGmm = {
  gmPlanes: Plane[];
  gmMunicipios: (OpcionesGmm["municipios"][number] & { Region: number; Zona: Zona })[];
  gmFactoresSuma: Amount[];
  gmFactoresDeducible: (OpcionesGmm["deducibles"][number] & { FactorDeducible: number })[];
  gmFactoresDeducibleExt: { Deducible: number; FactorDeducibleExt: number }[];
  gmFactoresCoasNal: (OpcionesGmm["coaseguros"][number] & { FactorCoasNal: number })[];
  gmIncrementoTabulador: { IncTabulador: number; FacIncTabulador: number }[];
  gmSumaMA: { SumaMA: number }[];
  gmSumaRD: { SumaRD: number }[];
  gmSumaUG: { SumaUG: number }[];
  gmFactoresRegion: { idPlan: number; Region: number; FactorRegion: number }[];
  gmTarifaNacional: { Region: number; Edad: number; Hombre: number; Mujer: number }[];
  gmTarifaExtranjero: ({ Region: number; Edad: number } & Record<
    `${"Hombre" | "Mujer"}Zona${Zona}`,
    number
  >)[];
  gmTarifaIncrementoSuma: { Zona: Zona; TarIncSumaNal: number; TarIncSumaExt: number }[];
  gmTarifaRentaDiaria: (Age & { TarRentaHombres: number; TarRentaMujeres: number })[];
  gmTarifaUltimosGastos: (Age & { TarUltimosGastos: number })[];
  gmOtrasTarifas: (Record<`TarEmExt${Zona}` | `TarEstExt${Zona}`, number> & {
    AsistenciaViajes: number;
    EnfCatExtranjero: number;
    TarFranjaFronteriza: number;
    ReduccionDedAcc: number;
    TarVision: number;
    TarMuerteAcc: number;
    TarConvInstitucional: number;
    DerPol: number;
    MaxDerPol: number;
    SumaMinIncSuma: number;
  })[];
  gmMetDental: { TarMetDental: number; TarMetDentalPlus: number }[];
  gmEdadMaxima: {
    edadMaxBasico: number;
    edadMaxAccidentes: number;
    edadMaxUG: number;
    edadMaxRD: number;
  }[];
  gmRecargoFP: { FormaPago: string; RecargoFP: number; NumPagos: number }[];
  gmDesCoberturas: { idPlan: number; Titulo: string }[];
};

const SIN_TARIFA = "El tarifario MédicaLife 7.6 no está disponible para esta combinación.";

async function leerGmm(vigencia: SolicitudGmm["vigencia"]): Promise<DatosGmm | undefined> {
  const pool = obtenerConexionMetLife();
  if (!pool) return;
  try {
    const datos = await pool.query<{ datos: DatosGmm }>(
      "SELECT datos FROM metlife_cotizador.salud_tarifarios WHERE version = $1 AND producto = $2",
      ["7.6", "MedicaLife/" + vigencia],
    );
    return datos.rows[0]?.datos;
  } catch (error) {
    const codigo =
      typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    console.error("Consulta del tarifario MédicaLife falló", codigo);
  }
}

export async function opcionesGmm(
  vigencia: SolicitudGmm["vigencia"],
): Promise<OpcionesGmm | { error: string }> {
  const datos = await leerGmm(vigencia);
  if (!datos) return { error: SIN_TARIFA };
  return {
    planes: datos.gmPlanes,
    municipios: datos.gmMunicipios.map(({ idEstado, Estado, Municipio, Fronterizo }) => ({
      idEstado,
      Estado,
      Municipio,
      Fronterizo,
    })),
    sumas: datos.gmFactoresSuma.map((fila) => fila.SumaAsegurada),
    deducibles: datos.gmFactoresDeducible.map(
      ({ idPlan, Producto, Deducible, DedExtMin, DedExtMax }) => ({
        idPlan,
        Producto,
        Deducible,
        DedExtMin,
        DedExtMax,
      }),
    ),
    deduciblesExt: datos.gmFactoresDeducibleExt.map(({ Deducible }) => Deducible),
    coaseguros: datos.gmFactoresCoasNal.map(({ CoasMin, Coaseguro }) => ({ CoasMin, Coaseguro })),
    tabuladores: datos.gmIncrementoTabulador.map(({ IncTabulador }) => IncTabulador),
    muerteAccidental: datos.gmSumaMA.map(({ SumaMA }) => SumaMA),
    ultimosGastos: datos.gmSumaUG.map(({ SumaUG }) => SumaUG),
    rentaDiaria: datos.gmSumaRD.map(({ SumaRD }) => SumaRD),
  };
}

export function calcularGmm(solicitud: SolicitudGmm, datos: DatosGmm): RespuestaSalud {
  const { plan, municipio, conversion, asegurados, beneficios } = solicitud;
  const esNueva = solicitud.vigencia === "nueva" || solicitud.vigencia === "campana";
  const internacional = plan === 0;
  const geo = datos.gmMunicipios[municipio];
  const planSel = datos.gmPlanes[plan];
  const edadMax = datos.gmEdadMaxima[0];
  const dental = datos.gmMetDental[0];
  const otras = datos.gmOtrasTarifas[0];
  if (!geo || !planSel || !edadMax || !dental || !otras) return { error: SIN_TARIFA };
  if (planSel.idPlan === 4 && ![9, 11, 15, 19].includes(geo.idEstado)) {
    return {
      error: "El plan Práctico aplica en Ciudad de México, Estado de México, Jalisco y Nuevo León.",
    };
  }
  if (
    esNueva &&
    conversion === "ninguna" &&
    asegurados.some(
      ({ edad }) => edad > edadMax.edadMaxBasico || (edad >= 65 && solicitud.suma > 7500),
    )
  ) {
    return { error: "La edad o la suma asegurada supera el límite de esta póliza nueva." };
  }
  if (beneficios.includes("fronteriza") && (internacional || geo.Fronterizo !== "S")) {
    return {
      error: "La cobertura de franja fronteriza no aplica para el plan y municipio seleccionados.",
    };
  }
  if (beneficios.includes("incremento") && solicitud.suma < otras.SumaMinIncSuma) {
    return { error: "La suma asegurada es insuficiente para contratar el incremento." };
  }

  const suma = datos.gmFactoresSuma.find(({ SumaAsegurada }) => SumaAsegurada === solicitud.suma);
  const deducible = datos.gmFactoresDeducible.find(
    (fila) =>
      fila.Deducible === solicitud.deducible &&
      fila.idPlan === plan &&
      fila.Producto === (conversion === "grupo" ? 1 : 0),
  );
  const deducibleExt =
    deducible &&
    datos.gmFactoresDeducibleExt
      .slice(deducible.DedExtMin, deducible.DedExtMax + 1)
      .find(({ Deducible }) => Deducible === solicitud.deducibleExt);
  const coaseguro = datos.gmFactoresCoasNal.find(
    ({ CoasMin, Coaseguro }) =>
      CoasMin === coaseguroMinimo(solicitud.vigencia, plan) && Coaseguro === solicitud.coaseguro,
  );
  const tabulador = datos.gmIncrementoTabulador.find(
    ({ IncTabulador }) => IncTabulador === solicitud.tabulador,
  );
  const frecuencia = datos.gmRecargoFP.find(({ FormaPago }) => FormaPago === solicitud.frecuencia);
  if (
    !suma ||
    !deducible ||
    (internacional && !deducibleExt) ||
    !coaseguro ||
    !tabulador ||
    !frecuencia
  ) {
    return { error: "Revisa la suma asegurada, los deducibles, el coaseguro y la forma de pago." };
  }
  if (
    (solicitud.muerteAccidental &&
      !datos.gmSumaMA.some(({ SumaMA }) => SumaMA === solicitud.muerteAccidental)) ||
    (solicitud.rentaDiaria &&
      !datos.gmSumaRD.some(({ SumaRD }) => SumaRD === solicitud.rentaDiaria)) ||
    (solicitud.ultimosGastos &&
      !datos.gmSumaUG.some(({ SumaUG }) => SumaUG === solicitud.ultimosGastos))
  ) {
    return { error: "Selecciona montos válidos para las coberturas complementarias." };
  }

  const region = datos.gmFactoresRegion.find(
    (fila) => fila.idPlan === plan && fila.Region === geo.Region,
  )?.FactorRegion;
  const incremento = datos.gmTarifaIncrementoSuma.find(({ Zona }) => Zona === geo.Zona);
  const incl = (opcion: SolicitudGmm["beneficios"][number]) => beneficios.includes(opcion);
  const primas: number[] = [];
  for (const { sexo, edad } of asegurados) {
    const campo = sexo === "M" ? "Hombre" : "Mujer";
    const base = datos.gmTarifaNacional.find(
      (fila) => fila.Region === geo.Region && fila.Edad === edad,
    )?.[campo];
    const ext = datos.gmTarifaExtranjero.find(
      (fila) => fila.Region === geo.Region && fila.Edad === edad,
    )?.[`${campo}Zona${geo.Zona}`];
    if (base === undefined || region === undefined || (internacional && ext === undefined))
      return { error: SIN_TARIFA };
    const nacional =
      base *
      suma.FacNal *
      deducible.FactorDeducible *
      coaseguro.FactorCoasNal *
      region *
      tabulador.FacIncTabulador;
    const extranjero =
      internacional && deducibleExt && ext !== undefined
        ? ext * suma.FacExt * deducibleExt.FactorDeducibleExt * coaseguro.FactorCoasNal
        : 0;
    let prima = nacional + extranjero + dental.TarMetDental + otras.AsistenciaViajes;
    if (incl("dental")) prima += dental.TarMetDentalPlus;
    if (incl("vision")) prima += otras.TarVision;
    if (incl("emergencia")) prima += otras[`TarEmExt${geo.Zona}`];
    if (incl("catastroficas")) prima += otras.EnfCatExtranjero;
    if (incl("reduccion")) prima += otras.ReduccionDedAcc;
    if (incl("fronteriza")) prima += otras.TarFranjaFronteriza * nacional;
    if (conversion === "institucional") prima += otras.TarConvInstitucional * nacional;
    if (incl("incremento") && incremento)
      prima += nacional * (internacional ? incremento.TarIncSumaNal : incremento.TarIncSumaExt);
    if (incl("estudiantes")) prima += otras[`TarEstExt${geo.Zona}`];
    if (solicitud.rentaDiaria && edad > 0 && edad <= edadMax.edadMaxRD) {
      const fila = datos.gmTarifaRentaDiaria.find(
        ({ EdadIni, EdadFin }) => edad >= EdadIni && edad <= EdadFin,
      );
      prima +=
        (fila?.[sexo === "M" ? "TarRentaHombres" : "TarRentaMujeres"] ?? 0) * solicitud.rentaDiaria;
    }
    if (solicitud.ultimosGastos && edad <= edadMax.edadMaxUG) {
      const fila = datos.gmTarifaUltimosGastos.find(
        ({ EdadIni, EdadFin }) => edad >= EdadIni && edad <= EdadFin,
      );
      prima += ((fila?.TarUltimosGastos ?? 0) * solicitud.ultimosGastos) / 1000;
    }
    if (solicitud.muerteAccidental && edad <= edadMax.edadMaxAccidentes) {
      prima += (otras.TarMuerteAcc * solicitud.muerteAccidental) / 1000;
    }
    primas.push(prima);
  }

  return {
    ...totalesSalud(
      primas,
      frecuencia,
      Math.min(asegurados.length, otras.MaxDerPol) * otras.DerPol,
      true,
    ),
    coberturas: [],
  };
}

export async function cotizarGmm(solicitud: SolicitudGmm) {
  const datos = await leerGmm(solicitud.vigencia);
  return datos ? calcularGmm(solicitud, datos) : { error: SIN_TARIFA };
}
