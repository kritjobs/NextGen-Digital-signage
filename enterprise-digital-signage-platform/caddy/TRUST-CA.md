# Trust Caddy Root CA (จำเป็นสำหรับ HTTPS บน LAN)

Caddy ใช้ `tls internal` ออก certificate เอง — เบราว์เซอร์/จอต้อง**เชื่อถือ CA** ของ Caddy ถึงจะใช้ HTTPS ได้แบบไม่มีคำเตือน และ **Service Worker ถึงจะทำงาน**

> ⚠️ **ไฟล์ CA ถูกเปลี่ยนวันที่ 15 ส.ค. (แก้ CA ผิดตัว)** — เครื่อง/จอที่ติดตั้ง CA **ก่อนหน้านั้น** ต้อง**ติดตั้งใหม่** (CA เก่าเซ็นไม่ตรง cert จริง)
> ไฟล์ CA ปัจจุบัน (ถูกต้อง): `C:\signage\caddy\caddy-root-ca.crt`

---

## วิธีเร็วที่สุดบน Windows (คลิกเดียว)

รัน `caddy\install-ca-client.bat` **แบบ Administrator** บนเครื่องลูกค้า — มันจะดาวน์โหลด CA ที่ถูกจาก server → ลบ CA เก่า → ติดตั้ง Trusted Root → ตรวจ https/sw.js ให้อัตโนมัติ

---

---

## Windows (PC / จอที่รัน web player บน Windows)

1. เปิด `caddy-root-ca.crt` (double-click)
2. กด **Install Certificate…**
3. เลือก **Local Machine** → Next
4. เลือก **Place all certificates in the following store** → **Browse…** → เลือก **Trusted Root Certification Authorities** → OK → Next → Finish
5. Restart เบราว์เซอร์ แล้วเปิด `https://10.70.0.1` — ควรไม่มี warning

---

## Android TV / Android (จอ signage)

**ทางเลือกที่ดีที่สุด — native player (`android-player/`):** CA ฝังใน APK ผ่าน Network Security Config (`res/raw/caddy_root_ca.crt`) → WebView trust ให้เอง **ไม่ต้องติดตั้ง CA ที่จอเลย** — อัปเดต CA เมื่อ server เปลี่ยน = rebuild APK (ดู `android-player/README.md`)

วิธีที่ 1 — ติดตั้ง CA ผ่าน **ADB (WiFi)** — รันสคริปต์ `caddy\push-ca-adb.bat` (ที่เครื่องช่าง):
1. ที่ TV: Settings → About → กด "Build" 7 ครั้ง → Developer Options → เปิด **USB/Network debugging**
2. ที่คอม: รัน `push-ca-adb.bat` → กรอก IP TV → มันจะ push CA + เปิดหน้าติดตั้งให้อัตโนมัติ
3. ที่จอ: กด OK/Install + ใส่ PIN (ครั้งเดียว)

วิธีที่ 2 — ติดตั้งด้วยมือ (USB):
1. คัดลอก `caddy-root-ca.crt` ไปที่จอ (USB / ผ่านเครือข่าย)
2. ไปที่ **Settings → Security & restrictions → CA certificates → Install a CA certificate** (Android TV บางรุ่น: Settings → Security → Install from storage)
3. เลือกไฟล์ `.crt` → ยืนยัน
4. เปิด `https://10.70.0.1` — ไม่มี warning + SW ทำงาน

วิธีที่ 3 — ข้ามคำเตือนทีละเครื่อง (เร็ว แต่ต้องทำทุกครั้งที่เปิด browser ใหม่):
1. เปิด `https://10.70.0.1` → เบราว์เซอร์เตือน "Not secure"
2. กด **Advanced → Proceed to 10.70.0.1 (unsafe)**
3. หน้านั้น (แล้วก็ SW ที่ register หลังจากนี้) อยู่ใน secure context แล้ว — **SW ทำงานได้**

---

## Chrome / Edge บนเครื่องอื่นใน LAN
- ติดตั้ง CA แบบ Windows ข้างบน (Local Machine → Trusted Root) — ใช้ได้กับทุกเบราว์เซอร์

---

## ตรวจว่า HTTPS พร้อมใช้ (หลังติดตั้ง CA)

```powershell
# บนเครื่องลูกค้า (curl.exe มีใน Windows 10+ อยู่แล้ว)
curl.exe --ssl-no-revoke -s -o NUL -w "health: %{http_code}" https://10.70.0.1/api/health
curl.exe --ssl-no-revoke -s -o NUL -w "sw.js: %{http_code} %{content_type}" https://10.70.0.1/sw.js
# ควรได้ 200 + 200 application/javascript
# (จำเป็นต้อง --ssl-no-revoke เพราะ CA ภายในไม่มี CRL endpoint — browser ไม่ต้องใช้ flag นี้)
```

## ตรวจว่า Service Worker ทำงานจริงบนจอ

1. เปิดหน้ากิโอสก์: `https://10.70.0.1/display/<screenId>?token=<token>` (generate จากหน้า Admin)
2. ต่อท้าย URL ด้วย `&simoffline=1` → ควรเห็น**แถบทอง "⚡ OFFLINE — เล่นจากแคช"** ที่มุมขวาบน = อ่านจาก SW cache ได้จริง
3. (ละเอียด) DevTools → Console:
   ```js
   await navigator.serviceWorker.getRegistrations()
   // ควรเห็น [{ scope: 'https://10.70.0.1/', active: { state: 'activated' } }]
   await caches.keys()
   // ควรเห็น signage-sw-v1-shell / -data / -media
   ```

---

## ทางเลือกที่ดีกว่า (ถ้ามี domain)
- ถ้ามี domain สาธารณะ + DDNS (เช่น signage.company.com ชี้มาที่ 10.70.0.1) → ใช้ Let's Encrypt จริง:
  - เปลี่ยนใน `Caddyfile`: `https://signage.company.com` + **ลบ** `tls internal`
  - Caddy ขอใบรับรองจริงให้อัตโนมัติ — **ไม่ต้องติดตั้ง CA ที่จอเลย** (ดีที่สุด)
