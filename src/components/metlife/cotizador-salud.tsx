import { createServerFn } from "@tanstack/react-start";
import { Calculator, Plus, Printer, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import {
  FRECUENCIAS_SALUD,
  PARENTESCOS,
  solicitudSaludSchema,
  type RespuestaSalud,
  type SolicitudSalud,
} from "@/lib/metlife-salud";

import { solicitudGmm } from "@/lib/metlife-gmm";
import { ParametrosGmm } from "./parametros-gmm";

const cotizar = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => solicitudSaludSchema.parse(value))
  .handler(async ({ data }) => {
    const { cotizarSalud } = await import("@/lib/metlife-salud.server");
    return cotizarSalud(data);
  });

const cotizarMedica = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => solicitudGmm.parse(value))
  .handler(async ({ data }) => {
    const { cotizarGmm } = await import("@/lib/metlife-gmm.server");
    return cotizarGmm(data);
  });

const entrada =
  "mt-1.5 w-full rounded-lg border border-input bg-card px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-ring";
const formato = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

type ResultadoSalud = Exclude<RespuestaSalud, { error: string }>;
export type CotizacionPrimordial = {
  solicitud: Extract<SolicitudSalud, { producto: "Primordial" }>;
  resultado: ResultadoSalud;
};

export function CotizadorSalud({
  producto,
  primordialCombinado,
  combinarConMedica,
  combinarConMeta,
  cancelarCombinacion,
}: {
  producto: SolicitudSalud["producto"] | "MedicaLife";
  primordialCombinado?: CotizacionPrimordial;
  combinarConMedica: (cotizacion: CotizacionPrimordial) => void;
  combinarConMeta: (cotizacion: CotizacionPrimordial) => void;
  cancelarCombinacion: () => void;
}) {
  const [asegurados, setAsegurados] = useState([0]);
  const [siguiente, setSiguiente] = useState(1);
  const [resultado, setResultado] = useState<RespuestaSalud>();
  const [solicitudPrimordial, setSolicitudPrimordial] =
    useState<CotizacionPrimordial["solicitud"]>();
  const [pendiente, setPendiente] = useState(false);
  const primordial = producto === "Primordial";
  const gmm = producto === "MedicaLife";
  const combinada = gmm ? primordialCombinado : undefined;
  const titulo = gmm ? "MédicaLife" : producto;
  const parentescos = Object.entries(PARENTESCOS).filter(([id]) =>
    primordial ? id !== "otro" : id !== "madre" && id !== "padre",
  );

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const personas = asegurados.map((id) => ({
      parentesco: form.get(`parentesco-${id}`),
      edad: Number(form.get(`edad-${id}`)),
      sexo: form.get(`sexo-${id}`),
      mujer: form.get(`mujer-${id}`) === "on",
      plus: form.get(`plus-${id}`) === "on",
      familiar: form.get(`familiar-${id}`) === "on",
    }));

    const medica = solicitudGmm.safeParse({
      vigencia: form.get("vigencia"),
      plan: Number(form.get("plan")),
      municipio: Number(form.get("municipio")),
      suma: Number(form.get("sumaGmm")),
      deducible: Number(form.get("deducible")),
      deducibleExt: Number(form.get("deducibleExt")),
      coaseguro: Number(form.get("coaseguro")),
      tabulador: Number(form.get("tabulador")),
      frecuencia: combinada?.solicitud.frecuencia ?? form.get("frecuencia"),
      conversion: form.get("conversion"),
      beneficios: form.getAll("beneficiosGmm"),
      muerteAccidental: Number(form.get("muerteAccidental")),
      ultimosGastos: Number(form.get("ultimosGastos")),
      rentaDiaria: Number(form.get("rentaDiaria")),
      asegurados: combinada?.solicitud.asegurados ?? personas,
    });
    if (gmm) {
      if (!medica.success || form.get("plan") === "")
        return setResultado({ error: "Revisa los parámetros de MédicaLife." });
      setResultado(undefined);
      setPendiente(true);
      try {
        setResultado(await cotizarMedica({ data: medica.data }));
      } catch {
        setResultado({ error: "No se pudo consultar el tarifario. Intenta nuevamente." });
      } finally {
        setPendiente(false);
      }
      return;
    }

    const solicitud = solicitudSaludSchema.safeParse({
      producto,
      frecuencia: form.get("frecuencia"),
      ampliada: form.get("ampliada") === "on",
      renovacion: form.get("renovacion") === "on",
      suma: Number(form.get("suma")),
      asegurados: personas,
    });
    if (!solicitud.success) {
      setResultado({ error: "Revisa las edades y los datos de las personas aseguradas." });
      return;
    }
    setResultado(undefined);
    setSolicitudPrimordial(solicitud.data.producto === "Primordial" ? solicitud.data : undefined);
    setPendiente(true);
    try {
      setResultado(await cotizar({ data: solicitud.data }));
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
        className="rounded-2xl border border-border bg-card p-5 sm:p-8 print:hidden"
        onSubmit={enviar}
        onChange={() => setResultado(undefined)}
      >
        <fieldset disabled={pendiente} className="min-w-0">
          <legend className="font-display text-2xl">
            {titulo}
            {primordial ? " Familiar" : ""}
          </legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Forma de pago
              <select
                name="frecuencia"
                className={entrada}
                value={combinada?.solicitud.frecuencia}
                disabled={!!combinada}
              >
                {FRECUENCIAS_SALUD.map((opcion) => (
                  <option key={opcion}>{opcion}</option>
                ))}
              </select>
            </label>
            {primordial ? (
              <div className="space-y-2 self-end text-sm font-medium">
                <label className="flex items-center gap-2">
                  <input name="renovacion" type="checkbox" /> Renovación
                </label>
                <label className="flex items-center gap-2">
                  <input name="ampliada" type="checkbox" defaultChecked /> Suma adicional
                </label>
              </div>
            ) : (
              !gmm && (
                <label className="text-sm font-medium">
                  Suma básica
                  <select name="suma" className={entrada}>
                    {[500000, 1000000, 3000000, 5000000].map((suma) => (
                      <option value={suma} key={suma}>
                        {formato.format(suma)}
                      </option>
                    ))}
                  </select>
                </label>
              )
            )}
          </div>

          {gmm && <ParametrosGmm />}
          {combinada ? (
            <div className="mt-5 rounded-lg border border-border p-3 text-sm">
              <h2 className="font-semibold">Personas de la cotización Primordial</h2>
              <ul className="mt-2 space-y-1">
                {combinada.solicitud.asegurados.map(({ parentesco, edad, sexo }, indice) => (
                  <li key={indice}>
                    {PARENTESCOS[parentesco]} · {edad} años ·{" "}
                    {sexo === "F" ? "Femenino" : "Masculino"}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-3 text-primary"
                onClick={() => {
                  setResultado(undefined);
                  cancelarCombinacion();
                }}
              >
                Quitar Primordial de esta cotización
              </button>
            </div>
          ) : (
            asegurados.map((id, index) => (
              <fieldset key={id} className="mt-5 min-w-0 rounded-lg border border-border p-3">
                <legend className="px-1 text-sm font-semibold">Persona {index + 1}</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-sm font-medium">
                    Parentesco
                    <select
                      name={`parentesco-${id}`}
                      className={entrada}
                      defaultValue={index === 0 ? "titular" : "hijo"}
                    >
                      {parentescos.map(([valor, etiqueta]) => (
                        <option key={valor} value={valor}>
                          {etiqueta}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium">
                    Edad
                    <input
                      name={`edad-${id}`}
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
                    <select name={`sexo-${id}`} className={entrada} defaultValue="" required>
                      <option disabled value="">
                        Selecciona
                      </option>
                      <option value="F">Femenino</option>
                      <option value="M">Masculino</option>
                    </select>
                  </label>
                </div>
                {!primordial && !gmm && (
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    {[
                      ["mujer", "Mujer"],
                      ["plus", "Plus"],
                      ["familiar", "Familiar"],
                    ].map(([opcion, etiqueta]) => (
                      <label className="flex items-center gap-1.5" key={opcion}>
                        <input name={`${opcion}-${id}`} type="checkbox" /> {etiqueta}
                      </label>
                    ))}
                  </div>
                )}
                {asegurados.length > 1 && (
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1 text-sm text-primary"
                    onClick={() => {
                      setAsegurados((items) => items.filter((item) => id !== item));
                      setResultado(undefined);
                    }}
                  >
                    <X className="size-4" aria-hidden="true" /> Quitar persona {index + 1}
                  </button>
                )}
              </fieldset>
            ))
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {!combinada && (
              <button
                type="button"
                className="btn-outline"
                disabled={asegurados.length >= 20}
                onClick={() => {
                  setAsegurados([...asegurados, siguiente]);
                  setSiguiente(siguiente + 1);
                  setResultado(undefined);
                }}
              >
                <Plus className="size-4" aria-hidden="true" /> Agregar persona
              </button>
            )}
            <button type="submit" className="btn-primary">
              <Calculator className="size-4" aria-hidden="true" />{" "}
              {pendiente ? "Calculando…" : "Calcular prima"}
            </button>
          </div>
        </fieldset>
      </form>

      <section
        aria-labelledby="resultado-salud"
        aria-busy={pendiente}
        className="rounded-2xl border border-primary/15 bg-primary-soft p-5 sm:p-8 print:border-0 print:bg-white print:p-0"
      >
        <h2 id="resultado-salud" className="text-2xl">
          Resultado de {titulo}
        </h2>
        <div className="mt-3" aria-live="polite">
          {resultado && "error" in resultado && <p>{resultado.error}</p>}
          {!resultado && (
            <p className="text-muted-foreground">
              {pendiente ? "Consultando tarifas." : "Completa los datos para conocer la prima."}
            </p>
          )}
          {resumen && (
            <>
              <p className="font-display text-4xl tabular-nums">{formato.format(resumen.total)}</p>
              <p className="text-sm text-muted-foreground">Prima anual total con IVA</p>
              <dl className="mt-5 space-y-2 border-t border-primary/20 pt-4 text-sm">
                {[
                  ...resumen.primas.map((prima, indice) => [
                    `Prima de persona ${indice + 1}`,
                    prima,
                  ]),
                  ["Prima neta", resumen.neta],
                  ["Recargo por forma de pago", resumen.recargo],
                  ["Derecho de póliza", resumen.derecho],
                  ["IVA", resumen.iva],
                  ...(resumen.pagos > 1
                    ? [
                        ["Primer pago", resumen.primerPago],
                        ["Cada pago subsecuente", resumen.subsecuente],
                      ]
                    : []),
                ].map(([etiqueta, importe]) => (
                  <div key={etiqueta} className="flex justify-between gap-3">
                    <dt>{etiqueta}</dt>
                    <dd>{formato.format(Number(importe))}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-sm text-muted-foreground">
                Importes de referencia del tarifario 7.6, sujetos a confirmación de MetLife.
              </p>
              {!combinada && (
                <div className="mt-4 flex flex-wrap gap-3 print:hidden">
                  <button type="button" className="btn-outline" onClick={() => window.print()}>
                    <Printer className="size-4" aria-hidden="true" /> Imprimir o guardar PDF
                  </button>
                  {solicitudPrimordial && (
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() =>
                        combinarConMedica({ solicitud: solicitudPrimordial, resultado: resumen })
                      }
                    >
                      Combinar con MédicaLife
                    </button>
                  )}
                  {solicitudPrimordial && (
                    <button
                      type="button"
                      className="btn-outline"
                      disabled={solicitudPrimordial.frecuencia.endsWith(" TC")}
                      onClick={() =>
                        combinarConMeta({ solicitud: solicitudPrimordial, resultado: resumen })
                      }
                    >
                      Combinar con MetaLife
                    </button>
                  )}
                  {solicitudPrimordial?.frecuencia.endsWith(" TC") && (
                    <p className="w-full text-sm">
                      Para combinar con MetaLife, elige una forma de pago sin tarjeta.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {resumen && combinada && <ResultadoCombinado primordial={combinada} medica={resumen} />}
      {!!resumen?.coberturas.length && (
        <CoberturasSalud
          titulo={combinada ? "Coberturas de MédicaLife" : "Coberturas del plan"}
          coberturas={resumen.coberturas}
          primordial={primordial}
        />
      )}
      {resumen && combinada && (
        <CoberturasSalud
          titulo="Coberturas de Primordial"
          coberturas={combinada.resultado.coberturas}
          primordial
        />
      )}
    </div>
  );
}

function ResultadoCombinado({
  primordial,
  medica,
}: {
  primordial: CotizacionPrimordial;
  medica: ResultadoSalud;
}) {
  const familiar = primordial.resultado;
  const filas = [
    ["Prima de MédicaLife", medica.total],
    ["Prima de Primordial", familiar.total],
    ["Prima total combinada con IVA", medica.total + familiar.total],
    ...(medica.pagos > 1
      ? [
          ["Primer pago combinado", medica.primerPago + familiar.primerPago],
          ["Cada pago subsecuente combinado", medica.subsecuente + familiar.subsecuente],
        ]
      : []),
  ];
  return (
    <section className="rounded-2xl border border-primary/15 bg-primary-soft p-5 sm:p-8 lg:col-span-2 print:mt-6 print:break-inside-avoid print:border-0 print:bg-white print:p-0">
      <h2 className="text-2xl">MédicaLife y Primordial</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {primordial.solicitud.frecuencia} · Pesos mexicanos ·{" "}
        {primordial.solicitud.asegurados.length}
        {" personas aseguradas"}
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        {filas.map(([etiqueta, importe]) => (
          <div key={etiqueta} className="flex justify-between gap-3">
            <dt>{etiqueta}</dt>
            <dd className="shrink-0 tabular-nums">{formato.format(Number(importe))}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        className="btn-outline mt-4 print:hidden"
        onClick={() => window.print()}
      >
        <Printer className="size-4" aria-hidden="true" /> Imprimir combinación
      </button>
    </section>
  );
}

export function CoberturasSalud({
  titulo,
  coberturas,
  primordial,
}: {
  titulo: string;
  coberturas: ResultadoSalud["coberturas"];
  primordial?: boolean;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-8 lg:col-span-2 print:mt-6 print:border-0 print:p-0">
      <h2 className="text-2xl">{titulo}</h2>
      <div className="mt-4 overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-secondary print:bg-white">
            <tr>
              {["Paquete", "Cobertura", "Suma asegurada", primordial ? "Espera" : "Deducible"].map(
                (column) => (
                  <th className="px-2 py-2" scope="col" key={column}>
                    {column}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {coberturas.map((item) => (
              <tr
                key={`${item.grupo}-${item.nombre}`}
                className="border-b border-border print:break-inside-avoid"
              >
                <td className="px-2 py-2">{item.grupo}</td>
                <th scope="row" className="px-2 py-2 font-normal">
                  {item.nombre}
                </th>
                <td className="px-2 py-2 tabular-nums">{formato.format(item.monto)}</td>
                <td className="px-2 py-2">
                  {primordial ? item.espera : item.deducible ? `${item.deducible} UMAM` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
