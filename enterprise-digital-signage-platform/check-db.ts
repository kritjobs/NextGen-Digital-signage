import pg from 'pg';
const p = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const r = await p.query("SELECT id, tags FROM screens LIMIT 1");
  console.log('screens.tags OK:', r.rows);
} catch(e: any) { console.log('screens.tags ERROR:', e.message); }
try {
  const r = await p.query("SELECT id, expires_at FROM media_items LIMIT 1");
  console.log('media.expires_at OK:', r.rows);
} catch(e: any) { console.log('media.expires_at ERROR:', e.message); }
await p.end();
