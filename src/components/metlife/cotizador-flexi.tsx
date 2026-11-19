import { createServerFn } from "@tanstack/react-start";
import { Printer } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PAGOS } from "@/lib/metlife";
import {
  LIQUIDEZ_FLEXI,
  solicitudFlexi,
  type RespuestaFlexi,
  type SolicitudFlexi,
} from "@/lib/metlife-flexi";

const cotizar = createServerFn({ method: "POST" })
  .validator((entrada: unknown) => solicitudFlexi.parse(entrada))
  .handler(async ({ data }) => (await import("@/lib/metlife-flexi.server")).cotizarFlexiLife(data));

const entrada = "mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-base";
const formatear = (currency: string) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency });
const pesos = formatear("MXN");
const reporte = (currency: string) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    roundingMode: "halfEven",
  } as Intl.NumberFormatOptions);
const pesosReporte = reporte("MXN");
const aportaciones = {
  inicial: "Inicial",
  mensual: "Mensual",
  trimestral: "Trimestral",
  anual: "Anual",
} as const;

export function CotizadorFlexi() {
  const [datos, setDatos] = useState<SolicitudFlexi>();
  const [respuesta, setRespuesta] = useState<RespuestaFlexi>();
  const [pendiente, setPendiente] = useState(false);
  const [cuentas, setCuentas] = useState(0);
  const resumen = respuesta && !("error" in respuesta) ? respuesta : undefined;

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const numero = (nombre: string) => (form.get(nombre) ? Number(form.get(nombre)) : undefined);
    const parsed = solicitudFlexi.safeParse({
      edad: numero("edad"),
      sexo: form.get("sexo"),
      fuma: form.get("fuma"),
      plazo: numero("plazo"),
      suma: numero("suma"),
      frecuencia: form.get("frecuencia"),
      inversiones: Array.from({ length: cuentas }, (_, i) => ({
        liquidez: form.get(`liquidez-${i}`),
        inicial: numero(`inicial-${i}`),
        mensual: numero(`mensual-${i}`),
        trimestral: numero(`trimestral-${i}`),
        anual: numero(`anual-${i}`),
      })).filter((cuenta) => cuenta.inicial || cuenta.mensual || cuenta.trimestral || cuenta.anual),
    });
    if (!parsed.success) {
      setRespuesta({ error: "Revisa los datos del asegurado y los importes." });
      return;
    }
    setDatos(parsed.data);
    setRespuesta(undefined);
    setPendiente(true);
    try {
      setRespuesta(await cotizar({ data: parsed.data }));
    } catch {
      setRespuesta({ error: "No se pudo consultar el tarifario. Intenta nuevamente." });
    } finally {
      setPendiente(false);
    }
  }
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr] print:block">
      <form
        onSubmit={enviar}
        onChange={() => setRespuesta(undefined)}
        className="rounded-2xl border border-border bg-card p-5 sm:p-8 print:hidden"
      >
        <fieldset disabled={pendiente} className="min-w-0">
          <legend className="font-display text-2xl">FlexiLife Inversión</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Edad
              <input name="edad" type="number" min="18" max="85" className={entrada} required />
            </label>
            <label className="text-sm font-medium">
              Sexo
              <select name="sexo" className={entrada}>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              ¿Fuma?
              <select name="fuma" className={entrada}>
                <option value="N">No</option>
                <option value="S">Sí</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Plazo
              <select name="plazo" className={entrada}>
                <option value="10">10 años</option>
                <option value="20">20 años</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Suma asegurada (MXN)
              <input
                name="suma"
                type="number"
                min="10000"
                max="1000000"
                className={entrada}
                required
              />
            </label>
            <label className="text-sm font-medium">
              Forma de pago
              <select name="frecuencia" className={entrada}>
                {Object.entries(PAGOS).map(([id, forma]) => (
                  <option key={id} value={id}>
                    {forma.etiqueta}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {Array.from({ length: cuentas }, (_, i) => (
            <fieldset
              className="mt-4 grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2"
              key={i}
            >
              <legend className="px-1 text-sm font-semibold">Cuenta de ahorro {i + 1}</legend>
              <label className="text-sm font-medium sm:col-span-2">
                Liquidez y moneda
                <select name={`liquidez-${i}`} className={entrada}>
                  {Object.entries(LIQUIDEZ_FLEXI).map(([id, { etiqueta }]) => (
                    <option key={id} value={id}>
                      {etiqueta}
                    </option>
                  ))}
                </select>
              </label>
              {Object.entries(aportaciones).map(([id, etiqueta]) => (
                <label className="text-sm font-medium" key={id}>
                  Aportación {etiqueta.toLowerCase()}
                  <input
                    className={entrada}
                    name={`${id}-${i}`}
                    type="number"
                    min="1"
                    max="2147483647"
                  />
                </label>
              ))}
            </fieldset>
          ))}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-outline"
              disabled={cuentas >= 6}
              onClick={() => {
                setCuentas((n) => n + 1);
                setRespuesta(undefined);
              }}
            >
              Agregar cuenta de ahorro
            </button>
            {cuentas > 0 && (
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  setCuentas((n) => n - 1);
                  setRespuesta(undefined);
                }}
              >
                Quitar última cuenta
              </button>
            )}
            <button type="submit" className="btn-primary">
              {pendiente ? "Calculando…" : "Calcular prima"}
            </button>
          </div>
        </fieldset>
      </form>
      <section
        className="rounded-2xl border border-primary/15 bg-primary-soft p-5 sm:p-8 print:border-0 print:bg-white print:p-0"
        aria-busy={pendiente}
      >
        <h2 className="text-2xl">Cotización de FlexiLife Inversión</h2>
        <div className="mt-3" aria-live="polite">
          {!respuesta && (
            <p className="text-muted-foreground">
              {pendiente ? "Consultando tarifas." : "Completa los datos para conocer la prima."}
            </p>
          )}
          {respuesta && "error" in respuesta && <p>{respuesta.error}</p>}
          {resumen && datos && (
            <>
              <p className="text-sm text-muted-foreground">
                {datos.edad} años · {datos.plazo} años de plazo · {PAGOS[datos.frecuencia].etiqueta}
              </p>
              <p className="mt-4 font-display text-4xl tabular-nums">
                {pesos.format(resumen.primaPago)}
              </p>
              <p className="text-sm text-muted-foreground">Prima por periodo (MXN)</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>Prima anual</dt>
                  <dd>{pesos.format(resumen.primaAnual)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Suma asegurada</dt>
                  <dd>{pesos.format(datos.suma)}</dd>
                </div>
              </dl>
              <button
                type="button"
                className="btn-outline mt-4 print:hidden"
                onClick={() => window.print()}
              >
                <Printer aria-hidden="true" className="size-4" /> Imprimir cotización
              </button>
            </>
          )}
        </div>
      </section>
      {resumen && (
        <section className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-8 lg:col-span-2 print:mt-6 print:border-0 print:p-0">
          <h2 className="text-2xl">Proyección anual de FlexiLife</h2>
          <div className="mt-4 overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse text-right text-sm tabular-nums print:text-[9px]">
              <thead>
                <tr>
                  {[
                    "Año",
                    "Prima acumulada (MXN)",
                    "Rescate (MXN)",
                    ...resumen.proyeccion[0].inversiones.map(
                      ({ liquidez }) => LIQUIDEZ_FLEXI[liquidez].etiqueta,
                    ),
                  ].map((titulo) => (
                    <th key={titulo} scope="col" className="p-2">
                      {titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resumen.proyeccion
                  .filter(({ mes }) => mes % 12 === 0)
                  .map((fila) => {
                    const acumulada = resumen.proyeccion
                      .slice(0, fila.mes)
                      .reduce((n, m) => n + m.prima, 0);
                    return (
                      <tr
                        key={fila.mes}
                        className="border-t border-border print:break-inside-avoid"
                      >
                        <th scope="row" className="p-2">
                          {fila.mes / 12}
                        </th>
                        <td className="p-2">{pesosReporte.format(acumulada)}</td>
                        <td className="p-2">{pesosReporte.format(Math.max(0, fila.rescate))}</td>
                        {fila.inversiones.map(({ liquidez, fondo }) => (
                          <td key={liquidez} className="p-2">
                            {reporte(LIQUIDEZ_FLEXI[liquidez].moneda).format(fondo)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
