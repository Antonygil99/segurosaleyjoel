import { createServerFn } from "@tanstack/react-start";
import { Calculator, Printer } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PAGOS } from "@/lib/metlife";
import {
  COBERTURAS_MET4U,
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

export function CotizadorMet4U() {
  const [resultado, setResultado] = useState<RespuestaMet4U>();
  const [datosCotizados, setDatosCotizados] = useState<SolicitudMet4U>();
  const [pendiente, setPendiente] = useState(false);
  const [plazo, setPlazo] = useState<10 | 99>(10);

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
        <p className="mt-4 text-sm text-muted-foreground">
          La proyección de fondos de Met4U está pendiente de validación.
        </p>
      </section>
    </div>
  );
}
