# 📺 NextGen Digital Signage — Android TV Player

แอปเพลเยอร์สำหรับติดตั้งบน Android TV / TV Box เพื่อแสดงผลสื่อดิจิทัลจากระบบ NextGen Digital Signage Platform

---

## ✨ คุณสมบัติหลัก

| Feature | รายละเอียด |
|---------|------------|
| **Online Mode** | เชื่อมต่อ server แสดงผล realtime ผ่าน WebView + WebSocket |
| **Offline Mode** | เล่นสื่อจาก cache ได้แม้ไม่มีเน็ต (NFR-02) |
| **Delta Sync** | เมื่อเน็ตกลับมา sync เฉพาะไฟล์ที่เปลี่ยน ไม่โหลดใหม่ทั้งหมด |
| **Kiosk Mode** | ป้องกันผู้ใช้ออกจากแอป (Lock Task / block HOME key) |
| **Auto Boot** | เปิดแอปอัตโนมัติเมื่อ TV เปิดเครื่อง |
| **Memory Management** | A/B Video Buffering + GPU cleanup (NFR-03) |
| **QR Pairing** | จับคู่จอผ่าน Pairing Code จาก Admin panel |
| **Fullscreen Immersive** | ซ่อน system bars, FLAG_KEEP_SCREEN_ON |

---

## 📋 System Requirements

- Android TV / TV Box: **Android 5.0+ (API 21+)**
- RAM: **1GB+** (แนะนำ 2GB)
- Storage: **500MB+** free สำหรับ media cache
- Network: WiFi หรือ Ethernet (สำหรับ initial pairing)
- Server: NextGen Digital Signage Platform running on network

---

## 🏗️ Build APK

### Prerequisites

1. **Android Studio** Arctic Fox หรือใหม่กว่า (หรือ command-line SDK)
2. **JDK 17**
3. **Android SDK** (API 34 + Build Tools)

### Build Steps

```bash
# 1. เข้าไปที่โฟลเดอร์โปรเจกต์
cd enterprise-digital-signage-platform/android-player

# 2. Build debug APK
./gradlew assembleDebug

# Output: app/build/outputs/apk/debug/app-debug.apk

# 3. Build release APK (signed)
./gradlew assembleRelease

# Output: app/build/outputs/apk/release/app-release.apk
```

### Build บน Windows (ไม่มี Android Studio)

```powershell
# ติดตั้ง Android Command Line Tools
# https://developer.android.com/studio#command-tools

# Set environment variables
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\cmdline-tools\latest\bin"
$env:PATH += ";$env:ANDROID_HOME\platform-tools"

# Accept licenses
sdkmanager --licenses

# Install required SDK packages
sdkmanager "platforms;android-34" "build-tools;34.0.0"

# Build
cd enterprise-digital-signage-platform\android-player
.\gradlew.bat assembleDebug
```

---

## 📱 Installation

### วิธีที่ 1: ADB Install (แนะนำ)

```bash
# เปิด USB Debugging บน TV (Settings → Developer Options → USB Debugging)
# เชื่อม TV กับคอมพิวเตอร์ผ่าน USB หรือ WiFi ADB

# ติดตั้ง
adb install -r app-debug.apk

# หรือติดตั้งผ่าน WiFi (ต้อง pair ก่อน)
adb connect 192.168.1.XX:5555
adb install -r app-debug.apk
```

### วิธีที่ 2: USB Drive

1. คัดลอก `app-debug.apk` ลง USB drive
2. เสียบ USB drive เข้า Android TV
3. ใช้ File Manager app เปิดไฟล์ `.apk`
4. อนุญาต "Install from unknown sources"
5. ติดตั้ง

### วิธีที่ 3: Sideload ผ่าน Network

```bash
# ใช้ adb over network
adb connect <TV_IP>:5555
adb install app-debug.apk
```

---

## ⚙️ การตั้งค่า (Initial Setup)

### Step 1: เปิดแอป

แอปจะเปิดหน้า **Settings** อัตโนมัติตอนเปิดครั้งแรก

### Step 2: ตั้ง Server URL

```
Server URL: http://192.168.1.100:3100      (โหมด HTTP)
Server URL: https://10.70.0.1              (โหมด HTTPS)
```

กรอก IP ของเครื่องที่รัน NextGen Digital Signage Server + port 3100

> ### 🔒 HTTPS (โหมด B) — ไม่ต้องติดตั้ง CA ที่จอ!
> แอปฝัง Caddy root CA ไว้ในตัว (`res/raw/caddy_root_ca.crt` + `network_security_config.xml`)
> → WebView/OkHttp trust ให้อัตโนมัติ **ไม่มีขั้นตอน Settings → CA certificates เลย**
>
> ⚠️ ถ้า CA บน server เปลี่ยน (รัน `install-caddy.bat` ที่สร้าง CA ใหม่) → ต้องอัปเดต
> `res/raw/caddy_root_ca.crt` แล้ว build APK ใหม่ (ดู Workflow ด้านล่าง)
>
> **งานเมื่อ CA เปลี่ยน:**
> ```bash
> # 1. ดึง CA ปัจจุบันจาก server
> cp "//10.70.0.1/c/signage/caddy/caddy-root-ca.crt" \
>    app/src/main/res/raw/caddy_root_ca.crt
> # 2. build APK ใหม่
> ./gradlew assembleRelease
> ```

### Step 3: Test Connection

กดปุ่ม **Test Connection** เพื่อตรวจสอบว่าเชื่อมต่อ server ได้

### Step 4: Save & Launch

กดปุ่ม **Save & Launch Player** → แอปจะเปิดหน้า Pairing

### Step 5: Pair Display

1. ในหน้า Admin panel (บนคอม) → ไปที่ **Screens** → เลือกจอ → ดู **Pairing Code**
2. บน TV → กรอก Pairing Code (เช่น `LOBBY-88`)
3. กด **Connect Display**
4. เมื่อ pair สำเร็จ จะ redirect ไปหน้า Display อัตโนมัติ

---

## 🔒 Kiosk Mode (Lock Task)

### เปิด Kiosk Mode แบบเต็ม (ต้องใช้ ADB)

```bash
# ตั้ง app เป็น Device Owner
adb shell dpm set-device-owner com.signage.player/.receiver.SignageDeviceAdmin

# แอปจะสามารถเข้า Lock Task mode ได้ ซึ่ง:
# - ปิดปุ่ม HOME
# - ปิด Recent Apps
# - ปิด Status Bar pull-down
# - ล็อคจอไว้ที่แอปนี้เท่านั้น
```

### ออกจาก Kiosk Mode (Secret Escape)

- กดปุ่ม **MENU** หรือ **SETTINGS** บนรีโมท → เปิดหน้า Settings
- หรือ ADB: `adb shell am start -n com.signage.player/.SettingsActivity`

### ปิด Device Owner

```bash
adb shell dpm remove-active-admin com.signage.player/.receiver.SignageDeviceAdmin
```

---

## 🌐 Online / Offline / Sync Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ONLINE MODE (ปกติ)                         │
│                                                               │
│  WebView → Server URL → /display/:id?token=xxx               │
│  Data refresh: ทุก 30 วินาที                                  │
│  WebSocket: Realtime commands, Emergency alerts               │
│  Background: OfflineCacheService download media → local       │
└─────────────────────────────────────────────────────────────┘
         │                                    ▲
         ▼ (เน็ตหลุด)                        │ (เน็ตกลับ)
┌─────────────────────────────────────────────────────────────┐
│                    OFFLINE MODE                               │
│                                                               │
│  WebView: LOAD_CACHE_ELSE_NETWORK (ใช้ cached HTML/JS)       │
│  Media: เล่นจาก /data/data/.../signage_media/ (local files)  │
│  Status: แสดง "● Offline — Playing cached content"           │
│  NativeBridge: getCachedMediaUrl(id) → file:// path          │
└─────────────────────────────────────────────────────────────┘
         │
         ▼ (เน็ตกลับ)
┌─────────────────────────────────────────────────────────────┐
│                    DELTA SYNC                                 │
│                                                               │
│  1. NetworkReceiver ตรวจจับ connectivity restored             │
│  2. Start OfflineCacheService                                │
│  3. GET /api/display/:id/data → รับ media list               │
│  4. เทียบกับ manifest.json (local) → หา diff                 │
│  5. Download เฉพาะไฟล์ใหม่/เปลี่ยน                           │
│  6. ลบไฟล์ที่ไม่อยู่ใน playlist แล้ว                           │
│  7. Update manifest.json                                      │
│  8. Reload WebView → แสดงเนื้อหาล่าสุด                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 Memory Management (NFR-03)

### A/B Video Buffering

```
┌──────────────────────────────────────┐
│  Video Element A: กำลังเล่น (visible)  │
│  opacity: 1                            │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│  Video Element B: preload ต่อไป       │
│  opacity: 0 (ซ่อน, กำลังโหลด)        │
└──────────────────────────────────────┘

เมื่อ A เล่นจบ → swap:
  B.opacity = 1 (แสดง)
  A.pause(); A.removeAttribute('src'); A.load();  // GPU release
  A เริ่ม preload item ถัดไป
```

### JavaScript Bridge Methods

```javascript
// ก่อน destroy video
SignageNative.onVideoDestroy('video-a');

// แจ้ง buffer swap
SignageNative.onBufferSwap('B', '/uploads/next-video.mp4');

// รายงาน memory
SignageNative.reportMemoryUsage(usedMB, totalMB);

// ดึง cached media URL (offline)
const localUrl = SignageNative.getCachedMediaUrl('med-001');
```

---

## 📁 Project Structure

```
android-player/
├── build.gradle                    # Root build config
├── settings.gradle                 # Module settings
├── gradle.properties               # JVM & AndroidX config
├── gradle/wrapper/
│   └── gradle-wrapper.properties   # Gradle 8.5
├── app/
│   ├── build.gradle                # App build (API 21-34, Kotlin)
│   ├── proguard-rules.pro          # Minification rules
│   └── src/main/
│       ├── AndroidManifest.xml     # TV manifest + permissions
│       ├── java/com/signage/player/
│       │   ├── MainActivity.kt         # WebView kiosk + immersive
│       │   ├── SettingsActivity.kt     # Server URL config
│       │   ├── bridge/
│       │   │   └── NativeBridge.kt     # JS ↔ Native bridge
│       │   ├── receiver/
│       │   │   ├── BootReceiver.kt     # Auto-start on boot
│       │   │   ├── NetworkReceiver.kt  # Online/offline detection
│       │   │   └── SignageDeviceAdmin.kt # Lock Task kiosk
│       │   └── service/
│       │       └── OfflineCacheService.kt # Delta sync + download
│       └── res/
│           ├── layout/activity_settings.xml
│           ├── values/ (colors, styles, strings)
│           └── xml/device_admin.xml
```

---

## 🔧 Troubleshooting

| ปัญหา | วิธีแก้ |
|--------|---------|
| แอปไม่เปิดหลัง boot | ตรวจสอบว่า Server URL ถูกตั้งค่าแล้ว |
| เชื่อมต่อ server ไม่ได้ | ตรวจ IP/port, ทั้ง TV และ server ต้องอยู่ network เดียวกัน |
| หน้าจอดำหลัง pair | ตรวจว่า Display Token ไม่หมดอายุ (30 วัน), re-pair ถ้าจำเป็น |
| Media ไม่เล่นใน offline | ต้องเคยเปิดแอปใน online mode ก่อนอย่างน้อย 1 ครั้ง เพื่อ cache |
| Video กระตุก/lag | ตรวจ RAM (ต้อง >1GB free), หรือลด resolution ของ media |
| ออกจาก kiosk ไม่ได้ | กดปุ่ม MENU/SETTINGS บนรีโมท หรือใช้ ADB |

---

## 📡 API Endpoints ที่ Player ใช้

| Endpoint | Method | ใช้ทำอะไร |
|----------|--------|-----------|
| `/api/health` | GET | ทดสอบ connection |
| `/api/display/pair` | POST | Pairing ด้วย code |
| `/api/display/:id/data?token=xxx` | GET | ดึงข้อมูล layout + media |
| `/ws?token=xxx` | WebSocket | Realtime commands |
| `/uploads/*` | GET | Download media files |

---

## 📄 License

Internal use only — NextGen Digital Signage Platform
