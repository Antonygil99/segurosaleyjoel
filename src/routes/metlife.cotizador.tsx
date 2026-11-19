import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { Calculator, Printer } from "lucide-react";
import { useState, type FormEvent } from "react";

import { CentroShell } from "@/components/centro-shell";
import { CotizadorMet4U } from "@/components/metlife/cotizador-met4u";
import { CotizadorSalud, type CotizacionPrimordial } from "@/components/metlife/cotizador-salud";
import { ResultadoVida } from "@/components/metlife/resultado-vida";
import {
  COBERTURAS,
  LIQUIDACION_HORIZONTE,
  REGIMEN_HORIZONTE,
  MONEDAS,
  PAGOS,
  PLANES,
  TIPO_CAMBIO_HORIZONTE,
  etiquetaPlazo,
  monedasDe,
  plazosDe,
  regimenesHorizonte,
  solicitudSchema,
  type SolicitudMetLife,
} from "@/lib/metlife";
import type { RespuestaCotizacion } from "@/lib/metlife.server";

type CotizacionGuardada = {
  solicitud: SolicitudMetLife;
  respuesta: Extract<RespuestaCotizacion, { cotizacion: unknown }>;
};

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
      { name: "description", content: "Cotiza los planes de Vida tradicional de MetLife." },
    ],
  }),
  component: CotizadorMetLife,
});

const entrada =
  "mt-1.5 w-full rounded-lg border border-input bg-card px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-ring";

function Monto({ etiqueta, name }: { etiqueta: string; name: string }) {
  return (
    <label className="text-sm font-medium">
      {etiqueta}
      <input name={name} type="number" min="1" max="2147483647" step="1" className={entrada} />
    </label>
  );
}

function CotizadorMetLife() {
  const [producto, setProducto] = useState<
    "vida" | "Primordial" | "MetPlus" | "MedicaLife" | "Met4U"
  >("vida");
  const [primordial, setPrimordial] = useState<CotizacionPrimordial>();
  return (
    <CentroShell soloContenidoImpreso>
      <div className="container-aj max-w-6xl py-10 sm:py-16 print:py-4">
        <header className="mb-8 max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-primary">Línea Individual</p>
          <h1 className="text-4xl leading-tight sm:text-6xl">Cotizador MetLife</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground print:hidden">
            Calcula la prima con los tarifarios de la versión 7.6.
          </p>
        </header>
        <label className="mb-5 block max-w-sm text-sm font-medium print:hidden">
          Producto
          <select
            className={entrada}
            value={producto}
            onChange={(event) => {
              setPrimordial(undefined);
              setProducto(event.target.value as typeof producto);
            }}
          >
            <option value="vida">Vida tradicional</option>
            <option value="MedicaLife">MédicaLife</option>
            <option value="Primordial">Primordial</option>
            <option value="MetPlus">MetPlus</option>
            <option value="Met4U">Met4U</option>
          </select>
        </label>
        {producto === "vida" ? (
          <CotizadorVida />
        ) : producto === "Met4U" ? (
          <CotizadorMet4U />
        ) : (
          <CotizadorSalud
            key={producto}
            producto={producto}
            primordialCombinado={primordial}
            combinarConMedica={(cotizacion) => {
              setPrimordial(cotizacion);
              setProducto("MedicaLife");
            }}
            cancelarCombinacion={() => setPrimordial(undefined)}
          />
        )}
      </div>
    </CentroShell>
  );
}

function CotizadorVida() {
  const [plan, setPlan] = useState<SolicitudMetLife["plan"]>(1);
  const [moneda, setMoneda] = useState<SolicitudMetLife["moneda"]>("MXN");
  const [plazo, setPlazo] = useState(10);
  const [respuesta, setRespuesta] = useState<RespuestaCotizacion>();
  const [ultimaSolicitud, setUltimaSolicitud] = useState<SolicitudMetLife>();
  const [pendiente, setPendiente] = useState(false);
  const [accidente, setAccidente] = useState("");
  const [plazoPago, setPlazoPago] = useState<5 | 10 | 100>(100);
  const [regimen, setRegimen] = useState<keyof typeof REGIMEN_HORIZONTE>("noDeduce");
  const [planesGuardados, setPlanesGuardados] = useState<CotizacionGuardada[]>([]);
  const [errorCombinacion, setErrorCombinacion] = useState("");
  const primera = planesGuardados[0]?.solicitud;
  const plazos = plazosDe({ plan, moneda });
  const regimenes = regimenesHorizonte(moneda, plazo);
  const regimenActivo = regimenes.includes(regimen) ? regimen : "noDeduce";

  function cambiarPlan(nuevo: SolicitudMetLife["plan"]) {
    const opciones = monedasDe(nuevo);
    const divisa = opciones.includes(moneda) ? moneda : opciones[0];
    setPlan(nuevo);
    setMoneda(divisa);
    setPlazo(plazosDe({ plan: nuevo, moneda: divisa })[0]);
    setAccidente("");
    setPlazoPago(100);
    setRegimen("noDeduce");
  }

  function guardarPlan() {
    if (!ultimaSolicitud || !respuesta || !("cotizacion" in respuesta)) return;
    if (
      primera &&
      (primera.moneda !== ultimaSolicitud.moneda ||
        primera.edad !== ultimaSolicitud.edad ||
        primera.sexo !== ultimaSolicitud.sexo ||
        primera.fuma !== ultimaSolicitud.fuma ||
        primera.frecuencia !== ultimaSolicitud.frecuencia)
    ) {
      setErrorCombinacion(
        "Los planes combinados deben compartir moneda, forma de pago y perfil del asegurado.",
      );
      return;
    }
    const actual = { solicitud: ultimaSolicitud, respuesta };
    setErrorCombinacion("");
    setPlanesGuardados((lista) => {
      const indice = lista.findIndex(
        ({ solicitud }) =>
          solicitud.plan === actual.solicitud.plan && solicitud.plazo === actual.solicitud.plazo,
      );
      return indice < 0
        ? [...lista, actual]
        : lista.map((item, posicion) => (posicion === indice ? actual : item));
    });
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const monto = (campo: string) => {
      const campoValor = form.get(campo);
      return campoValor ? Number(campoValor) : undefined;
    };
    const solicitud = solicitudSchema.safeParse({
      plan,
      moneda,
      plazo,
      edad: Number(form.get("edad")),
      sexo: form.get("sexo"),
      fuma: form.get("fuma"),
      suma: Number(form.get("suma")),
      frecuencia: form.get("frecuencia"),
      beneficios: {
        EP: form.get("EP") === "on",
        PASI: monto("PASI"),
        EG: monto("EG"),
        GF: monto("GF"),
        accidente: accidente ? { tipo: accidente, suma: monto("accidenteSuma") } : undefined,
      },
      extraprimas: {
        vida: monto("vida"),
        invalidez: monto("invalidez"),
        accidentes: monto("accidentes"),
        millar: monto("millar"),
      },
      proyeccion: form.get("proyeccion") === "on",
      horizonte:
        plan === 12
          ? {
              plazoPago,
              liquidacion: form.get("liquidacion"),
              regimen: regimenActivo,
              tipoCambio: monto("tipoCambio"),
            }
          : undefined,
    });

    if (!solicitud.success) {
      const hayExtraprima = solicitud.error.issues.some((item) => item.path[0] === "extraprimas");
      setRespuesta({
        error: hayExtraprima
          ? "Las extraprimas porcentuales deben ser mayores al 100 % o quedar vacías."
          : "Revisa la edad, la suma asegurada y las coberturas adicionales.",
      });
      return;
    }
    setRespuesta(undefined);
    setPendiente(true);
    try {
      setUltimaSolicitud(solicitud.data);
      setRespuesta(await calcular({ data: solicitud.data }));
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
          <legend className="font-display text-2xl">Datos de la cotización</legend>
          <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <label className="text-sm font-medium sm:col-span-2">
              Plan
              <select
                name="plan"
                className={entrada}
                value={plan}
                onChange={(event) => cambiarPlan(Number(event.target.value) as typeof plan)}
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
                onChange={(event) => {
                  const divisa = event.target.value as typeof moneda;
                  setMoneda(divisa);
                  setPlazo(plazosDe({ plan, moneda: divisa })[0]);
                }}
              >
                {(plan === 12 && plazoPago < 100 ? (["MXC"] as const) : monedasDe(plan)).map(
                  (item) => (
                    <option key={item} value={item}>
                      {MONEDAS[item].etiqueta}
                    </option>
                  ),
                )}
              </select>
            </label>
            {plan === 12 && (
              <>
                <label className="text-sm font-medium">
                  Plazo de pago
                  <select
                    className={entrada}
                    value={plazoPago}
                    onChange={(event) => {
                      const pago = Number(event.target.value) as typeof plazoPago;
                      setPlazoPago(pago);
                      if (pago < 100) setMoneda("MXC");
                    }}
                  >
                    <option value={100}>Hasta la edad alcanzada</option>
                    <option value={5}>5 años</option>
                    <option value={10}>10 años</option>
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Liquidación
                  <select className={entrada} name="liquidacion" defaultValue="unica">
                    {Object.entries(LIQUIDACION_HORIZONTE).map(([valor, etiqueta]) => (
                      <option key={valor} value={valor}>
                        {etiqueta}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label className="text-sm font-medium">
              Plazo
              <select
                name="plazo"
                className={entrada}
                value={plazo}
                onChange={(event) => setPlazo(Number(event.target.value))}
              >
                {plazos.map((item) => (
                  <option key={item} value={item}>
                    {etiquetaPlazo(item)}
                  </option>
                ))}
              </select>
            </label>
            {plan === 12 && (
              <label className="text-sm font-medium">
                Opción fiscal
                <select
                  className={entrada}
                  name="regimen"
                  value={regimenActivo}
                  onChange={(event) =>
                    setRegimen(event.target.value as keyof typeof REGIMEN_HORIZONTE)
                  }
                >
                  {regimenes.map((value) => (
                    <option key={value} value={value}>
                      {REGIMEN_HORIZONTE[value]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {plan === 12 && regimenActivo === "ahorro" && moneda === "USD" && (
              <label className="text-sm font-medium">
                Tipo de cambio (MXN por USD)
                <input
                  className={entrada}
                  name="tipoCambio"
                  type="number"
                  min="15"
                  max="999999"
                  step="0.01"
                  defaultValue={TIPO_CAMBIO_HORIZONTE}
                  required
                />
              </label>
            )}
            <label className="text-sm font-medium">
              Edad
              <input
                name="edad"
                type="number"
                min="0"
                max="99"
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
              Suma asegurada ({MONEDAS[moneda].divisa})
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
              <select name="frecuencia" className={entrada} defaultValue="anual">
                {Object.entries(PAGOS).map(([id, item]) => (
                  <option key={id} value={id}>
                    {item.etiqueta}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <details className="mt-5 rounded-lg border border-border p-3">
            <summary className="cursor-pointer font-medium">Coberturas adicionales</summary>
            <div className="mt-4 grid gap-4">
              {!(plan === 1 && plazo === 1) && (
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input name="EP" type="checkbox" /> {COBERTURAS.EP}
                </label>
              )}
              <Monto etiqueta={COBERTURAS.PASI} name="PASI" />
              <Monto etiqueta={COBERTURAS.EG} name="EG" />
              <Monto etiqueta={COBERTURAS.GF} name="GF" />
              <label className="text-sm font-medium">
                Cobertura por accidente
                <select
                  className={entrada}
                  value={accidente}
                  onChange={(event) => setAccidente(event.target.value)}
                >
                  <option value="">Sin cobertura por accidente</option>
                  <option value="IMA">{COBERTURAS.IMA}</option>
                  <option value="DI">{COBERTURAS.DI}</option>
                  {plan !== 6 && plan !== 8 && <option value="TI">{COBERTURAS.TI}</option>}
                </select>
              </label>
              {accidente && <Monto etiqueta="Suma asegurada por accidente" name="accidenteSuma" />}
            </div>
          </details>
          <details className="mt-3 rounded-lg border border-border p-3">
            <summary className="cursor-pointer font-medium">Extraprimas</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ["vida", "Vida (%)"],
                ["invalidez", "Invalidez (%)"],
                ["accidentes", "Accidentes (%)"],
                ["millar", "Vida (al millar)"],
              ].map(([id, etiqueta]) => (
                <label key={id} className="text-sm font-medium">
                  {etiqueta}
                  <input name={id} type="number" min="0" step="any" className={entrada} />
                </label>
              ))}
            </div>
          </details>
          <label className="mt-5 flex items-center gap-2 text-sm font-medium">
            <input name="proyeccion" type="checkbox" defaultChecked /> Incluir proyección anual
          </label>
          <button type="submit" className="btn-primary mt-5 w-full sm:w-auto" disabled={pendiente}>
            <Calculator aria-hidden="true" className="size-4" />
            {pendiente ? "Calculando…" : "Calcular prima"}
          </button>
        </fieldset>
      </form>

      <div className={primera ? "contents print:hidden" : "contents"}>
        <ResultadoVida
          respuesta={respuesta}
          solicitud={ultimaSolicitud}
          pendiente={pendiente}
          imprimir={!primera}
        />
      </div>
      {respuesta && "cotizacion" in respuesta && (
        <button type="button" className="btn-outline w-fit print:hidden" onClick={guardarPlan}>
          Agregar a la combinación
        </button>
      )}
      {errorCombinacion && (
        <p role="alert" className="print:hidden">
          {errorCombinacion}
        </p>
      )}
      {primera && (
        <section className="lg:col-span-2">
          <h2 className="text-2xl">Planes combinados</h2>
          <ul className="mt-3 space-y-2">
            {planesGuardados.map(({ solicitud, respuesta }, indice) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-2"
                key={`${solicitud.plan}-${solicitud.plazo}`}
              >
                <span>
                  {PLANES[solicitud.plan].nombre} · {etiquetaPlazo(solicitud.plazo)}
                </span>
                <span>
                  {new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: MONEDAS[solicitud.moneda].divisa,
                  }).format(respuesta.cotizacion.primaAnual)}
                </span>
                <button
                  type="button"
                  className="text-sm text-primary print:hidden"
                  onClick={() => {
                    setPlanesGuardados((lista) => lista.filter((_, pos) => pos !== indice));
                    setErrorCombinacion("");
                  }}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <p className="my-3 font-semibold">
            Prima anual combinada{" "}
            {new Intl.NumberFormat("es-MX", {
              style: "currency",
              currency: MONEDAS[primera.moneda].divisa,
            }).format(
              planesGuardados.reduce(
                (total, { respuesta }) => total + respuesta.cotizacion.primaAnual,
                0,
              ),
            )}
          </p>
          <button type="button" className="btn-outline print:hidden" onClick={() => window.print()}>
            <Printer aria-hidden="true" className="size-4" /> Imprimir combinación
          </button>
          <div className="hidden print:block">
            {planesGuardados.map(({ solicitud, respuesta }) => (
              <div key={`${solicitud.plan}-${solicitud.plazo}`} className="print:break-before-page">
                <ResultadoVida solicitud={solicitud} respuesta={respuesta} pendiente={false} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
