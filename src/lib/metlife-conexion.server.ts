import { Pool } from "pg";

let pool: Pool | undefined;

export function obtenerConexionMetLife() {
  const connectionString = process.env.DATA_URL || process.env.DATABASE_URL;
  if (!connectionString) return;
  pool ??= new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });
  return pool;
}
