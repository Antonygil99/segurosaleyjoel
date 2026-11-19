import { obtenerConexionMetLife } from "./metlife-conexion.server";
import { plazosDe, type SolicitudMetLife } from "./metlife";
import {
  calcularPrima,
  NO_DISPONIBLE,
  perfilTarifa,
  type FactorGarantizado,
  type RespuestaCotizacion,
  type Tarifario,
} from "./metlife-vida.server";

export type { RespuestaCotizacion } from "./metlife-vida.server";

export async function cotizarMetLife(solicitud: SolicitudMetLife): Promise<RespuestaCotizacion> {
  if (!plazosDe(solicitud).includes(solicitud.plazo)) {
    return { error: "Selecciona un plazo disponible para el plan y la moneda." };
  }

  const pool = obtenerConexionMetLife();
  if (!pool) return { error: NO_DISPONIBLE };

  try {
    const { rows } = await pool.query<{ datos: Tarifario }>(
      `SELECT datos
       FROM metlife_cotizador.vida_tarifarios
       WHERE version = $1 AND plan = $2 AND moneda = $3 AND plazo = $4`,
      ["7.6", solicitud.plan, solicitud.moneda, solicitud.plazo],
    );
    const datos = rows[0]?.datos;
    if (!datos) return { error: NO_DISPONIBLE };
    let factores: FactorGarantizado[] | undefined;
    if (solicitud.proyeccion) {
      const perfil = perfilTarifa(solicitud, datos);
      if (!perfil?.clave.VG) return { error: NO_DISPONIBLE };
      const valores = await pool.query<{ factores: FactorGarantizado[] }>(
        `SELECT factores FROM metlife_cotizador.vida_valores
         WHERE version = $1 AND codigo = $2 AND edad = $3 AND sexo = $4 AND fuma = $5`,
        ["7.6", perfil.clave.VG, perfil.edadTarifa, perfil.sexoTarifa, perfil.fumaTarifa],
      );
      factores = valores.rows[0]?.factores ?? [];
    }
    return calcularPrima(solicitud, datos, factores);
  } catch (error) {
    const codigo =
      typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    console.error("Consulta del tarifario MetLife falló", codigo);
    return { error: NO_DISPONIBLE };
  }
}
