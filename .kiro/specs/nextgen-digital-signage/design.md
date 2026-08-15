# Design Specification — NextGen Digital Signage Platform
**Version:** 1.0  
**อ้างอิง:** Aetheric Command Design System + Aetheric Command Signage Extension  
**หลักการ:** ผลลัพธ์ตรงต้นแบบ HTML Prototype 100%

---

## 1. Design System Tokens

### 1.1 Color Palette — Admin UI ("Aetheric Command")

```css
/* === SURFACE LAYERS (Dark, Layered Charcoal) === */
--surface-container-lowest: #0b0e14;  /* Page background / deepest base */
--surface-container-low:    #191c22;  /* Secondary panels */
--surface-container:        #1d2026;  /* Cards, modals */
--surface-container-high:   #272a31;  /* Elevated cards */
--surface-container-highest:#32353c;  /* Tooltips, popovers */
--surface:                  #10131a;  /* Sidebar, Topbar */
--surface-bright:           #363940;  /* Hover states */

/* === PRIMARY — Electric Indigo === */
--primary:           #c0c1ff;  /* Text on dark, icons */
--primary-container: #8083ff;  /* Buttons, active states */
--on-primary:        #1000a9;  /* Text on primary */
--on-primary-container: #0d0096;

/* === SECONDARY — Cyan === */
--secondary:           #4cd7f6;  /* Data highlights, active nav */
--secondary-container: #03b5d3;
--on-secondary:        #003640;

/* === TERTIARY — Amber/Orange === */
--tertiary:           #ffb95f;  /* Warning, high-priority states */
--tertiary-container: #ca8100;

/* === SEMANTIC === */
--error:           #ffb4ab;  /* Error, Emergency indicators */
--error-container: #93000a;
--on-error:        #690005;

/* === TEXT === */
--on-surface:         #e1e2eb;  /* Primary text */
--on-surface-variant: #c7c4d7;  /* Secondary text, placeholders */
--outline:            #908fa0;  /* Borders default */
--outline-variant:    #464554;  /* Subtle borders */
```

### 1.2 Color Palette — Player/Signage UI ("Signage Extension")

```css
/* OLED-optimized pure black foundation */
--background:                #131313;
--surface-container-lowest:  #0e0e0e;
--surface-container-low:     #1b1b1b;
--surface-container:         #1f1f1f;

/* Primary — Deep Blue */
--primary:           #b2c5ff;
--primary-container: #0052cc;

/* Secondary — Bright Cyan (live indicators) */
--secondary:              #ddfcff;
--secondary-fixed-dim:    #00dbe7;  /* Sync pulse dot */
--secondary-container:    #00f1fe;

/* Tertiary — Warm Orange */
--tertiary:          #ffb59b;
--tertiary-fixed-dim:#ffb59b;  /* Weather icon color */

/* Text */
--on-surface:         #e2e2e2;
--on-surface-variant: #c3c6d6;
```

---

## 2. Typography Scale

### 2.1 Admin UI Typography

| Token | Font | Size | Weight | Line Height | Tracking | ใช้กับ |
|-------|------|------|--------|-------------|----------|--------|
| `display-lg` | Inter | 48px | 700 | 56px | -0.02em | Dashboard stats (จำนวนจอ) |
| `headline-lg` | Inter | 32px | 600 | 40px | -0.01em | Page titles |
| `headline-lg-mobile` | Inter | 24px | 600 | 32px | — | Mobile headers |
| `headline-md` | Inter | 24px | 600 | 32px | — | Card titles, section headers |
| `body-lg` | Inter | 18px | 400 | 28px | — | Descriptions |
| `body-md` | Inter | 16px | 400 | 24px | — | Body text (default) |
| `label-md` | Inter | 14px | 500 | 20px | 0.05em | Labels, nav items, badges |
| `code` | Inter | 14px | 400 | 20px | — | Mono data, timestamps, IP |

### 2.2 Player/Signage Typography

| Token | Font | Size | Weight | Line Height | Tracking | ใช้กับ |
|-------|------|------|--------|-------------|----------|--------|
| `display-hero` | Inter | **120px** | 800 | 140px | -0.04em | Emergency text, Hero headlines |
| `display-title` | Inter | **80px** | 700 | 96px | -0.02em | Clock time, Temperature |
| `headline-lg` | Inter | **48px** | 600 | 56px | — | Ticker text, Sub-headlines |
| `body-lg` | Inter | 24px | 400 | 36px | — | Body copy on signage |
| `label-caps` | Inter | 16px | 700 | 24px | **0.1em** | Category labels (ALL CAPS) |

> **กฎ:** Player ใช้ font-weight ≥ 700 เสมอ เพื่อ legibility จากระยะ ≥ 5 เมตร

---

## 3. Spacing & Layout Grid

### 3.1 Admin Spacing Tokens

```css
--unit:                      8px;   /* Base grid unit */
--stack-sm:                  8px;   /* Tight spacing */
--stack-md:                 16px;   /* Normal spacing */
--stack-lg:                 32px;   /* Section spacing */
--gutter:                   24px;   /* Column gutters */
--container-padding-desktop:32px;   /* Page padding desktop */
--container-padding-tablet: 24px;   /* Page padding tablet */
```

### 3.2 Player Spacing Tokens

```css
--margin-page:   64px;  /* Safe zone จากขอบจอ (ป้องกัน overscan) */
--gutter-large:  48px;  /* ระยะระหว่าง zones */
--stack-gap:     24px;  /* Component-to-component min gap */
--widget-padding:40px;  /* Widget internal padding */
```

### 3.3 Layout Structure — Admin

```
┌─────────────────────────────────────────────────────────┐
│  TOPBAR (fixed, h-64px, backdrop-blur-xl)                │
├────────────┬────────────────────────────────────────────┤
│            │                                             │
│  SIDEBAR   │   MAIN CONTENT AREA                        │
│  (fixed,   │   max-w-7xl, px-4/6/8, py-6               │
│  w-280px)  │   (scrollable)                             │
│            │                                             │
├────────────┴────────────────────────────────────────────┤
│  FOOTER (py-4, border-t)                                │
└─────────────────────────────────────────────────────────┘
```

### 3.4 Layout Structure — Player (Fullscreen)

```
┌─────────────────────────────────────────────────────────┐
│  TOPBAR (fixed top, pointer-events-none)                 │
│  Logo Left ────────────────── Sync indicator Right       │
│                                                          │
│  MEDIA CANVAS (absolute inset-0, -z-10)                 │
│  p-margin-page (64px safe zone)                         │
│  ┌──────────────────────────────────────────────┐       │
│  │  rounded-xl, border, shadow                  │       │
│  │  bg-cover + opacity-80 + mix-blend-screen    │       │
│  │  vignette: gradient-to-t from-background     │       │
│  └──────────────────────────────────────────────┘       │
│                                                          │
│  BOTTOM TICKER BAR (fixed bottom, h-32)                 │
│  ┌──────────┬────────────────────────┬──────────┐       │
│  │  Clock   │   Scrolling Text       │ Weather  │       │
│  │  (w-fit) │   (flex-grow)          │  (w-fit) │       │
│  └──────────┴────────────────────────┴──────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Border Radius & Elevation

### 4.1 Border Radius — Admin

```css
/* rounded-DEFAULT */ border-radius: 0.25rem;  /* Inputs, small buttons */
/* rounded-lg      */ border-radius: 0.5rem;   /* Standard cards */
/* rounded-xl      */ border-radius: 0.75rem;  /* Large panels, modals */
/* rounded-full    */ border-radius: 9999px;   /* Badges, toggles, avatars */
```

### 4.2 Border Radius — Player

```css
/* rounded-DEFAULT */ border-radius: 0.125rem; /* Minimal — sharp, precision look */
/* rounded-lg      */ border-radius: 0.25rem;  /* Media containers */
/* rounded-xl      */ border-radius: 0.5rem;   /* Widgets */
/* rounded-full    */ border-radius: 0.75rem;  /* Status pips */
```

### 4.3 Elevation Model (Admin)

| Level | ใช้กับ | CSS |
|-------|--------|-----|
| 0 — Base | Page background | `bg-surface-container-lowest (#0b0e14)` |
| 1 — Cards | Dashboard cards, list rows | `bg-surface (#10131a)` + `box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08)` |
| 2 — Modals/Overlays | Emergency Modal, Drawers | `backdrop-filter: blur(20px)` + `bg rgba(21,25,33,0.6)` + `border: 1px solid rgba(255,255,255,0.1)` |
| 3 — Floating | Tooltips, Dropdowns | `bg-surface-container-high` + `shadow-xl` |

### 4.4 Glass Card Pattern (ต้องใช้ทุก card)

```css
.glass-card {
  background: rgba(21, 25, 33, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}
```

---

## 5. Component Specifications

### 5.1 Sidebar Navigation

```
Structure:
  nav (fixed left-0 top-0, w-280px, h-full, z-40)
  ├── Logo Block (px-gutter, mb-stack-lg)
  │     ├── Icon (w-10 h-10 rounded-lg, bg-primary-container/20, border border-primary/30)
  │     ├── Title: "SmartSchool" (headline-md, bold, text-primary)
  │     └── Subtitle: "Admin Console" (label-md, text-on-surface-variant)
  ├── Nav List (flex-1 overflow-y-auto, px-unit)
  │     └── Nav Item (flex items-center gap-3, px-4 py-3, rounded-lg)
  │           ├── INACTIVE: text-on-surface-variant, hover:bg-surface-variant/20
  │           └── ACTIVE:   text-primary, bg-primary-container/10, border-r-2 border-primary
  └── Settings Item (mt-auto, pt-4, border-t border-white/5)

Icons (Material Symbols Outlined):
  Dashboard     → dashboard
  Media Library → perm_media
  Playlist      → playlist_add_check
  Scheduling    → calendar_today
  Screens       → monitor
  Control Panel → settings_remote
  Analytics     → analytics
  Settings      → settings
```

### 5.2 Topbar

```
Structure:
  header (fixed top-0 right-0 left-[280px], h-16, z-50)
  bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-md
  ├── Left: "SignageControl" (headline-md, font-extrabold)
  ├── Center: Search Input
  │     └── relative, span(search icon left-3) + input(w-full rounded-t-lg
  │           bg-surface-container-low, border-b border-outline-variant
  │           focus:border-primary, pl-10 py-2)
  └── Right: Notifications + Apps + Avatar
        ├── Button (p-2, text-on-surface-variant, hover:text-primary, rounded-full)
        └── Avatar (w-8 h-8, rounded-full, border border-outline-variant)
```

### 5.3 Screen Card

```
Structure:
  div (bg-surface rounded-xl overflow-hidden, card-inner-border, group relative)
  ├── Preview Image (h-32, relative)
  │     ├── bg-cover bg-center opacity-40 group-hover:opacity-60
  │     ├── gradient-to-t from-surface to-transparent (overlay)
  │     ├── Status Badge (absolute top-3 left-3)
  │     │     ├── ONLINE:  bg-emerald-400/10 border-emerald-400/20 text-emerald-400
  │     │     ├── OFFLINE: bg-surface-variant border-outline-variant text-on-surface-variant
  │     │     ├── SYNCING: bg-amber-400/10 border-amber-400/20 text-amber-400
  │     │     └── EMERGENCY: bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse
  │     └── Camera Button (absolute top-3 right-3, opacity-0 group-hover:opacity-100)
  └── Info Area (p-4)
        ├── Name (text-[18px] font-semibold) + Location (text-[12px] icon + text)
        ├── Tesla Toggle (right side of name row)
        └── Footer (mt-4 pt-4 border-t border-white/5, flex justify-between)
              ├── Last Sync (sync icon + "Xm ago" font-code text-[11px])
              └── Action Button (text-primary text-[12px] font-semibold)
                    "Assign Playlist" (online) | "Wake Device" (offline)
```

### 5.4 Tesla-Style Toggle Switch

```css
/* HTML */
<input type="checkbox" class="toggle-checkbox absolute block w-5 h-5 
  rounded-full bg-white border-4 border-surface appearance-none cursor-pointer 
  transition-transform duration-200 z-10" />
<label class="toggle-label block overflow-hidden h-5 rounded-full 
  bg-surface-variant cursor-pointer transition-colors duration-200"></label>

/* CSS */
.toggle-checkbox:checked { right: 0; border-color: #c0c1ff; }
.toggle-checkbox:checked + .toggle-label { background-color: #c0c1ff; }
```

### 5.5 Emergency Pulse Button

```css
.pulse-red { animation: pulse-red 2s infinite; }
@keyframes pulse-red {
  0%   { box-shadow: 0 0 0 0 rgba(255, 180, 171, 0.4); }
  70%  { box-shadow: 0 0 0 20px rgba(255, 180, 171, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 180, 171, 0); }
}
```

### 5.6 Status Badges (Pill Shape)

```
Online:    px-2 py-1 rounded-md bg-emerald-400/10 border border-emerald-400/20
           text-emerald-400 font-code text-[10px] uppercase font-bold
           + dot: w-1.5 h-1.5 rounded-full bg-emerald-400

Offline:   bg-surface-variant border-outline-variant text-on-surface-variant
           + dot: bg-outline (static, no animation)

Syncing:   bg-amber-400/10 border-amber-400/20 text-amber-400
           + dot: bg-amber-400 animate-pulse

Emergency: bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse
           + dot: bg-rose-400 animate-ping
```

---

## 6. Playlist Builder — Detailed Component Layout

### 6.1 Panel Structure

```
main (ml-[280px] mt-16, h-[calc(100vh-64px)], overflow-hidden)
├── TOP SECTION (flex-1, flex gap-gutter p-container-padding-desktop)
│   ├── MEDIA LIBRARY PANEL (w-80, glass-panel rounded-xl)
│   │   ├── Header (p-4 border-b, "Media Library" label + filter button)
│   │   └── Grid (flex-1 overflow-y-auto p-4, grid-cols-2 gap-3)
│   │       └── Media Card (cursor-move, rounded-lg, hover:border-primary/50
│   │                        hover:shadow-[0_0_15px_rgba(192,193,255,0.1)])
│   │           ├── Thumbnail (h-20, relative black bg)
│   │           │   ├── Duration badge (bottom-right, bg-black/70, font-code)
│   │           │   └── Type icon (top-left, material-symbols, white/70)
│   │           └── Info (p-2, filename truncate, resolution/type)
│   └── PREVIEW + INSPECTOR (flex-1, flex flex-col gap-4)
│       ├── Toolbar (playlist name + target info + Preview/Save buttons)
│       │   Save button: bg-primary shadow-[0_0_15px_rgba(192,193,255,0.2)]
│       ├── Preview Monitor (flex-1, glass-panel rounded-xl)
│       │   ├── Black canvas (bg-black, relative)
│       │   │   ├── Media preview image/video
│       │   │   ├── Safe area dashed border (absolute inset-[5%], border-dashed)
│       │   │   └── Playback Controls overlay (bottom, gradient-to-t from-black/80)
│       │   │       prev | PLAY (w-12 h-12 bg-primary rounded-full glow) | next
│       │   └── Stats bar (h-10, border-t, font-code text-xs)
│       │       "Live Engine Active" (emerald dot) | FPS | Timecode
│       └── INSPECTOR PANEL (w-64, bg-surface-container-low border-l)
│           Duration input | Scale/Fit select | Brightness/Contrast sliders
└── BOTTOM SECTION (h-72, glass-panel border-t)
    ├── Timeline Toolbar (h-12, justify-between)
    │   Left: "Sequence" label + tool buttons (add/cut/delete)
    │   Right: Loop toggle + Zoom slider (range input)
    └── Timeline Area (flex-1, flex)
        ├── Track Headers (w-48, bg-surface-container-low, border-r)
        │   Timecode header + V1 Main track + V2 Overlay track
        │   Each track: visibility + lock icons, left border color indicator
        └── Timeline Canvas (flex-1, overflow-x-auto)
            ├── Time Ruler (h-8, sticky top, timeline-track bg)
            │   Playhead: absolute, border-l border-error, triangle marker top
            │   Time labels: 00:10, 00:20...
            └── Track Content (relative w-[150%])
                ├── Clip (h-16 bg-primary/20 border-primary, resize handles)
                ├── Transition icon (w-8 h-8 -ml-4, hover dropdown picker)
                └── Overlay clip (h-12, bg-tertiary/10 border-tertiary/30)
```

### 6.2 Timeline CSS

```css
.timeline-track {
  background-image: repeating-linear-gradient(
    to right,
    rgba(255,255,255,0.05) 0,
    rgba(255,255,255,0.05) 1px,
    transparent 1px,
    transparent 40px
  );
}
/* Playhead line */
.playhead { border-left: 1px solid var(--error); }
.playhead-marker { border-l: 6px solid transparent; border-r: 6px solid transparent; border-t: 8px solid var(--error); }
```

---

## 7. Scheduling System — Timeline Grid

### 7.1 CSS Grid Structure

```css
.timeline-grid {
  display: grid;
  grid-template-columns: 80px repeat(24, 1fr);
  gap: 1px;
  background-color: rgba(255,255,255,0.05);
}
.time-slot {
  background-color: #10131a;
  border-right: 1px dashed rgba(255,255,255,0.05);
  min-height: 80px;
  position: relative;
}
.time-slot:hover { background-color: rgba(192,193,255,0.05); }
```

### 7.2 Event Block Styles

```css
.event-block {
  position: absolute; top: 4px; bottom: 4px;
  border-radius: 4px; padding: 4px 8px;
  font-size: 12px; font-weight: 500;
  cursor: grab; overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.2);
}
.priority-normal    { background: rgba(192,193,255,0.1); border-left: 3px solid #c0c1ff; color:#c0c1ff; }
.priority-event     { background: rgba(202,129,0,0.1);   border-left: 3px solid #ffb95f; color:#ffb95f; }
.priority-emergency { background: rgba(255,180,171,0.1); border-left: 3px solid #ffb4ab; color:#ffb4ab;
                      animation: pulse-border 2s infinite; }

@keyframes pulse-border {
  0%   { box-shadow: 0 0 0 0 rgba(255,180,171,0.4); }
  70%  { box-shadow: 0 0 0 4px rgba(255,180,171,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,180,171,0); }
}
```

### 7.3 Current Time Indicator

```html
<!-- เส้นสี Cyan แนวตั้งทับบน timeline -->
<div class="absolute top-0 bottom-0 w-px bg-secondary z-20 pointer-events-none" style="left: XX%;">
  <div class="absolute -top-1 -translate-x-1/2 bg-secondary text-on-secondary text-[10px] font-bold px-1 rounded">
    10:34
  </div>
</div>
```

---

## 8. Player — Fullscreen Mode UI

### 8.1 WebGL Shader Background

```glsl
/* Fragment Shader — slow undulating gradient (ป้องกัน OLED burn-in) */
void main() {
  vec2 uv = v_texCoord;
  float noise1 = sin(uv.x * 2.0 + u_time * 0.2) * 0.5 + 0.5;
  float noise2 = cos(uv.y * 3.0 - u_time * 0.3) * 0.5 + 0.5;
  vec3 color1 = vec3(0.06, 0.08, 0.12);  /* Deep surface */
  vec3 color2 = vec3(0.1, 0.12, 0.18);   /* Slightly brighter indigo */
  vec3 finalColor = mix(color1, color2, noise1 * noise2);
  float dist = distance(uv, vec2(0.5));
  finalColor *= smoothstep(1.0, 0.2, dist * 0.8);  /* vignette */
  gl_FragColor = vec4(finalColor, 1.0);
}
```

### 8.2 Sync Indicator (Top Right)

```html
<!-- Pulsing cyan dot + sync icon -->
<div class="w-4 h-4 rounded-full bg-secondary-fixed-dim pulse-animation 
            shadow-[0_0_12px_rgba(0,219,231,0.6)]"></div>
<span class="material-symbols-outlined">sync</span>

<style>
.pulse-animation {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .5; transform: scale(1.1); }
}
</style>
```

### 8.3 Bottom Ticker Bar (h-32)

```
footer (fixed bottom-0, bg-surface-container-lowest/90, backdrop-blur-md, border-t border-outline-variant/30)
├── Clock Section (border-r border-outline-variant/50, shrink-0, py-4)
│   ├── Time: font-display-title text-display-title text-primary tracking-tighter
│   ├── AM/PM: font-headline-lg text-on-surface-variant
│   └── Date: font-label-caps tracking-widest uppercase text-on-surface-variant
├── Scrolling Text (flex-grow)
│   └── font-headline-lg text-on-background font-semibold tracking-wide
│       animation: scroll-left 25s linear infinite
└── Weather Section (border-l border-outline-variant/50, shrink-0, py-4)
    ├── Weather icon: material-symbols text-[64px] text-tertiary-fixed-dim FILL=1
    └── Temperature: font-display-title text-on-surface tracking-tighter
```

### 8.4 Scrolling Text Animation

```css
.scrolling-text-container { overflow: hidden; white-space: nowrap; width: 100%; }
.scrolling-text {
  display: inline-block;
  padding-left: 100%;
  animation: scroll-left 25s linear infinite;
}
@keyframes scroll-left {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}
```

---

## 9. Player — Emergency Override UI

```
body (overflow: hidden)
├── main (flex-grow, bg-emergency-pulse, z-[9999], p-margin-page)
│   ├── Radial vignette overlay (opacity-20, pointer-events-none)
│   └── Center container (flex-col items-center justify-center, max-w-[80vw])
│       ├── Warning icon: material-symbols 240px FILL=1 wght=700 text-white
│       └── h1: font-display-hero text-display-hero text-white
│               tracking-tighter uppercase drop-shadow-2xl
└── footer (fixed bottom-0, h-24, bg-surface-container-lowest, border-t)
    └── p: font-headline-lg text-error uppercase font-bold tracking-wider
          animation: scrollTicker 15s linear infinite

/* Emergency pulse background */
@keyframes emergencyPulse {
  0%   { background-color: #93000a; }
  50%  { background-color: #690005; }
  100% { background-color: #93000a; }
}
.bg-emergency-pulse { animation: emergencyPulse 1.5s infinite; }

/* Ticker animation */
@keyframes scrollTicker {
  0%   { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}
.animate-scroll {
  display: inline-block;
  white-space: nowrap;
  animation: scrollTicker 15s linear infinite;
}
```

---

## 10. Custom Scrollbar (Dark Theme — ทุกหน้า)

```css
::-webkit-scrollbar       { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #0b0e14; }
::-webkit-scrollbar-thumb { background: #32353c; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #464554; }
```

---

## 11. Tailwind Config (ต้องตั้งค่าเหมือนต้นแบบ)

```js
// tailwind.config.js — Admin UI
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface-container-lowest': '#0b0e14',
        'surface-container-low':    '#191c22',
        'surface-container':        '#1d2026',
        'surface-container-high':   '#272a31',
        'surface-container-highest':'#32353c',
        'surface':                  '#10131a',
        'surface-bright':           '#363940',
        'on-surface':               '#e1e2eb',
        'on-surface-variant':       '#c7c4d7',
        'primary':                  '#c0c1ff',
        'primary-container':        '#8083ff',
        'on-primary':               '#1000a9',
        'secondary':                '#4cd7f6',
        'secondary-fixed-dim':      '#4cd7f6',
        'tertiary':                 '#ffb95f',
        'error':                    '#ffb4ab',
        'error-container':          '#93000a',
        'outline':                  '#908fa0',
        'outline-variant':          '#464554',
        'background':               '#10131a',
        'on-background':            '#e1e2eb',
        // ... (ครบตาม DESIGN.md tokens)
      },
      borderRadius: {
        DEFAULT: '0.25rem', lg: '0.5rem', xl: '0.75rem', full: '9999px',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    }
  }
}
```
