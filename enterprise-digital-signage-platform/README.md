# NextGen Digital Signage Platform

ระบบ Smart School Communication Platform สำหรับควบคุมและแสดงผลสื่อดิจิทัลบนจอหลายจอพร้อมกัน  
รองรับ Realtime WebSocket, Emergency Override, Offline-First, และ Multi-Zone Layout

---

## 📋 สารบัญ

- [ภาพรวมระบบ](#ภาพรวมระบบ)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [เอกสารเพิ่มเติม](#เอกสารเพิ่มเติม)

---

## ภาพรวมระบบ

```
[ Admin Panel (CMS) ]
        │ WebSocket + REST API
        ▼
[ Express Server (server.ts) ]
        │
        ├── PostgreSQL (ข้อมูลถาวร)
        ├── WebSocket Hub (realtime)
        └── Vite Dev Middleware / Static Serve

[ Player App Engine ]
    ├── Smart Layout Engine
    ├── Priority Scheduler
    ├── Emergency Override
    └── Offline Cache (IndexedDB)
```

**3 View Modes:**
| Mode | คำอธิบาย |
|------|-----------|
| `admin` | CMS จัดการระบบทั้งหมด |
| `player` | จำลองจอแสดงผล |
| `simulator` | Admin + Player คู่กัน |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.x |
| Build Tool | Vite | 6.x |
| State | Zustand | 5.x |
| Styling | Tailwind CSS | 4.x |
| Animation | Motion (Framer) | 12.x |
| Icons | Lucide React | 0.546.x |
| QR Code | qrcode.react | 4.x |
| Backend | Express | 4.x |
| Realtime | ws (WebSocket) | 8.x |
| Database | PostgreSQL | 15 |
| Runtime | Node.js / Bun | 24.x / 1.3.x |
| Container | Docker + Compose | 29.x / v5 |
| Language | TypeScript | 5.8.x |

---

## Quick Start

### Prerequisites
- Docker Desktop ≥ 4.x
- Node.js ≥ 20 หรือ Bun ≥ 1.3
- PostgreSQL (ผ่าน Docker)

### 1. Clone & Setup
```bash
cd "enterprise-digital-signage-platform"
cp .env.example .env.local
# แก้ไข .env.local ตามค่าของระบบ
```

### 2. รัน Development (Docker)
```bash
docker compose -f docker-compose.dev.yml up -d
```

### 3. รัน Development (Local)
```bash
bun install
bun run dev
# หรือ
npm install
npm run dev
```

### 4. เปิดเบราว์เซอร์
```
http://localhost:3100
```

### 5. Production Build
```bash
docker compose up -d --build
```

---

## โครงสร้างโปรเจกต์

```
enterprise-digital-signage-platform/
├── src/
│   ├── App.tsx                    # Root component (3 view modes)
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Global styles + Tailwind
│   ├── types/
│   │   └── signage.ts             # TypeScript interfaces ทั้งหมด
│   ├── store/
│   │   └── useSignageStore.ts     # Zustand global state
│   ├── data/
│   │   └── initialData.ts         # Seed data (dev/demo)
│   └── components/
│       ├── Navbar.tsx
│       ├── EmergencyBanner.tsx
│       ├── EmergencyModal.tsx
│       ├── admin/                 # Admin Panel modules
│       │   ├── ScreensManager.tsx
│       │   ├── SmartLayoutBuilder.tsx
│       │   ├── MediaLibrary.tsx
│       │   ├── PlaylistEditor.tsx
│       │   ├── SchedulerEngine.tsx
│       │   ├── RealtimeControlConsole.tsx
│       │   └── AnalyticsTelemetry.tsx
│       ├── player/                # Player Engine
│       │   ├── PlayerApp.tsx
│       │   └── PairingQRCode.tsx
│       └── simulator/
│           └── DualSimulator.tsx
├── server.ts                      # Express + WebSocket server
├── docs/                          # เอกสารโปรเจกต์ทั้งหมด
│   ├── environment.md
│   ├── database.md
│   ├── development-guide.md
│   ├── docker-guide.md
│   ├── api-reference.md
│   └── decisions/                 # Architecture Decision Records
├── .kiro/specs/                   # Spec files (Requirements/Design/Architecture)
├── docker-compose.yml             # Production
├── docker-compose.dev.yml         # Development
├── Dockerfile
├── .env.example
├── CHANGELOG.md
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## เอกสารเพิ่มเติม

| ไฟล์ | เนื้อหา |
|------|---------|
| [docs/environment.md](docs/environment.md) | Environment variables, ports, dependencies |
| [docs/database.md](docs/database.md) | Schema, migrations, conventions |
| [docs/development-guide.md](docs/development-guide.md) | Workflow, coding standards, git |
| [docs/docker-guide.md](docs/docker-guide.md) | Docker setup, deploy, troubleshoot |
| [docs/api-reference.md](docs/api-reference.md) | REST API + WebSocket reference |
| [CHANGELOG.md](CHANGELOG.md) | ประวัติการเปลี่ยนแปลง |
| [.kiro/specs/](../.kiro/specs/nextgen-digital-signage/) | Requirements, Design, Architecture, Tasks |

---

## ⚠️ สิ่งสำคัญที่ต้องรู้

1. **Port 3000 ถูกใช้งานแล้ว** โดย `thaihua-auth-service` — ใช้ port `3100` แทน
2. **PostgreSQL ที่มีอยู่:** `thaihua-postgres:5432` — สร้าง database `signage_db` แยกไว้
3. **Network:** ใช้ `thaihua-network` เชื่อมกับ services อื่นได้
4. **ห้ามแก้ไข** `thaihua-postgres` password หรือ config โดยตรง
