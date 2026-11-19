import { PAGOS } from "./metlife";
import {
  ESCENARIOS_MET4U,
  type CoberturaMet4U,
  type FilaMet4U,
  type SolicitudMet4U,
} from "./metlife-met4u";

const coberturas = ["BAS", "CAN", "DIA", "GRA", "INV"] as const;
const sinDecimalesExtra = (importe: number) => Math.round(importe * 100000) / 100000;

export type PerfilProyeccionMet4U = {
  costos: Record<string, Record<CoberturaMet4U, number>>;
  recargos: number[];
  cargos: Record<number, number>;
};

export function proyectarMet4U(
  solicitud: SolicitudMet4U,
  sumas: Record<CoberturaMet4U, number>,
  tarifas: Record<CoberturaMet4U, number>,
  perfil: PerfilProyeccionMet4U,
): FilaMet4U[] | undefined {
  const { edad, plazo, frecuencia, ahorroAnual = 0, retiro, metas = [] } = solicitud;
  const metasPorAnio = new Map(metas.map(({ anio, monto }) => [anio, monto]));
  const pagos = PAGOS[frecuencia].pagos;
  const factorPago = frecuencia === "mensual" ? 0.0833333333333333 : 1 / pagos;
  const plazoSeguro = 65 - edad;
  const plazoPago = plazo === 10 ? 10 : plazoSeguro;
  const derecho = plazo === 10 ? 2000 : 1300;
  const tasaFija = ESCENARIOS_MET4U[solicitud.escenarioFijo ?? "optimista"].fija;
  const tasaVariable = ESCENARIOS_MET4U[solicitud.escenarioVariable ?? "optimista"].variable;
  const tasaMensual = Math.pow(1 + tasaFija, 1 / 12) - 1;
  const factorMensualVar = Math.pow(1 + tasaVariable, 1 / 12);
  const parteVariable = (solicitud.porcentajeVariable ?? 0) / 100;
  let fondoBasico = 0;
  let adicionalFijo = 0;
  let adicionalVariable = 0;
  let remanente = 0;
  const filas: FilaMet4U[] = [];

  for (let anio = 1; anio <= plazoSeguro; anio++) {
    const edadActual = edad + anio - 1;
    const costo = perfil.costos[`${edadActual}/${anio}`];
    const recargo = perfil.recargos[anio - 1];
    if (!costo || recargo === undefined) return;
    const factor = 1 + 0.05 * (anio - 1);
    const suma = Object.fromEntries(
      coberturas.map((id) => [id, sinDecimalesExtra(sumas[id] * factor)]),
    ) as Record<CoberturaMet4U, number>;
    const activo = anio <= plazoPago;
    const recargoPrima = activo ? recargo * factor : 0;
    const cargosPrima =
      coberturas.reduce(
        (total, id) =>
          total + sinDecimalesExtra(((tarifas[id] * sumas[id]) / 1000 / 12) * recargoPrima),
        0,
      ) + (activo ? sinDecimalesExtra((derecho * factor) / 12) : 0);
    const costoSeguro =
      sinDecimalesExtra((suma.BAS * costo.BAS) / 1000) +
      sinDecimalesExtra((suma.INV * costo.INV) / 1000) +
      (sinDecimalesExtra((suma.CAN * costo.CAN) / 12) +
        sinDecimalesExtra((suma.DIA * costo.DIA) / 12)) +
      sinDecimalesExtra((suma.GRA * costo.GRA) / 12);

    for (let mes = 1; mes <= 12; mes++) {
      const paga = activo && (mes - 1) % (12 / pagos) === 0;
      const prima = paga
        ? coberturas.reduce(
            (total, id) =>
              total + sinDecimalesExtra(((tarifas[id] * suma[id]) / 1000) * factorPago),
            0,
          ) +
          derecho * factor * factorPago
        : 0;
      const aportacion = mes === 1 ? ahorroAnual + (anio - 1) * 0.05 * ahorroAnual : 0;
      const cargoFondo = sinDecimalesExtra((prima - cargosPrima + remanente) * (0.01 / 12));
      const neto = prima - (cargosPrima + cargoFondo) - costoSeguro;
      const rendimiento = sinDecimalesExtra((neto + fondoBasico) * tasaMensual);
      fondoBasico = sinDecimalesExtra(neto + rendimiento + fondoBasico);
      const aportacionFija = aportacion * (1 - parteVariable);
      const aportacionVariable = aportacion * parteVariable;
      const retiroProgramado =
        retiro && anio >= retiro.desde && anio <= retiro.hasta ? retiro.monto : 0;
      const retiroSolicitado = mes === 12 ? retiroProgramado + (metasPorAnio.get(anio) ?? 0) : 0;
      const adicionalAnterior = adicionalFijo + adicionalVariable;
      const interesFijo = (adicionalFijo + aportacionFija) * tasaMensual;
      const interesVariable = (adicionalVariable + aportacionVariable) * (factorMensualVar - 1);
      const disponibleFijo = adicionalFijo + aportacionFija + interesFijo;
      const faltanteFijo = Math.max(
        0,
        sinDecimalesExtra(retiroSolicitado - interesFijo - adicionalFijo - aportacionFija),
      );
      adicionalFijo = disponibleFijo - Math.min(disponibleFijo, retiroSolicitado);
      adicionalVariable = Math.max(
        0,
        (adicionalVariable + aportacionVariable) * factorMensualVar - faltanteFijo,
      );
      const fondoAdicional = adicionalFijo + adicionalVariable;
      // El reporte de Windows conserva el saldo básico y el saldo remanente por separado.
      const retiroMaximoAdicional =
        adicionalAnterior -
          retiroSolicitado +
          interesVariable +
          aportacionFija +
          aportacionVariable >=
        0
          ? retiroSolicitado
          : adicionalAnterior + fondoAdicional + interesVariable;
      const faltanteAdicional = sinDecimalesExtra(retiroSolicitado - retiroMaximoAdicional);
      const retiroBasico = sinDecimalesExtra(
        fondoAdicional <= 0
          ? retiroSolicitado - sinDecimalesExtra(retiroMaximoAdicional)
          : Math.max(0, Math.min(fondoBasico * 0.95, faltanteAdicional)),
      );
      const castigo = anio < 10 ? (perfil.cargos[anio] ?? 0) : 0;
      const rescate = sinDecimalesExtra(
        fondoBasico + fondoAdicional - sinDecimalesExtra(fondoBasico * castigo),
      );
      if (anio === 1 && mes === 1) {
        remanente = fondoBasico;
      } else {
        // Windows lleva un saldo remanente distinto para calcular los cargos del mes siguiente.
        const interesRemanente = Math.max(0, (neto + remanente) * tasaMensual);
        const saldo = neto + interesRemanente + remanente;
        remanente = sinDecimalesExtra(
          saldo - retiroBasico < 0 ? saldo - saldo * 0.95 : saldo - retiroBasico,
        );
      }
      filas.push({
        anio,
        mes,
        edad: edadActual,
        aportacion: prima + aportacionFija + aportacionVariable,
        retiroSolicitado,
        fondoBasico,
        fondoBasicoRemanente: remanente,
        fondoAdicional,
        rescate,
        rescateReporte: sinDecimalesExtra(
          remanente - sinDecimalesExtra(remanente * castigo) + fondoAdicional,
        ),
        costoSeguro,
        sumaBasica: suma.BAS,
        sumaInvalidez: suma.INV,
      });
    }
  }
  return filas;
}
