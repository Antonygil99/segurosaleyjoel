import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

const VERSION = "7.6";

export function leerMet4U(ruta) {
  const sqlite = new DatabaseSync(ruta, { readOnly: true });
  try {
    const reglas = sqlite
      .prepare(
        `SELECT Cobertura AS cobertura, EdadMin AS edadMin, EdadMax AS edadMax,
              SumaMin AS sumaMin, SumaMax AS sumaMax
       FROM Reglas WHERE Cobertura IN ('BAS', 'INV', 'CAN', 'DIA', 'GRA')`,
      )
      .all();
    const tarifas = sqlite
      .prepare(
        `SELECT Plazo AS plazo, Edad AS edad, Sexo AS sexo, Fuma AS fuma,
              TarifaBasica AS BAS, TarifaInvalidez AS INV, TarifaCancer AS CAN,
              TarifaDiabetes AS DIA, TarifaGraves AS GRA
       FROM TarifasMet4U ORDER BY Plazo, Edad, Sexo, Fuma`,
      )
      .all();
    if (reglas.length !== 5 || !tarifas.length) {
      throw new Error("El archivo Met4U no contiene todas las reglas y tarifas.");
    }
    return { reglas, tarifas };
  } finally {
    sqlite.close();
  }
}

export async function importarMet4U(conexion, datos) {
  await conexion.query("BEGIN");
  try {
    await conexion.query("SELECT pg_advisory_xact_lock(7616801)");
    await conexion.query("CREATE SCHEMA IF NOT EXISTS metlife_cotizador");
    await conexion.query(
      `CREATE TABLE IF NOT EXISTS metlife_cotizador.met4u_tarifarios (
         version text PRIMARY KEY, datos jsonb NOT NULL
       )`,
    );
    await conexion.query(
      `INSERT INTO metlife_cotizador.met4u_tarifarios (version, datos) VALUES ($1, $2)
       ON CONFLICT (version) DO UPDATE SET datos = excluded.datos`,
      [VERSION, JSON.stringify(datos)],
    );
    await conexion.query("COMMIT");
  } catch (error) {
    await conexion.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  const ruta = process.argv[2];
  const connectionString = process.env.DATA_URL;
  if (!ruta || !connectionString) {
    console.error("Configura DATA_URL y pasa la ruta al archivo Met4U.db.");
    process.exitCode = 1;
    return;
  }
  const datos = leerMet4U(resolve(ruta));
  const conexion = new pg.Client({ connectionString, connectionTimeoutMillis: 10_000 });
  try {
    await conexion.connect();
    await importarMet4U(conexion, datos);
    console.log(
      `Met4U v${VERSION}. Reglas: ${datos.reglas.length}. Tarifas: ${datos.tarifas.length}.`,
    );
  } finally {
    await conexion.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error("No se pudo importar el tarifario Met4U.", error?.code ?? "");
    process.exitCode = 1;
  });
}
