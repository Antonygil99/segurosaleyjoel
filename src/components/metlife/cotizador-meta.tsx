import { createServerFn } from "@tanstack/react-start";
import { Printer } from "lucide-react";
import { useState, type FormEvent } from "react";
import { CoberturasSalud, type CotizacionPrimordial } from "./cotizador-salud";
import { PAGOS } from "@/lib/metlife";
import {
  ESCENARIOS_META,
  solicitudMeta,
  type RespuestaMeta,
  type SolicitudMeta,
} from "@/lib/metlife-meta";

const cotizar = createServerFn({ method: "POST" })
  .validator((datos: unknown) => solicitudMeta.parse(datos))
  .handler(async ({ data }) => (await import("@/lib/metlife-meta.server")).cotizarMetaLife(data));

const entrada = "mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-base";
const frecuencias = {
  Anual: "anual",
  Semestral: "semestral",
  Trimestral: "trimestral",
  Mensual: "mensual",
} as const;
const formato = (currency: string, enteros = false) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    ...(enteros ? { maximumFractionDigits: 0, roundingMode: "halfEven" } : {}),
  } as Intl.NumberFormatOptions);

export function CotizadorMeta({
  primordial,
  cancelarCombinacion,
}: {
  primordial?: CotizacionPrimordial;
  cancelarCombinacion: () => void;
}) {
  const titular = primordial?.solicitud.asegurados.find(
    ({ parentesco }) => parentesco === "titular",
  );
  const formaCombinada = primordial?.solicitud.frecuencia;
  const [modalidad, setModalidad] = useState<SolicitudMeta["modalidad"]>("suma");
  const [moneda, setMoneda] = useState<SolicitudMeta["moneda"]>("MXN");
  const [version, setVersion] = useState<SolicitudMeta["version"]>("actual");
  const [plazo, setPlazo] = useState<SolicitudMeta["plazo"]>("vitalicio");
  const [reproyectar, setReproyectar] = useState(false);
  const [retiro, setRetiro] = useState(false);
  const [cantidadAportes, setCantidadAportes] = useState(0);
  const [cantidadMetas, setCantidadMetas] = useState(0);
  const [datos, setDatos] = useState<SolicitudMeta>();
  const [respuesta, setRespuesta] = useState<RespuestaMeta>();
  const [pendiente, setPendiente] = useState(false);
  const resumen = respuesta && !("error" in respuesta) ? respuesta : undefined;
  const pagoLimitado = plazo !== "vitalicio" && modalidad !== "meta";
  const enPesos = !!primordial || version === "c" || moneda === "MXN";
  const titulo = primordial
    ? "Primordial + MetaLife"
    : reproyectar
      ? "Reproyección de MetaLife"
      : "MetaLife";

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const numero = (id: string) => (form.get(id) ? Number(form.get(id)) : undefined);
    const movimientos = (id: string, longitud: number) =>
      Array.from({ length: longitud }, (_, i) => ({
        anio: numero(`${id}-anio-${i}`),
        monto: numero(`${id}-monto-${i}`),
      }));
    const parsed = solicitudMeta.safeParse({
      edad: titular?.edad ?? numero("edad"),
      sexo: titular?.sexo ?? form.get("sexo"),
      fuma: form.get("fuma"),
      moneda: primordial || version === "c" ? "MXN" : moneda,
      version,
      cobertura: version === "c" ? "B" : form.get("cobertura"),
      frecuencia: formaCombinada
        ? frecuencias[formaCombinada as keyof typeof frecuencias]
        : form.get("frecuencia"),
      modalidad: reproyectar ? "suma" : modalidad,
      plazo: modalidad === "meta" ? "vitalicio" : plazo,
      plazoMeta: numero("plazoMeta"),
      ahorroAnual: numero("ahorroAnual"),
      importe: numero("importe"),
      invalidez: form.has("invalidez"),
      pagoInvalidez: form.has("pagoInvalidez"),
      accidente: form.get("accidente") || undefined,
      graves: form.has("graves"),
      fijo: form.get("fijo"),
      variable: form.get("variable") ?? "optimista",
      porcentajeVariable: enPesos ? numero("porcentajeVariable") : 0,
      aportacionAnual: numero("aportacionAnual"),
      aportaciones: movimientos("aporte", cantidadAportes),
      metas: movimientos("meta", cantidadMetas),
      retiro: retiro
        ? {
            desde: numero("retiroDesde"),
            hasta: numero("retiroHasta"),
            monto: numero("retiroMonto"),
          }
        : undefined,
      reproyeccion: reproyectar
        ? {
            inicio: form.get("inicio"),
            cambio: form.get("cambio"),
            sumaOriginal: numero("sumaOriginal"),
            fondoBasico: numero("fondoBasico"),
            fondoAdicional: numero("fondoAdicional"),
          }
        : undefined,
    });
    if (!parsed.success) {
      setRespuesta({ error: "Revisa fechas, edades, importes y forma de pago." });
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
        <fieldset disabled={pendiente}>
          <legend className="font-display text-2xl">{titulo}</legend>
          {primordial ? (
            <div className="mt-4 rounded-lg bg-primary-soft p-3 text-sm">
              Titular de Primordial · {titular?.edad} años · {formaCombinada}
              <button
                type="button"
                className="btn-outline mt-2"
                onClick={() => {
                  cancelarCombinacion();
                  setRespuesta(undefined);
                }}
              >
                Quitar Primordial de esta cotización
              </button>
            </div>
          ) : (
            <label className="mt-4 block text-sm">
              <input
                type="checkbox"
                name="reproyectar"
                checked={reproyectar}
                onChange={(event) => {
                  setReproyectar(event.target.checked);
                  setModalidad("suma");
                }}
              />{" "}
              Reproyectar una póliza vigente
            </label>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {!titular && (
              <>
                <NumeroMeta
                  nombre="edad"
                  etiqueta={reproyectar ? "Edad al inicio de la póliza" : "Edad"}
                  min={18}
                  max={70}
                  requerido
                />
                <label className="text-sm">
                  Sexo
                  <select name="sexo" className={entrada}>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </label>
              </>
            )}
            <label className="text-sm">
              ¿Fuma?
              <select name="fuma" className={entrada}>
                <option value="N">No</option>
                <option value="S">Sí</option>
              </select>
            </label>
            <label className="text-sm">
              Versión
              <select
                name="version"
                className={entrada}
                value={version}
                onChange={(event) => setVersion(event.target.value as SolicitudMeta["version"])}
              >
                <option value="actual">MetaLife Actual</option>
                <option value="c">MetaLife C</option>
              </select>
            </label>
            {!primordial && version !== "c" && (
              <label className="text-sm">
                Moneda
                <select
                  name="moneda"
                  className={entrada}
                  value={moneda}
                  onChange={(event) => setMoneda(event.target.value as SolicitudMeta["moneda"])}
                >
                  <option value="MXN">Pesos mexicanos</option>
                  <option value="USD">Dólares</option>
                </select>
              </label>
            )}
            {version !== "c" && (
              <label className="text-sm">
                Cobertura por fallecimiento
                <select name="cobertura" className={entrada}>
                  <option value="A">A · Suma asegurada</option>
                  <option value="B">B · Suma asegurada más fondo</option>
                </select>
              </label>
            )}
            {!primordial && (
              <label className="text-sm">
                Forma de pago
                <select name="frecuencia" className={entrada}>
                  {Object.entries(PAGOS).map(([id, forma]) => (
                    <option key={id} value={id}>
                      {forma.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!reproyectar && (
              <label className="text-sm">
                Calcular por
                <select
                  name="calcularPor"
                  className={entrada}
                  value={modalidad}
                  onChange={(event) =>
                    setModalidad(event.target.value as SolicitudMeta["modalidad"])
                  }
                >
                  <option value="suma">Suma asegurada</option>
                  <option value="prima">Prima por periodo</option>
                  <option value="meta">Meta de ahorro</option>
                </select>
              </label>
            )}
            <NumeroMeta
              nombre="importe"
              etiqueta={
                reproyectar
                  ? "Nueva suma asegurada"
                  : modalidad === "suma"
                    ? "Suma asegurada"
                    : modalidad === "prima"
                      ? "Prima por periodo"
                      : "Importe de la meta"
              }
              requerido
            />
            {modalidad === "meta" ? (
              <NumeroMeta
                nombre="plazoMeta"
                etiqueta="Año de la meta"
                min={10}
                max={47}
                requerido
              />
            ) : (
              <label className="text-sm">
                Plazo de pago
                <select
                  name="plazo"
                  className={entrada}
                  value={plazo}
                  onChange={(event) => setPlazo(event.target.value as SolicitudMeta["plazo"])}
                >
                  <option value="vitalicio">Vitalicio</option>
                  {[5, 10, 15, 20].map((anios) => (
                    <option key={anios} value={anios}>
                      {anios} años
                    </option>
                  ))}
                  <option value="edad60">Hasta los 60 años</option>
                  <option value="edad65">Hasta los 65 años</option>
                </select>
              </label>
            )}
          </div>
          {reproyectar && (
            <fieldset className="mt-4 grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
              <legend className="px-1 text-sm font-semibold">Póliza vigente</legend>
              <label className="text-sm">
                Inicio de vigencia
                <input type="date" name="inicio" className={entrada} required />
              </label>
              <label className="text-sm">
                Fecha de cambio
                <input type="date" name="cambio" className={entrada} required />
              </label>
              <NumeroMeta nombre="sumaOriginal" etiqueta="Suma asegurada original" requerido />
              <NumeroMeta
                nombre="fondoBasico"
                etiqueta="Fondo básico a la fecha de cambio"
                min={0}
                decimales
                requerido
              />
              <NumeroMeta
                nombre="fondoAdicional"
                etiqueta="Fondo adicional fijo a la fecha de cambio"
                min={0}
                decimales
                requerido
              />
            </fieldset>
          )}
          <fieldset className="mt-4 grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
            <legend className="px-1 text-sm font-semibold">Coberturas adicionales</legend>
            <label className="text-sm">
              <input name="invalidez" type="checkbox" /> Exención de primas por invalidez
            </label>
            <label className="text-sm">
              <input name="pagoInvalidez" type="checkbox" /> Pago anticipado por invalidez
            </label>
            <label className="text-sm">
              <input name="graves" type="checkbox" /> Enfermedades graves
            </label>
            <label className="text-sm sm:col-span-2">
              Accidentes
              <select name="accidente" className={entrada}>
                <option value="">Sin cobertura</option>
                <option value="MA">Muerte accidental</option>
                <option value="DI">Doble indemnización</option>
                <option value="TI">Triple indemnización</option>
              </select>
            </label>
          </fieldset>
          <fieldset className="mt-4 grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
            <legend className="px-1 text-sm font-semibold">Fondos y aportaciones</legend>
            {(["fijo", "variable"] as const)
              .filter((id) => enPesos || id === "fijo")
              .map((id) => (
                <label className="text-sm" key={id}>
                  Escenario del fondo {id}
                  <select name={id} className={entrada}>
                    {Object.entries(ESCENARIOS_META).map(([clave, etiqueta]) => (
                      <option key={clave} value={clave}>
                        {etiqueta}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            {enPesos && (
              <NumeroMeta
                nombre="porcentajeVariable"
                etiqueta="Distribución al fondo variable (%)"
                min={0}
                max={100}
                inicial={0}
                decimales
                requerido
              />
            )}
            <NumeroMeta nombre="aportacionAnual" etiqueta="Aportación adicional anual" />
            {pagoLimitado && <NumeroMeta nombre="ahorroAnual" etiqueta="Ahorro anual separado" />}
            <MovimientosMeta
              id="aporte"
              etiqueta="Aportación extraordinaria"
              total={cantidadAportes}
              modificar={(n) => {
                setCantidadAportes(n);
                setRespuesta(undefined);
              }}
            />
            <MovimientosMeta
              id="meta"
              etiqueta="Meta de retiro"
              total={cantidadMetas}
              modificar={(n) => {
                setCantidadMetas(n);
                setRespuesta(undefined);
              }}
            />
            <label className="text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={retiro}
                onChange={(event) => setRetiro(event.target.checked)}
              />{" "}
              Programar retiros
            </label>
            {retiro && (
              <>
                <NumeroMeta
                  nombre="retiroDesde"
                  etiqueta="Primer año de retiro"
                  min={6}
                  max={81}
                  requerido
                />
                <NumeroMeta
                  nombre="retiroHasta"
                  etiqueta="Último año de retiro"
                  min={6}
                  max={81}
                  requerido
                />
                <NumeroMeta nombre="retiroMonto" etiqueta="Retiro anual" requerido />
              </>
            )}
          </fieldset>
          <button type="submit" className="btn-primary mt-4">
            {pendiente ? "Calculando…" : "Calcular cotización"}
          </button>
        </fieldset>
      </form>
      <section
        aria-busy={pendiente}
        className="rounded-2xl border border-primary/15 bg-primary-soft p-5 sm:p-8 print:border-0 print:bg-white print:p-0"
      >
        <h2 className="text-2xl">{titulo}</h2>
        <div aria-live="polite" className="mt-3">
          {!respuesta && (
            <p>
              {pendiente
                ? "Consultando tarifas."
                : "Completa los datos para calcular la cotización."}
            </p>
          )}
          {respuesta && "error" in respuesta && <p>{respuesta.error}</p>}
          {resumen && datos && (
            <>
              <p className="text-sm">
                {datos.edad} años ·{" "}
                {resumen.pagoAnios === 99 ? "Pago vitalicio" : `Pago por ${resumen.pagoAnios} años`}{" "}
                · {PAGOS[datos.frecuencia].etiqueta} · {datos.moneda}
              </p>
              <p className="mt-3 font-display text-3xl tabular-nums">
                {formato(datos.moneda).format(resumen.primaPago)}
              </p>
              <p className="text-sm">Aportación por periodo de MetaLife</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt>Prima anual de MetaLife</dt>
                  <dd>{formato(datos.moneda).format(resumen.primaAnual)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Suma asegurada inicial</dt>
                  <dd>{formato(datos.moneda).format(resumen.sumaInicial)}</dd>
                </div>
                {resumen.mesCambio && (
                  <div className="flex justify-between gap-4">
                    <dt>Mes del cambio</dt>
                    <dd>{resumen.mesCambio}</dd>
                  </div>
                )}
                {resumen.primaAdicional > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt>Aportación anual calculada</dt>
                    <dd>{formato(datos.moneda).format(resumen.primaAdicional)}</dd>
                  </div>
                )}
                {resumen.rescateMeta !== undefined && (
                  <div className="flex justify-between gap-4">
                    <dt>Rescate proyectado en el año {datos.plazoMeta}</dt>
                    <dd>{formato(datos.moneda).format(resumen.rescateMeta)}</dd>
                  </div>
                )}
                {primordial && (
                  <>
                    <div className="flex justify-between gap-4">
                      <dt>Prima anual de Primordial</dt>
                      <dd>{formato("MXN").format(primordial.resultado.total)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Primer pago combinado</dt>
                      <dd>
                        {formato("MXN").format(primordial.resultado.primerPago + resumen.primaPago)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Pago subsecuente combinado</dt>
                      <dd>
                        {formato("MXN").format(
                          primordial.resultado.subsecuente + resumen.primaPago,
                        )}
                      </dd>
                    </div>
                  </>
                )}
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
        <section className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-8 lg:col-span-2 print:mt-6 print:p-0">
          <h2 className="text-2xl">Proyección anual de MetaLife</h2>
          <div className="mt-4 overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse text-right text-sm tabular-nums print:text-[9px]">
              <thead>
                <tr>
                  {[
                    "Año",
                    "Aportación anual",
                    "Aportación acumulada",
                    "Retiro",
                    "Rescate",
                    "Recuperación (%)",
                    "Suma asegurada",
                    "Protección por fallecimiento",
                  ].map((etiqueta) => (
                    <th key={etiqueta} scope="col" className="p-2">
                      {etiqueta}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resumen.proyeccion
                  .filter(({ mes }) => mes % 12 === 0)
                  .map((fila, indice, filas) => (
                    <tr key={fila.mes} className="border-t border-border print:break-inside-avoid">
                      <th scope="row" className="p-2">
                        {fila.mes / 12}
                      </th>
                      {[
                        fila.aportacionAcumulada - (filas[indice - 1]?.aportacionAcumulada ?? 0),
                        fila.aportacionAcumulada,
                        Array.from(
                          { length: 12 },
                          (_, mes) => resumen.proyeccion[indice * 12 + mes].retiro,
                        ).reduce((total, retiro) => total + retiro, 0),
                        fila.rescate,
                        (100 * fila.rescate) / fila.aportacionAcumulada,
                        fila.suma,
                        fila.fallecimiento,
                      ].map((importe, i) => (
                        <td key={i} className="p-2">
                          {i === 4
                            ? Math.round(importe)
                            : formato(datos.moneda, true).format(importe)}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {resumen && primordial && (
        <CoberturasSalud
          titulo="Coberturas de Primordial"
          coberturas={primordial.resultado.coberturas}
        />
      )}
    </div>
  );
}

function NumeroMeta({
  nombre,
  etiqueta,
  min = 1,
  max = 999999999,
  requerido,
  inicial,
  decimales,
}: {
  nombre: string;
  etiqueta: string;
  min?: number;
  max?: number;
  requerido?: boolean;
  inicial?: number;
  decimales?: boolean;
}) {
  return (
    <label className="text-sm">
      {etiqueta}
      <input
        className={entrada}
        name={nombre}
        type="number"
        min={min}
        max={max}
        step={decimales ? "0.01" : "1"}
        required={requerido}
        defaultValue={inicial}
      />
    </label>
  );
}

function MovimientosMeta({
  id,
  etiqueta,
  total,
  modificar,
}: {
  id: string;
  etiqueta: string;
  total: number;
  modificar: (n: number) => void;
}) {
  return (
    <div className="space-y-2 sm:col-span-2">
      {Array.from({ length: total }, (_, i) => (
        <fieldset key={i} className="grid grid-cols-2 gap-2">
          <legend className="text-sm">
            {etiqueta} {i + 1}
          </legend>
          <NumeroMeta nombre={`${id}-anio-${i}`} etiqueta="Año" max={81} requerido />
          <NumeroMeta nombre={`${id}-monto-${i}`} etiqueta="Importe" requerido />
        </fieldset>
      ))}
      <button
        type="button"
        className="btn-outline mr-2"
        onClick={() => modificar(total + 1)}
        disabled={total >= 81}
      >
        Agregar {etiqueta.toLowerCase()}
      </button>
      {total > 0 && (
        <button type="button" className="btn-outline" onClick={() => modificar(total - 1)}>
          Quitar última
        </button>
      )}
    </div>
  );
}
