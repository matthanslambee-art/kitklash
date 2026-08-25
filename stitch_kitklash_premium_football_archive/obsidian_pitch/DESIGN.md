---
name: Obsidian Pitch
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
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c7c6c6'
  on-secondary: '#303031'
  secondary-container: '#464747'
  on-secondary-container: '#b5b5b5'
  tertiary: '#ffffff'
  on-tertiary: '#313030'
  tertiary-container: '#e5e2e1'
  on-tertiary-container: '#656464'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e3e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
  pitch-black: '#000000'
  charcoal-depth: '#0A0A0A'
  stadium-grey: '#262626'
  kit-accent-red: '#DA0000'
typography:
  display-xl:
    fontFamily: Chivo
    fontSize: 80px
    fontWeight: '900'
    lineHeight: 88px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Chivo
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Chivo
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Chivo
    fontSize: 24px
    fontWeight: '700'
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
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
  price-display:
    fontFamily: Chivo
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

The design system is built on a "Dark Room Editorial" aesthetic, merging the grit of vintage football culture with the precision of luxury fashion. It targets a discerning collector who views jerseys as historical artifacts rather than just sportswear.

The style is **Minimalist with a High-Contrast/Bold edge**. It relies on aggressive whitespace, architectural alignment, and a total absence of decorative flourishes like gradients or drop shadows. The emotional response should be one of exclusivity, authority, and reverence for the "beautiful game." Visual interest is generated through scale contrast in typography and the tactile quality of product photography against pure black voids.

## Colors

The palette is strictly monochromatic to ensure the vibrant colors of the vintage jerseys remain the sole focus of the interface. 

- **Pitch Black (#000000):** Used for the primary background to create an infinite depth effect.
- **Charcoal Depth (#0A0A0A):** Used for secondary containers or subtle section breaks.
- **Primary White (#FFFFFF):** Reserved for primary headings and essential navigation.
- **Secondary Grey (#8A8A8A):** Used for body text and metadata to establish hierarchy and reduce visual fatigue.
- **Kit Accent Red (#DA0000):** Used sparingly only for "Sold Out" status or urgent functional alerts.

## Typography

Typography follows an editorial hierarchy. **Chivo** provides a sharp, masculine energy for headlines, utilizing heavy weights to anchor the page. **Inter** handles all long-form content and UI labels for maximum legibility. **JetBrains Mono** is introduced for technical metadata (e.g., season years, fabric condition, SKU numbers) to evoke the feeling of a curator's archive or a technical spec sheet.

- **Scale:** Use dramatic scale jumps. Pair `display-xl` with `label-sm` to create visual tension.
- **Alignment:** Headlines should often be left-aligned with tight tracking for a modern, compressed feel.

## Layout & Spacing

This design system uses a **Fixed Grid** model for desktop and a **Fluid** model for mobile. 

- **Grid:** A 12-column grid with generous 64px outer margins on desktop. 
- **Rhythm:** Spacing follows a strict 8px base unit. Negative space is used as a luxury element—sections should have a minimum vertical padding of 120px on desktop to allow the product photography to breathe.
- **Adaptive Strategy:** On mobile, margins shrink to 20px, and the 12-column grid collapses to a 2-column grid for product feeds to maintain image detail.

## Elevation & Depth

This system rejects traditional shadows. Depth is created through **Tonal Layers** and **Low-contrast Outlines**:

- **Surfaces:** Level 0 is `#000000`. Level 1 (cards/modals) is `#0A0A0A`.
- **Borders:** Elements are defined by 1px solid borders using `#262626` (Stadium Grey). This creates a sophisticated "blueprint" feel without the bulk of shadows.
- **Interactions:** Hover states should involve a simple color shift (e.g., from `#8A8A8A` to `#FFFFFF`) or a slight scale increase of the image within a clipped container.

## Shapes

The shape language is **Sharp (0px)**. Every UI element, including buttons, input fields, and product cards, must have perfectly square corners. This reinforces the masculine, architectural, and high-end editorial aesthetic. Roundness is reserved strictly for the circular shapes within the football jerseys themselves (badges, collars).

## Components

- **Buttons:** Primary buttons are solid `#FFFFFF` with `#000000` text, using `label-sm` typography. Secondary buttons are 1px white borders with no fill.
- **Product Cards:** Full-bleed imagery with no visible border until hover. Price and Title sit outside the image container using `price-display` and `body-md`.
- **Input Fields:** Bottom-border only (1px solid `#262626`). Label sits above in `label-sm`. Focus state changes the border color to `#FFFFFF`.
- **Chips/Badges:** Small, rectangular boxes with 1px solid borders. Used for "Rare," "Mint," or "1990s" tags.
- **Lists:** Clean rows separated by 1px solid horizontal lines. No zebra striping.
- **Jerseys Showcase:** An oversized "Spec View" for product pages, utilizing high-resolution zoom capabilities against the pure black background.