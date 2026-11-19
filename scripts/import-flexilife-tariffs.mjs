import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

export function leerFlexiLife(ruta) {
  const db = new DatabaseSync(ruta, { readOnly: true });
  try {
    const planes = db
      .prepare(
        `SELECT clave.plazo, clave.BAS AS codigo, regla.edadMin, regla.edadMax
      FROM ClaveValores AS clave JOIN Edades AS regla ON regla.idPlan = clave.idPlan
       AND regla.plazo = clave.plazo AND regla.idBeneficio = 'BAS'
      WHERE clave.idPlan = 31 AND clave.idMoneda = 1 AND clave.riesgo = 0 AND clave.fuma = 'NA'`,
      )
      .all();
    const prima = db.prepare(`SELECT edad, prima FROM Primas
      WHERE plan = ? AND sexo = 'M' AND fuma = 'S' AND banda = 0 ORDER BY rowid`);
    const admin = db.prepare(`SELECT edad, ano, admin FROM CostoAdmFlexi
      WHERE plan = ? AND benef = 'BAS' AND sexo = 'M' AND fuma = 'S' AND banda = 0 ORDER BY rowid`);
    const costos = db
      .prepare("SELECT sumaMin, recFijo FROM SumaMinBas WHERE idPlan = 31 AND idMoneda = 1")
      .get();
    const recargos = db
      .prepare(
        "SELECT idFormaPago, tasaRecargo FROM RecargoFormaPago WHERE idPlan = 31 AND idMoneda = 1",
      )
      .all();
    const qx = db
      .prepare(
        `SELECT coiMS AS MS, coiMN AS MN, coiFS AS FS, coiFN AS FN
      FROM CoiFlexi WHERE idPlan = 31 AND benef = 'BAS' AND riesgo = 1 ORDER BY rowid`,
      )
      .all();
    const rescate = db
      .prepare("SELECT costoRescate FROM CostoRescateFlexi ORDER BY rowid")
      .all()
      .map(({ costoRescate }) => costoRescate);
    const fondos = db
      .prepare(
        `SELECT diariaMN, mensualMN, trimestralMN, semestralMN, diariaDls, mensualDls
      FROM TasasFlexi WHERE cuenta = 'Ahorro'`,
      )
      .get();
    if (
      planes.length !== 2 ||
      !costos ||
      recargos.length !== 4 ||
      qx.length !== 101 ||
      rescate.length !== 11 ||
      !fondos
    ) {
      throw new Error("El archivo no contiene el tarifario completo de FlexiLife Inversión.");
    }
    return {
      ...costos,
      qx,
      rescate,
      fondos,
      recargos: Object.fromEntries(
        recargos.map(({ idFormaPago, tasaRecargo }) => [idFormaPago, tasaRecargo]),
      ),
      planes: Object.fromEntries(
        planes.map(({ plazo, codigo, ...edades }) => [
          plazo,
          {
            ...edades,
            primas: Object.fromEntries(prima.all(codigo).map(({ edad, prima }) => [edad, prima])),
            admin: Object.fromEntries(
              admin.all(codigo).map(({ edad, ano, admin }) => [`${edad}/${ano}`, admin]),
            ),
          },
        ]),
      ),
    };
  } finally {
    db.close();
  }
}

export async function importarFlexiLife(conexion, datos) {
  await conexion.query("BEGIN");
  try {
    await conexion.query("SELECT pg_advisory_xact_lock(7616801)");
    await conexion.query("CREATE SCHEMA IF NOT EXISTS metlife_cotizador");
    await conexion.query(`CREATE TABLE IF NOT EXISTS metlife_cotizador.flexi_tarifarios (
      version text NOT NULL, plan integer NOT NULL, datos jsonb NOT NULL, PRIMARY KEY (version, plan)
    )`);
    await conexion.query(
      `INSERT INTO metlife_cotizador.flexi_tarifarios (version,plan,datos) VALUES ($1,$2,$3)
      ON CONFLICT (version,plan) DO UPDATE SET datos=excluded.datos`,
      ["7.6", 31, JSON.stringify(datos)],
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
  const datos = leerFlexiLife(resolve(ruta));
  const conexion = new pg.Client({ connectionString, connectionTimeoutMillis: 10000 });
  try {
    await conexion.connect();
    await importarFlexiLife(conexion, datos);
    console.log("FlexiLife Inversión 7.6: plazos de 10 y 20 años importados.");
  } finally {
    await conexion.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error("No se pudo importar FlexiLife Inversión.", error?.code ?? "");
    process.exitCode = 1;
  });
}
