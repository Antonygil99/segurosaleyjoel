import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

export function leerMetaLife(ruta) {
  const db = new DatabaseSync(ruta, { readOnly: true });
  try {
    const leer = (tabla) => db.prepare(`SELECT * FROM ${tabla} ORDER BY rowid`).all();
    const indice = (filas, clave) => Object.fromEntries(filas.map((fila) => [clave(fila), fila]));
    const primas = (tabla) =>
      Object.fromEntries(
        leer(tabla).map(({ moneda, edad, sexo, fuma, tarMetaLife }) => [
          `${moneda}/${edad}/${sexo}${fuma}`,
          tarMetaLife,
        ]),
      );
    const recargos = (tabla) =>
      Object.fromEntries(leer(tabla).map(({ ano, recargoPoliza }) => [ano, recargoPoliza]));
    const datos = {
      primas: { actual: primas("tblTarMetaLife"), c: primas("tblTarMetaLife2025") },
      recargos: {
        actual: recargos("tblRecargoPoliza"),
        c: recargos("tblRecargoPolizaMetaLife2025"),
      },
      castigos: {
        anterior: indice(leer("tblCastigoRescate"), ({ ano }) => ano),
        actual: indice(leer("tblCastigoRescateMod"), ({ ano }) => ano),
        c: indice(leer("tblCastigoRescateModMetaLife2025"), ({ ano }) => ano),
      },
      reglas: indice(leer("tblReglas"), ({ moneda, idCobertura }) => `${moneda}/${idCobertura}`),
      coi: indice(leer("tblCoiBas"), ({ edad }) => edad),
      coiAdicional: indice(leer("tblCoiBeneficios"), ({ moneda, edad }) => `${moneda}/${edad}`),
      seleccion: indice(leer("tblFacSel"), ({ ano }) => ano),
      adicionales: indice(leer("tblTarBeneficios"), ({ edad }) => edad),
      recargosAdicionales: indice(leer("tblRecargoBeneficios"), ({ edad }) => edad),
      perfecto: indice(
        leer("tblTarPerfect"),
        ({ moneda, edad, banda, sexo, fuma }) => `${moneda}/${edad}/${banda}/${sexo}${fuma}`,
      ),
      comisiones: indice(leer("tblComis"), ({ moneda, ano }) => `${moneda}/${ano}`),
    };
    if (
      Object.keys(datos.primas.actual).length !== 424 ||
      Object.keys(datos.primas.c).length !== 212 ||
      Object.keys(datos.coi).length !== 83 ||
      Object.keys(datos.reglas).length !== 14 ||
      Object.keys(datos.seleccion).length < 81 ||
      Object.keys(datos.perfecto).length !== 1696 ||
      Object.keys(datos.comisiones).length !== 40
    ) {
      throw new Error("El archivo no contiene el tarifario completo de MetaLife 7.6.");
    }
    return datos;
  } finally {
    db.close();
  }
}

export async function importarMetaLife(conexion, datos) {
  await conexion.query("BEGIN");
  try {
    await conexion.query("SELECT pg_advisory_xact_lock(7616802)");
    await conexion.query("CREATE SCHEMA IF NOT EXISTS metlife_cotizador");
    await conexion.query(`CREATE TABLE IF NOT EXISTS metlife_cotizador.metalife_tarifarios (
      version text PRIMARY KEY, datos jsonb NOT NULL
    )`);
    await conexion.query(
      `INSERT INTO metlife_cotizador.metalife_tarifarios (version,datos) VALUES ($1,$2)
      ON CONFLICT (version) DO UPDATE SET datos=excluded.datos`,
      ["7.6", JSON.stringify(datos)],
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
  if (!ruta || !connectionString)
    throw new Error("Configura DATA_URL y proporciona dbMetaLife.db.");
  const datos = leerMetaLife(resolve(ruta));
  const conexion = new pg.Client({ connectionString, connectionTimeoutMillis: 10000 });
  try {
    await conexion.connect();
    await importarMetaLife(conexion, datos);
    console.log("Tarifario de MetaLife 7.6 importado.");
  } finally {
    await conexion.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error("No se pudo importar MetaLife.", error?.code ?? "");
    process.exitCode = 1;
  });
}
