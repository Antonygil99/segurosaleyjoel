import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";
import { leerMédicaLife } from "./read-medical-tariffs.mjs";

const VERSION = "7.6";
const MONEDAS = { 1: "MXN", 2: "USD", 5: "MXC" };
const PLANES = "1, 2, 6, 8, 10, 12";
const contar = (grupos) => grupos.reduce((total, grupo) => total + grupo.factores.length, 0);

export function leerTarifarios(ruta) {
  const sqlite = new DatabaseSync(ruta, { readOnly: true });
  try {
    const claves = sqlite
      .prepare(
        `SELECT idPlan, idMoneda, plazo, fuma, BAS, claveBanda, tarifaSH, VG, EP, EPGF, PASI, IMA, DI, TI, EG, GF
       FROM ClaveValores WHERE idPlan IN (${PLANES}) AND idMoneda IN (1, 2, 5) AND riesgo = 0`,
      )
      .all();
    const edades = sqlite.prepare(
      "SELECT idBeneficio, edadMin, edadMax, edadCan FROM Edades WHERE idPlan = ? AND plazo = 0",
    );
    const costos = sqlite.prepare(
      "SELECT sumaMin, recFijo FROM SumaMinBas WHERE idPlan = ? AND idMoneda = ? AND plazo = ?",
    );
    const bandas = sqlite.prepare(
      "SELECT idBanda, sumaInferior, sumaSuperior FROM Bandas WHERE idPlan = ? AND idMoneda = ? ORDER BY sumaInferior",
    );
    const recargos = sqlite.prepare(
      "SELECT idFormaPago, tasaRecargo FROM RecargoFormaPago WHERE idPlan = ? AND idMoneda = ?",
    );
    const sumas = sqlite.prepare(
      "SELECT idBeneficio, sumaMin, sumaMax FROM SumaBeneficios WHERE idMoneda = ? AND plazo = ?",
    );
    const funerario = sqlite.prepare(
      "SELECT edad, sexo, fuma, GF FROM PrimasGF WHERE idMoneda = ?",
    );
    const primas = sqlite.prepare(
      "SELECT plan, edad, banda, sexo, fuma, prima FROM Primas WHERE plan = ? AND prima > 0 ORDER BY rowid",
    );
    const tarifasPorCodigo = new Map();
    const tarifarios = new Map();
    for (const { idPlan, idMoneda, plazo, fuma, ...codigos } of claves) {
      const moneda = MONEDAS[idMoneda];
      const llave = `${idPlan}/${moneda}/${plazo}`;
      if (!tarifarios.has(llave)) {
        const limites = Object.fromEntries(
          edades.all(idPlan).map(({ idBeneficio, ...valores }) => [idBeneficio, valores]),
        );
        const plazoCosto = idPlan === 10 && plazo === 5 ? 5 : 0;
        const costo = costos.get(idPlan, idMoneda, plazoCosto);
        const tasas = Object.fromEntries(
          recargos
            .all(idPlan, idMoneda)
            .map(({ idFormaPago, tasaRecargo }) => [idFormaPago, tasaRecargo]),
        );
        if (!limites.BAS || !costo || [1, 2, 3, 4].some((id) => !Number.isFinite(tasas[id]))) {
          throw new Error(`Tablas incompletas para ${llave}.`);
        }
        const plazoBeneficio = idMoneda === 2 && plazo === 5 ? 5 : 0;
        const beneficios = Object.fromEntries(
          sumas
            .all(idMoneda, plazoBeneficio)
            .map(({ idBeneficio, ...valores }) => [idBeneficio, valores]),
        );
        let edadMax = limites.BAS.edadMax;
        if (plazo === 65 && idPlan !== 12) edadMax = 60;
        if (idPlan === 12 && plazo < 65) edadMax = plazo - 5;
        tarifarios.set(llave, {
          plan: idPlan,
          moneda,
          plazo,
          datos: {
            edadMin: limites.BAS.edadMin,
            edadMax,
            ...costo,
            bandas: bandas.all(idPlan, idMoneda),
            recargos: tasas,
            claves: {},
            primas: [],
            beneficios: { edades: limites, sumas: beneficios, funerario: funerario.all(idMoneda) },
          },
        });
      }

      const datos = tarifarios.get(llave).datos;
      if (Object.hasOwn(datos.claves, fuma)) throw new Error(`Clave duplicada para ${llave}.`);
      datos.claves[fuma] = codigos;
      for (const campo of ["BAS", "EP", "PASI", "IMA", "DI", "TI", "EG"]) {
        const codigo = codigos[campo];
        if (!codigo || codigo === "NA" || datos.primas.some(({ plan }) => plan === codigo))
          continue;
        if (!tarifasPorCodigo.has(codigo)) tarifasPorCodigo.set(codigo, primas.all(codigo));
        const filas = tarifasPorCodigo.get(codigo);
        if (campo === "BAS" && !filas.length) throw new Error(`Tarifas ausentes para ${llave}.`);
        datos.primas.push(...filas);
      }
    }

    const garantias = new Map();
    const filas = sqlite.prepare(
      `SELECT plan, edad, sexo, fuma, rescate, saldado, anosp, diasp
       FROM valgar WHERE plan IN (SELECT VG FROM ClaveValores WHERE idPlan IN (${PLANES}) AND riesgo = 0)
       ORDER BY rowid`,
    );
    for (const { plan, edad, sexo, fuma, rescate, saldado, anosp, diasp } of filas.iterate()) {
      const llave = `${plan}/${edad}/${sexo}/${fuma}`;
      if (!garantias.has(llave))
        garantias.set(llave, { codigo: plan, edad, sexo, fuma, factores: [] });
      garantias.get(llave).factores.push([rescate, saldado, anosp, diasp]);
    }
    if (tarifarios.size !== 47 || !garantias.size) {
      throw new Error("El archivo no contiene los tarifarios esperados de Vida tradicional v7.6.");
    }
    const medicaLife = leerMédicaLife(dirname(ruta));
    const salud = {
      ...medicaLife,
      Primordial: {
        primas: sqlite.prepare("SELECT Edad, Prima, PrimaAdi FROM prmPrimas").all(),
        edades: sqlite.prepare("SELECT * FROM prmEdades WHERE Parentesco = 'Familiar'").get(),
        padecimientos: sqlite
          .prepare("SELECT * FROM prmPadecimientos WHERE idPlan = 4 ORDER BY rowid")
          .all(),
        pagos: sqlite.prepare("SELECT * FROM prmRecargoFP ORDER BY rowid").all(),
      },
      MetPlus: {
        primas: sqlite.prepare("SELECT * FROM PrimasMetPlus").all(),
        paquetes: sqlite.prepare("SELECT * FROM PaquetesMetPlus ORDER BY rowid").all(),
        pagos: medicaLife["MedicaLife/nueva"].gmRecargoFP,
      },
    };

    return { tarifarios: [...tarifarios.values()], garantias: [...garantias.values()], salud };
  } finally {
    sqlite.close();
  }
}

export async function importarTarifarios(conexion, { tarifarios, garantias, salud }) {
  await conexion.query("BEGIN");
  try {
    await conexion.query("SELECT pg_advisory_xact_lock(7616801)");
    await conexion.query("CREATE SCHEMA IF NOT EXISTS metlife_cotizador");
    await conexion.query(
      `CREATE TABLE IF NOT EXISTS metlife_cotizador.vida_tarifarios (
         version text NOT NULL, plan integer NOT NULL, moneda text NOT NULL,
         plazo integer NOT NULL, datos jsonb NOT NULL,
         PRIMARY KEY (version, plan, moneda, plazo)
       )`,
    );
    await conexion.query(
      `CREATE TABLE IF NOT EXISTS metlife_cotizador.vida_valores (
         version text NOT NULL, codigo text NOT NULL, edad integer NOT NULL,
         sexo text NOT NULL, fuma text NOT NULL, factores jsonb NOT NULL,
         PRIMARY KEY (version, codigo, edad, sexo, fuma)
       )`,
    );

    for (const { plan, moneda, plazo, datos } of tarifarios) {
      await conexion.query(
        `INSERT INTO metlife_cotizador.vida_tarifarios (version, plan, moneda, plazo, datos)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (version, plan, moneda, plazo) DO UPDATE SET datos = excluded.datos`,
        [VERSION, plan, moneda, plazo, JSON.stringify(datos)],
      );
    }

    for (let inicio = 0; inicio < garantias.length; inicio += 200) {
      await conexion.query(
        `INSERT INTO metlife_cotizador.vida_valores (version, codigo, edad, sexo, fuma, factores)
         SELECT $1, g.codigo, g.edad, g.sexo, g.fuma, g.factores
         FROM jsonb_to_recordset($2) AS g(codigo text, edad integer, sexo text, fuma text, factores jsonb)
         ON CONFLICT (version, codigo, edad, sexo, fuma) DO UPDATE SET factores = excluded.factores`,
        [VERSION, JSON.stringify(garantias.slice(inicio, inicio + 200))],
      );
    }
    await conexion.query(
      `CREATE TABLE IF NOT EXISTS metlife_cotizador.salud_tarifarios (
         version text NOT NULL, producto text NOT NULL, datos jsonb NOT NULL,
         PRIMARY KEY (version, producto)
       )`,
    );
    for (const [producto, datos] of Object.entries(salud)) {
      await conexion.query(
        `INSERT INTO metlife_cotizador.salud_tarifarios (version, producto, datos)
         VALUES ($1, $2, $3)
         ON CONFLICT (version, producto) DO UPDATE SET datos = excluded.datos`,
        [VERSION, producto, JSON.stringify(datos)],
      );
    }

    await conexion.query("COMMIT");
  } catch (error) {
    await conexion.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  const ruta = process.argv[2];
  const connectionString = process.env.DATA_URL || process.env.DATABASE_URL;
  if (!ruta || !connectionString) {
    console.error("Configura DATA_URL y pasa la ruta a dbMetaLife.db en el primer argumento.");
    process.exitCode = 1;
    return;
  }
  const tablas = leerTarifarios(resolve(ruta));
  const conexion = new pg.Client({ connectionString, connectionTimeoutMillis: 10_000 });
  try {
    await conexion.connect();
    await importarTarifarios(conexion, tablas);
    console.log(
      `Vida v${VERSION}. Tarifarios: ${tablas.tarifarios.length}. Filas de proyección: ${contar(tablas.garantias)}.`,
    );
  } finally {
    await conexion.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error("No se pudo importar el tarifario MetLife.", error?.code ?? "");
    process.exitCode = 1;
  });
}
