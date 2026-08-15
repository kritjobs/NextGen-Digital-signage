import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

// ─── Connection Pool ────────────────────────────────────────
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER ?? 'postgres'}:${process.env.POSTGRES_PASSWORD ?? 'postgres'}@${process.env.POSTGRES_HOST ?? 'localhost'}:${process.env.POSTGRES_PORT ?? '5432'}/${process.env.POSTGRES_DB ?? 'signage_db'}`;

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Graceful shutdown
process.on('exit', () => { pool.end().catch(() => {}); });
process.on('SIGINT', () => { pool.end().then(() => process.exit(0)); });
process.on('SIGTERM', () => { pool.end().then(() => process.exit(0)); });

// ─── Drizzle ORM instance ────────────────────────────────────
export const db = drizzle(pool, { schema });

// ─── Health check helper ─────────────────────────────────────
export async function checkDbConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
}
