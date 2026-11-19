import { PAGOS } from "./metlife";
import type { CoberturaMet4U, FilaMet4U, SolicitudMet4U } from "./metlife-met4u";

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
  const { edad, plazo, frecuencia, ahorroAnual = 0 } = solicitud;
  const pagos = PAGOS[frecuencia].pagos;
  const factorPago = frecuencia === "mensual" ? 0.0833333333333333 : 1 / pagos;
  const plazoSeguro = 65 - edad;
  const plazoPago = plazo === 10 ? 10 : plazoSeguro;
  const derecho = plazo === 10 ? 2000 : 1300;
  const tasaMensual = Math.pow(1.065, 1 / 12) - 1;
  let fondoBasico = 0;
  let fondoAdicional = 0;
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
      const adicionalAntes = fondoAdicional + aportacion;
      fondoAdicional = adicionalAntes + adicionalAntes * tasaMensual;
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
        remanente = sinDecimalesExtra(saldo < 0 ? saldo - saldo * 0.95 : saldo);
      }
      filas.push({
        anio,
        mes,
        edad: edadActual,
        aportacion: prima + aportacion,
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
