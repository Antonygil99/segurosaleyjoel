import { obtenerConexionMetLife } from "./metlife-conexion.server";
import { type SolicitudSalud, type RespuestaSalud } from "./metlife-salud";

type Frecuencia = { FormaPago: string; RecargoFP: number; NumPagos: number };
type DatosPrimordial = {
  primas: { Edad: number; Prima: number; PrimaAdi: number }[];
  edades: {
    edadMinNueva: number;
    EdadMaxNueva: number;
    EdadMinRenov: number;
    edadMaxRenov: number;
  };
  padecimientos: {
    Padecimiento: string;
    SumaPadecimiento: number;
    SumaAdicional: number;
    PeriodoEspera: string;
  }[];
  pagos: Frecuencia[];
};
type DatosMetPlus = {
  primas: {
    Edad: number;
    BasicoHombre: number;
    BasicoMujer: number;
    Mujer: number;
    PlusHombre: number;
    PlusMujer: number;
    FamiliarHombre: number;
    FamiliarMujer: number;
  }[];
  paquetes: {
    Paquete: string;
    idCob: number;
    Cobertura: string;
    Suma: number;
    Deducible: number;
  }[];
  pagos: Frecuencia[];
};
const SIN_TARIFA = "El tarifario 7.6 no está disponible para esta combinación.";

export function calcularSalud(
  solicitud: SolicitudSalud,
  datos: DatosPrimordial | DatosMetPlus,
): RespuestaSalud {
  const { asegurados } = solicitud;
  if (
    asegurados.filter((persona) => persona.parentesco === "titular").length !== 1 ||
    asegurados.filter((persona) => persona.parentesco === "conyuge").length > 1
  ) {
    return { error: "Incluye una persona titular y, si aplica, una sola persona como cónyuge." };
  }
  const frecuencia = datos.pagos.find((item) => item.FormaPago === solicitud.frecuencia);
  if (!frecuencia) return { error: SIN_TARIFA };
  const primas: number[] = [];
  let coberturas: Exclude<RespuestaSalud, { error: string }>["coberturas"];
  if (solicitud.producto === "Primordial" && "edades" in datos) {
    const { edades } = datos;
    const min = solicitud.renovacion ? edades.EdadMinRenov : edades.edadMinNueva;
    const max = solicitud.renovacion ? edades.edadMaxRenov : edades.EdadMaxNueva;
    for (const { edad, parentesco } of asegurados) {
      if (edad < min || edad > max || parentesco === "otro") {
        return {
          error: `En Primordial Familiar, la edad debe estar entre ${min} y ${max} años y el parentesco debe corresponder al plan.`,
        };
      }
      const fila = datos.primas.find((item) => item.Edad === edad);
      if (!fila) return { error: SIN_TARIFA };
      primas.push(solicitud.ampliada ? fila.PrimaAdi : fila.Prima);
    }
    coberturas = datos.padecimientos.map((item) => ({
      grupo: "Plan Familiar",
      nombre: item.Padecimiento,
      monto: solicitud.ampliada ? item.SumaAdicional : item.SumaPadecimiento,
      espera: item.PeriodoEspera,
    }));
  } else if (solicitud.producto === "MetPlus" && "paquetes" in datos) {
    for (const persona of asegurados) {
      const { edad, sexo, parentesco, mujer, plus, familiar } = persona;
      if (
        edad > 69 ||
        (parentesco === "hijo" && edad > 24) ||
        parentesco === "madre" ||
        parentesco === "padre"
      ) {
        return {
          error:
            "En MetPlus, la edad máxima es de 69 años y de 24 para hijos. Selecciona un parentesco del plan.",
        };
      }
      if (sexo === "M" && mujer)
        return { error: "El paquete Mujer solo está disponible para el perfil femenino." };
      const fila = datos.primas.find((item) => item.Edad === edad);
      if (!fila) return { error: SIN_TARIFA };
      const accidente = (2.3387302 * solicitud.suma) / 1000;
      const basica = sexo === "M" ? fila.BasicoHombre : fila.BasicoMujer;
      const primaMujer = mujer ? fila.Mujer : 0;
      const primaPlus = plus ? (sexo === "M" ? fila.PlusHombre : fila.PlusMujer) : 0;
      const primaFamiliar = familiar
        ? sexo === "M"
          ? fila.FamiliarHombre
          : fila.FamiliarMujer
        : 0;
      primas.push(accidente + basica + primaMujer + primaPlus + primaFamiliar + 158);
    }
    const grupos = new Set(["Basico"]);
    if (asegurados.some(({ mujer }) => mujer)) grupos.add("Mujer");
    if (asegurados.some(({ plus }) => plus)) grupos.add("Plus");
    if (asegurados.some(({ familiar }) => familiar)) grupos.add("Familiar");
    coberturas = datos.paquetes
      .filter((item) => grupos.has(item.Paquete))
      .map((item) => ({
        grupo: item.Paquete === "Basico" ? "Básico" : item.Paquete,
        nombre: item.Cobertura,
        monto: item.Paquete === "Basico" && item.idCob <= 3 ? solicitud.suma : item.Suma,
        deducible: item.Deducible,
      }));
  } else {
    return { error: SIN_TARIFA };
  }

  return { ...totalesSalud(primas, frecuencia, Math.min(asegurados.length, 3) * 100), coberturas };
}
export function totalesSalud(
  primas: number[],
  frecuencia: Frecuencia,
  derecho: number,
  anualIncluyeIva = false,
) {
  const neta = primas.reduce((a, b) => a + b, 0);
  const recargo = neta * frecuencia.RecargoFP;

  const subtotal = neta + recargo + derecho;
  const iva = subtotal * 0.16;
  const total = subtotal + iva;
  const pagos = frecuencia.NumPagos;
  const primerPago =
    pagos > 1
      ? Math.round(((neta + recargo) / pagos + derecho) * 1.16 * 100) / 100
      : anualIncluyeIva
        ? total
        : subtotal;
  const subsecuente = pagos > 1 ? (total - primerPago) / (pagos - 1) : 0;

  return { primas, neta, recargo, derecho, iva, total, primerPago, subsecuente, pagos };
}

export async function cotizarSalud(solicitud: SolicitudSalud): Promise<RespuestaSalud> {
  const pool = obtenerConexionMetLife();
  if (!pool) return { error: SIN_TARIFA };
  try {
    const respuesta = await pool.query<{ datos: DatosPrimordial | DatosMetPlus }>(
      "SELECT datos FROM metlife_cotizador.salud_tarifarios WHERE version = $1 AND producto = $2",
      ["7.6", solicitud.producto],
    );
    const datos = respuesta.rows[0]?.datos;
    return datos ? calcularSalud(solicitud, datos) : { error: SIN_TARIFA };
  } catch (error) {
    const codigo =
      typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    console.error("Consulta del tarifario de salud MetLife falló", codigo);
    return { error: SIN_TARIFA };
  }
}
