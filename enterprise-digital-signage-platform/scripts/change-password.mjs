// ═══════════════════════════════════════════════════════════════
// change-password.mjs — เปลี่ยนรหัสผู้ใช้ (bcrypt) บน DB
//
// ใช้:
//   DATABASE_URL=postgresql://... node scripts/change-password.mjs <email> <new-password>
//   node scripts/change-password.mjs <email> <new-password>   (ใช้ค่า default .env)
//
// ตัวอย่าง:
//   DATABASE_URL="postgresql://signage_admin:SignageSecure2026!@localhost:5433/signage_db" \
//     node scripts/change-password.mjs admin@signage.local "MyNew!Pass123"
//
// ปลอดภัย:
//   - กันใช้รหัส default (Admin@2026! / Staff@2026! / Viewer@2026!)
//   - บังคับความแข็งแรง (>=8 ตัว + ใหญ่ + เล็ก + เลข)
//   - อ่าน password จาก argument (ไม่ logging)
// ═══════════════════════════════════════════════════════════════
import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const email = (process.argv[2] || '').trim().toLowerCase();
const newPassword = process.argv[3] || '';
const DB_URL = process.env.DATABASE_URL
  || `postgresql://${process.env.POSTGRES_USER ?? 'signage_admin'}:${process.env.POSTGRES_PASSWORD ?? 'SignageSecure2026!'}@${process.env.POSTGRES_HOST ?? 'localhost'}:${process.env.POSTGRES_PORT ?? '5433'}/${process.env.POSTGRES_DB ?? 'signage_db'}`;

if (!email) { console.error('❌ usage: node scripts/change-password.mjs <email> <new-password>'); process.exit(1); }
if (!newPassword) { console.error('❌ missing new password'); process.exit(1); }

const DEFAULT_PASSWORDS = ['Admin@2026!', 'Staff@2026!', 'Viewer@2026!'];
if (DEFAULT_PASSWORDS.includes(newPassword)) {
  console.error('❌ Default password is not allowed — เลือกรหัสใหม่ที่ไม่อยู่ใน seed default');
  process.exit(1);
}
if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
  console.error('❌ รหัสต้อง: >=8 ตัว + ตัวพิมพ์ใหญ่ + ตัวพิมพ์เล็ก + ตัวเลข');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DB_URL });
try {
  await client.connect();
  const { rows } = await client.query('SELECT id, email, role FROM users WHERE email = $1', [email]);
  if (rows.length === 0) {
    console.error(`❌ ไม่พบผู้ใช้: ${email}`);
    process.exit(1);
  }
  const user = rows[0];
  const hash = await bcrypt.hash(newPassword, 12);
  await client.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [hash, user.id],
  );
  console.log(`✅ เปลี่ยนรหัสแล้ว: ${user.email} (${user.role})`);
  console.log('   ⚠️ session เก่าทุกเครื่องถูกบังคับล็อกอินใหม่ (ถ้า server รันโค้ดที่มี /api/auth/change-password)');
} catch (err) {
  console.error('❌ error:', err.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
