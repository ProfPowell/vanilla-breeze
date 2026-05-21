---
title: Vanilla Breeze Brand Theme System — Demo Site Specification
description: Spec for a theme switcher that applies real corporate brand identities to the Alpenglow Gear demo site, exercising VB's theming system against authentic brand constraints.
date: 2025-03-07
tags:
  - vanilla-breeze
  - theming
  - brand
  - specification
---

# Vanilla Breeze Brand Theme System — Demo Site Specification

The Alpenglow Gear demo site includes a theme switcher that replaces the conventional light/dark/system toggle with something more revealing: the ability to skin the entire site — including all forms — as if it were a real corporate product. This tests whether Vanilla Breeze's token system is expressive enough to fully satisfy authentic brand guidelines, not just aesthetic preferences.

## Purpose

Corporate brand systems are the hardest real-world constraint a design token system will face. They prescribe exact colors, specific typefaces, precise border radii, defined spacing rhythms, and opinionated component behaviors. If VB can render a convincing Anthropic portal, a McDonald's intranet, and an IBM enterprise application — all from the same HTML, changing only a CSS layer — the theming system is proven.

A secondary goal is form fidelity. Each brand has a distinctive approach to form design. The switcher lets us verify that VB's form tokens are flexible enough to express all of them without fighting the framework.

---

## Table of Contents

- [Switcher Mechanism](#switcher-mechanism)
- [Theme Modes](#theme-modes)
- [Brand Profiles](#brand-profiles)
  - [Mode 0: Raw HTML](#mode-0-raw-html)
  - [Mode 1: Vanilla Breeze Default](#mode-1-vanilla-breeze-default)
  - [Mode 2: Anthropic](#mode-2-anthropic)
  - [Mode 3: McDonald's Corporation](#mode-3-mcdonalds-corporation)
  - [Mode 4: IBM](#mode-4-ibm)
- [Brand-Mark Component](#brand-mark-component)
- [Token Mapping Strategy](#token-mapping-strategy)
- [Implementation Approach](#implementation-approach)
- [Evaluation Criteria](#evaluation-criteria)

---

## Switcher Mechanism

The switcher is a persistent floating widget — not part of the primary navigation — positioned fixed in the bottom-right corner of the viewport. It is explicitly a developer/demo tool, not a feature presented to the fictional "user" of Alpenglow Gear.

```html
<theme-switcher role="region" aria-label="Demo theme switcher">
  <button aria-expanded="false" aria-controls="theme-options">
    <span aria-hidden="true">🎨</span>
    <span class="visually-hidden">Switch demo theme</span>
  </button>
  <fieldset id="theme-options" hidden>
    <legend>Demo Theme</legend>
    <label><input type="radio" name="demo-theme" value="raw"> Raw HTML</label>
    <label><input type="radio" name="demo-theme" value="vb" checked> Vanilla Breeze</label>
    <label><input type="radio" name="demo-theme" value="anthropic"> Anthropic</label>
    <label><input type="radio" name="demo-theme" value="mcdonalds"> McDonald's</label>
    <label><input type="radio" name="demo-theme" value="ibm"> IBM</label>
  </fieldset>
</theme-switcher>
```

### Switching Mechanism

Theme selection sets a `data-theme` attribute on `<html>`:

```javascript
document.documentElement.dataset.theme = selectedValue;
```

Each theme is an `@layer` that is activated via `:root[data-theme="..."]` selectors. The switcher persists selection to `localStorage` and restores on load.

```css
/* Theme layers declared in order — later layers win */
@layer vb.reset, vb.base, vb.components, vb.theme.raw, vb.theme.vb,
       vb.theme.anthropic, vb.theme.mcdonalds, vb.theme.ibm;
```

Raw HTML mode works differently — see [Mode 0](#mode-0-raw-html).

### Font Loading Strategy

Each brand theme may require a different typeface. All brand fonts are loaded speculatively in `<head>` with `media="print" onload="this.media='all'"` to avoid blocking render. The active theme's font is promoted to `font-display: swap`.

```html
<!-- All brand fonts preloaded, inactive ones deferred -->
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter..." as="style">
<link rel="preload" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans..." as="style">
```

---

## Theme Modes

| Mode | Name | Purpose |
|------|------|---------|
| 0 | Raw HTML | Browser defaults only — no VB, no brand |
| 1 | Vanilla Breeze | VB default design system |
| 2 | Anthropic | AI/tech brand — minimal, warm neutrals |
| 3 | McDonald's | Consumer corporate — bold, high-contrast |
| 4 | IBM | Enterprise tech — structured, systematic |

---

## Brand Profiles

### Mode 0: Raw HTML

**Activation:** `data-theme="raw"` disables all VB stylesheets via a `<link disabled>` toggle in JS. Only the browser's user-agent stylesheet applies.

**Purpose:** Establishes the semantic HTML baseline. If the page is navigable and comprehensible in raw HTML mode, the markup is sound. This mode is the progressive enhancement proof.

**What to observe:**
- All forms are functional (native browser controls, visible labels)
- All navigation works (plain `<a>` links)
- All content is readable (browser serif, appropriate heading sizes)
- No layout collapses into an unusable state

**Notes:** The `<brand-mark>` component falls back to its text content (the site name). Image logos do not display.

---

### Mode 1: Vanilla Breeze Default

**Activation:** `data-theme="vb"` (default on load)

**Purpose:** The baseline styled experience. All VB tokens at their default values. This is the reference point from which brand themes deviate.

**Brand mark:** VB wordmark / the Alpenglow Gear text logo.

---

### Mode 2: Anthropic

**Brand essence:** Considered, calm, intellectually serious. The brand lives in warm off-white and dark charcoal, punctuated by a signature terracotta/coral accent. Typography is measured and unhurried. Forms are clean but not cold.

#### Color Tokens

| Token | Value | Notes |
|-------|-------|-------|
| `--color-bg` | `#FAF9F7` | Warm off-white, not pure white |
| `--color-surface` | `#FFFFFF` | Card/panel backgrounds |
| `--color-surface-raised` | `#F5F3F0` | Subtle elevation |
| `--color-border` | `#E5E2DD` | Warm gray border |
| `--color-text` | `#1A1A1A` | Near-black body text |
| `--color-text-subtle` | `#6B6B6B` | Secondary/hint text |
| `--color-brand` | `#CC785C` | Anthropic terracotta/coral |
| `--color-brand-hover` | `#B5674D` | Darker on hover |
| `--color-brand-subtle` | `#F5EBE6` | Tint for highlights |
| `--color-brand-text` | `#FFFFFF` | Text on brand color |
| `--color-focus` | `#CC785C` | Focus ring matches brand |

#### Typography

| Token | Value |
|-------|-------|
| `--font-sans` | `"Styrene B", "Inter", system-ui, sans-serif` |
| `--font-serif` | `"Tiempos Text", Georgia, serif` |
| `--font-size-base` | `1rem` (16px) |
| `--line-height-prose` | `1.7` |
| `--font-weight-heading` | `500` (medium, not heavy) |
| `--letter-spacing-heading` | `-0.02em` |

> Note: Styrene B and Tiempos are licensed fonts. Use Inter + Georgia as open equivalents in the demo. The token names match the brand; the fallbacks are pragmatic.

#### Form Character

Anthropic forms are **spacious and deliberate**. They do not rush the user.

- Input height: `3rem` (48px) — taller than VB default
- Border radius: `0.375rem` (6px) — slightly rounded, not pill
- Border color: `--color-border` at rest; `--color-brand` on focus
- Focus ring: `2px solid var(--color-brand)` with `2px offset` — no box-shadow approach
- Label position: above input, `font-size: 0.875rem`, `font-weight: 500`
- Error state: left border `4px solid #D93025` + error message below in `#D93025`
- Placeholder text: `--color-text-subtle`, never used as a substitute for label
- Submit button: solid terracotta, `border-radius: 0.375rem`, `padding: 0.75rem 2rem`, medium weight text

#### Brand Mark

```html
<brand-mark src="/themes/anthropic/logo.svg" alt="Anthropic" wordmark>
  Anthropic
</brand-mark>
```

The Anthropic logo is a geometric "A" mark. In the demo, use an SVG recreation or the official SVG if available under fair use for brand demonstration purposes.

---

### Mode 3: McDonald's Corporation

**Brand essence:** McDonald's corporate design (not the consumer-facing restaurant experience) is disciplined, accessible, and unambiguous. The intranet and supplier portal aesthetic applies brand colors with restraint — the Golden Arches yellow is used as accent, not wallpaper. Forms are direct, no-nonsense, and optimized for speed.

#### Color Tokens

| Token | Value | Notes |
|-------|-------|-------|
| `--color-bg` | `#FFFFFF` | Clean white |
| `--color-surface` | `#FFFFFF` | |
| `--color-surface-raised` | `#F5F5F5` | Light gray panels |
| `--color-border` | `#DDDDDD` | Neutral gray |
| `--color-text` | `#292929` | Corporate dark |
| `--color-text-subtle` | `#767676` | Secondary, AA compliant on white |
| `--color-brand` | `#DA291C` | McDonald's Red (primary corporate CTA) |
| `--color-brand-hover` | `#B82317` | Darker red |
| `--color-brand-subtle` | `#FFF0EF` | Red tint |
| `--color-brand-text` | `#FFFFFF` | |
| `--color-accent` | `#FFC72C` | Golden Arches yellow — used sparingly |
| `--color-accent-dark` | `#DB8C00` | Yellow darkened for text use (contrast) |
| `--color-focus` | `#DA291C` | |

> The yellow `#FFC72C` fails contrast on white for text at normal sizes. It is used only as a decorative/background accent token, never for text. `--color-accent-dark` is provided for any text-on-yellow needs.

#### Typography

| Token | Value |
|-------|-------|
| `--font-sans` | `"Speedee", "Arial", "Helvetica Neue", sans-serif` |
| `--font-size-base` | `1rem` |
| `--line-height-prose` | `1.5` |
| `--font-weight-heading` | `700` — bold and assertive |
| `--letter-spacing-heading` | `0` |

> Speedee is McDonald's proprietary typeface. Arial is the correct system fallback — McDonald's brand guidelines specify it. Do not substitute a different geometric sans.

#### Form Character

McDonald's corporate forms are **efficient and no-frills**. They assume a power user who fills out forms repeatedly (suppliers, franchisees, staff).

- Input height: `2.5rem` (40px) — compact
- Border radius: `2px` — nearly square corners
- Border: `1px solid #DDDDDD` at rest; `2px solid #DA291C` on focus (border swap, not outline)
- Label position: above input, `font-size: 0.875rem`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.05em`
- Required marker: red asterisk `*` immediately after label text (no space), visually prominent
- Error state: red border `2px solid #DA291C`, error icon (⚠) + message inline below input
- Submit button: solid McDonald's Red, `border-radius: 2px`, `text-transform: uppercase`, `letter-spacing: 0.08em`, `font-weight: 700`
- Section headings within forms: `font-size: 1rem`, `font-weight: 700`, `text-transform: uppercase`, `border-bottom: 2px solid --color-accent`

#### Accent Usage

The Golden Arches yellow appears in:
- The header bar background (full-width strip, dark text logo on yellow)
- Section dividers within forms (the `border-bottom` described above)
- Active state on navigation items
- Nowhere else — it is a signal color, not a fill color

#### Brand Mark

```html
<brand-mark src="/themes/mcdonalds/arches.svg" alt="McDonald's" stacked>
  McDonald's
</brand-mark>
```

The Golden Arches `M` on a red background block. In the header yellow-bar context, use the red-on-yellow variant.

---

### Mode 4: IBM

**Brand essence:** IBM's Carbon Design System is one of the most comprehensive and codified design systems in enterprise software. It is grid-obsessed, systematic, and prioritizes information density without visual noise. Forms are precise instruments.

#### Color Tokens

IBM uses a multi-tier gray scale plus a single blue family for interactive elements.

| Token | Value | Notes |
|-------|-------|-------|
| `--color-bg` | `#F4F4F4` | IBM Gray 10 — never pure white |
| `--color-surface` | `#FFFFFF` | White — elevated surfaces only |
| `--color-surface-raised` | `#E0E0E0` | Gray 20 — panels, sidebars |
| `--color-border` | `#8D8D8D` | Gray 50 — IBM uses relatively dark borders |
| `--color-border-subtle` | `#C6C6C6` | Gray 30 — secondary borders |
| `--color-text` | `#161616` | Gray 100 — primary text |
| `--color-text-subtle` | `#525252` | Gray 70 — secondary text |
| `--color-brand` | `#0F62FE` | IBM Blue 60 — the only brand color |
| `--color-brand-hover` | `#0050E6` | Blue 70 — hover |
| `--color-brand-subtle` | `#EDF5FF` | Blue 10 — tinted backgrounds |
| `--color-brand-text` | `#FFFFFF` | |
| `--color-focus` | `#0F62FE` | Same blue, `inset` box-shadow approach |
| `--color-danger` | `#DA1E28` | Red 60 — errors only |
| `--color-success` | `#198038` | Green 60 |
| `--color-warning` | `#F1C21B` | Yellow 30 |

#### Typography

| Token | Value |
|-------|-------|
| `--font-sans` | `"IBM Plex Sans", "Arial", sans-serif` |
| `--font-mono` | `"IBM Plex Mono", "Courier New", monospace` |
| `--font-size-base` | `0.875rem` (14px) — IBM uses 14px body |
| `--font-size-sm` | `0.75rem` (12px) |
| `--line-height-prose` | `1.5` |
| `--font-weight-heading` | `600` — semibold |
| `--letter-spacing-heading` | `0` |

> IBM Plex Sans is open source (SIL OFL). Load from Google Fonts: `family=IBM+Plex+Sans:wght@300;400;600`. IBM Plex Mono for code blocks.

#### Form Character

IBM Carbon forms are the most codified of the three brands. Every measurement is on a `8px` base grid. Forms feel like precision instruments.

- Input height: `2.5rem` (40px) on `8px` grid
- Border radius: `0` — Carbon uses zero border radius on inputs and buttons
- Border: `1px solid #8D8D8D` at rest; no border change on focus
- Focus ring: `2px solid #0F62FE` inset (`box-shadow: inset 0 0 0 2px #0F62FE`) — this is Carbon's signature focus approach
- Label position: above input, `font-size: 0.75rem` (12px), `font-weight: 400`, `color: #525252` — labels are secondary to the input value
- Helper text: below input, `font-size: 0.75rem`, `color: #525252`
- Error state: `box-shadow: inset 0 0 0 2px #DA1E28` + error icon inside the input trailing edge + red helper text
- Disabled state: `background: #C6C6C6`, `color: #8D8D8D`, `cursor: not-allowed`
- Submit button: `border-radius: 0`, `padding: 0.875rem 4rem 0.875rem 1rem` — Carbon buttons have asymmetric padding with the icon on the right
- Button icon: chevron-right SVG aligned right inside the button (CSS `background-image` or inline SVG)
- Select: styled with custom chevron, `border-radius: 0`, matching input height

#### Grid System Note

IBM Carbon is built on a `8px` base grid with a `16-column` fluid grid. The VB layout grid should be set to `16 columns` when the IBM theme is active. This means the IBM theme token includes:

```css
:root[data-theme="ibm"] {
  --grid-columns: 16;
  --grid-gutter: 2rem; /* 32px — Carbon's default gutter */
  --grid-margin: 1rem; /* Grows at breakpoints per Carbon spec */
}
```

#### Brand Mark

```html
<brand-mark src="/themes/ibm/ibm-logo.svg" alt="IBM">
  IBM
</brand-mark>
```

The IBM logo is the 8-bar horizontal stripe wordmark. It must appear in `#0F62FE` (IBM Blue) on white, or in white on a dark surface. Never on a colored background.

---

## Brand-Mark Component

The existing `<brand-mark>` element handles the site logotype in the header and footer. Currently it renders text only. Brand themes require the ability to display an image mark (SVG or raster logo) that replaces or accompanies the text.

### Current Behavior

```html
<brand-mark>Alpenglow Gear</brand-mark>
```

Renders the text wordmark styled with the active theme's heading tokens.

### Required Changes

#### New Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `src` | URL | Path to the logo image file (SVG preferred) |
| `alt` | String | Alt text for the image (required when `src` present) |
| `wordmark` | Boolean | Show text wordmark alongside the image mark |
| `stacked` | Boolean | Stack image above text (vs. inline side-by-side) |
| `height` | Number | Explicit height in pixels for the image mark |

#### Rendering Logic

```
src present?
├── YES → render <img src alt> as the mark
│   wordmark present?
│   ├── YES → render text alongside/below the image
│   └── NO  → image only (text content becomes aria-label on the link wrapper)
└── NO  → render text content as before (current behavior)
```

When `src` is absent, the element falls back to text rendering exactly as today — no regression.

#### Updated Element Schema

```json
{
  "brand-mark": {
    "flow": true,
    "phrasing": false,
    "permittedContent": ["@phrasing"],
    "attributes": {
      "src": {
        "required": false
      },
      "alt": {
        "required": false
      },
      "wordmark": {
        "boolean": true
      },
      "stacked": {
        "boolean": true
      },
      "height": {
        "required": false
      }
    }
  }
}
```

#### HTML Rendering (JS-enhanced)

Without JS, `<brand-mark src="..." alt="Logo">Brand Name</brand-mark>` should render legibly. The JS enhancement upgrades it to a proper `<img>` + optional text wrapper:

```javascript
class BrandMark extends HTMLElement {
  connectedCallback() {
    const src = this.getAttribute('src');
    const alt = this.getAttribute('alt') ?? this.textContent.trim();
    const showWordmark = this.hasAttribute('wordmark');
    const stacked = this.hasAttribute('stacked');
    const height = this.getAttribute('height');

    if (!src) return; // Text-only fallback — do nothing

    const img = document.createElement('img');
    img.src = src;
    img.alt = showWordmark ? '' : alt; // Decorative if wordmark text is shown
    if (height) img.height = parseInt(height, 10);
    img.decoding = 'async';

    if (showWordmark) {
      const text = document.createElement('span');
      text.className = 'brand-mark__wordmark';
      text.textContent = this.textContent.trim();
      this.replaceChildren(img, text);
    } else {
      this.replaceChildren(img);
    }

    if (stacked) this.dataset.layout = 'stacked';
  }
}

customElements.define('brand-mark', BrandMark);
```

#### CSS

```css
brand-mark {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

brand-mark[data-layout="stacked"] {
  flex-direction: column;
  align-items: flex-start;
}

brand-mark img {
  display: block;
  height: var(--brand-mark-height, 2rem);
  width: auto;
}

brand-mark .brand-mark__wordmark {
  font-family: var(--font-sans);
  font-weight: var(--font-weight-heading);
  font-size: var(--font-size-lg);
  line-height: 1;
}

/* Theme overrides */
:root[data-theme="ibm"] brand-mark {
  --brand-mark-height: 1.5rem; /* IBM logo is wide, keep it compact */
}

:root[data-theme="mcdonalds"] brand-mark {
  --brand-mark-height: 2.5rem;
}

:root[data-theme="anthropic"] brand-mark {
  --brand-mark-height: 1.75rem;
}
```

#### Progressive Enhancement

Without JS, `<brand-mark src="/path/logo.svg" alt="Acme">Acme Corp</brand-mark>` renders as text only. This is acceptable — the text is meaningful and the page remains branded. The image logo is an enhancement.

If a `<noscript>` fallback is desired, it can be added as a child `<img>` that JS replaces:

```html
<brand-mark src="/themes/anthropic/logo.svg" alt="Anthropic" wordmark>
  <img src="/themes/anthropic/logo.svg" alt="Anthropic" height="28">
  Anthropic
</brand-mark>
```

JS clears and reconstructs; without JS, the inline `<img>` + text renders naturally.

---

## Token Mapping Strategy

Each brand theme maps its design decisions to VB's token vocabulary. The goal is that zero HTML changes between themes — only the token values change.

### Mandatory Tokens Every Brand Theme Must Define

```css
:root[data-theme="brand-name"] {
  /* Color */
  --color-bg: ;
  --color-surface: ;
  --color-surface-raised: ;
  --color-border: ;
  --color-border-subtle: ;
  --color-text: ;
  --color-text-subtle: ;
  --color-brand: ;
  --color-brand-hover: ;
  --color-brand-subtle: ;
  --color-brand-text: ;
  --color-focus: ;
  --color-danger: ;
  --color-success: ;
  --color-warning: ;

  /* Typography */
  --font-sans: ;
  --font-serif: ;
  --font-mono: ;
  --font-size-base: ;
  --line-height-prose: ;
  --font-weight-heading: ;
  --letter-spacing-heading: ;

  /* Form specifics */
  --input-height: ;
  --input-border-radius: ;
  --input-border-width: ;
  --input-border-color: ;
  --input-focus-style: ; /* 'outline' | 'ring' | 'inset-ring' */
  --input-label-size: ;
  --input-label-weight: ;
  --input-label-transform: ; /* 'none' | 'uppercase' */

  /* Button specifics */
  --btn-border-radius: ;
  --btn-padding-block: ;
  --btn-padding-inline: ;
  --btn-font-weight: ;
  --btn-text-transform: ;
  --btn-letter-spacing: ;

  /* Layout */
  --grid-columns: ;
  --grid-gutter: ;

  /* Brand mark */
  --brand-mark-height: ;
}
```

### Tokens That Expose Framework Gaps

If a brand theme cannot express something through tokens alone and requires overriding component CSS directly, that is a **framework gap** — not a theme problem. During evaluation, log each override with a comment:

```css
/* GAP: VB has no --input-label-transform token. Overriding directly. */
:root[data-theme="mcdonalds"] label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

These gaps become the backlog for VB's token system.

---

## Implementation Approach

### File Structure

```
/themes/
├── _brand-theme-base.css     # Mandatory token declarations (empty values)
├── anthropic/
│   ├── theme.css             # All token overrides for Anthropic
│   ├── logo.svg              # Anthropic A-mark (SVG)
│   └── fonts.css             # @font-face or Google Fonts @import
├── mcdonalds/
│   ├── theme.css
│   ├── arches.svg            # Golden Arches M
│   └── fonts.css
└── ibm/
    ├── theme.css
    ├── ibm-logo.svg          # IBM 8-bar wordmark
    └── fonts.css
```

### Load Strategy

All theme CSS files are loaded on every page. The `data-theme` attribute on `<html>` activates the right one via specificity. This avoids FOUC on theme switch — no JS file swapping needed.

```html
<link rel="stylesheet" href="/vb/vb.css">
<link rel="stylesheet" href="/themes/anthropic/fonts.css">
<link rel="stylesheet" href="/themes/anthropic/theme.css">
<link rel="stylesheet" href="/themes/mcdonalds/fonts.css">
<link rel="stylesheet" href="/themes/mcdonalds/theme.css">
<link rel="stylesheet" href="/themes/ibm/fonts.css">
<link rel="stylesheet" href="/themes/ibm/theme.css">
```

Total additional CSS payload: acceptable for a demo site. A production implementation would load only the active theme.

---

## Evaluation Criteria

After implementing all four brand themes, evaluate the switcher against these questions:

### Token Coverage

- [ ] Every brand value is expressed via a token, with zero direct element overrides
- [ ] All gaps are logged with `/* GAP: */` comments
- [ ] Gap count is tracked as a framework metric across versions

### Form Fidelity

Compare each themed form against the brand's real-world corporate forms (screenshot references in `/themes/[brand]/references/`):

- [ ] Anthropic: Does the contact form feel like claude.ai's settings forms?
- [ ] McDonald's: Does the order form feel like a McDonald's supplier portal?
- [ ] IBM: Does the order form feel like an IBM Cloud dashboard form?

### Brand Recognition

Show the themed site (switcher hidden) to someone unfamiliar with the project:

- [ ] Can they identify the brand from the visual design alone?
- [ ] Without seeing the logo, do the colors and typography read correctly?

### Regression

After switching themes:

- [ ] All form fields remain functional
- [ ] All interactive states (focus, hover, error, disabled) render correctly
- [ ] No layout collapses
- [ ] `prefers-color-scheme: dark` still respected where VB supports it

### Accessibility

Each brand theme must independently pass WCAG 2.1 AA:

- [ ] All text meets contrast ratios (auto-checked with axe or similar)
- [ ] McDonald's yellow accent is never used for text at failing contrast
- [ ] Focus rings are visible in all themes (IBM inset approach meets 3:1 minimum)

---

## Related Documents

- [Demo Site Specification](./vanilla-breeze-demo-site-spec.md)
- [Vanilla Breeze CSS Architecture](../architecture/css-layers.md)
- [Design Token Specification](../tokens/tokens.md)
- [Form System Specification](../specs/forms.md)
- [Brand-Mark Component](../components/brand-mark.md)
