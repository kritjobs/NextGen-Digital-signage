---
name: Cinematic Signage System
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#cfc2d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#988ca0'
  outline-variant: '#4d4354'
  surface-tint: '#ddb8ff'
  primary: '#ddb8ff'
  on-primary: '#490080'
  primary-container: '#9333ea'
  on-primary-container: '#f6e6ff'
  inverse-primary: '#861fdd'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#f9bd22'
  on-tertiary: '#402d00'
  tertiary-container: '#886500'
  on-tertiary-container: '#ffeac4'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f0dbff'
  primary-fixed-dim: '#ddb8ff'
  on-primary-fixed: '#2c0051'
  on-primary-fixed-variant: '#6800b4'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffdf9f'
  tertiary-fixed-dim: '#f9bd22'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  sidebar_width: 320px
  toolbar_height: 64px
  gutter: 16px
  safe_margin: 24px
---

## Brand & Style

This design system targets high-end creative professionals and enterprise marketing teams. The aesthetic is "Cinematic SaaS"—combining the utility of a production tool with the immersive qualities of premium hardware interfaces.

The visual direction leverages **Glassmorphism** and **High-Contrast Modernity**. The UI is intentionally recessed to allow the signage content to remain the focal point. Movement and depth are conveyed through layered translucency, ultra-fine borders, and vibrant neon accents that represent "digital energy" and AI-driven capabilities.

The system scales across three distinct service tiers:
- **Free:** Clean, functional, and utilitarian.
- **Pro:** Enhanced with vibrant neon gradients and sophisticated glass effects.
- **Enterprise:** Elevated with metallic luster, refined spacing, and serif-heavy editorial layouts.

## Colors

The palette is anchored in a deep charcoal-navy (`#0F172A`) to minimize interface glare in dark environments. 

- **Primary (Electric Purple):** Used for primary conversion points and creative controls.
- **Secondary (Cyan Glow):** Reserved for AI-powered "Magic" features and active playback states.
- **Enterprise Gold:** A tertiary metallic accent (`#FBBF24`) specifically for Enterprise-tier badges and exclusive UI components.
- **Functional Grays:** A range of low-saturation blues used for inactive states and secondary text to maintain a monochromatic, high-end feel.

## Typography

This design system uses a dual-font strategy:
1. **Inter:** The workhorse for all functional UI elements, labels, and property panels. It ensures high legibility at small sizes within dense toolbars.
2. **Playfair Display:** Utilized for high-end theme previews, premium titles, and Enterprise-tier marketing headers. It provides a "Luxury Editorial" feel that differentiates the product from standard grid-based SaaS tools.

For Pro and Enterprise tiers, use `label-caps` for all section headers in the properties panel to create a sense of architectural hierarchy.

## Layout & Spacing

The layout follows a **Fixed-Fluid hybrid model**:
- **Sidebars:** Fixed at 320px to accommodate complex property controls and media libraries.
- **Stage (Canvas):** Fluid area that maximizes the signage preview, respecting a 24px safe margin.
- **Timeline:** Anchored to the bottom with a 240px fixed height, allowing for horizontal scroll across tracks.

The spacing rhythm is based on an 8px base unit. Internal panel padding should be 16px (2 units), while large-scale layout separations should be 24px (3 units).

## Elevation & Depth

Depth is established through **Glassmorphism** rather than traditional drop shadows.
- **Level 1 (Base):** Solid `#0F172A`.
- **Level 2 (Panels):** 10% opacity white fill with a 20px Backdrop Blur. A 1px "Inner Glow" border (`rgba(255,255,255,0.1)`) must be applied to top and left edges to simulate light hitting the glass.
- **Level 3 (Popovers/Modals):** 20% opacity white fill, 40px Backdrop Blur, and a soft primary-tinted shadow (`rgba(0,0,0,0.5)`) to lift the element off the canvas.

## Shapes

The shape language is sophisticated and soft.
- **Standard UI (Buttons, Inputs):** 8px (`rounded-md`).
- **Containers (Cards, Panels):** 16px (`rounded-lg`).
- **Feature Highlights (Pills, Badges):** 999px (`rounded-full`).

Media cards must strictly maintain aspect ratio constraints (16:9, 9:16, or 4:3) with a clip-path applied to ensure content respects the 16px corner radius.

## Components

### Toolbar Icons
Icons should be 20px stroke-based (2px weight). For "Pro" users, active icons should glow with a 4px outer blur of the `primary` color.

### Media Cards
Must include a "Aspect Ratio Constraint" badge in the top-right. The footer of the card uses a 40% glass background to display file resolution and duration.

### AI 'Magic' Action Buttons
These use a horizontal gradient from `primary_color` to `secondary_color`. On hover, they should trigger a subtle shimmer animation and an increased shadow spread.

### Timeline Tracks
Tracks are horizontally striped with 2% white overlays. The "Playhead" is a 2px `secondary_color` vertical line with a 12px glow on either side.

### Theme Selector Grid
- **Free:** Solid borders.
- **Premium (Pro/Enterprise):** Labeled with a "Premium" badge using `label-caps` typography. Enterprise themes feature a 1px `tertiary_color_hex` (Gold) border.