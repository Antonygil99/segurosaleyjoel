import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

export function leerEducaLife(ruta) {
  const sqlite = new DatabaseSync(ruta, { readOnly: true });
  try {
    const listarClaves = sqlite.prepare(
      `SELECT idPlan, plazo, BAS, GPPI, GPPF, PASI, EG FROM ClaveValores
       WHERE idPlan IN (20, 21, 22) AND idMoneda = ? AND fuma = 'NA' ORDER BY rowid`,
    );
    const buscarPrima = sqlite.prepare(
      "SELECT prima, edad, sexo, fuma FROM Primas WHERE plan = ? AND banda = 0 ORDER BY rowid",
    );
    const buscarRescates = sqlite.prepare(
      "SELECT edad, sexo, fuma, rescate FROM valgar WHERE plan = ? ORDER BY rowid",
    );
    const listarSumas = sqlite.prepare(
      "SELECT cobertura, sumaMin, sumaMax, recFijo FROM SumaMinEdu WHERE idMoneda = ?",
    );
    const listarPagos = sqlite.prepare(
      "SELECT idFormaPago, tasaRecargo FROM RecargoFormaPago WHERE idPlan = 22 AND idMoneda = ?",
    );
    const listarFunerarios = sqlite.prepare(
      "SELECT GF, edad, sexo, fuma FROM PrimasGF WHERE idMoneda = ? ORDER BY rowid",
    );
    const edades = Object.fromEntries(
      sqlite
        .prepare("SELECT idBeneficio, edadMin, edadMax, edadCan FROM Edades WHERE idPlan = 20")
        .all()
        .map(({ idBeneficio, ...fila }) => [idBeneficio, fila]),
    );
    return Object.fromEntries(
      [
        [1, "MXN"],
        [2, "USD"],
      ].map(([id, moneda]) => {
        const claves = Object.fromEntries(
          listarClaves.all(id).map(({ idPlan, plazo, ...fila }) => [`${idPlan}/${plazo}`, fila]),
        );
        const codigos = new Set(Object.values(claves).flatMap(Object.values));
        codigos.delete("NA");
        const primas = {};
        for (const codigo of codigos) {
          for (const { prima, edad, sexo, fuma } of buscarPrima.all(codigo)) {
            primas[`${codigo}/${edad}/${sexo}/${fuma}`] ??= prima;
          }
        }
        const rescates = {};
        for (const codigo of new Set(Object.values(claves).map(({ BAS }) => BAS))) {
          for (const { edad, sexo, fuma, rescate } of buscarRescates.all(codigo)) {
            (rescates[`${codigo}/${edad}/${sexo}/${fuma}`] ??= []).push(rescate);
          }
        }
        for (const { GF, edad, sexo, fuma } of listarFunerarios.all(id)) {
          primas[`GF/${edad}/${sexo}/${fuma}`] ??= GF;
        }
        const limites = Object.fromEntries(
          listarSumas.all(id).map(({ cobertura, ...fila }) => [cobertura, fila]),
        );
        const recargos = Object.fromEntries(
          listarPagos.all(id).map(({ idFormaPago, tasaRecargo }) => [idFormaPago, tasaRecargo]),
        );
        if (
          Object.keys(claves).length !== 29 ||
          Object.keys(limites).length !== 8 ||
          Object.keys(recargos).length !== 4
        ) {
          throw new Error(`Tarifario EducaLife incompleto para ${moneda}.`);
        }
        return [moneda, { claves, primas, rescates, limites, recargos, edades }];
      }),
    );
  } finally {
    sqlite.close();
  }
}

export async function importarEducaLife(conexion, catalogo) {
  await conexion.query("BEGIN");
  try {
    await conexion.query("SELECT pg_advisory_xact_lock(7616801)");
    await conexion.query("CREATE SCHEMA IF NOT EXISTS metlife_cotizador");
    await conexion.query(
      `CREATE TABLE IF NOT EXISTS metlife_cotizador.edu_calculo (
         version text NOT NULL, moneda text NOT NULL, datos jsonb NOT NULL,
         PRIMARY KEY (version, moneda)
       )`,
    );
    for (const [moneda, datos] of Object.entries(catalogo)) {
      await conexion.query(
        `INSERT INTO metlife_cotizador.edu_calculo (version, moneda, datos) VALUES ($1, $2, $3)
         ON CONFLICT (version, moneda) DO UPDATE SET datos = excluded.datos`,
        ["7.6", moneda, JSON.stringify(datos)],
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
  const connectionString = process.env.DATA_URL;
  if (!ruta || !connectionString)
    throw new Error("Configura DATA_URL y proporciona dbMetaLife.db.");
  const catalogo = leerEducaLife(resolve(ruta));
  const conexion = new pg.Client({ connectionString, connectionTimeoutMillis: 10000 });
  try {
    await conexion.connect();
    await importarEducaLife(conexion, catalogo);
    console.log("EducaLife 7.6: MXN y USD importados.");
  } finally {
    await conexion.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error("No se pudo importar EducaLife.", error?.code ?? "");
    process.exitCode = 1;
  });
}
