import { obtenerConexionMetLife } from "./metlife-conexion.server";
import { PAGOS } from "./metlife";
import { proyectarMet4U, type PerfilProyeccionMet4U } from "./metlife-met4u-proyeccion.server";
import {
  COBERTURAS_MET4U,
  SUMA_MINIMA_MET4U,
  type CoberturaMet4U,
  type RespuestaMet4U,
  type SolicitudMet4U,
} from "./metlife-met4u";

type TarifasMet4U = {
  reglas: {
    cobertura: CoberturaMet4U;
    edadMin: number;
    edadMax: number;
    sumaMin: number;
    sumaMax: number;
  }[];
  tarifas: (Pick<SolicitudMet4U, "edad" | "plazo" | "sexo" | "fuma"> &
    Record<CoberturaMet4U, number>)[];
};

const SIN_TARIFA = "El tarifario Met4U 7.6 no está disponible para esta cotización.";
const adicionales = ["CAN", "DIA", "GRA"] as const;
const redondear = (valor: number) => Math.round(valor * 100) / 100;

function calcularMet4U(
  solicitud: SolicitudMet4U,
  datos: TarifasMet4U,
  perfil?: PerfilProyeccionMet4U,
): RespuestaMet4U {
  const { plazo, edad, sexo, fuma, suma, frecuencia, ahorroAnual = 0 } = solicitud;
  const tarifa = datos.tarifas.find(
    (fila) =>
      fila.plazo === plazo && fila.edad === edad && fila.sexo === sexo && fila.fuma === fuma,
  );
  const basica = datos.reglas.find((fila) => fila.cobertura === "BAS");
  const invalidez = datos.reglas.find((fila) => fila.cobertura === "INV");
  if (!tarifa || !basica || !invalidez) return { error: SIN_TARIFA };
  const sumaMinima = plazo === 10 ? basica.sumaMin : SUMA_MINIMA_MET4U[99];
  if (edad < basica.edadMin || edad > basica.edadMax || suma < sumaMinima) {
    return {
      error: `Revisa la edad y la suma básica mínima de ${sumaMinima.toLocaleString("es-MX")} MXN.`,
    };
  }

  const minimoInvalidez =
    suma <= 2500000
      ? 400
      : suma <= 4700000
        ? 300
        : suma <= 6300000
          ? 250
          : suma <= 13000000
            ? 200
            : 150;
  const porcentaje = solicitud.invalidez ?? minimoInvalidez;
  if (porcentaje < minimoInvalidez || porcentaje > Math.round(invalidez.sumaMax * 100)) {
    return {
      error: `El porcentaje de invalidez debe ser de ${minimoInvalidez} % a ${Math.round(invalidez.sumaMax * 100)} %.`,
    };
  }
  const sumaInvalidez = (porcentaje / 100) * suma;
  const primas: Extract<RespuestaMet4U, { primas: unknown }>["primas"] = [
    {
      cobertura: "BAS",
      suma,
      prima: redondear((tarifa.BAS * suma) / 1000 + (plazo === 10 ? 2000 : 1300)),
    },
    { cobertura: "INV", suma: sumaInvalidez, prima: (tarifa.INV * sumaInvalidez) / 1000 },
  ];

  for (const cobertura of adicionales) {
    const importe = solicitud.adicionales[cobertura];
    if (importe === undefined) continue;
    const regla = datos.reglas.find((fila) => fila.cobertura === cobertura);
    if (!regla) return { error: SIN_TARIFA };
    const maximo = Math.min(suma, regla.sumaMax);
    if (
      edad < regla.edadMin ||
      edad > regla.edadMax ||
      importe < regla.sumaMin ||
      importe > maximo
    ) {
      return {
        error: `La suma de ${COBERTURAS_MET4U[cobertura]} debe estar entre ${regla.sumaMin.toLocaleString("es-MX")} y ${maximo.toLocaleString("es-MX")} MXN.`,
      };
    }
    primas.push({
      cobertura,
      suma: importe,
      prima: redondear((tarifa[cobertura] * importe) / 1000),
    });
  }

  const coberturaAnual = primas.reduce((total, item) => total + item.prima, 0);
  const aporteAnual = coberturaAnual + ahorroAnual;
  const proyeccion = perfil
    ? proyectarMet4U(
        solicitud,
        {
          BAS: suma,
          INV: sumaInvalidez,
          CAN: solicitud.adicionales.CAN ?? 0,
          DIA: solicitud.adicionales.DIA ?? 0,
          GRA: solicitud.adicionales.GRA ?? 0,
        },
        tarifa,
        perfil,
      )
    : undefined;
  if (solicitud.proyeccion && !proyeccion) {
    return { error: "La proyección de Met4U no está disponible para esta cotización." };
  }
  return {
    primas,
    coberturaAnual,
    aporteAnual,
    aportePorPago: aporteAnual / PAGOS[frecuencia].pagos,
    proyeccion,
  };
}

export async function cotizarMet4U(solicitud: SolicitudMet4U): Promise<RespuestaMet4U> {
  const horizonte = 65 - solicitud.edad;
  const { retiro, metas = [] } = solicitud;
  if (retiro && (retiro.desde > retiro.hasta || retiro.hasta > horizonte)) {
    return {
      error: `El retiro debe comenzar en el año 10 o después y terminar a más tardar en el año ${horizonte}.`,
    };
  }
  if (
    metas.some(({ anio }) => anio > horizonte) ||
    new Set(metas.map(({ anio }) => anio)).size !== metas.length
  ) {
    return { error: `Captura una sola meta por año, del año 10 al ${horizonte}.` };
  }
  if (!solicitud.proyeccion && (retiro || metas.length)) {
    return { error: "Incluye la proyección para calcular los retiros y las metas." };
  }
  const conexion = obtenerConexionMetLife();
  if (!conexion) return { error: SIN_TARIFA };
  try {
    const { rows } = await conexion.query<{ datos: TarifasMet4U }>(
      "SELECT datos FROM metlife_cotizador.met4u_tarifarios WHERE version = $1",
      ["7.6"],
    );
    if (!rows[0]) return { error: SIN_TARIFA };
    if (!solicitud.proyeccion) return calcularMet4U(solicitud, rows[0].datos);
    const { plazo, sexo, fuma } = solicitud;
    const perfil = await conexion.query<PerfilProyeccionMet4U>(
      `SELECT datos->'perfiles'->$2::text AS costos, datos->'recargos'->$3::text AS recargos,
              datos->'cargos' AS cargos
       FROM metlife_cotizador.met4u_proyecciones WHERE version = $1`,
      ["7.6", `${plazo}/${sexo}/${fuma}`, String(plazo)],
    );
    const tarifa = perfil.rows[0];
    return calcularMet4U(solicitud, rows[0].datos, tarifa?.costos ? tarifa : undefined);
  } catch (error) {
    const codigo =
      typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    console.error("Consulta del tarifario Met4U falló", codigo);
    return { error: SIN_TARIFA };
  }
}
