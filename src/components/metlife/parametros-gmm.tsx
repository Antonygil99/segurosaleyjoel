import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  BENEFICIOS_GMM,
  VIGENCIAS_GMM,
  coaseguroMinimo,
  vigenciaGmm,
  type OpcionesGmm,
  type SolicitudGmm,
} from "@/lib/metlife-gmm";

const cargar = createServerFn({ method: "GET" })
  .inputValidator((valor: unknown) => vigenciaGmm.parse(valor))
  .handler(async ({ data }) => {
    const { opcionesGmm } = await import("@/lib/metlife-gmm.server");
    return opcionesGmm(data);
  });

const entrada =
  "mt-1.5 w-full rounded-lg border border-input bg-card px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-ring";
const pesos = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});
const numero = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 });

function ListaMontos({
  nombre,
  etiqueta,
  valores,
  cero,
  formatear = numero.format,
}: {
  nombre: string;
  etiqueta: string;
  valores: number[];
  cero?: string;
  formatear?: (value: number) => string;
}) {
  return (
    <label className="text-sm font-medium">
      {etiqueta}
      <select name={nombre} required className={entrada}>
        {cero && <option value={0}>{cero}</option>}
        {valores
          .filter((valor) => !cero || valor !== 0)
          .map((valor) => (
            <option key={valor} value={valor}>
              {formatear(valor)}
            </option>
          ))}
      </select>
    </label>
  );
}

export function ParametrosGmm() {
  const [vigencia, setVigencia] = useState<SolicitudGmm["vigencia"]>("nueva");
  const [opciones, setOpciones] = useState<OpcionesGmm>();
  const [error, setError] = useState("");
  const [plan, setPlan] = useState(1);
  const [conversion, setConversion] = useState<SolicitudGmm["conversion"]>("ninguna");
  const [deducible, setDeducible] = useState(0);
  useEffect(() => {
    let vigente = true;
    cargar({ data: vigencia })
      .then((resultado) => {
        if (!vigente) return;
        if ("error" in resultado) setError(resultado.error);
        else setOpciones(resultado);
      })
      .catch(() => {
        if (vigente) setError("No se pudo cargar el catálogo de MédicaLife.");
      });
    return () => {
      vigente = false;
    };
  }, [vigencia]);

  const deducibles =
    opciones?.deducibles.filter(
      (fila) => fila.idPlan === plan && fila.Producto === (conversion === "grupo" ? 1 : 0),
    ) ?? [];
  const actual = deducibles.find((fila) => fila.Deducible === deducible) ?? deducibles[0];
  return (
    <div className="mt-4 space-y-4">
      <label className="block text-sm font-medium">
        Vigencia
        <select
          name="vigencia"
          value={vigencia}
          className={entrada}
          onChange={(event) => {
            setOpciones(undefined);
            setError("");
            setDeducible(0);
            setVigencia(event.target.value as typeof vigencia);
          }}
        >
          {Object.entries(VIGENCIAS_GMM).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
      {!opciones && !error && (
        <p role="status" className="text-muted-foreground">
          Cargando opciones del plan.
        </p>
      )}
      {!opciones && <input name="plan" value="" readOnly hidden />}
      {opciones && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Plan
              <select
                name="plan"
                required
                value={plan}
                className={entrada}
                onChange={(event) => {
                  setPlan(Number(event.target.value));
                  setDeducible(0);
                }}
              >
                {opciones.planes.map((item, idx) => (
                  <option key={item.idPlan} value={idx}>
                    {item.Plan}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Municipio
              <select name="municipio" required className={entrada}>
                {opciones.municipios.map((fila, idx) => (
                  <option key={idx} value={idx}>
                    {fila.Estado} · {fila.Municipio}
                  </option>
                ))}
              </select>
            </label>
            <ListaMontos
              nombre="sumaGmm"
              etiqueta="Suma asegurada (UMAM)"
              valores={opciones.sumas}
              formatear={(valor) => (valor === 0 ? "Sin límite" : numero.format(valor))}
            />
            <label className="text-sm font-medium">
              Deducible nacional
              <select
                name="deducible"
                required
                className={entrada}
                value={actual?.Deducible ?? ""}
                onChange={(event) => setDeducible(Number(event.target.value))}
              >
                {deducibles.map((fila) => (
                  <option key={fila.Deducible} value={fila.Deducible}>
                    {pesos.format(fila.Deducible)}
                  </option>
                ))}
              </select>
            </label>
            {plan === 0 && actual && (
              <ListaMontos
                key={actual.Deducible}
                nombre="deducibleExt"
                etiqueta="Deducible en el extranjero (USD)"
                valores={opciones.deduciblesExt.slice(actual.DedExtMin, actual.DedExtMax + 1)}
              />
            )}
            <ListaMontos
              key={plan}
              nombre="coaseguro"
              etiqueta="Coaseguro"
              valores={opciones.coaseguros
                .filter((fila) => fila.CoasMin === coaseguroMinimo(vigencia, plan))
                .map((fila) => fila.Coaseguro)}
              formatear={(valor) => numero.format(valor * 100) + " %"}
            />
            <ListaMontos
              nombre="tabulador"
              etiqueta="Incremento de tabulador"
              valores={opciones.tabuladores}
              formatear={(valor) => numero.format(valor * 100) + " %"}
            />
            <label className="text-sm font-medium">
              Conversión
              <select
                name="conversion"
                className={entrada}
                value={conversion}
                onChange={(event) => {
                  setConversion(event.target.value as typeof conversion);
                  setDeducible(0);
                }}
              >
                <option value="ninguna">Ninguna</option>
                <option value="institucional">Institucional</option>
                <option value="colectivo">Colectivo</option>
                <option value="grupo">Póliza de grupo</option>
              </select>
            </label>
          </div>
          <details className="rounded-lg border border-border p-3">
            <summary className="cursor-pointer font-medium">Coberturas adicionales</summary>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              {Object.entries(BENEFICIOS_GMM).map(([clave, etiqueta]) => (
                <label key={clave} className="flex items-center gap-2">
                  <input name="beneficiosGmm" type="checkbox" value={clave} /> {etiqueta}
                </label>
              ))}
              <ListaMontos
                nombre="muerteAccidental"
                etiqueta="Muerte accidental"
                valores={opciones.muerteAccidental}
                cero="Sin cobertura"
                formatear={pesos.format}
              />
              <ListaMontos
                nombre="rentaDiaria"
                etiqueta="Renta diaria"
                valores={opciones.rentaDiaria}
                cero="Sin cobertura"
                formatear={pesos.format}
              />
              <ListaMontos
                nombre="ultimosGastos"
                etiqueta="Últimos gastos"
                valores={opciones.ultimosGastos}
                cero="Sin cobertura"
                formatear={pesos.format}
              />
            </div>
          </details>
        </>
      )}
    </div>
  );
}
