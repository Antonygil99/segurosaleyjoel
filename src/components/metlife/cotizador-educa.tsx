import { createServerFn } from "@tanstack/react-start";
import { Printer } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PAGOS } from "@/lib/metlife";
import {
  ADICIONALES_EDUCA,
  EDADES_MINIDOTAL,
  solicitudEduca,
  type RespuestaEduca,
} from "@/lib/metlife-educa";

const cotizar = createServerFn({ method: "POST" })
  .validator((data: unknown) => solicitudEduca.parse(data))
  .handler(async ({ data }) => (await import("@/lib/metlife-educa.server")).cotizarEducaLife(data));

const entrada = "mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-base";
const etiqueta = "block text-sm font-medium";

function EdadSexo({
  persona,
  adulto,
  cambiarEdad,
}: {
  persona: string;
  adulto?: boolean;
  cambiarEdad?: (edad: number) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className={etiqueta}>
        Edad
        <input
          name={`${persona}-edad`}
          className={entrada}
          type="number"
          min={adulto ? 18 : 0}
          max={adulto ? 70 : 18}
          onChange={cambiarEdad ? (event) => cambiarEdad(Number(event.target.value)) : undefined}
          required
        />
      </label>
      <label className={etiqueta}>
        Sexo
        <select name={`${persona}-sexo`} className={entrada}>
          <option value="F">Femenino</option>
          <option value="M">Masculino</option>
        </select>
      </label>
      {adulto && (
        <label className={etiqueta}>
          ¿Fuma?
          <select name={`${persona}-fuma`} className={entrada}>
            <option value="N">No</option>
            <option value="S">Sí</option>
          </select>
        </label>
      )}
    </div>
  );
}

function Importe({
  nombre,
  titulo,
  requerido = false,
}: {
  nombre: string;
  titulo: string;
  requerido?: boolean;
}) {
  return (
    <label className={etiqueta}>
      {titulo}
      <input
        name={nombre}
        className={entrada}
        type="number"
        min="1"
        max="2147483647"
        required={requerido}
      />
    </label>
  );
}

function PersonaAdulta({ persona, titulo }: { persona: string; titulo: string }) {
  return (
    <fieldset className="mt-4 space-y-3 rounded-lg border border-border p-3">
      <legend className="px-1 font-medium">{titulo}</legend>
      <EdadSexo persona={persona} adulto />
      <Importe nombre={`${persona}-suma`} titulo="Suma asegurada" requerido />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name={`${persona}-gf`} /> Gastos funerarios
      </label>
    </fieldset>
  );
}

export function CotizadorEduca() {
  const [resultado, setResultado] = useState<RespuestaEduca>();
  const [pendiente, setPendiente] = useState(false);
  const [conyuge, setConyuge] = useState(false);
  const [moneda, setMoneda] = useState<"MXN" | "USD">("MXN");
  const [accidente, setAccidente] = useState("");
  const [menor, setMenor] = useState(0);
  const [dotal, setDotal] = useState(18);
  const edadDotal = Math.max(dotal, menor + 5);
  const dinero = new Intl.NumberFormat("es-MX", { style: "currency", currency: moneda });
  const dineroReporte = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
    roundingMode: "halfEven",
  } as Intl.NumberFormatOptions);
  const resumen = resultado && !("error" in resultado) ? resultado : undefined;
  const minis = resumen?.proyeccion[0]?.miniDotales ?? [];

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const importe = (nombre: string) => (form.get(nombre) ? Number(form.get(nombre)) : undefined);
    const persona = (nombre: string) => ({
      edad: importe(`${nombre}-edad`),
      sexo: form.get(`${nombre}-sexo`),
      fuma: form.get(`${nombre}-fuma`),
      suma: importe(`${nombre}-suma`),
      funerarios: form.get(`${nombre}-gf`) === "on",
    });
    const solicitud = solicitudEduca.safeParse({
      titular: persona("titular"),
      menor: persona("menor"),
      conyuge: conyuge ? persona("conyuge") : undefined,
      dotal: edadDotal,
      sumaDotal: importe("sumaDotal"),
      miniDotales: form.getAll("miniDotales").map(Number),
      moneda,
      frecuencia: form.get("frecuencia"),
      adicionales: {
        PASI: importe("PASI"),
        IMA: accidente === "IMA" ? importe("accidenteSuma") : undefined,
        TIBA: accidente === "TIBA" ? importe("accidenteSuma") : undefined,
        EG: importe("EG"),
      },
    });
    if (!solicitud.success) {
      setResultado({ error: "Revisa las edades, el plazo y las sumas aseguradas." });
      return;
    }
    setResultado(undefined);
    setPendiente(true);
    try {
      setResultado(await cotizar({ data: solicitud.data }));
    } catch {
      setResultado({ error: "No se pudo consultar el tarifario. Intenta nuevamente." });
    } finally {
      setPendiente(false);
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr] print:block">
      <form
        onSubmit={enviar}
        onChange={() => setResultado(undefined)}
        className="rounded-2xl border border-border bg-card p-5 sm:p-8 print:hidden"
      >
        <fieldset disabled={pendiente} className="min-w-0">
          <legend className="font-display text-2xl">EducaLife</legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className={etiqueta}>
              Moneda
              <select
                name="moneda"
                className={entrada}
                value={moneda}
                onChange={(e) => setMoneda(e.target.value === "USD" ? "USD" : "MXN")}
              >
                <option value="MXN">Pesos mexicanos</option>
                <option value="USD">Dólares estadounidenses</option>
              </select>
            </label>
            <label className={etiqueta}>
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
          <PersonaAdulta persona="titular" titulo="Titular" />
          <fieldset className="mt-4 space-y-3 rounded-lg border border-border p-3">
            <legend className="px-1 font-medium">Menor</legend>
            <EdadSexo persona="menor" cambiarEdad={(edad) => setMenor(Math.min(18, edad))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={etiqueta}>
                Edad al recibir el dotal
                <select
                  name="dotal"
                  className={entrada}
                  value={edadDotal}
                  onChange={(e) => setDotal(Number(e.target.value))}
                >
                  {[18, 19, 20, 21, 22, 23]
                    .filter((edad) => edad >= menor + 5)
                    .map((edad) => (
                      <option key={edad}>{edad}</option>
                    ))}
                </select>
              </label>
              <Importe nombre="sumaDotal" titulo="Suma dotal (opcional)" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input name="menor-gf" type="checkbox" /> Gastos funerarios
            </label>
            <div className="flex flex-wrap gap-3">
              {Object.entries(EDADES_MINIDOTAL)
                .filter(([, maximo]) => menor <= maximo)
                .map(([edad]) => (
                  <label className="flex items-center gap-2 text-sm" key={edad}>
                    <input type="checkbox" name="miniDotales" value={edad} /> Mini dotal a los{" "}
                    {edad} años
                  </label>
                ))}
            </div>
          </fieldset>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              name="conyuge"
              type="checkbox"
              checked={conyuge}
              onChange={(e) => setConyuge(e.target.checked)}
            />{" "}
            Agregar cónyuge
          </label>
          {conyuge && <PersonaAdulta persona="conyuge" titulo="Cónyuge" />}
          <fieldset className="mt-4 grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
            <legend className="px-1 font-medium">Coberturas adicionales del titular</legend>
            <Importe nombre="PASI" titulo={ADICIONALES_EDUCA.PASI} />
            <Importe nombre="EG" titulo={ADICIONALES_EDUCA.EG} />
            <label className={etiqueta}>
              Cobertura accidental
              <select
                className={entrada}
                value={accidente}
                onChange={(e) => setAccidente(e.target.value)}
              >
                <option value="">Sin cobertura</option>
                <option value="IMA">{ADICIONALES_EDUCA.IMA}</option>
                <option value="TIBA">{ADICIONALES_EDUCA.TIBA}</option>
              </select>
            </label>
            {accidente && <Importe nombre="accidenteSuma" titulo="Suma accidental" requerido />}
          </fieldset>
          <button type="submit" className="btn-primary mt-5">
            {pendiente ? "Calculando…" : "Calcular prima"}
          </button>
        </fieldset>
      </form>
      <section
        className="rounded-2xl border border-primary/15 bg-primary-soft p-5 sm:p-8 print:border-0 print:bg-white print:p-0"
        aria-busy={pendiente}
      >
        <h2 className="text-2xl">Cotización de EducaLife</h2>
        <div className="mt-3" aria-live="polite">
          {!resultado && (
            <p className="text-muted-foreground">
              {pendiente ? "Consultando tarifas." : "Completa los datos para conocer la prima."}
            </p>
          )}
          {resultado && "error" in resultado && <p>{resultado.error}</p>}
          {resumen && (
            <>
              <p className="font-display text-4xl tabular-nums">{dinero.format(resumen.pago)}</p>
              <p className="text-sm text-muted-foreground">Prima por periodo · {moneda}</p>
              <table className="mt-4 w-full text-left text-sm">
                <thead>
                  <tr>
                    <th scope="col">Cobertura</th>
                    <th scope="col" className="text-right">
                      Suma
                    </th>
                    <th scope="col" className="text-right">
                      Prima anual
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.filas.map((fila) => (
                    <tr key={fila.nombre} className="border-t border-border">
                      <th scope="row" className="py-2 text-left font-normal">
                        {fila.nombre}
                      </th>
                      <td className="text-right">
                        {fila.suma === undefined ? "—" : dinero.format(fila.suma)}
                      </td>
                      <td className="pl-2 text-right">{dinero.format(fila.prima)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>Prima anual</dt>
                  <dd>{dinero.format(resumen.anual)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Recargo por pago fraccionado</dt>
                  <dd>{dinero.format(resumen.recargo)}</dd>
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
          <h2 className="text-2xl">Proyección de primas y dotal</h2>
          <table className="mt-4 w-full text-right text-sm tabular-nums">
            <thead>
              <tr>
                {[
                  "Año",
                  "Prima anual",
                  "Prima acumulada",
                  "Valor de rescate",
                  "Dotal",
                  ...minis.map(({ edad }) => `Mini dotal a los ${edad} años`),
                ].map((columna) => (
                  <th key={columna} scope="col" className="py-2">
                    {columna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resumen.proyeccion.map((fila) => (
                <tr key={fila.anio} className="border-t border-border print:break-inside-avoid">
                  <th scope="row" className="py-2">
                    {fila.anio}
                  </th>
                  <td>{dineroReporte.format(fila.prima)}</td>
                  <td>{dineroReporte.format(fila.acumulada)}</td>
                  <td>{dineroReporte.format(fila.rescate)}</td>
                  <td>{fila.dotal ? dineroReporte.format(fila.dotal) : "—"}</td>
                  {fila.miniDotales.map(({ edad, rescate }) => (
                    <td key={edad}>{rescate === null ? "—" : dineroReporte.format(rescate)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
