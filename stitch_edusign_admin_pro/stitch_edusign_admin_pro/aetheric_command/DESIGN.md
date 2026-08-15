---
name: Aetheric Command
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363940'
  surface-container-lowest: '#0b0e14'
  surface-container-low: '#191c22'
  surface-container: '#1d2026'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2eb'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e1e2eb'
  inverse-on-surface: '#2e3037'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#10131a'
  on-background: '#e1e2eb'
  surface-variant: '#32353c'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  code:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding-desktop: 32px
  container-padding-tablet: 24px
  gutter: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for high-stakes school administration and real-time digital signage control. It balances the precision of an aerospace cockpit with the elegance of premium consumer hardware. The aesthetic is rooted in **Modern Minimalism** with a heavy influence from **Glassmorphism**, creating a sense of depth and focus essential for enterprise-grade monitoring.

The target audience consists of IT administrators and facility managers who require immediate clarity and low cognitive load. The UI evokes a sense of "quiet power"—it is dark, unobtrusive, and highly responsive, ensuring that critical information and emergency alerts command attention through vibrant accents rather than visual clutter.

## Colors

The palette is optimized for dark-room environments and long-duration monitoring. 
- **Primary:** An Electric Indigo used for primary actions and brand presence.
- **Accents:** Cyan is reserved for data highlights and navigational active states, while Orange signifies high-priority system states.
- **Surfaces:** A multi-layered charcoal approach. The deepest black (#0B0E14) acts as the canvas, while the surface color (#151921) provides the base for interactive containers.
- **Semantic Colors:** Emerald, Amber, and Rose follow industry-standard patterns but are tuned for high luminosity against the dark background to ensure accessibility and immediate recognition of system health.

## Typography

This design system utilizes **Inter** for its exceptional legibility on digital displays and its neutral, systematic character. The typographic scale prioritizes hierarchy through weight and subtle letter-spacing adjustments.

- **Headlines:** Use Bold weights (700) and negative letter-spacing to create a "locked-in" professional look for dashboard titles.
- **Body:** Standardized at 16px for optimal readability across desktop and tablet interfaces.
- **Labels:** Small caps and increased tracking (0.05em) are applied to metadata and category headers to distinguish them from interactive content.
- **Mobile Scaling:** Headline sizes automatically downscale on touch devices to preserve screen real estate while maintaining a clear information architecture.

## Layout & Spacing

The layout operates on an **8px base grid**, ensuring mathematical harmony across all components. For the admin dashboard, a **fluid grid** is utilized to maximize the utility of ultra-wide monitors and tablet orientations.

- **Desktop:** 12-column grid with 24px gutters. Sidebars are fixed at 280px to maintain consistent navigation.
- **Tablet:** 8-column grid with 24px gutters. Interaction targets are scaled to a minimum of 44px to ensure touch-friendly operation for campus security or mobile staff.
- **Rhythm:** Vertical spacing follows a "Stack" model (8px, 16px, 32px) to clearly group related information blocks versus distinct sections.

## Elevation & Depth

Depth is conveyed through a combination of **Tonal Layering** and **Glassmorphism**. Rather than traditional heavy shadows, this design system uses light and translucency to indicate hierarchy:

- **Level 0 (Base):** Deep Charcoal (#0B0E14). The foundation layer.
- **Level 1 (Cards):** Surface color (#151921) with a 1px inner border (10% opacity white) to simulate a chamfered edge.
- **Level 2 (Modals/Overlays):** Glassmorphic surfaces using `backdrop-filter: blur(20px)` and a semi-transparent fill. This allows the background content to remain visible while focusing the user's attention.
- **Shadows:** Only used on floating elements. Shadows should be ultra-diffused, using a 20% opacity black with a 40px blur, creating an "ambient" lift rather than a harsh drop-shadow.

## Shapes

The shape language is sophisticated and approachable. All primary containers and cards utilize a **16px radius (rounded-lg)** to evoke a modern hardware feel. 

- **Buttons & Inputs:** Use the standard 8px (rounded-md) for a precise, tool-like appearance.
- **Status Indicators:** Fully rounded (pill-shaped) for badges and toggles.
- **Inner Elements:** When nesting elements (e.g., a button inside a card), the inner radius should be 8px to maintain visual concentricity with the 16px outer card.

## Components

### Buttons
- **Primary:** Electric Indigo fill with white text. High-contrast, bold weight.
- **Secondary:** Ghost style with a 1px border of the Primary color.
- **Touch-Targets:** All buttons on tablet view must maintain a 48px height.

### Cards
- Cards are the primary container. They feature a subtle 1px border (#ffffff at 8% opacity).
- Dashboard cards should utilize the Glassmorphism effect when overlaying live video feeds or map data.

### Input Fields
- Dark backgrounds (#0B0E14) with a subtle bottom border or 1px stroke. 
- Active states use the Cyan accent for the border and a subtle outer glow (Cyan at 20% opacity).

### Chips & Badges
- Used for signage status (Online, Offline, Emergency).
- **Online:** Emerald text with a 10% Emerald background tint.
- **Emergency:** Pulsing Rose Red background to demand immediate action.

### Lists
- High-density lists for device management. Rows are separated by 1px borders (#ffffff at 4% opacity). Hover states use a 4% white overlay to subtly lift the row.

### Toggle & Selection
- Custom radio buttons and checkboxes using the Primary Indigo color for selected states. Switches are preferred for signage "Power" states, using the Tesla-inspired minimalist toggle style.