# ─── Stage 1: Install dependencies ───────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# ติดตั้ง build tools สำหรับ native modules (pg ต้องการ)
RUN apk add --no-cache python3 make g++

COPY package.json bun.lock* package-lock.json* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install


# ─── Stage 2: Build frontend + bundle server ──────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Vite frontend → dist/
# Bundle server.ts → dist/server.cjs
RUN npm run build


# ─── Stage 3: Production runtime ──────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# ติดตั้งเฉพาะ runtime essentials
RUN apk add --no-cache wget

# คัดลอก production node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# คัดลอก build artifacts
COPY --from=builder /app/dist ./dist

# คัดลอก migration files (ใช้ตอน startup)
COPY --from=builder /app/src/db/migrations ./src/db/migrations

# สร้าง uploads directory + non-root user
RUN mkdir -p /app/uploads && \
    addgroup -g 1001 -S nodejs && \
    adduser -S signage -u 1001 && \
    chown -R signage:nodejs /app/uploads
USER signage

ENV NODE_ENV=production
ENV APP_PORT=3100

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:${APP_PORT}/api/health || exit 1

CMD ["node", "dist/server.cjs"]
