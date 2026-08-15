# คู่มือ Deploy ปลอดภัย — NextGen Digital Signage (10.70.0.1)

> อัปเดตล่าสุด: 2026-08-12 — เพิ่ม rollback workflow + แก้ secret pass-through ใน compose

## 🔑 สำคัญมาก: container อ่าน `.env` ของ host ไม่ได้

`.env` ที่ `C:\signage\.env` ถูกใช้โดย **docker compose เท่านั้น** (แทนค่าตัวแปรใน `docker-compose.yml`)
ตัวแปรที่ container จะเห็นจริง = เฉพาะที่อยู่ใน `environment:` ของ compose เท่านั้น (และ `.env` ถูกตัดออกจาก image แล้วใน Dockerfile)

**docker-compose.yml ถูกแก้แล้ว** ให้ส่ง `JWT_SECRET` / `WEBHOOK_TOKEN` / `APP_URL` จาก `.env` เข้า container:
```yaml
JWT_SECRET: ${JWT_SECRET:?set JWT_SECRET in .env before deploy}   # บังคับ — ไม่ตั้ง = compose error ทันที
WEBHOOK_TOKEN: ${WEBHOOK_TOKEN:-}                                 # ไม่บังคับ — ไม่ตั้ง = webhook ได้ 503
```

⚠️ สิ่งที่ตรวจพบ: ก่อนหน้านี้ compose ไม่ส่ง `JWT_SECRET` เข้า container → **ระบบที่รันอยู่ใช้ default secret มาตลอด**
(ใครก็ปลอม token ได้) ต้อง deploy รอบนี้เพื่อแก้จริง

---

## 📸 ขั้นตอน 0 — สแนปช็อตก่อน deploy (กันพลาด ใช้เวลา < 1 นาที)

**ทุกครั้งก่อน deploy** ให้รันที่เครื่อง 10.70.0.1 (ใน `C:\signage`):
```bat
rollback.bat snapshot
```
มันจะ:
1. tag image ที่รันอยู่เป็น `signage-app:rollback-<เวลา>` (โค้ดเก่าเก็บไว้ย้อนกลับได้)
2. dump database ไปที่ `backups\pre-deploy-<เวลา>.sql` (ข้อมูลสำรอง)

---

## ขั้นตอน Deploy (ที่เครื่อง 10.70.0.1)

```bat
cd C:\signage

REM 0) สแนปช็อตก่อน (ถ้ายังไม่ได้ทำ)
rollback.bat snapshot

REM 1) ตรวจ .env — compose จะ error ถ้า JWT_SECRET ไม่ตั้ง
notepad .env

REM 2) รัน deploy (build image ใหม่ + migrate อัตโนมัติ)
deploy.bat
```

### ข้อกำหนดใน `.env`
| ตัวแปร | สถานะ | หมายเหตุ |
|---|---|---|
| `JWT_SECRET` | **บังคับ** | ต้องยาว ≥ 32 ตัวอักษร ไม่งั้น compose error / server ไม่ start |
| `WEBHOOK_TOKEN` | แนะนำ | ไม่ตั้ง = `/api/trigger`, `/api/integrations/slack` ได้ 503 (ปลอดภัยก่อน) |
| `NODE_ENV` | ตั้งเป็น `production` | rate limiter ทำงาน + fail-fast เปิด |

> ⚠️ หลังเปลี่ยน `JWT_SECRET`: token เก่าทุกตัว (รวม display token ที่จอใช้อยู่) หมดอายุทันที
> → ต้อง re-pair จอ หรือรอให้จอขอ token ใหม่ตอน re-pair

---

## ↩️ ย้อนกลับ (Rollback) — เมื่อ deploy แล้วมีปัญหา

### ข้อมูลไม่หายแน่นอน
- `docker compose down` / `up` **ไม่แตะ volumes** — database (`signage_pgdata`) และไฟล์ upload (`signage_uploads`) คงเดิม
- ครั้งนี้ schema DB **ไม่เปลี่ยน** (แก้เฉพาะโค้ด + config) → ไม่ต้อง rollback database
- ❌ **ห้ามรัน `docker compose down -v` เด็ดขาด** — คำสั่งนี้ลบ data ทั้งหมดถาวร

### ย้อนกลับโค้ด (ใช้เวลา ~1 นาที)
```bat
cd C:\signage
rollback.bat restore
```
มันจะ: หยุด stack → tag image สแนปช็อตกลับเป็น `latest` → ขึ้นใหม่ด้วยโค้ดเก่า

### ย้อนกลับด้วยมือ (ถ้าอยากควบคุมเอง)
```bat
docker compose down
docker tag signage-app:rollback-<เวลาที่ snapshot> signage-app:latest
docker compose up -d
```

### ถ้า database เสียหายจริงๆ (กรณีสุดท้าย)
```bat
REM ดูไฟล์ dump ที่มี
dir backups

REM restore (ตัวอย่าง)
docker exec -i signage-postgres psql -U signage_admin -d signage_db < backups\pre-deploy-<เวลา>.sql
```
> ควรทำตอน stack หยุด (`docker compose down` ก่อน) และควรทดสอบบนเครื่อง dev ก่อนเสมอ

---

## Checklist หลัง Deploy

```bash
# 1. ตรวจ container ทั้งหมดขึ้นปกติ
docker compose ps

# 2. ตรวจ health (ต้องได้ {"status":"ok","database":"connected"})
curl http://localhost:3100/api/health

# 3. ดู log (หาข้อผิดพลาด)
docker compose logs --tail=50 signage-app

# 4. ทดสอบว่า webhook ถูกปิด (ควรได้ 503)
curl -X POST http://localhost:3100/api/trigger ^
  -H "Content-Type: application/json" ^
  -d "{\"action\":\"refresh\",\"target\":{\"all\":true}}"

# 5. ทดสอบ webhook หลังตั้ง token แล้ว (ควรได้ success)
curl -X POST http://localhost:3100/api/trigger ^
  -H "Content-Type: application/json" ^
  -H "X-Webhook-Token: <WEBHOOK_TOKEN>" ^
  -d "{\"action\":\"refresh\",\"target\":{\"all\":true}}"

# 6. ทดสอบ SSRF guard (ควรได้ "URL blocked")
curl "http://localhost:3100/api/media-proxy?url=http://169.254.169.254/latest/meta-data/"

# 7. login ผ่านหน้าเว็บ admin แล้วลอง trigger emergency ปกติ
```

ถ้าเจอปัญหา: `rollback.bat restore` แล้วแจ้ง log ให้ dev ดู

---

## สรุปสิ่งที่แก้ในรอบนี้

| หมวด | รายละเอียด |
|---|---|
| 🔴 JWT | บังคับ JWT_SECRET ใน production (fail-fast ถ้าเป็นค่า default) + **compose ส่ง secret จาก .env เข้า container** |
| 🔴 Trigger | `/api/trigger`, `/api/trigger/by-tags`, `/api/integrations/slack` ต้องมี WEBHOOK_TOKEN หรือ JWT — ปิดใน prod ถ้าไม่ตั้ง |
| 🔴 WS | anonymous connections รับอย่างเดียว — ส่งข้อความปลอม emergency/quick-post ไม่ได้อีก |
| 🔴 SSRF | `/api/media-proxy` + `/api/widgets/rss` บล็อก private/internal IP (10.x, 172.16-31, 192.168, 169.254, localhost, CGNAT) |
| 🟠 Interact | viewer ที่ไม่ login เปลี่ยน layout/playlist ไม่ได้ (มีแต่ show_message) + rate limit 10/นาที |
| 🟡 Zod | แก้ `z.record()` ให้ compatible กับ Zod 4.4.3 |
| 🟡 Types | typecheck ผ่าน 100% (เดิม 49 errors) — ขยาย contentData/SlideData/RealtimeCommand, ซิงค์ mock data, ลบ dead code |
| 🛟 Rollback | `rollback.bat snapshot/restore` + backup DB อัตโนมัติก่อน deploy |
