# 📘 Git Help — คู่มือฉบับย่อสำหรับ Kiro และ Freebuff

> Git repo อยู่ที่ **workspace root** (`C:\NextGen Digital Signature`) — ครอบทั้ง AGENTS.md, .kiro/specs, โปรเจคหลัก และ prototypes
> **หลักคิด:** หนึ่ง commit = หนึ่งงานที่เสร็จ, commit บ่อย, push ทันที — กันงานหายและย้อนกลับได้เสมอ

---

## 1. ภาพรวม workflow (อ่านก่อนเริ่มงานทุกครั้ง)

```
ก่อนเริ่มงาน:
  git status          ← เช็คว่ามีไฟล์ค้าง/งานของคนอื่นไหม (ห้ามทับ!)
  git pull            ← ดึงของใหม่จาก GitHub (ถ้ามีคนอื่น push ไป)

หลังทำงานเสร็จ:
  1. typecheck + build ผ่าน 0 errors
  2. git status          ← ดูว่าแก้ไฟล์อะไรบ้าง
  3. git add <ไฟล์ที่แก้เท่านั้น>   ← ห้าม git add -A เก็บกวาด!
  4. git commit -m "..."          ← ตามสไตล์ด้านล่าง
  5. git push
```

---

## 2. คำสั่งที่ใช้บ่อย

### ดูสถานะ / ประวัติ
```bash
git status                # ไฟล์ที่แก้/ค้าง (ต้องสะอาดก่อนเริ่มงานใหม่)
git log --oneline -10     # ประวัติ commit ล่าสุด
git diff                  # ดูว่าแก้อะไรไป (ยังไม่ commit)
git diff --cached         # ดูสิ่งที่ stage ไว้แล้ว
```

### commit
```bash
git add src/components/admin/ScreensManager.tsx   # stage เฉพาะไฟล์ที่เกี่ยวข้อง
git add AGENTS.md .kiro/requests.md               # เพิ่มหลายไฟล์ได้
git commit -m "..."                                # ตามสไตล์ในข้อ 3
```

### push / pull
```bash
git push                  # อัปโหลด commit ขึ้น GitHub
git pull                  # ดึงของใหม่จาก GitHub (ทำก่อนเริ่มงานเสมอ)
```

### ย้อนกลับ (rollback)
```bash
git log --oneline                     # หา hash ของ commit ที่ต้องการย้อน
git revert <hash>                     # ✅ ย้อนแบบปลอดภัย (สร้าง commit ใหม่ ไม่ลบประวัติ)
git revert HEAD                       # ย้อน commit ล่าสุด
# ❌ ห้ามใช้ git reset --hard / force push เว้นแต่รู้จริงว่าทำอะไร
```

### อื่นๆ
```bash
git status -sb            # โชว์ branch + จำนวน commit ที่ยังไม่ push
git fetch                 # ดึงข้อมูล remote โดยไม่ merge
git branch -a             # ดู branch ทั้งหมด
```

---

## 3. สไตล์ commit message

**รูปแบบ:** `<type>: <สิ่งที่ทำสั้นๆ (ภาษาไทยได้)>`

```bash
git commit -m "fix: กัน IP spoof โดยใช้ connection IP เป็นหลัก

กลับลำดับ IP priority ใน server.ts (pair + heartbeat)
แก้ไขโดย Kiro — 2026-08-15"
```

**type ที่ใช้:**
- `feat:` — ฟีเจอร์ใหม่ (เช่น REQ-001, REQ-002)
- `fix:` — แก้บั๊ก / ปิดช่องโหว่
- `chore:` — งานสนับสนุน (ตั้ง git, .gitignore, เอกสาร)
- `docs:` — แก้เอกสารอย่างเดียว
- `refactor:` — ปรับโครงสร้าง ไม่เปลี่ยนพฤติกรรม

**กฎ:**
- ✅ มาร์คผู้ทำเสมอ: `แก้ไขโดย Freebuff — <วันที่>` หรือ `แก้ไขโดย Kiro — <วันที่>`
- ✅ commit ไฟล์เอกสาร (AGENTS.md, requests.md, CHANGELOG.md) แยกหรือรวมกับงานนั้นก็ได้ — แต่ต้อง commit ครบทุกครั้งหลังงานเสร็จ (ตาม AGENTS.md §6.1)
- ✅ subject สั้น (< 72 ตัวอักษร), รายละเอียดอยู่ใน body

---

## 4. กติกาเหล็ก (ห้ามละเมิด)

| ห้าม | เพราะ |
|---|---|
| ❌ `git add -A` / `git add .` | อาจลากไฟล์ที่ไม่เกี่ยวข้อง (หรือของคนอื่น) เข้า commit |
| ❌ commit `.env`, `uploads/`, `.freebuff/`, `node_modules/`, `dist/` | อยู่ใน .gitignore อยู่แล้ว — ถ้าเห็นหลุด ให้หยุดแล้วแจ้ง |
| ❌ `git reset --hard` / force push | ลบประวัติถาวร — ใช้ `git revert` แทน |
| ❌ commit งานที่ยัง typecheck ไม่ผ่าน | กติกา AGENTS.md §6.4 |
| ❌ amend commit ที่ push ไปแล้ว | ประวัติจะไม่ตรงกับ remote — ถ้าจำเป็นต้องแก้ ใช้ commit ใหม่ |

**ถ้าเผลอ commit ผิด:** บอกมนุษย์/agent อีกตัว — ยังไม่ push = แก้ได้ง่าย, push แล้ว = ใช้ `git revert`

---

## 5. หมายเหตุพิเศษ

- **เครื่อง prod (10.70.0.1) ไม่ใช้ git** — โค้ดไป prod ผ่าน `sync-to-prod.ps1` (SMB) + `redeploy.bat` เหมือนเดิม — git คือแหล่งความจริงฝั่ง dev
- **เครื่องนี้ login GitHub เป็น `thaihua-admin`** — ถ้า push ไป repo ของ kritjobs แล้ว fail ("Repository not found") แปลว่า repo ถูกปิดเป็น private → ให้มนุษย์เพิ่ม `thaihua-admin` เป็น collaborator หรือ login GCM เป็น kritjobs
- **สอง agent แก้ไฟล์เดียวกันพร้อมกัน = พัง** — เช็ค `git status` + ดู `requests.md` ก่อนเริ่มงานเสมอ ถ้าชนกัน ให้รออีกฝ่าย commit ก่อนแล้ว `git pull`
