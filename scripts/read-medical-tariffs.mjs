import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const ARCHIVOS = {
  nueva: "MedicaLifeNN.db",
  campana: "MedicaLifeNNcampa.db",
  renovacion: "MedicaLifeRR.db",
  anterior: "MedicaLifeRRant.db",
  anterior2: "MedicaLifeRRant2.db",
  anterior3: "MedicaLifeRRant3.db",
};

const TABLAS = [
  "gmPlanes",
  "gmMunicipios",
  "gmFactoresSuma",
  "gmFactoresDeducible",
  "gmFactoresDeducibleExt",
  "gmFactoresCoasNal",
  "gmIncrementoTabulador",
  "gmSumaMA",
  "gmSumaRD",
  "gmSumaUG",
  "gmFactoresRegion",
  "gmTarifaNacional",
  "gmTarifaExtranjero",
  "gmTarifaIncrementoSuma",
  "gmTarifaRentaDiaria",
  "gmTarifaUltimosGastos",
  "gmOtrasTarifas",
  "gmMetDental",
  "gmEdadMaxima",
  "gmRecargoFP",
];

export function leerMédicaLife(carpeta) {
  return Object.fromEntries(
    Object.entries(ARCHIVOS).map(([vigencia, archivo]) => {
      const db = new DatabaseSync(join(carpeta, archivo), { readOnly: true });
      try {
        const datos = Object.fromEntries(
          TABLAS.map((tabla) => [tabla, db.prepare(`SELECT * FROM ${tabla} ORDER BY rowid`).all()]),
        );
        return [`MedicaLife/${vigencia}`, datos];
      } finally {
        db.close();
      }
    }),
  );
}
