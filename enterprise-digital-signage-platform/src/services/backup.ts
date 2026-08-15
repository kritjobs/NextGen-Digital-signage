/**
 * Backup Service — REQ-007
 * - DB dump: pure-JS (JSON ผ่าน pg pool) — ใช้ได้ทั้ง dev (Windows) และ prod (node:20-alpine ที่ไม่มี pg_dump)
 * - Uploads: zip ด้วย archiver (CommonJS-compatible กับ bundle CJS)
 * - Retention: ลบไฟล์เก่าเกิน BACKUP_RETENTION_DAYS (default 7 วัน)
 * - Scheduler: เช็คทุกชั่วโมง ถ้าตรง BACKUP_HOUR (default 03:00) และยังไม่มี backup ของวันนี้ → รันอัตโนมัติ
 *
 * Config (.env):
 *   BACKUP_DIR             default ./backups (docker: mount volume มาที่นี่)
 *   BACKUP_RETENTION_DAYS  default 7
 *   BACKUP_HOUR            default 3 (ชั่วโมงที่รันอัตโนมัติ, 0-23)
 */
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { pool } from '../db/index.js';
import { UPLOAD_DIR } from './storage.js';

// ─── Config ─────────────────────────────────────────────────
export const BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(process.cwd(), 'backups');
export const BACKUP_RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS ?? 7);
export const BACKUP_HOUR = Number(process.env.BACKUP_HOUR ?? 3);

const FILE_RE = /^(db|uploads)-[0-9]{8}-[0-9]{6}\.(json|zip)$/;

export interface BackupEntry {
  name: string;
  type: 'db' | 'uploads';
  sizeBytes: number;
  sizeMB: string;
  createdAt: string; // ISO (จาก mtime ของไฟล์)
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function stamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// ─── DB dump (JSON) ─────────────────────────────────────────
export async function dumpDatabase(): Promise<string> {
  ensureDir(BACKUP_DIR);
  const client = await pool.connect();
  try {
    const tablesRes = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    const tables: string[] = tablesRes.rows
      .map((r) => r.tablename as string)
      .filter((t) => /^[a-z0-9_]+$/.test(t)); // guard: ป้องกัน identifier ที่ผิดปกติ

    const data: Record<string, unknown[]> = {};
    for (const t of tables) {
      const res = await client.query(`SELECT * FROM "${t}"`);
      data[t] = res.rows;
    }

    const file = path.join(BACKUP_DIR, `db-${stamp(new Date())}.json`);
    const payload = {
      meta: {
        format: 'nextgen-signage-json-dump',
        version: 1,
        generatedAt: new Date().toISOString(),
        tables,
        rowCounts: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])),
      },
      data,
    };
    fs.writeFileSync(file, JSON.stringify(payload));
    return file;
  } finally {
    client.release();
  }
}

// ─── Uploads dump (zip) ─────────────────────────────────────
export async function dumpUploads(): Promise<string> {
  ensureDir(BACKUP_DIR);
  const file = path.join(BACKUP_DIR, `uploads-${stamp(new Date())}.zip`);
  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(file);
    const archive = archiver('zip', { zlib: { level: 6 } });
    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));
    archive.pipe(output);
    archive.append(
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        source: UPLOAD_DIR,
        note: 'NextGen Digital Signage — uploads backup (REQ-007)',
      }),
      { name: '_backup-info.json' }
    );
    if (fs.existsSync(UPLOAD_DIR)) {
      archive.directory(UPLOAD_DIR, false);
    } else {
      archive.append('', { name: 'EMPTY' });
    }
    void archive.finalize();
  });
  return file;
}

// ─── Run full backup (DB + uploads) ─────────────────────────
export async function runBackup(): Promise<{ db: string; uploads: string }> {
  const dbFile = await dumpDatabase();
  const upFile = await dumpUploads();
  return { db: dbFile, uploads: upFile };
}

// ─── List ───────────────────────────────────────────────────
export function listBackups(): BackupEntry[] {
  ensureDir(BACKUP_DIR);
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => FILE_RE.test(f))
    .map((f) => {
      const st = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        name: f,
        type: (f.startsWith('db-') ? 'db' : 'uploads') as BackupEntry['type'],
        sizeBytes: st.size,
        sizeMB: (st.size / (1024 * 1024)).toFixed(2),
        createdAt: st.mtime.toISOString(),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ─── Retention cleanup ──────────────────────────────────────
export function cleanupOldBackups(): number {
  ensureDir(BACKUP_DIR);
  const cutoff = Date.now() - BACKUP_RETENTION_DAYS * 86_400_000;
  let removed = 0;
  for (const f of fs.readdirSync(BACKUP_DIR)) {
    if (!FILE_RE.test(f)) continue;
    const p = path.join(BACKUP_DIR, f);
    if (fs.statSync(p).mtimeMs < cutoff) {
      fs.unlinkSync(p);
      removed++;
    }
  }
  return removed;
}

// ─── Safe file resolve (กัน path traversal) ─────────────────
export function resolveBackupFile(name: string): string | null {
  const base = path.resolve(BACKUP_DIR);
  const full = path.resolve(base, name);
  if (full !== base && !full.startsWith(base + path.sep)) return null;
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
  return full;
}

export function deleteBackupFile(name: string): boolean {
  const full = resolveBackupFile(name);
  if (!full) return false;
  fs.unlinkSync(full);
  return true;
}

// ─── Scheduler (อัตโนมัติ 1 ครั้ง/วัน + cleanup) ─────────────
export function startBackupScheduler(): void {
  const check = () => {
    const now = new Date();
    const hasToday = listBackups().some((b) => b.createdAt.slice(0, 10) === now.toISOString().slice(0, 10));
    if (now.getHours() === BACKUP_HOUR && !hasToday) {
      console.log(`[backup] scheduled run (${now.toISOString()})`);
      runBackup()
        .then(() => {
          const removed = cleanupOldBackups();
          console.log(`[backup] done, cleaned ${removed} old backup(s)`);
        })
        .catch((e) => console.error('[backup] scheduled run failed:', e.message));
    } else {
      cleanupOldBackups();
    }
  };
  setTimeout(check, 15_000); // ตรวจครั้งแรกหลัง server ขึ้น 15 วิ
  setInterval(check, 60 * 60 * 1000); // แล้วตรวจทุกชั่วโมง
}
