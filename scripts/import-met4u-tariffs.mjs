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
    const cargos = sqlite
      .prepare("SELECT Ano AS anio, CargoRescate AS cargo FROM CargoRescate ORDER BY Ano")
      .all();
    const recargos = sqlite
      .prepare(
        "SELECT Plazo AS plazo, Ano AS anio, Recargo AS factor FROM RecargoPrimas ORDER BY rowid",
      )
      .all();
    const costosBase = sqlite
      .prepare(
        `SELECT Plazo AS plazo, Edad AS edad, Ano AS anio, Sexo AS sexo, Fuma AS fuma,
              CoiBasica AS BAS, CoiInvalidez AS INV FROM CoiBasInv ORDER BY rowid`,
      )
      .all();
    const otrosCostos = sqlite
      .prepare(
        `SELECT Plazo AS plazo, Edad AS edad, Sexo AS sexo, Fuma AS fuma,
              CoiCancer AS CAN, CoiDiabetes AS DIA, CoiGraves AS GRA
       FROM CoiOtras ORDER BY rowid`,
      )
      .all();
    const otrosPorEdad = new Map(
      otrosCostos.map(({ plazo, sexo, fuma, edad, ...costos }) => [
        `${plazo}/${sexo}/${fuma}/${edad}`,
        costos,
      ]),
    );
    const perfiles = new Map();
    for (const { plazo, edad, anio, sexo, fuma, ...costos } of costosBase) {
      const otros = otrosPorEdad.get(`${plazo}/${sexo}/${fuma}/${edad}`);
      if (!otros) throw new Error("Faltan costos complementarios de Met4U.");
      const clave = `${plazo}/${sexo}/${fuma}`;
      if (!perfiles.has(clave)) perfiles.set(clave, {});
      perfiles.get(clave)[`${edad}/${anio}`] = { ...costos, ...otros };
    }
    const proyeccion = {
      perfiles: Object.fromEntries(perfiles),
      recargos: Object.fromEntries(
        [10, 99].map((plazo) => [
          plazo,
          recargos.filter((fila) => fila.plazo === plazo).map(({ factor }) => factor),
        ]),
      ),
      cargos: Object.fromEntries(cargos.map(({ anio, cargo }) => [anio, cargo])),
    };
    return { reglas, tarifas, proyeccion };
  } finally {
    sqlite.close();
  }
}

export async function importarMet4U(conexion, datos) {
  const { proyeccion, ...primas } = datos;
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
      [VERSION, JSON.stringify(primas)],
    );
    await conexion.query(
      `CREATE TABLE IF NOT EXISTS metlife_cotizador.met4u_proyecciones (
         version text PRIMARY KEY, datos jsonb NOT NULL
       )`,
    );
    await conexion.query(
      `INSERT INTO metlife_cotizador.met4u_proyecciones (version, datos) VALUES ($1, $2)
       ON CONFLICT (version) DO UPDATE SET datos = excluded.datos`,
      [VERSION, JSON.stringify(proyeccion)],
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
