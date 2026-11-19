import { createServerFn } from "@tanstack/react-start";
import { Calculator, Printer } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PAGOS } from "@/lib/metlife";
import {
  COBERTURAS_MET4U,
  ESCENARIOS_MET4U,
  SUMA_MINIMA_MET4U,
  solicitudMet4U,
  type RespuestaMet4U,
  type SolicitudMet4U,
} from "@/lib/metlife-met4u";

const calcular = createServerFn({ method: "POST" })
  .validator((entrada: unknown) => solicitudMet4U.parse(entrada))
  .handler(async ({ data }) => {
    const { cotizarMet4U } = await import("@/lib/metlife-met4u.server");
    return cotizarMet4U(data);
  });

const entrada =
  "mt-1.5 w-full rounded-lg border border-input bg-card px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-ring";
const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const pesosReporte = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
  roundingMode: "halfEven",
} as Intl.NumberFormatOptions);

export function CotizadorMet4U() {
  const [resultado, setResultado] = useState<RespuestaMet4U>();
  const [datosCotizados, setDatosCotizados] = useState<SolicitudMet4U>();
  const [pendiente, setPendiente] = useState(false);
  const [plazo, setPlazo] = useState<10 | 99>(10);
  const [incluirProyeccion, setIncluirProyeccion] = useState(false);
  const [incluirRetiro, setIncluirRetiro] = useState(false);
  const [metas, setMetas] = useState(0);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const monto = (nombre: string) => {
      const valor = form.get(nombre);
      return valor ? Number(valor) : undefined;
    };
    const solicitud = solicitudMet4U.safeParse({
      edad: monto("edad"),
      sexo: form.get("sexo"),
      fuma: form.get("fuma"),
      plazo: monto("plazo"),
      frecuencia: form.get("frecuencia"),
      suma: monto("suma"),
      invalidez: monto("invalidez"),
      adicionales: { CAN: monto("CAN"), DIA: monto("DIA"), GRA: monto("GRA") },
      ahorroAnual: monto("ahorroAnual"),
      proyeccion: incluirProyeccion,
      escenarioFijo: form.get("escenarioFijo") ?? undefined,
      escenarioVariable: form.get("escenarioVariable") ?? undefined,
      porcentajeVariable: monto("porcentajeVariable"),
      retiro:
        incluirProyeccion && incluirRetiro
          ? {
              monto: monto("retiroMonto"),
              desde: monto("retiroDesde"),
              hasta: monto("retiroHasta"),
            }
          : undefined,
      metas: incluirProyeccion
        ? Array.from({ length: metas }, (_, indice) => ({
            anio: monto(`metaAnio-${indice}`),
            monto: monto(`metaMonto-${indice}`),
          }))
        : undefined,
    });
    if (!solicitud.success) {
      setResultado({ error: "Revisa la edad, el plazo y los importes capturados." });
      return;
    }
    setResultado(undefined);
    setDatosCotizados(solicitud.data);
    setPendiente(true);
    try {
      setResultado(await calcular({ data: solicitud.data }));
    } catch {
      setResultado({ error: "No se pudo consultar el tarifario. Intenta nuevamente." });
    } finally {
      setPendiente(false);
    }
  }

  const resumen = resultado && !("error" in resultado) ? resultado : undefined;
  const proyeccion = resumen?.proyeccion;
  const mostrarRetiros = Boolean(datosCotizados?.retiro || datosCotizados?.metas?.length);
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr] print:block">
      <form
        onSubmit={enviar}
        onChange={() => setResultado(undefined)}
        className="rounded-2xl border border-border bg-card p-5 sm:p-8 print:hidden"
      >
        <fieldset disabled={pendiente}>
          <legend className="font-display text-2xl">Met4U</legend>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Edad
              <input className={entrada} name="edad" type="number" min="18" max="50" required />
            </label>
            <label className="text-sm font-medium">
              Sexo
              <select className={entrada} name="sexo" defaultValue="" required>
                <option value="" disabled>
                  Selecciona
                </option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              ¿Fuma?
              <select className={entrada} name="fuma" defaultValue="" required>
                <option value="" disabled>
                  Selecciona
                </option>
                <option value="N">No</option>
                <option value="S">Sí</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Plazo
              <select
                className={entrada}
                name="plazo"
                value={plazo}
                onChange={(event) => setPlazo(event.target.value === "10" ? 10 : 99)}
              >
                <option value="10">10 años</option>
                <option value="99">Hasta los 65 años</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Forma de pago
              <select className={entrada} name="frecuencia">
                {Object.entries(PAGOS).map(([clave, forma]) => (
                  <option key={clave} value={clave}>
                    {forma.etiqueta}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Suma básica (MXN)
              <input
                className={entrada}
                name="suma"
                type="number"
                min={SUMA_MINIMA_MET4U[plazo]}
                max="2147483647"
                required
              />
            </label>
            <label className="text-sm font-medium">
              Porcentaje de invalidez
              <input
                className={entrada}
                name="invalidez"
                type="number"
                min="150"
                max="999"
                placeholder="Mínimo del plan"
              />
            </label>
            {(["CAN", "DIA", "GRA"] as const).map((cobertura) => (
              <label className="text-sm font-medium" key={cobertura}>
                Suma por {COBERTURAS_MET4U[cobertura].toLocaleLowerCase("es-MX")} (MXN)
                <input
                  className={entrada}
                  name={cobertura}
                  type="number"
                  min="100000"
                  placeholder="Opcional"
                />
              </label>
            ))}
            <label className="text-sm font-medium">
              Aportación anual programada (MXN)
              <input
                className={entrada}
                name="ahorroAnual"
                type="number"
                min="1"
                max="2147483647"
                placeholder="Opcional"
              />
            </label>
          </div>
          <label className="mt-5 flex items-center gap-2 text-sm font-medium">
            <input
              name="proyeccion"
              type="checkbox"
              checked={incluirProyeccion}
              onChange={(event) => setIncluirProyeccion(event.target.checked)}
            />{" "}
            Incluir proyección de fondos
          </label>
          {incluirProyeccion && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(["Fijo", "Variable"] as const).map((fondo) => (
                <label className="text-sm font-medium" key={fondo}>
                  Escenario del fondo {fondo.toLowerCase()}
                  <select className={entrada} name={`escenario${fondo}`} defaultValue="optimista">
                    {Object.entries(ESCENARIOS_MET4U).map(([id, escenario]) => (
                      <option key={id} value={id}>
                        {escenario.etiqueta} ·{" "}
                        {(escenario[fondo === "Fijo" ? "fija" : "variable"] * 100).toLocaleString(
                          "es-MX",
                        )}{" "}
                        %
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <label className="text-sm font-medium">
                Aportación al fondo variable (%)
                <input
                  className={entrada}
                  name="porcentajeVariable"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={0}
                  required
                />
              </label>
            </div>
          )}
          {incluirProyeccion && (
            <fieldset className="mt-5 space-y-3 rounded-lg border border-border p-3">
              <legend className="px-1 text-sm font-semibold">Retiros y metas</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  name="programarRetiro"
                  type="checkbox"
                  checked={incluirRetiro}
                  onChange={(event) => setIncluirRetiro(event.target.checked)}
                />{" "}
                Programar retiro anual
              </label>
              {incluirRetiro && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-sm">
                    Importe anual (MXN)
                    <input
                      className={entrada}
                      name="retiroMonto"
                      type="number"
                      min="1"
                      max="2147483647"
                      required
                    />
                  </label>
                  <label className="text-sm">
                    Desde el año
                    <input
                      className={entrada}
                      name="retiroDesde"
                      type="number"
                      min="10"
                      max="47"
                      required
                    />
                  </label>
                  <label className="text-sm">
                    Hasta el año
                    <input
                      className={entrada}
                      name="retiroHasta"
                      type="number"
                      min="10"
                      max="47"
                      required
                    />
                  </label>
                </div>
              )}
              {Array.from({ length: metas }, (_, indice) => (
                <div className="grid gap-3 sm:grid-cols-2" key={indice}>
                  <label className="text-sm">
                    Año de la meta {indice + 1}
                    <input
                      className={entrada}
                      name={`metaAnio-${indice}`}
                      type="number"
                      min="10"
                      max="47"
                      required
                    />
                  </label>
                  <label className="text-sm">
                    Importe de la meta {indice + 1} (MXN)
                    <input
                      className={entrada}
                      name={`metaMonto-${indice}`}
                      type="number"
                      min="1"
                      max="2147483647"
                      required
                    />
                  </label>
                </div>
              ))}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-outline"
                  disabled={metas >= 38}
                  onClick={() => {
                    setMetas((n) => n + 1);
                    setResultado(undefined);
                  }}
                >
                  Agregar meta
                </button>
                {metas > 0 && (
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => {
                      setMetas((n) => n - 1);
                      setResultado(undefined);
                    }}
                  >
                    Quitar última meta
                  </button>
                )}
              </div>
            </fieldset>
          )}
          <button type="submit" className="btn-primary mt-5">
            <Calculator className="size-4" aria-hidden="true" />{" "}
            {pendiente ? "Calculando…" : "Calcular prima"}
          </button>
        </fieldset>
      </form>

      <section
        className="rounded-2xl border border-primary/15 bg-primary-soft p-5 sm:p-8 print:border-0 print:bg-white print:p-0"
        aria-busy={pendiente}
      >
        <h2 className="text-2xl">Prima inicial de Met4U</h2>
        <div aria-live="polite" className="mt-3">
          {resultado && "error" in resultado && <p>{resultado.error}</p>}
          {!resultado && (
            <p className="text-muted-foreground">
              {pendiente ? "Consultando tarifas." : "Completa los datos para conocer la prima."}
            </p>
          )}
          {resumen && datosCotizados && (
            <>
              <p className="text-sm text-muted-foreground">
                {datosCotizados.edad} años ·{" "}
                {datosCotizados.sexo === "F" ? "Femenino" : "Masculino"} ·{" "}
                {datosCotizados.fuma === "S" ? "Fuma" : "No fuma"} ·{" "}
                {datosCotizados.plazo === 10 ? "10 años" : "Hasta los 65 años"} ·{" "}
                {PAGOS[datosCotizados.frecuencia].etiqueta}
              </p>
              <p className="font-display text-4xl tabular-nums">
                {pesos.format(resumen.aportePorPago)}
              </p>
              <p className="text-sm text-muted-foreground">Aportación por periodo</p>
              <table className="mt-4 w-full text-left text-sm tabular-nums">
                <thead>
                  <tr>
                    <th scope="col" className="py-2">
                      Cobertura
                    </th>
                    <th scope="col" className="text-right">
                      Suma
                    </th>
                    <th scope="col" className="text-right">
                      Prima anual
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.primas.map((fila) => (
                    <tr key={fila.cobertura} className="border-t border-primary/15">
                      <th scope="row" className="py-2 pr-2 font-normal">
                        {COBERTURAS_MET4U[fila.cobertura]}
                      </th>
                      <td className="text-right">{pesos.format(fila.suma)}</td>
                      <td className="pl-2 text-right">{pesos.format(fila.prima)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <dl className="mt-3 space-y-2 border-t border-primary/20 pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt>Prima anual de coberturas</dt>
                  <dd>{pesos.format(resumen.coberturaAnual)}</dd>
                </div>
                {!!datosCotizados.ahorroAnual && (
                  <div className="flex justify-between gap-3">
                    <dt>Aportación anual programada</dt>
                    <dd>{pesos.format(datosCotizados.ahorroAnual)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt>Aportación anual total</dt>
                  <dd>{pesos.format(resumen.aporteAnual)}</dd>
                </div>
              </dl>
              <button
                type="button"
                className="btn-outline mt-4 print:hidden"
                onClick={() => window.print()}
              >
                <Printer className="size-4" aria-hidden="true" /> Imprimir resumen
              </button>
            </>
          )}
        </div>
      </section>
      {proyeccion && datosCotizados && (
        <section className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-8 lg:col-span-2 print:mt-6 print:border-0 print:p-0">
          <h2 className="text-2xl">Proyección de Met4U</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Rendimiento anual ilustrativo. Fondo fijo{" "}
            {(
              ESCENARIOS_MET4U[datosCotizados.escenarioFijo ?? "optimista"].fija * 100
            ).toLocaleString("es-MX")}{" "}
            %.
            {!!datosCotizados.porcentajeVariable && (
              <>
                {" "}
                Fondo variable{" "}
                {(
                  ESCENARIOS_MET4U[datosCotizados.escenarioVariable ?? "optimista"].variable * 100
                ).toLocaleString("es-MX")}{" "}
                % para el {datosCotizados.porcentajeVariable} % de la aportación.
              </>
            )}{" "}
            {mostrarRetiros
              ? "Los retiros solicitados se proyectan al cierre del año."
              : "Proyección sin retiros."}
          </p>
          <div className="mt-4 overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse text-right text-sm tabular-nums print:text-[9px]">
              <thead>
                <tr>
                  {[
                    "Año",
                    "Aportación anual",
                    ...(mostrarRetiros ? ["Retiro solicitado"] : []),
                    "Fondo básico",
                    "Fondo adicional",
                    "Valor de rescate",
                    "Suma básica",
                  ].map((titulo) => (
                    <th key={titulo} scope="col" className="px-2 py-2">
                      {titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {proyeccion
                  .filter((fila) => fila.mes === 12)
                  .map((fila) => {
                    const total = proyeccion
                      .slice((fila.anio - 1) * 12, fila.anio * 12)
                      .reduce((acumulado, mes) => acumulado + mes.aportacion, 0);
                    return (
                      <tr
                        key={fila.anio}
                        className="border-t border-border print:break-inside-avoid"
                      >
                        <th scope="row" className="px-2 py-2">
                          {fila.anio}
                        </th>
                        {[
                          total,
                          ...(mostrarRetiros ? [fila.retiroSolicitado] : []),
                          fila.fondoBasicoRemanente,
                          fila.fondoAdicional,
                          fila.rescateReporte,
                          fila.sumaBasica,
                        ].map((valor, indice) => (
                          <td key={indice} className="px-2 py-2">
                            {pesosReporte.format(valor)}
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
