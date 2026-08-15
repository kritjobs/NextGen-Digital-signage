# Environment & Dependencies Reference

อัปเดตล่าสุด: 2026-08-04  
ตรวจสอบโดย: Kiro AI

---

## 1. สภาพแวดล้อมเครื่อง Host (ณ วันที่ตรวจสอบ)

| รายการ | เวอร์ชัน | สถานะ |
|--------|---------|--------|
| OS | Windows (win32) | ✅ |
| Docker Desktop | 29.4.0 | ✅ |
| Docker Compose | v5.1.1 | ✅ |
| Node.js | v24.11.1 | ✅ |
| Bun | v1.3.11 | ✅ |
| PostgreSQL (container) | 15-alpine | ✅ รันอยู่ |
| Redis (container) | 7-alpine | ✅ รันอยู่ |

---

## 2. Port Map — ระบบทั้งหมดบนเครื่องนี้

### ⚠️ Ports ที่ถูกใช้งานแล้ว (ห้ามใช้ซ้ำ)

| Port | Container/Service | หมายเหตุ |
|------|-------------------|---------|
| **80** | `thaihua-nginx` | HTTP reverse proxy |
| **443** | `thaihua-nginx` | HTTPS |
| **3000** | `thaihua-auth-service` | ❌ ชน — ห้ามใช้ |
| **3002** | `thaihua-budget-service` | |
| **3003** | `thaihua-hr-service` | |
| **3004** | `thaihua-student-info-service` | |
| **3005** | `thaihua-student-affairs-service` | |
| **3006** | `thaihua-academic-service` | |
| **3007** | `thaihua-library-service` | |
| **3010** | `ai-scheduling-service` | |
| **3011** | `thaihua-master-data-service` | |
| **3020** | `thaihua-mobile-api-gateway` | |
| **5432** | `thaihua-postgres` | PostgreSQL หลัก |
| **6379** | `thaihua-redis` | Redis หลัก |
| **18793–18795** | `thaihua-openclaw-gateway-2` | |

### ✅ Ports ที่จัดสรรสำหรับ Digital Signage

| Port | ใช้สำหรับ | กำหนดใน |
|------|----------|---------|
| **3100** | Signage App (Express + Vite) | `APP_PORT=3100` |
| **3101** | WebSocket (ถ้าแยก port) | `WS_PORT=3101` |
| **5433** | Signage PostgreSQL (ถ้าแยก container) | Option B เท่านั้น |

---

## 3. Environment Variables

### 3.1 ไฟล์ที่ต้องสร้าง: `.env.local`

```bash
# คัดลอกจาก .env.example แล้วแก้ไข
cp .env.example .env.local
```

### 3.2 ตารางตัวแปรทั้งหมด

| Variable | Required | Default | คำอธิบาย |
|----------|----------|---------|----------|
| `NODE_ENV` | ✅ | `development` | `development` / `production` |
| `APP_PORT` | ✅ | `3100` | Port ของ Express server |
| `WS_PATH` | | `/ws` | WebSocket endpoint path |
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `POSTGRES_HOST` | ✅ | `thaihua-postgres` | ชื่อ container หรือ hostname |
| `POSTGRES_PORT` | ✅ | `5432` | PostgreSQL port |
| `POSTGRES_DB` | ✅ | `signage_db` | ชื่อ database |
| `POSTGRES_USER` | ✅ | `postgres` | DB username |
| `POSTGRES_PASSWORD` | ✅ | — | ❌ ห้าม commit ค่าจริง |
| `REDIS_URL` | | `redis://thaihua-redis:6379` | Redis connection (optional) |
| `GEMINI_API_KEY` | | — | Google Gemini AI (optional feature) |
| `APP_URL` | | `http://localhost:3100` | Base URL ของแอป |
| `JWT_SECRET` | | — | สำหรับ Auth (future) |
| `DISABLE_HMR` | | `false` | ตั้งเป็น `true` ใน CI/agent |

### 3.3 ตัวอย่างค่า `.env.local` (Development)

```bash
NODE_ENV=development
APP_PORT=3100
WS_PATH=/ws

# PostgreSQL — ใช้ thaihua-postgres ที่รันอยู่แล้ว
DATABASE_URL=postgresql://postgres:postgres@thaihua-postgres:5432/signage_db
POSTGRES_HOST=thaihua-postgres
POSTGRES_PORT=5432
POSTGRES_DB=signage_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Redis — ใช้ thaihua-redis ที่รันอยู่แล้ว
REDIS_URL=redis://thaihua-redis:6379

APP_URL=http://localhost:3100
```

> **⚠️ หมายเหตุ:** ค่า password ด้านบนเป็นค่า default ของ `thaihua-postgres`  
> ในระบบ production ต้องใช้ password ที่แข็งแกร่งกว่านี้

---

## 4. Docker Networks

### Network ที่มีอยู่

| Network | Driver | ใช้สำหรับ |
|---------|--------|---------|
| `thaihua-network` | bridge | services หลักของ thaihua-smart-school |
| `thaihua-smart-school_thaihua-network` | bridge | Compose-managed network |

### การเชื่อมต่อ Signage กับ Network

```yaml
# ใน docker-compose.yml ของ signage
networks:
  thaihua-network:
    external: true  # เชื่อมกับ network ที่มีอยู่แล้ว
```

เมื่อเชื่อมแล้ว signage-app จะ resolve ชื่อ container ได้:
- `thaihua-postgres` → PostgreSQL
- `thaihua-redis` → Redis
- `thaihua-auth-service` → Auth (future integration)

---

## 5. Node.js / Bun Dependencies

### Production Dependencies

| Package | Version | ใช้สำหรับ |
|---------|---------|---------|
| `react` | ^19.0.1 | UI framework |
| `react-dom` | ^19.0.1 | DOM rendering |
| `zustand` | ^5.0.14 | Global state management |
| `lucide-react` | ^0.546.0 | Icons |
| `motion` | ^12.23.24 | Animations (Framer Motion) |
| `qrcode.react` | ^4.2.0 | QR Code generation |
| `express` | ^4.21.2 | HTTP server |
| `ws` | ^8.21.2 | WebSocket server |
| `dotenv` | ^17.2.3 | Environment variables |
| `@google/genai` | ^2.4.0 | Gemini AI (optional) |
| `@tailwindcss/vite` | ^4.1.14 | Tailwind CSS v4 |
| `vite` | ^6.2.3 | Build tool |

### Dev Dependencies

| Package | Version | ใช้สำหรับ |
|---------|---------|---------|
| `typescript` | ~5.8.2 | Type checking |
| `tsx` | ^4.21.0 | Run TypeScript directly |
| `esbuild` | ^0.25.0 | Bundle server.ts |
| `@vitejs/plugin-react` | ^5.0.4 | React plugin for Vite |
| `tailwindcss` | ^4.1.14 | CSS framework |
| `autoprefixer` | ^10.4.21 | CSS autoprefixer |
| `@types/express` | ^4.17.21 | Express types |
| `@types/ws` | ^8.18.1 | WebSocket types |
| `@types/node` | ^22.14.0 | Node.js types |

### Dependencies ที่ต้องเพิ่ม (ยังไม่มีใน package.json)

| Package | เหตุผล | Priority |
|---------|--------|---------|
| `pg` | PostgreSQL client | 🔴 จำเป็น |
| `@types/pg` | Types for pg | 🔴 จำเป็น |
| `drizzle-orm` | ORM (แนะนำ) หรือ `prisma` | 🔴 จำเป็น |
| `drizzle-kit` | Migration CLI | 🔴 จำเป็น |
| `multer` | File upload | 🟡 แนะนำ |
| `@types/multer` | Types for multer | 🟡 แนะนำ |
| `ioredis` | Redis client | 🟡 แนะนำ |
| `jsonwebtoken` | JWT auth | 🟡 แนะนำ |
| `bcryptjs` | Password hashing | 🟡 แนะนำ |
| `zod` | Input validation | 🟡 แนะนำ |
| `morgan` | HTTP request logging | 🟢 เสริม |
| `helmet` | Security headers | 🟢 เสริม |
| `cors` | CORS middleware | 🟢 เสริม |

```bash
# ติดตั้ง dependencies จำเป็น
bun add pg drizzle-orm
bun add -d @types/pg drizzle-kit

# แนะนำเพิ่มเติม
bun add multer ioredis zod helmet cors morgan
bun add -d @types/multer
```

---

## 6. PostgreSQL ที่มีอยู่ — รายละเอียด

| รายการ | ค่า |
|--------|-----|
| Container name | `thaihua-postgres` |
| Image | `postgres:15-alpine` |
| Host port | `5432` |
| Default user | `postgres` |
| Default password | `postgres` |
| Default DB | `thaihua_schooldb` |
| Data volume | `thaihua-smart-school_postgres_data` |
| Backup path | `/backups` (host: `C:/TSMS/thaihua-smart-school/backups`) |

### Databases ที่มีอยู่แล้ว

| Database | เจ้าของ |
|----------|--------|
| `thaihua_schooldb` | thaihua-smart-school services |
| `ai_scheduling_dev` | ai-scheduling-service |
| `postgres` | system |

### Database สำหรับ Signage

```sql
-- สร้าง database ใหม่ (ทำครั้งเดียว)
CREATE DATABASE signage_db
  WITH OWNER = postgres
  ENCODING = 'UTF8'
  LC_COLLATE = 'C'
  LC_CTYPE = 'C';

-- สร้าง user แยก (แนะนำสำหรับ security)
CREATE USER signage_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE signage_db TO signage_user;
```

---

## 7. การตรวจสอบสุขภาพ Services

```bash
# ตรวจสอบ containers ที่รันอยู่
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# ทดสอบ PostgreSQL connection
docker exec thaihua-postgres psql -U postgres -c "\l"

# ทดสอบ Redis
docker exec thaihua-redis redis-cli ping

# ตรวจสอบ network
docker network inspect thaihua-network

# ดู logs ของ signage app
docker logs signage-app --tail 50 -f
```

---

## 8. Scripts ใน package.json

| Script | คำสั่ง | ใช้สำหรับ |
|--------|--------|---------|
| `dev` | `tsx server.ts` | Development server |
| `build` | `vite build && esbuild server.ts ...` | Production build |
| `start` | `node dist/server.cjs` | Production run |
| `preview` | `vite preview` | Preview build |
| `clean` | `rm -rf dist server.js` | ล้าง build |
| `lint` | `tsc --noEmit` | Type check |

### Scripts ที่ควรเพิ่ม

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/db/seed.ts",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write ."
  }
}
```
