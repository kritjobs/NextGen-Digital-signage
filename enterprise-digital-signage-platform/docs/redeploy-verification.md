# ตรวจสอบหลัง Redeploy — `verify-prod-fix.ps1`

เครื่องมือมาตรฐานของทีมสำหรับยืนยันว่า **การ redeploy บน prod (10.70.0.1) สำเร็จจริง** — ใช้ทุกครั้งหลังรัน `redeploy.bat` เพื่อไม่ให้พลาดกรณี "sync แล้วแต่ build เก่ายังรันอยู่"

## วงจร deploy มาตรฐาน (ลำดับไม่ควรข้าม)

```
1. แก้โค้ด → typecheck + build ผ่าน
2. powershell -ExecutionPolicy Bypass -File sync-to-prod.ps1      (เครื่อง dev — sync ผ่าน SMB)
3. ที่เครื่อง prod: cd C:\signage && redeploy.bat                 (เครื่อง prod — build + restart ~2-5 นาที)
4. powershell -ExecutionPolicy Bypass -File verify-prod-fix.ps1   (เครื่อง dev — ตรวจว่าขึ้นจริง)
```

## วิธีใช้

```powershell
# ตรวจมาตรฐาน (marker เริ่มต้น = pickScreenFields — ฟิกซ์เพิ่มจอใหม่)
powershell -NoProfile -ExecutionPolicy Bypass -File verify-prod-fix.ps1

# ตรวจ fix ฝั่ง server — ส่งชื่อ marker ที่จะค้นใน Z:\server.ts
powershell -NoProfile -ExecutionPolicy Bypass -File verify-prod-fix.ps1 -Marker ชื่อฟังก์ชัน/ตัวแปรของฟิกซ์

# ตรวจ fix ฝั่ง frontend — marker ใน bundle ที่ prod เสิร์ฟจริง
# (โหลด index.html → ดึง asset JS → grep ข้อความที่รอด minification เช่น console.error ในฟิกซ์)
powershell -NoProfile -ExecutionPolicy Bypass -File verify-prod-fix.ps1 -BundleMarker "rolled back optimistic change"
```

**เลือกโหมดให้ตรงกับฝั่งของฟิกซ์:**

| ฟิกซ์อยู่ฝั่ง | ใช้พารามิเตอร์ | ตรวจที่ไหน |
|---|---|---|
| Server (`server.ts`) | `-Marker` (default) | ไฟล์ `Z:\server.ts` ที่ sync ขึ้นแล้ว |
| Frontend (bundle/UI) | `-BundleMarker` | JS bundle ที่ prod **เสิร์ฟจริง** (ผ่าน HTTP — พิสูจน์ว่า build ใหม่มีฟิกซ์ ไม่ใช่แค่ source ตรง) |

> 💡 ฟิกซ์ฝั่ง UI แนะนำ marker เป็น **ข้อความที่รอด minification** แน่นอน เช่น console.error ใน store
> (`[screens] update failed — rolled back optimistic change`, `delete failed — restored entry`)
> — ชื่อฟังก์ชันอาจถูกมังเกิลใน bundle ได้

**ข้อกำหนดก่อนรัน:**
- `Z:` ต้องแมปไปที่ `\\10.70.0.1\c\signage` (เดียวกับที่ `sync-to-prod.ps1` ใช้ — รันตอนรัน sync ผ่านแล้วก็ได้)
- ควรรัน **ทันทีหลัง** `redeploy.bat` เสร็จ (เช็ค uptime ใช้เกณฑ์ < 5 นาที)

## แต่ละเช็คหมายถึงอะไร

| # | เช็ค | ผ่านเมื่อ | ล้มเหลว = |
|---|---|---|---|
| 1 | `/api/health` | uptime < 300s, `connectedClients` กลับครบ, `db=connected` | ยังไม่ redeploy / container ตาย / DB ไม่ขึ้น |
| 2 | `Z:\build-log.txt` | timestamp ใหม่, ไม่มี error/failed, ลงท้าย `Image ... Built` | build พัง (ดู error ใน log) หรือยังไม่รัน redeploy |
| 3 | Marker — โหมด `-Marker`: ใน `Z:\server.ts` / โหมด `-BundleMarker`: ใน bundle ที่ prod เสิร์ฟ | พบ marker ที่ระบุ (ค่าเริ่มต้น `pickScreenFields`) | sync ไม่ทัน / ยังไม่ redeploy / bundle เก่า |
| 4 | Header `X-Frame-Options` บน `/display` | **ต้องไม่มี** header นี้ (webOS kiosk ฝังหน้าใน iframe) | ตัวแก้ server.ts ยังไม่ขึ้น / ยังไม่ redeploy |

**Exit code:** `0` = ผ่านทุกเช็ค, `1` = มีเช็คล้มเหลว (ดูข้อความ FAIL ข้างบน)

## ตัวอย่างผลลัพธ์ที่ผ่าน

```
=== 1) PROD HEALTH ===
status=ok version=0.2.0 uptime=247s connectedClients=8 db=connected
=== 2) BUILD-LOG ===
LastWrite: 8/17/2026 11:58:26 AM | 7549 bytes
OK: no error/failed lines
 Image signage-app:latest Built
=== 3) MARKER 'pickScreenFields' in Z:\server.ts ===
OK: found 3 reference(s), first at line 666
=== 4) X-Frame-Options on /display ===
HTTP: HTTP/1.1 200 OK
OK: X-Frame-Options absent
ALL CHECKS PASSED - redeploy verified.
```

ตัวอย่างโหมด frontend (`-BundleMarker`):

```
=== 3) MARKER 'rolled back optimistic change' in served JS bundle (frontend fix - compiled by Vite) ===
bundle: assets/index-BeeoTckg.js  <- served by prod
OK: marker 'rolled back optimistic change' found in served bundle
```

> หาก bundle hash ยังเป็นตัวเดิม (ไม่เปลี่ยนชื่อไฟล์) + marker ไม่เจอ → ยังไม่ redeploy หรือ redeploy ไม่สำเร็จ

## เทสต์ functional เพิ่มเติม (optional — ต้องมี admin creds ของ prod)

สคริปต์ตรวจแบบ static อย่างเดียว — ถ้าต้องการพิสูจน์ฟังก์ชันจริงบน prod (เช่น ฟิกซ์เพิ่มจอ) ให้เทสต์ด้วย payload เดียวกับ UI:

```
POST /api/screens  (body: name, group, location, orientation, pairingCode,
                    bufferCachedItemsCount: 0, lastHeartbeat: "<ISO string>")
→ ต้องได้ 201 (ฟิกซ์ mapping bufferCachedItemsCount→bufferCachedItems + lastHeartbeat→Date)
→ GET /api/screens/:id ยืนยัน persist → DELETE /api/screens/:id ลบจอทดสอบทิ้ง
```

⚠️ อย่าลืม **ลบจอทดสอบทิ้งเสมอ** หลังเทสต์ และอย่าเดา password (ระบบล็อกบัญชีที่ 5 ครั้ง/15 นาที) — ขอ creds จากเจ้าของระบบ

## หมายเหตุ

- สคริปต์เป็น ASCII ล้วน (เข้ากับ PowerShell 5.1 ที่อ่าน .ps1 แบบ ANSI ถ้าใส่ภาษาไทย/UTF-8 จะ parse พัง)
- ใช้ `curl.exe` ตรวจ header (Invoke-WebRequest ค้างกับหน้า /display ได้)
- ไฟล์นี้ + สคริปต์: เก็บที่ root ของ workspace คู่กับ `sync-to-prod.ps1` / `check-prod-deploy.ps1`
