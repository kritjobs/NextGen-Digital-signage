# Docker Guide — คู่มือ Docker & Deployment

อัปเดตล่าสุด: 2026-08-04

---

## 1. สถาปัตยกรรม Docker

```
┌─────────────────────────────────────────────────────────┐
│                  thaihua-network (bridge)                 │
│                                                           │
│  ┌─────────────────────┐   ┌─────────────────────────┐  │
│  │   signage-app        │   │   thaihua-postgres       │  │
│  │   port: 3100         │──▶│   port: 5432             │  │
│  │   (NEW container)    │   │   db: signage_db         │  │
│  └──────────┬──────────┘   └─────────────────────────┘  │
│             │                                             │
│             │               ┌─────────────────────────┐  │
│             └──────────────▶│   thaihua-redis          │  │
│                             │   port: 6379             │  │
│                             └─────────────────────────┘  │
│                                                           │
│  ┌─────────────────────┐                                 │
│  │   thaihua-nginx      │──▶ route /signage → :3100     │
│  │   port: 80/443       │                                │
│  └─────────────────────┘                                 │
└─────────────────────────────────────────────────────────┘
```

**Strategy:** ใช้ `thaihua-postgres` และ `thaihua-redis` ที่มีอยู่แล้ว สร้างเฉพาะ `signage-app` container ใหม่

---

## 2. ไฟล์ Docker ที่ต้องสร้าง

### 2.1 Dockerfile (Multi-stage)

```dockerfile
# Dockerfile

# ─── Stage 1: Build Frontend ─────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY package.json bun.lock* ./
RUN npm install

COPY . .
RUN npm run build
# สร้าง dist/ สำหรับ Vite + esbuild server bundle


# ─── Stage 2: Production Runtime ─────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# ติดตั้งเฉพาะ production dependencies
COPY package.json ./
RUN npm install --omit=dev

# คัดลอก build artifacts จาก stage 1
COPY --from=frontend-builder /app/dist ./dist

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:${APP_PORT:-3100}/api/health || exit 1

EXPOSE 3100

ENV NODE_ENV=production

CMD ["node", "dist/server.cjs"]
```

### 2.2 docker-compose.yml (Production)

```yaml
# docker-compose.yml
version: '3.8'

services:
  signage-app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: signage-app
    image: signage-app:latest
    restart: unless-stopped
    ports:
      - "3100:3100"
    environment:
      NODE_ENV: production
      APP_PORT: 3100
      DATABASE_URL: ${DATABASE_URL}
      POSTGRES_HOST: thaihua-postgres
      POSTGRES_PORT: 5432
      POSTGRES_DB: signage_db
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      REDIS_URL: redis://thaihua-redis:6379
      APP_URL: ${APP_URL:-http://localhost:3100}
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3100/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - thaihua-network
    depends_on:
      - signage-db-init
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  # Init container: สร้าง DB + run migrations (รันครั้งเดียว)
  signage-db-init:
    build:
      context: .
      dockerfile: Dockerfile
      target: frontend-builder
    container_name: signage-db-init
    command: >
      sh -c "
        npm run db:migrate &&
        echo 'Migrations complete'
      "
    environment:
      DATABASE_URL: ${DATABASE_URL}
    networks:
      - thaihua-network
    restart: "no"

networks:
  thaihua-network:
    external: true   # ใช้ network ที่มีอยู่แล้ว
```

### 2.3 docker-compose.dev.yml (Development)

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  signage-app-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: signage-app-dev
    restart: unless-stopped
    ports:
      - "3100:3100"
      - "5173:5173"     # Vite HMR port
    volumes:
      - .:/app                          # bind mount source code
      - /app/node_modules               # anonymous volume (don't mount node_modules)
    environment:
      NODE_ENV: development
      APP_PORT: 3100
      DISABLE_HMR: "false"
      DATABASE_URL: postgresql://postgres:postgres@thaihua-postgres:5432/signage_db
      REDIS_URL: redis://thaihua-redis:6379
    networks:
      - thaihua-network
    command: bun run dev

networks:
  thaihua-network:
    external: true
```

### 2.4 Dockerfile.dev (Development)

```dockerfile
# Dockerfile.dev
FROM node:20-alpine

WORKDIR /app

RUN npm install -g bun

COPY package.json bun.lock* ./
RUN bun install

COPY . .

EXPOSE 3100 5173

CMD ["bun", "run", "dev"]
```

### 2.5 .dockerignore

```dockerignore
# .dockerignore
node_modules/
dist/
.git/
.gitignore
*.log
.env*
!.env.example
coverage/
.DS_Store
docs/
README.md
CHANGELOG.md
```

---

## 3. คำสั่ง Docker ที่ใช้บ่อย

### 3.1 Development

```bash
# เริ่ม development container
docker compose -f docker-compose.dev.yml up -d

# ดู logs แบบ realtime
docker compose -f docker-compose.dev.yml logs -f signage-app-dev

# เข้าไปใน container
docker exec -it signage-app-dev sh

# หยุด
docker compose -f docker-compose.dev.yml down
```

### 3.2 Production Build & Deploy

```bash
# Build image ใหม่
docker compose build --no-cache

# Deploy (รัน + rebuild ถ้ามีการเปลี่ยนแปลง)
docker compose up -d --build

# ดูสถานะ
docker compose ps

# ดู logs
docker compose logs signage-app --tail 100 -f

# Restart เฉพาะ app
docker compose restart signage-app

# หยุดทุกอย่าง
docker compose down
```

### 3.3 Database Management

```bash
# รัน migration (manual)
docker exec signage-app npm run db:migrate

# Seed ข้อมูล (manual)
docker exec signage-app npm run db:seed

# เข้า psql ใน signage_db
docker exec -it thaihua-postgres psql -U postgres -d signage_db

# Backup signage_db
docker exec thaihua-postgres pg_dump -U postgres signage_db \
  > "C:\TSMS\thaihua-smart-school\backups\signage_db_$(Get-Date -Format 'yyyyMMdd').sql"

# Restore
Get-Content "backup.sql" | docker exec -i thaihua-postgres psql -U postgres signage_db
```

### 3.4 Cleanup

```bash
# ลบ container ที่หยุดแล้ว
docker container prune

# ลบ images ที่ไม่ใช้
docker image prune

# ลบทุกอย่างที่ไม่ใช้ (ระวัง!)
docker system prune -f

# ดู disk usage
docker system df
```

---

## 4. Setup ขั้นตอนแรก (First-time Setup)

```bash
# Step 1: ตรวจสอบ network มีอยู่แล้ว
docker network ls | grep thaihua-network

# Step 2: สร้าง signage_db ใน thaihua-postgres
docker exec thaihua-postgres psql -U postgres -c "
  CREATE DATABASE signage_db
  WITH OWNER = postgres
  ENCODING = 'UTF8'
  LC_COLLATE = 'C'
  LC_CTYPE = 'C';
"

# Step 3: สร้างไฟล์ .env.local
# (ดูรายละเอียดใน docs/environment.md)

# Step 4: Build และ Deploy
docker compose up -d --build

# Step 5: ตรวจสอบสุขภาพ
docker ps | grep signage
curl http://localhost:3100/api/health
```

---

## 5. Nginx Reverse Proxy (Optional)

เพิ่ม config ใน `thaihua-nginx` เพื่อ route `/signage` ไปยัง `signage-app:3100`:

```nginx
# เพิ่มใน nginx config ของ thaihua-nginx
upstream signage_backend {
    server signage-app:3100;
}

server {
    listen 80;

    # Route /signage/* ไปยัง signage app
    location /signage/ {
        proxy_pass http://signage_backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket endpoint
    location /signage/ws {
        proxy_pass http://signage_backend/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_read_timeout 86400;
    }
}
```

---

## 6. Troubleshooting

### signage-app ไม่ start

```bash
# ดู error logs
docker logs signage-app --tail 50

# ตรวจสอบ env vars
docker exec signage-app env | grep -E "PORT|DATABASE|REDIS"

# ตรวจสอบ network
docker network inspect thaihua-network | grep signage
```

### ไม่สามารถ connect ถึง PostgreSQL

```bash
# ทดสอบจากภายใน container
docker exec signage-app wget -qO- http://thaihua-postgres:5432

# ตรวจสอบ DATABASE_URL
docker exec signage-app env | grep DATABASE_URL

# ตรวจสอบว่า signage_db มีอยู่
docker exec thaihua-postgres psql -U postgres -c "\l" | grep signage_db
```

### WebSocket ตัดการเชื่อมต่อบ่อย

```bash
# ตรวจสอบ nginx timeout settings
# ต้องมี proxy_read_timeout 86400; ใน location /ws

# ตรวจสอบ logs
docker logs signage-app | grep WebSocket
```

### Container restart loop

```bash
# ดู exit code
docker inspect signage-app | grep -A 5 '"State"'

# ดู logs ก่อน crash
docker logs signage-app --tail 20
```

---

## 7. Health Check Endpoints

| Endpoint | Method | คำอธิบาย |
|----------|--------|---------|
| `/api/health` | GET | App status + uptime + DB connection |
| `/api/health/db` | GET | PostgreSQL connectivity |
| `/api/health/ws` | GET | WebSocket clients count |

```bash
# ตัวอย่าง response
curl http://localhost:3100/api/health
{
  "status": "ok",
  "service": "Enterprise Digital Signage Engine",
  "uptime": 3820.5,
  "connectedClients": 3,
  "database": "connected",
  "timestamp": "2026-08-04T10:34:00.000Z"
}
```

---

## 8. Resource Limits (แนะนำ)

```yaml
# เพิ่มใน docker-compose.yml
services:
  signage-app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```
