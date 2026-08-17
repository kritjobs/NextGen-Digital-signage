# 📺 NextGen Signage Player — webOS (LG TV)

Kiosk player สำหรับ LG webOS TV (webOS 24 / 9.x) เพื่อแสดงผล Digital Signage จาก **NextGen Digital Signage Platform**

> คู่กันกับ `android-player/` — โปรเจกต์นี้เป็นฝั่ง **webOS** (ติดตั้งได้เฉพาะทีวี LG webOS)
> ไม่สามารถลง `.apk` บน webOS ได้ ต้องใช้แอปนี้ (web app แพ็กเป็น `.ipk`)

---

## 🏗️ สถาปัตยกรรม

```
┌─────────────────────────────────────────────────────────────┐
│  webos-player/ (แอป webOS — ตัว "เปลือก" kiosk)               │
│                                                              │
│  Settings (Server URL) → Pairing (code) → Kiosk              │
│                                                 │            │
│    iframe เต็มจอ  ◄────────────────────────────┘            │
│      └─ {server}/display/{screenId}?token=xxx               │
│           ↑  หน้าแสดงผลจริง (React ของ server)              │
└─────────────────────────────────────────────────────────────┘
```

- **ตัวเพลเยอร์จริงคือเว็บแอปของ server** (`/display/:id` — `DisplayKiosk.tsx`) ซึ่ง render วิดีโอ/รูป/widget/HLS ทั้งหมด
- **แอป webOS เป็นแค่ "เปลือก"** ที่เปิดหน้านั้นใน iframe เต็มจอ + จัดการ pairing, รีโหลดเมื่อเน็ตกลับ, เมนู kiosk
- เพราะเป็น web app → **ไม่ต้อง compile Kotlin/Java** เหมือนฝั่ง Android

### โครงสร้างไฟล์

```
webos-player/
├── appinfo.json              # เมตาดาตาของ webOS app (id, icon, ...)
├── index.html                # 3 หน้า: settings / pairing / kiosk
├── css/style.css
├── js/
│   ├── app.js                # shell logic: config, pairing, iframe, network monitor, เมนู
│   └── webos.js              # PalmSystem.stageReady + กัน screensaver (best-effort)
├── icon.png / largeIcon.png  # สร้างจาก scripts/make-icons.js
├── scripts/
│   ├── make-icons.js         # regenerate icons (pure Node, ไม่มี dependency)
│   └── autostart-root.sh     # (optional) auto-start หลัง boot — ต้อง root
└── README.md
```

---

## ✅ สิ่งที่ต้องเตรียม

| ของ | รายละเอียด |
|---|---|
| จอ LG webOS | webOS 24 (9.x) ขึ้นไป — รองรับ Developer Mode |
| LG Developer account | สมัครฟรีที่ https://webostv.developer.lge.com |
| แอป **Developer Mode** บนจอ | ติดตั้งจาก LG Content Store (ค้นหา "Developer Mode") |
| คอมฯ | **webOS Dev Manager** ([dev-manager-desktop](https://github.com/webosbrew/dev-manager-desktop)) หรือ **webOS TV SDK CLI** (`ares` tools) |

---

## 🔧 ตั้งค่า Developer Mode บนจอ (ครั้งเดียว)

1. เปิด **LG Content Store** บนทีวี → ค้นหา **Developer Mode** → ติดตั้ง
2. เปิดแอป Developer Mode → ล็อกอินด้วย LG developer account
3. กดเปิด **Dev Mode Status: ON** → จอจะรีบูต
4. หลังรีบูต เปิดแอป Developer Mode อีกครั้ง → จะเห็น **IP ของทีวี** และ **Passphrase** (ใช้สำหรับ Dev Manager)
5. **แอปที่ติดตั้งผ่าน Dev Mode จะอยู่ได้ตราบที่ Dev Mode ยัง ON** — ถ้าปิด/หมดอายุ (~1,000 ชม.) แอปจะถูกลบ ต้องต่ออายุผ่านแอป

---

## 📦 Build `.ipk`

### วิธี A — webOS Dev Manager (ไม่ต้องติดตั้ง SDK เลย)

1. เปิด **webOS Dev Manager** บนคอมฯ
2. **Devices → +** → ใส่ IP ทีวี + Passphrase (จากข้อ 4 ข้างบน) → Connect
3. **Apps → Install app…** → เลือกไฟล์ `.ipk` (ถ้ายังไม่มี ให้ build ตามวิธี B หรือโหลดจากทีม)

### วิธี B — webOS TV SDK CLI (สร้าง .ipk เอง)

```bash
# 1. ติดตั้ง CLI (ครั้งเดียว)
npm install -g @webos-tools/cli

# 2. เข้าไปในโฟลเดอร์แอป
cd enterprise-digital-signage-platform/webos-player

# 3. แพ็กเป็น .ipk (ต้องมี appinfo.json อยู่ที่ root ของโฟลเดอร์)
ares-package .

# ผลลัพธ์: com.nextgen.webos-player_1.0.0_all.ipk
```

### ติดตั้งลงทีวี

```bash
# ผ่าน CLI (ต้อง add device ก่อน: ares-setup-device)
ares-install --device <ชื่อเครื่องที่ตั้งไว้> com.nextgen.webos-player_1.0.0_all.ipk

# หรือเปิดผ่าน Dev Manager UI: Apps → Install app… → เลือกไฟล์ .ipk
```

---

## 🚀 ตั้งค่าครั้งแรก (บนจอ)

1. เปิดแอป **NextGen Signage Player** จากหน้า Home (My Apps)
2. หน้า Settings → กรอก **Server URL** เช่น `http://192.168.1.100:3100` → กด **ทดสอบการเชื่อมต่อ** → ควรได้ "เชื่อมต่อสำเร็จ"
3. กด **บันทึกและไปต่อ** → หน้า Pairing
4. หา **Pairing Code** จาก Admin panel → **Screens** → เลือกจอ
5. กรอก code → **เชื่อมต่อจอ** → จอจะเข้าสู่หน้าแสดงผลเต็มจออัตโนมัติ
6. ครั้งต่อไปเปิดแอป → เข้า kiosk ตรงๆ เลย (จำ token ไว้แล้ว)

**เมนู kiosk:** กดปุ่ม **Red (สีแดง)** หรือ **Back** บนรีโมท → เมนู: รีโหลด / จับคู่ใหม่ / เปลี่ยน server / ออกจากแอป

---

## 🔌 ข้อกำหนดฝั่ง server (แก้แล้วใน `server.ts`)

หน้า `/display` ต้องถูกฝังใน iframe ได้ — helmet ตั้ง `X-Frame-Options: SAMEORIGIN` อยู่โดย default ซึ่งจะบล็อก iframe ข้าม origin
→ เพิ่ม middleware ยกเลิก header เฉพาะเส้นทาง `/display*` และ `/pair*`:

```ts
app.use((req, res, next) => {
  if (req.path.startsWith('/display') || req.path.startsWith('/pair')) {
    res.removeHeader('X-Frame-Options');
  }
  next();
});
```

> ข้อควรระวัง: การเปิด iframe หมายถึงเว็บอื่นก็ฝังหน้า display ได้ (framing) — สำหรับ internal network
> ที่เปิด CORS อยู่แล้วถือว่ารับได้ แต่ถ้าจะเอา public ควรเปลี่ยนเป็น allowlist origin แทน

---

## ⏻ เปิดแอปอัตโนมัติตอน boot

### จอ consumer (webOS ปกติ) — ต้อง root

webOS consumer **ไม่มี** วิธีตั้ง auto-launch app โดยไม่ root (ต่างจาก Android ที่มี `BootReceiver`)
ถ้า root ผ่าน [webOS Homebrew](https://www.webosbrew.org/) แล้ว:

```bash
# สร้าง /var/lib/webosbrew/init.d/S90-signage.sh แล้วให้ execute
cat > /var/lib/webosbrew/init.d/S90-signage.sh <<'EOF'
#!/bin/sh
sleep 20
luna-send -n 1 -f luna://com.webos.applicationManager/launch '{"id":"com.nextgen.webos-player"}'
EOF
chmod +x /var/lib/webosbrew/init.d/S90-signage.sh
```

### จอ commercial (รุ่น enterprise/Signage)

ใช้โหมด **SI / SuperSign** ของ LG ได้เลย — ตั้ง auto-launch + schedule ได้โดยไม่ต้องเขียนแอป
(ดู `docs/` ของ platform สำหรับรุ่นที่รองรับ)

### ไม่ root

ต้องเปิดแอปด้วยรีโมทหลังเปิดทีวีทุกครั้ง (หรือตั้งจอให้ไม่ดับ/ไม่ปิดเครื่อง)

---

## 😴 Screensaver / จอหลับ (ข้อเท็จจริงจาก LG — webOS 6.0+)

| เรื่อง | สถานะ |
|---|---|
| ปิด screensaver ผ่าน Settings | ❌ **ไม่มี option แล้ว** (webOS 6.0+ ยกเลิก) |
| `navigator.wakeLock` | ❌ **ไม่รองรับ** บน webOS (request ค้างตลอด) |
| เล่นวิดีโอเต็มจอ | ✅ **กัน screensaver ได้** (LG ยืนยัน — screensaver จะไม่ทำงานตอนเล่นวิดีโอเต็มจอ) |
| `registerScreenSaverRequest` (tvpower) | ⚠️ undocumented API — กันได้จริง แต่**ต้อง root**/homebrew permission |
| จอ commercial (SI mode) | ✅ ปิดได้จากโหมด signage |

`js/webos.js` พยายาม register `registerScreenSaverRequest` ให้อัตโนมัติ (fail เงียบๆ ถ้าไม่มี permission)
**แนวทางที่แนะนำ:** เพลย์ลิสต์ที่ส่งไปจอควรมีคลิปวิดีโอเต็มจออย่างน้อย 1 ตัว — ทั้งกัน screensaver และดูมีชีวิตชีวา
สำหรับ layout ที่เป็นภาพนิ่งล้วนบนจอ consumer ที่ไม่ root อาจเจอ screensaver เข้ามาแทรก (โดยเฉพาะ OLED)

---

## 📊 เทียบกับ Android Player

| ความสามารถ | Android (`android-player/`) | webOS (โปรเจกต์นี้) |
|---|---|---|
| แสดงผล layout/media/widgets | WebView → `/display/:id` | iframe → `/display/:id` (เหมือนกัน) |
| HLS / mp4 / webm | ExoPlayer / WebView | browser webOS (decode ฮาร์ดแวร์ H.264/HEVC/VP9 ให้เอง) |
| Pairing ด้วย code | ✅ | ✅ (API เดียวกัน) |
| Offline cache | Native service + delta sync | ฝั่งเว็บ (`DisplayKiosk` ใช้ Cache API อยู่แล้ว) |
| Kiosk lock | Lock Task (device owner) | ⚠️ แค่ key-catcher + เมนู (ล็อคเต็มไม่ได้ถ้าไม่ root) |
| Auto boot | `BootReceiver` | ⚠️ ต้อง root (webosbrew) หรือจอ commercial |
| กัน screensaver | — (Android ไม่มีปัญหา) | ⚠️ วิดีโอเต็มจอเท่านั้น / root |

**สรุป:** ฟีเจอร์แสดงผลใช้โค้ดเว็บเดียวกัน 100% — ที่ต่างคือ "ความแข็งแรงของเปลือก" (kiosk/boot/offline native)
ซึ่งบน webOS ต้องพึ่ง root หรือจอ commercial ถ้าต้องการระดับเดียวกับ Android

---

## 🔧 Troubleshooting

| ปัญหา | วิธีแก้ |
|---|---|
| หน้า kiosk ว่าง/ขาว | เช็คว่า server เปิดอยู่ + URL ถูกต้อง + `X-Frame-Options` ถูกลบ (ดูหัวข้อ server ด้านบน) |
| `Failed to load resource` ใน iframe | ตรวจ token หมดอายุไหม (30 วัน) → เมนู → จับคู่ใหม่ |
| ใช้ HTTPS ที่เป็น self-signed (Caddy) | webOS browser ใช้ system trust store — **ต้องติดตั้ง CA บนทีวี** (Settings → General → Certificates ถ้ามี) หรือใช้ HTTP ใน LAN (ตาม README ของ Android) |
| Dev Mode หมดอายุ → แอปหาย | เปิดแอป Developer Mode → ต่ออายุ (Dev Mode มีเพดาน ~1,000 ชม. ต้องต่อเป็นระยะ) |
| จอเข้า screensaver บ่อย | เพิ่มคลิปเต็มจอในเพลย์ลิสต์ หรือ root แล้วใช้ `registerScreenSaverRequest` |
| แอปไม่เปิดเองหลัง boot | จอ consumer ต้อง root (ดูหัวข้อ auto-start) หรือกดเปิดด้วยรีโมท |
| พิมพ์ภาษาไทยใน input ไม่ได้ | webOS on-screen keyboard — ถ้าไม่ขึ้น ให้กดปุ่ม OK ค้างเพื่อสลับ keyboard |

---

## 🔄 Regenerate icons

```bash
cd enterprise-digital-signage-platform/webos-player
node scripts/make-icons.js   # → เขียนทับ icon.png + largeIcon.png
```

---

## 🧪 ทดสอบ shell บนเบราว์เซอร์ (ไม่ต้องมีจอจริง)

ใช้ mock server ที่จำลอง API ของ platform (ไม่เขียนข้อมูลจริง):

```bash
cd enterprise-digital-signage-platform/webos-player
node scripts/mock-test-server.mjs          # → http://localhost:4177
```

เปิด `http://localhost:4177` ในเบราว์เซอร์ → ทดสอบ flow: Settings → Pairing (code อะไรก็ได้) → Kiosk

> ⚠️ ถ้าจะเทสต์กับ server จริง (dev หรือ prod): pairing จะ**เขียน state จริง** ลง DB
> (จอขึ้น online + deviceInfo + heartbeat) และถ้าจอมี heartbeat สด (< 2 นาที) จะได้
> error `ALREADY_PAIRED (409)` — ต้องรอ heartbeat หมดอายุ หรือ unpair ใน Admin ก่อน
> และหน้า `/display` ต้องเปิด iframe ได้ (X-Frame-Options ถูกลบแล้วใน server.ts หลัง redeploy)
