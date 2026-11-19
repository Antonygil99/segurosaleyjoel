import { PAGOS } from "./metlife";
import { obtenerConexionMetLife } from "./metlife-conexion.server";
import {
  LIQUIDEZ_FLEXI,
  type FilaFlexi,
  type LiquidezFlexi,
  type RespuestaFlexi,
  type SolicitudFlexi,
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
  const cuentas = inversiones.map((cuenta) => ({
    ...cuenta,
    fondo: 0,
    tasa: Math.pow(1 + datos.fondos[cuenta.liquidez], 1 / 12) - 1,
  }));
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
      inversiones: cuentas.map((cuenta) => {
        const aporte =
          mes === 1
            ? (cuenta.inicial ?? 0)
            : (cuenta.mensual ?? 0) +
              (indice % 3 === 0 ? (cuenta.trimestral ?? 0) : 0) +
              (indice % 12 === 0 ? (cuenta.anual ?? 0) : 0);
        const saldo = cuenta.fondo + aporte;
        cuenta.fondo = saldo + saldo * cuenta.tasa;
        return { liquidez: cuenta.liquidez, aportacion: aporte, fondo: cuenta.fondo };
      }),
    };
  });
  return { primaAnual, primaPago, proyeccion };
}

export async function cotizarFlexiLife(solicitud: SolicitudFlexi): Promise<RespuestaFlexi> {
  const db = obtenerConexionMetLife();
  if (!db) return { error: sinTarifa };
  try {
    const { rows } = await db.query<{ datos: TarifarioFlexi }>(
      "SELECT datos FROM metlife_cotizador.flexi_tarifarios WHERE version = $1 AND plan = $2",
      ["7.6", 31],
    );
    return rows[0] ? calcular(solicitud, rows[0].datos) : { error: sinTarifa };
  } catch (error) {
    const codigo =
      typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    console.error("Consulta de FlexiLife falló", codigo);
    return { error: sinTarifa };
  }
}
