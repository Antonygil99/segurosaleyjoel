import { obtenerConexionMetLife } from "./metlife-conexion.server";
import { PAGOS } from "./metlife";
import {
  ADICIONALES_EDUCA,
  EDADES_MINIDOTAL,
  type RespuestaEduca,
  type SolicitudEduca,
} from "./metlife-educa";

type Adulto = SolicitudEduca["titular"];
type Beneficio = keyof typeof ADICIONALES_EDUCA;
type TarifarioEduca = {
  claves: Record<string, Record<string, string>>;
  primas: Record<string, number>;
  rescates: Record<string, number[]>;
  limites: Record<string, { sumaMin: number; sumaMax: number; recFijo: number }>;
  edades: Record<string, { edadMin: number; edadMax: number; edadCan: number }>;
  recargos: Record<number, number>;
};
const sinTarifa = "El tarifario EducaLife 7.6 no está disponible para esta cotización.";

function calcular(solicitud: SolicitudEduca, datos: TarifarioEduca): RespuestaEduca {
  const { titular, conyuge, menor, dotal, frecuencia } = solicitud;
  const plazo = dotal - menor.edad;
  if (plazo < 5) return { error: "El plazo del dotal debe ser de al menos cinco años." };
  if (solicitud.adicionales.IMA && solicitud.adicionales.TIBA) {
    return { error: "Selecciona una sola cobertura por accidente." };
  }
  const clave = datos.claves[`22/${plazo}`];
  const claveDotal = datos.claves[`20/${dotal}`];
  if (!clave || !claveDotal) return { error: sinTarifa };
  const perfil = { sexo: "M", fuma: "S" };
  const prima = (codigo: string, edad: number, p: { sexo: string; fuma: string }) =>
    datos.primas[`${codigo}/${edad}/${p.sexo}/${p.fuma}`] ?? 0;
  const rescates = (codigo: string, edad: number, p: { sexo: string; fuma: string }) =>
    datos.rescates[`${codigo}/${edad}/${p.sexo}/${p.fuma}`];
  const rescateDotal = rescates(claveDotal.BAS, menor.edad, perfil);
  const rescateTitular = plazo >= 10 ? rescates(clave.BAS, titular.edad, titular) : undefined;
  const rescateConyuge =
    conyuge && plazo >= 10 ? rescates(clave.BAS, conyuge.edad, conyuge) : undefined;
  if (!rescateDotal || rescateDotal.length < plazo) return { error: sinTarifa };
  const edadTarifa = ({ edad, sexo, fuma }: Adulto) =>
    Math.max(18, edad - (sexo === "F" ? 3 : 0) - (fuma === "N" ? 2 : 0));
  const monto = (id: string, importe: number, max = Infinity) => {
    const { sumaMin, sumaMax } = datos.limites[id];
    return Math.min(sumaMax || Infinity, Math.max(sumaMin, Math.min(importe, max)));
  };
  const activo = (id: string) =>
    titular.edad >= datos.edades[id].edadMin && titular.edad <= datos.edades[id].edadMax;
  const sumaTitular = monto("Titular", titular.suma);
  const sumaDotal = monto("Dotal", solicitud.sumaDotal ?? sumaTitular);
  const sumaConyuge = conyuge ? monto("Conyuge", conyuge.suma, sumaTitular) : 0;
  const cargoFijo = datos.limites.Titular.recFijo;
  const primaTitular = (sumaTitular * prima(clave.BAS, edadTarifa(titular), perfil)) / 1000;
  const primaDotal = (sumaDotal * prima(claveDotal.BAS, menor.edad, perfil)) / 1000;
  const primaConyuge = conyuge
    ? (sumaConyuge * prima(clave.BAS, edadTarifa(conyuge), perfil)) / 1000
    : 0;
  const tasaInvalidez = activo("GPPI") ? prima(clave.GPPI, titular.edad, titular) / 100 : 0;
  const tasaFallecimiento = prima(clave.GPPF, titular.edad, titular) / 100;
  const minis: {
    edad: keyof typeof EDADES_MINIDOTAL;
    plazo: number;
    suma: number;
    prima: number;
    factor: number[];
    gppi: number;
    gppf: number;
  }[] = [];
  for (const edad of [...(solicitud.miniDotales ?? [])].sort((a, b) => a - b)) {
    if (menor.edad > EDADES_MINIDOTAL[edad])
      return { error: `El mini dotal a los ${edad} años está fuera del rango de edad del menor.` };
    const plazoMini = edad - menor.edad;
    const clavesMini = datos.claves[`22/${plazoMini}`];
    const codigo = datos.claves[`21/${edad}`]?.BAS;
    if (!clavesMini || !codigo) return { error: sinTarifa };
    const suma = Math.round(0.1 * sumaDotal);
    const primaMini = (suma * prima(codigo, menor.edad, perfil)) / 1000;
    const factor = rescates(codigo, menor.edad, perfil);
    if (!factor || factor.length < plazoMini) return { error: sinTarifa };
    minis.push({
      edad,
      plazo: plazoMini,
      suma,
      prima: primaMini,
      factor,
      gppi: activo("GPPI") ? (primaMini * prima(clavesMini.GPPI, titular.edad, titular)) / 100 : 0,
      gppf: (primaMini * prima(clavesMini.GPPF, titular.edad, titular)) / 100,
    });
  }
  const beneficiarios = [
    { nombre: "titular", persona: titular },
    { nombre: "menor", persona: { ...menor, fuma: "N" } },
    ...(conyuge ? [{ nombre: "cónyuge", persona: conyuge }] : []),
  ];
  const funerarios = beneficiarios
    .filter(({ persona }) => persona.funerarios)
    .map(({ nombre, persona }) => ({
      nombre,
      persona,
      suma: datos.limites.GF.sumaMax,
      prima: (datos.limites.GF.sumaMax * prima("GF", persona.edad, persona)) / 1000,
    }));
  const sumaFunerarios = funerarios.reduce((total, item) => total + item.prima, 0);
  const adicionales: { cobertura: Beneficio; nombre: string; suma: number; prima: number }[] = [];
  for (const cobertura of Object.keys(ADICIONALES_EDUCA) as Beneficio[]) {
    const valor = solicitud.adicionales[cobertura];
    if (!valor) continue;
    if (!activo(cobertura))
      return { error: `${ADICIONALES_EDUCA[cobertura]} está fuera del rango de edad.` };
    const suma = monto(cobertura, valor, sumaTitular);
    const tasa =
      cobertura === "IMA"
        ? 1.24
        : cobertura === "TIBA"
          ? 2.19
          : prima(clave[cobertura], titular.edad, titular);
    adicionales.push({
      cobertura,
      nombre: ADICIONALES_EDUCA[cobertura],
      suma,
      prima: (suma * tasa) / 1000,
    });
  }
  const exencionInvalidez =
    (primaTitular + primaDotal + primaConyuge + cargoFijo + sumaFunerarios) * tasaInvalidez +
    minis.reduce((total, mini) => total + mini.gppi, 0);
  const exencionFallecimiento =
    (primaDotal +
      primaConyuge +
      funerarios
        .filter(({ nombre }) => nombre !== "titular")
        .reduce((total, item) => total + item.prima, 0)) *
      tasaFallecimiento +
    minis.reduce((total, mini) => total + mini.gppf, 0);
  const filas = [
    { nombre: "Seguro del titular", suma: sumaTitular, prima: primaTitular },
    { nombre: "Dotal del menor", suma: sumaDotal, prima: primaDotal },
    ...(conyuge ? [{ nombre: "Seguro del cónyuge", suma: sumaConyuge, prima: primaConyuge }] : []),
    { nombre: "Cargo fijo", prima: cargoFijo },
    ...(activo("GPPI") ? [{ nombre: "Exención por invalidez", prima: exencionInvalidez }] : []),
    { nombre: "Exención por fallecimiento", prima: exencionFallecimiento },
    ...adicionales,
    ...minis.map(({ edad, suma, prima }) => ({
      nombre: `Mini dotal a los ${edad} años`,
      suma,
      prima,
    })),
    ...funerarios.map((item) => ({
      nombre: `Gastos funerarios del ${item.nombre}`,
      suma: item.suma,
      prima: item.prima,
    })),
  ];
  const anual = filas.reduce((total, fila) => total + fila.prima, 0);
  const forma = PAGOS[frecuencia];
  const tasaPago = frecuencia === "anual" ? 0 : datos.recargos[forma.id];
  let acumulada = 0;
  const proyeccion = Array.from({ length: plazo }, (_, indice) => {
    const edadActual = titular.edad + indice;
    const minisVigentes = minis.filter((mini) => indice < mini.plazo);
    const primaMinis =
      minisVigentes.reduce((total, mini) => total + mini.prima, 0) +
      (edadActual < datos.edades.GPPI.edadCan
        ? minisVigentes.reduce((total, mini) => total + mini.gppi, 0)
        : 0) +
      (edadActual < datos.edades.GPPF.edadCan
        ? minisVigentes.reduce((total, mini) => total + mini.gppf, 0)
        : 0);
    const gf = funerarios.map(({ nombre, persona, suma }) => ({
      nombre,
      prima:
        persona.edad + indice > 79
          ? 0
          : (suma * prima("GF", persona.edad + indice, persona)) / 1000,
    }));
    const base = primaTitular + cargoFijo + primaDotal + primaConyuge;
    const beneficios = adicionales.reduce((total, item) => {
      if (edadActual >= datos.edades[item.cobertura].edadCan) return total;
      return (
        total +
        (item.cobertura === "EG"
          ? (item.suma * prima(clave.EG, edadActual, titular)) / 1000
          : item.prima)
      );
    }, 0);
    const totalGf = gf.reduce((total, item) => total + item.prima, 0);
    const gppi =
      edadActual < datos.edades.GPPI.edadCan
        ? base * tasaInvalidez + totalGf * (1 + tasaInvalidez)
        : 0;
    const gppf =
      edadActual < datos.edades.GPPF.edadCan
        ? (primaDotal +
            primaConyuge +
            gf
              .filter(({ nombre }) => nombre !== "titular")
              .reduce((total, item) => total + item.prima, 0)) *
          tasaFallecimiento
        : 0;
    const primaAnio = (base + beneficios + gppi + gppf + primaMinis) * (1 + tasaPago);
    acumulada += primaAnio;
    return {
      anio: indice + 1,
      prima: primaAnio,
      acumulada,
      rescate:
        (rescateDotal[indice] * sumaDotal +
          (rescateTitular?.[indice] ?? 0) * sumaTitular +
          (rescateConyuge?.[indice] ?? 0) * sumaConyuge) /
        1000,
      dotal: indice + 1 === plazo ? sumaDotal : 0,
      miniDotales: minis.map(({ edad, factor, plazo, suma }) => ({
        edad,
        rescate: indice < plazo ? (factor[indice] * suma) / 1000 : null,
      })),
    };
  });
  return {
    filas,
    anual,
    recargo: anual * tasaPago,
    pago: (anual * (1 + tasaPago)) / forma.pagos,
    proyeccion,
  };
}

export async function cotizarEducaLife(solicitud: SolicitudEduca): Promise<RespuestaEduca> {
  const pool = obtenerConexionMetLife();
  if (!pool) return { error: sinTarifa };
  try {
    const { rows } = await pool.query<{ datos: TarifarioEduca }>(
      "SELECT datos FROM metlife_cotizador.edu_calculo WHERE version = $1 AND moneda = $2",
      ["7.6", solicitud.moneda],
    );
    return rows[0] ? calcular(solicitud, rows[0].datos) : { error: sinTarifa };
  } catch (error) {
    const codigo =
      typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    console.error("Consulta del tarifario EducaLife falló", codigo);
    return { error: sinTarifa };
  }
}
