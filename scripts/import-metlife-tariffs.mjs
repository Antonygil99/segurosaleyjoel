import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

export function leerTarifarios(ruta) {
  const sqlite = new DatabaseSync(ruta, { readOnly: true });
  try {
    const claves = sqlite
      .prepare(
        "SELECT idPlan, idMoneda, plazo, fuma, BAS, claveBanda, tarifaSH FROM ClaveValores WHERE idPlan IN (1, 6, 8) AND idMoneda IN (1, 2) AND riesgo = 0",
      )
      .all();
    const edades = sqlite.prepare(
      "SELECT edadMin, edadMax FROM Edades WHERE idPlan = ? AND plazo = 0 AND idBeneficio = 'BAS'",
    );
    const costos = sqlite.prepare(
      "SELECT sumaMin, recFijo FROM SumaMinBas WHERE idPlan = ? AND idMoneda = ? AND plazo = 0",
    );
    const bandas = sqlite.prepare(
      "SELECT idBanda, sumaInferior, sumaSuperior FROM Bandas WHERE idPlan = ? AND idMoneda = ? ORDER BY sumaInferior",
    );
    const recargos = sqlite.prepare(
      "SELECT idFormaPago, tasaRecargo FROM RecargoFormaPago WHERE idPlan = ? AND idMoneda = ?",
    );
    const primas = sqlite.prepare(
      "SELECT plan, edad, banda, sexo, fuma, prima FROM Primas WHERE plan = ? AND prima > 0",
    );
    const tarifarios = new Map();
    for (const { idPlan, idMoneda, plazo, fuma, BAS, claveBanda, tarifaSH } of claves) {
      const moneda = idMoneda === 1 ? "MXN" : "USD";
      const llave = `${idPlan}/${moneda}/${plazo}`;
      if (!tarifarios.has(llave)) {
        const limites = edades.get(idPlan);
        const costo = costos.get(idPlan, idMoneda);
        const tasas = Object.fromEntries(
          recargos
            .all(idPlan, idMoneda)
            .map(({ idFormaPago, tasaRecargo }) => [idFormaPago, tasaRecargo]),
        );
        if (!limites || !costo || [1, 2, 3, 4].some((id) => !Number.isFinite(tasas[id]))) {
          throw new Error(`Tablas incompletas para ${llave}.`);
        }
        const edadMax = plazo === 65 ? Math.min(60, limites.edadMax) : limites.edadMax;
        tarifarios.set(llave, {
          plan: idPlan,
          moneda,
          plazo,
          datos: {
            ...limites,
            edadMax,
            ...costo,
            bandas: bandas.all(idPlan, idMoneda),
            recargos: tasas,
            claves: {},
            primas: [],
          },
        });
      }
      const datos = tarifarios.get(llave).datos;
      if (Object.hasOwn(datos.claves, fuma)) throw new Error(`Clave duplicada para ${llave}.`);
      const tarifas = primas.all(BAS);
      if (!tarifas.length) throw new Error(`Tarifas ausentes para ${llave}.`);
      datos.claves[fuma] = { BAS, claveBanda, tarifaSH };
      if (!datos.primas.some(({ plan }) => plan === BAS)) datos.primas.push(...tarifas);
    }
    if (tarifarios.size !== 17)
      throw new Error("El archivo no trae los 17 tarifarios TempoLife de la versión 7.6.");
    return Array.from(tarifarios.values());
  } finally {
    sqlite.close();
  }
}

export async function importarTarifarios(conexion, tarifarios) {
  await conexion.query("BEGIN");
  try {
    await conexion.query("SELECT pg_advisory_xact_lock(7616801)");
    await conexion.query("CREATE SCHEMA IF NOT EXISTS metlife_cotizador");
    await conexion.query(
      `CREATE TABLE IF NOT EXISTS metlife_cotizador.tarifarios (
        version text NOT NULL,
        plan integer NOT NULL,
        moneda text NOT NULL CHECK (moneda IN ('MXN', 'USD')),
        plazo integer NOT NULL CHECK (plazo > 0),
        datos jsonb NOT NULL,
        PRIMARY KEY (version, plan, moneda, plazo)
      )`,
    );
    for (const { plan, moneda, plazo, datos } of tarifarios) {
      await conexion.query(
        `INSERT INTO metlife_cotizador.tarifarios (version, plan, moneda, plazo, datos)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (version, plan, moneda, plazo)
         DO UPDATE SET datos = EXCLUDED.datos`,
        ["7.6", plan, moneda, plazo, JSON.stringify(datos)],
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
  if (!ruta || !process.env.DATABASE_URL) {
    console.error("Configura DATABASE_URL y pasa la ruta a dbMetaLife.db en el primer argumento.");
    process.exitCode = 1;
    return;
  }
  const tarifarios = leerTarifarios(resolve(ruta));
  const conexion = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await conexion.connect();
    await importarTarifarios(conexion, tarifarios);
    console.log(`Tarifarios TempoLife v7.6 importados: ${tarifarios.length}`);
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
