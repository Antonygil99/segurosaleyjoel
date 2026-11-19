import { Printer } from "lucide-react";
import { COBERTURAS, MONEDAS, PLANES, etiquetaPlazo, type SolicitudMetLife } from "@/lib/metlife";
import type { RespuestaCotizacion } from "@/lib/metlife-vida.server";

export function ResultadoVida({
  respuesta,
  solicitud,
  pendiente,
}: {
  respuesta?: RespuestaCotizacion;
  solicitud?: SolicitudMetLife;
  pendiente: boolean;
}) {
  const cotizacion = respuesta && "cotizacion" in respuesta ? respuesta.cotizacion : undefined;
  const error = respuesta && "error" in respuesta ? respuesta.error : undefined;
  const dinero = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: solicitud ? MONEDAS[solicitud.moneda].divisa : "MXN",
  });
  const fecha = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" });
  return (
    <>
      <section
        aria-labelledby="resumen-metlife"
        aria-busy={pendiente}
        className="rounded-2xl border border-primary/15 bg-primary-soft p-5 sm:p-8 print:border-0 print:bg-white print:p-0"
      >
        <h2 id="resumen-metlife" className="text-2xl">
          Resultado
        </h2>
        <div className="mt-3" aria-live="polite">
          {error && <p className="rounded-lg bg-card p-3">{error}</p>}
          {!respuesta && (
            <p className="text-muted-foreground">
              {pendiente ? "Consultando tarifas." : "Completa los datos para conocer la prima."}
            </p>
          )}
          {cotizacion && solicitud && (
            <>
              <p className="text-sm text-muted-foreground">
                {PLANES[solicitud.plan].nombre} · {etiquetaPlazo(solicitud.plazo)} ·{" "}
                {MONEDAS[solicitud.moneda].etiqueta}
              </p>
              <p className="mt-4 font-display text-4xl tabular-nums">
                {dinero.format(cotizacion.pago)}
              </p>
              <p className="text-sm text-muted-foreground">
                {cotizacion.pagos === 1 ? "Pago anual" : `${cotizacion.pagos} pagos al año`}
              </p>
              <dl className="mt-5 space-y-2 border-t border-primary/20 pt-4 text-sm">
                {[
                  ["Edad", solicitud.edad],
                  ["Suma asegurada", dinero.format(solicitud.suma)],
                  ["Prima de cobertura básica", dinero.format(cotizacion.basica)],
                  ["Cargo fijo", dinero.format(cotizacion.cargoFijo)],
                  ...cotizacion.beneficios.map(({ cobertura, prima }) => [
                    COBERTURAS[cobertura],
                    dinero.format(prima),
                  ]),
                  ["Prima anual", dinero.format(cotizacion.primaAnual)],
                  ["Recargo por forma de pago", dinero.format(cotizacion.recargo)],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="flex justify-between gap-3">
                    <dt>{etiqueta}</dt>
                    <dd className="shrink-0 tabular-nums">{valor}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-sm text-muted-foreground">
                Importes de referencia del tarifario 7.6, sujetos a confirmación de MetLife.
              </p>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-outline mt-5 print:hidden"
              >
                <Printer aria-hidden="true" className="size-4" /> Imprimir o guardar PDF
              </button>
            </>
          )}
        </div>
      </section>
      {cotizacion?.proyeccion && (
        <section
          aria-labelledby="proyeccion-metlife"
          className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-8 lg:col-span-2 print:mt-6 print:border-0 print:p-0"
        >
          <h2 id="proyeccion-metlife" className="text-2xl">
            Proyección anual
          </h2>
          <div className="mt-4 overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse text-left text-sm tabular-nums print:text-[9px]">
              <thead className="bg-secondary print:bg-white">
                <tr>
                  {[
                    "Año",
                    "Edad",
                    "Prima",
                    "Prima acumulada",
                    "Suma asegurada",
                    "Valor de rescate",
                    "Seguro saldado",
                    "Prórroga",
                  ].map((titulo) => (
                    <th
                      key={titulo}
                      scope="col"
                      className="border-b border-border px-2 py-2 font-semibold"
                    >
                      {titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cotizacion.proyeccion.map((fila) => (
                  <tr key={fila.anio} className="border-b border-border print:break-inside-avoid">
                    <th scope="row" className="px-2 py-2 font-medium">
                      {fila.anio}
                    </th>
                    <td className="px-2 py-2">{fila.edad}</td>
                    {[fila.prima, fila.acumulada, fila.suma, fila.rescate, fila.saldado].map(
                      (valor, index) => (
                        <td key={index} className="whitespace-nowrap px-2 py-2">
                          {dinero.format(valor)}
                        </td>
                      ),
                    )}
                    <td className="whitespace-nowrap px-2 py-2">
                      {fila.prorroga ? fecha.format(new Date(fila.prorroga)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
