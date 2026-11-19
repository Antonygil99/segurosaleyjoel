import { Pool } from "pg";
import { PAGOS, plazosDe, type SolicitudMetLife } from "./metlife";

interface Tarifa {
  prima: number;
  banda: number;
  edad: number;
  sexo: string;
  fuma: string;
  plan: string;
}

export interface Tarifario {
  edadMin: number;
  edadMax: number;
  sumaMin: number;
  recFijo: number;
  claves: Record<string, { BAS: string; tarifaSH: number; claveBanda: number }>;
  bandas: { idBanda: number; sumaInferior: number; sumaSuperior: number }[];
  recargos: Record<string, number>;
  primas: Tarifa[];
}

type Cotizacion = {
  basica: number;
  cargoFijo: number;
  primaAnual: number;
  recargo: number;
  pago: number;
  pagos: number;
};

export type RespuestaCotizacion = { cotizacion: Cotizacion } | { error: string };

let pool: Pool | undefined;

const NO_DISPONIBLE = "El tarifario 7.6 no está disponible para esta combinación.";

export function calcularPrima(solicitud: SolicitudMetLife, datos: Tarifario): RespuestaCotizacion {
  const { edad, sexo, fuma, suma, plazo } = solicitud;
  if (edad < datos.edadMin || edad > datos.edadMax) {
    return { error: `La edad debe estar entre ${datos.edadMin} y ${datos.edadMax} años.` };
  }
  if (suma < datos.sumaMin) {
    return {
      error: `La suma asegurada mínima es ${datos.sumaMin.toLocaleString("es-MX")} ${solicitud.moneda}.`,
    };
  }

  const clave = datos.claves[solicitud.plan === 1 ? "NA" : fuma];
  if (!clave) return { error: NO_DISPONIBLE };

  const banda =
    clave.claveBanda === 1
      ? datos.bandas.find(
          ({ sumaInferior, sumaSuperior }) =>
            suma >= sumaInferior && (sumaSuperior === 0 || suma <= sumaSuperior),
        )?.idBanda
      : 0;
  const reduccion = (sexo === "F" ? 3 : 0) + (fuma === "N" ? 2 : 0);
  const tarifaPorPerfil = clave.tarifaSH === 1;
  const edadTarifa =
    tarifaPorPerfil || plazo === 65 ? edad : Math.max(datos.edadMin, edad - reduccion);

  const tarifa = datos.primas.find(
    (fila) =>
      fila.plan === clave.BAS &&
      fila.banda === banda &&
      fila.edad === edadTarifa &&
      fila.sexo === (tarifaPorPerfil ? sexo : "M") &&
      fila.fuma === (tarifaPorPerfil ? fuma : "S"),
  );
  const frecuencia = PAGOS[solicitud.frecuencia];
  const tasa = datos.recargos[frecuencia.id];

  if (!tarifa || tarifa.prima <= 0 || !Number.isFinite(tasa)) {
    return { error: NO_DISPONIBLE };
  }

  // CalculosVI.CalculaPrimas y CoberturasController.CalculaPrimaFormaPago (v7.6).
  const basica = (suma * tarifa.prima) / 1000;
  const primaAnual = basica + datos.recFijo;
  const recargo = primaAnual * tasa;
  const pago = (primaAnual + recargo) / frecuencia.pagos;
  return {
    cotizacion: {
      basica,
      cargoFijo: datos.recFijo,
      primaAnual,
      recargo,
      pago,
      pagos: frecuencia.pagos,
    },
  };
}

export async function cotizarMetLife(solicitud: SolicitudMetLife): Promise<RespuestaCotizacion> {
  if (!plazosDe(solicitud).includes(solicitud.plazo)) {
    return { error: "Selecciona un plazo disponible para el plan y la moneda." };
  }

  if (!process.env.DATABASE_URL) return { error: NO_DISPONIBLE };
  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });

  try {
    const { rows } = await pool.query<{ datos: Tarifario }>(
      `SELECT datos
       FROM metlife_cotizador.tarifarios
       WHERE version = $1 AND plan = $2 AND moneda = $3 AND plazo = $4`,
      ["7.6", solicitud.plan, solicitud.moneda, solicitud.plazo],
    );
    return rows[0] ? calcularPrima(solicitud, rows[0].datos) : { error: NO_DISPONIBLE };
  } catch (error) {
    const codigo =
      typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    console.error("Consulta del tarifario MetLife falló", codigo);
    return { error: NO_DISPONIBLE };
  }
}
