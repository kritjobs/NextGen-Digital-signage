/**
 * Migration runner
 * รัน: bun run db:migrate
 * หรือ: tsx src/db/migrate.ts
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.POSTGRES_USER ?? 'postgres'}:${process.env.POSTGRES_PASSWORD ?? 'postgres'}@${process.env.POSTGRES_HOST ?? 'localhost'}:${process.env.POSTGRES_PORT ?? '5432'}/${process.env.POSTGRES_DB ?? 'signage_db'}`;

  console.log('[migrate] Connecting to database...');
  console.log('[migrate] Host:', process.env.POSTGRES_HOST ?? 'localhost');
  console.log('[migrate] Database:', process.env.POSTGRES_DB ?? 'signage_db');

  const pool = new Pool({ connectionString, max: 3 });

  // ตรวจสอบ connection
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('[migrate] ✅ Database connected');
  } catch (err) {
    console.error('[migrate] ❌ Cannot connect to database:', err);
    process.exit(1);
  }

  const db = drizzle(pool);
  const migrationsFolder = path.join(__dirname, 'migrations');

  console.log('[migrate] Running migrations from:', migrationsFolder);

  try {
    await migrate(db, { migrationsFolder });
    console.log('[migrate] ✅ All migrations applied successfully');
  } catch (err) {
    console.error('[migrate] ❌ Migration failed:', err);
    await pool.end();
    process.exit(1);
  }

  await pool.end();
  console.log('[migrate] Done.');
}

runMigrations();
