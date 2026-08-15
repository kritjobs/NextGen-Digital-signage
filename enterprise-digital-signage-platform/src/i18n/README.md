# i18n — ระบบหลายภาษา (Internationalization)

ระบบ UI รองรับหลายภาษา โดย **ภาษาอังกฤษ (en) เป็นแกนหลัก (core)** — เป็นแหล่งที่มาของ translation keys
และเป็น fallback อัตโนมัติเมื่อภาษาที่เลือกไม่มีข้อความนั้น

## ภาษาที่รองรับตอนนี้

| Code | ภาษา | สถานะ |
|---|---|---|
| `en` | English (แกนหลัก) | ✅ เต็ม |
| `th` | ไทย | ✅ เต็ม |
| `zh` | 中文（简体） | ✅ เต็ม |

## โครงสร้าง

```
src/i18n/
├── types.ts              # LanguageCode + SUPPORTED_LANGUAGES (registry) + DEFAULT_LANGUAGE
├── index.ts              # translations registry + getMessages() + translate() + getLocale()
├── translations/
│   ├── en.ts             # ⭐ CORE — แหล่งที่มาของทุกคีย์ (Messages type เกิดจากไฟล์นี้)
│   ├── th.ts             # ภาษาไทย (typed: Messages → compiler ฟ้องถ้าคีย์ขาด)
│   └── zh.ts             # ภาษาจีน (typed: Messages)
src/store/useLanguageStore.ts   # Zustand store: language + setLanguage (persist localStorage 'signage_language')
src/hooks/useTranslation.ts     # Hook: { t, language, setLanguage, languages }
src/components/LanguageSwitcher.tsx  # UI สลับภาษา (ใน Navbar + LoginPage)
```

## วิธีใช้ในคอมโพเนนต์

```tsx
import { useTranslation } from '../hooks/useTranslation';

const { t } = useTranslation();

// คีย์แบบ typing 100% — ผิดคีย์ = compile error
<p>{t('nav.adminConsole')}</p>

// การแทรกค่า (interpolation)
<span>{t('nav.onlineCount', { online: 3, total: 6 })}</span>
<span>{t('app.welcome', { name: user.displayName })}</span>
```

- เปลี่ยนภาษา: `setLanguage('th')` — persist ไว้ใน localStorage + อัปเดต `<html lang>`
- ระบบเลือกภาษาแรกเริ่ม: ค่าที่บันทึกไว้ → browser locale (th/zh) → `en`

## ➕ เพิ่มภาษาใหม่ (เช่น ญี่ปุ่น `ja`)

1. **`src/i18n/types.ts`** — เพิ่ม `'ja'` ใน union `LanguageCode` + เพิ่ม entry ใน `SUPPORTED_LANGUAGES`:
   ```ts
   export type LanguageCode = 'en' | 'th' | 'zh' | 'ja';
   // ใน SUPPORTED_LANGUAGES:
   { code: 'ja', locale: 'ja-JP', nativeName: '日本語', shortLabel: '日', flag: '🇯🇵' },
   ```
2. **สร้าง `src/i18n/translations/ja.ts`**:
   ```ts
   import type { Messages } from './en';
   export const ja: Messages = { 'app.loading': '読み込み中...', /* ...ทุกคีย์ */ };
   ```
   → **TypeScript จะลิสต์ทุกคีย์ที่ขาดให้อัตโนมัติ** (ชนิดเป็น `Messages` = ต้องครบ)
3. **`src/i18n/index.ts`** — import `ja` + เพิ่มใน `translations`:
   ```ts
   import { ja } from './translations/ja';
   export const translations: Record<LanguageCode, Messages> = { en, th, zh, ja };
   ```
4. เสร็จ — switcher ใน Navbar/LoginPage ขึ้นภาษาญี่ปุ่นให้อัตโนมัติ (อ่านจาก `SUPPORTED_LANGUAGES`)

**เสร็จแค่ 4 ขั้นตอนนี้ — ไม่ต้องแตะคอมโพเนนต์ใดๆ** (ถ้าแปลครบทุกคีย์)

## หมายเหตุ

- **คีย์ที่ยังไม่ได้แปลจะ fallback เป็นอังกฤษ** (`getMessages()` → `en`) — UI ไม่พัง ไม่เคย crash
- `translate()` รองรับ interpolation `{var}` — ถ้าไม่มีตัวแปรส่งมา จะคง `{var}` ไว้ตามเดิม
- เนื้อหาที่มาจาก **server/DB** (ชื่อจอ, ชื่อเพลย์ลิสต์, ข้อความ quick-post/emergency ที่ผู้ใช้พิมพ์)
  ยังเป็นภาษาที่ผู้ใช้กรอกเข้าไป — i18n นี้แปลเฉพาะ **static labels ใน UI**
- ยังไม่รองรับ RTL (ถ้าจะเพิ่มภาษาอาหรับ/ฮิบรู ต้องเพิ่ม field `dir` ใน `LanguageMeta` + จัดการ CSS)
