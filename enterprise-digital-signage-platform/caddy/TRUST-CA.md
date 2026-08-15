# Trust Caddy Root CA (จำเป็นสำหรับ HTTPS บน LAN)

Caddy ใช้ `tls internal` ออก certificate เอง — เบราว์เซอร์/จอต้อง**เชื่อถือ CA** ของ Caddy ถึงจะใช้ HTTPS ได้แบบไม่มีคำเตือน และ **Service Worker ถึงจะทำงาน**

> ไฟล์ CA: `C:\signage\caddy\caddy-root-ca.crt` (export โดย install-caddy.bat)

---

## Windows (PC / จอที่รัน web player บน Windows)

1. เปิด `caddy-root-ca.crt` (double-click)
2. กด **Install Certificate…**
3. เลือก **Local Machine** → Next
4. เลือก **Place all certificates in the following store** → **Browse…** → เลือก **Trusted Root Certification Authorities** → OK → Next → Finish
5. Restart เบราว์เซอร์ แล้วเปิด `https://10.70.0.1` — ควรไม่มี warning

---

## Android TV / Android (จอ signage)

วิธีที่ 1 — ติดตั้ง CA (แนะนำ):
1. คัดลอก `caddy-root-ca.crt` ไปที่จอ (USB / ผ่านเครือข่าย)
2. ไปที่ **Settings → Security & restrictions → CA certificates → Install a CA certificate** (Android TV บางรุ่น: Settings → Security → Install from storage)
3. เลือกไฟล์ `.crt` → ยืนยัน
4. เปิด `https://10.70.0.1` — ไม่มี warning + SW ทำงาน

วิธีที่ 2 — ข้ามคำเตือนทีละเครื่อง (เร็ว แต่ต้องทำทุกครั้งที่เปิด browser ใหม่):
1. เปิด `https://10.70.0.1` → เบราว์เซอร์เตือน "Not secure"
2. กด **Advanced → Proceed to 10.70.0.1 (unsafe)**
3. หน้านั้น (แล้วก็ SW ที่ register หลังจากนี้) อยู่ใน secure context แล้ว — **SW ทำงานได้**

---

## Chrome / Edge บนเครื่องอื่นใน LAN
- ติดตั้ง CA แบบ Windows ข้างบน (Local Machine → Trusted Root) — ใช้ได้กับทุกเบราว์เซอร์

---

## ตรวจว่า HTTPS พร้อมใช้

```powershell
# บนเครื่อง prod
curl.exe -s https://10.70.0.1/api/health
# ควรได้ {"status":"ok",...}

# ตรวจว่า SW ถูกเสิร์ฟผ่าน HTTPS (จำเป็นสำหรับ offline)
curl.exe -s -o NUL -w "%{http_code} %{content_type}" https://10.70.0.1/sw.js
# ควรได้ 200 text/javascript
```

---

## ทางเลือกที่ดีกว่า (ถ้ามี domain)
- ถ้ามี domain สาธารณะ + DDNS (เช่น signage.company.com ชี้มาที่ 10.70.0.1) → ใช้ Let's Encrypt จริง:
  - เปลี่ยนใน `Caddyfile`: `https://signage.company.com` + **ลบ** `tls internal`
  - Caddy ขอใบรับรองจริงให้อัตโนมัติ — **ไม่ต้องติดตั้ง CA ที่จอเลย** (ดีที่สุด)
