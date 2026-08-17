# ✅ Checklist — Sync Scheduler 0.4.20–0.4.30 ขึ้น Production

> ใช้ก่อน deploy ทุกครั้ง · ระบบจริง: `10.70.0.1` (Windows, `C:\signage`, รันด้วย Docker)
> เครื่อง dev เข้า prod ผ่าน **SMB อย่างเดียว** (map drive `Z:` — ดู AGENTS.md §3)
> ⚠️ prod **ไม่ใช้ git** — โค้ดไป prod ผ่าน `sync-to-prod.ps1` + `redeploy.bat`

**ขอบเขตของรอบนี้:** ฟีเจอร์ Scheduler (frontend) + migration **0012** (`playlists.color`) + **0013** (`scheduler_snapshots`) + API `/api/scheduler-snapshots` ใหม่

---

## 1. ตรวจบน dev (ก่อน sync) — ต้องผ่านครบ
- [ ] `npm run typecheck` → **0 errors**
- [ ] `npm run build` → สำเร็จ (vite + esbuild server.ts)
- [ ] `npm run test:integration` → **18/18 ผ่าน**
- [ ] `npm run db:migrate` → ขึ้นถึง `0013_faulty_marvel_apes` (ดู `__drizzle_migrations` / log)
- [ ] เปิด Scheduler บน dev ตรวจคร่าวๆ: view สลับได้ · ลากย้าย/undo (Ctrl+Z) · import JSON เปิด diff · บันทึก/ลบ restore point · สีเพลย์ลิสต์
- [ ] เช็ค `git status` — ไม่มีไฟล์ค้างที่ไม่ได้ตั้งใจ (ไฟล์ที่ sync = เท่าที่ commit)

## 2. สำรอง `.env` prod (กฎเหล็ก — ห้ามแก้ .env โดยไม่สำรอง)
- [ ] บนเครื่อง prod: คัดลอก `.env` → `.env.backup-<timestamp>` (เช่น `.env.backup-20260817-0900`)
- [ ] เทียบ `.env` dev ↔ prod: **JWT_SECRET / WEBHOOK_TOKEN / ADMIN_INITIAL_PASSWORD** — dev ใช้ค่าเดียวกับ prod หรือค่า dev ของตัวเอง (ห้ามเผลอเขียนค่า dev ทับ prod)
- [ ] หมายเหตุ: รอบนี้ **ไม่มีการเปลี่ยน .env** — ถ้าไม่แตะ .env เลย ข้ามการคัดลอกกลับได้ แต่ให้สำรองไว้ก่อนเสมอ

## 3. Sync โค้ด dev → prod
- [ ] บนเครื่อง dev: `powershell -ExecutionPolicy Bypass -File sync-to-prod.ps1`
  - ใช้ `Z:\` / env `SYNC_PROD_PATH` ถ้า SMB UNC ถูก NAT ตัด (error 67 — ดู AGENTS.md)
  - ตรวจผล: **hash ตรงครบทุกไฟล์** (script เทียบ SHA-256 ให้) · `.env`/`uploads`/`dist` ถูกข้ามโดยอัตโนมัติ
- [ ] ตรวจว่ามีไฟล์เหล่านี้รวมอยู่ด้วย: `server.ts` · `src/components/admin/SchedulerEngine.tsx` · `src/store/useSignageStore.ts` · `src/services/api.ts` · `src/types/signage.ts` · `src/middleware/validate.ts` · `src/db/schema.ts` · `src/db/seed.ts` · `src/db/migrations/0012*` + `0013*` + `meta/*` · i18n 3 ไฟล์
- [ ] (ทางเลือก) `powershell -File check-prod-deploy.ps1` — ดูว่ายังไม่มี build เก่าตกค้าง

## 4. Deploy บนเครื่อง prod
- [ ] `cd C:\signage && redeploy.bat` (snapshot → down → **build no-cache** → up → ตรวจ)
- [ ] ดู `build-log.txt` — ต้องไม่มี error · บันทึกชื่อ bundle ใหม่ (เช่น `index-<hash>.js`) ไว้เปรียบเทียบ
- [ ] **การ migrate:** container `signage-migrate` ควร rerun (`docker compose run --rm --build signage-migrate` ถ้าไม่ rerun อัตโนมัติ — redeploy.bat มีขั้นนี้)
- [ ] ตรวจ migration ขึ้นจริง:
  ```bash
  docker compose exec signage-postgres psql -U signage -d signage_db -c "\d playlists"        # ต้องมีคอลัมน์ color
  docker compose exec signage-postgres psql -U signage -d signage_db -c "\d scheduler_snapshots"  # ต้องมีตาราง
  ```

## 5. ตรวจ post-deploy (ยืนยันว่าโค้ดใหม่ขึ้นจริง)
- [ ] หน้า Scheduler โหลดได้ + ไปที่ tab Scheduler
- [ ] **Scheduler UI:** สลับ Day/Week/Month/List · ลากอีเวนต์ → Ctrl+Z ย้อนกลับ · import JSON เปิด diff preview · ปุ่ม "จุดคืนค่า" เปิด modal (จะเห็นว่าดึงจาก API `/api/scheduler-snapshots`)
- [ ] **API ใหม่:** `GET /api/scheduler-snapshots` → **200** (มี token admin) / **401** (ไม่มี token)
- [ ] **สีเพลย์ลิสต์:** เลือกสีใน legend → บันทึก → ตรวจ DB `playlists.color` มีค่า (และข้อมูลเดิมที่ `color=''` ยังอยู่)
- [ ] **restore point:** บันทึกสแนปชอต → ตรวจตาราง `scheduler_snapshots` มีแถว → กู้คืน/ลบ ผ่าน → ลบสแนปชอตทดสอบทิ้ง
- [ ] (ถ้าสะดวก) ตรวจ bundle: `dist/assets/*.js` มี marker ฟีเจอร์ใหม่ (เช่น ข้อความ "ทดลอง" / `scheduler_snapshots`)

## 6. บันทึกผล
- [ ] อัปเดต `AGENTS.md` (Work Log: redeploy prod + bundle hash + ผลตรวจ) และ `CHANGELOG.md` ([0.4.31] หรือต่อท้าย [0.4.30])
- [ ] แจ้งทีม + ระบุสิ่งที่ยังค้าง (ถ้ามี)

---

## Rollback (ถ้าผิดพลาด)
- [ ] บน prod: `rollback.bat snapshot/restore` — ใช้ snapshot ที่ redeploy.bat สร้างก่อน deploy
- [ ] migration 0012/0013 เป็น **additive** (เพิ่มคอลัมน์/ตาราง) — rollback โค้ดไม่ต้อง revert migration; แต่ถ้าต้อง revert จริง:
  ```sql
  ALTER TABLE playlists DROP COLUMN color;
  DROP TABLE scheduler_snapshots;
  ```
  แล้วลบบรรทัดใน `__drizzle_migrations` (ทำโดยคนที่รับผิดชอบ DB เท่านั้น)

## หมายเหตุจากบทเรียน deploy (AGENTS.md §3)
- ห้าม deploy แบบไม่เห็น error — ใช้ `redeploy.bat` + ดู `build-log.txt` เสมอ
- ห้าม `docker compose down -v` — ลบ database + uploads ถาวร
- SMB ถูก NAT ตัด → ใช้ map drive `Z:` + `sync-to-prod.ps1` (รองรับ `Z:\` อัตโนมัติ)
