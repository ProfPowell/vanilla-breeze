# Design System Page — Plan

**Purpose:** A standalone HTML page that documents a brand's design choices for teams implementing with Vanilla Breeze. Not about VB itself — about *their* brand: logo, colors, type, spacing, components, voice.

**Audience:** Designers, developers, and stakeholders at an organization using VB. This page lives on their internal site or public docs, not on the VB doc site.

---

## What It Documents

### 1. Brand Identity

- Logo (primary, reversed, icon-only) via `<brand-mark>`
- Brand name, tagline, mission statement
- Logo usage guidelines (clear space, minimum size, don'ts)

### 2. Color System

- Brand palette (primary, secondary, accent) via `<color-palette>`
- Semantic colors (surface, text, border, states) via `<color-palette>`
- Status colors (success, warning, error, info)
- How the VB seed-and-derive model works for their hues
- Dark mode variants

### 3. Typography

- Font stacks (heading, body, mono) via `<type-specimen>`
- Type scale (xs through 5xl) — already built into `<type-specimen show-scale>`
- Weight scale (300–700)
- Character set coverage
- Line height and measure guidelines

### 4. Spacing and Sizing

- Spacing scale via `<spacing-specimen>`
- Content widths (narrow, normal, wide)
- Section padding
- Touch target minimums

### 5. Borders and Shapes

- Radius scale (xs through full)
- Border widths (thin, medium, thick)
- Shadow elevation scale (xs through 2xl)

### 6. Motion

- Duration tokens (instant through slower)
- Easing curves with animated previews via `<token-animation>`
- Reduced motion policy

### 7. Component Showcase

- Buttons (primary, secondary, ghost, destructive)
- Form elements (inputs, selects, checkboxes, radios)
- Cards, badges, alerts
- Navigation patterns
- All rendered with the brand's theme applied

### 8. Voice and Tone (optional)

- Writing style guidelines
- Do/don't examples
- Terminology glossary

---

## Existing VB Elements We Use

| Element | Section | Purpose |
|---------|---------|---------|
| `<brand-mark>` | Identity | Logo display with size variants |
| `<color-palette>` | Colors | Interactive swatches with copy-to-clipboard |
| `<type-specimen>` | Typography | Font preview, scale, weights, characters |
| `<spacing-specimen>` | Spacing | Visual bar chart of spacing tokens |
| `<token-swatch>` | Various | Individual token preview boxes |
| `<token-scale>` | Various | Grid-based scale visualization |
| `<token-preview>` | Various | Card-based token previews |
| `<token-animation>` | Motion | Animated easing function demos |
| `<layout-grid>` | Layout | Page section grid |
| `<layout-card>` | Layout | Section containers |
| `<layout-stack>` | Layout | Vertical rhythm |
| `<layout-center>` | Layout | Content centering |
| `<layout-cluster>` | Layout | Horizontal grouping |

## What May Be New

| Need | Status | Notes |
|------|--------|-------|
| Shadow specimen | New | Visual scale of box-shadows (like spacing-specimen but for shadows) |
| Radius specimen | New | Visual preview of border-radius values |
| Component sampler | New or compose | Styled component grid showing buttons, forms, cards with the brand theme |
| Do/Don't block | Compose | Two-column layout-card with green/red indicators — could be a pattern, not a component |

---

## Page Structure

```
┌──────────────────────────────────────────────────┐
│  Brand Identity                                   │
│  brand-mark · tagline · mission                   │
├──────────────────────────────────────────────────┤
│  Colors                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ Brand       │ │ Semantic    │ │ Status     │ │
│  │ color-      │ │ color-      │ │ color-     │ │
│  │ palette     │ │ palette     │ │ palette    │ │
│  └─────────────┘ └─────────────┘ └────────────┘ │
├──────────────────────────────────────────────────┤
│  Typography                                       │
│  type-specimen (heading font)                     │
│  type-specimen (body font)                        │
│  type-specimen (mono font)                        │
├──────────────────────────────────────────────────┤
│  Spacing · Borders · Shadows                      │
│  spacing-specimen · radius preview · shadow scale │
├──────────────────────────────────────────────────┤
│  Motion                                           │
│  duration tokens · easing demos                   │
├──────────────────────────────────────────────────┤
│  Component Showcase                               │
│  buttons · forms · cards · badges · alerts        │
├──────────────────────────────────────────────────┤
│  Voice and Tone (optional)                        │
│  writing guidelines · do/don't examples           │
└──────────────────────────────────────────────────┘
```

---

## Approach

The PoC (`poc.html`) demonstrates the page with a fictional brand ("Meridian Labs") to show what a completed design system page looks like. It uses only existing VB elements plus plain HTML/CSS for sections that don't have dedicated components yet.

Later, this could become:
- A `/scaffold-design-system` command that generates a customized page
- A VB theme showcase format (subset of this page)
- A printable PDF via VB's print styles
