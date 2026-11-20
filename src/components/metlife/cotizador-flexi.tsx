import { createServerFn } from "@tanstack/react-start";
import { Printer } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PAGOS } from "@/lib/metlife";
import {
  LIQUIDEZ_FLEXI,
  BENEFICIOS_SUENOS,
  TIPO_FONDO_FLEXI,
  solicitudFlexi,
  solicitudFlexiSuenos,
  type RespuestaFlexi,
  type FilaFlexi,
  type SolicitudFlexi,
  type SolicitudFlexiSuenos,
} from "@/lib/metlife-flexi";

const cotizar = createServerFn({ method: "POST" })
  .validator((entrada: unknown) =>
    typeof entrada === "object" && entrada !== null && "modalidad" in entrada
      ? solicitudFlexiSuenos.parse(entrada)
      : solicitudFlexi.parse(entrada),
  )
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
const dolaresReporte = reporte("USD");
const aportaciones = {
  inicial: "Inicial",
  mensual: "Mensual",
  trimestral: "Trimestral",
  anual: "Anual",
} as const;

export function CotizadorFlexi({ suenos = false }: { suenos?: boolean }) {
  const [datos, setDatos] = useState<SolicitudFlexi | SolicitudFlexiSuenos>();
  const [respuesta, setRespuesta] = useState<RespuestaFlexi>();
  const [pendiente, setPendiente] = useState(false);
  const [cuentas, setCuentas] = useState(0);
  const [plazo, setPlazo] = useState(10);
  const [preferente, setPreferente] = useState(false);
  const [accidente, setAccidente] = useState("");
  const titulo = suenos ? "FlexiLife Sueños" : "FlexiLife Inversión";
  const fiscal = suenos && plazo === 65;
  const resumen = respuesta && !("error" in respuesta) ? respuesta : undefined;
  const proyeccion = resumen ? proyeccionAnual(resumen.proyeccion) : [];

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const numero = (nombre: string) => (form.get(nombre) ? Number(form.get(nombre)) : undefined);
    const base = {
      edad: numero("edad"),
      sexo: form.get("sexo"),
      fuma: form.get("fuma"),
      plazo: numero("plazo"),
      suma: numero("suma"),
      frecuencia: form.get("frecuencia"),
      inversiones: Array.from({ length: cuentas }, (_, i) => ({
        tipo: fiscal ? form.get(`tipo-${i}`) : "Ahorro",
        liquidez: form.get(`liquidez-${i}`),
        inicial: numero(`inicial-${i}`),
        mensual: numero(`mensual-${i}`),
        trimestral: numero(`trimestral-${i}`),
        anual: numero(`anual-${i}`),
      })).filter((cuenta) => cuenta.inicial || cuenta.mensual || cuenta.trimestral || cuenta.anual),
    };
    const parsed = suenos
      ? solicitudFlexiSuenos.safeParse({
          ...base,
          modalidad: "suenos",
          preferente,
          coberturas: {
            PASI: numero("PASI"),
            EG: numero("EG"),
            GF: form.has("GF"),
            ...(accidente ? { [accidente]: numero("sumaAccidente") } : {}),
          },
        })
      : solicitudFlexi.safeParse(base);
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
          <legend className="font-display text-2xl">{titulo}</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Edad
              <input
                name="edad"
                type="number"
                min="18"
                max={suenos ? (fiscal ? 60 : 70) : 85}
                className={entrada}
                required
              />
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
              <select
                name="plazo"
                className={entrada}
                value={plazo}
                onChange={(event) => setPlazo(Number(event.target.value))}
              >
                <option value="10">10 años</option>
                <option value="20">20 años</option>
                {suenos && <option value="65">Hasta los 65 años</option>}
              </select>
            </label>
            <label className="text-sm font-medium">
              Suma asegurada (MXN)
              <input
                name="suma"
                type="number"
                min={suenos ? (preferente ? 2500000 : 150000) : 10000}
                max={suenos ? 2147483647 : 1000000}
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
            {suenos && (
              <label className="text-sm font-medium">
                Riesgo
                <select
                  className={entrada}
                  value={preferente ? "1" : "0"}
                  onChange={(event) => setPreferente(event.target.value === "1")}
                >
                  <option value="0">Normal</option>
                  <option value="1">Preferente</option>
                </select>
              </label>
            )}
          </div>
          {suenos && (
            <fieldset className="mt-4 grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
              <legend className="px-1 text-sm font-semibold">Coberturas adicionales</legend>
              <label className="text-sm">
                <input type="checkbox" name="GF" /> {BENEFICIOS_SUENOS.GF}
              </label>
              <label className="text-sm">
                {BENEFICIOS_SUENOS.PASI} (MXN)
                <input name="PASI" type="number" min="150000" className={entrada} />
              </label>
              <label className="text-sm">
                {BENEFICIOS_SUENOS.EG} (MXN)
                <input name="EG" type="number" min="150000" max="3000000" className={entrada} />
              </label>
              <label className="text-sm">
                Cobertura por accidente
                <select
                  className={entrada}
                  value={accidente}
                  onChange={(event) => setAccidente(event.target.value)}
                >
                  <option value="">Sin cobertura</option>
                  {(["IMA", "DI", "TI"] as const).map((id) => (
                    <option key={id} value={id}>
                      {BENEFICIOS_SUENOS[id]}
                    </option>
                  ))}
                </select>
              </label>
              {accidente && (
                <label className="text-sm">
                  Suma por accidente (MXN)
                  <input
                    name="sumaAccidente"
                    type="number"
                    min="150000"
                    className={entrada}
                    required
                  />
                </label>
              )}
            </fieldset>
          )}
          {Array.from({ length: cuentas }, (_, i) => (
            <fieldset
              className="mt-4 grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2"
              key={i}
            >
              <legend className="px-1 text-sm font-semibold">Cuenta {i + 1}</legend>
              {fiscal && (
                <label className="text-sm font-medium sm:col-span-2">
                  Tipo de cuenta
                  <select name={`tipo-${i}`} className={entrada}>
                    {TIPO_FONDO_FLEXI.map((tipo) => (
                      <option key={tipo}>{tipo}</option>
                    ))}
                  </select>
                </label>
              )}
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
              disabled={cuentas >= (fiscal ? 18 : 6)}
              onClick={() => {
                setCuentas((n) => n + 1);
                setRespuesta(undefined);
              }}
            >
              {fiscal ? "Agregar cuenta" : "Agregar cuenta de ahorro"}
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
        <h2 className="text-2xl">Cotización de {titulo}</h2>
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
                {datos.edad} años ·{" "}
                {datos.plazo === 65 ? "Hasta los 65 años" : `${datos.plazo} años de plazo`} ·{" "}
                {PAGOS[datos.frecuencia].etiqueta}
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
      {resumen && datos && (
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
                    ...(suenos
                      ? [
                          "Recuperación (%)",
                          "Aportación (MXN)",
                          "Rendimiento (MXN)",
                          "Fondo (MXN)",
                          "Aportación (USD)",
                          "Rendimiento (USD)",
                          "Fondo (USD)",
                        ]
                      : resumen.proyeccion[0].inversiones.map(
                          ({ liquidez }) => LIQUIDEZ_FLEXI[liquidez].etiqueta,
                        )),
                  ].map((titulo) => (
                    <th key={titulo} scope="col" className="p-2">
                      {titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {proyeccion.map(({ fila, acumulada, mxn, usd }) => {
                  return (
                    <tr key={fila.mes} className="border-t border-border print:break-inside-avoid">
                      <th scope="row" className="p-2">
                        {fila.mes / 12}
                      </th>
                      <td className="p-2">{pesosReporte.format(acumulada)}</td>
                      <td className="p-2">{pesosReporte.format(Math.max(0, fila.rescate))}</td>
                      {suenos ? (
                        <>
                          <td className="p-2">
                            {Math.round((100 * Math.max(0, fila.rescate)) / acumulada)}
                          </td>
                          {[mxn.aportacion, mxn.rendimiento, mxn.saldo].map((importe, i) => (
                            <td key={i} className="p-2">
                              {pesosReporte.format(importe)}
                            </td>
                          ))}
                          {[usd.aportacion, usd.rendimiento, usd.saldo].map((importe, i) => (
                            <td key={i} className="p-2">
                              {dolaresReporte.format(importe)}
                            </td>
                          ))}
                        </>
                      ) : (
                        fila.inversiones.map(({ liquidez, fondo }) => (
                          <td key={liquidez} className="p-2">
                            {reporte(LIQUIDEZ_FLEXI[liquidez].moneda).format(fondo)}
                          </td>
                        ))
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {suenos && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {resumen.proyeccion.at(-1)?.inversiones.map(({ liquidez, tipo, fondo }) => (
                <div
                  key={`${tipo}/${liquidez}`}
                  className="rounded-lg border border-border p-3 text-sm"
                >
                  <p className="font-medium">
                    {tipo} · {LIQUIDEZ_FLEXI[liquidez].etiqueta}
                  </p>
                  <p>
                    Saldo al final del plazo{" "}
                    {reporte(LIQUIDEZ_FLEXI[liquidez].moneda).format(fondo)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function proyeccionAnual(meses: FilaFlexi[]) {
  let acumulada = 0;
  const aportaciones: Record<"MXN" | "USD", number> = { MXN: 0, USD: 0 };
  const anual = [];
  for (const fila of meses) {
    acumulada += fila.prima;
    const saldos: Record<"MXN" | "USD", number> = { MXN: 0, USD: 0 };
    for (const cuenta of fila.inversiones) {
      const { moneda } = LIQUIDEZ_FLEXI[cuenta.liquidez];
      aportaciones[moneda] += cuenta.aportacion;
      saldos[moneda] += cuenta.fondo;
    }
    if (fila.mes % 12 === 0) {
      anual.push({
        fila,
        acumulada,
        mxn: {
          aportacion: aportaciones.MXN,
          saldo: saldos.MXN,
          rendimiento: saldos.MXN - aportaciones.MXN,
        },
        usd: {
          aportacion: aportaciones.USD,
          saldo: saldos.USD,
          rendimiento: saldos.USD - aportaciones.USD,
        },
      });
    }
  }
  return anual;
}
