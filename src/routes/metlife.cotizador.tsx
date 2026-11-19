import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { Calculator, Printer } from "lucide-react";
import { useState, type FormEvent } from "react";

import { CentroShell } from "@/components/centro-shell";
import {
  PAGOS,
  PLANES,
  etiquetaPlazo,
  plazosDe,
  solicitudSchema,
  type SolicitudMetLife,
} from "@/lib/metlife";
import type { RespuestaCotizacion } from "@/lib/metlife.server";

const calcular = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => solicitudSchema.parse(entrada))
  .handler(async ({ data }) => {
    const { cotizarMetLife } = await import("@/lib/metlife.server");
    return cotizarMetLife(data);
  });

export const Route = createFileRoute("/metlife/cotizador")({
  head: () => ({
    meta: [
      { title: "Cotizador MetLife | AJ Consultoría" },
      { name: "description", content: "Calcula la prima básica de los planes TempoLife." },
    ],
  }),
  component: CotizadorMetLife,
});

const entrada =
  "mt-1.5 w-full rounded-lg border border-input bg-card px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-ring";

function CotizadorMetLife() {
  const [plan, setPlan] = useState<SolicitudMetLife["plan"]>(1);
  const [moneda, setMoneda] = useState<SolicitudMetLife["moneda"]>("MXN");
  const [plazo, setPlazo] = useState(10);
  const [respuesta, setRespuesta] = useState<RespuestaCotizacion>();
  const [pendiente, setPendiente] = useState(false);
  const [frecuencia, setFrecuencia] = useState<SolicitudMetLife["frecuencia"]>("anual");

  const plazos = plazosDe({ plan, moneda });
  const plazoActivo = plazos.includes(plazo) ? plazo : plazos[0];
  const dinero = new Intl.NumberFormat("es-MX", { style: "currency", currency: moneda });
  const cotizacion = respuesta && "cotizacion" in respuesta ? respuesta.cotizacion : undefined;
  const error = respuesta && "error" in respuesta ? respuesta.error : undefined;

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const solicitud = solicitudSchema.safeParse({
      plan,
      moneda,
      plazo: plazoActivo,
      edad: Number(form.get("edad")),
      sexo: form.get("sexo"),
      fuma: form.get("fuma"),
      suma: Number(form.get("suma")),
      frecuencia,
    });

    if (!solicitud.success) {
      setRespuesta({
        error: "Revisa la edad, la suma asegurada y los demás datos de la solicitud.",
      });
      return;
    }
    setRespuesta(undefined);
    setPendiente(true);
    try {
      setRespuesta(await calcular({ data: solicitud.data }));
    } catch {
      setRespuesta({ error: "No se pudo consultar el tarifario. Intenta nuevamente." });
    } finally {
      setPendiente(false);
    }
  }

  return (
    <CentroShell>
      <div className="container-aj max-w-6xl py-10 sm:py-16">
        <header className="mb-8 max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-primary">Línea Individual · Vida</p>
          <h1 className="text-4xl leading-tight sm:text-6xl">Cotizador MetLife</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Calcula la prima de la cobertura básica TempoLife con el tarifario del cotizador 7.6.
          </p>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
          <form
            onSubmit={enviar}
            onChange={() => setRespuesta(undefined)}
            className="rounded-2xl border border-border bg-card p-5 sm:p-8 print:hidden"
          >
            <fieldset disabled={pendiente} className="min-w-0">
              <legend className="font-display text-2xl">Datos de la cotización</legend>
              <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <label className="text-sm font-medium sm:col-span-2">
                  Plan
                  <select
                    name="plan"
                    className={entrada}
                    value={plan}
                    onChange={(event) => setPlan(Number(event.target.value) as typeof plan)}
                  >
                    {Object.entries(PLANES).map(([id, item]) => (
                      <option key={id} value={id}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Moneda
                  <select
                    name="moneda"
                    className={entrada}
                    value={moneda}
                    onChange={(event) => setMoneda(event.target.value as typeof moneda)}
                  >
                    <option value="MXN">Pesos mexicanos (MXN)</option>
                    <option value="USD">Dólares estadounidenses (USD)</option>
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Plazo
                  <select
                    name="plazo"
                    className={entrada}
                    value={plazoActivo}
                    onChange={(event) => setPlazo(Number(event.target.value))}
                  >
                    {plazos.map((item) => (
                      <option key={item} value={item}>
                        {etiquetaPlazo(item)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Edad
                  <input
                    name="edad"
                    type="number"
                    min={plan === 1 ? 15 : 18}
                    max={plazoActivo === 65 ? 60 : 70}
                    step="1"
                    required
                    className={entrada}
                  />
                </label>
                <label className="text-sm font-medium">
                  Sexo
                  <select name="sexo" className={entrada} defaultValue="" required>
                    <option value="" disabled>
                      Selecciona
                    </option>
                    <option value="F">Femenino</option>
                    <option value="M">Masculino</option>
                  </select>
                </label>
                <label className="text-sm font-medium">
                  ¿Fuma?
                  <select name="fuma" className={entrada} defaultValue="" required>
                    <option value="" disabled>
                      Selecciona
                    </option>
                    <option value="N">No</option>
                    <option value="S">Sí</option>
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Suma asegurada ({moneda})
                  <input
                    name="suma"
                    type="number"
                    min="1"
                    max="2147483647"
                    step="1"
                    required
                    className={entrada}
                  />
                </label>
                <label className="text-sm font-medium sm:col-span-2">
                  Forma de pago
                  <select
                    name="frecuencia"
                    className={entrada}
                    value={frecuencia}
                    onChange={(event) => setFrecuencia(event.target.value as typeof frecuencia)}
                  >
                    {Object.entries(PAGOS).map(([id, item]) => (
                      <option key={id} value={id}>
                        {item.etiqueta}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                type="submit"
                className="btn-primary mt-6 w-full sm:w-auto"
                disabled={pendiente}
              >
                <Calculator aria-hidden="true" className="size-4" />
                {pendiente ? "Calculando…" : "Calcular prima"}
              </button>
            </fieldset>
          </form>

          <section
            aria-labelledby="resumen-metlife"
            aria-busy={pendiente}
            className="rounded-2xl border border-primary/15 bg-primary-soft p-5 sm:p-8 print:border-0 print:bg-white"
          >
            <h2 id="resumen-metlife" className="text-2xl">
              Resultado
            </h2>
            <div className="mt-3" aria-live="polite">
              {error && <p className="rounded-lg bg-card p-3 text-foreground">{error}</p>}
              {!respuesta && (
                <p className="text-muted-foreground">
                  {pendiente ? "Consultando tarifas." : "Completa los datos para conocer la prima."}
                </p>
              )}
              {cotizacion && (
                <>
                  <p className="text-sm text-muted-foreground">
                    {PLANES[plan].nombre} · {etiquetaPlazo(plazoActivo)} · {moneda}
                  </p>
                  <p className="mt-4 font-display text-4xl tabular-nums">
                    {dinero.format(cotizacion.pago)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {cotizacion.pagos === 1 ? "Pago anual" : `${cotizacion.pagos} pagos al año`}
                  </p>
                  <dl className="mt-5 space-y-2 border-t border-primary/20 pt-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt>Cobertura básica</dt>
                      <dd>{dinero.format(cotizacion.basica)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Cargo fijo</dt>
                      <dd>{dinero.format(cotizacion.cargoFijo)}</dd>
                    </div>
                    <div className="flex justify-between gap-3 font-semibold">
                      <dt>Prima anual</dt>
                      <dd>{dinero.format(cotizacion.primaAnual)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Recargo por forma de pago</dt>
                      <dd>{dinero.format(cotizacion.recargo)}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Importe de referencia del tarifario 7.6, sujeto a confirmación de MetLife.
                  </p>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn-outline mt-5 print:hidden"
                  >
                    <Printer aria-hidden="true" className="size-4" />
                    Imprimir resultado
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </CentroShell>
  );
}
