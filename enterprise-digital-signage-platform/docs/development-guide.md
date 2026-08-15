# Development Guide — คู่มือการพัฒนา

อัปเดตล่าสุด: 2026-08-04

---

## 1. เริ่มต้น Development

### 1.1 ขั้นตอน Setup ครั้งแรก

```bash
# 1. เข้าโฟลเดอร์โปรเจกต์
cd "c:\NextGen Digital Signature\enterprise-digital-signage-platform"

# 2. ติดตั้ง dependencies
bun install

# 3. สร้าง .env.local
cp .env.example .env.local
# แก้ไขค่าใน .env.local ตาม docs/environment.md

# 4. สร้าง database (ครั้งเดียว)
docker exec thaihua-postgres psql -U postgres -c "CREATE DATABASE signage_db;"

# 5. รัน migrations
bun run db:migrate

# 6. Seed ข้อมูลเริ่มต้น
bun run db:seed

# 7. เริ่ม development server
bun run dev
# → เปิด http://localhost:3100
```

### 1.2 การ Verify ว่าระบบพร้อม

```bash
# ตรวจสอบ services ที่จำเป็น
docker ps | grep -E "thaihua-postgres|thaihua-redis"

# ทดสอบ DB connection
docker exec thaihua-postgres psql -U postgres -c "\c signage_db; \dt"

# ตรวจสอบ app health
curl http://localhost:3100/api/health
```

---

## 2. Coding Standards

### 2.1 TypeScript

```typescript
// ✅ DO: ใช้ explicit types เสมอสำหรับ function parameters และ return
function getScreenById(id: string): DigitalScreen | undefined { ... }

// ✅ DO: ใช้ interface สำหรับ object shapes
interface CreateScreenInput {
  name: string;
  location: string;
  orientation: Orientation;
}

// ✅ DO: ใช้ const assertions สำหรับ literal arrays
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;

// ❌ DON'T: ใช้ any
function process(data: any) { ... }  // ❌

// ❌ DON'T: ใช้ non-null assertion โดยไม่จำเป็น
const screen = screens.find(s => s.id === id)!;  // ❌
```

### 2.2 React Components

```tsx
// ✅ DO: Function components + TypeScript props interface
interface ScreenCardProps {
  screen: DigitalScreen;
  onCommand: (command: RealtimeCommand['command']) => void;
}

export const ScreenCard: React.FC<ScreenCardProps> = ({ screen, onCommand }) => {
  return <div>...</div>;
};

// ✅ DO: Custom hooks สำหรับ logic ซับซ้อน
function useScreenStatus(screenId: string) {
  const screen = useSignageStore(s => s.screens.find(sc => sc.id === screenId));
  return screen?.status ?? 'offline';
}

// ❌ DON'T: Default exports สำหรับ components (ยกเว้น App.tsx และ pages)
export default function ScreenCard() { ... }  // ❌ — ใช้ named export

// ✅ ยกเว้น: App.tsx และ page-level components
export default function App() { ... }  // ✅
```

### 2.3 File & Folder Naming

```
components/           PascalCase.tsx          ScreenCard.tsx
hooks/                camelCase.ts             useScreenStatus.ts
services/             camelCase.ts             screenService.ts
utils/                camelCase.ts             formatDuration.ts
types/                camelCase.ts             signage.ts
constants/            SCREAMING_SNAKE.ts       MEDIA_TYPES.ts
```

### 2.4 Zustand Store

```typescript
// ✅ DO: ใช้ selector เสมอ เพื่อป้องกัน re-render ที่ไม่จำเป็น
const screens = useSignageStore(s => s.screens);           // ✅
const { screens } = useSignageStore();                      // ❌ subscribe ทั้ง store

// ✅ DO: แยก action ออกจาก state ใน selector
const addScreen = useSignageStore(s => s.addScreen);       // ✅
const updateScreen = useSignageStore(s => s.updateScreen); // ✅

// ✅ DO: ใช้ immer หรือ spread อย่างถูกต้อง
set(state => ({
  screens: state.screens.map(s =>
    s.id === id ? { ...s, ...partial } : s
  )
}));
```

### 2.5 CSS / Tailwind

```tsx
// ✅ DO: ใช้ Design System tokens เสมอ
<div className="bg-surface-container-lowest text-on-surface">   // ✅
<div className="bg-[#0b0e14] text-[#e1e2eb]">                   // ❌ hardcode color

// ✅ DO: glass-card class สำหรับทุก card
<div className="glass-card rounded-xl p-6">                      // ✅

// ✅ DO: group ร่วมกับ group-hover
<div className="group">
  <button className="opacity-0 group-hover:opacity-100">        // ✅
```

---

## 3. Git Workflow

### 3.1 Branch Strategy

```
main          → production (deploy อัตโนมัติ)
develop       → staging / integration
feature/*     → ฟีเจอร์ใหม่
fix/*         → bug fixes
hotfix/*      → urgent fixes บน production
docs/*        → เอกสารเท่านั้น
```

### 3.2 Branch Naming

```bash
feature/screens-manager-crud
feature/playlist-editor-timeline
fix/emergency-overlay-z-index
hotfix/websocket-disconnect-crash
docs/update-api-reference
```

### 3.3 Commit Message Convention (Conventional Commits)

```bash
# Format: <type>(<scope>): <description>

feat(player): add A/B video buffering for zero-flicker playback
fix(emergency): overlay not appearing when targetScreenIds is empty
docs(api): add WebSocket event payload examples
style(screens): fix status badge color for syncing state
refactor(store): extract sendCommandToScreen to separate service
chore(deps): add drizzle-orm and pg dependencies
test(scheduler): add unit tests for priority resolution logic

# Types:
# feat     — ฟีเจอร์ใหม่
# fix      — แก้ bug
# docs     — เอกสาร
# style    — CSS/formatting (ไม่กระทบ logic)
# refactor — refactor โค้ด
# chore    — dependencies, build, tooling
# test     — tests
# perf     — performance improvement
```

### 3.4 Pull Request Process

1. สร้าง branch จาก `develop`
2. ทำงานให้เสร็จ + `bun run lint`
3. Push + สร้าง PR → `develop`
4. ให้อีก 1 คน review ก่อน merge
5. Squash merge เข้า develop
6. ลบ branch หลัง merge

---

## 4. การจัดการ Environment

### 4.1 ไฟล์ .env ที่มีในโปรเจกต์

| ไฟล์ | ใช้สำหรับ | Commit? |
|------|----------|---------|
| `.env.example` | template — ไม่มีค่าจริง | ✅ commit |
| `.env.local` | local development | ❌ ห้าม commit |
| `.env.production` | production values | ❌ ห้าม commit |
| `.env.test` | test environment | ❌ ห้าม commit |

### 4.2 กฎสำคัญ

```bash
# ❌ ห้ามทำ
git add .env.local          # ❌
git add .env.production      # ❌

# ✅ ต้องทำเมื่อเพิ่ม env var ใหม่
# 1. เพิ่มใน .env.example (ไม่มีค่าจริง)
# 2. อัปเดต docs/environment.md
# 3. แจ้งทีม
```

---

## 5. Testing Guidelines

### 5.1 ประเภท Tests

| ประเภท | เครื่องมือ | Location |
|--------|-----------|---------|
| Unit tests | Vitest | `src/**/*.test.ts` |
| Component tests | Vitest + Testing Library | `src/**/*.test.tsx` |
| E2E | Playwright (future) | `e2e/` |

### 5.2 สิ่งที่ควร Test

```
✅ Store actions (triggerEmergency, sendCommandToScreen, CRUD)
✅ Utility functions (formatDuration, resolveActiveSchedule)
✅ MediaRenderer — render ถูกต้องตาม media type
✅ ZoneContainer — advance playlist index ถูก
✅ API endpoints — response format ถูกต้อง
```

### 5.3 สิ่งที่ไม่ต้อง Test

```
❌ Tailwind CSS classes
❌ Zustand setter boilerplate (set({ x: value }))
❌ Third-party library behavior
```

---

## 6. Performance Checklist

ก่อน push ทุกครั้ง ตรวจสอบ:

- [ ] ไม่มี `console.log` ที่ไม่จำเป็นใน production code
- [ ] Video elements มี cleanup (`destroyVideo`) ใน useEffect return
- [ ] `URL.createObjectURL` ทุกตัวมี `revokeObjectURL` คู่
- [ ] Zustand selectors เฉพาะเจาะจง ไม่ subscribe ทั้ง store
- [ ] Images มี `loading="lazy"` ที่ไม่ใช่ first-screen
- [ ] `useEffect` dependencies array ครบถ้วน

---

## 7. Troubleshooting ที่พบบ่อย

### 7.1 Port 3000 ชนกับ thaihua-auth-service

```bash
# ปัญหา: EADDRINUSE :3000
# แก้: ตรวจสอบ APP_PORT ใน .env.local
APP_PORT=3100  # ต้องเป็น 3100

# ตรวจสอบ
echo $APP_PORT
netstat -ano | findstr ":3100"
```

### 7.2 PostgreSQL connection refused

```bash
# ตรวจสอบ container ทำงานอยู่
docker ps | grep thaihua-postgres

# ตรวจสอบ database มีอยู่
docker exec thaihua-postgres psql -U postgres -c "\l" | grep signage_db

# ตรวจสอบ network
docker network inspect thaihua-network | grep signage
```

### 7.3 WebSocket ไม่เชื่อมต่อ

```bash
# ตรวจสอบ WS_PATH ใน .env.local
WS_PATH=/ws

# ทดสอบ
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:3100/ws
```

### 7.4 Vite HMR ไม่ทำงาน

```bash
# ตรวจสอบ DISABLE_HMR
# ถ้า = true จะปิด HMR (ใช้ในโหมด AI agent เท่านั้น)
DISABLE_HMR=false  # ต้องเป็น false สำหรับ dev ปกติ
```

### 7.5 TypeScript errors หลัง pull

```bash
bun run lint        # ตรวจสอบ type errors
bun install         # อัปเดต dependencies
```

---

## 8. Code Review Checklist

ก่อน approve PR ตรวจสอบ:

- [ ] TypeScript ไม่มี `any`, `!` assertion โดยไม่จำเป็น
- [ ] Component ใหม่มี proper TypeScript props interface
- [ ] Zustand selector เฉพาะเจาะจง
- [ ] Design tokens ใช้ CSS variables ไม่ hardcode สี
- [ ] Emergency-related code — ทดสอบ trigger + clear ครบ
- [ ] `.env` ไม่มีค่าจริงติดมาใน commit
- [ ] CHANGELOG.md อัปเดตแล้ว (ถ้าเป็น user-facing change)
