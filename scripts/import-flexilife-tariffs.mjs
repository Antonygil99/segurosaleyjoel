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

export function leerFlexiLifeSuenos(ruta) {
  const db = new DatabaseSync(ruta, { readOnly: true });
  try {
    const leer = (sql) => db.prepare(sql).all();
    const claves = leer(
      "SELECT plazo, riesgo, BAS, EP, PASI, EG, tarifaSH FROM ClaveValores WHERE idPlan = 32 AND idMoneda = 1",
    );
    const edades = leer(
      "SELECT plazo, idBeneficio, edadMin, edadMax, edadCan FROM Edades WHERE idPlan = 32",
    );
    const [{ sumaMin, recFijo }] = leer(
      "SELECT sumaMin, recFijo FROM SumaMinBas WHERE idPlan = 32 AND idMoneda = 1",
    );
    const tarifas = leer(`SELECT DISTINCT p.plan, edad, banda, sexo, p.fuma, prima FROM Primas AS p
      WHERE p.plan = 'NGF01F' OR p.plan IN (
        SELECT BAS FROM ClaveValores WHERE idPlan = 32 UNION
        SELECT EP FROM ClaveValores WHERE idPlan = 32 UNION
        SELECT PASI FROM ClaveValores WHERE idPlan = 32 UNION
        SELECT EG FROM ClaveValores WHERE idPlan = 32
      )`);
    const admin = leer(`SELECT plan, edad, banda, sexo, fuma, ano, admin, benef FROM CostoAdmFlexi
      WHERE plan = 'NUVA00' OR plan IN (SELECT BAS FROM ClaveValores WHERE idPlan = 32)`);
    const qx = leer(`SELECT benef, riesgo, edad, coiMS AS MS, coiMN AS MN, coiFS AS FS, coiFN AS FN
      FROM CoiFlexi WHERE idPlan = 32 ORDER BY rowid`);
    const rescate = leer("SELECT costoRescate FROM CostoRescateFlexi ORDER BY rowid");
    const recargos = leer(
      "SELECT idFormaPago, tasaRecargo FROM RecargoFormaPago WHERE idPlan = 32 AND idMoneda = 1",
    );
    const fondos = leer("SELECT * FROM TasasFlexi WHERE cuenta IN ('Ahorro', 'PPR', 'CPEA')");
    const limites = leer(`SELECT idBeneficio, sumaMin, sumaMax FROM SumaBeneficios
      WHERE idMoneda = 1 AND idBeneficio IN ('ACC', 'EG', 'GF', 'PASI')`);
    if (
      claves.length !== 6 ||
      edades.length < 20 ||
      tarifas.length < 3000 ||
      admin.length < 6000 ||
      qx.length !== 604 ||
      rescate.length !== 11 ||
      fondos.length !== 3 ||
      recargos.length !== 4 ||
      limites.length !== 4
    ) {
      throw new Error("El archivo no contiene el tarifario completo de FlexiLife Sueños.");
    }
    return {
      sumaMin,
      recFijo,
      minimoPreferente: 2500000,
      maximoPPR: 88.36 * 365 * 5,
      maximoCPEA: 152000,
      tipoCambioDolar: 20,
      claves: Object.fromEntries(
        claves.map(({ plazo, riesgo, ...datos }) => [`${plazo}/${riesgo}`, datos]),
      ),
      edades: Object.fromEntries(
        edades.map(({ plazo, idBeneficio, ...datos }) => [`${plazo}/${idBeneficio}`, datos]),
      ),
      tasas: Object.fromEntries(fondos.map(({ cuenta, ...tasas }) => [cuenta, tasas])),
      tarifas: Object.fromEntries(
        tarifas.map(({ plan, edad, banda, sexo, fuma, prima }) => [
          `${plan}/${edad}/${banda}/${sexo}${fuma}`,
          prima,
        ]),
      ),
      admin: Object.fromEntries(
        admin.map(({ plan, edad, banda, sexo, fuma, ano, admin, benef }) => [
          `${plan}/${edad}/${banda}/${sexo}${fuma}/${ano}/${benef}`,
          admin,
        ]),
      ),
      qx: Object.fromEntries(
        qx.map(({ benef, riesgo, edad, ...datos }) => [`${benef}/${riesgo}/${edad}`, datos]),
      ),
      rescate: rescate.map(({ costoRescate }) => costoRescate),
      recargos: Object.fromEntries(
        recargos.map(({ idFormaPago, tasaRecargo }) => [idFormaPago, tasaRecargo]),
      ),
      limites: Object.fromEntries(limites.map(({ idBeneficio, ...datos }) => [idBeneficio, datos])),
    };
  } finally {
    db.close();
  }
}

export async function importarFlexiLife(conexion, datos, suenos) {
  await conexion.query("BEGIN");
  try {
    await conexion.query("SELECT pg_advisory_xact_lock(7616801)");
    await conexion.query("CREATE SCHEMA IF NOT EXISTS metlife_cotizador");
    await conexion.query(`CREATE TABLE IF NOT EXISTS metlife_cotizador.flexi_tarifarios (
      version text NOT NULL, plan integer NOT NULL, datos jsonb NOT NULL, PRIMARY KEY (version, plan)
    )`);
    for (const [plan, tarifario] of [
      [31, datos],
      [32, suenos],
    ]) {
      if (!tarifario) continue;
      await conexion.query(
        `INSERT INTO metlife_cotizador.flexi_tarifarios (version,plan,datos) VALUES ($1,$2,$3)
        ON CONFLICT (version,plan) DO UPDATE SET datos=excluded.datos`,
        ["7.6", plan, JSON.stringify(tarifario)],
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
  const datos = leerFlexiLife(resolve(ruta));
  const suenos = leerFlexiLifeSuenos(resolve(ruta));
  const conexion = new pg.Client({ connectionString, connectionTimeoutMillis: 10000 });
  try {
    await conexion.connect();
    await importarFlexiLife(conexion, datos, suenos);
    console.log("Tarifarios de FlexiLife Inversión y Sueños 7.6 importados.");
  } finally {
    await conexion.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error("No se pudo importar FlexiLife.", error?.code ?? "");
    process.exitCode = 1;
  });
}
