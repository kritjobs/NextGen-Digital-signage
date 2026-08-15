---
name: Aurelian Noir
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1c1c'
  surface-container: '#1f2020'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e4e2e1'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#e4e2e1'
  inverse-on-surface: '#303030'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#d1cec9'
  on-tertiary: '#31312d'
  tertiary-container: '#b5b3ae'
  on-tertiary-container: '#464541'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e5e2dc'
  tertiary-fixed-dim: '#c9c6c1'
  on-tertiary-fixed: '#1c1c18'
  on-tertiary-fixed-variant: '#474743'
  background: '#131313'
  on-background: '#e4e2e1'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  title-lg:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.5'
    letterSpacing: 0.05em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 80px
  margin-mobile: 24px
---

## Brand & Style
The design system embodies an ultra-modern, cinematic luxury aesthetic tailored for high-end hospitality and premium digital signage. It targets a discerning clientele, evoking feelings of exclusivity, tranquility, and effortless sophistication.

The style is **Minimalist-Glassmorphic**. It leverages expansive white space (or "dark space"), meticulous typographic hierarchy, and subtle translucent layers to create a sense of depth without clutter. High-contrast transitions and rich textures ground the digital experience in a physical, "expensive" reality.

## Colors
The palette is rooted in a high-contrast, "Dark Mode First" philosophy to mimic the atmosphere of a luxury hotel lobby or evening gala.

- **Primary (Gold):** Used sparingly for accents, active states, and call-to-action highlights. It should feel metallic and rich.
- **Secondary (Deep Charcoal):** The primary background color. It provides a deep, cinematic canvas that makes imagery and gold accents pop.
- **Tertiary (Ivory White):** Used primarily for typography and delicate separators to maintain high legibility and a soft touch.
- **Neutral (Obsidian):** Used for surface elevation, card backgrounds, and input fields to create subtle variance from the main background.

## Typography
The typographic strategy relies on the tension between a high-fashion Serif and a technical, sharp Sans-Serif.

- **Headlines:** Utilize *Playfair Display*. For large signage or hero sections, use tighter letter spacing to emphasize the "editorial" look.
- **Information & Body:** Utilize *Hanken Grotesk*. This provides the high-contrast clarity required for advertising and wayfinding.
- **Labels:** Always use uppercase with increased letter spacing (tracking) to denote luxury and architectural precision.

## Layout & Spacing
The layout follows a **Fixed Grid** model for web interfaces to maintain a centered, curated feel, while digital signage utilizes a **Fluid Model** with generous safe-area margins.

- **Rhythm:** All spacing must be multiples of 8px. Use large vertical gaps (80px+) between sections to create a "breathable" luxury pace.
- **Grid:** A 12-column grid on desktop with wide margins. On mobile, transition to a 4-column grid with increased gutters to prevent elements from feeling cramped.
- **Alignment:** Prefer asymmetrical layouts for editorial sections, but maintain strict vertical alignment for informational lists and menus.

## Elevation & Depth
This design system uses depth to simulate expensive materials like glass and polished stone.

- **Glassmorphism:** Apply a `backdrop-filter: blur(20px)` and a `20%` transparent charcoal fill to floating navigation bars and modals.
- **Shadows:** Avoid heavy black shadows. Use "Ambient Glows"—extra-diffused, low-opacity shadows (e.g., `0 20px 40px rgba(0,0,0,0.4)`) to make elements appear to hover gracefully.
- **Borders:** Use ultra-thin (1px) borders in Ivory at 10% opacity to define glass edges.

## Shapes
A consistent 16px corner radius (`rounded-lg` in this system) is applied to all primary containers, buttons, and cards. This softening of the "Ultra-Modern" aesthetic adds a layer of approachability and "tranquil" comfort. Smaller elements like chips or input fields use a 4px radius to maintain a sense of precision.

## Components
- **Buttons:** Primary buttons feature a solid Gold background with Charcoal text. Secondary buttons are "Ghost" style with an Ivory border and no fill.
- **Cards:** Use a Charcoal-to-Obsidian gradient with a subtle top-light border (1px Ivory at 15% opacity) to simulate a beveled edge.
- **Input Fields:** Minimalist underlines or very soft inset fills. Focus states are indicated by a thin Gold glow.
- **Signage Sliders:** High-resolution imagery should occupy the full background, with text overlays using the Glassmorphic treatment for legibility.
- **Navigation:** A floating, centered dock with a high blur radius, mimicking a high-end physical kiosk or mobile remote.