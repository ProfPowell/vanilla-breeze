# Vanilla Breeze — Syntax Reference

> Definitive catalog of every element, attribute, class, and data-attribute in Vanilla Breeze.
> Machine-readable for LLM code generation. Human-scannable for quick lookup.

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
| `--size-1` … `--size-10` | Numeric aliases | Open Props compatible (0.25rem–5rem) |

Legacy aliases: `--space-unit`, `--space-3xs` … `--space-3xl` map to `--size-*`.

### Typography (`src/tokens/typography.css`)

| Property | Value | Description |
|----------|-------|-------------|
| `--font-sans` | system-ui stack | System sans-serif |
| `--font-serif` | Charter stack | Serif fonts |
| `--font-mono` | ui-monospace stack | Monospace fonts |
| `--font-size-xs` | `0.75rem` | 12px |
| `--font-size-sm` | `0.875rem` | 14px |
| `--font-size-md` | `1rem` | 16px (base) |
| `--font-size-lg` | `1.125rem` | 18px |
| `--font-size-xl` | `1.25rem` | 20px |
| `--font-size-2xl` | `1.5rem` | 24px |
| `--font-size-3xl` | `1.875rem` | 30px |
| `--font-size-4xl` | `2.25rem` | 36px |
| `--font-size-5xl` | `3rem` | 48px |
| `--font-size-00` … `--font-size-8` | Numeric aliases | Open Props compatible |
| `--line-height-none` | `1` | No leading |
| `--line-height-tight` | `1.25` | Tight |
| `--line-height-snug` | `1.375` | Snug |
| `--line-height-normal` | `1.5` | Normal |
| `--line-height-relaxed` | `1.625` | Relaxed |
| `--line-height-loose` | `1.75` | Loose |
| `--measure-narrow` | `45ch` | Narrow line length |
| `--measure-normal` | `65ch` | Standard line length |
| `--measure-wide` | `80ch` | Wide line length |
| `--font-weight-light` | `300` | Light |
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
| `--gray-0` … `--gray-9` | Numeric aliases | Open Props compatible |
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
| `--shadow-sm` | Small (3px blur) |
| `--shadow-md` | Medium (6px blur) |
| `--shadow-lg` | Large (15px blur) |
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
| `--motion-hover-glow` | 4px primary glow | Hover glow shadow |
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
| `--gradient-subtle` | 2-color linear gradient |
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
| `--border-roughness` | 0–3 intensity (0=none) |
| `--filter-rough-none/light/medium/heavy` | SVG filter refs |
| `--filter-rough` | Active filter (default none) |
| `--shadow-sketch` | Sketch-style offset shadow |
| `--border-image-sketch` | Wavy border image |
| `--border-image-rough` | Variable dash border |
| `--border-image-marker` | Marker stroke border |

### Themes (`src/tokens/themes/`)

Applied via `data-theme` on `<html>`. Combine with `data-mode="dark"` for dark mode.

| Category | Themes |
|----------|--------|
| **Color** | `ocean`, `forest`, `sunset`, `rose`, `lavender`, `coral`, `slate`, `emerald`, `amber`, `indigo` |
| **Personality** | `modern`, `minimal`, `classic` |
| **Extreme** | `brutalist`, `swiss`, `cyber`, `organic`, `editorial`, `terminal`, `kawaii`, `8bit`, `nes`, `win9x` |
| **Accessibility** | `a11y-high-contrast`, `a11y-large-text`, `a11y-dyslexia` (composable with any theme) |

---

## 2. Native Elements

Styled HTML elements. No JS required. Classes and data-attributes add variants.

### `<h1>` – `<h6>` Headings

Base: font-weight 600, tight line-height, text-wrap balance. Fluid font sizes.

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

### `<input>`, `<textarea>`, `<select>` Form Controls

Base: border, radius, padding, focus ring. Validation via `:user-invalid` and `[aria-invalid="true"]`.

| Selector | Description |
|----------|-------------|
| `input[data-switch]` | Toggle switch (default size) |
| `input[data-switch="sm"]` | Small toggle switch |
| `input[data-switch="lg"]` | Large toggle switch |
| `input[list]` | Datalist dropdown arrow |
| `input[list].no-arrow` | Hide dropdown arrow |
| `input[list].search` | Search icon left-aligned |

### `<form>` Form

| Class | Description |
|-------|-------------|
| `.stacked` | Vertical layout (default) |
| `.inline` | Horizontal flex with wrap |
| `.grid` | Two-column grid |

Related classes:

| Class | Description |
|-------|-------------|
| `.group` | Column flex wrapper |
| `.group.horizontal` | Row flex wrapper |
| `.actions` | Button container (flex) |
| `.actions.end` | Right-aligned buttons |
| `.actions.between` | Space-between buttons |
| `.help` | Small muted helper text |
| `.error` | Red error message |
| `fieldset.minimal` | No border, minimal legend |
| `fieldset.code-inputs` | OTP/verification input layout |

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

### `<details>` / `<summary>` Disclosure

Base: chevron indicator via `::after`, rotation on open. Adjacent `<details>` get joined borders.

### `<dialog>` Dialog

| Data Attribute | Values | Description |
|----------------|--------|-------------|
| `data-size` | `s`, `m`, `l`, `full` | Modal size (24/32/48rem or viewport) |
| `data-position` | `start`, `end`, `top`, `bottom` | Drawer positioning |

Supports nested `<header>`, `<footer>`, `<form>` patterns.

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

Base: monospace font, `<code>` gets background highlight, `<kbd>` gets border + shadow key style.

### `<ul>`, `<ol>` Lists

| Class | Description |
|-------|-------------|
| `.inline` | Horizontal flex, no bullets |
| `.unstyled` | No bullets, no padding |

### `<dl>` Definition List

Base: `<dt>` bold, `<dd>` indented.

### `<hr>` Horizontal Rule

| Class | Description |
|-------|-------------|
| `.decorative` | "• • •" separator |

### `<img>`, `<picture>` Image

| Class | Description |
|-------|-------------|
| `.full` | 100% width |
| `.contain`, `.cover` | Object-fit variants |
| `.rounded` | Border-radius |
| `.circle` | Circular with aspect-ratio 1 |
| `.thumbnail` | Border + background |
| `.ratio-square`, `.ratio-video`, `.ratio-portrait`, `.ratio-landscape` | Aspect ratios |

Broken image: `:not([src])` / `[src=""]` show placeholder. `[loading="lazy"]` gets background.

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

| Class | Description |
|-------|-------------|
| `.full` | Full-width |
| `.fixed` | 400px height |
| `.rounded` | Border-radius |
| `.bordered` | Border |

Wrapper: `.embed-responsive` with `.ratio-16x9`, `.ratio-4x3`, `.ratio-1x1`, `.ratio-21x9`

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
| `.end` | figcaption | Right-align |
| `.hidden` | figcaption | Accessible hiding |

### Content Sectioning

#### `<header>`

| Class | Description |
|-------|-------------|
| `.site` | Top navigation (flex between, bordered) |
| `.page` | Page title (bordered bottom) |
| `.card` | Card header (bordered bottom) |
| `.sticky` | Fixed to top |
| `.transparent` | Absolute overlay |
| `.centered` | Text centered |
| `.compact` | Reduced padding |

#### `<footer>`

| Class | Description |
|-------|-------------|
| `.site` | Full-width site footer |
| `.article` | Article footer (border top) |
| `.card` | Card footer |
| `.minimal` | Centered small text |
| `.columns` | Grid auto-fit columns |
| `.sticky` | Fixed to bottom |

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

| Class | Description |
|-------|-------------|
| `.tight` | Minimal spacing |
| `.spaced` | Normal spacing |
| `.reversed` | Flex column-reverse |
| `.centered` | Text centered |
| `.divided` | Border divider |

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
| `abbr.plain` | abbr | No underline |
| `cite.quoted` | cite | Auto-add quotes |
| `del.diff`, `ins.diff` | del/ins | Diff display |
| `time.relative`, `time.datetime` | time | Time variants |
| `sup.footnote-ref` | sup | Footnote styling |

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

#### `<layout-stack>`
Vertical flex layout with configurable gap.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | Gap between children |
| `data-layout-align` | `start`, `center`, `end`, `stretch` | Cross-axis alignment |

#### `<layout-cluster>`
Horizontal flexbox with wrapping.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-gap` | `xs`, `s`, `m`, `l`, `xl` | Gap between items |
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
| `data-layout-min` | `6rem`…`25rem`, `150px`…`400px` | Minimum column width |
| `data-layout-gap` | `none`, `xs`, `s`, `m`, `l`, `xl` | Gap between items |

#### `<layout-cover>`
Full-height container with centered principal element.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-min` | `50vh`…`100vh`, `100dvh`, `auto` | Minimum height |
| `data-layout-padding` | `none`, `s`, `m`, `l`, `xl` | Padding |
| `data-layout-gap` | `s`, `m`, `l` | Gap between items |
| `data-layout-nospace` | (boolean) | Remove padding |
| `data-layout-centered` | (boolean) | Center items horizontally |

Child attributes: `data-layout-principal`, `data-layout-cover-top`, `data-layout-cover-bottom`

#### `<layout-sidebar>`
Two-column layout (sidebar + content).

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-gap` | `xs`, `s`, `m`, `l`, `xl` | Gap between columns |
| `data-layout-side` | `end` | Sidebar on right |
| `data-layout-sidebar-width` | `narrow`, `normal`, `wide` | Sidebar width |
| `data-layout-content-min` | `40`, `50`, `60` | Min content % |
| `data-layout-nowrap` | (boolean) | Prevent stacking |

#### `<layout-switcher>`
Flexbox that flips horizontal↔vertical based on available space.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-gap` | `none`, `xs`, `s`, `m`, `l`, `xl` | Gap |
| `data-layout-threshold` | `20rem`…`45rem` | Switch threshold |
| `data-layout-limit` | `2`, `3`, `4` | Max items before vertical |
| `data-layout-reverse` | (boolean) | Reverse when stacked |

#### `<layout-reel>`
Horizontal scrolling container with snap.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-gap` | `none`, `xs`, `s`, `m`, `l`, `xl` | Gap |
| `data-layout-padding` | `none`, `s`, `m`, `l` | Container padding |
| `data-layout-item-width` | `auto`, `s`, `m`, `l`, `xl`, `full` | Item width |
| `data-layout-align` | `start`, `center`, `end`, `stretch` | Vertical alignment |
| `data-layout-scrollbar` | (boolean) | Show scrollbar |

#### `<layout-imposter>`
Positioning helper for overlays.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-fixed` | (boolean) | Fixed positioning |
| `data-layout-position` | `center`, `top`, `bottom`, `start`, `end`, `top-start`, `top-end`, `bottom-start`, `bottom-end` | Position |
| `data-layout-margin` | `s`, `m`, `l`, `xl` | Margin from edges |
| `data-layout-contain` | (boolean) | Contain within viewport |

#### `<layout-text>`
Content container with optimal line-length and vertical rhythm. Default max-width: 65ch.

No data attributes — applies typographic spacing rules automatically.

### Card Elements

#### `<layout-card>`

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-variant` | `elevated`, `outlined`, `ghost` | Visual style |
| `data-padding` | `none`, `s`, `m`, `l`, `xl` | Internal padding |
| `data-max` | `narrow`, `content`, `wide` | Max-width constraint |

#### `<semantic-card>`
Card with semantic header/content/footer grid areas.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-variant` | `elevated`, `outlined`, `ghost` | Visual style |
| `data-padding` | `none`, `s`, `l` | Padding preset |

Children: `<header>`, `<section>`, `<footer>` map to grid areas.

### UI Elements

#### `<layout-badge>`

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-size` | `sm`, (default), `lg` | Size |
| `data-color` | `primary`, `success`, `warning`, `error`, `info`, `brand`, `secondary`, `accent` | Color |
| `data-variant` | (default solid), `subtle`, `outlined` | Style variant |
| `data-shape` | `square` (default: pill) | Shape |

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

#### `<form-field>`
Accessible form field wrapper with validation states.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-type` | `checkbox`, `radio` | Enables label flex layout |
| `data-no-icon` | (boolean) | Disable validation icons |
| `data-enhanced` | `otp` | Enhancement type |

Children pattern: `<label>` + `<input>` + `<output class="hint">` + `<output class="error">`

Features: auto-appends `*` to required labels, validation icons, error visibility via `:user-invalid`.

#### `<loading-spinner>`

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-size` | `xs`, `s`, `m`, `l`, `xl` | Size |
| `data-variant` | `primary`, `success`, `warning`, `error` | Color |
| `data-overlay` | (boolean) | Fixed overlay spinner |

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

### `<tabs-wc>`
Accessible tabbed interface. Wraps `<button role="tab">` + `<div role="tabpanel">`.

| Events | Detail |
|--------|--------|
| `tab-change` | `{ index, tab, panel }` |

### `<accordion-wc>`
Enhanced `<details>`/`<summary>` accordion.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-single` | (boolean) | Only one panel open at a time |

| Events | Detail |
|--------|--------|
| `accordion-toggle` | `{ open, summary, details }` |

### `<tooltip-wc>`
Rich tooltip/popover container.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-position` | `top`, `bottom`, `left`, `right` | Position |
| `data-trigger` | `hover`, `click`, `focus` | Trigger mode |
| `data-tooltip-delay` | ms value | Show delay |
| `data-no-flip` | (boolean) | Disable auto-flip |

| Events |
|--------|
| `tooltip-show`, `tooltip-hide` |

### `<dropdown-wc>`
Dropdown menu/popover triggered by a button.

| Events |
|--------|
| `dropdown-open`, `dropdown-close` |

Children: `<button>` trigger + `<menu>` or `<ul>` items.

### `<context-menu>`
Right-click context menu.

| Events | Detail |
|--------|--------|
| `context-menu-open` | — |
| `context-menu-close` | — |
| `context-select` | `{ value, label }` |

Children: `<menu>` with `<button data-command="...">` items.

### `<toast-wc>`
Toast notification container.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-position` | `top-end`, `top-start`, `top-center`, `bottom-end`, `bottom-start`, `bottom-center` | Position |
| `data-max` | number | Max visible toasts |

| Events | Detail |
|--------|--------|
| `toast-show` | `{ message, variant }` |
| `toast-hide` | `{ message, variant }` |

JS API: `document.querySelector('toast-wc').show({ message, variant, duration })`

Toast variants: `data-variant="info|success|warning|error"` on `.toast` child.

### `<search-wc>`
Full-text search overlay with keyboard navigation.

| Events |
|--------|
| `search-wc-open`, `search-wc-close` |

### `<command-wc>` / `<command-group>` / `<command-item>`
Command palette (Cmd+K).

| Events | Detail |
|--------|--------|
| `command-select` | `{ value, label }` |
| `command-open`, `command-close` | — |

### `<table-wc>`
Enhanced data table with sort, filter, pagination, selection.

| Events | Detail |
|--------|--------|
| `table:sort` | `{ column, direction }` |
| `table:filter` | `{ column, value }` |
| `table:expand` | `{ row, expanded }` |
| `table:selection` | `{ selected }` |
| `table:page` | `{ page, pageSize }` |

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
| `carousel-change` | `{ index }` |
| `carousel-play`, `carousel-pause` | — |

### `<flip-card-wc>`
Card with flip animation on click.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-flip` | `hover`, `click` | Trigger mode |
| `data-orientation` | `horizontal`, `vertical` | Flip axis |

| Events | Detail |
|--------|--------|
| `flip-card-flip` | `{ flipped }` |

Children: `[data-face="front"]` + `[data-face="back"]`

### `<comparison-wc>`
Before/after image comparison slider.

| Events | Detail |
|--------|--------|
| `comparison-change` | `{ position }` |

### `<splitter-wc>`
Resizable split panes.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-orientation` | `horizontal`, `vertical` | Split direction |
| `data-collapsible` | (boolean) | Allow panel collapse |
| `data-persist` | (boolean) | Remember size in localStorage |
| `data-min` | px value | Minimum panel size |

| Events | Detail |
|--------|--------|
| `splitter-resize` | `{ sizes }` |
| `splitter-collapse` | `{ panel, collapsed }` |

### `<rating-wc>`
Interactive star rating (form-associated).

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-value` | `0`–`5` | Current value |
| `data-readonly` | (boolean) | Read-only mode |
| `data-size` | `sm`, `lg` | Size |

### `<combobox-wc>`
Form-associated combobox/autocomplete. Single-select by default; add `data-multiple` for multi-select tag mode.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-value` | string | Selected value (single mode) |
| `data-filter` | `startsWith`, `contains` | Filter mode |
| `data-required` | (boolean) | Required validation |
| `data-multiple` | (boolean) | Multi-select tag mode |
| `data-max` | number | Maximum tags (multi mode) |
| `data-allow-custom` | (boolean) | Allow custom entries (multi mode) |

| Events | Detail |
|--------|--------|
| `combobox-change` | `{ value, label }` (single) or `{ values, labels }` (multi) |
| `combobox-open` | — |
| `combobox-close` | — |

Children: `<input>` + `<ul>` with `<li data-value="...">` options.

### `<theme-wc>`
Theme picker UI (mode, theme, extensions).

| Events | Detail |
|--------|--------|
| `theme-wc-open`, `theme-wc-close` | — |
| `extensions-change` (on window) | `{ extension, value }` |

### `<footnotes-wc>` / `<foot-note>`
Sidenote/footnote system.

Children: `<foot-note>` elements with content. Auto-generates numbers and back-references.

### `<heading-links>`
Adds anchor links to headings.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-scope` | CSS selector | Scope to specific container |

| Events | Detail |
|--------|--------|
| `heading-navigate` | `{ id, heading }` |

### `<page-toc>`
Auto-generated table of contents from headings.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-levels` | e.g. `2,3` | Heading levels to include |
| `data-scope` | CSS selector | Container to scan |

| Events | Detail |
|--------|--------|
| `toc-navigate` | `{ id, heading }` |

### `<card-list>`
Data-driven card list from JSON.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `src` | URL | JSON data source |
| `data-items` | JSON string | Inline data |
| `data-key` | string | Unique key field |

| Events | Detail |
|--------|--------|
| `card-list-render` | `{ count }` |

Uses `<template>` child for card layout with `data-field="..."` bindings.

### `<icon-wc>`
SVG icon component.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `name` | string | Icon name (e.g. `arrow-right`) |
| `set` | string | Icon set (default: `lucide`) |
| `size` | `xs`, `sm`, `md`, `lg`, `xl` | Icon size |
| `label` | string | Accessible label |

### `<qr-code>`
QR code generator.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-value` | string | Data to encode |
| `data-size` | number | Canvas size in px |
| `data-error-correction` | `L`, `M`, `Q`, `H` | Error correction level |

### `<html-include-wc>`
HTML fragment include via fetch.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `src` | URL | HTML file to fetch |
| `data-lazy` | (boolean) | Load on viewport entry |

| Events | Detail |
|--------|--------|
| `html-include-load` | `{ src }` |
| `html-include-error` | `{ src, error }` |

### `<geo-map>`
Interactive map component.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `lat` | number | Latitude |
| `lng` | number | Longitude |
| `zoom` | number | Zoom level |
| `marker` | (boolean) | Show center marker |
| `marker-color` | color | Marker color |
| `provider` | `osm`, `carto`, `stamen` | Tile provider |
| `interactive` | (boolean) | Enable pan/zoom |
| `static-only` | (boolean) | Static image only |

| Events | Detail |
|--------|--------|
| `geo-map:ready` | `{ lat, lng, zoom }` |
| `geo-map:move` | `{ lat, lng, zoom }` |
| `geo-map:activate` | — |
| `geo-map:error` | `{ error }` |

### `<slide-accept-wc>`
Slide-to-confirm action.

| Events |
|--------|
| `slide-accept`, `slide-reset` |

### `<shortcuts-wc>`
Keyboard shortcut overlay display.

Reads `data-hotkey` and `data-shortcut` attributes from page elements.

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
| `body-stack` | Simple vertical stack |
| `body-sidebar-left` | Left sidebar layout |
| `body-sidebar-right` | Right sidebar layout |
| `body-holy-grail` | Three-column holy grail |
| `body-app-shell` | App shell with sidebar |
| `body-dashboard` | Dashboard layout |
| `body-article` | Article/reading layout |
| `body-landing` | Landing page layout |

### Shared Layout Modifier Attributes

These `data-layout-*` attributes work on layout elements and `data-layout` containers:

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | Gap between children |
| `data-layout-align` | `start`, `center`, `end`, `stretch`, `baseline` | Cross-axis alignment |
| `data-layout-justify` | `start`, `end`, `center`, `between` | Main-axis alignment |
| `data-layout-padding` | `none`, `s`, `m`, `l`, `xl` | Container padding |
| `data-layout-min` | Various rem/px values | Minimum size |
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
| `data-ratio` | `1:1`, `4:3`, `3:2`, `16:9`, `21:9`, `2:3`, `3:4`, `9:16` | Aspect ratio |
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
| `data-stepper` | `<input type="number">` | +/- button wrapper |
| `data-color` | `<input type="color">` | Enhanced color picker with swatch + hex |
| `data-upload` | `<input type="file">` | Drop zone file upload |
| `data-mask` | `<input>` | Input masking (`data-pattern` for format) |
| `data-toggle-tags` | `<fieldset>` | Checkbox pill chips |
| `data-show-when` | any | Conditional visibility (show when field matches) |
| `data-hide-when` | any | Conditional visibility (hide when field matches) |
| `data-autosave` | `<form>` | Auto-save form to localStorage |
| `data-select-all` | `<input type="checkbox">` | Select/deselect all checkboxes |

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

### Interactive Enhancers

| Attribute | Element | Description |
|-----------|---------|-------------|
| `data-copy` | `<button>` | Copy text to clipboard |
| `data-copy-target` | CSS selector | Target element to copy from |
| `data-hotkey` | `<kbd>` | Platform-aware key display (⌘/Ctrl) |
| `data-spoiler` | any | Content concealment (`blur`, `solid`, `noise`) |
| `data-ticker` | `<data>` | Animated number count-up |
| `data-format-number` | `<data>` | Locale-aware number formatting |
| `data-format-date` | `<time>` | Locale-aware date formatting (`relative`) |
| `data-format-bytes` | `<data>` | Byte size formatting |
| `data-animate-image` | `<img>` | Play/pause for animated images |
| `data-command` | `<button>` | Command palette trigger |

---

## 9. Global Attributes

Applied to `<html>` or `<body>` root elements.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-theme` | See themes list | Active theme |
| `data-mode` | `light`, `dark` | Color mode override |
| `data-motion-reduced` | (boolean) | User-toggled motion reduction |
| `data-debug` | (boolean) | Debug mode |
| `data-wireframe` | `lo`, `mid`, `hi`, `annotate` | Wireframe mode |

---

## 10. Quick Reference — All `data-*` Attributes

Alphabetical index of every `data-*` attribute with where it applies.

| Attribute | Applies to |
|-----------|------------|
| `data-a11y-theme` | `<html>` — accessibility theme |
| `data-align` | Table cells — text alignment |
| `data-allow-custom` | `<combobox-wc>` — allow typed entries (multi mode) |
| `data-anchor` | Tooltip — CSS anchor positioning |
| `data-animate-image` | `<img>` — play/pause control |
| `data-attention` | UI elements — attention indicator |
| `data-auto` | Various — auto behavior |
| `data-autoplay` | `<carousel-wc>` — auto-advance |
| `data-autoplay-delay` | `<carousel-wc>` — delay ms |
| `data-autosave` | `<form>` — localStorage save |
| `data-axes` | `.vb-chart` — axis display |
| `data-blur-reveal` | Text — blur-to-clear entrance |
| `data-bordered` | Various — border variant |
| `data-center-label` | Pie chart — donut center text |
| `data-collapsed` | Breadcrumb — hide middle items |
| `data-collapsible` | `<splitter-wc>` — allow panel collapse |
| `data-color` | `<input type="color">` — enhanced picker |
| `data-command` | `<button>` — command palette trigger |
| `data-compact` | Various — reduced spacing |
| `data-completed` | Steps — completed state |
| `data-container` | Any — establish container query |
| `data-copy` | `<button>` — clipboard copy |
| `data-copy-target` | `<button>` — copy source selector |
| `data-count` | `<textarea>` — character counter |
| `data-debug` | `<html>` — debug mode |
| `data-debug-invalid` | Any — mark invalid structure |
| `data-debug-message` | Any — debug hover message |
| `data-density` | Table — row padding; `nav.tree` — compact spacing |
| `data-direction` | Steps — vertical layout |
| `data-disabled` | Table row — disabled state |
| `data-dismiss` | `<status-message>` child — dismiss button |
| `data-action` | Table button — `toggle-expand` action |
| `data-animate` | `<icon-wc>` — `spin` animation |
| `data-bulk-actions` | `<table-wc>` — bulk action bar for selected rows |
| `data-content` | `<status-message>` child — content wrapper |
| `data-description` | `<status-message>` child — description text |
| `data-donut` | Pie chart — hollow center |
| `data-dots` | Line chart — dot size |
| `data-dragover` | Upload zone — drag active |
| `data-ellipsis` | Pagination — ellipsis indicator |
| `data-empty` | `<output>` — empty state content |
| `data-enhanced` | `<form-field>` — enhancement type |
| `data-error` | `<output>` — error state content |
| `data-error-correction` | `<qr-code>` — QR error level |
| `data-expand-content` | Table row — expandable content |
| `data-face` | `<flip-card-wc>` child — front/back |
| `data-fallback` | `<user-avatar>` child — initials/icon fallback |
| `data-feedback` | State container — presentation mode |
| `data-filled` | `<status-message>` — solid fill |
| `data-filter` | `<combobox-wc>` — filter mode |
| `data-fit` | `[data-media]` — object-fit |
| `data-flip` | `<flip-card-wc>` — trigger mode |
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
| `data-indicators` | `<carousel-wc>` — dot indicators |
| `data-info` | Pagination — info text |
| `data-interactive` | Chart legend — clickable toggle |
| `data-items` | `<card-list>` — inline JSON data |
| `data-key` | `<card-list>` — unique key field |
| `data-label` | Table td — mobile card label |
| `data-labels` | Chart — show value labels |
| `data-layout` | Any — layout mode (see §5) |
| `data-layout-*` | Layout elements — modifiers (see §5) |
| `data-lazy` | `<html-include-wc>` — lazy load |
| `data-legend` | Chart — `inline` legend display |
| `data-legend-position` | Chart — legend position |
| `data-level` | `<page-toc>` heading indent; `<form-field>` password strength |
| `data-levels` | `<page-toc>` — heading levels |
| `data-loading` | Any — loading state |
| `data-loop` | `<carousel-wc>` — loop slides |
| `data-mask` | `<input>` — input masking |
| `data-max` | `<toast-wc>`, `<combobox-wc>` — maximum count |
| `data-media` | Container — aspect-ratio lock |
| `data-met` | Password rules — requirement met |
| `data-mode` | `<html>` — light/dark mode |
| `data-motion-reduced` | `<html>` — reduce motion |
| `data-name` | Token elements — token name |
| `data-nav-open` | `<body>` — mobile nav state |
| `data-next` | Pagination button — next page |
| `data-no-flip` | `<tooltip-wc>` — disable auto-flip |
| `data-no-icon` | `<a>`, `<form-field>` — suppress icons |
| `data-numeric` | Table th/td — right-align |
| `data-open` | Various WC — open state |
| `data-orientation` | `<splitter-wc>`, `<flip-card-wc>` — axis |
| `data-overlay` | `<loading-spinner>` — overlay mode |
| `data-padding` | Cards — padding preset |
| `data-page-layout` | `<body>` — page layout (see §5) |
| `data-pattern` | `[data-mask]` — mask format |
| `data-persist` | `<splitter-wc>` — remember size |
| `data-position` | Various — positioning |
| `data-prev` | Pagination button — previous page |
| `data-radius` | `[data-media]` — border radius |
| `data-range` | `<input type="range">` — enhanced range |
| `data-rating` | `<fieldset>` — star rating |
| `data-rating-half` | Rating — half-star precision |
| `data-rating-readonly` | Rating — read-only |
| `data-ratio` | `[data-media]` — aspect ratio |
| `data-readonly` | `<rating-wc>` — read-only |
| `data-required` | `<combobox-wc>` — validation |
| `data-responsive` | Table — mobile layout |
| `data-reveal` | Text — reveal entrance |
| `data-ring` | `<user-avatar>` — border ring |
| `data-scope` | `<heading-links>`, `<page-toc>` — scope selector |
| `data-scramble` | Text — decode effect |
| `data-select-all` | Checkbox — select-all toggle |
| `data-selected` | Table row — row highlight |
| `data-selected-count` | `<table-wc>` — selection count display |
| `data-separator` | Breadcrumb — separator char |
| `data-series` | Chart elements — series color |
| `data-shape` | Badge, avatar — shape variant |
| `data-shimmer` | Text — shimmer effect |
| `data-shortcut` | Elements — keyboard shortcut |
| `data-show-when` | Any — conditional show |
| `data-sidebar` | Body — sidebar state |
| `data-single` | `<accordion-wc>` — one-at-a-time |
| `data-size` | Various — size variant |
| `data-sort` | Table th — sortable column |
| `data-sort-value` | Table td — custom sort value |
| `data-spoiler` | Any — content concealment |
| `data-stack` | `<brand-mark>` — vertical layout |
| `data-stacked` | Chart — stacked series |
| `data-state` | Feedback container — active state |
| `data-state-expanded` | Table row — expanded |
| `data-state-hidden` | Table row — hidden |
| `data-state-selected` | Table row — selection state |
| `data-state-sorted` | Table th — sort direction |
| `data-status` | Avatar child — online status |
| `data-stepper` | Number input — +/- buttons |
| `data-sticky` | Table — sticky header/column |
| `data-sticky-column` | Table — sticky N columns |
| `data-switch` | Checkbox — toggle switch |
| `data-table-filter` | `<table-wc>` — filter input container |
| `data-theme` | `<html>` — active theme |
| `data-ticker` | `<data>` — count-up animation |
| `data-title` | Various — title text |
| `data-toggle-tags` | `<fieldset>` — pill chip toggle |
| `data-tooltip` | Chart td — tooltip text |
| `data-tooltip-delay` | `<tooltip-wc>` — show delay |
| `data-tooltip-position` | Tooltip — position |
| `data-trigger` | `<tooltip-wc>` — trigger mode |
| `data-truncated` | Breadcrumb li — truncate text |
| `data-type` | Chart, `<form-field>` — type variant |
| `data-typewriter` | Text — typing animation |
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
