import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema:    './src/db/schema.ts',
  out:       './src/db/migrations',
  dialect:   'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ??
      `postgresql://${process.env.POSTGRES_USER ?? 'postgres'}:${process.env.POSTGRES_PASSWORD ?? 'postgres'}@${process.env.POSTGRES_HOST ?? 'localhost'}:${process.env.POSTGRES_PORT ?? '5432'}/${process.env.POSTGRES_DB ?? 'signage_db'}`,
  },
  verbose: true,
  strict:  false,
});
