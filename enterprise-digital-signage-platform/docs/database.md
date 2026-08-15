# Database Reference — PostgreSQL

อัปเดตล่าสุด: 2026-08-04  
Database: `signage_db` บน `thaihua-postgres:5432`

---

## 1. ภาพรวม Schema

```
signage_db
├── screens                  # จอแสดงผลทั้งหมด
├── media_items              # ไฟล์สื่อ (video/image/widget)
├── layouts                  # Layout templates
├── layout_zones             # Zones ภายใน layout
├── playlists                # Playlists
├── playlist_items           # รายการสื่อใน playlist (ordered)
├── schedules                # ตารางเวลาแสดงผล
├── schedule_screen_groups   # many-to-many: schedule ↔ screen groups
├── schedule_screens         # many-to-many: schedule ↔ screens
├── emergency_alerts         # Emergency broadcasts
├── telemetry_logs           # Device health + event logs
└── proof_of_play_logs       # บันทึกการเล่นสื่อจริง
```

---

## 2. DDL — Create Tables

### 2.1 screens

```sql
CREATE TABLE screens (
  id                      VARCHAR(50)   PRIMARY KEY,
  pairing_code            VARCHAR(20)   NOT NULL UNIQUE,
  name                    VARCHAR(200)  NOT NULL,
  "group"                 VARCHAR(100)  NOT NULL DEFAULT '',
  location                VARCHAR(300)  NOT NULL DEFAULT '',
  orientation             VARCHAR(20)   NOT NULL DEFAULT 'landscape'
                          CHECK (orientation IN ('landscape','portrait','custom')),
  resolution              VARCHAR(50)   NOT NULL DEFAULT '1920x1080 (FHD)',
  status                  VARCHAR(20)   NOT NULL DEFAULT 'offline'
                          CHECK (status IN ('online','offline','syncing','error','emergency')),
  last_heartbeat          TIMESTAMPTZ,
  ip_address              VARCHAR(45),
  mac_address             VARCHAR(17),
  storage_usage_mb        INTEGER       NOT NULL DEFAULT 0,
  storage_total_mb        INTEGER       NOT NULL DEFAULT 8000,
  buffer_cached_items     INTEGER       NOT NULL DEFAULT 0,
  current_layout_id       VARCHAR(50)   REFERENCES layouts(id) ON DELETE SET NULL,
  current_playlist_id     VARCHAR(50)   REFERENCES playlists(id) ON DELETE SET NULL,
  active_emergency_id     VARCHAR(50),
  volume                  INTEGER       NOT NULL DEFAULT 75
                          CHECK (volume BETWEEN 0 AND 100),
  is_muted                BOOLEAN       NOT NULL DEFAULT false,
  firmware_version        VARCHAR(30)   NOT NULL DEFAULT 'v1.0.0',
  uptime_seconds          BIGINT        NOT NULL DEFAULT 0,
  last_screenshot_url     TEXT,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_screens_status ON screens(status);
CREATE INDEX idx_screens_group ON screens("group");
```

### 2.2 media_items

```sql
CREATE TABLE media_items (
  id              VARCHAR(50)   PRIMARY KEY,
  title           VARCHAR(300)  NOT NULL,
  type            VARCHAR(20)   NOT NULL
                  CHECK (type IN ('image','video','ticker','weather','clock','webpage','announcement')),
  url             TEXT          NOT NULL DEFAULT '',
  duration        INTEGER       NOT NULL DEFAULT 10 CHECK (duration > 0),
  size_mb         NUMERIC(8,2)  NOT NULL DEFAULT 0,
  tags            TEXT[]        NOT NULL DEFAULT '{}',
  thumbnail_url   TEXT          NOT NULL DEFAULT '',
  -- contentData fields (denormalized for simplicity)
  ticker_text     TEXT,
  ticker_speed    INTEGER,
  weather_city    VARCHAR(100),
  clock_format    VARCHAR(5)    CHECK (clock_format IN ('12h','24h')),
  announce_header VARCHAR(200),
  announce_body   TEXT,
  web_url         TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_items_type ON media_items(type);
CREATE INDEX idx_media_items_tags ON media_items USING GIN(tags);
```

### 2.3 layouts & layout_zones

```sql
CREATE TABLE layouts (
  id            VARCHAR(50)   PRIMARY KEY,
  name          VARCHAR(200)  NOT NULL,
  description   TEXT          NOT NULL DEFAULT '',
  orientation   VARCHAR(20)   NOT NULL DEFAULT 'landscape'
                CHECK (orientation IN ('landscape','portrait','custom')),
  aspect_ratio  VARCHAR(10)   NOT NULL DEFAULT '16:9',
  width_px      INTEGER       NOT NULL DEFAULT 1920,
  height_px     INTEGER       NOT NULL DEFAULT 1080,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE layout_zones (
  id                VARCHAR(50)   PRIMARY KEY,
  layout_id         VARCHAR(50)   NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
  name              VARCHAR(100)  NOT NULL,
  x                 NUMERIC(5,2)  NOT NULL DEFAULT 0 CHECK (x BETWEEN 0 AND 100),
  y                 NUMERIC(5,2)  NOT NULL DEFAULT 0 CHECK (y BETWEEN 0 AND 100),
  width             NUMERIC(5,2)  NOT NULL DEFAULT 100 CHECK (width BETWEEN 0 AND 100),
  height            NUMERIC(5,2)  NOT NULL DEFAULT 100 CHECK (height BETWEEN 0 AND 100),
  z_index           INTEGER       NOT NULL DEFAULT 1,
  playlist_id       VARCHAR(50)   REFERENCES playlists(id) ON DELETE SET NULL,
  background_color  VARCHAR(30)   DEFAULT '#000000',
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_layout_zones_layout_id ON layout_zones(layout_id);
```

### 2.4 playlists & playlist_items

```sql
CREATE TABLE playlists (
  id              VARCHAR(50)   PRIMARY KEY,
  name            VARCHAR(200)  NOT NULL,
  description     TEXT          NOT NULL DEFAULT '',
  total_duration  INTEGER       NOT NULL DEFAULT 0,
  tags            TEXT[]        NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE playlist_items (
  id              VARCHAR(50)   PRIMARY KEY,
  playlist_id     VARCHAR(50)   NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  media_id        VARCHAR(50)   NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  duration        INTEGER       NOT NULL DEFAULT 10 CHECK (duration > 0),
  "order"         INTEGER       NOT NULL DEFAULT 1,
  transition      VARCHAR(10)   NOT NULL DEFAULT 'fade'
                  CHECK (transition IN ('fade','slide','zoom','none')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX idx_playlist_items_order ON playlist_items(playlist_id, "order");
```

### 2.5 schedules

```sql
CREATE TABLE schedules (
  id                VARCHAR(50)   PRIMARY KEY,
  name              VARCHAR(200)  NOT NULL,
  playlist_id       VARCHAR(50)   REFERENCES playlists(id) ON DELETE SET NULL,
  layout_id         VARCHAR(50)   REFERENCES layouts(id) ON DELETE SET NULL,
  screen_group_ids  TEXT[]        NOT NULL DEFAULT '{}',
  screen_ids        TEXT[]        NOT NULL DEFAULT '{}',
  priority          INTEGER       NOT NULL DEFAULT 50
                    CHECK (priority BETWEEN 1 AND 100),
  start_date        DATE          NOT NULL,
  end_date          DATE          NOT NULL,
  start_time        TIME          NOT NULL DEFAULT '00:00',
  end_time          TIME          NOT NULL DEFAULT '23:59',
  days_of_week      INTEGER[]     NOT NULL DEFAULT '{1,2,3,4,5}'
                    CHECK (array_length(days_of_week, 1) > 0),
  is_active         BOOLEAN       NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedules_is_active ON schedules(is_active);
CREATE INDEX idx_schedules_priority ON schedules(priority DESC);
```

### 2.6 emergency_alerts

```sql
CREATE TABLE emergency_alerts (
  id                VARCHAR(50)   PRIMARY KEY,
  title             VARCHAR(200)  NOT NULL,
  message           TEXT          NOT NULL,
  type              VARCHAR(20)   NOT NULL DEFAULT 'custom'
                    CHECK (type IN ('fire','weather','lockdown','custom','all-clear')),
  severity          VARCHAR(10)   NOT NULL DEFAULT 'critical'
                    CHECK (severity IN ('critical','warning','info')),
  target_screen_ids TEXT[]        NOT NULL DEFAULT '{}',
  is_active         BOOLEAN       NOT NULL DEFAULT false,
  triggered_at      TIMESTAMPTZ,
  triggered_by      VARCHAR(100),
  cleared_at        TIMESTAMPTZ,
  cleared_by        VARCHAR(100),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emergency_alerts_is_active ON emergency_alerts(is_active);
CREATE INDEX idx_emergency_alerts_triggered_at ON emergency_alerts(triggered_at DESC);
```

### 2.7 telemetry_logs

```sql
CREATE TABLE telemetry_logs (
  id            BIGSERIAL     PRIMARY KEY,
  screen_id     VARCHAR(50)   NOT NULL,
  screen_name   VARCHAR(200)  NOT NULL,
  event_type    VARCHAR(20)   NOT NULL
                CHECK (event_type IN ('heartbeat','media_played','buffer_cached',
                                      'offline_mode','command_exec','error')),
  message       TEXT          NOT NULL,
  details       JSONB,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telemetry_screen_id ON telemetry_logs(screen_id);
CREATE INDEX idx_telemetry_event_type ON telemetry_logs(event_type);
CREATE INDEX idx_telemetry_created_at ON telemetry_logs(created_at DESC);

-- Auto-delete logs older than 90 days (run via cron or pg_cron)
-- DELETE FROM telemetry_logs WHERE created_at < NOW() - INTERVAL '90 days';
```

### 2.8 proof_of_play_logs

```sql
CREATE TABLE proof_of_play_logs (
  id                BIGSERIAL     PRIMARY KEY,
  screen_id         VARCHAR(50)   NOT NULL,
  screen_name       VARCHAR(200)  NOT NULL,
  media_id          VARCHAR(50)   NOT NULL,
  media_title       VARCHAR(300)  NOT NULL,
  played_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  duration_seconds  INTEGER       NOT NULL DEFAULT 0,
  status            VARCHAR(15)   NOT NULL DEFAULT 'completed'
                    CHECK (status IN ('completed','interrupted','buffered')),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pop_screen_id ON proof_of_play_logs(screen_id);
CREATE INDEX idx_pop_media_id ON proof_of_play_logs(media_id);
CREATE INDEX idx_pop_played_at ON proof_of_play_logs(played_at DESC);
```

---

## 3. ลำดับการสร้าง Tables (Dependencies)

```
ต้องสร้างตามลำดับนี้ (foreign key constraints):

1. playlists
2. layouts
3. media_items
4. layout_zones      (→ layouts, playlists)
5. playlist_items    (→ playlists, media_items)
6. screens           (→ layouts, playlists)
7. schedules
8. emergency_alerts
9. telemetry_logs
10. proof_of_play_logs
```

---

## 4. Seed Data SQL

```sql
-- สร้าง database (ทำครั้งเดียว)
CREATE DATABASE signage_db
  WITH OWNER = postgres ENCODING = 'UTF8' LC_COLLATE = 'C' LC_CTYPE = 'C';

\c signage_db

-- Seed: Playlists ก่อน (screens อ้างอิง)
INSERT INTO playlists (id, name, description, total_duration, tags) VALUES
  ('pl-corporate-main', 'Corporate Main Lobby Sequence', 'High-definition video showcase', 90, ARRAY['lobby','corporate']),
  ('pl-lunch-menu', 'Cafeteria Lunch Specials', 'Daily dining', 45, ARRAY['cafeteria','menu']),
  ('pl-widgets-sidebar', 'Live Weather & World Clock', 'Clock and weather', 120, ARRAY['widgets']),
  ('pl-ticker-only', 'News Ticker', 'Bottom scrolling ticker', 60, ARRAY['ticker']),
  ('pl-executive-briefing', 'Executive Elevator Reel', 'Portrait keynotes', 85, ARRAY['portrait']),
  ('pl-campus-events', 'Campus Events & Outdoor', 'Outdoor showcase', 75, ARRAY['campus']);

-- Seed: Layouts
INSERT INTO layouts (id, name, orientation, aspect_ratio, width_px, height_px) VALUES
  ('lay-split-3zone', 'Enterprise 3-Zone Landscape', 'landscape', '16:9', 1920, 1080),
  ('lay-portrait-kiosk', 'Portrait Elevator Kiosk', 'portrait', '9:16', 1080, 1920),
  ('lay-menu-board', 'Full Screen Menu Board', 'landscape', '16:9', 1920, 1080),
  ('lay-hero-banner', 'Outdoor LED Hero Wall', 'landscape', '16:9', 2560, 1440);

-- Seed: Screens (5 จอ)
INSERT INTO screens (id, pairing_code, name, "group", location, orientation, resolution, status,
  current_layout_id, current_playlist_id, volume, firmware_version) VALUES
  ('scr-001','LOBBY-88','Main Lobby 4K Display','HQ Reception','Building A - Ground Floor','landscape','3840x2160 (4K)','online','lay-split-3zone','pl-corporate-main',75,'v4.2.1-prod'),
  ('scr-002','CAFE-20','Cafeteria Digital Menu Board','Dining & Refreshments','Building B - 2F Dining','landscape','1920x1080 (FHD)','online','lay-menu-board','pl-lunch-menu',40,'v4.2.1-prod'),
  ('scr-003','TOWER-91','Executive Elevator Portrait','Executive Tower','Building C - Elevator','portrait','1080x1920 (Portrait)','online','lay-portrait-kiosk','pl-executive-briefing',0,'v4.2.0-prod'),
  ('scr-004','QUAD-15','Campus Quad Outdoor LED Wall','Outdoor Displays','Central Courtyard','landscape','2560x1440 (2K)','syncing','lay-hero-banner','pl-campus-events',90,'v4.2.1-prod'),
  ('scr-005','CONF-04','Innovation Hub Welcome Screen','R&D Labs','Lab 4 - Tech Wing','landscape','1920x1080 (FHD)','offline','lay-split-3zone','pl-corporate-main',50,'v4.1.9-legacy');
```

---

## 5. Migration Strategy

### 5.1 เครื่องมือที่แนะนำ: Drizzle ORM

```bash
# ติดตั้ง
bun add drizzle-orm pg
bun add -d drizzle-kit @types/pg

# สร้าง migration จาก schema
bun run db:generate

# รัน migration
bun run db:migrate

# ดู UI
bun run db:studio
```

### 5.2 โครงสร้างไฟล์ Database

```
src/
└── db/
    ├── index.ts          # Database connection pool
    ├── schema.ts         # Drizzle schema definitions
    ├── seed.ts           # Seed data script
    └── migrations/       # Generated migration files
```

### 5.3 ตัวอย่าง Database Connection (`src/db/index.ts`)

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                  // max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool);
export { pool };
```

---

## 6. Naming Conventions

| รายการ | Convention | ตัวอย่าง |
|--------|-----------|---------|
| Table names | `snake_case` plural | `media_items`, `proof_of_play_logs` |
| Column names | `snake_case` | `screen_id`, `created_at` |
| Primary keys | `id` (VARCHAR หรือ BIGSERIAL) | `id VARCHAR(50)` |
| Foreign keys | `{table_singular}_id` | `playlist_id`, `screen_id` |
| Timestamps | `created_at`, `updated_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` |
| Boolean | `is_*` หรือ `has_*` | `is_active`, `is_muted` |
| Indexes | `idx_{table}_{column}` | `idx_screens_status` |
| Enum-like | `CHECK (col IN (...))` | ใช้ CHECK constraint |

---

## 7. Backup & Restore

```bash
# Backup signage_db
docker exec thaihua-postgres pg_dump -U postgres signage_db > /backups/signage_db_$(date +%Y%m%d).sql

# Restore
docker exec -i thaihua-postgres psql -U postgres signage_db < /backups/signage_db_20260804.sql

# Backup ทุก databases (ทำโดย thaihua infra team)
# ดูไฟล์ที่ C:\TSMS\thaihua-smart-school\backups\
```

---

## 8. Performance Guidelines

- **telemetry_logs** และ **proof_of_play_logs** จะโตเร็ว — ควรตั้ง cron ลบข้อมูลเก่า > 90 วัน
- ใช้ **connection pooling** (pool.max = 20) ไม่สร้าง connection ใหม่ทุก request
- Query logs ควรใช้ `WHERE created_at > NOW() - INTERVAL '7 days'` เสมอ
- Index บน `status`, `screen_id`, `created_at DESC` สำหรับ queries บ่อยๆ
