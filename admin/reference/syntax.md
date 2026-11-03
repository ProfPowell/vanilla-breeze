# Vanilla Breeze — Syntax Reference

> Definitive catalog of every element, attribute, class, and data-attribute in Vanilla Breeze.
> Machine-readable for LLM code generation. Human-scannable for quick lookup.
>
> **Last verified:** 2026-04-24 against commit `13e93ba0` (provenance Stage 4 shipped).
> **Companion truth-sources:** `custom-elements.json` (auto-generated CEM, authoritative for web-component APIs), `admin/specs/meta-tag-contract-v1.md` (provenance contract), `admin/specs/canonical-document-v1.md` (signing canonicalization).

**CSS Layer Order:** `tokens → reset → native-elements → custom-elements → web-components → charts → utils`

---

## 1. Design Tokens

All tokens are CSS custom properties on `:root`. Override any token to customize.

### Spacing (`src/tokens/spacing.css`)

| Property | Value | Description |
|----------|-------|-------------|
| `--size-unit` | `0.25rem` | Base unit |
| `--size-3xs` | `0.125rem` | 2px |
| `--size-2xs` | `0.25rem` | 4px |
| `--size-xs` | `0.5rem` | 8px |
| `--size-s` | `0.75rem` | 12px |
| `--size-m` | `1rem` | 16px |
| `--size-l` | `1.5rem` | 24px |
| `--size-xl` | `2rem` | 32px |
| `--size-2xl` | `3rem` | 48px |
| `--size-3xl` | `4rem` | 64px |

Legacy aliases: `--space-unit`, `--space-3xs` … `--space-3xl` map to `--size-*`.

### Typography (`src/tokens/typography.css`)

| Property | Value | Description |
|----------|-------|-------------|
| `--font-sans` | system-ui stack | System sans-serif |
| `--font-serif` | Charter stack | Serif fonts |
| `--font-mono` | ui-monospace stack | Monospace fonts |
| `--font-size-xs` | `0.75rem` | 12px |
| `--font-size-s` | `0.875rem` | 14px |
| `--font-size-m` | `1rem` | 16px (base) |
| `--font-size-l` | `1.125rem` | 18px |
| `--font-size-xl` | `1.25rem` | 20px |
| `--font-size-2xl` | `1.5rem` | 24px |
| `--font-size-3xl` | `1.875rem` | 30px |
| `--font-size-4xl` | `2.25rem` | 36px |
| `--font-size-5xl` | `3rem` | 48px |
| `--line-height-none` | `1` | No leading |
| `--line-height-tight` | `1.25` | Tight |
| `--line-height-snug` | `1.375` | Snug |
| `--line-height-normal` | `1.5` | Normal |
| `--line-height-relaxed` | `1.625` | Relaxed |
| `--line-height-loose` | `1.75` | Loose |
| `--measure-narrow` | `45ch` | Narrow line length |
| `--measure-normal` | `65ch` | Standard line length |
| `--measure-wide` | `80ch` | Wide line length |
| `--font-weight-normal` | `400` | Normal |
| `--font-weight-medium` | `500` | Medium |
| `--font-weight-semibold` | `600` | Semibold |
| `--font-weight-bold` | `700` | Bold |
| `--letter-spacing-tight` | `-0.025em` | Tight tracking |
| `--letter-spacing-normal` | `0` | Default tracking |
| `--letter-spacing-wide` | `0.025em` | Wide tracking |
| `--letter-spacing-wider` | `0.05em` | Wider tracking |

### Colors (`src/tokens/colors.css`)

| Property | Value | Description |
|----------|-------|-------------|
| `--hue-primary` | `260` | Primary hue (overridden by themes) |
| `--hue-secondary` | `200` | Secondary hue |
| `--hue-accent` | `30` | Accent hue |
| **Gray scale** | | |
| `--color-gray-50` … `--color-gray-950` | OKLCH neutral ramp | 50=lightest, 950=darkest |
| `--color-white` | `oklch(100% 0 0)` | Pure white |
| `--color-black` | `oklch(0% 0 0)` | Pure black |
| **Brand** | | |
| `--color-primary` | oklch(50% 0.2 hue-primary) | Primary brand |
| `--color-primary-hover` | Calculated | Hover state |
| `--color-primary-active` | Calculated | Active state |
| `--color-primary-subtle` | Calculated | Subtle background |
| `--color-secondary` | oklch(50% 0.08 hue-secondary) | Secondary brand |
| `--color-secondary-hover` | Calculated | Hover state |
| `--color-accent` | oklch(65% 0.18 hue-accent) | Accent color |
| `--color-accent-hover` | Calculated | Hover state |
| **Status** | | |
| `--color-success` | `oklch(55% 0.2 145)` | Green |
| `--color-warning` | `oklch(70% 0.18 70)` | Orange/yellow |
| `--color-error` | `oklch(55% 0.22 25)` | Red |
| `--color-info` | `oklch(55% 0.15 240)` | Blue |
| `--color-*-subtle` | light-dark variants | Subtle backgrounds |
| `--color-*-text` | light-dark variants | Text on subtle backgrounds |
| **Semantic surfaces** | | |
| `--color-background` | light-dark(white, gray-950) | Page background |
| `--color-surface` | light-dark(white, gray-900) | Card/panel background |
| `--color-surface-raised` | light-dark(gray-50, gray-800) | Elevated surface |
| `--color-surface-sunken` | light-dark(gray-100, gray-950) | Recessed surface |
| **Semantic text** | | |
| `--color-text` | light-dark(gray-900, gray-100) | Primary text |
| `--color-text-muted` | light-dark(gray-600, gray-400) | Secondary text |
| `--color-text-subtle` | light-dark(gray-500, gray-500) | Tertiary text |
| `--color-text-inverted` | light-dark(white, gray-900) | Inverted text |
| `--color-text-on-primary` | white | Text on primary bg |
| **Borders** | | |
| `--color-border` | light-dark(gray-200, gray-700) | Default border |
| `--color-border-strong` | light-dark(gray-300, gray-600) | Strong border |
| `--color-border-subtle` | light-dark(gray-100, gray-800) | Subtle border |
| `--color-border-focus` | primary | Focus ring |
| **Interactive** | | |
| `--color-interactive` | primary | Links, buttons |
| `--color-interactive-hover` | primary-hover | Interactive hover |
| **Overlay** | | |
| `--color-overlay-subtle` | 5% opacity | Light overlay |
| `--color-overlay-medium` | 15% opacity | Medium overlay |
| `--color-overlay-strong` | 50% opacity | Strong overlay |
| **Focus ring** | | |
| `--color-focus-ring` | primary | Focus color |
| `--focus-ring-width` | `2px` | Ring width |
| `--focus-ring-offset` | `2px` | Ring offset |

### Color Mix (`src/tokens/color-mix.css`)

| Property | Description |
|----------|-------------|
| `--tint-primary-5` … `--tint-primary-30` | Primary tints at 5%, 10%, 20%, 30% |
| `--surface-hover` | 8% interactive mix on surface |
| `--surface-focus` | 12% interactive mix on surface |
| `--surface-active` | 16% interactive mix on surface |
| `--surface-selected` | 10% primary mix on surface |
| `--status-success-bg` | 10% success mix on surface |
| `--status-warning-bg` | 10% warning mix on surface |
| `--status-error-bg` | 10% error mix on surface |
| `--status-info-bg` | 10% info mix on surface |
| `--border-tint` | 50% border transparency |
| `--text-on-tint` | 90% text + primary mix |

### Sizing (`src/tokens/sizing.css`)

| Property | Value | Description |
|----------|-------|-------------|
| `--content-narrow` | `40rem` | Narrow content width |
| `--content-normal` | `60rem` | Standard content width |
| `--content-wide` | `80rem` | Wide content width |
| `--size-touch-min` | `2.75rem` | Minimum touch target |

### Borders (`src/tokens/borders.css`)

| Property | Value | Description |
|----------|-------|-------------|
| `--border-width-thin` | `1px` | Thin border |
| `--border-width-medium` | `2px` | Medium border |
| `--border-width-thick` | `4px` | Thick border |
| `--radius-xs` | `0.125rem` | 2px |
| `--radius-s` | `0.25rem` | 4px |
| `--radius-m` | `0.5rem` | 8px |
| `--radius-l` | `0.75rem` | 12px |
| `--radius-xl` | `1rem` | 16px |
| `--radius-2xl` | `1.5rem` | 24px |
| `--radius-full` | `9999px` | Pill shape |
| `--radius-1` … `--radius-6` | Numeric aliases | Maps to xs–2xl |
| `--radius-round` | Alias for full | Open Props compat |

### Shadows (`src/tokens/shadows.css`)

| Property | Description |
|----------|-------------|
| `--shadow-xs` | Extra small (1px blur) |
| `--shadow-s` | Small (3px blur) |
| `--shadow-m` | Medium (6px blur) |
| `--shadow-l` | Large (15px blur) |
| `--shadow-xl` | Extra large (25px blur) |
| `--shadow-2xl` | Dramatic (50px blur) |
| `--shadow-1` … `--shadow-6` | Numeric aliases |
| `--shadow-inner` | Inset shadow |
| `--shadow-none` | No shadow |

### Motion (`src/tokens/motion.css`)

| Property | Value | Description |
|----------|-------|-------------|
| `--duration-instant` | `50ms` | Instant (0ms reduced) |
| `--duration-fast` | `100ms` | Fast (0ms reduced) |
| `--duration-normal` | `200ms` | Normal (0ms reduced) |
| `--duration-slow` | `300ms` | Slow (0ms reduced) |
| `--duration-slower` | `500ms` | Slower (0ms reduced) |
| `--ease-1` … `--ease-5` | Cubic beziers | Subtle → dramatic |
| `--ease-in-1` … `--ease-in-3` | Ease-in curves | Subtle → strong |
| `--ease-out-1` … `--ease-out-5` | Ease-out curves | Subtle → strongest |
| `--ease-default` | `var(--ease-3)` | Default easing |
| `--ease-in` | `var(--ease-in-2)` | Default ease-in |
| `--ease-out` | `var(--ease-out-3)` | Default ease-out |
| `--ease-elastic-1/2` | Bouncy curves | Light/heavy elastic |
| `--ease-squish-1/2` | Squash/stretch | Light/heavy squish |

### Extensions

#### Motion Effects (`src/tokens/extensions/motion-fx.css`)

| Property | Value | Description |
|----------|-------|-------------|
| `--motion-hover-lift` | `translateY(-2px)` | Hover lift transform |
| `--motion-hover-scale` | `scale(1.02)` | Hover scale transform |
| `--motion-stagger-delay` | `50ms` | Stagger animation delay |
| `--motion-bounce` | cubic-bezier | Bouncy easing |
| `--motion-snappy` | cubic-bezier | Snappy easing |
| `--motion-smooth` | cubic-bezier | Smooth easing |
| `--motion-elastic` | cubic-bezier | Elastic easing |
| `--motion-enter-duration` | `300ms` | Enter animation |
| `--motion-exit-duration` | `200ms` | Exit animation |

Keyframe animations: `vb-fade-in`, `vb-fade-out`, `vb-slide-up`, `vb-slide-down`, `vb-scale-in`, `vb-scale-out`, `vb-pop`

#### Surfaces (`src/tokens/extensions/surfaces.css`)

| Property | Description |
|----------|-------------|
| `--surface-texture-opacity` | Texture overlay opacity (default 0.05) |
| `--texture-noise` | SVG noise texture |
| `--texture-grain` | Fine grain texture |
| `--texture-dots` / `--texture-dots-size` | Dot pattern |
| `--texture-grid` / `--texture-grid-size` | Grid pattern |
| `--texture-lines` | Diagonal lines |
| `--glass-blur` | Glassmorphism blur (default 0px) |
| `--glass-opacity` | Glass opacity (default 0.15) |
| `--glass-bg` | Glass background |
| `--glass-border` | Glass border |
| `--gradient-radial` | Radial gradient |
| `--gradient-mesh` | 3-layer mesh gradient |

#### Fonts (`src/tokens/extensions/fonts.css`)

| Property | Default | Description |
|----------|---------|-------------|
| `--font-display` | `var(--font-serif)` | Display/hero font |
| `--font-heading` | `var(--font-sans)` | Heading font |
| `--font-body` | `var(--font-sans)` | Body font |
| `--font-code` | `var(--font-mono)` | Code font |

#### Rough Borders (`src/tokens/extensions/rough-borders.css`)

| Property | Description |
|----------|-------------|
| `--filter-rough-none/light/medium/heavy` | SVG filter refs |
| `--filter-rough` | Active filter (default none) |
| `--shadow-sketch` | Sketch-style offset shadow |
| `--border-image-sketch` | Wavy border image |
| `--border-image-rough` | Variable dash border |
| `--border-image-marker` | Marker stroke border |

### Themes (`src/tokens/themes/`)

Applied via `data-theme` on `<html>` (or any element, scoped). Combine with `data-mode="dark"` for dark mode. Colour accents are a separate attribute, `data-accent`.

| Category | Themes |
|----------|--------|
| **Personality** (bundled) | `modern`, `minimal`, `classic` |
| **Extreme** (on demand: `/cdn/themes/<name>.css`, auto-loaded by JS) | `brutalist`, `swiss`, `cyber`, `organic`, `editorial`, `terminal`, `kawaii`, `8bit`, `nes`, `win9x`, … |
| **Accessibility** (bundled) | `a11y-high-contrast`, `a11y-large-text`, `a11y-dyslexia` (composable with any theme; a11y-dyslexia is light-only and uses self-hosted Atkinson Hyperlegible) |

Theme and runtime `<link>` hooks:

- `<link rel="stylesheet" href="{cdn}/themes/<name>.css" data-vb-theme="<name>">`: the theme loader adopts an authored link instead of loading the theme again. Link order relative to the core CSS does not matter, because theme files self-declare `@layer bundle-theme` and carry the layer-order prefix.
- `data-vb-theme-state="loading|ready|error|timeout"`: set by the loader and the boot snippet.
- `data-vb-theme-preload="<name>"`: the `rel="preload"` hint from `preloadTheme()` (at most one per theme), removed when the theme loads.
- `data-vb-math-font`: `<link rel="stylesheet" href="{cdn}/fonts/math-fonts.css">`, injected by math-init.
- Runtime `rel` reads are token-list and case-insensitive (`[rel~="x" i]`): `canonical` (share-wc, page-info; resolved via `.href`), `author`, `license`, `author-key` (page-info, canonicalize).
- `theme-loader.js` exports `getCdnBase()`, the detected CDN base (`__VB_THEME_BASE` → `setThemeBase()` → `<script src*="vanilla-breeze">` dir → `/cdn`).

### Accents (`data-accent`)

`data-accent` on `<html>` or any element: `ocean`, `forest`, `sunset`, `rose`, `lavender`, `coral`, `slate`, `emerald`, `amber`, `indigo`. Swaps brand hue seeds only; written by `<theme-picker>` / `ThemeManager.setAccent()`.

---

## 2. Native Elements

Styled HTML elements. No JS required. Classes and data-attributes add variants.

### `<h1>` – `<h6>` Headings

Base: font-weight 600, tight line-height, text-wrap balance, lining numerals, no hyphenation. Token font sizes (`--font-size-4xl` … `--font-size-m`). No margins (reset); rhythm comes from `layout-text` / `data-layout="prose"` / stack gaps.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-display` | (boolean) | h1/h2 only: fluid display size (`--font-size-4xl`→`5xl`), line-height 1, tight tracking |
| `data-display="hero"` | — | h1 only: up to 10rem, line-height 0.95 |

Theme ornament tokens (plain string values; rendered with empty alt text, so excluded from the accessible name): `--heading-ornament-before` / `--heading-ornament-after` (all levels), `--h1-ornament-before` … `--h6-ornament-after` (per level, override the global token). Unset → nothing renders.

> **Script typography** (`:lang(zh|ja|ko|ar|fa|ur|ps|he|yi|th|hi|mr|sa|ne)`) is zero-specificity (`:where()`), so element/component rules win. CJK body line-height 1.8, CJK headings `--line-height-snug`; Korean `word-break: keep-all`; Arabic-script rules no longer set `text-align`.

### `<p>` Paragraph

Base: text-wrap pretty. `<mark>` gets background + padding + radius.

### `<a>` Anchor

| Selector / Attribute | Description |
|----------------------|-------------|
| (base) | Underline, interactive color |
| `data-variant="muted"` | Muted text color |
| `data-variant="plain"` | No underline (appears on hover) |
| `data-no-icon` | Suppress auto-generated icons |
| `.button` | Button styling on a link |
| `[href^="http"]`, `[href^="//"]` | Auto "↗" external icon |
| `[download]` | Auto "↓" download icon |

Icons suppressed inside `<nav>`, `<header>`, `<footer>`.

### `<button>` Button

| Class | Description |
|-------|-------------|
| (base) | Primary solid button, flex layout, touch-friendly |
| `.secondary` | Outlined variant |
| `.ghost` | Transparent, text-only |
| `.small` | Reduced padding/font |
| `.large` | Increased padding/font |
| `.full-width` | 100% inline-size |
| `[data-loading]` | Spinner + `aria-busy` while its form submits (JS). Activates only when the submission proceeds (uncancelled submit or uncancelled `vb:beforesubmit`) |

### `<input>`, `<textarea>`, `<select>` Form Controls

Base: border, radius, padding, focus ring. Validation via `:user-invalid` and `[aria-invalid="true"]`.

| Selector | Description |
|----------|-------------|
| `input[data-switch]` | Toggle switch (default size) |
| `input[data-switch="sm"]` | Small toggle switch |
| `input[data-switch="lg"]` | Large toggle switch |
| `input[list]` (text-like types: none, text, search, url, email, tel, number) | Datalist dropdown arrow (currentColor gradient, mirrors in RTL); range/color/date/time inputs with `list` are left untouched |
| `input[list].no-arrow` | Hide dropdown arrow |
| `input[list].search` | Search icon on the inline-start side |

> The switch knob slides toward the inline end, so it mirrors under `dir="rtl"`. Colour tokens: `--switch-track-bg`, `--switch-track-checked-bg`, `--switch-knob-bg`. In forced colors the track is outlined in CanvasText and filled with Highlight when on.

> `label` wrapping a checkbox/radio is `inline-flex` (24px min row, pointer). Checkbox/radio boxes align with the first line of text (`first baseline` + translate), switches centre on the row; the alignment rule has single-element specificity so `[data-segmented]` / `[data-rating]` labels keep their own. Inside `<form-field>` a required control adds a silent red `*` to the field's only label / the grouped field's legend — never type `*` into the label text.

| Token | Default | Purpose |
|---|---|---|
| `--control-border` | `color-mix(in oklab, var(--color-border-strong), var(--color-text) 30%)` | Control boundary ≥3:1 (WCAG 1.4.11); feeds `--input-border`, `--range-track-bg`, `--switch-track-bg` |
| `--input-readonly-bg` | `var(--color-surface-raised)` | Readonly text field fill |
| `--input-readonly-border-style` | `dashed` | Readonly text field border style |
| `--switch-track-bg` | `var(--control-border)` | Unchecked switch track |
| `--switch-track-checked-bg` | `var(--color-interactive)` | Checked switch track |
| `--switch-knob-bg` | `var(--color-white)` | Switch knob |
| `--range-pct` | unset (0%) | Range fill stop; set by data-range, or set it yourself for a static fill |

### `<form>` Form

| Class | Description |
|-------|-------------|
| `.stacked` | Vertical layout (default) |
| `.inline` | Horizontal flex with wrap |
| `.grid` | Two-column grid |

Related classes:

| Class | Description |
|-------|-------------|
| `.group` | Column flex wrapper (inside a `form`, or on a `fieldset`) |
| `.group.horizontal` | Row flex wrapper |
| `.actions` | Button container (flex). Inside a `form`/`dialog`, or on a `footer` |
| `.actions.end` | Right-aligned buttons |
| `.actions.between` | Space-between buttons |
| `.help` | Small muted helper text (`p`, `span`, `small`) |
| `.error` | Red error message (`p`, `span`, `small`) |

### `<form data-validate>` Form Coordinator

| Attribute / Selector | Values | Description |
|----------------------|--------|-------------|
| `data-validate` | (boolean), `summary` | Coordinator owns validation UI (sets `novalidate`). `summary` hides inline errors |
| `data-submit` | `native` (default), `event`, `fetch` | `native`: `requestSubmit(submitter)`. `event`: cancelable `vb:submit`, detail = FormData incl. submitter. `fetch`: method from submitter `formmethod` → form `method` attr → POST; GET → querystring; honours `formaction` |
| `data-submitting`, `data-success`, `data-error` | state (set on form) | `data-error` is `"network"` or `""` (server field errors). Cleared on next submit |
| `[data-form-summary]` | child | Error summary (+ `[data-summary-list]`, optional `[data-summary-heading]`); legacy `output.error-summary` |
| `[data-form-success]` | child | Shown + focused on fetch success (gets `tabindex="-1"`, `role="status"` if absent) |
| `[data-form-error]` | child | Shown on network error (`role="alert"`); generated `<p>` if absent |
| `data-label-summary`, `data-label-summary-{one\|other\|few\|many\|two\|zero}` | text with `{count}` | Summary heading |
| `data-label-group` | text | Group label in the summary |
| `data-message-min-checked` / `data-message-max-checked` | text with `{min}` / `{max}` | Checkbox-group messages |
| `data-message-invalid-selection`, `data-message-match`, `data-message-network` | text | Message overrides |

Events: `vb:beforesubmit` (cancelable, detail `{ form, submitter }`, after validation passes), `vb:submit`.

### `<fieldset>` Fieldset

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-variant` | `minimal` | No border or padding; legend reads as a section heading (replaces `.minimal`) |
| `data-status` | `success`, `warning`, `error` | Border tint. Pair with text; forced colors switch to a 3px solid/dotted/double border |
| `data-min-checked` | number | Checkbox group: minimum ticked (form coordinator) |
| `data-max-checked` | number | Checkbox group: maximum ticked (form coordinator) |
| `data-message-min-checked` | text | Custom message when below the minimum (written to the fieldset's child `<output>`) |
| `data-message-max-checked` | text | Custom message when above the maximum |
| `data-invalid` | (set by coordinator) | Set while a checkbox-group constraint fails; red border + `<output>` message. Don't author it by hand |
| `disabled` | (boolean) | Native; VB adds muted text + dashed border and the controls dim once (no fieldset opacity) |

> Custom property: `--fieldset-status-color` (set per `data-status`) lets themes re-apply the status border after restyling the fieldset.

### `<form data-wizard>` Form Wizard

| Data Attribute | Description |
|----------------|-------------|
| `data-wizard` | Base wizard form container |
| `data-wizard-step` | Individual step fieldset |
| `data-wizard-progress` | Progress indicator element |
| `data-wizard-nav` | Navigation button container |
| `data-wizard-prev` | Previous button |
| `data-wizard-next` | Next button |
| `data-wizard-status` | Screen reader status |
| `data-wizard-current` | Current step number |
| `data-wizard-total` | Total steps |
| `data-wizard-last` | Applied when on final step |
| `data-wizard-if` | Conditional step visibility |
| `data-wizard-optional` | Optional step marker |

Counter text via `--wizard-label-step` (default `"Step "`) and `--wizard-label-of` (default `" of "`).

### `<details>` / `<summary>` Disclosure

Base: chevron indicator via `summary::after` (physical right+bottom corner; points to the inline end when closed, down when open, RTL-aware). Adjacent `<details>` get joined borders in normal flow only — not inside gap layouts (`layout-*`, `[data-layout]`, `[data-layout-gap]`); `data-layout-gap="none"` joins. Closed panels print open (via `::details-content`).

### `<dialog>` Dialog

| Data Attribute | Values | Description |
|----------------|--------|-------------|
| `data-size` | `s`, `m`, `l`, `full` | Modal size (24/32/48rem or viewport) |
| `data-position` | `start`, `end`, `top`, `bottom` | Drawer positioning |

Open dialogs are a flex column: `<header>` / `<footer>` fixed, body (`p`, `section`, `article`, `form`) scrolls. `<form method="dialog">` may wrap header/body/footer (form gets no padding; its header/footer styled like direct children). Name dialogs with `aria-labelledby` → heading id. Modal open locks page scroll (`html:has(dialog:modal)`). Enter/exit transitions; drawers slide from their logical edge (RTL-aware). Native `closedby="any"` for light dismiss.

### `<table>` Table

| Data Attribute | Values | Description |
|----------------|--------|-------------|
| `data-numeric` | (boolean, on th/td) | Right-align numeric data |
| `data-sticky` | `header`, `column`, `both` | Sticky header/column |
| `data-density` | `compact`, `comfortable` | Row padding density |
| `data-align` | `start`, `center`, `end` | Cell alignment |
| `data-responsive` | `scroll`, `card` | Mobile layout mode |
| `data-sort` | (on th) | Sortable column |
| `data-state-sorted` | `asc`, `desc` | Sort direction |
| `data-selected` | (on tr) | Row highlight |
| `data-disabled` | (on tr) | Row disabled |
| `data-highlight` | (on tr) | Row warning highlight |
| `data-state-hidden` | (on tr) | Hidden row |
| `data-expand-content` | (on tr) | Expandable row content |
| `data-state-expanded` | (on tr) | Expanded state |
| `data-label` | text | Mobile card mode label |
| `data-sticky-column` | `2` | Sticky first N columns |

Legacy classes: `.striped`, `.compact`, `.bordered`

### `<nav>` Navigation

| Class | Description |
|-------|-------------|
| `.horizontal` | Horizontal flex |
| `.vertical` | Vertical flex |
| `.pills` | Rounded pill buttons |
| `.tabs` | Tab-style with border indicator |
| `.breadcrumb` | Breadcrumb trail |
| `.minimal` | Text-only links |
| `.pagination` | Page navigation controls |
| `.tree` | Hierarchical tree |
| `.steps` | Multi-step progress |

#### Breadcrumb data attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-separator` | `chevron`, `arrow`, `dot`, `pipe` | Separator character |
| `data-collapsed` | (boolean) | Hide middle items |
| `data-truncated` | (on li) | Truncate long items |

#### Pagination data attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-variant` | `simple`, `compact` | Style variant |
| `data-size` | `sm`, `lg` | Size |
| `data-prev`, `data-next` | (on button) | Nav buttons |
| `data-ellipsis` | (on span) | Ellipsis indicator |
| `data-info` | (on span) | Info text |

#### Steps data attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-size` | `sm`, `lg` | Circle size |
| `data-labels` | `below` | Labels below circles |
| `data-direction` | `vertical` | Vertical layout |
| `aria-current="step"` | (on li) | Active step |
| `data-completed` | (on li) | Completed step |

### `<progress>` Progress Bar

| Class | Description |
|-------|-------------|
| `.xs`, `.s`, `.m`, `.l` | Size variants |
| `.success`, `.warning`, `.error` | Color variants |

### `<meter>` Meter

| Class | Description |
|-------|-------------|
| `.xs`, `.s`, `.m`, `.l` | Size variants |
| `.segmented` | Visual segments |

### `<output>` Output

| Class | Description |
|-------|-------------|
| `.block` | Block display with padding |
| `.inline` | Minimal inline |
| `.highlight` | Interactive blue background |
| `.large` | Large font size |
| `.success`, `.warning`, `.error` | Status colors |

### `<blockquote>` Blockquote

Base: left border accent, muted italic text, `<footer>` for attribution.

### `<code>`, `<pre>`, `<kbd>`, `<samp>`, `<var>` Code

Base: monospace font, `<code>` gets background highlight, `<kbd>` gets border + shadow key style. A `<kbd>` with a `<kbd>` child (`kbd:has(> kbd)`, nested sequence/combination and the `data-hotkey` wrapper) is unboxed and inherits the font size; only inner caps are drawn. Inside `button`/`.button`/`[role="button"]` a cap takes the button's text colour with a derived edge and translucent fill.

### `<ul>`, `<ol>` Lists

| Class | Description |
|-------|-------------|
| `.inline` | Horizontal flex, no bullets |
| `.unstyled` | No bullets, no padding |

- `ul[data-marker="check|arrow|dash|star"]`: styles direct `> li::marker` only, so nested lists keep their own markers. `arrow` swaps to `--marker-arrow-rtl` (U+2B9C, fallback built in) under `:dir(rtl)`.
- `ul.meta` / `ol.meta` (`data-separator="pipe|dash|slash"`): separators on direct `> li + li::before` only.
- `.inline` / `.unstyled` / `.meta`: reset `margin-block-start` on direct `> li` only. They set `list-style: none`, so add `role="list"` where Safari/VoiceOver semantics matter.
- `:where(li + li)` has zero specificity, so a plain author `li` rule wins over it. Any `[data-layout] > li` gets a margin of 0.

### `<dl>` Definition List

Base: `<dt>` bold, `<dd>` indented (inline-start). Groups may be flat or wrapped in `<div>` (spec) or `<dl-item>` (VB, non-conforming); a plain `<dl>` spaces wrapped groups like flat pairs.

| Data Attribute | Values | Description |
|----------------|--------|-------------|
| `data-variant` | `horizontal`, `stacked` | Term/description columns (subgrid; stacks below 24rem) or muted label above value |
| `data-bordered` | (boolean) | Separator lines between wrapped groups |
| `data-density` | `compact` | Tighter spacing |
| `data-striped` | (boolean) | Alternating backgrounds (wrapped groups stripe whole; flat: odd dt + following dd run) |

Custom properties: `--dl-term-min` (default `10ch`), `--dl-term-max` (default `40%`) bound the horizontal term column.

`<dl-item>`: group wrapper for dt/dd inside `<dl>` only; styled identically to `<div>`; variants live on the parent `<dl>`.

### `<hr>` Horizontal Rule

| Class / Attribute | Description |
|-------------------|-------------|
| `.decorative` | "• • •" glyphs (silent: empty alt text) |
| `data-ornament="…"` | Custom glyph(s) from the attribute (silent: `attr() / ""`); kept across themes |
| `.wave`, `.zigzag`, `.scallop`, `.diamonds` | `shape()` dividers (fall back to a plain rule without `shape()` support) |
| `.dots` | Radial-gradient dot row (works everywhere) |

Themes restyle only plain rules (`hr:not([data-ornament], .decorative, .wave, .zigzag, .scallop, .diamonds, .dots)`). Forced colors: every plain/shape hr becomes a 1px `CanvasText` line (overrides theme backgrounds). Print: shape dividers set `print-color-adjust: exact`.

### `<img>`, `<picture>` Image

| Class / Attribute | Description |
|-------------------|-------------|
| `.full` | 100% width (on `img`, or `picture.full`) |
| `.contain`, `.cover` | Object-fit variants; combine with ratio classes (`ratio-square contain`) |
| `.rounded` | Border-radius |
| `.circle` | Circular with aspect-ratio 1 |
| `.thumbnail` | Border + background |
| `.ratio-square`, `.ratio-video`, `.ratio-landscape`, `.ratio-portrait` | 1:1, 16:9, 4:3, 3:4 (object-fit cover) |
| `data-outlined` | Faint inner outline (`img`, `picture[data-outlined] > img`) |

`picture > img` is never upscaled past its intrinsic width (`max-inline-size: 100%`); `[data-media] > picture > img` fills the ratio box. Missing source: `:not([src])` / `[src=""]` get a raised surface + 100px min height. No lazy-loading background.

### `<video>`, `<audio>` Media

| Class | Element | Description |
|-------|---------|-------------|
| `.full` | video | Full-width |
| `.widescreen` | video | 16:9 |
| `.standard` | video | 4:3 |
| `.ultrawide` | video | 21:9 |
| `.square` | video | 1:1 |
| `.rounded` | video | Border-radius |
| `.minimal` | audio | 2.5rem height |
| `.compact` | audio | 300px max-width |

### `<iframe>` Embed

| Class / Attribute | Description |
|-------------------|-------------|
| `.full` | Full-width; keeps the `height` attribute |
| `.fixed` | Full-width, 400px height |
| `.rounded` | Border-radius |
| `.bordered` | Border |
| `data-ratio="1:1\|4:3\|3:2\|16:9\|21:9\|2:3\|3:4\|9:16\|page"` | Block size follows width; `width` = preferred width, none = fill |

Wrappers: `[data-media][data-ratio]` (preferred; `figure` + `figcaption` puts the ratio on the iframe) or legacy `.embed-responsive` with `.ratio-16x9`, `.ratio-4x3`, `.ratio-1x1`, `.ratio-21x9`. Never `sandbox="allow-scripts allow-same-origin"` on a same-origin `src` (escapable).


### `<embed>` / `<object>`
- `<embed src type width height title>` — void, no fallback, no sandbox. Integer `width`/`height` only. Name it with `title`/`aria-label`. `data-ratio="1:1|4:3|3:2|16:9|21:9|2:3|3:4|9:16|page"` makes it responsive (block size follows width; `width` = preferred width, none = fill). Works inside `[data-media]` and `.embed-responsive`.
- `<object data type width height>…fallback…</object>` — same sizing; fallback content between the tags. Preferred for PDFs (download-link fallback). No sandbox: use `<iframe sandbox>` / `<img>` for untrusted HTML/SVG; CSP `object-src 'none'` disables both.

### `<canvas>` Canvas

| Class | Description |
|-------|-------------|
| `.full` | Full-width |
| `.fixed` | 400px height |
| `.interactive`, `.drawing` | Crosshair cursor |
| `.bordered` | Border |
| `.loading` | Diagonal stripe placeholder |

### `<svg>` SVG

| Class | Description |
|-------|-------------|
| `.xs`, `.s`, `.m`, `.l`, `.xl`, `.xxl` | Fixed sizes (0.75rem–4rem) |
| `.currentcolor` | Fill inherits text color |
| `.interactive` | Fill uses interactive color |
| `.muted` | Fill uses muted color |
| `.full`, `.responsive` | Full-width/auto sizing |
| `.spin` | Rotation animation |
| `.pulse` | Opacity pulse animation |

### `<figure>` / `<figcaption>` Figure

| Class | Element | Description |
|-------|---------|-------------|
| `.full` | figure | Full-width |
| `.bordered` | figure | Border + padding |
| `.float-start`, `.float-end` | figure | Float layout |
| `.centered` | figure | Auto margin inline |
| `.code` | figure | Code example layout |
| `.quote` | figure | Quote layout |
| `.centered` | figcaption | Center text |
| `.end` | figcaption | End-align (right in LTR, left in RTL) |
| `.hidden` | figcaption | Visually hidden (same as `.visually-hidden`); still names the figure |

Caption first (`<figcaption>` as first child) moves spacing, the `.bordered` divider and `.code` corners to suit. `figure[data-media]` with a `<figcaption>` applies the ratio to the media child; the caption flows below. In `article[data-numbered]`, `.quote` figures are not numbered and `.code` figures are numbered as Listings.

### Content Sectioning

#### `<header>`

| Class / Attribute | Description |
|-------------------|-------------|
| `.site` | Top navigation (flex between, bordered) |
| `.page` | Page title (bordered bottom) |
| `.card` | Card header (bordered bottom) |
| `[data-sticky]` | Sticks to top; a body-level sticky header adds `scroll-padding-block-start` to `<html>` (`--sticky-offset`, else `--header-sticky-size`, default header.site height) |
| `[data-scroll-hide]` | Sticky; hides on scroll down, reveals after ~40px cumulative scroll up or when focus enters (sets `data-hidden`; JS auto-loaded) |
| `.transparent` | Absolute overlay (for hero sections) |
| `.centered` | Text centered |
| `.compact` | Reduced padding |

Banner landmark only when scoped to `<body>` (no article/aside/main/nav/section ancestor). The `<html data-sticky>` system pins that banner header only (never an article/card header) and reports `--sticky-offset: 0px` when the header is static (below 48rem).

#### `<footer>`

| Class | Description |
|-------|-------------|
| `.site` | Full-width site footer |
| `.article` | Article footer (border top) |
| `.card` | Card footer (for non-`layout-card` containers; `layout-card` styles its own footer) |
| `.minimal` | Centered small text |
| `.columns` | Grid auto-fit columns |
| `[data-sticky]` | Sticks to bottom of scroll container, above the virtual keyboard; static in print |

#### `<main>`

| Class | Description |
|-------|-------------|
| `.contained` | Max 1200px centered |
| `.narrow` | Max 65ch reading width |
| `.wide` | Max 1600px |
| `.full` | 100% width |
| `.with-sidebar` | Grid + sidebar layout |
| `.padded` | Vertical padding |
| `.flex` | Flex column, flex-1 |

#### `<section>`

| Class | Description |
|-------|-------------|
| `.padded` | Vertical padding |
| `.full` | Full viewport width |
| `.contained` | Max 1200px centered |
| `.alt` | Alternate background |
| `.bordered` | Top border |
| `.hero` | Min 50vh, centered content |
| `.grid` | Auto-fit grid columns |

#### `<article>`

| Class | Description |
|-------|-------------|
| `.blog` | Max 65ch centered |
| `.card` | Bordered card style |
| `.feature` | Grid with centered header |
| `.compact` | Flex with bottom borders |
| `.nested` | Indented (comments/replies) |

#### `<aside>`

| Class | Description |
|-------|-------------|
| `.sidebar` | Panel background + border |
| `.note` | Subtle small text |
| `.float` | Float right, max 40% |

#### `<hgroup>`

Content model: zero+ `<p>`, one h1–h6, zero+ `<p>` (no `<small>`). Put kicker text first in source; there is no reversed variant.

| Class / Attribute | Description |
|-------------------|-------------|
| `.tight` | No gap |
| `.spaced` | Larger gap |
| `.centered`, `data-align="center"` | Text centered |
| `.divided` | Border divider between items |
| `.eyebrow` | First `<p>` becomes a small uppercase label above the heading |
| `.byline` | Metadata row (`<p><span>…</span><span>…</span></p>`) with silent "·" separators; `a[rel~="author"]` underlined |
| `.section-header` | Large section intro with bottom border |
| `.display` | Hero-scale fluid heading with accent rule (`data-align="center"` centres the rule) |

#### `<address>`

| Class | Description |
|-------|-------------|
| `.card` | Background + border-radius |
| `.inline` | Inline display |
| `.compact` | Flex wrap, small font |
| `.footer` | Small muted text |
| `.contact` | Grid with flex links |

#### `<search>`

| Class | Description |
|-------|-------------|
| `.inline` | Flex inline |
| `.expanded` | Full-width |
| `.compact` | Smaller padding/font |
| `.with-icon` | Icon positioning |
| `.rounded` | Full radius on input |
| `.header` | Compact header search |

#### `<menu>`

| Class | Description |
|-------|-------------|
| `.toolbar` | Flex toolbar with buttons |
| `.vertical` | Flex column |
| `.context` | Dropdown menu style |
| `.icons` | Icon button grid |
| `.pills` | Rounded items |
| `.compact` | Reduced spacing |

Separator: `<li role="separator">`

### Inline Semantics (`<abbr>`, `<cite>`, `<del>`, `<ins>`, `<time>`, etc.)

| Class | Element | Description |
|-------|---------|-------------|
| `mark.success/warning/error` | mark | Colored highlights |
| `abbr[data-variant="plain"]` | abbr | No underline |
| `cite[data-variant="quoted"]` | cite | Title in locale quotation marks instead of italics |
| `del.diff`, `ins.diff` | del/ins | Diff display (pill tokens) |
| `del`/`ins` wrapping block content (auto, via `:has()`) | del/ins | Block change: tint + inline-start bar; no class needed (`.block` removed). Block children: `p, ul, ol, dl, div, section, article, aside, blockquote, pre, table, figure, h1–h6, details, nav, header, footer, form, fieldset, hgroup, menu, hr, address, search` |
| `del[data-reason]`, `ins[data-reason]` | del/ins | Visible uppercase reason tag before the change |
| `del[data-author]`, `ins[data-author]` | del/ins | Author shown on hover, focus-within, touch (hover:none) and print |
| `[data-announce]` (on del/ins or any ancestor) | del/ins | Visually hidden "deletion/insertion start/end" text for screen readers; translate via `--del-announce-start/-end`, `--ins-announce-start/-end` (quoted strings) |
| `data[data-variant~="mono"]` | data | Monospace face for identifiers (default `<data>` is prose font + tabular-nums) |
| `dfn[id]:target` | dfn | Outline highlight when reached by fragment link |
| `time.relative`, `time.datetime` | time | Time variants |
| `sup.footnote-ref` | sup | Footnote styling |

> `dfn` inherits the weight of bold contexts (`dt`, `th`, headings, `strong`, `b`, `legend`). In `:lang(zh|ja|ko)`, `dfn` and `cite` are upright (no synthetic italic): `dfn` uses semibold, `cite` a muted wavy underline (except `cite[data-variant="quoted"]`).

> `<i>` / `<em>` toggle to upright inside italic contexts: `blockquote`, `cite` (not `cite[data-variant~="quoted"]`), `dfn`, `var`, `em`, `i`. Upright islands (`blockquote > footer`, `blockquote > cite`, quoted cite) restore italic. In CJK (`:lang(zh|ja|ko)`, excluding `-Latn`): `<i>` is upright with the `--font-cjk-alternate` face + dotted underline; `<em>` uses emphasis marks; `<dfn>` semibold; `<cite>` wavy underline. Token `--font-cjk-alternate` (optional; default kai/mincho stack) sets the face for CJK `<i>`.

### Native Tooltip (`[role="tooltip"][popover]`)

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-anchor` | (boolean) | CSS anchor positioned |
| `data-tooltip-position` | `top`, `bottom`, `left`, `right` | Position (default: top) |
| `popover="hint"` | (attribute) | Hover-triggered variant |

### Star Rating (`[data-rating]`)

| Attribute | Description |
|-----------|-------------|
| `data-rating` | Star rating fieldset container |
| `data-rating-half` | Enable half-star precision |
| `data-rating-readonly` | Read-only display |

---

## 3. Custom Elements

CSS-only custom HTML tags. No JavaScript required. Use as regular HTML elements.

### Layout Primitives

> **Layout values are a closed vocabulary.** Every `data-layout-*` value is a
> named token; raw lengths are not part of the HTML API. An unknown value
> matches no CSS and silently falls back to the default, so `vb/layout-attr-value`
> rejects it at conformance time. For a genuine one-off, set the public custom
> property instead: `style="--layout-min: 220px"`. Full contract:
> [`layout-value-vocabulary-v1.md`](../specs/layout-value-vocabulary-v1.md).

#### `<layout-stack>`
Vertical flex layout with configurable gap.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | Gap between children |
| `data-layout-align` | `start`, `center`, `end`, `stretch` | Cross-axis alignment. `start`/`center`/`end` make children content-sized, so direct `main`/`article`/`section`/`aside` children drop `container-type` (they would otherwise collapse to 0 width) |

Child attribute: `data-container` (on `main`/`article`/`section`/`aside`): keeps the child a query container in a start/center/end stack. Give it an explicit width.

#### `<layout-cluster>`
Horizontal flexbox with wrapping.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | Gap between items |
| `data-layout-justify` | `start`, `end`, `center`, `between` | Horizontal alignment |
| `data-layout-align` | `start`, `end`, `center`, `stretch`, `baseline` | Vertical alignment |
| `data-layout-nowrap` | (boolean) | Disable wrapping |
| `data-layout-overlap` | `xs`, `s`, `m`, `l` | Overlap mode (avatar groups) |

#### `<layout-center>`
Centered content container.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-max` | `narrow`, `normal`, `wide`, `prose` | Max-width constraint |
| `data-layout-intrinsic` | (boolean) | Flex centering for narrow content |
| `data-layout-text` | (boolean) | Center text content |
| `data-layout-gutter` | `none`, `s`, `l` | Horizontal padding |
| `data-layout-gap` | `none`, `3xs`…`3xl` | Vertical gap between children |

#### `<layout-grid>`
Auto-fit responsive grid.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-min` | `xs` \| `s` \| `m` \| `l` \| `xl` | Minimum column width (8/10/15/20/25rem), clamped to the container (`minmax(min(min, 100%), 1fr)`): a grid narrower than the min shows one full-width column instead of overflowing. One-off: `style="--layout-min: 220px"` (not inherited by nested grids) |
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | Gap between items |
| `data-layout-subgrid` | (bare), `2`, `3`, `4` | Each child becomes a `grid-template-rows: subgrid` spanning N rows (bare = 3; other values also span 3) so header/body/footer align across siblings. The subgridded rows use the grid's row gap, so `data-layout-gap` also spaces the parts inside each child; set `row-gap` on the children to override |

#### `<layout-cover>`
Full-height container with centered principal element.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-min` | `s` \| `m` \| `l` \| `xl` \| `auto` | Minimum block size (50/70/80vh, 100dvh). One-off: `style="--layout-min: 65vh"` |
| `data-layout-padding` | `none`, `s`, `m`, `l`, `xl` | Padding |
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | Gap between items |
| `data-layout-nospace` | (boolean) | Remove padding |
| `data-layout-centered` | (boolean) | Center items horizontally |

Child attributes: `data-layout-principal`, `data-layout-cover-top`, `data-layout-cover-bottom`

#### `<layout-sidebar>`
Two-column layout (sidebar + content). Element or attribute form (`data-layout="sidebar"`). `nav`/`aside` children are the sidebar; every other child is content; without `nav`/`aside` the first child is the sidebar and the last the content. Wraps on *container* width. Nested sidebars start from their own defaults. Pair with `data-splitter` for resizable panels.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | Gap between columns |
| `data-layout-side` | `end` | Sidebar on right. `nav`/`aside` children are the sidebar and keep DOM order; with no `nav`/`aside` child the first child is the sidebar and the row is reversed |
| `data-layout-sidebar-width` | `narrow`, `normal`, `wide` | Sidebar width (12 / 16 / 20rem — the same three values in every sidebar context; `--sidebar-width` token default 16rem) |
| `data-layout-content-min` | `s` \| `m` \| `l` | Min content width (40/50/60%). One-off: `style="--layout-content-min: 45%"` |
| `data-layout-nowrap` | (boolean) | Prevent stacking |
| `data-layout-sticky` (on `nav`/`aside`) | (boolean) | Sticky sidebar with own scroll; requires `<html data-sticky>` |

#### `<layout-switcher>`
Flexbox that flips horizontal↔vertical based on available space.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | Gap |
| `data-layout-threshold` | `s` \| `m` \| `l` | Switch threshold (25/30/40rem, default 30rem). One-off: `style="--layout-threshold: 35rem"`. No bare form |
| `data-layout-limit` | `2`, `3`, `4` | Max items before vertical |
| `data-layout-reverse` | (boolean) | Reverse when stacked (`flex-wrap: wrap-reverse`: last item on top); the row keeps DOM order. Independent of the threshold. Visual only: focus order stays DOM order (WCAG 2.4.3) |

Attribute form: `data-layout="switcher"`.

#### `<layout-reel>`
Horizontal scrolling container with proximity snap. Element or attribute form (`data-layout="reel"`, e.g. `<card-list data-layout="reel">`). Without focusable items, add `role="region" aria-label tabindex="0"` (or use `<section data-layout="reel" aria-label tabindex="0">`). Scrollbar always shown under forced colours and `(hover: none)`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | Gap |
| `data-layout-padding` | `none`, `s`, `m`, `l` | Padding on all sides; the inline value is also the scroll padding |
| `data-layout-item-width` | `auto`, `s`, `m`, `l`, `xl`, `full` | Item width |
| `data-layout-align` | `start`, `center`, `end`, `stretch` | Vertical alignment |
| `data-layout-scrollbar` | (boolean) | Show scrollbar (hidden by default except forced colours / touch-only) |
| `data-scroll-hint` | (bare), `start` | Logical edge fades (mirrored in RTL); with scroll-driven animations each edge fades only while there is more content that way. `start`: end edge only. Size: `--scroll-hint-size` |

#### `<layout-imposter>`
Positioning helper for overlays (visual only — use `<dialog>`/`popover` for modal UI). Logical in RTL; centred overlays use the full container width. `--imposter-z` sets stacking (default 1, `--z-float` when fixed).

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-fixed` | (boolean) | Fixed positioning |
| `data-layout-position` | `center`, `top`, `bottom`, `start`, `end`, `top-start`, `top-end`, `bottom-start`, `bottom-end` | Position |
| `data-layout-margin` | `s`, `m`, `l`, `xl` | Margin from edges |
| `data-layout-contain` | (boolean) | Cap at the containing block (positioned ancestor, or viewport when fixed) minus the margin; scrolls inside |

#### `<layout-canvas>` / `[data-canvas]`
Elevated content surface. Attribute form puts the variant in the value; the element form uses `data-variant`. 1px edge: hairline on plain pages, transparent under `data-backdrop`, CanvasText in forced colours. Below 37.5rem every canvas goes flush (both forms). Nested canvases set `--canvas-bg` to `--color-surface-raised`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-canvas` (attribute form) | (bare), `flush`, `elevated` | Make any element a canvas; value = variant |
| `data-variant` (element form only) | `flush`, `elevated` | Variant for `<layout-canvas>` |
| `data-max` | `narrow`, `normal`, `wide`, `prose` | `--content-narrow/normal/wide` (40/60/80rem) or 65ch |
| `data-padding` | `none`, `s`, `m`, `l`, `xl` | Padding |
| `data-canvas-depth` | `1`, `2` | Stacked-paper sheets (37.5rem and up) |

#### `<layout-text>`
Content container with optimal line-length and vertical rhythm. Default max-width: `--measure-normal` (65ch; fluid under `data-fluid`, shorter in the dyslexia/large-text themes). Released to 100% in query containers narrower than 30rem.

`layout-text/styles.css` owns the typographic core shared with `<layout-columns>`, `[data-layout="columns"]` and `[data-layout="prose"]`: measure, `--prose-line-height`, vertical rhythm, `[data-bleed]` breakout and the narrow-container width release.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-measure` / `data-layout-max` | `narrow`, `normal`, `wide` | Measure (`--measure-narrow` 45ch / `--measure-normal` 65ch / `--measure-wide` 80ch). Both spellings accepted on every text container |
| `data-layout-centered` | (boolean) | `margin-inline: auto` |

Extra block spacing (`--size-l`) before/after: `figure`, `pre`, `table`, `blockquote`, `video`, `code-block`, `browser-window`.

Child attribute: `data-bleed` (direct child): breaks out to the full inline size of the nearest query container (`100cqi`, not `100vw`). Works uncentered (grows from the start edge) and centered (symmetric). A host that is itself a container (`article[data-layout="prose"]`, `article[data-measure]`) stops being one while it has a bleed child; `data-container` on the host keeps it as a container. Spans all columns in a multi-column flow.

Note: `data-layout-max="narrow"` is 45ch on text containers but 40rem on `<layout-center>`.

#### `<layout-columns>`
Multi-column reading flow. Measure, rhythm, centering and `[data-bleed]` come from the typographic core in `layout-text/styles.css`; `layout-columns/styles.css` adds the column rules. Attribute form: `data-layout="columns"`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-column-count` | `1`, `2`, `3`, `auto` | `1` (default) = single measured column. `2`/`3` are maximums (`columns: 14rem N`): they drop to fewer columns in narrow containers, down to one on a phone. `auto` = as many `--column-min-width` (38ch) columns as the element's own width fits (no viewport query) |
| `data-layout-measure` / `data-layout-max` | `narrow`, `normal`, `wide` | Count 1: caps the block. Counts 2/3: caps each column (block ≤ count × measure + gaps); without it they fill the container. `auto`: sets the column width |
| `data-layout-align` | `justify` | Justified text with hyphenation |
| `data-layout-centered` | (boolean) | No effect (columns are always centered) |

Custom properties: `--column-min-width` (38ch, auto mode), `--column-gap` (`--size-2xl`).
Child attribute: `data-bleed` (direct child): spans all columns and the nearest query container's width.
Rhythm applies to direct children. Wrapping the content in one `<article>` turns it off, so put `data-layout="columns"` on the article instead. Headings and paragraphs in the flow drop theme borders (`!important`, so the reset beats the bundle-theme layer); nested components keep theirs.

### Card Elements

#### `<layout-card>`
Block container by default. A `<header>`, `<section>` or `<footer>` child, or any `slot="header|content|footer"` child, switches it to structured mode: header pinned on top, footer pinned at the bottom (`margin-block-start: auto`), every other child stacked between them in source order.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-variant` | `elevated`, `outlined`, `ghost` | Visual style |
| `data-padding` | `none`, `s`, `m`, `l`, `xl` | Internal padding. Structured mode pads the children one step up: header/footer `--size-m`/`--size-l`, content `--size-l` at the default `m`; `none` also drops the dividers |
| `data-max` | `narrow`, `normal`, `wide`, `prose` | Max-width constraint, centered (`margin-inline: auto` in block flow, `align-self` in flex/grid). Same keyword set as `layout-center` / canvas. Surfaces — card, badge, canvas — use bare `data-*`; flow primitives use `data-layout-*` |

Structured children: `<header>` / `slot="header"`, `<footer>` / `slot="footer"`; everything else (including `<section>` and `slot="content"`) is content. `container-type: inline-size` only in structured mode (compact padding under 300px). In a `data-layout-subgrid` parent: header row 1, footer last row, content fills the rows between. Forced colors: non-ghost cards get a `CanvasText` border.

### UI Elements

#### `<layout-badge>`

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-size` | `s`, (default), `l` | Size (`s` = type-scale token with an 11px floor). Renamed from `sm` / `lg` |
| `data-color` | `primary`, `success`, `warning`, `error`, `info`, `brand`, `secondary`, `accent` | Color |
| `data-variant` | (default solid), `subtle`, `outlined` | Style variant |
| `data-shape` | `square` (default: pill) | Shape |

Subtle and outlined variants use `--color-*-text` ink (light-dark) on `--color-*-subtle` / transparent; primary/brand/secondary/accent derive a mode-aware tint + ink from their colour. Forced colors: `CanvasText` border on every badge.

#### `<status-message>`

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-variant` | `success`, `warning`, `error`, `info`, `neutral` | Type (default: info) |
| `data-filled` | (boolean) | Solid color fill |
| `data-compact` | (boolean) | Reduced padding |

Children: `[data-icon]`, `[data-content]`, `[data-title]`, `[data-description]`, `[data-dismiss]`

#### `<text-divider>`
Horizontal divider with centered text content. No attributes.

#### `<user-avatar>`

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-size` | `xs`, `sm`, `md`, `lg`, `xl`, `2xl` | Size |
| `data-shape` | `square`, `rounded` (default: circle) | Shape |
| `data-ring` | (boolean) | Border ring effect |

Children: `<img>`, `[data-fallback]` (initials), `[data-status]` (`online`, `offline`, `busy`, `away`)

#### `<brand-mark>`

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-size` | `s`, `m`, `l`, `xl` | Size |
| `data-stack` | (boolean) | Vertical layout |

#### `<fab-stack>`
Floating action stack (CSS-only; back-to-top reveal uses JS).

```html
<fab-stack data-float="bottom-right">   <!-- 8 positions; default bottom-right (inline-end) -->
  <button class="fab" aria-label="Compose">…</button>   <!-- first child = primary, nearest the edge, focused first -->
  <a href="#" data-back-to-top aria-label="Back to top">&uarr;</a>
</fab-stack>
```

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-float` | `top-left`, `top-center`, `top-right`, `center-left`, `center-right`, `bottom-left`, `bottom-center`, `bottom-right` (default) | Position. left/right are logical (mirror in RTL, with the physical safe-area inset); `*-center` is the viewport midpoint in any direction |

- Order: `column-reverse` for bottom/center, `column` for `top-*`.
- `<dialog>` / `[popover]` children are not flattened (top layer works).
- Tokens: `--fab-stack-gap`, `--float-offset`, `--nav-bottom-height`, `--z-float`.
- `[data-back-to-top]`: hidden until one viewport of scroll (`[data-visible]`, JS); hidden = `visibility: hidden` (not tabbable). Visible without JS.

#### `<hour-view>`
CSS-only hour slot holding `<calendar-event>` children: two half-hour rows (:00 top, :30 bottom). Placed by its parent (`<day-view>` column 2, `<week-view>` cell); generated automatically when day-view/week-view build their grid.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-overlap` | (boolean) | Events in the same half-hour row sit side by side in equal columns (any count). Without it events stack full width. Set automatically by day-view/week-view only when events share a half-hour row |

Child `calendar-event[data-start="30"]` goes in the bottom half; only `"30"` has an effect (no quarter-hour rows). `data-duration` events are lifted out and positioned across hours by day-view/week-view JS.

#### `<form-field>`
Accessible form field: binds its control (native input/textarea/select, or a form-associated custom element such as `<date-picker>` / `<star-rating>` / `<combo-box>`), times validation (on leaving the field, then eager after the first error) and wires `aria-describedby` (hints + counter, then the error while invalid) and `aria-invalid`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-type` | `checkbox`, `radio` | Inline label layout; no status icon |
| `data-no-icon` | (boolean) | Disable validation icons |
| `data-floating-label` | (boolean) | Floating label; a real `placeholder` keeps it floated |
| `data-valid` / `data-invalid` | (boolean) | State (set by the component; settable by hand) |
| `data-pending` | (boolean) | Dim + block pointer input |
| `data-state` | `validating` | Async spinner hook |
| `data-message-invalid` | string | Last-resort error message |
| `data-label-*` | string | i18n: `show-password`, `hide-password`, `digit`, `incomplete`, `strength`, `strength-weak/fair/good/strong`, `requirements`, `rule-length/uppercase/lowercase/number/special` |

On the control: `data-message-<validitykey>` (`valuemissing`, `badinput`, `typemismatch`, `patternmismatch`, `tooshort`, `toolong`, `rangeunderflow`, `rangeoverflow`, `stepmismatch`, `customerror`); `data-type="otp|pin"` + `data-length`; `data-strength` + `data-rules`; `data-count` on textarea.

Children pattern: `<label>` + control + `<output class="hint">` + `<output class="error">` (authored error text = no-JS message and JS fallback).

API: `validate({ show = true } = {})` → boolean (shows errors immediately), `setError(msg)` (cleared on next edit), `clearError()`, `fieldName`, `input`; event `form-field:upgraded`.

Features: silent `*` on the field's only label / legend, validation icons (forced-colors aware), error visibility via `:user-invalid` / `[data-invalid]`.

#### `<loading-spinner>`

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-size` | `xs`, `s`, `m`, `l`, `xl` | Size (em-relative) |
| `data-variant` | `primary`, `success`, `warning`, `error` | Color (token-driven) |
| `data-overlay` | (boolean) | Absolute overlay (`inset: 0`) over the nearest positioned ancestor, translucent backdrop, spinner centered. The container needs a non-static position |

A11y: standalone spinner → `role="status"` + `aria-label` (CSS cannot add a role); next to visible text → `aria-hidden="true"`. Custom properties: `--spinner-size`, `--spinner-width`, `--spinner-color`, `--spinner-track`, `--spinner-speed`.

#### `<progress-ring>`

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-size` | `xs`, `s`, `m`, `l`, `xl` | Size |
| `data-variant` | `success`, `warning`, `error` | Color (default: primary) |
| `data-indeterminate` | (boolean) | Spinning animation |

CSS custom property `--progress` (0–100) controls fill.

### Token Display Elements (for documentation)

| Element | Description |
|---------|-------------|
| `<token-swatch>` | Color preview with name/value (`data-size="s/l"`) |
| `<token-scale>` | Bar chart of spacing/sizing values |
| `<token-preview>` | Font family/weight preview (`data-layout="center"`) |
| `<token-row>` | Type scale/border width row |
| `<token-animation>` | Easing function demo |

---

## 4. Web Components

JavaScript-powered custom elements. Import via `vanilla-breeze.js`.

> **Authoritative manifest:** `custom-elements.json` (CEM) at the repo root is the
> machine-readable source of truth for every web component, regenerated on every
> build (`npm run build:cem`). The entries below are the human-readable companion;
> when a component is missing detail here, read its `api.json` and `logic.js`.

### Component index (66 elements)

| Element | Purpose | Detail below |
|---------|---------|:------------:|
| `<accordion-wc>` | Enhanced details/summary accordion | ✓ |
| `<audio-player>` | Custom-controls audio playback | |
| `<audio-visualizer>` | Real-time audio waveform visualization | |
| `<card-list>` | Data-driven repeating card list | ✓ |
| `<carousel-wc>` | Slideshow / carousel with autoplay, indicators | ✓ |
| `<change-set>` | Change-tracking surface for `<ins>`/`<del>` blocks (provenance lens) | |
| `<chart-wc>` | Charting wrapper around `src/charts/` types | |
| `<chat-input>` | Chat composer (textarea, attachments, send) | |
| `<chat-window>` | Threaded chat surface (works with `<chat-message>`) | |
| `<color-palette>` | Swatch grid for theme/brand color demos | |
| `<combo-box>` | Accessible autocomplete combobox | ✓ |
| `<command-palette>` / `<command-group>` / `<command-item>` | Cmd+K command surface | ✓ |
| `<compare-surface>` | Before/after image slider | ✓ |
| `<consent-banner>` | Cookie / privacy consent banner | |
| `<content-swap>` | Flippable / swap front-and-back content | ✓ |
| `<context-menu>` | Right-click context menu | ✓ |
| `<data-table>` | Sortable, filterable, selectable table | ✓ |
| `<date-picker>` | Form-associated date picker (combobox text entry + calendar popup) over `<input type="date">` | ✓ |
| `<day-view>` | Hour-grid schedule for one day (calendar-event children) | ✓ |
| `<drag-surface>` | Drag-and-drop reorder zone (`group`, `orientation`, `disabled`, `data-move-controls`; children `draggable="true"` + `data-id`, optional `data-drag-handle`) | |
| `<drop-down>` | Generic dropdown menu | ✓ |
| `<emoji-picker>` | Emoji search & insert popover | ✓ |
| `<flow-diagram>` | User-flow chart from a nested `<ol>` (start/action/decision/process/wait/end, branches) | ✓ |
| `<foot-notes>` / `<foot-note>` | Footnote collection / inline reference | ✓ |
| `<form-field>` | Field shell with label, help, error, password rules | (see §3) |
| `<geo-map>` | OpenStreetMap-backed map embed | ✓ |
| `<glossary-index>` | Enhances a static A–Z glossary (`.glossary-jump` nav + `section.glossary-section` > `dl`): `<search>` filter (`placeholder`, `data-label-filter`), polite match status + empty state, scroll-spy `aria-current`, copy-link permalink on each `dt[id]`; `data-label-matches-<plural>`/`all-<plural>`/`empty`/`permalink`/`copied` | |
| `<glossary-wc>` | Searchable, categorized glossary over `<dl>` of `div[data-term-id][data-category]` > dt/dd: `data-title` (+ `data-heading-level`), `searchable`, `compact`, `src` JSON `{ title?, terms: [{ id, term, definition, category?, seeAlso?, definitionHtml? }] }` (definition = text; definitionHtml = sanitized opt-in), `data-state` loading/ready/error, `.terms` get/set; events `glossary-wc:ready` `{ termCount, categories }`, `glossary-wc:search` `{ query, matchCount }`, `glossary-wc:terms-changed` `{ terms, source }`, `glossary-wc:error` `{ url, error }`; Intl.Collator letter jump bar for the element's `lang`; `data-label-*` strings | |
| `<heading-links>` | Auto-anchor permalinks on headings | ✓ |
| `<highlight-wc>` | Text highlighting: highlighter + colour palette in `<selection-menu>`; standalone = programmatic API | ✓ |
| `<icon-wc>` | Lucide icon insertion | ✓ |
| `<image-gallery>` | Thumbnail grid (`a > img` or `figure > a > img + figcaption`) → native `<dialog>` lightbox: `columns`, `gap`, `ratio`, `controls` edge/bar/minimal, `loop`, `captions` auto/overlay/hidden, `transition` morph/fade/none; direction-aware arrows/swipe; `.images` get/set `{ href, thumbSrc, alt, caption }` (string caption = text; Node/`<template>` = rich), `open(i)`/`close()`/`next()`/`prev()`, event `image-gallery:images-changed` `{ images, source }`; `data-label-dialog`/`close`/`prev`/`next`/`show-details`/`hide-details`/`counter` ("Image {n} of {total}") | |
| `<image-map>` / `<map-area>` | Percentage-coordinate hotspot image map over a child `<img>` (or host `src`/`alt`): `<map-area shape="rect\|circle\|poly" coords label href target tooltip="hover\|click\|none" disabled>`, content = tooltip (hoverable, Escape anywhere; click mode is a disclosure with focus in/out); `.regions` get/set (round-trips tooltip/disabled/content); events `image-map:area-enter`/`area-leave` (pointer + focus), `area-activate` (pointer + Enter/Space, cancelable), `regions-changed` `{ regions, source }`; `data-label-map` | |
| `<include-file>` | Same-origin HTML fragment include, sanitized by default: `src` (resolved against the page; blob:/data:/javascript: refused), `mode` replace/append/prepend, `lazy`, `trusted` (skip sanitizing), `allow-scripts` (requires `trusted`), `allow-cross-origin`, `data-label-error`; state `data-loading`/`data-loaded`/`data-error` + `aria-busy`; cycles and nesting > 10 refused; `.src`, `reload()`; events `include-file:loaded` `{ src, url, html }`, `include-file:error` `{ src, error }`, `include-file:src-changed` `{ src, source }` | ✓ |
| `<markdown-editor>` | Markdown authoring textarea + preview | |
| `<markdown-viewer>` | Render markdown to sanitized HTML | |
| `<page-info>` | Document provenance disclosure (auto-reads §11 metadata) | (see §11) |
| `<page-toc>` | Auto-generated table of contents | ✓ |
| `<page-tour>` / `<tour-step>` | Guided product tour overlays | |
| `<print-page>` | Print preview / paginated print view | |
| `<qr-code>` | QR code generator | ✓ |
| `<reader-view>` | Reader-mode style stripping | |
| `<settings-panel>` | Application settings drawer | |
| `<short-cuts>` | Keyboard shortcut overlay (reads `data-hotkey`) | ✓ |
| `<site-index>` | Aggregates `vb:topic`/keywords across pages | |
| `<site-map>` | Hierarchical sitemap renderer | |
| `<site-search>` | Pagefind-backed site search | ✓ |
| `<slide-accept>` | "Slide to confirm" affordance | ✓ |
| `<social-embed>` | oEmbed-style social media embed | |
| `<spacing-specimen>` | Token specimen — spacing scale demo | |
| `<split-surface>` | Resizable split-pane | ✓ |
| `<star-rating>` | Star rating input (works on `[data-rating]` too) | ✓ |
| `<tab-set>` | Accessible tabs | ✓ |
| `<text-reader>` | Text-to-speech reader (Web Speech API) | |
| `<theme-picker>` | Theme switcher dropdown | ✓ |
| `<time-index>` | Timeline of recently-updated pages (reads `last-modified`) | |
| `<toast-msg>` | Toast notification queue | ✓ |
| `<tool-tip>` | Anchor-positioned rich tooltip | ✓ |
| `<type-specimen>` | Token specimen — typography scale demo | |
| `<video-player>` | Custom-controls video playback | |
| `<week-view>` | Multi-day hour grid in a semantic table | ✓ |
| `<youtube-player>` | Privacy-respecting YouTube embed | |

Detailed entries follow for the components with extended attributes/events. See `api.json` per component for the complete attribute & event surface.

### `<tab-set>`
Accessible tabbed interface built on `<details name>` / `<summary>` children (no `role="tab"` / `role="tabpanel"` overrides; summary keeps its button role and `aria-expanded`).

| Events | Detail |
|--------|--------|
| `tab-set:change` | `{ index }` |
| `tab-set:tabs-changed` | `{ tabs, source }` |

### `<accordion-wc>`
Enhanced `<details>`/`<summary>` accordion.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-single` | (boolean) | Only one panel open at a time |

| Events | Detail |
|--------|--------|
| `accordion-wc:toggle` | `{ open, summary, details }` |

### `<tool-tip>`
Rich tooltip/popover container.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-position` | `top`, `bottom`, `left`, `right` | Position |
| `data-trigger` | `hover`, `click`, `focus` | Trigger mode |
| `data-tooltip-delay` | ms value | Show delay |
| `data-no-flip` | (boolean) | Disable auto-flip |

| Events |
|--------|
| `tool-tip:show`, `tool-tip:hide` |

### `<drop-down>`
Action menu (APG menu button) by default; with `hover`, a navigation disclosure (APG disclosure nav — no menu roles).

| Attribute | Values | Description |
|-----------|--------|-------------|
| `position` | `bottom-start` (default), `bottom-end`, `top-start`, `top-end` | Placement; start/end are logical (mirror in RTL) |
| `hover` | (boolean) | Navigation disclosure: links stay in Tab order, `<button data-dropdown-toggle aria-expanded>` toggles (generated beside a link trigger); opens on mouse hover or toggle activation, never on focus |
| `no-flip` | (boolean) | Keep the requested side; don't flip on viewport overflow |
| `open` | (output) | Reflected open state |

| Child attribute | On | Description |
|-----------------|----|-------------|
| `data-trigger` | `button`, `a` | The trigger (falls back to the first direct `<button>`) |
| `data-disabled` | `button`, `a` | `aria-disabled="true"`; stays in arrow-key order, not activatable |
| `data-value` | `button`, `a` | Reported in `drop-down:select` and `items` |
| `data-dropdown-toggle` | `button` | Nav-mode submenu toggle (author one to set its `aria-label`) |

| Events | Detail |
|--------|--------|
| `drop-down:open`, `drop-down:close` | — |
| `drop-down:select` | `{ item, value }` |
| `drop-down:items-changed` | `{ items, source: 'property' }` |

Properties: `items` (`{ label, value?, href?, disabled? } | { separator: true }`), `isOpen`. Methods: `open()`, `close()`, `toggle()`.

Children: trigger + `<menu>` (or `<ul role="menu">`) of `<li>` holding `<button>`/`<a>`. Only rows whose nearest menu is this one belong to it, so nested drop-downs stay independent.

### `<emoji-picker>`
Accessible emoji picker: search, category toolbar, listbox of emoji, undoable insertion into a target. Panel is a top-layer `popover` (never clipped), flips above when needed, RTL-aware.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `for` | element ID | Target input/textarea/contenteditable (inserted at the caret via `insertText`; fires an `input` event) |
| `recent-limit` | number | Max recent emoji (default: 24) |
| `data-label-trigger`, `-dialog`, `-search`, `-placeholder`, `-categories`, `-emoji`, `-recent`, `-empty` | string | Localized UI strings |
| `data-label-results` | string | Result-count announcement, `{count}` replaced (default `{count} emoji found`) |
| `data-label-{group}` | string | Category names: `smileys`, `people`, `animals`, `food`, `travel`, `activities`, `objects`, `symbols`, `flags` |
| `open` | (reflected) | Output only — set by the methods |

| Methods / properties | |
|--------|--------|
| `open()`, `close()`, `toggle()` | Safe before the data loads (queued) |
| `isOpen` | boolean |
| `ready` | Promise — resolves when built; `data-upgraded` is set at the same time |

| Events | Detail |
|--------|--------|
| `emoji-picker:select` | `{ shortcode, emoji, name, keywords }` |
| `emoji-picker:open` | — |
| `emoji-picker:close` | — |

Children: `<button data-trigger>` (first child `<button>` or auto-created if absent; hidden until defined). Extended set: `<script type="module" src="/cdn/emoji-extended.js">` or `import 'vanilla-breeze/emoji-extended'` (any load order; also feeds `data-emoji`).

### `<context-menu>`
Right-click context menu.

| Events | Detail |
|--------|--------|
| `context-menu:open` | — |
| `context-menu:close` | — |
| `context-menu:select` | `{ value, label }` |

Children: `<menu>` with `<button data-command="...">` items.

### `<toast-msg>`
Toast notification container.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-position` | `top-end`, `top-start`, `top-center`, `bottom-end`, `bottom-start`, `bottom-center` | Position |
| `data-max` | number | Max visible toasts |

| Events | Detail |
|--------|--------|
| `toast-msg:show` | `{ message, variant }` |
| `toast-msg:hide` | `{ message, variant }` |

JS API: `document.querySelector('toast-msg').show({ message, variant, duration })`

Toast variants: `data-variant="info|success|warning|error"` on `.toast` child.

### `<site-search>`
Full-text search overlay with keyboard navigation.

| Events |
|--------|
| `site-search:open`, `site-search:close` |

### `<command-palette>` / `<command-group>` / `<command-item>`
Command palette (Cmd+K). Opens via `data-command` button or programmatic API.

| Events | Detail |
|--------|--------|
| `command-palette:select` | `{ value, label }` |
| `command-palette:open`, `command-palette:close` | — |

### `<data-table>`
Enhanced data table with sort, filter, pagination, expansion, selection. `data-filterable` and `data-paginate` go on the inner `<table>`; sortable headers get a `<button data-sort-button>` inside the `<th>` (aria-sort stays on the th).

| Attribute | On | Description |
|-----------|----|-------------|
| `data-label-no-results` | `<data-table>` | Empty-state / announcement text (default "No matching rows found") |
| `data-filterable` | `<table>` | Adds a search input |
| `data-paginate` | `<table>` | N rows per page |

| Events | Detail |
|--------|--------|
| `data-table:sort` | `{ column, direction, columnName }` |
| `data-table:filter` | `{ query, count }` |
| `data-table:expand` | `{ row, expanded }` |
| `data-table:selection` | `{ count, rows }` |
| `data-table:page` | `{ page }` |
| `data-table:rows-changed` | `{ rows, added, moved, removed, source }` |

### `<carousel-wc>`
Slideshow/carousel with autoplay.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-autoplay` | (boolean) | Auto-advance slides |
| `data-autoplay-delay` | ms value | Delay between slides |
| `data-loop` | (boolean) | Loop back to start |
| `data-indicators` | (boolean) | Show dot indicators |

| Events | Detail |
|--------|--------|
| `carousel-wc:change` | `{ index }` |
| `carousel-wc:play`, `carousel-wc:pause` | — |

### `<content-swap>`
Two-face content toggle with configurable transitions.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-transition` | `flip` (default), `flip-vertical`, `fade`, `slide-left`, `slide-up`, `scale` | Transition effect |
| `data-swapped` | (boolean) | Reflects swap state |
| `data-card` | (boolean) | Apply layout-card visual shell |

| Events | Detail |
|--------|--------|
| `content-swap:swap` | `{ swapped: boolean }` |

Children: `[data-face="front"]` + `[data-face="back"]`

Attribute form: `<article data-swap data-transition="fade">` — same behavior on any element via auto-init.

Page-level auto-card: `<body data-swap-autocard>` applies card chrome to bare content-swap elements.

### `<compare-surface>`
Before/after image comparison slider.

| Events | Detail |
|--------|--------|
| `compare-surface:change` | `{ position }` |

### `<split-surface>`
Resizable split panes.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `direction` | `horizontal`, `vertical` | Split direction |
| `position` | 0-100 | Initial split position % |
| `min` | 0-100 | Minimum panel size % |
| `max` | 0-100 | Maximum panel size % |
| `collapsible` | (boolean) | Allow panel collapse |
| `persist` | (string key) | Remember size in localStorage |
| `data-label-resize` | string | Divider accessible name (default "Resize panels") |

| Events | Detail |
|--------|--------|
| `split-surface:resize` | `{ position }` |
| `split-surface:collapse` | `{ collapsed }` |

`aria-orientation` is the divider's own axis (`vertical` for side-by-side panels). Drag and arrow keys mirror in RTL. The `data-splitter` attribute utility shares the divider markup but fires `splitter:resize` (`{ position }`), not `split-surface:resize`; it also reads `data-label-resize` on the container.

### `<star-rating>`
Interactive star rating (form-associated).

| Attribute | Values | Description |
|-----------|--------|-------------|
| `value` | `0`–`5` | Current value |
| `max` | number | Maximum stars (default: 5) |
| `readonly` | (boolean) | Read-only mode |
| `allow-half` | (boolean) | Half-star increments |
| `icon` | string | Custom icon name |
| `label` | string | Accessible label |
| `name` | string | Form field name |
| `required` | (boolean) | Required for form validation |

### `<combo-box>`
Form-associated combobox/autocomplete. Single-select by default; add `multiple` for multi-select tag mode.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `name` | string | Form field name |
| `value` | string | Selected value (single mode) |
| `filter` | `startsWith`, `contains` | Filter mode (default: `contains`) |
| `required` | (boolean) | Required validation |
| `placeholder` | string | Input placeholder text |
| `multiple` | (boolean) | Multi-select tag mode |
| `max` | number | Maximum tags (multi mode) |
| `custom` | (boolean) | Allow custom entries (multi mode) |

| Events | Detail |
|--------|--------|
| `combo-box:change` | `{ value, label }` (single) or `{ values, labels }` (multi) |
| `combo-box:open` | — |
| `combo-box:close` | — |

Children: `<input>` + `<ul>` with `<li data-value="...">` options.

### `<date-picker>`
Form-associated date picker. Wraps a native `<input type="date">` (the no-JS fallback); on upgrade renders a combobox text input + calendar popup. Submitted value is always ISO `YYYY-MM-DD`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `name` | string | Form field name (a `name` on the inner input moves here on upgrade) |
| `disabled` | (boolean) | Disable (also via disabled `<fieldset>`; inner-input `disabled` moves here) |
| `required` | (boolean) | Required validation (host or inner input) |
| `data-disabled-dates` | `YYYY-MM-DD[:reason],…` | Disabled days (focusable, not selectable); reasons `booked`, `unavailable`, `holiday` styled |
| `data-highlight-dates` | `YYYY-MM-DD[:category],…` | Highlighted, still selectable; categories `holiday`, `deadline`, `event` styled |
| `data-label-toggle` / `-dialog` / `-prev` / `-next` / `-year` / `-placeholder` / `-required` / `-input` | string | Translate built-in UI strings |

| Events | Detail |
|--------|--------|
| `date-picker:change` | `{ value, date, source }` (`value` `''` / `date` `null` when cleared) |
| `date-picker:open` | — |
| `date-picker:close` | — |

Properties: `value` (ISO; `''` clears), `min`, `max`. Children: `<input type="date">` supplying `value` (reset target), `min`, `max`, `name`, `id` (its `<label for>` names the combobox). Locale = nearest `lang`.

### `<theme-picker>`
Theme picker UI (mode, theme, extensions).

| Events | Detail |
|--------|--------|
| `theme-picker:open`, `theme-picker:close` | — |
| `extensions-change` (on window) | `{ extension, value }` |

### `<foot-notes>` / `<foot-note>`
Footnote / sidenote system. `<foot-note>` elements anywhere *before* the `<foot-notes>` are collected; content nodes move into a `<section role="doc-endnotes">` list, references become `<a role="doc-noteref">` named "Footnote N", backlinks `role="doc-backlink"`.

| Attribute (`<foot-notes>`) | Values | Description |
|-----------|--------|-------------|
| `data-mode` | `sidenotes` | Margin notes instead of a collected list |
| `data-label-back` | string (default `Back to content`) | Backlink accessible name; repeat citations append ` (a)`, ` (b)` |
| `data-label-ref` | string with `{n}` (default `Footnote {n}`) | Reference accessible name |
| `data-label-heading` | string (default `Notes`) | Visually hidden list heading (an authored h1–h6 child is used instead) |
| `data-preview` | `false` | Disable the hover/focus preview popover |

| Attribute (`<foot-note>`) | Values | Description |
|-----------|--------|-------------|
| `data-ref` | id of another `<foot-note>` | Cite that note again (leave empty); shared number, a/b backlinks |
| `data-side` | `false` | In sidenote mode, send this note to the list |

Generated ids: `fnref-I-N` (reference link), `fnref-I-N-b`… (repeat citations), `fn-I-N` (note), `fnh-I` (heading).

### `<heading-links>`
Adds permalink anchors to headings. Activating one follows the fragment (`:target`, history, focus, reduced-motion aware) and copies the absolute section URL — every activation writes to the clipboard. Generated ids are Unicode-aware slugs (`café-crème`, `日本語の見出し`; emoji-only → `section`), deduped `-1`, `-2`; mirrored by `scripts/check-links.mjs`. Skips headings in `dialog`, `[data-toc-ignore]`, `browser-window` and nested `heading-links`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `levels` | Comma-separated `h1`–`h6` (default `h2,h3`) | Heading levels to process; invalid tokens ignored; observed |
| `data-label-anchor` | Text (default `Copy link to`) | Anchor name prefix — anchor is named prefix + heading text |
| `data-label-copied` | Text (default `Link copied to clipboard`) | Copy announcement |
| `data-toc-ignore` | Boolean, on heading or ancestor | Skip heading(s); shared with `<page-toc>` |

| Events | Detail |
|--------|--------|
| `heading-links:navigate` | `{ id, url, heading }` |

After a copy the anchor gets `data-state="copied"` (styling hook).

### `<page-toc>`
Auto-generated table of contents from headings.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `levels` | e.g. `h2,h3` | Heading levels to include |
| `scope` | CSS selector | Container to scan |
| `title` | string | ToC title text |

| Events | Detail |
|--------|--------|
| `page-toc:navigate` | `{ id, heading }` |

### `<card-list>`
Data-driven card list from JSON.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `src` | URL | JSON data source |
| `data-items` | JSON string | Inline data |
| `data-key` | string | Unique key field |

| Events | Detail |
|--------|--------|
| `card-list:render` | `{ count }` |

Uses `<template>` child for card layout with `data-field="..."` bindings.

### `<icon-wc>`
SVG icon component. Fetches one sanitized SVG per icon from `<base-path>/<set>/<name>.svg`; falls back to Lucide.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `name` | string | Icon name (e.g. `arrow-right`) |
| `set` | string | Icon set (default: nearest `data-icon-set` on self/ancestor/`<html>`, then `lucide`) |
| `size` | `xs`, `sm`, `md`, `lg`, `xl`, `2xl` | Icon size |
| `label` | string | Accessible label (omit for decorative icons) |
| `base-path` | URL | Icon base (default: `<html data-icon-path>`, then `/cdn/icons`) |
| `data-flip-rtl` | (boolean) | Mirror the glyph in RTL contexts |
| `data-animate` | `spin` | Spin while an ancestor has `data-loading` |
| `data-error` | (output) | Set when the icon could not load |

### `<qr-code>`
QR code generator.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-value` | string | Data to encode |
| `data-size` | number | Canvas size in px |
| `data-error-correction` | `L`, `M`, `Q`, `H` | Error correction level |

### `<include-file>`
Same-origin HTML fragment include. Fetched HTML is sanitized unless `trusted`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `src` | URL | Fragment URL, same-origin http(s) only unless `allow-cross-origin` |
| `mode` | `replace` (default), `append`, `prepend` | Insertion mode; unknown values act as `replace` |
| `lazy` | (boolean) | Load on viewport entry |
| `trusted` | (boolean) | Skip sanitizing (author-vouched source) |
| `allow-scripts` | (boolean) | Run fragment scripts; requires `trusted` |
| `allow-cross-origin` | (boolean) | Permit another origin (CORS); still sanitized unless `trusted` |
| `data-label-error` | string | Error message text (default "Failed to load content") |

| Events | Detail |
|--------|--------|
| `include-file:loaded` | `{ src, url, html }` |
| `include-file:error` | `{ src, error }` |
| `include-file:src-changed` | `{ src, source: 'property' }` |

### `<geo-map>`
Raster tile map (OpenStreetMap / CARTO / your own tile proxy) with a lazy-loaded pan / zoom mode.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `lat` | number | Latitude of the centre |
| `lng` | number | Longitude of the centre |
| `zoom` | 1–19 (default 15) | Zoom level |
| `marker` | `true` (default), `false` | Show centre marker |
| `marker-color` | CSS colour | Pin fill; invalid values ignored. Default `--geo-map-marker-color` → `--color-error` |
| `provider` | `osm` (default), `carto-light`, `carto-dark`, `carto-auto` | Built-in tiles + required credit; `carto-auto` follows `data-mode` / `prefers-color-scheme` |
| `tile-url` | URL template | Overrides `provider`; `{z}` `{x}` `{y}`, `{s}` (a/b/c), `{r}` (`@2x` on hi-DPI) |
| `attribution` | text | Credit for a `tile-url` source (or slot `slot="attribution"`) |
| `attribution-href` | URL | Link for that credit |
| `interactive` | `click` (default), `eager`, `none` | Activation mode |
| `static-only` | (boolean) | Never activate |
| `loading` | `lazy` (default), `eager`, `consent` | `consent`: no tile requests until the user presses "Load map" |
| `label` | text | Accessible name (default "Map of …" from slotted `<address>`, `src` name, or `place`) |
| `src` | ID | `<address data-lat data-lng>` or JSON-LD `<script>` to read coordinates from |
| `place` | text | JSON-LD Place name to match |
| `data-label-*` | text | i18n: `map`, `map-of`, `activate`, `consent`, `consent-note`, `zoom-in`, `zoom-out`, `recenter`, `exit`, `controls`, `instructions`, `moved`, `error-coords`, `error-tiles` |
| `data-ready` | (output) | Set when static tiles have loaded |

Properties: `data` (get / batched set `{ lat, lng, zoom, marker, markerColor }`), `markers` (read-only), `active` (read-only; also `:state(active)`).

| Events | Detail |
|--------|--------|
| `geo-map:ready` | `{ lat, lng, zoom }` |
| `geo-map:activate` | `{ lat, lng, zoom }` |
| `geo-map:move` | `{ lat, lng, zoom }` |
| `geo-map:data-changed` | `{ data, source: 'property' }` |
| `geo-map:error` | `{ message }` |

### `<slide-accept>`
Slide-to-confirm action.

| Events |
|--------|
| `slide-accept:accept`, `slide-accept:reset` |

### `<short-cuts>`
Keyboard shortcut overlay display.

Reads `data-hotkey` and `data-shortcut` attributes from page elements.

### `<day-view>`
Hour-grid schedule. Author `<ol>` > `<li>` > `<time datetime="HH:00">` + `<hour-view>`, or put `<calendar-event>` children directly inside to generate the grid.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-date` | ISO date | Names the hour list; `detail.date` in event-click |
| `data-start-hour` | `0`–`23` \| `auto` (default `7`) | First generated hour; `auto` = sparse range; grows to fit events |
| `data-end-hour` | `0`–`23` (default `19`) | Last generated hour |
| `data-compact` | (boolean) | Dialog/overlay presentation |
| `data-label-continues` | string | Suffix for a clipped span's accessible name |

Child `calendar-event`: `<time datetime>` = `HH:MM` or full ISO (wall-clock as written); `data-duration` = `2h`, `1.5h`, `45m`, `90m`, `1h30m`, `60` (minutes), `PT1H30M` (fallback 1h); `data-continues` is set by the component on spans clipped at the last hour.

| Property / method | Description |
|-------------------|-------------|
| `events` | get/set `{ time?, text, category?, duration?, href? }[]` |
| `refresh()` | Re-measure spanning events |

| Events | Detail |
|--------|--------|
| `day-view:event-click` | `{ date, time, text, element, category, duration }` (click or Enter/Space) |
| `day-view:events-changed` | `{ events, source: 'property' }` |

### `<week-view>`
Same parsing and keyboard model as `<day-view>`, one column per day.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-start-date` | ISO date | First day column |
| `data-days` | number (default `7`) | Day columns |
| `data-start-hour` | `0`–`23` \| `auto` (default `auto`) | First hour; grows to fit events |
| `data-end-hour` | `0`–`23` (default `19`) | Last hour |
| `data-label-continues` | string | Suffix for a clipped span's accessible name |

Child `calendar-event[data-date]` assigns the day column. `events` get/set (`{ date?, time, text, category?, duration? }`; date derived from an ISO `time`), `refresh()`. Events: `week-view:event-click`, `week-view:events-changed`.

### `<flow-diagram>`
Progressively enhances a nested `<ol>` into a flow chart. Renders a `<figure>` (named by the heading or `data-label`) holding a nested list of node `<button>`s; one tab stop, arrow keys/Home/End move, Enter/Space select. Source `<ol>` is hidden while upgraded.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-title` | string | Heading that names the figure (replaces `title`) |
| `data-heading-level` | `1`–`6` (default `2`) | Heading level |
| `src` | URL | JSON `{ title?, steps }`; loaded on connect when there is no inline `<ol>` |
| `data-direction` | `vertical` \| `horizontal` | Horizontal follows writing direction (RTL-aware) |
| `compact` | boolean | Tighter spacing (CSS only) |
| `data-label` | string | Figure name without a title (default `Flow diagram`) |
| `data-label-selected` | string | Select announcement, `{text}` replaced |
| `data-label-steps-{one,other,…}` | string | Step-count summary via `Intl.PluralRules`, `{count}` replaced |
| `data-label-type-{type}` | string | Spoken type prefix (`Start`, `Action`, `Decision`, `Process`, `Wait`, `End`) |

Child `<li>`: `data-type` (`start` \| `action` (default) \| `decision` \| `process` \| `wait` \| `end`), `data-annotation`; a decision nests `<ol><li data-branch="Yes"><ol>…</ol></li>…</ol>`.

`steps` get/set (`{ type, text, annotation?, branches?: [{ label, steps }] }[]`, normalized, written back into the source `<ol>`). Events: `flow-diagram:ready` `{ nodeCount }` (every render), `flow-diagram:select` `{ type, text }`, `flow-diagram:steps-changed` `{ steps, source }`. Colour hooks: `--fd-<type>-text|border|bg`, `--fd-line`.

### `<highlight-wc>`
Primary usage is as a `<selection-menu>` child: renders a highlighter `<button>` (`aria-expanded`, `aria-controls`) that opens a palette group of swatch buttons (`aria-pressed` on the last-used colour, colour name as label + tooltip); picking a swatch highlights the selection in whichever menu target it falls in (each target gets its own engine controller; stored highlights paint on load). Escape closes the palette (toolbar stays), outside click / `selection-menu:dismiss` close it. Standalone (`<highlight-wc><article>` or `for="id"`) renders **no UI** — persistence, rendering, API and events only.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `colors` | comma list (default `yellow,green,blue,pink`) | Palette; each name needs `--highlight-{name}` |
| `readonly` | boolean | Render stored highlights only; no highlighter button in selection-menu |
| `storage-key` | string | Storage key suffix (default pathname) |
| `for` | ID | Standalone target (default first child); ignored in selection-menu |
| `data-label-button` / `data-label-palette` | string | Button / palette names (`Highlight selection` / `Highlight color`) |
| `data-label-annotation` / `-added` / `-removed` | string | Forwarded to the target as `data-highlights-label-*` (margin text, announcements) |

Methods: `highlightSelection(color?)`, `getHighlights()`, `removeHighlight(id)`, `clearAll()`, `exportHighlights()`, `importHighlights(json)` → `{ imported, rejected }` (drops bad shape / out-of-range offsets / non-palette colours). In selection-menu mode methods act on the last highlighted (else first) target. Events on the target, bubbling: `highlights:added` `{ id, text, color, note }`, `highlights:removed` `{ id }`, `highlights:selected` `{ text, rect }`, `highlights:clicked` `{ id, highlight }`, `highlights:note-changed` `{ id, note }`. Tokens: `--highlight-{yellow,green,blue,pink}` (`light-dark()` pairs), `--highlight-ink`, optional `--highlight-{name}-ink`. Forced colors: `Mark`/`MarkText` + per-colour underline style. Highlight API ranges are not exposed to AT (announcement only); margin annotations are `aria-hidden`.

---

## 5. Layout System

### `data-layout` Attribute Values

Apply `data-layout="value"` on any element. Shared CSS in `src/custom-elements/layout-attributes.css`.

| Value | Description |
|-------|-------------|
| `stack` | Vertical flex |
| `cluster` | Horizontal flex with wrap |
| `grid` | Auto-fit responsive grid |
| `center` | Centered with max-width |
| `cover` | Full-height with centered principal |
| `sidebar` | Two-column sidebar layout |
| `switcher` | Responsive horizontal↔vertical |
| `reel` | Horizontal scroll |
| `imposter` | Positioned overlay |
| `text` | Typographic text container |
| `split` | Equal two-column split |
| `holy-grail` | Header + sidebar + content + sidebar + footer |
| `dashboard` | App shell with sidebar nav |
| `regions` | Named grid template areas |
| `media` | Media object (image + text) |
| `page-stack` | Full-page vertical stack |

### `data-page-layout` Values (on `<body>`)

| Value | Description |
|-------|-------------|
| `stack` | Simple vertical stack (also the bare `data-page-layout` default) |
| `sidebar-left` | Left sidebar layout |
| `sidebar-right` | Right sidebar layout |
| `holy-grail` | Three-column holy grail |
| `app-shell` | App shell with sidebar |
| `dashboard` | Dashboard layout |
| `article` | Article/reading layout |
| `landing` | Landing page layout |

The old `data-layout="body-*"` spellings of these templates were removed (tfcw).

### Shared Layout Modifier Attributes

These `data-layout-*` attributes work on layout elements and `data-layout` containers:

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | Gap between children |
| `data-layout-align` | `start`, `center`, `end`, `stretch`, `baseline` | Cross-axis alignment |
| `data-layout-justify` | `start`, `end`, `center`, `between` | Main-axis alignment |
| `data-layout-padding` | `none`, `s`, `m`, `l`, `xl` | Container padding |
| `data-layout-min` | grid: `xs`\|`s`\|`m`\|`l`\|`xl`; cover: `s`\|`m`\|`l`\|`xl`\|`auto` (no `xs`) | Minimum size; scale is context-dependent per element — see the layout vocabulary spec |
| `data-layout-max` | `narrow`, `normal`, `wide`, `prose` | Max-width constraint |
| `data-layout-nowrap` | (boolean) | Prevent wrapping |
| `data-layout-sticky` | (boolean) | Sticky positioning |
| `data-layout-bleed` | (boolean) | Span full grid width |
| `data-layout-density` | `compact`, `spacious` | Density variant |
| `data-layout-principal` | (boolean, on child) | Center this element |
| `data-layout-area` | `hero`, `sidebar`, `content`, `feature`, `cta`, `banner`, `toc` | Grid area assignment |
| `data-layout-fill` | (boolean) | Full viewport height (split layouts) |
| `data-layout-order` | `-1`, `1`, `99` | Order utilities |
| `data-layout-ratio` | `2:1`, `1:2`, `3:1`, `1:3`, `golden` | Split layout ratio |
| `data-container` | (boolean) | Establish container query context |

Modifiers apply only to the element they are on: layout private custom properties are reset on every layout host, so a nested layout never inherits an outer layout's gap/min/threshold/measure/padding/align tokens.

### Page-Level State Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-sidebar` | `collapsed`, `hidden` | Sidebar state |
| `data-nav-open` | (boolean) | Mobile nav toggle |

---

## 6. Charts (`src/charts/`)

CSS-only charting built on semantic `<table>` elements. Apply `.vb-chart` class + `data-type`.

### Chart Tokens

| Property | Default | Description |
|----------|---------|-------------|
| `--chart-series-1` … `--chart-series-6` | Colors | Series palette |
| `--chart-height` | `200px` | Chart height |
| `--chart-gap` | `var(--size-xs)` | Gap between bars/columns |
| `--chart-axis-color` | border color | Axis line color |
| `--chart-grid-color` | border-subtle color | Grid line color |
| `--chart-label-color` | text-muted color | Label text color |
| `--chart-duration` | `var(--duration-normal)` | Animation duration |
| `--chart-easing` | `var(--ease-out)` | Animation easing |

### Chart Types

#### Bar Chart (`data-type="bar"`)

Horizontal bars. Each `<td>` uses `--value` (0–1) for width.

| Attribute | Description |
|-----------|-------------|
| `data-series="2"…"6"` | Series color (on td) |
| `data-labels` | Show values inside bars |
| `data-stacked` | Stack multiple series |

#### Column Chart (`data-type="column"`)

Vertical columns. Each `<td>` uses `--value` (0–1) for height.

| Attribute | Description |
|-----------|-------------|
| `data-series="2"…"6"` | Series color (on td) |
| `data-labels` | Show values above columns |
| `data-stacked` | Stack series |
| `data-grouped` | Side-by-side series |

#### Line Chart (`data-type="line"`)

Connected lines. Each `<td>` uses `--start` and `--end` (0–1).

| Attribute | Description |
|-----------|-------------|
| `data-series="2"…"6"` | Series color (on td) |
| `data-grid` | Show grid lines |
| `data-labels` | Show value labels |
| `data-dots="large|small"` | Dot size variant |

#### Area Chart (`data-type="area"`)

Filled area under line. Each `<td>` uses `--start` and `--end` (0–1).

| Attribute | Description |
|-----------|-------------|
| `data-series="2"…"6"` | Series color |
| `data-grid` | Show grid lines |
| `data-labels` | Show value labels |

#### Pie/Donut Chart (`data-type="pie"`)

Conic-gradient pie. `<tbody>` uses `--seg-1`…`--seg-6` (0–1).

| Attribute | Description |
|-----------|-------------|
| `data-donut` | Hollow center |
| `data-center-label` | Text in donut center |
| `data-half` | Semi-circle variant |

### Shared Chart Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-size` | `s`, `l` | Chart size (height 120px or 300px) |
| `data-gap` | `s`, `m`, `l` | Gap between elements |
| `data-axes` | `x`, `y`, `both` | Show axis lines |
| `data-tooltip` | (boolean) | Enable hover tooltips |
| `data-tooltip-position` | `bottom`, `left`, `right` | Tooltip position |

### Chart Legend (`.vb-chart-legend`)

| Attribute | Description |
|-----------|-------------|
| `data-series="1"…"6"` | Color swatch (on item) |
| `data-interactive` | Clickable toggle |
| `data-compact` | Smaller spacing |
| `data-legend-position` | `top`, `left`, `right` (on chart) |

---

## 7. Utilities (`src/utils/`)

### `.visually-hidden`

Screen-reader-only class. Visually hides content while keeping it accessible.

### `.flow`

Vertical rhythm utility. Adds `margin-block-start: var(--flow-space, var(--size-m))` between siblings.

### Loading States (`data-loading`)

| Attribute/Value | Description |
|-----------------|-------------|
| `data-loading` | Shimmer overlay animation |
| `data-loading="hide"` | Hide content completely |
| `data-loading="minimal"` | Subtle pulse only |
| `data-loading="skeleton"` | Skeleton placeholder shapes |
| `.skeleton-line` | Placeholder line element |

### Feedback States (`data-state`)

Container-level state management for empty/loading/error states.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-state` | `empty`, `loading`, `error` | Active state |
| `data-feedback` | `message`, `skeleton` | Presentation variant |

Children: `<output data-empty>`, `<output data-loading>`, `<output data-error>`, `.content`

### Media Container (`data-media`)

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-media` | (boolean) | Aspect-ratio container |
| `data-ratio` | `1:1`, `4:3`, `3:2`, `16:9`, `21:9`, `2:3`, `3:4`, `9:16` (`page` on embed/object/iframe) | Aspect ratio (on a `[data-media]` wrapper; also directly on `<iframe>`, `<embed>`, `<object>`) |
| `data-fit` | `cover`, `contain`, `fill`, `none` | Object-fit |
| `data-position` | `top`, `bottom`, `left`, `right`, `center` | Object-position |
| `data-radius` | `s`, `m`, `l`, `full` | Border radius |

### Debug Mode

| Attribute | Description |
|-----------|-------------|
| `html[data-debug]` | Enable debug mode globally |
| `data-debug-invalid` | Mark invalid content structure |
| `data-debug-message` | Hover message for invalid elements |

### Wireframe Mode

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-wireframe` | `lo`, `mid`, `hi` | Fidelity level |
| `data-wireframe="annotate"` | (value) | Show element labels |
| `data-wf-label` | text | Custom label badge |
| `data-wf-img-label` | text | Image label |

### View Transitions

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-vt` | `main`, `header`, `nav`, `sidebar`, `hero`, `footer` | Named transition group |
| `data-vt-name` | string | Custom transition name |
| `data-vt-class` | `slide-left`, `slide-right`, `scale`, `fade`, `none` | Animation preset |

### Readiness (FOUC Prevention)

| Attribute | Description |
|-----------|-------------|
| `hide-until-ready` | Hidden until custom element is defined |
| `show-until-ready` | Visible until custom element is defined |

---

## 8. JS Enhancers (Data-Attribute Behaviors)

These `data-*` attributes add progressive JS behaviors. Import via `vanilla-breeze.js`.

### Form Enhancers

| Attribute | Element | Description |
|-----------|---------|-------------|
| `data-switch` | `<input type="checkbox">` | Toggle switch UI (`sm`, `lg` sizes) |
| `data-grow` | `<textarea>` | Auto-expanding textarea |
| `data-count` | `<textarea>` | Character/word counter (`data-max`, `data-maxwords`) |
| `data-range` | `<input type="range">` | Enhanced range with value bubble + markers |
| `data-stepper` | `<input type="number">` | +/- button wrapper. For non-numeric values (formatted units, currency, time, token-snap, enums), see [`<stepper-wc>`](/docs/elements/web-components/stepper-wc/) and the [numeric-inputs decision guide](/docs/concepts/numeric-inputs/). Native spinners are hidden only once upgraded (`[data-stepper-init]`). A plain `type="number"` keeps the browser spinners. |
| `data-color` | `<input type="color">` | Enhanced color picker with swatch + hex |
| `data-upload` | `<input type="file">` | Drop zone file upload |
| `data-mask` | `<input>` | Input masking (`data-pattern` for format) |
| `data-toggle-tags` | `<fieldset>` | Checkbox pill chips |
| `data-show-when` | any | Conditional visibility (show when field matches) |
| `data-hide-when` | any | Conditional visibility (hide when field matches) |
| `data-autosave` | `<form>` | Auto-save form to localStorage. Empty value derives key from `method`+`action` |
| `data-autosave-retain` | `<form data-autosave>` | Space-separated allowlist of field names to persist |
| `data-select-all` | `<input type="checkbox">` | Select/deselect all checkboxes |

`data-show-when` / `data-hide-when`: controls in a hidden section are disabled (marked `data-conditional-disabled`) and re-enabled on show; author-disabled controls stay disabled.

### Text Effects

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-gradient-text` | (default), `sunset`, `ocean`, `forest`, `neon` | Gradient text coloring |
| `data-gradient-text-animate` | (boolean) | Animated gradient flow |
| `data-shimmer` | (default), `slow`, `fast` | Shimmering text highlight |
| `data-glitch` | (default), `hover` | Chromatic aberration glitch |
| `data-reveal` | `word`, `line` | Word/line reveal entrance |
| `data-blur-reveal` | `word`, `line` | Blur-to-clear reveal |
| `data-highlight` | (default/underline), `box`, `circle` | Draw-in highlight effect |
| `data-typewriter` | text content | Character-by-character typing |
| `data-scramble` | text content | Decode/unscramble effect |
| `data-emoji` | any container | Replace `:shortcode:` with Unicode emoji |
| `data-emoji-scan` | `once`, `observe` | Scan mode (default: `once`) |
| `data-emoji-unknown` | `keep`, `strip` | Unresolved shortcode handling |

### Interactive Enhancers

| Attribute | Element | Description |
|-----------|---------|-------------|
| `data-copy` | `<button>` | Copy text to clipboard |
| `data-copy-target` | CSS selector | Target element to copy from |
| `data-hotkey` | `<kbd>` | Platform-aware key display (⌘/Ctrl). Caps `aria-hidden` + visually hidden spoken combo ("Command Shift P"). Modifiers `meta`/`cmd`, `alt`/`option`, `shift`, `ctrl`/`control`; named keys `escape` (Esc), `enter`, `tab`, `space`, `backspace`, `delete` (Del), `insert`, `home`, `end`, `pageup`/`pagedown` (PgUp/PgDn), `arrowup`/`down`/`left`/`right` (↑↓←→); plus key = `plus` or `ctrl++`. `data-label-<key>` (element or ancestor, e.g. `<html data-label-ctrl="Strg">`) localises labels/spoken names. LTR key order in RTL. `data-hotkey-init` = rendered combo (idempotent; changed combo re-renders) |
| `data-spoiler` | any | Content concealment (`blur`, `solid`, `noise`) |
| `data-effect="ticker"` | `<data>` | Animated number count-up (`--vb-ticker-duration`, `--vb-ticker-start`, `--vb-ticker-decimals`) |
| `data-format-number` | `<data>` | Locale-aware number formatting (`""`, `currency` + `data-currency` [defaults to USD], `percent`, `compact`); re-formats when `value` changes; empty/invalid `value` leaves the text |
| `data-format-date` | `<time>` | Locale-aware date formatting (`relative`) |
| `data-format-bytes` | `<data>` | Byte size formatting (value = precision; `data-unit="decimal"` for ÷1000) |
| `data-animate-image` | `<img>` | Play/pause for animated images |
| `data-command` | `<button>` | Command palette trigger |

---

## 9. Global Attributes

Applied to `<html>`. Authored values are page defaults: ThemeManager only replaces them when the visitor saved a different choice (reset restores them).

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-theme` | See themes list | Active theme (also scoped on any element) |
| `data-mode` | `light`, `dark` | Color mode override (also scoped: element gets its own surface + re-derived colour tokens) |
| `data-accent` | See accents | Colour accent (also on any element) |
| `data-fluid` | (boolean), `default`, `compact`, `spacious` | Fluid type/spacing |
| `data-backdrop` | (boolean), `default`, `flush`, `elevated` | Canvas backdrop |
| `data-backdrop-chrome` | `card`, `stretch`, `integrated` + `fixed` | Backdrop header/footer treatment |
| `data-border-style` | `clean`, `sharp`, `soft`, `sketch`, … | Border aesthetic |
| `data-icon-set` | `lucide`, … | Default icon set |
| `data-sticky` | (boolean) | Sticky header system |
| `data-scrollbar` | `hidden`, `auto`, `primary`, `minimal` | Scrollbar styling (also any scroller) |
| `data-motion-reduced` | (boolean) | User-toggled motion reduction: `--duration-*` → 0ms, smooth scroll off, view transitions/effects off |
| `data-ruby` | `show`, `hide`, `auto` (default) | Ruby visibility; default hides `<rt>` on non-CJK pages |
| `data-debug` | (boolean) | Debug mode (needs vanilla-breeze-dev.css/.js) |
| `data-wireframe` | `lo`, `mid`, `hi`, `annotate` | Wireframe mode (needs vanilla-breeze-dev.css) |

---

## 10. Provenance & Authorship Surface

VB ships a stack-agnostic content-provenance contract. Any HTML page that emits the tags below lights up VB's `<page-info>`, `<change-set>`, and lens components. The contract is authoritative in `admin/specs/meta-tag-contract-v1.md` (v1.0, stable). Canonicalization rules for signing live in `admin/specs/canonical-document-v1.md`.

**Principle: public-first.** Where an open-standard name exists (Schema.org, Open Graph, HTML5), VB reads the open name. The `vb:*` namespace is reserved for VB-specific extensions only.

### Public-standard `<meta>` and `<link>` (Section A)

| Field | Purpose |
|---|---|
| `<meta name="author">`, `<link rel="author">`, `<meta property="article:author">` | Author identity |
| `<meta name="last-modified">`, `article:published_time`, `article:modified_time` | Temporal |
| `<meta name="keywords">`, repeated `<meta property="article:tag">` | Classification |
| `<meta name="license">`, `<link rel="license">` | License |
| `<meta itemprop="version">` | Semantic version |
| `<meta property="og:*">` | Social preview |
| `<script type="application/ld+json">` Article/TechArticle | JSON-LD mirror (canonical machine-readable) |

### `vb:*` namespace (Section B)

| Field | Vocabulary |
|---|---|
| `<meta name="vb:provenance">` | Core: `human` (default), `ai-assisted`, `ai-generated`. Extensions (space-composed): `translated`, `synthesized`, `migrated` |
| `<meta name="vb:review">` | `unreviewed` (default), `fact-checked`, `editor-reviewed` |
| `<meta name="vb:status">` | `draft`, `published` (default), `archived` |
| `<meta name="vb:ai-tools">` | Comma-separated tool names (`Claude, GPT-5`) |
| `<meta name="vb:topic">` | Dotted-path taxonomy (`engineering.web.css`) — shared with analytics |
| `<meta name="vb:version-url">` | Link to changelog anchor for this page's version |

### Content-integrity (signing) — Section B + E

| Field | Purpose |
|---|---|
| `<meta name="vb:hash">` | Base64 SHA-256 of canonical document |
| `<meta name="vb:signature">` | Base64 ECDSA signature over canonical document |
| `<meta name="vb:signature-algorithm">` | Algorithm id (e.g. `ECDSA-P256-SHA256`) |
| `<link rel="author-key" data-key-id="…">` | JWK pointer (`/.well-known/content-keys/{author}.jwk`) |

Public-key infrastructure lives at `/.well-known/content-keys/{author-id}.jwk` and `/.well-known/content-authenticity.json`. Build pipeline: `scripts/sign-pages.js`.

### DOM attributes (Section C — applied to content elements)

These are NOT meta tags. They live on `<article>`, `<section>`, `<aside>`, or inline elements like `<ins>`/`<del>`.

| Attribute | Answers | Vocabulary |
|---|---|---|
| `data-author` | Who made this specific edit? | Free-form person identifier |
| `data-provenance` | How was this content made? | Same vocabulary as `vb:provenance`. Space-composes: `data-provenance="ai-generated translated"`. CSS uses `[data-provenance~="ai-generated"]` |
| `data-review` | What review did it receive? | Same vocabulary as `vb:review` |
| `data-status` | What's its publication state? | Same vocabulary as `vb:status` |
| `data-trust` | **Verification tier** (badge-only) | `undeclared`, `declared`, `domain-anchored`, `verified`, `failed`, `key-unavailable` |

**Critical distinction:** `data-provenance` is an author claim about *how content was made*. `data-trust` is a *runtime computation* by `<page-info>` and is reserved for the verification badge. Authorship is never `data-trust`.

**Page-level defaults** can go on `<html data-provenance="…" data-status="…">`. Section-level declarations override.

### Consumers in VB

| Component | Reads |
|---|---|
| `<page-info>` | All of Sections A, B, and the canonical-document hash/signature for live verification |
| `<change-set>` | `data-author`, `data-provenance` on `<ins>`/`<del>` blocks |
| `<site-index>` | `<meta name="keywords">`, `article:tag`, `vb:topic` |
| `<time-index>` | `<meta name="last-modified">`, `itemprop="version"`, `vb:version-url` |
| Trust / topic lens pages | `vb:provenance`, `vb:review`, `vb:status`, `vb:topic` aggregated across the site |
| Analytics subsystem | All `vb:*` tags via `document.querySelectorAll('meta[name^="vb:"]')` |

---

## 11. Quick Reference — All `data-*` Attributes

Alphabetical index of every `data-*` attribute with where it applies.

| Attribute | Applies to |
|-----------|------------|
| `data-a11y-theme` | `<html>` — accessibility theme |
| `data-accent` | `<html>` or any element — colour accent |
| `data-align` | Table cells — text alignment |
| ~~`data-allow-custom`~~ | **Removed** — use `custom` on `<combo-box>` |
| `data-anchor` | Tooltip — CSS anchor positioning |
| `data-animate-image` | `<img>` — play/pause control |
| `data-announce` | `<ins>`, `<del>` or any ancestor — opt-in screen-reader start/end announcement |
| `data-attention` | UI elements — attention indicator |
| `data-auto` | Various — auto behavior |
| `data-author` | `<ins>`, `<del>`, content blocks — edit authorship (see §10) |
| ~~`data-autoplay`~~ | **Removed** — use `autoplay` on `<carousel-wc>` |
| ~~`data-autoplay-delay`~~ | **Removed** — use `autoplay-delay` on `<carousel-wc>` |
| `data-autosave` | `<form>` — localStorage save (boolean form derives key from method+action) |
| `data-autosave-retain` | `<form data-autosave>` — field-name allowlist for persistence |
| `data-axes` | `.vb-chart` — axis display |
| `data-backdrop` | `<html>` — canvas backdrop |
| `data-backdrop-chrome` | `<html>` — backdrop chrome mode |
| `data-blur-reveal` | Text — blur-to-clear entrance |
| `data-bordered` | Various — border variant |
| `data-center-label` | Pie chart — donut center text |
| `data-collapsed` | Breadcrumb — hide middle items |
| ~~`data-collapsible`~~ | **Removed** — use `collapsible` on `<split-surface>` |
| `data-color` | `<input type="color">` — enhanced picker |
| `data-command` | `<button>` — command palette trigger |
| `data-compact` | Various — reduced spacing |
| `data-completed` | Steps — completed state |
| `data-container` | Any — establish container query |
| `data-copy` | `<button>` — clipboard copy |
| `data-copy-target` | `<button>` — copy source selector |
| `data-count` | `<textarea>` — character counter |
| `data-emoji` | Any container — replace `:shortcode:` with emoji |
| `data-emoji-scan` | `[data-emoji]` — scan mode (`once`, `observe`) |
| `data-emoji-unknown` | `[data-emoji]` — unknown handling (`keep`, `strip`) |
| `data-debug` | `<html>` — debug mode |
| `data-debug-invalid` | Any — mark invalid structure |
| `data-debug-message` | Any — debug hover message |
| `data-density` | Table — row padding; `nav.tree` — compact spacing |
| `data-direction` | Steps — vertical layout |
| `data-disabled` | Table row — disabled state |
| `data-dismiss` | `<status-message>` child — dismiss button |
| `data-action` | Table button — `toggle-expand` action |
| `data-animate` | `<icon-wc>` — `spin` animation |
| `data-bulk-actions` | `<data-table>` — bulk action bar for selected rows |
| `data-content` | `<status-message>` child — content wrapper |
| `data-description` | `<status-message>` child — description text |
| `data-donut` | Pie chart — hollow center |
| `data-dots` | Line chart — dot size |
| `data-dragover` | Upload zone — drag active |
| `data-ellipsis` | Pagination — ellipsis indicator |
| `data-empty` | `<output>` — empty state content |
| `data-error` | `<output>` — error state content |
| `data-error-correction` | `<qr-code>` — QR error level |
| `data-expand-content` | Table row — expandable content |
| `data-face` | `<content-swap>` child — front/back |
| `data-fallback` | `<user-avatar>` child — initials/icon fallback |
| `data-feedback` | State container — presentation mode |
| `data-filled` | `<status-message>` — solid fill |
| ~~`data-filter`~~ | **Removed** — use `filter` on `<combo-box>` |
| `data-fit` | `[data-media]` — object-fit |
| `data-swap` | `<content-swap>` trigger or any element — swap behavior |
| `data-floating-label-ready` | `<form-field>` — floating label wired (internal) |
| `data-flush` | Accordion — no borders |
| `data-format-bytes` | `<data>` — byte formatting |
| `data-format-date` | `<time>` — date formatting |
| `data-format-number` | `<data>` — number formatting |
| `data-gap` | Chart — element gap |
| `data-glitch` | Text — glitch effect |
| `data-gradient-text` | Text — gradient coloring |
| `data-gradient-text-animate` | Text — animated gradient |
| `data-grid` | Chart — show grid lines |
| `data-group` | `<context-menu>` — group label |
| `data-grouped` | Column chart — side-by-side |
| `data-grow` | `<textarea>` — auto-expand |
| `data-half` | Pie chart — semi-circle |
| `data-hide-when` | Any — conditional hide |
| `data-highlight` | Text — draw-in highlight |
| `data-hotkey` | `<kbd>` — platform key display |
| `data-icon` | `<status-message>` child — icon slot |
| `data-indeterminate` | `<progress-ring>` — spinning |
| ~~`data-indicators`~~ | **Removed** — use `indicators` on `<carousel-wc>` |
| `data-info` | Pagination — info text |
| `data-interactive` | Chart legend — clickable toggle |
| `data-items` | `<card-list>` — inline JSON data |
| `data-key` | `<card-list>` — unique key field |
| `data-label` | Table td — mobile card label |
| `data-labels` | Chart — show value labels |
| `data-layout` | Any — layout mode (see §5) |
| `data-layout-*` | Layout elements — modifiers (see §5) |
| ~~`data-lazy`~~ | **Removed** — use `lazy` on `<include-file>` |
| `data-legend` | Chart — `inline` legend display |
| `data-legend-position` | Chart — legend position |
| `data-level` | `<page-toc>` heading indent; `<form-field>` password strength |
| `data-loading` | Any — loading state |
| ~~`data-loop`~~ | **Removed** — use `loop` on `<carousel-wc>` |
| `data-mask` | `<input>` — input masking |
| `data-max` | `<toast-msg>` — maximum count (combo-box uses `max`) |
| `data-media` | Container — aspect-ratio lock |
| `data-met` | Password rules — requirement met |
| `data-mode` | `<html>` — light/dark mode |
| `data-motion-reduced` | `<html>` — reduce motion |
| `data-name` | Token elements — token name |
| `data-nav-open` | `<body>` — mobile nav state |
| `data-next` | Pagination button — next page |
| `data-no-flip` | `<tool-tip>` — disable auto-flip |
| `data-no-icon` | `<a>`, `<form-field>` — suppress icons |
| `data-numeric` | Table th/td — right-align |
| `data-open` | Various WC — open state |
| ~~`data-direction`~~ | **Removed** — use `direction` on `<split-surface>` |
| `data-otp-ready` | `<form-field>` — OTP/PIN boxes built (internal) |
| `data-overlay` | `<loading-spinner>` — absolute overlay mode (needs a positioned ancestor) |
| `data-padding` | Cards — padding preset |
| `data-page-layout` | `<body>` — page layout (see §5) |
| `data-pattern` | `[data-mask]` — mask format |
| ~~`data-persist`~~ | **Removed** — use `persist` on `<split-surface>` |
| `data-position` | Various — positioning |
| `data-prev` | Pagination button — previous page |
| `data-provenance` | Content blocks, `<html>` — authorship claim (see §10) |
| `data-radius` | `[data-media]` — border radius |
| `data-range` | `<input type="range">` — enhanced range |
| `data-rating` | `<fieldset>` — star rating |
| `data-rating-half` | Rating — half-star precision |
| `data-rating-readonly` | Rating — read-only |
| `data-ratio` | `[data-media]`, `iframe`, `embed`, `object` — aspect ratio |
| ~~`data-readonly`~~ | **Removed** — use `readonly` on `<star-rating>` |
| `data-reason` | `<ins>`, `<del>` — visible change-reason tag |
| ~~`data-required`~~ | **Removed** — use `required` on `<combo-box>` |
| `data-responsive` | Table — mobile layout |
| `data-reveal` | Text — reveal entrance |
| `data-review` | Content blocks, `<html>` — review state (see §10) |
| `data-ring` | `<user-avatar>` — border ring |
| `data-scramble` | Text — decode effect |
| `data-scrollbar` | `<html>` or any scroller — scrollbar style |
| `data-select-all` | Checkbox — select-all toggle |
| `data-selected` | Table row — row highlight |
| `data-selected-count` | `<data-table>` — selection count display |
| `data-separator` | Breadcrumb — separator char |
| `data-series` | Chart elements — series color |
| `data-shape` | Badge, avatar — shape variant |
| `data-shimmer` | Text — shimmer effect |
| `data-shortcut` | Elements — keyboard shortcut |
| `data-show-when` | Any — conditional show |
| `data-sidebar` | Body — sidebar state |
| ~~`data-single`~~ | **Removed** — use `single` on `<accordion-wc>` |
| `data-size` | Various — size variant |
| `data-sort` | Table th — sortable column |
| `data-sort-button` | `<th data-sort>` — generated sort button inside the header |
| `data-sort-value` | Table td — custom sort value |
| `data-spoiler` | Any — content concealment |
| `data-stack` | `<brand-mark>` — vertical layout |
| `data-stacked` | Chart — stacked series |
| `data-state` | Feedback container — active state |
| `data-state-expanded` | Table row — expanded |
| `data-state-hidden` | Table row — hidden |
| `data-state-selected` | Table row — selection state |
| `data-state-sorted` | Table th — sort direction |
| `data-status` | Avatar child — online status; content blocks, `<html>` — publication state (see §10) |
| `data-stepper` | Number input — +/- buttons. See [numeric-inputs decision guide](/docs/concepts/numeric-inputs/) for when to reach for [`<stepper-wc>`](/docs/elements/web-components/stepper-wc/) instead. Native spinners are hidden only once upgraded (`[data-stepper-init]`). A plain `type="number"` keeps the browser spinners. |
| `data-sticky` | Table — sticky header/column; `<header>`, `<footer>` — sticky; `<html>` — sticky header system |
| `data-sticky-column` | Table — sticky N columns |
| `data-switch` | Checkbox — toggle switch |
| `data-table-empty` | `<data-table>` — no-results message element (generated) |
| `data-table-filter` | `<data-table>` — filter input container |
| `data-table-status` | `<data-table>` — visually hidden live region (generated) |
| `data-theme` | `<html>` — active theme |
| ~~`data-ticker`~~ | **Removed** — use `data-effect="ticker"` on `<data>` |
| `data-title` | Various — title text |
| `data-toggle-tags` | `<fieldset>` — pill chip toggle |
| `data-tooltip` | Chart td — tooltip text |
| `data-trust` | `.page-info-badge` only — verification tier (runtime-computed; see §10) |
| `data-tooltip-delay` | `<tool-tip>` — show delay |
| `data-tooltip-position` | Tooltip — position |
| `data-trigger` | Any with `data-effect` — activation trigger. Built-ins: `scroll`, `hover`, `click`, `time:<ms>`, `intersect[:once\|toggle]`, `media:<query>`, `event:<name>`, `vt`. Also `<tool-tip>` — trigger mode. |
| `data-stagger` | Parent — child cascade. Empty or CSS time (e.g. `80ms`) → linear; `reverse`, `random`, `grid` → alternate ordering. |
| `data-transition` | Any — View Transition handler. Built-ins: `morph`, `slide`, `fade`, `scale`, `stagger`, `none`, `effect:<class>` (bridges to `data-effect` via `vb:vt-update-done` / `data-trigger="vt"`). |
| `data-effect-active` | Auto-managed — set by `VB.activate(el)` and trigger handlers. Effects gate on it. |
| `data-truncated` | Breadcrumb li — truncate text |
| `data-type` | Chart, `<form-field>` — type variant |
| `data-typewriter` | Text — typing animation |
| `data-unit` | `<data data-format-bytes>` — `decimal` for 1000-based sizes |
| `data-upload` | File input — drop zone |
| `data-value` | Various — value binding |
| `data-variant` | Various — style variant |
| `data-vt` | Any — view transition group |
| `data-vt-class` | Any — transition animation |
| `data-vt-name` | Any — custom transition name |
| `data-wf-label` | Wireframe — custom element label |
| `data-wireframe` | `<html>` — wireframe mode |
| `data-wizard` | `<form>` — wizard form |
| `data-wizard-*` | Wizard children — step management |
