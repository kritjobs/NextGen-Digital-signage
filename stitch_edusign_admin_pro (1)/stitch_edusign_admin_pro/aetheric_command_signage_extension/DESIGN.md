---
name: 'Aetheric Command: Signage Extension'
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c3c6d6'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#8d90a0'
  outline-variant: '#434654'
  surface-tint: '#b2c5ff'
  primary: '#b2c5ff'
  on-primary: '#002b73'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#0c56d0'
  secondary: '#ddfcff'
  on-secondary: '#00363a'
  secondary-container: '#00f1fe'
  on-secondary-container: '#006a70'
  tertiary: '#ffb59b'
  on-tertiary: '#5b1a00'
  tertiary-container: '#a33500'
  on-tertiary-container: '#ffc6b2'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#74f5ff'
  secondary-fixed-dim: '#00dbe7'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#812800'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 120px
    fontWeight: '800'
    lineHeight: 140px
    letterSpacing: -0.04em
  display-title:
    fontFamily: Inter
    fontSize: 80px
    fontWeight: '700'
    lineHeight: 96px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
  body-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 36px
  label-caps:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  margin-page: 64px
  gutter-large: 48px
  stack-gap: 24px
  widget-padding: 40px
---

## Brand & Style

The design system is engineered for high-impact, long-range legibility in professional and public environments. It prioritizes information density and visual clarity, ensuring that critical data is digestible from distances of up to 10 meters. 

The aesthetic is **High-Contrast Dark Minimalism**. By utilizing pure black foundations, the system maximizes OLED panel longevity and creates a "floating" effect for content, where hardware bezels disappear into the UI. The personality is authoritative, technical, and precise—reminiscent of mission control interfaces but optimized for modern commercial aesthetics.

## Colors

The palette is anchored by a **#000000 (Pure Black)** background to ensure infinite contrast ratios and power efficiency on digital displays. 

- **Primary Accents:** A deep, vibrant blue is used for critical interactive elements and branding.
- **Secondary Accents:** A bright cyan "glow" is reserved for active states, live indicators, or data highlights.
- **Surface Tiers:** While the base is pure black, secondary containers use a subtle #121212 to provide depth without breaking the high-contrast requirement.
- **Success/Warning:** Use high-vibrancy greens and ambers only for status indicators, ensuring they stand out against the monochromatic base.

## Typography

This design system utilizes **Inter** exclusively for its neutral, highly legible glyphs and excellent performance at extreme scales.

- **Scale:** The hierarchy is dramatically expanded for signage. The "Display-Hero" scale is the primary anchor for time and headline news.
- **Weight:** Use Bold (700) or ExtraBold (800) for all display levels to maintain visual weight against high-brightness backlights.
- **Legibility:** Tracking (letter spacing) is tightened for large display headers to maintain cohesion, while smaller labels use increased tracking for readability at a distance.

## Layout & Spacing

The layout follows a **Rigid Grid System** designed for 16:9 and 9:16 aspect ratios. 

- **Safe Zones:** A mandatory 64px margin is applied to all edges to account for physical bezel encroachment or screen overscan.
- **Gutter Strategy:** A 48px gutter is maintained between major UI zones (e.g., between the Media Container and the Sidebar).
- **Rhythm:** Spacing follows an 8px base unit, but component-to-component gaps should never drop below 24px to prevent visual clutter when viewed from afar.

## Elevation & Depth

Elevation in this design system is expressed through **stroke and luminosity** rather than traditional soft shadows, which can appear muddy on large-format hardware.

- **Outlines:** Use 1px or 2px solid borders (#FFFFFF at 10-20% opacity) to define container boundaries against the pure black background.
- **Internal Glows:** Critical widgets may use a subtle inner-glow of the primary color to indicate "Live" or "Active" status.
- **Z-Axis:** Content that overlaps (like alerts or emergency broadcasts) should use a #121212 surface with a 10% white border to clearly separate from the background.

## Shapes

The design system employs a **Soft (0.25rem)** roundedness for standard elements. This maintains a professional, architectural feel while slightly softening the "harshness" of the high-contrast colors. Larger widgets and media containers use `rounded-lg` (0.5rem) to create a distinct visual frame for photography and video.

## Components

- **Ticker Bar:** A full-width horizontal strip at the bottom of the screen. Use a #121212 background with a 1px top border. Scrolling text must use `headline-lg` weight for motion clarity.
- **Large Clock:** Usually occupies a corner or a dedicated "Display-Hero" slot. Seconds should be displayed in a lighter weight or smaller scale to de-emphasize them compared to hours and minutes.
- **Weather Widget:** Uses high-stroke iconography. Temperature is set in `display-title`. Secondary data (humidity, wind) uses `label-caps`.
- **Media Container:** A dedicated area for video or image playback. It should have a 1px interior border to separate imagery from the black background.
- **Emergency Alert:** A high-visibility override component using a solid Primary Color background with Black text to immediately draw attention.
- **Status Indicators:** Small, circular "pips" that pulse using the Secondary Cyan color to indicate network connectivity or data refresh.