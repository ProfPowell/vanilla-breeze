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
- `data-vb-math-font`: `<link rel="stylesheet" href="{cdn}/fonts/math-fonts.css">`, injected by math-init. It points at the self-hosted `{cdn}/fonts/latinmodern-math.woff2`, the same face the core CSS declares for plain `<math>`.
- `data-math="copyable"` renders `<button type="button" data-math-copy>` inside `[data-math-rendered]`. `data-label-copy` sets the button text (default "Copy LaTeX"); `data-label-copied` sets the announcement in the persistent `role="status"` span (default "Copied to clipboard").
- `data-mathml`: precompiled MathML string, passed through `sanitizeMathML()` (MathML-namespace elements only; no `on*`/`href`/`src`/`style`/`id`/`name`/`xlink:`/`xml:` attributes; no `mglyph`/`malignmark`) and inserted as nodes. Do not rely on it to carry anything but MathML.
- Runtime `rel` reads are token-list and case-insensitive (`[rel~="x" i]`): `canonical` (share-wc resolves via `.href`; page-info and scripts/sign-pages.js both read the RAW href via `canonicalLinkHref()` so signer and verifier sign the same `url`), `author`, `license`, `author-key` (page-info, canonicalize).
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

Base: `text-wrap: pretty`; `p + p` gets `margin-block-start: var(--size-m)`.

| Class / Attribute | Description |
|-------------------|-------------|
| `.lead` | `--font-size-xl`, `--line-height-relaxed`, muted text (CJK `:lang(zh\|ja\|ko)`: line-height 1.8) |
| `.balance` | `text-wrap: balance` (short centred text; browsers cap at ~6 lines) |
| `.indent` | First-line indent 1.5em (CJK: 1em); `.indent + .indent` drops the paragraph gap |
| `.justify` | `text-align: justify` + `hyphens: auto` (hyphenates only with a `lang` the browser has a dictionary for); `a11y-dyslexia` resets it |
| `data-drop-cap` | Decorative initial letter (`initial-letter: 3`, floated fallback); also on `<article>` (styles in article/styles.css) |

Emphasis in the same file: `strong`/`b` are weight 600 and `em`/`i` italic, both with `font-synthesis: weight style` (a real bold/italic face wins; synthesis only fills in for single-face theme fonts such as DM Serif Display, VT323, Press Start 2P; small-caps/position synthesis stay off). Bold inside inline `<code>` uses `Mark`/`MarkText` in forced colors. Nested italic toggles upright inside italic contexts (`em`, `i`, `blockquote`, `cite`, `dfn`, `var`); `<mark>` gets background + padding + radius. `<small>` is `max(0.875em, var(--font-size-xs))` — relative to its context (smaller inside headings and already-small text), floored at the xs token.

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
| `--meter-track-bg` | `var(--progress-track-bg)` | Meter track fill |
| `--meter-track-border` | `var(--control-border)` | Meter track 1px edge (≥3:1) |
| `--meter-fill-optimum` | `var(--color-success)` | Meter fill in the optimum range |
| `--meter-fill-suboptimum` | `var(--color-warning)` (darkened to L 0.6 in light mode) | Meter fill in the suboptimum range |
| `--meter-fill-even-less-good` | `var(--color-error)` | Meter fill in the worst range |


> Customizable select (`@supports (appearance: base-select)`, input/select.css) applies to single-row selects only: `select:not([multiple], [size]:not([size="0"], [size="1"]))`. Listbox selects keep `appearance: none`. Group headings are styled on the `optgroup` itself, so a `label` attribute and a `<legend>` look the same: 0.75em, uppercase, muted; options are reset to 1em. Options use `--color-text`. Disabled options are dimmed and get no hover fill. In forced colors: `::picker-icon` is `FieldText`, disabled options/groups are `GrayText`, and the hovered option is `Highlight`. A rich trigger (`<select><button><selectedcontent></selectedcontent></button>…`) is reset to a content slot: no padding, border, background, shadow, radius or min size (locked with `!important`, so theme button skins and the global 44px button minimum never reach it). `required` needs a placeholder first option with `value=""` (not inside an optgroup); invalid styling shows via `:user-invalid`. Without base-select, the parser drops the `<button>`/`<selectedcontent>` and each option shows its plain text.

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

Themes or contexts that draw their own glyph (`nav.tree` +/−, NES ▶, win9x +/-) remove the core `::after` and use empty alt text (`content: "+" / ""`) so the glyph is not part of the summary's name. `nav.tree` summaries drop the 44px minimum (`min-block-size: auto`, ~37px). A heading inside `<summary>` loses its heading role; put the heading outside the `<details>`.

### `<dialog>` Dialog

| Data Attribute | Values | Description |
|----------------|--------|-------------|
| `data-size` | `s`, `m`, `l`, `full` | Modal size (24/32/48rem or viewport) |
| `data-position` | `start`, `end`, `top`, `bottom` | Drawer positioning |

Open dialogs are a flex column: `<header>` / `<footer>` fixed, body (`p`, `section`, `article`, `form`) scrolls. `<form method="dialog">` may wrap header/body/footer (form gets no padding; its header/footer styled like direct children). Name dialogs with `aria-labelledby` → heading id. Modal open locks page scroll (`html:has(dialog:modal)`). Enter/exit transitions; drawers slide from their logical edge (RTL-aware). Native `closedby="any"` for light dismiss.

### `<table>` Table

| Data Attribute | Values | Description |
|----------------|--------|-------------|
| `data-numeric` | (boolean, on th/td) | Align to inline end (right in LTR, left in RTL) + tabular numerals |
| `data-align` | `start`, `center`, `end` (on th/td) | Cell alignment (logical; not on `<col>`) |
| `data-sticky` | `header`, `column`, `both` | Sticky header (at `var(--sticky-offset, 0px)`; `0` inside `[data-table-scroll]`) / first column / both. Frozen cells repeat the row tint; frozen edge flips in RTL |
| `data-sticky-column` | `2` | Freeze the first two columns; second offset by `--_sticky-col-1-width` (8rem) |
| `data-density` | `compact`, `comfortable` | Cell padding density |
| `data-variant` | `minimal` | Low-ink: no header band, no hover, muted uppercase column headers |
| `data-responsive` | `card` | Cards below a 500px container; thead visually hidden (kept in a11y tree); `card-init.js` restores table/rowgroup/row/columnheader/rowheader/cell roles and fills missing `data-label` from the column header |
| `data-sort` | (on th) | Sortable column. `<data-table>`: sort TYPE `string`\|`number`\|`date`. `table[data-sortable]`: column KEY (type in `data-sort-type`). Both inject `<button data-sort-button>`; th keeps columnheader + `aria-sort`. Bare `th[data-sort]` has no behaviour/affordance |
| `data-sort-value` | (on td) | Sort value override (`<data-table>` and `[data-sortable]`; `data-value` alias in `[data-sortable]`) |
| `data-selected` | (on tr) | Selected: interactive tint + inline-start bar; `Highlight` in forced colors. `<data-table>` writes `data-state-selected` (styled the same). No semantics: pair with text/checkbox |
| `data-highlight` | (on tr) | Warning tint + inline-start bar; `Mark` in forced colors |
| `data-disabled` | (on tr) | Muted text colour (no opacity). Visual only: add `inert` (also styled) to disable |
| `data-state-hidden` | (on tr) | Hidden row (written by `<data-table>` filter/paging); skipped by stripes |
| `data-expandable` | (on tr) | `<data-table>` trigger row (with `[data-action="toggle-expand"]` button) |
| `data-state-expanded` | (on the trigger tr) | Written by `<data-table>` while open |
| `data-expand-content` | (on the detail tr, starts `hidden`) | Detail row; any child of its cell is padded |
| `data-label` | text (on td/th) | Card-mode label; derived from the column header when absent |

Scroll region (wrapper, not the table): `<section data-table-scroll tabindex="0" aria-labelledby="<caption id>">` — focusable, named region that owns `overflow-x: auto`; `data-table-scroll="block"` also caps height (`--table-scroll-max-block`, 70dvh) so a sticky header pins inside it. Prints expanded. (`table[data-responsive="scroll"]` removed.)

Row paint hooks: rows paint `background: var(--_row-bg)`; first cell `box-shadow: var(--_row-bar), var(--_edge)`. Override `--_row-bg` rather than `background` so frozen cells follow.

Header look: only `thead th` / `th[scope=col|colgroup]` get the raised band; `tbody th[scope=row]` reads as a cell. `tfoot :is(td, th)` share the footer style.

Legacy classes: `.striped` (odd *visible* rows; skips `[data-state-hidden]`, `[hidden]`, `[data-expand-content]`), `.compact`, `.bordered`

### `<nav>` Navigation

| Class | Description |
|-------|-------------|
| `.horizontal` | Horizontal flex |
| `.vertical` | Vertical flex |
| `.pills` | Rounded pill buttons |
| `.tabs` | Tab-style with border indicator |
| `.breadcrumb` | Breadcrumb trail |
| `.minimal` | Text-only links |
| `.pagination` | Page navigation controls (wraps on narrow screens) |
| `.tree` | Hierarchical tree |
| `.steps` | Multi-step progress (`data-labels="below"`, `data-direction="vertical"`, `data-size`) |
| `.bottom` | Sticky bottom tab bar (mobile) |
| `.bottom.frosted` | Translucent, blurred bottom tab bar |

Helper classes (not on nav): `.pagination-bar` (grid wrapper), `.pagination-info` (result count), `.page-size-selector` (label + select).

Current page: `aria-current="page"` (or `.active`) is underlined as a non-colour cue in default/`.horizontal`/`.vertical`/`.minimal`/`.bottom` navs; `--nav-active-decoration: none` opts out.

#### Breadcrumb data attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-separator` | `chevron`, `arrow`, `dot`, `pipe` | Separator character (default "›" from `--sep-breadcrumb`; default/chevron/arrow flip in `dir="rtl"`, via `--sep-breadcrumb-rtl`) |
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

Track: `--progress-track-bg` with a 1px `--progress-track-border` (`--control-border`, 3:1) edge. Fill: `--progress-fill`. Name every bar with `<label for>` or `aria-label` (`<form-field>` does not wire `for`).

| Class / Attribute | Description |
|-------------------|-------------|
| `.xs`, `.s`, `.m`, `.l` | Size variants (`.xs` is a decorative hairline with no track border) |
| `.success`, `.warning`, `.error` | Colour variants — set `--progress-fill` (`.warning` uses `--progress-fill-warning`, darkened in light mode); apply to bars, rings and themes |
| `.labeled` (wrapper) | `.labeled:has(> progress)`: a `<header>` or `<label>` row plus the `<progress>` |
| `data-type="ring"` | Circular mode, enhanced by `utils/progress-ring-init.js` (adds `[data-enhanced]`, `--progress` 0–100, an `aria-hidden` centre label). Without JS: a linear bar. Keeps the 1px `--progress-track-border` as its outer circle; remaining arc in `--progress-ring-track` (default `--progress-track-bg`) |
| `data-size` (ring) | `xs`, `s`, `m` (default), `l`, `xl` |
| `data-label` (ring) | Centre label text override; `none` hides it. The label is created lazily (an indeterminate ring gets one when it receives a `value`) and hidden while indeterminate |

Ring tokens: `--progress-ring-size` (4em), `--progress-ring-width` (0.35em), `--progress-ring-track`. The utility watches `value` and `max`. Indeterminate bars shimmer (Blink/WebKit track, Firefox bar) and rings spin; both slow down under `prefers-reduced-motion` and `:root[data-motion-reduced]`. Forced colors: `Highlight` fill on `Canvas` with a `CanvasText` edge (rings: `Highlight` on `GrayText`). Themes 8bit/nes/win9x paint their fills from `--progress-fill` and skip enhanced rings.

Labelled pattern: `<section class="labeled"><header><label for="p">…</label><output id="p-value" for="p">45%</output></header><progress id="p" aria-describedby="p-value" value="45" max="100">45%</progress></section>`.

### `<meter>` Meter

| Class | Description |
|-------|-------------|
| `.xs`, `.s`, `.m`, `.l` | Size variants (`.xs` is a decorative hairline with no track border) |
| `.segmented` | Visual segments |
| `.labeled` (wrapper) | `.labeled:has(> meter)`: a `<header>` or `<label>` row plus the `<meter>` |

Labelled pattern: `<section class="labeled"><header><label for="q">…</label><output id="q-value" for="q">…</output></header><meter id="q" aria-describedby="q-value">…</meter></section>`.

### `<output>` Output

Base (result outputs only): inline-block mono chip, tabular numerals, raised background; `:empty` collapses. Implicit `role="status"` (polite, atomic) — no `aria-live` needed; `aria-live="off"` for per-keystroke/slider values. Name it with `<label for>`. `for` is metadata only (not exposed to AT); `name` is not submitted.

| Class | Description |
|-------|-------------|
| `.block` | Block display with padding |
| `.inline` | Minimal inline (no padding/background) |
| `.highlight` | Interactive-tinted background and text |
| `.large` | Large font size |
| `.success`, `.warning`, `.error` | Status colors (`--color-*-subtle` + `--color-*-text`) |

Excluded from all of the above (message outputs): `output.hint`, `form-field output.error`, `output.error-summary`, `fieldset[data-min-checked|data-max-checked] > output`, `output[data-empty|data-loading|data-error]`. Inside `form-field`, `.error` is the validation message, not the chip state. Forced colors: chips get a `CanvasText` border.

### `<blockquote>` Blockquote

Base: left border accent, muted italic text, `<footer>` for attribution.

### `<code>`, `<pre>`, `<kbd>`, `<samp>`, `<var>` Code

Base: monospace font, `<code>` gets background highlight, `<kbd>` gets border + shadow key style. A `<kbd>` with a `<kbd>` child (`kbd:has(> kbd)`, nested sequence/combination and the `data-hotkey` wrapper) is unboxed and inherits the font size; only inner caps are drawn. Inside `button`/`.button`/`[role="button"]` a cap takes the button's text colour with a derived edge and translucent fill. Inline `<samp>` has no chip but wraps long output (`overflow-wrap: break-word`, like inline `<code>`). Inline `<code>`/`<samp>` (not inside `<pre>`) are `unicode-bidi: plaintext`: isolated from the surrounding text and directed by their own first strong character, so LTR output keeps its punctuation in place on RTL pages.

`<pre>`: `white-space: pre`, horizontal scroll, `tab-size: var(--tab-size, 4)`. `pre:has(code, samp)` is the code/output block (raised surface, padding, radius) and is `direction: ltr` unless the `pre` has its own `dir`; bare `<pre>` (ASCII art, poetry) follows the page direction. Forced colors: code blocks get a `CanvasText` border; `<b>`/`<strong>` inside `<pre>` use `Mark`/`MarkText`. A scrollable block made focusable with `tabindex="0"` must also get `role="region"` + `aria-label`. Print (`utils/print.css`): `pre-wrap`, `break-inside: avoid`, 1px border.

### `<ul>`, `<ol>` Lists

| Class | Description |
|-------|-------------|
| `.inline` | Horizontal flex, no bullets |
| `.unstyled` | No bullets, no padding |

- `ul[data-marker="check|arrow|dash|star"]`: styles direct `> li::marker` only, so nested lists keep their own markers. Glyphs come from `--marker-check`, `--marker-arrow`, `--marker-dash` and `--marker-star`, and are decorative (empty alt text, `content: "…" / ""`). `arrow` is U+25B8 and swaps to `--marker-arrow-rtl` (U+25C2, the same pair) under `:dir(rtl)`.
- `ul.meta` / `ol.meta` with `data-separator="pipe|dash|slash"`: separators on direct `> li + li::before` only, from `--sep-list`, `--sep-pipe`, `--sep-ndash` and `--sep-slash`, and are silent (empty alt text). Not for breadcrumbs: use `nav.breadcrumb`.
- `ol` indent: `padding-inline-start: var(--ol-indent, var(--size-l))`. It widens to `var(--ol-indent, 2.5em)` for lists with long markers: `[type="i"]` (either case), `[start]`, `[reversed]`, `:has(> li[value])`, 100+ items, and `type="a|A"` with 27+ items. Set `--ol-indent` for CJK/Arabic-Indic counter styles or a large `start`. `.inline`/`.unstyled`/`.meta` still reset it to 0.
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
| `.widescreen` | video | 16:9, letterboxed (`object-fit: contain`) |
| `.standard` | video | 4:3, letterboxed |
| `.ultrawide` | video | 21:9, letterboxed (rule restored) |
| `.square` | video | 1:1, letterboxed |
| `.cover` | video | Opt-in crop-to-fill (`object-fit: cover`) for decorative/background video |
| `.rounded` | video | Border-radius |
| `.minimal` | audio | 2.5rem height |
| `.compact` | audio | 300px max-width |

| Attribute | Element | Description |
|-----------|---------|-------------|
| `data-chapter-list` | `track[kind=chapters]` | Renders `nav.chapter-list` (seek buttons) after the video; active chapter's button gets `aria-current="true"` (+ `li[data-active]`); `data-label` names the nav (default "Video chapters") |

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
- `<object data type width height>…fallback…</object>` — same sizing; fallback content between the tags. Preferred for PDFs (download-link fallback). No sandbox: use `<iframe sandbox>` / `<img>` for untrusted HTML/SVG; CSP `object-src 'none'` disables both. Name non-image objects with `title`/`aria-label`; with `role="img"` keep the fallback text-only (presentational children) and put links outside. `name` = navigable target name; `form` lists it in `form.elements`, submits nothing.

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
| `.currentcolor` | `fill: currentColor`, skipped when the `<svg>` has `fill="none"` (stroke icons stay outlines) |
| `.interactive` | Sets `color` to the interactive colour; fills with it unless `fill="none"`; `stroke="currentColor"` follows |
| `.muted` | Sets `color` to the muted text colour; fills with it unless `fill="none"`; `stroke="currentColor"` follows |
| `.full` | Fills the container's inline size; height from the viewBox |
| `.spin` | Rotation animation; stops under reduced motion (`prefers-reduced-motion` or `:root[data-motion-reduced]`) |
| `.pulse` | Opacity pulse animation; stops under reduced motion |

Unclassed `<svg>` gets `max-inline-size: 100%; block-size: auto` (stays inline-block). `.responsive` was removed (duplicate of `.full`).

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
| `[data-sticky]` | Sticks to top; a body-level sticky header adds `scroll-padding-block-start` to `<html>` (`--sticky-offset`, else `--header-sticky-size`, default header.site height). Sticky on its own (z-index 100, no mobile opt-out); `<html data-sticky>` raises it to `--z-sticky-header` and un-sticks it below 48rem |
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
| `.contained` | Max 1200px (fixed), centered |
| `.narrow` | Max `--measure-normal` (65ch default; follows fluid profiles), centered |
| `.wide` | Max 1600px (fixed), centered |
| `.full` | 100% of the container width (not the viewport) |
| `.with-sidebar` | Grid `minmax(0, 1fr)` + 200–300px sidebar; one column below 48rem. For page shells prefer `data-page-layout` / `<layout-sidebar>` |
| `.padded` | Block padding (`--size-xl`) |
| `.flex` | `flex: 1` flex column; fills a flex-column parent |

`<main>` is a size query container (`container-type: inline-size`); under `[data-page-layout]` it takes grid-area `body-main` and container-name `region-main`. Give it `id="main"` as the skip-link target.

#### `<section>`

| Class | Description |
|-------|-------------|
| `.padded` | Vertical padding |
| `.full` | Generous block + inline padding (no breakout) |
| `.contained` | Max 1200px centered |
| `.alt` | Alternate background (block borders in forced-colors mode) |
| `.bordered` | Top border |
| `.hero` | Min 50vh, centered content |
| `.grid` | Auto-fit grid columns |

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-padding` | (bare), `small`, `xsmall`, `none` | Fluid block padding |
| `data-padding-start`, `data-padding-end` | `none` | Drop block-start / block-end padding |
| `data-bleed` | boolean, on `section.hero` | Background extends behind `body > header` (transparent until `<html data-scrolled>`) |
| `data-angle` | `down`, `up`, `down-strong`, `up-strong` | Skewed background edge, padding compensation by container width; mirrors in RTL |
| `hr[data-position]` (child) | `top`, `bottom` | Edge-to-edge hairline pinned to that edge |

`<section>` is a size query container (`container-type: inline-size`); as a content-sized flex/grid item it collapses to zero width — opt out with `container-type: normal` (or `data-container` inside cluster/reel/centred cover/aligned stack/subgrid grid to keep it). A section is a `region` landmark only when named (`aria-labelledby`).

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

Variants style controls that are direct children of `<search>` or of its direct `<form>`: `:is(search, search > form) > input|button`. Use `<search class="inline"><form action method="get">…</form></search>` when there is a submit button.

| Class | Description |
|-------|-------------|
| `.inline` | Flex inline |
| `.expanded` | Full-width |
| `.compact` | Smaller padding/font |
| `.with-icon` | Icon (`svg`, `.icon`, `<icon-wc>` before the input) positioned at the inline start; input gets start padding |
| `.rounded` | Full radius on input |
| `.header` | Compact header search |

#### `<menu>`

| Class | Description |
|-------|-------------|
| `.toolbar` | Raised toolbar row; keeps button variants and `aria-pressed` state (use `.ghost` for flat items) |
| `.vertical` | Flex column |
| `.context` | Pop-up menu style; sizes to content |
| `.icons` | Icon button grid |
| `.pills` | Rounded items |
| `.compact` | Reduced spacing |

Separator: `<li role="separator">` (a vertical rule in row menus, a horizontal rule in `.context`/`.vertical`).

`<menu>` is exposed as a list (role=list), not as commands. For a toolbar add `role="toolbar"` + `aria-label` and `role="none"` on the `<li>`s; no arrow-key roving is provided.

### Inline Semantics (`<abbr>`, `<cite>`, `<del>`, `<ins>`, `<time>`, etc.)

| Class | Element | Description |
|-------|---------|-------------|
| `mark.success/warning/error` | mark | Highlight categories (subtle background, `-text` colour), not status; use `<layout-badge>` for status. Journal pack maps them to mint, butter and coral |
| `figure.equation` / `p.equation` | math | Numbered display math (CSS counter); replaces `div.equation` |
| `figure.math` | math | Captioned equation |
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
| `video::cue` | video | Caption defaults: `--cue-text`, `--cue-bg`, `--cue-font` (OS caption settings and forced colors override) |
| `sub[data-variant~="opentype"]`, `sup[data-variant~="opentype"]` | sub/sup | Opt-in: use the font's OpenType subs/sups glyphs (`font-variant-position`) and drop the manual size/offset. Only for fonts known to have the glyphs |
| `sup.footnote-ref` | sup | Footnote marker: medium weight at the normal sup size (sized once); link keeps its underline with a padded hit area |
| `.status[data-status]` (`success`, `warning`, `error`, `inactive`, `check`, `fail`) | span | Inline status glyph via `::before` with empty alt text (`content: "\25CF" / ""`); the label carries the meaning |

> `dfn` inherits the weight of bold contexts (`dt`, `th`, headings, `strong`, `b`, `legend`). In `:lang(zh|ja|ko)`, `dfn` and `cite` are upright (no synthetic italic): `dfn` uses semibold, `cite` a muted wavy underline (except `cite[data-variant="quoted"]`).

- `<u>` in `:lang(zh|ja|ko)` (not `*-Latn`): a solid `currentColor` underline under the line (proper-name mark). Otherwise a wavy `--color-error` underline.
- `<var>`: italic in the text colour; `--var-color` hook. In `:lang(zh|ja|ko)` (not `*-Latn`) it is upright with a dashed underline.

> `<i>` / `<em>` toggle to upright inside italic contexts: `blockquote`, `cite` (not `cite[data-variant~="quoted"]`), `dfn`, `var`, `em`, `i`. Upright islands (`blockquote > footer`, `blockquote > cite`, quoted cite) restore italic. In CJK (`:lang(zh|ja|ko)`, excluding `-Latn`): `<i>` is upright with the `--font-cjk-alternate` face + dotted underline; `<em>` uses emphasis marks; `<dfn>` semibold; `<cite>` wavy underline. Token `--font-cjk-alternate` (optional; default kai/mincho stack) sets the face for CJK `<i>`.

> `<sub>`/`<sup>` are always `0.75em` with `line-height: 0` and a relative offset (sub `-0.25em`, sup `0.5em`). There is no `@supports (font-variant-position)` reset: browsers do not synthesise subs/sups glyphs, so the reset rendered them full-size on the baseline in most fonts. In forced colors `<s>` uses a dashed line-through so it stays distinct from `<del>`.

### Native Tooltip (`[role="tooltip"][popover]`)

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-anchor` | (boolean) | CSS anchor positioned |
| `data-tooltip-position` | `top`, `bottom`, `left`, `right` | Position (default: top) |
| `popover="hint"` | (attribute) | Hover-triggered variant |

### Star Rating (`[data-rating]`)

| Attribute | Description |
|-----------|-------------|
| `data-rating` | Star rating fieldset container (radios in labels; `:has()` fill + hover preview) |
| `data-rating-half` | Enable half-star precision (`label[data-half="left\|right"]`) |
| `data-rating-readonly` | Read-only display |
| `data-effect="rating"` | Opt into the rating effect (`src/effects/rating.js`): clear by activating the checked star again (click/Space) or Delete/Backspace, `rating:change` `{ value }` on every change incl. clear to 0, one persistent `[data-rating-live]` polite region announcing the clear (`data-label-cleared`, default "Rating cleared"); re-wires after remove + reinsert |

Empty stars are outlines (`-webkit-text-fill-color: transparent` + text stroke), filled stars solid — shape, not just colour (hover preview too). `--rating-color` (filled, default `--color-warning`), `--rating-color-empty` (default `--color-text-muted`). Forced colours: filled `Highlight`, empty `CanvasText`, `forced-color-adjust: none`.

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

Every layout below except `<layout-imposter>`, `<layout-card>` and `<layout-badge>` also has an attribute form (`data-layout="x"`, or `data-canvas` for the canvas) that shares the same rule and modifiers; values and the per-layout modifier matrix are in §5 and on `/docs/attributes/data-layout/`. In attribute form, `main`/`article`/`section`/`aside` hosts are query containers (`container-type: inline-size`).

#### `<layout-stack>`
Vertical flex layout with configurable gap. Attribute form: `data-layout="stack"`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | Gap between children |
| `data-layout-align` | `start`, `center`, `end`, `stretch` | Cross-axis alignment. `start`/`center`/`end` make children content-sized, so direct `main`/`article`/`section`/`aside` children drop `container-type` (they would otherwise collapse to 0 width) |

Child attribute: `data-container` (on `main`/`article`/`section`/`aside`): keeps the child a query container in a start/center/end stack. Give it an explicit width.

#### `<layout-cluster>`
Horizontal flexbox with wrapping. Attribute form: `data-layout="cluster"`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | Gap between items |
| `data-layout-justify` | `start`, `end`, `center`, `between` | Horizontal alignment |
| `data-layout-align` | `start`, `end`, `center`, `stretch`, `baseline` | Vertical alignment |
| `data-layout-nowrap` | (boolean) | Disable wrapping; items overflow a narrow container, so give it `overflow-x: auto` |
| `data-layout-overlap` | (bare), `xs`, `s`, `m`, `l` | Overlap mode (avatar groups): items after the first are pulled back 0.25 / 0.5 / 0.75 / 1rem; bare = `s`. Forces gap 0. Mark up as `<ul class="unstyled" data-layout="cluster" data-layout-overlap aria-labelledby>` with one `<li>` per avatar and an `aria-label` on the "+N" chip |

Child attribute: `data-container` (on `main`/`article`/`section`/`aside`): keeps a content-sized child a query container. Give it an explicit width.

#### `<layout-center>`
Centered content container. Attribute form: `data-layout="center"`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-max` | `narrow`, `normal`, `wide`, `prose` | Max width of the content box (`box-sizing: content-box`): 40rem / 60rem / 80rem / 65ch; the gutter is added outside, so the box is max + 2 × gutter |
| `data-layout-intrinsic` | (boolean) | Flex centering for narrow content |
| `data-layout-text` | (boolean) | Center text content |
| `data-layout-gutter` | `none`, `s`, `l` | Inline padding each side. Default `--size-m` applies when the attribute is omitted; there is no `m` value |
| `data-layout-gap` | (bare), `none`, `3xs`…`3xl` | Makes it a full-width flex column (inline-size = 100% − 2 × gutter) with this gap; bare = `m`. Without it, no gap (block flow) |

#### `<layout-grid>`
Auto-fit responsive grid. Attribute form: `data-layout="grid"`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-min` | `xs` \| `s` \| `m` \| `l` \| `xl` | Minimum column width (8/10/15/20/25rem), clamped to the container (`minmax(min(min, 100%), 1fr)`): a grid narrower than the min shows one full-width column instead of overflowing. One-off: `style="--layout-min: 220px"` (not inherited by nested grids) |
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | Gap between items |
| `data-layout-subgrid` | (bare), `2`, `3`, `4` | Each child becomes a `grid-template-rows: subgrid` spanning N rows (bare = 3; other values also span 3) so header/body/footer align across siblings. The subgridded rows use the grid's row gap, so `data-layout-gap` also spaces the parts inside each child; set `row-gap` on the children to override. Any child works: direct `main`/`article`/`section`/`aside` children drop `container-type` here (a query container cannot be a subgrid) |

Child attribute: `data-container` (on `main`/`article`/`section`/`aside` in a subgrid grid): keeps the child a query container; it then sizes its own rows.

#### `<layout-cover>`
Full-height container with centered principal element. Attribute form: `data-layout="cover"`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-min` | `s` \| `m` \| `l` \| `xl` \| `auto` | Minimum block size (50/70/80vh, 100dvh). One-off: `style="--layout-min: 65vh"` (inherits: false; the same property is layout-grid's min column width) |
| `data-layout-padding` | `none`, `s`, `m`, `l`, `xl` | Padding |
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | Minimum space between all children; the principal's auto margins still centre it |
| `data-layout-centered` | (boolean) | Center the principal and text horizontally; header/footer and cover-top/-bottom children stretch to full width |

Child attributes: `data-layout-principal` (centred; a sole child centres without it; with 2+ children and no principal nothing is centred on purpose), `data-layout-cover-top` / `data-layout-cover-bottom` (a `<header>` / `<footer>` child is pinned automatically), `data-container` (on `main`/`article`/`section`/`aside` in a centered cover).

#### `<layout-sidebar>`
Two-column layout (sidebar + content). Element or attribute form (`data-layout="sidebar"`). `nav`/`aside` children are the sidebar; every other child is content; `hr`, `[role=separator]`, `template`, `script` and `style` children are skipped; without `nav`/`aside` the first child is the sidebar and the last the content. Wraps on *container* width. Nested sidebars start from their own defaults. Pair with `data-splitter` for resizable panels. Inside a `data-page-layout` `<main>` narrower than 40rem every child takes a full row (both forms) unless `data-layout-nowrap`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | Gap between columns |
| `data-layout-side` | `end` | Sidebar on the end side; omit for start (there is no `start` value). `nav`/`aside` children are the sidebar and keep DOM order; with no `nav`/`aside` child the first child is the sidebar and the row is reversed (`row-reverse`: visual order then differs from DOM order) |
| `data-layout-sidebar-width` | `narrow`, `normal`, `wide` | Sidebar width (12 / 16 / 20rem — the same three values in every sidebar context; `--sidebar-width` token default 16rem) |
| `data-layout-content-min` | `s` \| `m` \| `l` | Min content width (40/50/60%). One-off: `style="--layout-content-min: 45%"` |
| `data-layout-nowrap` | (boolean) | Prevent stacking, including in a narrow `data-page-layout` main |
| `data-layout-sticky` (on `nav`/`aside`) | (boolean) | Sticky sidebar with own scroll; requires `<html data-sticky>` |

#### `<layout-switcher>`
Flexbox row that becomes a column once the switcher's OWN width drops below the threshold (flex-basis `calc((threshold - 100%) * 999)`; no media or container query, so it stacks in a narrow sidebar on a wide screen).

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
Element only — there is no `data-layout="imposter"`. Positioning helper for overlays (visual only — use `<dialog>`/`popover` for modal UI). Logical in RTL; centred overlays use the full container width. `--imposter-z` sets stacking (default 1, `--z-float` when fixed).

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-fixed` | (boolean) | Fixed positioning |
| `data-layout-position` | `center`, `top`, `bottom`, `start`, `end`, `top-start`, `top-end`, `bottom-start`, `bottom-end` | Position |
| `data-layout-margin` | `s`, `m`, `l`, `xl` | Margin from edges |
| `data-layout-contain` | (boolean) | Cap at the containing block (positioned ancestor, or viewport when fixed) minus the margin; scrolls inside |

#### `<layout-canvas>` / `[data-canvas]`
Elevated content surface. Attribute form puts the variant in the value; the element form uses `data-variant`. 1px edge: hairline on plain pages, transparent under `data-backdrop`, CanvasText in forced colours. Nested canvases set `--canvas-bg` to `--color-surface-raised`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-canvas` (attribute form) | (bare), `flush`, `elevated` | Make any element a canvas; value = variant |
| `data-variant` (element form only) | `flush`, `elevated` | Variant for `<layout-canvas>` |
| `data-max` | `narrow`, `normal`, `wide`, `prose` | `--content-narrow/normal/wide` (40/60/80rem) or 65ch |
| `data-padding` | `none`, `s`, `m`, `l`, `xl` | Padding |
| `data-canvas-depth` | `1`, `2` | Stacked-paper sheets (37.5rem and up) |

Below 37.5rem every canvas goes flush (no radius/shadow/elevated/depth) and drops to `--size-m` inline padding, except that an explicit `data-padding` keeps its value (and `data-max` still caps the width).

#### `<layout-text>`
Content container with optimal line-length and vertical rhythm. Attribute form: `data-layout="prose"` (there is no `data-layout="text"`); `article[data-measure]` gives the measure without the rhythm. Default max-width: `--measure-normal` (65ch; fluid under `data-fluid`, shorter in the dyslexia/large-text themes). Released to 100% in query containers narrower than 30rem.

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
| `data-layout-align` | `justify` | Justified text with hyphenation. Narrow justified columns form rivers (WCAG 1.4.8 AAA): prefer ragged-right for long text |
| `data-layout-centered` | (boolean) | No effect (columns are always centered) |

Custom properties: `--column-min-width` (38ch, auto mode), `--column-gap` (`--size-2xl`).
Child attribute: `data-bleed` (direct child): spans all columns and the nearest query container's width.
Rhythm applies to direct children. Wrapping the content in one `<article>` turns it off, so put `data-layout="columns"` on the article instead. `<reader-view>` looks for a direct `<layout-columns>` child (and wraps the content in one), so it needs the element form; put headings/paragraphs directly inside it. Headings and paragraphs in the flow drop theme borders (`!important`, so the reset beats the bundle-theme layer); nested components keep theirs.

### Card Elements

#### `<layout-card>`
Element only: no `data-layout="card"` / `data-card` form. For a surface on a semantic element use `data-canvas`; for collections use `<card-list>`. Block container by default. A `<header>`, `<section>` or `<footer>` child, or any `slot="header|content|footer"` child, switches it to structured mode: header pinned on top, footer pinned at the bottom (`margin-block-start: auto`), every other child stacked between them in source order.

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
| `data-filled` | (boolean) | Solid accent fill (warning ink falls back to a fixed dark ink without `contrast-color()`) |
| `data-compact` | (boolean) | Reduced padding |
| `data-dismiss-focus` | CSS selector | Focus target after dismiss (default: next focusable after the message, else previous) |

Children: `[data-icon]`, `[data-content]` (e.g. `<section>` or a single `<p>`), `[data-title]` (e.g. `<strong>`), `[data-description]` (e.g. `<p>`), `button[data-dismiss]` (direct child; `data-dismiss="remove"` removes instead of `hidden`). Dismiss behaviour: `src/custom-elements/status-message/logic.js` (one delegated document listener) fires cancelable, bubbling `status-message:dismiss` and moves focus if it was inside. Title/compact text uses `--color-*-text`; border and filled background use the base colour. Forced colours: filled messages get a `1px solid CanvasText` border. Live regions only announce content inserted after the region exists — insert the message into a pre-existing `role="status"` container.

#### `<text-divider>`
Horizontal divider with centered text content. No attributes, no JS. Lines are `border-block-start` pseudo-elements (`--color-border`, `--border-width-thin`), visible in forced colours; an empty `<text-divider></text-divider>` is one continuous line. No semantics: use real headings for section/chapter labels and `<hr>` for an unlabelled thematic break (not `role="separator"` — its children are presentational). Wrap ornaments in `<span aria-hidden="true">`.

#### `<user-avatar>`
CSS-only (no JS). `api.json`: `src/custom-elements/user-avatar/api.json`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-size` | `xs`, `sm`, `md`, `lg`, `xl`, `2xl` | 1.5rem–8rem (default `md` 3rem); initials floor 0.625rem |
| `data-shape` | `square`, `rounded` (default: circle) | Shape |
| `data-ring` | (boolean) | Decorative ring via private `--_ring`; survives `[data-layout-overlap]` clusters; outline in forced colours |

Children: `<img>` (photo, paints on top), `span[data-fallback]` (initials / icon, stacked under the img in the same grid cell — a failed or transparent photo reveals it; UA alt text / broken icon suppressed), `span[data-status]` (`online` solid, `away` crescent, `busy` bar, `offline` hollow ring — shape + colour; text content is read but clipped, or use `role="img" aria-label`). A11y: `alt` = name when standalone, `alt=""` when the name is printed beside it; initials-only → `role="img" aria-label="Jane Doe"` on the host + `aria-hidden="true"` on the fallback; "+N" chip → `aria-label="N more …"`; groups → `<ul class="unstyled" data-layout="cluster" data-layout-overlap aria-labelledby>` with one `<li>` per avatar (the avatar draws its own 2px separator inside an li). Disc uses `light-dark()` tokens; forced colours: `CanvasText` border, ring outline, status in system colours.

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

#### `<mobile-menu>`
Breakpoint observer for a header menu. The author writes the trigger and the native popover panel inside it; nothing is generated. Must be a direct child of the `<header>`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `breakpoint` | CSS length (default `52rem`) | Viewport max-width at or below which mobile mode activates. Observed |
| `data-mobile` | (boolean, state) | Set by the element while mobile mode is active |

Mobile mode: the element shows (`display: contents`) and CSS hides `header:has(> mobile-menu[data-mobile]) > :is(nav, nav-bar, site-tools)` (no inline styles, so removal restores them). The default 52rem state also applies via `@media (width <= 52rem)` before upgrade / without JS. Leaving mobile mode closes an open panel.

Children pattern: `<button data-trigger popovertarget="m" aria-label="Menu">` + `<nav popover id="m" class="mobile-menu-panel" aria-label="Site menu">` (optional `<button class="mobile-menu-close" popovertarget="m" popovertargetaction="hide">`). Keep the panel inside `<mobile-menu>`: link/section/current styles are scoped to it. The panel is non-modal: Esc + focus return are native; no focus trap or scroll lock.

Tokens: `--mobile-menu-bg`, `--mobile-menu-radius`, `--mobile-menu-shadow`, `--mobile-menu-padding`, `--mobile-menu-max-width`, `--mobile-menu-backdrop`. Current link: `--color-interactive` fill + `--color-text-on-interactive-auto` text (via the nav `--_active-*` hooks); forced colors add outline + underline.

#### `<site-tools>`
CSS-only flex cluster for site-wide tools (search, theme picker, settings). `margin-inline-start: auto` pushes it to the inline end of a flex `header.site` / footer. No attributes. Token: `--site-tools-gap` (default `var(--size-s)`; use it instead of overriding `--size-s`, which would re-scale nested components). A sibling `<mobile-menu>` hides it entirely at its breakpoint: repeat the tools inside the mobile panel, or put a tool that must stay visible directly in the header after `<mobile-menu>` (the docs site does this for `<notification-wc>`). Optional `role="group" aria-label="Site tools"`.

#### `<site-legal>`
CSS-only legal row (copyright, license, privacy/terms links) for footers.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-justify` | `start`, `center` (default), `end`, `between` | Row alignment (sets `--site-legal-justify`). `start`/`between` also clip the separator that would lead a wrapped row |

Children: items as `<span>`/`<a>`, or one `<ul>`/`<ol>` whose `<li>`s are the items (list semantics; add `role="list"` if VoiceOver counts matter). Links are always underlined (thicker on hover/focus). Separators are decorative `::before` content (`content: var(--sep-list, "·") / ""`), absolutely positioned in the gap outside each item: never in a link's hit area, underline or accessible name. Tokens: `--sep-list`, `--site-legal-justify`. Copyright year is authored text (`<time datetime="2026">`) or build-time; no JS.

#### Progress ring

Not a custom element — use `<progress data-type="ring">` (see `<progress>` Progress Bar).

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

### Component index (85 elements)

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
| `<include-file>` | Same-origin HTML fragment include, sanitized by default: `src` (resolved against the page; blob:/data:/javascript: refused), `mode` replace/append/prepend, `lazy`, `trusted` (skip sanitizing), `allow-scripts` (requires `trusted`), `allow-cross-origin`, `data-label-error`; state `data-loading`/`data-loaded`/`data-error` + `aria-busy`; cycles and nesting > 10 refused; `.src`, `reload()`; events `include-file:loaded` `{ src, url, html }`, `include-file:error` `{ src, error }`, `include-file:src-changed` `{ src, source }`; sanitized with the fragment profile (keeps `id`/`name`, safe `style`, popover/command invokers; drops `<style>`, `on*`, form attrs) and inserted as nodes | ✓ |
| `<markdown-editor>` | Markdown textarea + live sanitized `<markdown-viewer>` preview. Adopts the authored `<textarea>` (id/`<label for>`, `name`, `required`, `minlength`/`maxlength`, `readonly`, `dir`, `form`, `aria-*` kept; created only when absent): put `name` on the textarea, native submit/validity/reset with or without JS. Host: `placeholder`, `rows` (override the textarea's; no default placeholder), `highlight`, `data-tab-indent` (Escape then Tab leaves; Shift+Tab never captured), `data-auto-mermaid`, `data-theme`, `data-label-source`/`preview`/`tab-hint`; panes stack below ~40em of the editor's own width; `.value` get/set, `.textarea` (stable across reconnects); events `markdown-editor:input` `{ value }`, `markdown-editor:change` `{ value, source: "user"\|"api" }` (composed) | |
| `<markdown-viewer>` | Render markdown (vendored marked, GFM + `:::note\|info\|tip\|warning\|danger [title]` callouts → `aside.callout[role=note][data-kind]`) from `src`, `<script type="text/markdown">`, `<template data-md>` or `<pre>`; sanitized by default (cleaned nodes inserted, never re-parsed; `<style>`/`style`/form attrs/invokers removed, `id`/`name` → `user-content-*`; untrusted profile also unwraps `<social-embed>`, `<youtube-player>` and `<geo-map>` to their fallback children and strips `src`/`src-dark`/`data-src`/`url`/`endpoint`/`tile-url` from every other custom element (except `<audio-player>`, `<video-player>`, `<image-map>`, `<brand-mark>`, whose `src` is a media/image URL like the native element they wrap); the include-file fragment profile is unchanged); `sanitize="off"` = trusted first-party only; `src` same-origin unless `allow-cross-origin`; `highlight`, `ping`, `data-theme`, `data-label-error`, `data-auto-mermaid`; state `data-rendered`/`data-loading`/`data-error`; `.parser`, `.markdown`, `render()`, `reload()`; events `markdown-viewer:fetch` `{ src }`, `:rendered` `{ src, node }`, `:highlight` `{ node, language }`, `:error` `{ error }` | |
| `<nav-bar>` | Top-level nav with automatic `aria-current="page"` (URL matching, popstate + Navigation API) | ✓ |
| `<note-wc>` | Private reader notes on highlights: action in `<selection-menu>` (highlight + note), page-level button with `for="id"`, bare = panel host for margin-annotation clicks (`highlights:request-note`); `openFor(highlight, controller, opener?)`; `data-label-*` | |
| `<notification-wc>` | `mode="banner"` dismissible strip (`persist`, `variant`, `position`, `expires`) or `mode="panel"` bell + drawer (static `<article data-id data-type data-date>` + `src` feed + `.notifications`), read state in VBStore; `data-label-*` | |
| `<page-info>` | Document provenance disclosure. Static: enhances `time[data-relative]` (Intl.RelativeTimeFormat in closest `[lang]`, absolute date in `title`, future dates "in 3 days"), `[data-reading-time]` (outermost `[data-signable]` roots, 238 wpm / 500 CJK chars per min, skips `[data-signable=false]`/hidden/script), first `.page-info-badge` (trust tier + visible `.page-info-tier` text). `auto` renders from §10 metadata as text only (links only when http(s)); author is plain text in `<summary>`, link in the panel. `data-concept-base` (default `/topics/`), `data-heading-level` (2–6), `data-label-*` (headings, row labels, `tier-*`, `provenance-*`/`review-*`/`status-*`, `reading-time` template `~{n}`); event `page-info:verified` `{ status, tier, reason? }` (declared first, then the verification result) | (see §10) |
| `<page-stats>` | Reading stats for `data-for` target: `data-show="reading-time,word-count,last-modified"`, `data-wpm` (238, shared with page-info), Intl.Segmenter word count (CJK timed by characters), skips script/style/template/[hidden]/[aria-hidden]/[inert]/`[data-stats-ignore]`; `data-label-reading-time`/`word-count`/`last-modified`, templates `data-label-min-read` (`{n} read`) and `data-label-words` (`{n} words`, plus `-one`/`-few`/… PluralRules overrides); last-modified only from `meta[name=last-modified]`/`article:modified_time`; own `<dl data-generated>` recomputed on attribute change, author `<dl>` adopted | ✓ |
| `<page-toc>` | Table of contents with scroll-spy: auto-built from `levels` (default `h2,h3`) inside `scope` (CSS selector, first match; default `main`), or enhances authored `.details > .summary + .nav > .list > .item > .link` markup (nest `.list` for sub-sections); `data-title` (summary + nav label, default "On this page"); `orientation="horizontal"` scrollable bar; `data-toc-ignore` on headings/ancestors; `.entries`, `refresh()`; event `page-toc:navigate` `{ id }` | ✓ |
| `<page-tools>` | Page-utility toolbar (`role="toolbar"`, roving tabindex with arrows/Home/End, `aria-orientation`): `data-position` sticky\|fixed\|inline, `data-orientation` auto\|vertical\|horizontal (reflected `data-resolved-orientation`), `data-gap`; collapses at/below `data-breakpoint` (default `48rem`) to a FAB (`data-fab-icon`, `data-fab-label`) opening a native popover above it (reflected `data-collapsed`); `.tools`; `--page-tools-*` custom properties | |
| `<page-tour>` / `<tour-step>` | Guided spotlight tour over `<tour-step data-target>` children (no-JS: in-page step list, optional `details.page-tour-guide` + `.page-tour-start-btn`): `data-title` (default "Page Tour"), `data-trigger` auto/manual/button (+ `[data-tour="id"]` buttons), `data-mode` passive/active/forced (skipping only), `data-persist` none/session/local + `data-persist-key`, `data-spotlight-padding` (overrides `--tour-spotlight-padding`); step `data-placement` top/bottom/inline-start/inline-end/auto (anchor-positioned, centred, flips), `data-action` none/click/focus/input/change/custom (Next `aria-disabled` + hint until done; focus never moved), `data-action-hint` (text), `data-skippable="false"`, `data-scroll` auto/smooth/none; reflects `data-step`/`data-active`/`data-complete`; `start(step?)` (while running = go to step), `stop()`/`next()`/`prev()`/`goto(i)`/`skip()`/`reset()`; keys anywhere while active (Escape, arrows, Home/End, Tab trap incl. gated target); events `tour:start`/`step`/`action`/`complete`/`skip`; `data-label-step` ("Step {n} of {total}")/`skip`/`close`/`prev`/`next`/`finish`/`nav`/`ready` | |
| `<pager-wc>` | Decoupled pagination controls for a `[data-paged]` container: `target` (selector) / `for` (id) / implicit preceding `[data-paged]` sibling (resolved lazily; must carry `data-paged`); `data-style` `numbered`\|`prev-next`\|`load-more` (load-more needs `data-paged-style="load-more"` on the target, plus `data-paged-controls="none"`); `data-label-nav`/`prev`/`next`/`page` ("Page {page}")/`status` ("Page {page} of {total}")/`load-more` ("Load more ({n})")/`no-more`/`missing`; focus kept across renders; event `pager-wc:navigate` `{ page }` (page navigations only, not cancelable) | |
| `<poll-wc>` | Voting with live counts, percentages and bars over `button[data-option]` children or a native radio/checkbox `<form>` fallback; author confirms with `setCount()` | ✓ |
| `<pop-over>` | Anchored popover primitive (Popover API + CSS Anchor Positioning, JS fallback) | ✓ |
| `<popularity-index>` | Most-visited list from `/api/analytics/popular` (or any `{ pages }` endpoint); http(s)/same-origin links only; `data-state` output | ✓ |
| `<print-page>` | Print button wrapping `window.print()`; `variant` icon (default; label → `aria-label`)\|label\|icon-label; `label` (else authored text, else "Print this page"); `raw-toggle` adds a "print without VB styles" checkbox (sets `data-print-raw` on `<html>` for the print; host becomes a labelled `role="group"`), `data-label-raw`; never printed | |
| `<progress-tracker>` | Multi-step progress over an inner `<ol>` of `<li data-step? data-error?>`: `data-current` (step id first, else 1-based index), `data-clickable` (completed steps become native `<button>`s), `data-direction="vertical"`; sets `li[data-status=complete\|current\|upcoming\|error]` + `aria-current="step"`; hidden status text via `data-label-step` ("Step {n} of {total}:"), `data-label-complete`/`current`/`upcoming`/`error`, list name `data-label-list`; `--pt-*` colour/size props; event `progress-tracker:step` `{ step, previousStep, source: 'attr'\|'click' }` (not on upgrade) | |
| `<qr-code>` | QR code generator | ✓ |
| `<reaction-bar>` | GitHub-style reaction chips (`button[data-reaction data-count data-mine data-label]`) plus an auto trigger that opens a `<template data-palette>` palette in a `<pop-over>`; author confirms with `setCount()` | ✓ |
| `<reader-view>` | Immersive reading shell: moves its children into `<layout-columns>` with a chrome bar; `mode` scroll\|pages (observed; pages = full-viewport overlay: rest of page `inert`, scroll lock, focus into pager, Escape back with focus to the toggle, `--reader-view-z` default `var(--z-overlay)`), `columns` auto\|1\|2\|3 (observed), `font-controls`/`col-controls`="false", `reader-title`, `persist`="false", `storage-key` (default `vb-reader:<pathname>[#id]`), `data-remember-mode` (opt in to restoring the saved mode); `slot="chrome"` replaces the bar, wired by `data-reader-action` toggle-mode/set-mode-scroll/set-mode-pages/font-increase/font-decrease/set-columns(+`data-reader-value`)/prev-page/next-page and `data-reader-output` page-indicator/mode-label (runtime sets `aria-pressed`); keys in pages mode: arrows (mirrored in RTL), PageUp/PageDown, Space/Shift+Space, Home/End, Escape; events `reader-view:mode` `{ mode }`, `reader-view:page` `{ page, total }`, `reader-view:font` `{ size, index }`; `data-label-*` (incl. `page-indicator` "{page} / {total}"); prints as one static flow | |
| `<reading-progress>` | Decorative fixed scroll-progress bar (inner `<progress>` always `aria-hidden`): document progress via CSS `animation-timeline: scroll(root block)` (no JS), or `data-for="id"` (observed) for an element's bounds via a passive rAF listener (missing target → document progress until the element appears); `data-position` top\|bottom; `--reading-progress-color`/`-height`/`-offset` (sticky-header gap)/`-z`; RTL fills from the right, forced colors `Highlight`, hidden in print | |
| `<recently-visited>` | Device-local history lens (localStorage only). Tracking is opt-in: `<meta name="vb:track-history" content="on">` or the element's presence; opt out with `<html data-vb-no-track>`, `<meta name="vb:no-track-history">` or the reader's Pause; query strings are stripped (allowlist with `vb:track-history-params`); 30-day TTL; 100-entry cap; current page excluded (`include-current`); `limit`, `data-heading-level` (0 = none), `data-label-*`; `.entries` | ✓ |
| `<score-card>` | KPI tile: slots `title`/`value`/`change`/`sparkline`/`description`/`icon` (slotted children must be DIRECT children; block `<p>` children make the no-JS form stack); `trend` up\|down\|flat (change text `--color-success-text`/`--color-error-text`), `tone`, `layout` stack\|cluster\|compact, `loading` (skeleton + `aria-busy="true"`; forced-colours `GrayText` outline); wrap in `<a href>` for drill-down (`:state(interactive)`) | |
| `<selection-menu>` | Floating toolbar on text selection (pointer or keyboard) for `for="id"` / `[data-selection-menu="<id>"]` targets: children move into a generated `<pop-over data-selection-menu-host role="toolbar">` (top layer); Alt+F10 focuses it, arrows/Home/End rove, Escape returns focus + selection; `data-label`; `getSelection()`, `dismiss()`, `actions` | ✓ |
| `<settings-panel>` | Non-modal site settings dialog from a gear trigger (or an authored `button[data-trigger]` / first child `<button>`): six exclusive `<details>` sections (Appearance: mode + theme; Accessibility: high-contrast/large-text/dyslexia; Layout: fluid + density, canvas backdrop + style/chrome/fixed header/page background, sticky navigation; Effects: motion/sounds; Environment: time-of-day/seasonal; System: version, SW status `role="status"`, clear cache/check update); `open()` (moves focus in; queued before render) / `close({ returnFocus })` / `toggle()`, reflected `open`; Escape + close button return focus, Tab out or outside click closes, no trap; Reset uses an in-panel confirm; `data` `{ a11yThemes, extensions, sticky }` (setter applies + persists, safe before render) → `settings-panel:data-changed`; window events `vb:a11y-themes-change` / `vb:extensions-change` (sent and received; detail applied) + `vb:theme-change`; storage `vb:settings:a11y`/`extensions`/`sticky`; sticky toggle owns only `<html data-sticky>` (sticky-manager owns the banner header); `data-label-*` for every string (trigger, dialog, title, close, sections, controls, sw-*, reset-*) | |
| `<share-wc>` | Social share: native share button (fails over to copy link), platform buttons, or enhanced slotted `a[data-platform]` with `{url}`/`{title}`/`{text}` tokens; in `<selection-menu>` shares/copies the quote with a `#:~:text=` link; `data-label-*`; `url`/`shareTitle`/`text`, `share()` | ✓ |
| `<short-cuts>` | Keyboard shortcut dialog listing `[data-command][data-shortcut]` and `[data-hotkey]` actions (or the `shortcuts` property); `hotkey` (default `shift+?`, `none` off — WCAG 2.1.4); `show()`/`close()`/`toggle()`; `data-label-*` | ✓ |
| `<site-index>` | Enhances a hand-authored A–Z keyword index (or `src` JSON `[{ term, refs: [{ href, label, type? }] }]`, rendered as text, http(s)/relative hrefs only): filter (`filter` topic\|all) with a polite match count, jump strip from section ids (`letters` entries\|all\|none; Intl-sorted, `index-é` → É), counts, `limit`, `sort` alpha\|count; index nav = `nav[data-index]` or the direct-child `<nav>` of sections (any aria-label); controls are a `<search>` landmark; `data-label-*`. Nothing is derived from meta tags — the index is authored | |
| `<site-map>` | `mode` nav-enhance (default: marks `current`, opens ancestor `<details>`, expand/collapse-all; `src` `{ children }`) \| ia-tree (`li[data-page-type data-template data-status]` → tree with badges, roving tabindex, Enter follows link, Space toggles, RTL-mirrored arrows; `title`, `collapsed`, `compact`; `data-view="visual"` SVG org chart with treeitems + `aria-activedescendant`, `data-orientation`, `data-detail` 0–4; `.pages`; events `site-map:ready`/`select`/`pages-changed`) | |
| `<site-search>` | Pagefind-backed search in a native modal `<dialog>` (combobox + listbox + `role=status` count); `data-pagefind-path` (default `/pagefind/`), `data-base-url`; `data-label-*`; page-level Cmd/Ctrl+K opens the first visible instance | ✓ |
| `<slide-accept>` | Slide-to-confirm (form-associated). A tap on the handle, or Enter / Space / End, also confirms (WCAG 2.5.7); the authored text is the default label | ✓ |
| `<social-embed>` | Click-to-load social post embed: authored fallback link + real `<button data-embed-load>` ("Load {provider} {noun}") + host note; on load a sandboxed iframe built from the validated URL (https + exact host allowlist; no oEmbed HTML, no platform script) — `bluesky` (bsky.app/profile/{handle\|did}/post/{rkey} → embed.bsky.app; handle → DID via public.api.bsky.app), `mastodon` (any https instance /@user/{id} → /embed, tightest sandbox), `x` (→ platform.twitter.com/embed/Tweet.html), `instagram` (→ /p/{code}/embed/), `youtube` (→ `<youtube-player video-id title start poster>`, renders at once, thumbnail fetched up front unless `poster`); `url` (required), `provider`, `theme` light\|dark\|auto (X + Bluesky only; re-render on `vb:theme-change`), `activate` click\|visible\|eager, `data-title`, `poster` (YouTube only), `data-label-load`/`loading`/`error`/`note`; `state` idle/loading/loaded/error/unsupported; focus moves into the frame after a button load, stays on the retry button on error; reconnect after load keeps the embed (YouTube: the inner player re-renders its facade); static `SocialEmbed.register(name, provider)` (re-inits `unsupported` instances); exports `createEmbedFrame`, `loadScript` (failed loads retryable), `fetchOEmbed` | |
| `<spacing-specimen>` | Token specimen — spacing scale demo | |
| `<split-surface>` | Resizable split-pane | ✓ |
| `<star-rating>` | Star rating input (works on `[data-rating]` too) | ✓ |
| `<status-wc>` | State dot + label: `data-variant` live\|recording\|streaming\|error\|online\|running\|away\|paused\|busy\|offline\|stopped (or custom via CSS), `data-size`, `data-position` before\|after\|only, `data-pulse`; never colour-only — with no slot text a visually hidden default label per variant is rendered (`data-label-<variant>`, else `aria-label`, else English name) and follows `data-variant`; `role="status"`/`aria-live="polite"` unless author role/aria-live or `data-live="off"`; `status-wc:change` `{ variant, previousVariant }` only for post-upgrade changes; `.variant`; 1px darker ring in light mode (`--status-dot-ring`), forced colours system-colour dot | |
| `<stepper-wc>` | Form-associated stepper for formatted units, currency, duration, bytes, token-snap scales and enums (plain numbers: `<input type="number" data-stepper>`). Inner `role="spinbutton"` is named from `<label for>` / wrapping label / host `aria-labelledby` / `aria-label`; `readonly` (aria-readonly, buttons disabled), `disabled` / disabled fieldset; `data-label-decrease` / `-increase`; `.value`, `.displayText`, `recomputeWidth()` | |
| `<tab-set>` | Accessible tabs | ✓ |
| `<text-reader>` | Text-to-speech reader (Web Speech API + CSS Custom Highlight API): `for` (target id), `variant="icon"` (trigger + top-layer toolbar placed after it; Escape returns focus), `selectors` (default `p,li`), `speed`, `voice`, `highlight="false"`, `scroll="false"`; `data-label-play`/`-pause`/`-stop`/`-reader`/`-controls`/`-voice`/`-loading-voices`/`-speed`/`-slower`/`-faster`; slots `icon-play`/`icon-pause`/`icon-stop`/`icon-trigger`. Language = target's nearest `[lang]` (utterance.lang + voice preference); skips pre/code/aria-hidden/hidden; `<`/`>` sanitised to spaces; text re-extracted on play; reduced-motion = instant scroll; `play()`/`pause()`/`resume()`/`stop()`, `voices`/`speaking`/`paused`/`progress`; events `text-reader:play`/`pause`/`resume`/`stop`/`end`/`word`/`error` | |
| `<theme-picker>` | Theme switcher (popover or `variant="inline"`, `compact`); per-instance radio groups; pointer picks auto-dismiss, arrow keys never do; non-modal (Escape / Tab-out / outside click close); `data-label-*`; syncs with sibling pickers + settings-panel via `vb:a11y-themes-change` / `vb:extensions-change` | ✓ |
| `<time-index>` | Changelog/timeline enhancer: "Oldest first" toggle (`aria-pressed`), `versions` filter (entry version = `data-version` → own `.version-tag` → `v2-1-0` id) with live count, `<time data-relative>` keeps absolute date in `title`, optional `updates-src` JSON feed (http(s)/relative links only); `data-label-controls` / `-sort` / `-filter` / `-all` / `-status` / `-status-all` / `-recent` | |
| `<time-picker>` | Form-associated time picker (combobox text entry + spinbutton dialog) over `<input type="time">` | ✓ |
| `<toast-msg>` | Toast notification queue | ✓ |
| `<tool-tip>` | Anchor-positioned rich tooltip | ✓ |
| `<topic-map>` | SKOS concept tree from `data-lens-src` pages.json (`concepts: []`) + `data-vocabulary-src` (default `/vocabulary.json`): native `<details>` per concept, text-only summary with distinct-page count per subtree (`data-label-page`/`-pages`, `{count}`, Intl.PluralRules), `p.topic-link` to `/topics/{id}/` (`data-label-topic-link` "{label} topic page") in the body; `expand-all`; `data-heading-level` (default 2, `0` = none) + `data-label-heading`; `data-label-uncategorized`/`-error`; http(s)/relative links only; cycle-safe; `.data = { pages, vocabulary }` + `topic-map:data-changed`; JS-built (no-JS shows fallback only) | |
| `<trust-filter>` | Provenance lens over `data-lens-src` pages.json: checkbox groups provenance (space tokens) / review / status / "Has signature" (declared `vb:signature`, not verified — see page-info); OR within, AND across; both signature values = no filter; only `output[data-trust-filter-count]` is live ("{count} of {total} pages"), list in sibling `ul[data-trust-filter-results]`; no ids; `data-label-*` (form, provenance, review, status, signed, yes, no, clear, page/pages, has-signature, error, no-source); http(s)/relative links only; `trust-filter:change` `{ selected, count }` on reader input/reset only | |
| `<type-specimen>` | Token specimen — typography scale demo | |
| `<version-switcher>` | Switch between versions of a page (releases or history): inline / `data-src` / `vb:versions-manifest` data, navigate / swap / diff actions, archived banner, page-info mount; URL-checked entries, same-origin sanitized swap; `data-label-*` + Intl dates | ✓ |
| `<video-player>` | Custom-controls video over a light-DOM `<video>` (+ optional `ol.track-list` playlist): `autoplay` (first connect only; skipped under prefers-reduced-motion), `loop` (single: video.loop; playlist: wrap), `shuffle`, `muted`, `captions`; host becomes `tabindex=0` `role=group` "Video player" with `aria-keyshortcuts`; shortcuts (Space/K, ←/→ 10s, ↑/↓ volume, M, F, C) only when the host has focus, never from its own controls or with Ctrl/Cmd/Alt; seek slider ←/→ 5s; `aria-valuetext` "0:05 of 3:20" / volume "37%"; mute `aria-pressed`; `data-label-*` (player, controls, play-video, play, pause, seek, skip-back, skip-forward, mute, volume, speed `{rate}`, captions, fullscreen, exit-fullscreen, playing, paused, ended, buffering, time-of `{current}`/`{duration}`) + locale digits from closest `[lang]` (Intl.DurationFormat, NumberFormat fallback); controls always LTR; state `state` (idle/playing/paused/buffering/ended), `controls` (auto-hide flag, never cleared while focus is inside), `data-fullscreen` (this player only); `.src`, `.currentTime`; events `video-player:play` `{ currentTime, src }`, `:pause`, `:ended`, `:track-change` `{ src, title }`, `:fullscreen` `{ active }`, `:speed` `{ rate }`, `:captions` `{ active, label }`, `:src-changed` `{ src, source }` | |
| `<watch-wc>` | One-tag watch-this-page toggle over `[data-watch-page]` (`aria-pressed`): `variant` icon\|compact\|button, `label`, `server-sync`, `data-label-*`; no-JS fallback children | ✓ |
| `<week-view>` | Multi-day hour grid in a semantic table | ✓ |
| `<youtube-player>` | YouTube embed behind a facade: thumbnail `<img alt="">` + one `<button>` named `data-label-play` (default "Play {title}") that covers the facade (host has no role/tabindex); press → `www.youtube-nocookie.com/embed/{id}?autoplay=1` iframe (`referrerpolicy="strict-origin-when-cross-origin"`), focus moves into it; `video-id` (required, `[A-Za-z0-9_-]{6,20}`, invalid → not upgraded, fallback `<a>` stays), `title` (default "YouTube video"), `poster` (local image; no i.ytimg.com request), `thumbnail` hq\|mq\|sd\|maxres (sd/maxres fall back to hq; img `referrerpolicy="no-referrer"`), `start`/`end` (whole seconds), `list`, `params` (overrides; host fixed), `autoplay` (loads at once, never moves focus, ignored under reduced motion); classes `widescreen`/`standard`/`ultrawide`/`rounded`/`full`; state `ready`/`active` (read-only); event `youtube-player:activate` `{ videoId, fromUser }`; reconnect re-renders the facade | |

Detailed entries follow for the components with extended attributes/events. See `api.json` per component for the complete attribute & event surface.

### `<tab-set>`
Accessible tabbed interface built on `<details name>` / `<summary>` children with one `<section>` panel each (no `role="tab"` / `role="tabpanel"` overrides; summary keeps its button role and `aria-expanded`). A labelled host gets `role="group"`. Missing or page-shared `<details name>` values are replaced with a per-instance name on upgrade.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `transition` | `fade` \| `slide` \| `scale` | View Transition between panels |
| `data-orientation` | `horizontal` (default) \| `vertical` | Vertical: tab column at the inline start, panel beside it, ArrowUp/ArrowDown keys |

| Property | Description |
|----------|-------------|
| `tabs` | `Array<{ id?, label, content, active? }>` — get as data or assign to rebuild; `content` is trusted HTML |

| Events | Detail |
|--------|--------|
| `tab-set:change` | `{ index, previousIndex, tab, panel }` — once per activation, from the opening tab |
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
Tooltip or hover card composed on `<pop-over>`. Hover (with delay) and focus open it; Escape and outside clicks close it. Uses `interestfor` where available. Default variant: `popover="hint"`, or `manual` with its own Escape/outside dismiss where `hint` is unsupported (never `auto`, which would close other open popovers).

| Attribute | Values | Description |
|-----------|--------|-------------|
| `content` | text | Plain-text content. A `<template data-tooltip>` child wins; the trigger's `title` is the last fallback |
| `position` | `top` (default), `bottom`, `left`, `right` | Placement (cards default to `bottom`). Without anchor positioning, a JS fallback honours it, flips, and centres |
| `delay` | ms | Hover show delay on the JS path (default 200; cards 300) |
| `variant` | `card` | Interactive hover card instead of a text tooltip |

| Child | Description |
|-------|-------------|
| `<template data-tooltip>` | Rich HTML content (default variant) |
| `[data-trigger]` | Card: the element that opens the card |
| `[data-content]` | Card: the body. Moved into the card while upgraded, put back on disconnect (reconnect-safe) |
| `title` on the trigger | Fallback text. Removed while upgraded (copied to `aria-label` when it was the trigger's only name), restored on disconnect |

ARIA: the tooltip id is appended to the trigger's `aria-describedby` (authored ids are kept; only the added id is removed on disconnect). Cards set `aria-controls` and `aria-expanded` on the trigger. Keyboard: focus inside a card keeps it open, and Escape closes it and returns focus to the trigger.

| Events |
|--------|
| `tool-tip:show`, `tool-tip:hide` |

Methods: `show()`, `hide()`. Property: `isVisible` (read-only boolean).

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

### `<pop-over>`
Anchored popover primitive over the native Popover API. Sets `popover` from `data-mode`, appends its own dashed-ident to the anchor's `anchor-name` list (several pop-overs can share one anchor; disconnect removes only its own name), and falls back to fixed positioning (measured after show, flipped and clamped to the viewport) without anchor-positioning support. Composed by `tool-tip`, `drop-down`, `combo-box`, `context-menu`, `selection-menu`, `reaction-bar`. The host has no role — authors supply semantics.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-mode` | `auto` (default), `manual`, `hint` | Popover type. `hint` falls back to `auto` where `popover="hint"` is unsupported; hover is not wired (use `interestfor` / `tool-tip`). An authored `popover` attribute wins at upgrade; later `data-mode` changes re-apply it |
| `data-anchor` | element ID or selector | Anchor element (default: the `[popovertarget]` trigger pointing at this id) |
| `data-position` | `bottom` (default), `top`, `left`, `right`, each with `-start`/`-end` | Placement; start/end are logical (mirror in RTL); flips on overflow |
| `data-offset` | `none`, `xs` (default), `s`, `m`, `l` | Gap to the anchor (`--size-*`) |
| `data-anchor-name` | (output) | Dashed-ident bound to the anchor; absent with no anchor / no anchor-positioning support |

`data-mode`, `data-anchor` and `data-position` are observed (changes after upgrade re-wire). A manual pop-over with no anchor stays centred in the viewport. An authored `popover` attribute makes it work without script.

| Events | Detail |
|--------|--------|
| `pop-over:show`, `pop-over:hide` | `{ state: 'open' \| 'closed' }` (bubbles, composed; fired on `beforetoggle`) |

Methods: `show()`, `hide()`, `toggle()`. Property: `open` (read-only boolean).

### `<toast-msg>`
Toast stack: the host is the single polite live region (`role="log"`, `aria-live="polite"`; authored `aria-label`/`aria-live` are kept). Toasts have no role of their own. Each one gets a visually hidden variant prefix ("Error: …"). Auto-dismiss pauses on hover, while focus is inside the stack, and while the page is hidden (WCAG 2.2.1). Escape closes the focused toast, and focus moves to the next toast or back to the opener. Live toasts and the queue survive a reconnect.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `position` | `top-end` (default), `top-start`, `top-center`, `bottom-end`, `bottom-start`, `bottom-center` | Stack position (logical; centred positions stay centred in RTL) |
| `duration` | ms (default 5000; `0` = sticky) | Default auto-dismiss time |
| `max` | number (default 5) | Max visible toasts; extras queue |
| `data-label-region` | text (default "Notifications") | Stack name |
| `data-label-dismiss` | text (default "Dismiss") | Close button label |
| `data-label-info` / `-success` / `-warning` / `-error` | text | Spoken variant prefixes (default "Info", "Success", "Warning", "Error") |

| Events | Detail |
|--------|--------|
| `toast-msg:enqueued` | `{ message, variant, duration, source, toast, queued }` (every `show()`) |
| `toast-msg:show` | `{ toast }` |
| `toast-msg:hide` | `{ toast }` |

JS API: `show({ message, variant, duration, dismissible, action, onAction, source })` returns the toast element. Also `dismiss(toast)` (works for `dismissible: false` too), `dismissAll()`, and the read-only `queue` (`[{ message, variant, state: 'visible'|'queued' }]`).

Toast variants: `data-variant="info|success|warning|error"` on the `.toast` child (set by `show()`).

### `<site-search>`
Full-text search in a native modal `<dialog>` (`showModal()`: top layer, page inert, Escape closes). Input is a `role="combobox"`; results are a listbox of `role="option"` links (titles as text, excerpts `<mark>`-only, same-origin http(s) URLs); a separate `role="status"` region announces the count.

| Attributes | Methods / properties | Events | States |
|---|---|---|---|
| `data-pagefind-path` (default `/pagefind/`), `data-base-url`, `data-label-*` (dialog, placeholder, input, results, searching, empty, count "{count} results", count-one, unavailable, error, untitled, navigate, select, close, powered), reflected `open` | `open()`, `close()`, `isOpen`, `value`, `results` | `site-search:open`, `site-search:close`, `site-search:change` `{ value, source }` | `:state(input-debounce-pending)` |

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
| `direction` | `horizontal`, `vertical` | Split direction (observed) |
| `position` | 0-100 | Default split position % (observed, not reflected; a persisted layout wins on load) |
| `min` | 0-100 | Minimum panel size % (observed) |
| `max` | 0-100 | Maximum panel size % (observed) |
| `collapsible` | (boolean) | Enter or double-click on the divider collapses / expands the first panel (collapsed panel is `inert`; `aria-valuemin` becomes 0) |
| `persist` | (string key) | Remember `{ position, collapsed }` in VBStore (`vb:layout:split:{key}`); wins over `position` |
| `data-label-resize` | string | Divider accessible name (default "Resize panels") |
| `data-label-collapsed` | string | Divider `aria-valuetext` while collapsed (default "Collapsed"; otherwise "{n}%") |

| Events | Detail |
|--------|--------|
| `split-surface:resize` | `{ position, source }`, where source is `pointer` \| `keyboard` \| `api` \| `attribute` (not fired on load) |
| `split-surface:collapse` | `{ collapsed, source }` |

Properties `position` and `collapsed` (settable, and queued until the async init finishes), plus `reset()` (expand, return to the `position` attribute, clear persistence); `:state(divider-dragging)` and `:state(collapsed)`. While collapsed, any arrow / Home / End key expands the panel (no keyboard trap). `aria-orientation` is the divider's own axis (`vertical` for side-by-side panels). Drag and arrow keys mirror in RTL, and the grip stays centred. In forced colors the divider is `CanvasText` and turns `Highlight` on hover, drag and focus (this styling is shared with `data-splitter`). The `data-splitter` attribute utility shares the divider markup but fires `splitter:resize` (`{ position }`), not `split-surface:resize`; it also reads `data-label-resize` on the container.

### `<star-rating>`
Interactive star rating (form-associated). FormData gets exactly one `name=value` entry (internal radios carry `form="_star-rating-detached"` and a per-instance group name). All attributes are observed; `.value` set before connect is applied on build; `form.reset()` returns to the `value` attribute.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `value` | number | Current value and reset default |
| `max` | number | Maximum stars (default: 5) |
| `readonly` | (boolean) | Read-only mode (`role="img"` summary; partial star fills from the inline start, RTL-aware) |
| `allow-half` | (boolean) | Half-star increments |
| `icon` | string | Custom icon name |
| `label` | string | Legend text (default "Rating") |
| `name` | string | Form field name |
| `required` | (boolean) | Required for form validation |
| `data-label-one` / `data-label-other` | template | Radio labels per `Intl.PluralRules` category, `{n}` via `Intl.NumberFormat` (defaults "{n} star" / "{n} stars"; any CLDR category) |
| `data-label-readonly` | template | Read-only summary (default "{label}: {value} out of {max}") |
| `data-label-required` | string | Validation message (default "Please select a rating") |
| `data-label-cleared` | string | Clear announcement (forwarded to the inner fieldset) |

Property: `value` (number). Event: `rating:change` `{ value }` (from the inner fieldset, bubbles). Keys: arrows (native), Space on the checked star or Delete/Backspace clears.

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

### `<time-picker>`
Form-associated time picker. Wraps a native `<input type="time">` (the no-JS fallback); on upgrade renders a combobox text input + spinbutton popup (`role="dialog"`). Submitted value is `HH:MM` (or `HH:MM:SS` when seconds are shown); nothing is submitted while empty.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `name` | string | Form field name (a `name` on the inner input moves here on upgrade) |
| `data-format` | `12h` \| `24h` | Hour cycle (default: nearest `lang`) |
| `disabled` | (boolean) | Disable (observed; also via disabled `<fieldset>`; inner-input `disabled` moves here) |
| `required` | (boolean) | `valueMissing` while empty (host or inner input) |
| `data-label-input` / `-placeholder` / `-toggle` / `-dialog` / `-hours` / `-minutes` / `-seconds` / `-period` / `-empty` / `-required` / `-range-underflow` / `-range-overflow` / `-step-mismatch` | string | Translate built-in UI strings |

| Events | Detail |
|--------|--------|
| `time-picker:change` | `{ value, hours, minutes, seconds, source }` (`value` `''` and units `null` when cleared; not fired on reset/restore) |

Properties: `value` (`''` clears). Validity: `valueMissing`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch` (typed values flagged; spinners snap to `step` from `min` and clamp; `min` > `max` = overnight range). Children: `<input type="time">` supplying `value` (reset target), `min`, `max`, `step`, `name`, `id` (its `<label for>` names the combobox). Locale = nearest `lang` (Intl day-period text; period-first locales put AM/PM first).

### `<theme-picker>`
Theme picker UI (mode, accent, theme, sizing, a11y themes, extensions). `variant` `popover` (default) \| `inline`; `compact`; `open` is reflected state only. Trigger: `[data-trigger]` child, else first child `<button>`, else a generated `type="button"` icon trigger. Labels: `data-label-panel`/`-trigger`/`-mode`/`-accent`/`-style`/`-featured`/`-more-themes`/`-theme`/`-a11y`/`-sizing`/`-extensions`/`-download` (`{name}` placeholder). With no stored a11y list, authored `a11y-*` tokens on `<html data-theme>` are kept.

| Events | Detail |
|--------|--------|
| `theme-picker:open`, `theme-picker:close` | — |
| `theme-picker:dtcg-download` | `{ themeId, href }` |
| `vb:a11y-themes-change` (on window; also listened for) | `string[]` of active `a11y-*` ids |
| `vb:extensions-change` (on window; also listened for) | `{ motionFx, sounds }` |

Methods: `open()`, `close()`, `toggle()`; property `isOpen`.

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
Table of contents with scroll-spy, auto-generated from headings or enhancing authored markup.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `levels` | e.g. `h2,h3` | Heading levels to include |
| `scope` | CSS selector | Container to scan (first match; docs layouts use `main article`) |
| `data-title` | string | Summary text and nav `aria-label` (default "On this page") |
| `orientation` | `horizontal` | Inline scrollable bar (summary hidden, nesting flattened) |

| Events | Detail |
|--------|--------|
| `page-toc:navigate` | `{ id }` |

Properties/methods: `.entries` (read-only `{ id, text, level }[]`), `refresh()`.

### `<nav-bar>`
Top-level navigation primitive: keeps `aria-current="page"` on the link that matches the current URL.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `aria-label` | string | Landmark name (put it on the inner `<nav>` when wrapping one) |
| `data-match` | `exact` | Exact pathname only (default: exact wins, longest prefix breaks ties, then DOM order) |
| `data-label-new-tab` | string | SR suffix for external `.items` links (default `(opens in new tab)`) |

Child attributes: `href` (resolved against the base URL; matched by origin + pathname, trailing slash/query/hash ignored; other-origin, non-http(s) and `#` links never match), `data-route` (`.current` target, falls back to `href`), `data-nav-link` (nested mode: when any descendant `<a>` has it, those are the candidates instead of direct `<a>` children).

Landmark: host gets `role="navigation"` unless it contains a `<nav>`.

API: `.items` (get/set `[{ href, label, route?, icon?, external?, badge? }]`; replaces direct `<a>` children, deep-equal no-op; only http(s)/relative hrefs render, others become href-less; in nested mode rendered links get `data-nav-link`), `.current` (get/set; setting takes ownership, survives `.items`), `releaseCurrent()`, `refresh()`.

| Events | Detail |
|--------|--------|
| `nav-bar:upgraded` | — (every connect, incl. reconnect) |
| `nav-bar:items-changed` | `{ items, source: 'property' }` |
| `nav-bar:current-changed` | `{ current, previous, source: 'property' \| 'popstate' \| 'navigation' \| 'pathname' }` |

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
QR code generator (vendored Nayuki qrcodegen, versions 1–40). Black on opaque white with a 4-module quiet zone; children are kept as the caption/no-JS fallback.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `value` | string | Text/URL to encode (falls back to the text content) |
| `size` | number | Box edge in CSS px, quiet zone included (default `200`) |
| `error-correction` | `L`, `M`, `Q`, `H` or `0`–`3` | Error-correction level (default `M`) |
| `color` | CSS colour | Module colour (default `#000`; warns if risky) |
| `background` | CSS colour | Background, always painted (default `#fff`) |
| `data-caption` | `visible` | Show the children under the code (default visually hidden) |
| `data-label-prefix` | string | Canvas accessible name (default "QR code") |
| `data-label-copied` | string | `copy()` announcement (default "QR code copied") |
| `data-error` | (output) `capacity`, `encoding` | Set when no code could be drawn; fires `qr-code:error` |

### `<include-file>`
Same-origin HTML fragment include. Fetched HTML is sanitized unless `trusted`, using the fragment profile (keeps `id`/`name`, safe `style`, popover/command invokers; drops `<style>`, `on*`, form attrs) and inserted as nodes; `include-file:loaded` `detail.html` is the serialised sanitized fragment.

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
Slide-to-confirm action (form-associated).

| Attribute | Values | Description |
|-----------|--------|-------------|
| `label` | string | Track label and handle name (default: the authored text, else "Slide to confirm"; observed) |
| `activated-label` | string | Label and `aria-valuetext` after confirming, announced via a polite status region (default "Confirmed!") |
| `data-label-hint` | string | Screen-reader hint, wired with `aria-describedby` (default "Press Enter to confirm") |
| `attention` | `shimmer`, `pulse` | Attention animation (off under reduced motion) |
| `threshold` | 0-100 | Drag threshold (default 90) |
| `name` / `value` | string | Submits `value` (default `on`) once confirmed |
| `required` | (boolean) | `valueMissing` until confirmed |
| `disabled` | (boolean) | Blocks interaction (a disabled fieldset does too) |

| Events |
|--------|
| `slide-accept:accept`, `slide-accept:reset` |

Confirm by dragging past the threshold, by tapping the handle, or with Enter / Space / End. The handle is `role="slider"` with `aria-valuetext`; after confirming it keeps focus with `aria-disabled="true"`. RTL mirrors the drag, the arrows and the chevron. `.activated` and `reset()`. Output state: `data-activated`, `data-dragging`.

### `<short-cuts>`
Keyboard shortcuts help dialog. Modal `<dialog>` named by its `<h2>` (`aria-labelledby`) with a visible close button; groups are `<section>` + `<h3>` + `<dl>` (action in `<dt>`, `<kbd class="shortcut-kbd">` in `<dd>` with platform glyphs `aria-hidden` and a visually hidden spoken name from `describeKey()`). Sources, rebuilt on every open: the component's own hotkey ("General"), then the `shortcuts` property if set, else the command registry (`[data-command][data-shortcut]`, grouped by `data-command-group`) and the hotkey-action registry (non-`kbd` `[data-hotkey]`, `data-hotkey-label`, `data-hotkey-group` default "Page Actions").

| Attribute | Values | Description |
|-----------|--------|-------------|
| `hotkey` | combo \| `none` | Toggle key (default `shift+?`); `none` unbinds it (WCAG 2.1.4 character-key shortcut). Observed |
| `data-label-title` / `-general` / `-self` / `-close` | string | `Keyboard shortcuts` / `General` / `Show keyboard shortcuts` / `Close` |

Methods: `show()`, `close()`, `toggle()`; getters `open`, `hotkey` (null when off). `shortcuts` get/set `{ [group]: [{ label, shortcut }] } | null` (replaces the registries; re-renders an open dialog). Event: `short-cuts:shortcuts-changed` `{ shortcuts, source }`. Forced colors: dialog border `CanvasText`.

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
Same parsing as `<day-view>`, one column per day. Keyboard: Up/Down walk the day's events in time order (cell siblings included); Left/Right go to the nearest-in-time event of the closest day (visual direction) that has events; Home/End first/last by date then time; Enter/Space activate.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-start-date` | ISO date (default: current week, locale first day) | First day column |
| `data-days` | `1`–`14` (default `7`) | Day columns (invalid → 7) |
| `data-start-hour` | `0`–`23` \| `auto` (default `auto`) | First hour; grows to fit events |
| `data-end-hour` | `0`–`23` (default `19`) | Last hour |
| `data-label-continues` | string | Suffix for a clipped span's accessible name |
| `data-label-time` | string (default `Time`) | Visually hidden corner header text |

Child `calendar-event[data-date]` assigns the day column; events out of range / without a time are hidden after upgrade (kept in the getter). Attribute changes after upgrade rebuild a generated table. Today's header: `aria-current="date"`; headers show a short date (month when the range crosses one) with the full date as hidden text. Grid lines are logical borders (RTL, forced colors). `events` get/set (`{ date?, time, text, category?, duration? }`; date derived from an ISO `time`), `refresh()`. Events: `week-view:event-click`, `week-view:events-changed`.

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

### `<note-wc>`
Owns the private-note panel (`role="dialog"`: quote, textarea, Save/Cancel; notes stored with the highlight in localStorage via the highlights controller). Three modes: inside `<selection-menu>` a "Add private note" button highlights the selection — reusing a highlight only when the selection lies inside its stored offsets — and opens the panel; with `for="id"` a "View notes" button opens the first noted (else first) highlight on the target; without `for` outside a menu it renders **no button** and only hosts the panel. Margin-annotation clicks dispatch `highlights:request-note` `{ id, highlight, controller }` on the target; the first connected note-wc opens its panel.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `for` | ID | Page-level target |
| `data-label-add` / `-view` | string | Button names (`Add private note` / `View notes`) |
| `data-label-dialog` / `-heading` | string | Panel name / visible heading (`Private note`; heading uppercased by CSS) |
| `data-label-placeholder` / `-textarea` | string | Textarea placeholder / name (`Add a note…` / `Note for highlighted text`) |
| `data-label-save` / `-cancel` | string | Action text |

Method: `openFor(highlight, controller, opener?)`. Ctrl/Cmd+Enter saves; Escape anywhere in the panel cancels. On Save/Cancel/Escape/outside click focus returns to the opener if visible, else the highlight's `<mark>`, else the target. A static target gets `data-note-host` (→ `position: relative`) while the panel is open.

### `<selection-menu>`
Floating toolbar for text selections in its targets: `for="id"` (one target; marked `data-selection-menu="<menu id>"` only when the menu has an id, removed on disconnect) and/or every `[data-selection-menu="<id>"]` (MutationObserver, disconnected in teardown; id is `CSS.escape`d). setup() moves the authored children into a generated `<pop-over data-mode="manual" data-selection-menu-host role="toolbar" aria-orientation="horizontal" aria-keyshortcuts="Alt+F10">` — style that node (host is `display: contents`). Opens on pointerup, Shift keyup and a debounced (300 ms) keyboard `selectionchange`; placed above the selection (below for touch), viewport-clamped, repositioned on scroll/resize from the stored range and dismissed once it leaves the viewport. Keys: Alt+F10 focuses the first action (opening the toolbar if needed), ←/→ (mirrored in RTL) / Home / End rove (`tabindex` 0/-1; controls inside nested `[role=group]` etc. keep their own model), Escape (skipped when `defaultPrevented`) closes and, from inside, returns focus to the target (temporary `tabindex=-1`) and re-selects the range; outside pointerdown closes.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `for` | ID | Single target |
| `id` | ID | Many-to-one: `[data-selection-menu="<id>"]` targets |
| `data-label` | string | Toolbar name (`Text selection actions`) |

Methods: `getSelection()` → `{ range, text, target } | null`, `dismiss()` (focus inside returns to the target). `actions` get/set `{ tag, attrs?, html? }[]` (or elements). Events: `selection-menu:select` `{ range, text, target }` (once per distinct selection), `selection-menu:dismiss`, `selection-menu:actions-changed` `{ actions, source }`. Children: `highlight-wc`, `share-wc`, `note-wc`, `comment-wc` (each detects `closest('selection-menu')`).

### `<share-wc>`
Three tiers (`data-tier-resolved` = `native|platforms|hidden|selection`): native single button (visible `label` is its name — no aria-label; a non-abort `navigator.share` failure fires `share-wc:error` then copies the link), platform buttons in `<nav aria-label>` (`button[data-platform]`, names "Share on {platform}"; copy named by its visible label), or enhanced slotted `a[data-platform]` / `button[data-platform="copy"]` whose `{url}`/`{title}`/`{text}` href templates are kept and re-substituted when properties change. Inside `<selection-menu>`: one icon button that shares (or copies, announced via a document-level `role=status`) `"quote" — <url>#:~:text=…` using the resolved URL, then dismisses the menu. URL: property → `url` → canonical → `location.href`; title: `shareTitle` → `title` → `og:title` → `document.title`; text: property → `text` → meta description → `og:description`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `url` / `title` / `text` | string | Share data |
| `platforms` | list \| `native-only` | x, twitter, facebook, linkedin, whatsapp, telegram, bluesky, mastodon, email, copy |
| `tier` | `native` \| `platforms` | Force a tier |
| `variant` | `icon` \| `label` \| `icon-label` | `icon` keeps labels visually hidden (still the name) |
| `size` | `s` \| `m` \| `l` | Button size |
| `label` | string | Native button text (`Share`) |
| `color` | boolean | Brand colour on border + icon only (label stays `--color-text`) |
| `mastodon-instance` | host | Default `mastodon.social` |
| `data-label-share-page` / `-share-on` / `-copy` / `-copied` / `-link-copied` / `-share-selection` / `-selection-copied` | string | `Share this page` / `Share on {platform}` / `Copy link` / `Copied!` / `Link copied to clipboard` / `Share selection` / `Selection copied` |

Properties `url`, `shareTitle` (not `title` — avoids shadowing `HTMLElement.title`), `text`: JS values win over attributes and survive reconnect. `share()` → `Promise<boolean>` (native sheet in the native tier, else copy link). Events: `share-wc:open` / `share-wc:success` `{ platform }`, `share-wc:error` `{ platform, error? }`.

### `<notification-wc>`
| Attribute | Mode | Description |
|-----------|------|-------------|
| `mode` | both | `panel` (default) or `banner` |
| `persist` / `expires` | banner | VBStore key for dismiss state / days until it re-shows |
| `variant` / `position` | banner | `info\|success\|warning\|error` / `top` (sticky) `\|bottom` (fixed); reactive |
| `src` / `poll` | panel | Feed URL or VBService role / poll interval (ms) |
| `toast-new` | panel | Toast new entries (after the first fetch). Value `"#id"` (any selector) targets a specific `<toast-msg>`; bare / no match = first `<toast-msg>` in the document |
| `storage-key` | panel | VBStore namespace for read ids (default `notifications`) |
| `data-label-*` | panel | `trigger`, `unread` (`{n} unread`), `title`, `mark-all`, `tabs`, `all`, `watching`, `empty`, `watch-empty`, `last-checked` (`{date}`), `never`, `changed`, `unwatch` (`{title}`), `new` |

Children: `<article data-id data-type="update|alert|watch|system|message|stewardship" data-date>` (heading = title, first `<p>` = body, first `<a>` = url); `<button data-trigger>` replaces the minted bell; banner dismiss = `[value="dismiss"]` or `[data-dismiss]`. `.notifications` get/set `{ id, title, body?, date?, type?, url?, dismissed? }[]` (feed shape; merges over articles by id). Row/watch links render only for http(s)/relative URLs. Dates via `Intl.DateTimeFormat` in the element's `lang` (date-only values in UTC).

| Events | Detail |
|--------|--------|
| `notification-wc:new` | `{ notification }` |
| `notification-wc:read` | `{ id }` |
| `notification-wc:dismiss` | `{ id }` (persist key) |
| `notification-wc:open` / `:close` | — |
| `notification-wc:notifications-changed` | `{ notifications, source: 'property' }` |
| `page-watch:remove` | `{ url, subscriptionId }` (Unwatch in the Watching tab) |

Panels also listen on `document` for `notification-wc:new` `{ notification }` dispatched by other scripts (page-watch's "content changed" notice) and add it to the list, deduped by `id`.

A11y: trigger name carries the count ("Notifications, 3 unread"; badge `aria-hidden`); opening focuses the dialog; Escape / tabbing out / outside click close (focus back to the trigger when it was inside); All/Watching is a full tabs pattern (tablist, `aria-controls`, tabpanels, arrows/Home/End, roving tabindex); forced-colors borders on badge, selected tab, unread rows. No-JS (`scripting: none`): banner and articles render as plain content.

### `<watch-wc>`
One-tag wrapper for the `[data-watch-page]` toggle (`aria-pressed`). Repaints label/icon/title from `aria-pressed`, which page-watch-init keeps in sync (load, click, any `page-watch:add/remove`, the bell's unwatch). Authored children = no-JS fallback, hidden after upgrade.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `variant` | `icon` (default) \| `compact` \| `button` | icon is named by `aria-label`; text variants by their visible text |
| `label` | string | Constant text for compact/button in both states |
| `server-sync` | boolean | Page-global server sync (sets `window.vbPageWatch.serverSync`) |
| `data-label-watch` / `data-label-watching` | string | Text when not watching / watching |
| `data-label-action` / `data-label-stop` | string | Icon variant name + tooltip / tooltip while watching |

Events (bubble from the inner button): `page-watch:add` `{ entry }`, `page-watch:remove` `{ url, subscriptionId }`. Watches keyed by normalised path (`/x` = `/x/` = `/x/index.html`).

### `<poll-wc>`
Voting + live results; presentational (emits `poll-wc:vote`, author calls `setCount` after the server confirms). Children: `<span slot="question">` + `<button data-option data-count [data-mine]>` (label markup kept), **or** a native `<form><fieldset><legend>` of `<input type="radio|checkbox" value data-count [checked]>` in `<label>`s (no-JS fallback; enhanced into buttons: legend → question, checkbox → `data-multi`, `fieldset[disabled]` → `data-closed`, submit/`<output>` dropped).

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-multi` | boolean | Checkbox group (each option a Tab stop) instead of radio group (roving tabindex; arrows move focus **and** vote, Left/Right flipped in RTL) |
| `data-closed` | boolean | Results only; total reads "N votes · closed" (DOM text). `open()` / `close()`; fires `poll-wc:closed-change` `{ closed }` |
| `data-hide-counts` | boolean | Hides counts, percentages and bars — visually and from the accessible name |
| `disabled` | boolean | Observed; `aria-disabled` on options, dimmed |
| `aria-label` | string | Group name when there is no question; moved onto `.poll-options` (fallback `data-label-poll`, "Poll") |
| `data-label-*` | string | `vote` / `votes` (picked with `Intl.PluralRules`), `your-choice`, `closed`, `poll` |
| `data-pending` (option, output) | boolean | Vote in flight; group gets `aria-busy`; clicks ignored (whole poll in single, that option in multi) until `setCount` / `setCounts` |

Each option shows "count · percent" (`Intl.NumberFormat`, nearest `lang`); accessible name "Label, 33 votes, 60%, your choice". Event `poll-wc:vote` `{ option, action: 'add'|'remove', count, mine }` (single-choice switch = remove then add). API: `setCount(option, count, { mine })` (also the rollback path), `setCounts(counts, { mine })`, `totalVotes`, `myVotes`. De-dupe and persistence are the author's server's job. Forced colors: bars become a `Highlight` strip, own choice gets a 3px border.

### `<popularity-index>`
Most-visited list from `/api/analytics/popular` (Pages Function over D1 `page.view` hits; `?window=24h|7d|30d&limit=1-50&site=`, returns `{ ok, site, window, pages: [{ url, views }] }`) or any `{ pages: [{ url, title?, views }] }` / array endpoint.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `analytics-src` | URL | Endpoint (default `/api/analytics/popular`) |
| `window` | string | Forwarded as `?window=` |
| `limit` | number | Max entries (default 10, min 1) |
| `data-meta-src` / `data-lens-src` | URL | pages.json for missing `title` + `provenance` chip (fetched in parallel; lens-src is the fallback) |
| `data-heading-level` | 0–6 | Heading level (default 2); `0` = no heading |
| `data-label-*` | string | `heading`, `view` / `views` (`Intl.PluralRules`), `unavailable`, `empty` |
| `data-state` (output) | `loading\|ready\|empty\|unavailable` | `aria-busy` while loading; `data-error` (output) holds the internal reason, never rendered |

All listed attributes are observed: changes re-fetch (coalesced), the previous request is aborted, stale/after-removal responses are ignored. Links: http(s) or same-origin paths only (`javascript:`, `data:`, `//host` dropped); list built with DOM APIs; counts via compact `Intl.NumberFormat`. Event `popularity-index:state` `{ state }`.

### `<reaction-bar>`
Emoji reactions for a comment, post or message. The component is presentational: it emits `reaction-bar:toggle`, and the author calls `setCount` once the server confirms. Children: `<button data-reaction data-count [data-mine] [data-label]>` chips (decorated with an emoji span, a count span, `aria-pressed` and a derived `aria-label`), and a `<template data-palette>` of `<button data-reaction [data-label]>` options. The palette is cloned into a `<pop-over role="dialog">` once, at upgrade. A trigger button (`😀`) is auto-rendered at the end of the bar.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `aria-label` | string | Toolbar name (fallback `data-label-toolbar`, then "Reactions"); also names the palette group |
| `data-trigger-icon` / `data-trigger-label` | string | Trigger content (default `😀`) / its `aria-label` (default "Add reaction") |
| `data-label-dialog` | string | Palette dialog label (default "Choose a reaction") |
| `data-label-count-{one\|other\|…}` | string | Count phrase in chip names, picked with `Intl.PluralRules` (any CLDR category; `-other` is the fallback); `{count}` is replaced by the `Intl.NumberFormat` count (nearest `lang`). Defaults "{count} reaction" / "{count} reactions" |
| `data-disabled` | boolean | Observed. Chips get `aria-disabled` and stay focusable but don't toggle; the trigger is disabled and leaves the roving order; an open palette closes |
| `data-label` (chip / palette button) | string | Accessible name of the reaction ("Thumbs up"); an authored `aria-label` also works. Falls back to the emoji. `setCount` clones new chips from the palette button, so they keep it |
| `data-pending` (chip, output) | boolean | Toggle in flight (also `aria-busy="true"`); further clicks on that chip, or palette picks of a chip-less reaction, are ignored until `setCount` |

Chip name: "Thumbs up, 3 reactions". Own state is only `aria-pressed`, with no "you reacted" suffix. Event `reaction-bar:toggle` `{ reaction, action: 'add'|'remove', count, mine }`, where `count`/`mine` are the pre-toggle values. Also `reaction-bar:palette-open` / `-close`. API: `setCount(reaction, count, { mine })` (clears pending; creates a missing chip; count 0 removes the chip and moves focus to a neighbour; also the rollback path), `openPalette()` (no-op while disabled), `closePalette()`. Keyboard: the toolbar uses a roving tabindex. Left/Right are mirrored in RTL, Home/End jump to the ends, and `setCount` keeps the current position. Opening the palette focuses its first option. In the palette, arrows (Up/Down too) move between options and Escape closes. After a pick, focus returns to the trigger. Forced colors: a pressed chip is painted `Highlight`/`HighlightText`. Every listener is re-wired on reconnect, and the built DOM is never duplicated.

### `<recently-visited>`
Device-local reader history from `localStorage`. Nothing is sent to a server. The tracker (`src/utils/recently-visited-init.js`, included in every bundle) records a page only when it has `<meta name="vb:track-history" content="on">` (put this in the site head) or contains `<recently-visited>`. It never records under `<html data-vb-no-track>`, under `<meta name="vb:no-track-history">`, or while paused. Query strings are stripped unless listed in `<meta name="vb:track-history-params" content="q page">`. Entries expire after 30 days (pruned on every read and write); the cap is 100 entries; only same-origin http(s) paths are kept (a leading `//` is collapsed).

| Attribute | Values | Description |
|-----------|--------|-------------|
| `limit` | number | Page groups shown (default 25) |
| `include-current` | boolean | Also list the page the reader is on |
| `data-heading-level` | 0–6 | Heading level (default 2); `0` = no heading |
| `data-label-*` | string | `heading`, `explainer`, `pause`, `anchors`, `clear`, `empty`, `anchor-one` / `anchor-other` (`Intl.PluralRules`) |

Storage keys: `vb:recently-visited` (`[{ url, hash, title, hashTitle, ts }]`), `vb:recently-visited:paused` and `vb:recently-visited:show-anchors` (both `"1"` when set). The controls have fixed labels; the toggles carry their state in `aria-pressed` and Clear uses `aria-disabled`. Controls are updated in place, so focus is kept. Times are `<time datetime>` formatted with `Intl.RelativeTimeFormat` (nearest `lang`). All instances re-render on `storage` and on the tracker's same-tab `recently-visited:change` event (on `window`). Events: `recently-visited:clear`, `recently-visited:pause-toggle` `{ paused }`, `recently-visited:anchors-toggle` `{ showAnchors }`.

### `<version-switcher>`
| Attribute | Description |
|-----------|-------------|
| `data-versions` | Inline JSON entries `{ id, label?, url?, date?, author?, summary?, archived?, draft?, current?, versionUrl? }` (or `<script type="application/json" data-versions>` child) |
| `data-src` | Manifest URL; fallback `<meta name="vb:versions-manifest">` |
| `data-mode` | `releases` \| `history` (derived: distinct urls → releases); observed, sets heading |
| `data-action` | `navigate` (default) \| `swap` \| `diff` |
| `data-versioned-region` | Selector for the swap/diff region (default `[data-versioned], main`) |
| `data-diff-position` | `before` (default) \| `after` |
| `data-banner` | Archived notice when current is archived and a non-archived latest exists |
| `data-page-info-target` | `<page-info>` id: mount the list as a panel section (trigger hidden; section removed on disconnect) |
| `aria-label` | What is picked; names the trigger ("API version: v2.1") and picker — not applied to the host |
| `data-label-*` | `trigger`, `loading`, `loading-versions`, `empty`, `heading-releases`, `heading-history`, `archived`, `draft`, `current`, `by` (`{author}`), `changelog`, `changelog-for` (`{version}`), `banner-label`, `banner` (`{version}`), `banner-latest` (`{version}`), `diff` (`{from}`, `{to}`) |

Security: entry `url` checked with `isDangerousUrl` (javascript:/vbscript:/data: entry dropped, error event); unsafe `versionUrl` drops the changelog link; banner latest is a link only for a safe url. `swap`/`diff` fetch same-origin URLs only; swapped region inserted via `sanitizeToFragment` (fragment profile — no live `on*`). Untrusted sanitizer strips `data-versions`/`data-src` from custom elements. Navigate to the current page URL (history entries sharing one url) is a no-op + `version-switcher:error`; give revisions distinct URLs (`?rev=`). Swap updates `<meta itemprop="version">`; its crossfade timing is scoped to the `version-swap` view-transition type.

A11y: entry `<li>` = button (label + badges + date = its name, `aria-current`) + sibling author/summary (`aria-describedby`) + sibling changelog link (never nested in the button); heading follows mode; banner = labelled `<aside>` with a `role="status"` line filled after insertion. Dates via `Intl.RelativeTimeFormat` / `Intl.DateTimeFormat` with the nearest `[lang]` (date-only in UTC). Events: `version-switcher:open` / `:close` / `:select {entry}` / `:before-navigate` / `:before-swap` / `:swap {entry, previousId}` / `:before-diff` / `:diff {entry, previousId, diffElement, opCount}` / `:error {message, entry?, error?}`. Methods: `openPicker()`, `closePicker()`, `switchTo(id)`, `refresh()`; props `versions`, `currentId`.

---

## 5. Layout System

### `data-layout` Attribute Values

Apply `data-layout="value"` on any element. Layouts with an element twin are defined once in `src/custom-elements/layout-<name>/styles.css` as `:is(layout-x, [data-layout="x"])`; the attribute-only layouts live in `src/custom-elements/layout-attributes.css`. Generated reference (values, every modifier per layout, defaults): `/docs/attributes/data-layout/` (from `site/data/layoutReference.js`; `tests/unit/layout-reference-drift.test.js` keeps this table in step with the CSS).

| Value | Element twin | Description |
|-------|--------------|-------------|
| `stack` | `<layout-stack>` | Vertical flex with gap |
| `cluster` | `<layout-cluster>` | Horizontal flex with wrap |
| `grid` | `<layout-grid>` | Auto-fit responsive grid |
| `center` | `<layout-center>` | Centered with max-width and gutters |
| `cover` | `<layout-cover>` | Minimum block size with a vertically centered principal |
| `sidebar` | `<layout-sidebar>` | Sidebar beside content; wraps on container width |
| `switcher` | `<layout-switcher>` | Row ↔ column below a threshold of the switcher's own width |
| `reel` | `<layout-reel>` | Horizontal scroll |
| `columns` | `<layout-columns>` | Multi-column reading flow |
| `prose` | `<layout-text>` | Reading measure + vertical rhythm (there is no `data-layout="text"`) |
| `split` | — | Two columns at a ratio (default 1:1, gap `xl`, align center); stacks below 48rem viewport |
| `media` | — | Figure (`figure`/`img`/`picture`/`video`/`[slot="figure"]`) beside content (default gap `m`, align start). Every other child takes its own row in the content column; the figure spans them. Stacks (figure on top) in containers < 25rem |
| `regions` | — | Flex column: header region (`header`/`[slot="header"]`) first, footer region (`footer`/`[slot="footer"]`) last, every other child between in DOM order (gap 0). `section`/`[slot="content"]` grows; with no section the footer is pinned to the bottom |
| `page-stack` | — | 100dvh column, direct `main` grows (sticky footer); no modifiers |
| `sidebar-left` | — | `main` only: nav beside article (16rem, gap `m`); below 48rem viewport stacks article → aside → nav |
| `sidebar-right` | — | `main` only: aside beside article; same defaults and collapse as `sidebar-left` |

No `data-layout` form: `<layout-imposter>`, `<layout-card>`, `<layout-badge>` (element only); `<layout-canvas>` → `[data-canvas]`. Page templates (holy-grail, dashboard, app-shell, sidebar, article, landing) are `data-page-layout` values only — `data-layout="holy-grail"` and `data-layout="dashboard"` were removed.

### `data-page-layout` Values (on `<body>`)

| Value | Description |
|-------|-------------|
| `stack` | Simple vertical stack (also the bare `data-page-layout` default) |
| `sidebar-left` | Left sidebar layout |
| `sidebar-right` | Right sidebar layout |
| `holy-grail` | Three-column holy grail |
| `app-shell` | App shell with sidebar |
| `dashboard` | Header over a nav + main. Nav column sized to content unless `data-layout-sidebar-width` / `data-sidebar="collapsed"` is set. Below 48rem the nav is an off-canvas drawer, `visibility: hidden` until opened by `data-nav-open` on the host or as a native popover (`<nav id popover>` + `<button popovertarget data-nav-toggle>`) |
| `article` | Article/reading layout |
| `landing` | Landing page layout (defines the `hero`, `feature`, `cta` areas) |

The old `data-layout="body-*"` spellings of these templates were removed (tfcw).

Templates (`--tpl-*`) and `--_sidebar-width` / `--_sidebar-collapsed` are declared on the layout host (`:where([data-page-layout])`, zero specificity), not `:root`: override them on the host. `--sidebar-collapsed` defaults to 4rem. Works on any element, not only `<body>` (only the 87.5rem cap is `body`-scoped). A missing nav/aside, or `data-sidebar="hidden"`, drops that column from the template. `nav` is a `region-nav` size container only where its column has a definite width (bare/stack, sidebar-left, holy-grail, landing, dashboard with a width modifier or collapsed); not in app-shell, default dashboard or `nav.bottom`. `data-layout-order` does not apply to page-layout children (they are placed by area).

### Layout Modifier Attributes

Modifiers are per layout: a modifier on a layout that does not read it has no effect, and value sets differ by layout. Full per-layout meanings: `/docs/attributes/data-layout/#modifiers`.

| Attribute | Values | Layouts | Description |
|-----------|--------|---------|-------------|
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl`; center also bare (= `m`) | stack, cluster, grid, center, cover, sidebar, switcher, reel, split, media, regions, `main` sidebar-left/right, `data-page-layout` | Gap. Defaults: cluster `s`, cover `none`, split `xl`, regions `none`, center none until set, others `m` |
| `data-layout-align` | `start`, `center`, `end`, `stretch`; cluster also `baseline`; columns only `justify` | stack, cluster, reel, split, media, columns | Cross-axis alignment (columns: justified text) |
| `data-layout-justify` | `start`, `end`, `center`, `between` | cluster | Main-axis distribution |
| `data-layout-padding` | `none`, `s`, `m`, `l`, `xl` (reel: up to `l`) | cover, reel | Padding on all sides |
| `data-layout-min` | grid: `xs`–`xl`; cover: `s`–`xl`, `auto` | grid, cover | Grid: min column width; cover: min block size. One-off: `style="--layout-min: …"` |
| `data-layout-max` | `narrow`, `normal`, `wide`; center also `prose` | center, columns, prose | center: 40/60/80rem (prose 65ch); columns/prose: 45/65/80ch measure |
| `data-layout-measure` | `narrow`, `normal`, `wide` | columns, prose | Line measure (same as `-max` there) |
| `data-layout-centered` | (boolean) | cover, prose, columns (no effect) | Center horizontally |
| `data-layout-nowrap` | (boolean) | cluster, sidebar, split, `main` sidebar-left/right, `data-page-layout` | Don't wrap / don't collapse below the breakpoint |
| `data-layout-overlap` | (bare = `s`), `xs`, `s`, `m`, `l` | cluster | Overlapping items (avatar groups) |
| `data-layout-intrinsic`, `data-layout-text` | (boolean) | center | Intrinsic centering; centered text |
| `data-layout-gutter` | `none`, `s`, `l` | center | Inline padding (default `m`) |
| `data-layout-subgrid` | (bare = `3`), `2`, `3`, `4` | grid | Children become row subgrids |
| `data-layout-item-width` | `auto`, `s`, `m`, `l`, `xl`, `full` | reel | Item width |
| `data-layout-scrollbar` | (boolean) | reel | Show the scrollbar |
| `data-layout-side` | `end` | sidebar | Sidebar on the end side |
| `data-layout-sidebar-width` | `narrow`, `normal`, `wide` | sidebar, `main` sidebar-left/right, `data-page-layout` | 12 / 16 / 20rem |
| `data-layout-content-min` | `s`, `m`, `l` | sidebar | Content floor before wrapping (40/50/60%) |
| `data-layout-threshold` | `s`, `m`, `l` | switcher | Switch width (25/30/40rem) |
| `data-layout-limit` | `2`, `3`, `4` | switcher | Column layout above N items |
| `data-layout-reverse` | (boolean) | switcher, media | Visual reverse (DOM/focus order unchanged) |
| `data-layout-column-count` | `1`, `2`, `3`, `auto` | columns | Column count |
| `data-layout-ratio` | `2:1`, `1:2`, `3:1`, `1:3`, `golden` | split only | Column ratio |
| `data-layout-fill` | (boolean) | split only | `min-block-size: 100dvh` |
| `data-layout-fixed`, `data-layout-contain` | (boolean) | `<layout-imposter>` (element only) | Viewport positioning; cap to containing block |
| `data-layout-position` | `center`, `top`, `bottom`, `start`, `end`, `top-start`, `top-end`, `bottom-start`, `bottom-end` | `<layout-imposter>` | Placement |
| `data-layout-margin` | `s`, `m`, `l`, `xl` | `<layout-imposter>` | Inset from the edges |
| `data-layout-principal`, `data-layout-cover-top`, `data-layout-cover-bottom` | (boolean, on child) | cover children | Centered principal; pinned top / bottom |
| `data-layout-sticky` | (boolean, on child) | `nav`/`aside` of sidebar; `header`/`nav`/`aside` of `data-page-layout` | Sticky with own scroll; requires `<html data-sticky>` |
| `data-layout-bleed` | (boolean, on child) | direct children of `data-page-layout` only | `grid-column: 1 / -1`. In reading containers use `data-bleed` |
| `data-layout-area` | `hero`, `feature`, `cta` | direct children of `data-page-layout="landing"` | Named grid area. No other template defines extra areas (an unknown area name creates an implicit zero-width track); with your own `grid-template-areas`, set `grid-area` directly |
| `data-layout-order` | `-1`, `1`, `99` | children of flex / auto-placed grid layouts | `order`; no effect on area-placed children (`data-page-layout`, `main` sidebar-*) or on the header/footer of regions (pinned first/last); visual only |
| `data-layout-density` | `compact`, `spacious` | any element (utility, not a layout modifier) | Re-tokens the spacing scale for a subtree as `--size-unit` multiples (rem: follows root font size, `data-fluid`, large-text) — compact 3xs–3xl = 0.0625/0.125/0.25/0.5/0.75/1/1.5/2/3rem, spacious = 0.25/0.5/0.75/1/1.5/2/3/4/6rem. Not `data-density` (table/dl/nav.tree padding); see `/docs/attributes/data-layout-density/` |

Layout utilities without the `data-layout-` prefix:

| Attribute | Values | Applies to | Description |
|-----------|--------|------------|-------------|
| `data-container` | (bare), `card`, `panel`, `media` | any element | `container-type: inline-size` (+ container name). Escape hatch for `main`/`article`/`section`/`aside` children of cluster, reel, centered cover, start/center/end stack and `data-layout-subgrid` grids, which drop `container-type`, and for text hosts with a `data-bleed` child. Page: `/docs/attributes/data-container/` |
| `data-bleed` | (boolean, on child) | direct children of prose/`<layout-text>`, columns/`<layout-columns>`, `article[data-measure]`; `section.hero` | Break out to the nearest query container's width (`100cqi`); on `section.hero`, background behind a transparent header |
| `data-measure` | (bare = normal), `narrow`, `wide` | `article` | Reading width only, no rhythm |
| `data-scroll-hint` | (bare), `start` | reel | Edge fades hinting at overflow |
| `data-canvas` | (bare), `flush`, `elevated` | any element | Attribute form of `<layout-canvas>`; page: `/docs/attributes/data-canvas/` |

Modifiers apply only to the element they are on: layout private custom properties are reset on every layout host, so a nested layout never inherits an outer layout's gap/min/threshold/measure/padding/align tokens. Custom-property one-offs via inline `style` (`--layout-min`, `--layout-threshold`, `--layout-content-min`) are endorsed on every layout, cover included.

### Page-Level State Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-sidebar` | `collapsed`, `hidden` | On a `data-page-layout` host: `collapsed` = sidebar columns at `--sidebar-collapsed` (default 4rem); `hidden` = nav hidden and its column dropped |
| `data-nav-open` | (boolean) | On a `data-page-layout="dashboard"` host: opens the nav drawer below 48rem (alternative: native `popover` nav). A script toggle must also close on Escape and outside tap |
| `data-nav-toggle` | (boolean) | Marks the drawer toggle button inside a `data-page-layout="dashboard"`; hidden at 48rem+ and with `data-layout-nowrap` |

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
| `[data-requires-js]` | Hidden (`display: none !important`) under `@media (scripting: none)`: JS-only controls with no static equivalent |
| `[data-js-enhanced]` | Hidden (`display: none`, overridable) under `@media (scripting: none)`: JS-driven internals of components with a static fallback |

---

## 8. JS Enhancers (Data-Attribute Behaviors)

These `data-*` attributes add progressive JS behaviors. Import via `vanilla-breeze.js`.

### Form Enhancers

| Attribute | Element | Description |
|-----------|---------|-------------|
| `data-switch` | `<input type="checkbox">` | Toggle switch UI (`sm`, `lg` sizes) |
| `data-grow` | `<textarea>` | Auto-expanding textarea: CSS `field-sizing: content`, starts at `rows` (default 2), `data-max-rows` caps then scrolls; JS fallback marks `data-grow-init="fallback"`. Re-measures on input/change/form reset |
| `data-count` | `<textarea>` | Character/word counter. Limit from native `maxlength` (characters) or `data-maxwords` (words, advisory — no validity). Text: `data-label-limit[-<plural>]` (`{count} of {max} characters`), `data-label-characters[-<plural>]`, `data-label-words[-<plural>]`; `Intl` numbers for nearest `[lang]`. Recounts on form reset; dispatch `input` after setting `.value` |
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
| `data-label-restored` | `<form data-autosave>` | Text of the "Draft restored" toast (shown via the first `<toast-msg>`, created if absent) |
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
| `data-format-date` | `<time>` | Locale-aware date formatting (`short`/`medium`/`long`/`full`/`relative`; `data-format-time`, `data-locale`). Date-only `datetime` (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`) formats in UTC at its own precision. Locale: `data-locale` → nearest `[lang]` → `<html lang>` → browser. Original text → `title` |
| `data-relative` | `<time>` | Past-only "3 days ago" text, 60s refresh, English unless nearest `[lang]` is non-English (Intl). Used by activity-feed, comment-thread, time-index. Prefer `data-format-date="relative"` for new content |
| `data-format-bytes` | `<data>` | Byte size formatting (value = precision; `data-unit="decimal"` for ÷1000) |
| `data-animate-image` | `<img>` | Play/pause for animated images |
| `data-command` | `<button>` | Command palette trigger |
| `data-paged` | list-shaped container (`ul`/`ol`/`table`/`card-list`…) | Pagination: `data-paged-size` (10; 0 = off), `data-paged-page`, `data-paged-style` `numbered`\|`prev-next`\|`load-more`\|`infinite`, `data-paged-window` (2), `data-paged-controls` `before`\|`after`\|`both`\|`none` (none also drops the load-more button), `data-paged-url` (History API; back/forward re-render, no param = page 1); events in `paged:goto` `{ page }`, `paged:loadmore`; out `paged:change` `{ page, size, total, totalPages, visible, style }` (bubbles). Drive from elsewhere with `<pager-wc>` |
| `data-sortable` | `<table>` or list-shaped container | Client-side sort. Table: `th[data-sort="key"]` (+ `data-sort-type` `text`\|`number`\|`date`) gets a `<button data-sort-button>` (th keeps columnheader role + `aria-sort`), cycles asc→desc→none; cell value from `data-sort-value`/`data-value`, `<time datetime>`, text. Lists: external `[data-sort-target]` select/button, items `data-sort-{key}`. `data-sortable-default`; reflects `data-sort-by`/`data-sort-direction`; event `sort:change` `{ key, direction, total }`; composes with `data-paged` |

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
| `data-sticky` | (boolean) | Sticky coordination: StickyManager marks the banner header sticky and measures it into `--sticky-offset`; enables `data-layout-sticky` sidebars; header un-sticks below 48rem. (`header`/`footer[data-sticky]` stick on their own without it.) |
| `data-scrollbar` | `hidden`, `auto`, `primary`, `minimal` | Scrollbar styling (also any scroller) |
| `data-motion-reduced` | (boolean) | User-toggled motion reduction: `--duration-*` → 0ms, smooth scroll off, view transitions/effects off |
| `data-ruby` | `show`, `hide`, `auto` | Ruby visibility. Absent = visible (browser default). Works on any element (also the `<ruby>`); nearest wins. `hide` = visually hidden, kept in the a11y tree; `auto` = hide annotations whose own `:lang()` is not ja/zh/ko/yue/wuu; `show` undoes an outer hide/auto |
| `data-debug` | (boolean) | Debug mode (needs vanilla-breeze-dev.css/.js) |
| `data-wireframe` | `lo`, `mid`, `hi`, `annotate` | Wireframe mode (needs vanilla-breeze-dev.css) |

---

## 10. Provenance & Authorship Surface

VB ships a stack-agnostic content-provenance contract. Any HTML page that emits the tags below lights up VB's `<page-info>`, `<change-set>`, and lens components. The contract is authoritative in `admin/specs/meta-tag-contract-v1.md` (v1.1, stable; v1.1 replaced `vb:topic` with repeated `<meta name="concept">` tags). Canonicalization rules for signing live in `admin/specs/canonical-document-v1.md`.

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
| `<meta name="concept">` (repeated) | SKOS concept IDs from `vocabulary.json` — shared with analytics (replaced `vb:topic` in contract v1.1) |
| `<meta name="vb:version-url">` | Link to changelog anchor for this page's version |
| `<meta name="vb:track-history" content="on">` | Opt the page in to `<recently-visited>` history tracking (put it in the site head) |
| `<meta name="vb:track-history-params">` | Space- or comma-separated query parameters that history tracking keeps (all others are stripped) |
| `<meta name="vb:no-track-history">` | Per-page opt-out from history tracking (beats `vb:track-history`) |

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
| `data-trust` | **Verification tier** (badge-only) | `undeclared`, `declared`, `verified`, `failed`, `key-unavailable` (the component also appends visible tier text in `.page-info-tier`; `domain-anchored` was never set by the runtime and is removed) |

**Critical distinction:** `data-provenance` is an author claim about *how content was made*. `data-trust` is a *runtime computation* by `<page-info>` and is reserved for the verification badge. Authorship is never `data-trust`.

**Page-level defaults** can go on `<html data-provenance="…" data-status="…">`. Section-level declarations override.

### Consumers in VB

| Component | Reads |
|---|---|
| `<page-info>` | All of Sections A, B, and the canonical-document hash/signature for live verification |
| `<change-set>` | `data-author`, `data-provenance` on `<ins>`/`<del>` blocks |
| `<site-index>` | Nothing automatically — the index is hand-authored markup or `src` JSON; a site may generate that JSON from `<meta name="keywords">`, `article:tag` or `<meta name="concept">`, but the component does not read meta tags |
| `<time-index>` | `<meta name="last-modified">`, `itemprop="version"`, `vb:version-url` |
| `<trust-filter>` / `<topic-map>` | `vb:provenance`, `vb:review`, `vb:status`, `vb:signature` presence (as pages.json `signed` — declared, not verified) / `<meta name="concept">`, aggregated across the site via pages.json |
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
| `data-caption` | `<qr-code>` — `visible` shows the caption |
| `data-center-label` | Pie chart — donut center text |
| `data-collapsed` | Breadcrumb — hide middle items |
| ~~`data-collapsible`~~ | **Removed** — use `collapsible` on `<split-surface>` |
| `data-color` | `<input type="color">` — enhanced picker |
| `data-command` | `<button>` — command palette trigger |
| `data-compact` | Various — reduced spacing |
| `data-completed` | Steps — completed state |
| `data-container` | Any — `container-type: inline-size`; `card`/`panel`/`media` add a container name; escape hatch for sectioning children of cluster/reel/centred cover/aligned stack/subgrid grid and for text hosts with a `data-bleed` child |
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
| `data-error` | `<output>` — error state content; `<qr-code>` — capacity/encoding failure |
| `data-expand-content` | Table row — expandable content |
| `data-face` | `<content-swap>` child — front/back |
| `data-fallback` | `<user-avatar>` child — initials/icon fallback, stacked under the `<img>` |
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
| ~~`data-indicators`~~ | **Removed** — use `indicators` on `<carousel-wc>` |
| `data-info` | Pagination — info text |
| `data-interactive` | Chart legend — clickable toggle |
| `data-items` | `<card-list>` — inline JSON data |
| `data-key` | `<card-list>` — unique key field |
| `data-label` | Table td — mobile card label; `<progress data-type="ring">` — centre label (`none` hides) |
| `data-label-copied` | `<qr-code>` — copy announcement |
| `data-label-prefix` | `<qr-code>` — canvas accessible name |
| `data-label-raw` | `<print-page>` raw-toggle checkbox text |
| `data-label-restored` | `<form data-autosave>` — restored-draft toast text |
| `data-labels` | Chart — show value labels |
| `data-layout` | Any — layout mode (see §5) |
| `data-layout-*` | Layout elements — modifiers (see §5) |
| ~~`data-lazy`~~ | **Removed** — use `lazy` on `<include-file>` |
| `data-legend` | Chart — `inline` legend display |
| `data-legend-position` | Chart — legend position |
| `data-level` | `<page-toc>` generated item depth (output; only used to flatten the horizontal bar — nest `.list` for hierarchy); `<form-field>` password strength |
| `data-loading` | Any — loading state |
| ~~`data-loop`~~ | **Removed** — use `loop` on `<carousel-wc>` |
| `data-mask` | `<input>` — input masking |
| `data-media` | Container — aspect-ratio lock |
| `data-met` | Password rules — requirement met |
| `data-mode` | `<html>` — light/dark mode |
| `data-motion-reduced` | `<html>` — reduce motion |
| `data-name` | Token elements — token name |
| `data-nav-open` | `data-page-layout="dashboard"` host — opens the mobile nav drawer |
| `data-nav-toggle` | Button inside `data-page-layout="dashboard"` — drawer toggle, hidden at 48rem+ |
| `data-next` | Pagination button — next page |
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
| `data-ring` | `<user-avatar>` — decorative ring (kept in overlap groups) |
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
| `data-sort` | Table th — sortable column (`<data-table>`: sort type; `[data-sortable]`: column key) |
| `data-sort-button` | `<th data-sort>` — generated sort button inside the header |
| `data-sort-value` | Table td — custom sort value |
| `data-spoiler` | Any — content concealment |
| `data-stack` | `<brand-mark>` — vertical layout |
| `data-stacked` | Chart — stacked series |
| `data-state` | Feedback container — active state |
| `data-state-expanded` | Table row — expanded |
| `data-state-hidden` | Table row — hidden |
| `data-state-selected` | Table row — selection state |
| `data-status` | Avatar child — online status; content blocks, `<html>` — publication state (see §10) |
| `data-stepper` | Number input — +/- buttons. See [numeric-inputs decision guide](/docs/concepts/numeric-inputs/) for when to reach for [`<stepper-wc>`](/docs/elements/web-components/stepper-wc/) instead. Native spinners are hidden only once upgraded (`[data-stepper-init]`). A plain `type="number"` keeps the browser spinners. |
| `data-sticky` | Table — sticky header/column; `<header>`, `<footer>` — sticky; `<html>` — sticky header system |
| `data-sticky-column` | Table — sticky N columns |
| `data-switch` | Checkbox — toggle switch |
| `data-table-empty` | `<data-table>` — no-results message element (generated) |
| `data-table-filter` | `<data-table>` — filter input container |
| `data-table-scroll` | Focusable, labelled scroll region wrapping a wide table (`block` = also cap height) |
| `data-table-status` | `<data-table>` — visually hidden live region (generated) |
| `data-theme` | `<html>` — active theme |
| ~~`data-ticker`~~ | **Removed** — use `data-effect="ticker"` on `<data>` |
| `data-title` | Various — title text (`<page-toc>`: ToC title / nav label) |
| `data-toggle-tags` | `<fieldset>` — pill chip toggle |
| `data-tooltip` | Chart td — tooltip text |
| `data-trust` | `.page-info-badge` only — verification tier (runtime-computed; see §10) |
| `data-tooltip-position` | Tooltip — position |
| `data-trigger` | Any with `data-effect` — activation trigger. Built-ins: `scroll`, `hover`, `click`, `time:<ms>`, `intersect[:once\|toggle]`, `media:<query>`, `event:<name>`, `vt`. Also `<tool-tip variant="card">` — child that opens the card. |
| `data-stagger` | Parent — child cascade. Empty or CSS time (e.g. `80ms`) → linear; `reverse`, `random`, `grid` → alternate ordering. |
| `data-transition` | Any — View Transition handler. Built-ins: `morph`, `slide`, `fade`, `scale`, `stagger`, `none`, `effect:<class>` (bridges to `data-effect` via `vb:vt-update-done` / `data-trigger="vt"`). |
| `data-effect-active` | Auto-managed — set by `VB.activate(el)` and trigger handlers. Effects gate on it. |
| `data-truncated` | Breadcrumb li — truncate text |
| `data-type` | Chart, `<form-field>`, `<progress>` (`ring`) — type variant |
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
