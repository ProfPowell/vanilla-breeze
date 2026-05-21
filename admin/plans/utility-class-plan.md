# Utility Class R&D Analysis

> **Status:** Decision brief — ready for review
> **Date:** 2026-03-09
> **Context:** The overrides doc (`admin/overrides-demo.md`) describes a "Level 4: Utility Classes" that doesn't exist in the framework. The override demos defined utilities inline to prove the concept. This exposed a real gap: should VB ship utility classes? If so, what kind?

---

## 1. Current State

VB already covers utility-like territory through four mechanisms. Understanding what exists prevents building what we already have.

### Token overrides via CSS custom properties (Level 2)

Any element can scope a token to override downstream behavior:

```css
#editorial-section {
  --color-primary: #555;
  --size-m: 0.75rem;
}
```

Every VB component consuming `var(--color-primary)` or `var(--size-m)` inside that subtree picks up the adjusted value. This is the most powerful override — it cascades and is theme-aware by definition.

### Data-attribute configuration

Layout and behavior attributes on semantic elements, replacing the need for presentational classes:

| Category | Examples |
|----------|----------|
| Layout mode | `data-layout="stack"`, `data-layout="cluster"`, `data-layout="grid"` |
| Gap | `data-layout-gap="none\|3xs\|2xs\|xs\|s\|m\|l\|xl\|2xl\|3xl"` |
| Visibility | `data-visible="mobile"`, `data-visible="desktop"` |
| Surface | `data-surface="frosted\|tinted\|ghost\|transparent"` |
| Media | `data-media`, `data-ratio="16:9"`, `data-fit="cover"` |
| Print | `data-print="article"`, `data-no-print`, `data-print-only` |
| Loading | `data-loading`, `data-loading="skeleton"` |
| State | `data-state="empty\|loading\|error"` |
| View transitions | `data-vt="main"`, `data-vt-class="slide-left"` |

These handle what Tailwind accomplishes with responsive/state variant classes — but with HTML semantics instead of class names.

### Element-scoped modifier classes

VB uses `element.modifier` naming — classes scoped to specific HTML elements:

| Element | Modifiers |
|---------|-----------|
| `form` | `.stacked`, `.inline`, `.grid` |
| `button` | `.secondary`, `.ghost`, `.small`, `.large`, `.full-width` |
| `nav` | `.horizontal`, `.vertical`, `.pills`, `.tabs`, `.breadcrumb`, `.steps`, `.pagination` |
| `aside` | `.sidebar`, `.note`, `.float`, `.sidenote` |
| `table` | `.striped`, `.compact`, `.bordered` |
| `menu` | `.toolbar`, `.vertical`, `.context`, `.pills`, `.compact` |
| `figure` | `.full`, `.bordered`, `.float-start`, `.float-end`, `.centered` |
| `search` | `.inline`, `.expanded`, `.compact`, `.with-icon`, `.rounded` |

These are not utilities — they're semantic modifiers that describe *what an element is*, not *how it looks*.

### Layout custom elements

Thirteen `<layout-*>` elements handle composition without any classes:

`<layout-stack>`, `<layout-cluster>`, `<layout-grid>`, `<layout-reel>`, `<layout-center>`, `<layout-sidebar>`, `<layout-switcher>`, `<layout-imposter>`, `<layout-cover>`, `<layout-card>`, `<layout-canvas>`, `<layout-badge>`, `<layout-text>`

### The existing `utils` layer

Already ships in core (`src/utils/`), inside `@layer utils`:

| File | Selectors |
|------|-----------|
| `visually-hidden.css` | `.visually-hidden` |
| `flow.css` | `.flow` (uses `--flow-space`, defaults to `--size-m`) |
| `loading.css` | `[data-loading]` variants |
| `feedback-states.css` | `[data-state]`, `[data-feedback]` |
| `media.css` | `[data-media]`, `[data-ratio]`, `[data-fit]` |
| `responsive.css` | `[data-visible="mobile\|desktop"]` |
| `readiness.css` | `[hide-until-ready]`, `[show-until-ready]` |
| `surface-types.css` | `[data-surface]` variants |
| `backdrop-depth.css` | `[data-backdrop]`, `[data-canvas-depth]` |
| `view-transitions.css` | `[data-vt]`, `[data-vt-class]` |
| `print.css` | `[data-print]`, `[data-no-print]`, `[data-break-*]` |

**Key observation:** The existing utils layer is almost entirely data-attribute-driven. The only CSS classes are `.visually-hidden` and `.flow`. This is a deliberate design choice that the utility discussion must respect.

---

## 2. The Case For Utility Classes

### The escape-hatch gap

VB's current override model has a clean ladder:

1. Theme switch (`data-theme`)
2. Token tweak (`--color-primary: #555`)
3. Plain CSS (unlayered rules)

Between steps 2 and 3, there's a friction gap. Token tweaks only work when a component already consumes the right token. Plain CSS requires writing a selector, a property, and a value. For common one-liner adjustments — "make this text muted", "add small padding", "center this" — that's a lot of ceremony for a single declaration.

Utility classes fill exactly this gap: a pre-authored, token-connected CSS declaration you can apply by name.

### CMS / no-CSS-access contexts

When the only lever is HTML markup (CMS rich text editors, email templates, third-party widget slots), utility classes are the only way to make visual adjustments. Token overrides require a `<style>` block. Plain CSS requires a stylesheet. Classes require neither.

### Rapid prototyping

When building a new page or section, utilities allow you to sketch layout and visual treatment in markup, then refactor into proper component patterns once the design stabilizes. This is not the VB ideal, but it's how many developers work.

### Tailwind migration path

Teams moving from Tailwind to VB face a cliff: remove all Tailwind classes and replace with... what? A compatibility layer lets them migrate incrementally, removing Tailwind classes one component at a time rather than doing a full rewrite.

---

## 3. The Case Against

### Philosophical contradiction

VB's identity is "zero-class styling." The homepage pitch, the conformance checker, the entire design system is built around the premise that if you write good HTML, it looks good automatically. Shipping utility classes undermines this story — even if opt-in, their existence signals "sometimes you need classes."

### File size without PurgeCSS

VB has no build step. No tree-shaking. No PurgeCSS. Every utility class shipped is a utility class downloaded, whether used or not. Tailwind's entire model depends on purging unused classes — without that, a full utility set is 30-50KB+ gzipped. VB's core is already 319KB (gzipped CDN core), with the full bundle at 647KB. Budget is tight.

### Naming collisions

Generic class names like `.hidden`, `.block`, `.error`, `.text-sm` will collide with existing CSS in real projects. WordPress themes, Bootstrap remnants, CMS injected classes — the collision surface is large. Namespacing (`.vb-hidden`) adds prefix tax to every class.

### Encouraging class soup

The conformance checker exists specifically to discourage `<div class="flex items-center gap-4 p-4 border rounded">` patterns. Shipping utilities that enable exactly this usage creates a tension that documentation alone can't resolve. "Here are utility classes, but don't use too many" is a weaker message than "you don't need classes."

### Token overrides + plain CSS already cover this

For developers who can write CSS (VB's primary audience), token overrides and unlayered plain CSS cover 100% of use cases. Utilities add convenience, not capability. The question is whether that convenience justifies the costs.

---

## 4. What Tailwind Got Right

These lessons apply regardless of whether VB ships utilities.

### Constrained scales enforce consistency

Tailwind's spacing scale (`p-1` through `p-12`) prevents developers from writing `padding: 13px` or `padding: 1.15rem`. VB tokens do the same thing — `--size-xs` through `--size-3xl` — but tokens are invisible in markup. A class name like `.p-m` makes the constraint *visible* to anyone reading the HTML, including non-CSS developers.

### Discoverability

`class="text-muted text-sm"` is self-documenting in a way that `style="color: var(--color-text-muted); font-size: var(--font-size-sm)"` is not. Class names have lower cognitive overhead than custom property names, especially for developers who aren't intimately familiar with the token system.

### Colocation

Styling intent next to the element — without opening a separate file — reduces context-switching for small adjustments. This is genuinely valuable for one-off tweaks that don't warrant a named class.

### Composability without specificity conflicts

All utilities at the same specificity (one class) means they compose predictably. No specificity wars, no `!important` escalation. VB's `@layer` system already solves this at a broader level, but utilities extend the benefit to per-element adjustments.

---

## 5. What Tailwind Got Wrong

What VB must never copy.

### Utility-first as default philosophy

When utilities are the primary authoring model, class strings become the stylesheet. `<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">` is a stylesheet pasted into HTML. It's verbose, non-semantic, hard to grep, and impossible to restyle without touching every template.

### No semantic constraint

Tailwind classes describe *how* an element looks, never *what* it is. This inverts the purpose of HTML. VB's element-scoped modifiers (`button.secondary`, `nav.pills`) describe the element's role. Utilities should supplement this, not replace it.

### Build step dependency

Tailwind only works at scale with PurgeCSS, JIT compilation, or the Tailwind CLI. Without a build step, the full CSS is ~300KB+ gzipped. VB is a drop-in stylesheet — no build step required. Any utility solution must work at full weight.

### Arbitrary value escape hatches

`bg-[#1a2b3c]`, `p-[13px]`, `grid-cols-[1fr_2fr_minmax(200px,1fr)]` — these undermine the entire point of a constrained scale. If you can put any value in a class name, you don't have a design system — you have inline styles with extra steps.

### Responsive variants for everything

`sm:flex md:grid lg:flex-row xl:grid-cols-3` — generating responsive variants for every utility creates an enormous CSS surface. VB's layout elements handle responsive behavior intrinsically (CSS Grid `auto-fit`, container queries). Responsive utility variants are unnecessary and would bloat the file significantly.

---

## 6. Three Options Evaluated

### Option A: VB-Native Utility Set

**Approach:** ~70 curated utility classes using VB's t-shirt naming convention. Semantic color names only. No responsive variants. Ships as `vb-utils.css`, opt-in.

**Class naming examples:**

```css
/* Spacing uses VB t-shirt sizes */
.p-s   { padding: var(--size-s); }
.p-m   { padding: var(--size-m); }
.p-l   { padding: var(--size-l); }

/* Colors use VB semantic names */
.bg-primary   { background: var(--color-primary); }
.text-muted   { color: var(--color-text-muted); }

/* Typography uses VB font-size tokens */
.text-sm  { font-size: var(--font-size-sm); }
.text-lg  { font-size: var(--font-size-lg); }
```

**Pros:**
- Consistent with VB's naming and philosophy
- Small file (~3KB gzipped)
- Theme-aware by definition (all values are `var()` references)
- No build step needed at this size

**Cons:**
- Too small for developers who want full utility coverage
- Unnecessary for VB purists who use token overrides
- Awkward middle ground — neither full utility framework nor zero-utility purity
- Custom naming means no transferable knowledge from Tailwind/Bootstrap

**Estimated size:** ~3KB gzipped

---

### Option B: Tailwind-Compatible Utility Set

**Approach:** Use Tailwind's class names, map values to VB tokens. Migration-friendly. Ships as a single file.

**Class naming examples:**

```css
/* Tailwind names, VB token values */
.p-2   { padding: var(--size-xs); }      /* TW: 0.5rem → VB: --size-xs (0.5rem) */
.p-4   { padding: var(--size-m); }       /* TW: 1rem   → VB: --size-m (1rem) */
.p-6   { padding: var(--size-l); }       /* TW: 1.5rem → VB: --size-l (1.5rem) */

/* Lossy — no VB equivalent, use nearest */
.p-5   { padding: var(--size-4); }       /* TW: 1.25rem → VB: --size-4 (1.25rem, numeric alias) */
.p-7   { padding: var(--size-6); }       /* TW: 1.75rem → VB: --size-6 (1.75rem, numeric alias) */
```

**Pros:**
- Zero learning curve for Tailwind refugees
- Search-and-replace migration from Tailwind to VB
- Familiar naming for the largest CSS utility user base

**Cons:**
- Lossy scale mapping — Tailwind has 20+ spacing steps, VB has 9 t-shirt + 10 numeric
- Massive file without purge (~30-50KB gzipped for full Tailwind class coverage)
- Responsive/state variants (`sm:`, `hover:`, `focus:`) prohibitive without build step
- Semantic mismatch — Tailwind numeric naming (`p-4`) conflicts with VB semantic naming
- Maintaining compatibility with Tailwind's evolving API is ongoing work
- Implies VB endorses Tailwind's naming, which it philosophically doesn't

**Estimated size:** ~30-50KB gzipped (spacing + color + typography + layout + visual)

---

### Option C: Adapter/Bridge (Two Opt-In Files)

**Approach:** Ship two separate, independently loadable files:

1. **`vb-utils.css`** — Curated VB-native utilities (~70 classes). The permanent, opinionated set.
2. **`tailwind-compat.css`** — Migration bridge (~250 classes). Explicitly transitional. Maps Tailwind class names to VB tokens where possible, flags lossy mappings in comments.

Zero cost for non-users. Follows VB's existing opt-in packaging model (like `vanilla-breeze-charts.css`, `vanilla-breeze-labs.css`).

**Pros:**
- Each file serves a distinct audience — VB-native devs vs. Tailwind migrants
- Neither file bloats core
- The compat file can be documented as transitional ("use during migration, remove when done")
- Follows VB's existing `dist/cdn/` packaging pattern
- Can ship Phase 1 (vb-utils) fast, Phase 2 (tailwind-compat) when demand justifies
- Clear exit ramp — compat file has a defined end-of-life

**Cons:**
- Two files to maintain
- Compat file needs version-tracking against Tailwind releases
- Risk that "transitional" compat file becomes permanent (migration never finishes)

**Estimated sizes:**
- `vb-utils.css`: ~3KB gzipped
- `tailwind-compat.css`: ~8-12KB gzipped (curated subset, not full Tailwind coverage)

---

## 7. Recommendation: Option C in Phases

### Phase 0: Document the token override pattern (done)

The overrides doc (`admin/overrides-demo.md`) and its demo files already establish token overrides and plain CSS as the primary approach. This is the foundation — utilities are a supplement, not a replacement.

### Phase 1: Ship `vb-utils.css` as opt-in

~70 curated classes. VB naming. Semantic colors only. No responsive variants. Placed in `@layer utils` so unlayered CSS overrides them. Distributed alongside the existing CDN files.

**Scope:** spacing, typography, color, display, border-radius, shadow, text-align, flex shortcuts, `.visually-hidden` (already exists — re-export from here).

**Not in scope:** responsive variants, state variants (`hover:`, `focus:`), arbitrary values, grid utilities (use `<layout-grid>` instead).

### Phase 2: Ship `tailwind-compat.css` for migration

~250 classes mapping common Tailwind names to VB tokens. Documented as a migration tool, not a permanent feature. Includes:

- Spacing: `p-0` through `p-12`, `m-0` through `m-12`, `gap-*`
- Colors: `bg-*`, `text-*` for Tailwind's standard palette → nearest VB semantic color
- Typography: `text-xs` through `text-5xl`, `font-*`
- Layout: `flex`, `grid`, `hidden`, `block`, `inline-flex`
- Visual: `rounded-*`, `shadow-*`, `border`

Not included: responsive prefixes (`sm:`, `md:`), state variants (`hover:`, `focus:`), arbitrary values (`bg-[#hex]`), or any class requiring a build step.

### Phase 3: Evaluate real-world usage, prune

After 6 months of availability:
- Which `vb-utils.css` classes are actually used? Prune unused ones.
- Are teams actually migrating off `tailwind-compat.css`? If not, document better exit paths.
- Should any utility graduate into core? (`.visually-hidden` already did.)

---

## 8. Open Design Questions

Decisions needed before building Phase 1.

### Namespace prefix?

| Option | Example | Risk |
|--------|---------|------|
| No prefix | `.hidden`, `.text-sm` | Collides with Bootstrap, WordPress, CMS classes |
| `vb-` prefix | `.vb-hidden`, `.vb-text-sm` | Verbose, feels un-native, prefix tax on every class |
| Short prefix | `.u-hidden`, `.u-text-sm` | Clear "utility" signal, moderate verbosity |
| Attribute-based | `[data-u-hidden]` | Consistent with VB's data-attribute pattern, but unusual |

**Recommendation:** No prefix for `vb-utils.css` (VB authors control their own namespace). `tw-` or no prefix for `tailwind-compat.css` (whole point is drop-in compatibility). Document collision risks.

### Logical properties?

| Option | Example | Trade-off |
|--------|---------|-----------|
| Logical only | `.ps-m` (padding-inline-start) | Correct for RTL, but unfamiliar |
| Physical only | `.pl-m` (padding-left) | Familiar, but breaks in RTL |
| Both | `.ps-m` + `.pl-m` | Doubles the class count |
| Logical with physical aliases | `.ps-m` canonical, `.pl-m` alias | Best of both, slight maintenance cost |

**Recommendation:** Logical properties canonical (VB already uses `padding-inline`, `margin-block` throughout). Physical aliases in compat file only.

### Conformance checker integration

The `vb-conformance.js` checker currently flags class usage patterns that look like utility soup. If VB ships utilities, the checker needs:

- A utility class allowlist (classes that are *expected* to appear)
- A maximum-utility-count-per-element threshold (e.g., > 5 utilities on one element triggers a warning)
- A way to distinguish VB utilities from random classes

### Naming convention: t-shirt or semantic?

| Option | Example | Personality |
|--------|---------|-------------|
| T-shirt sizes | `.p-s`, `.p-m`, `.p-l` | Matches VB token naming exactly |
| Semantic | `.p-compact`, `.p-comfortable`, `.p-spacious` | More expressive but more verbose |
| Numeric (Tailwind-style) | `.p-2`, `.p-4`, `.p-6` | Familiar but conflicts with VB's philosophy |

**Recommendation:** T-shirt sizes. They're already the VB naming convention for tokens, data-attributes, and modifiers. Consistency > familiarity.

### Where does `.flow` live?

`.flow` is currently in `src/utils/flow.css` inside `@layer utils`. It's a genuine layout utility that VB docs actively recommend. Options:

1. **Stays in core** — it's fundamental enough to justify core inclusion
2. **Moves to `vb-utils.css`** — makes the utils layer truly opt-in
3. **Stays in core AND re-exported in `vb-utils.css`** — available either way

**Recommendation:** Option 3. `.flow` and `.visually-hidden` stay in core (they're too fundamental to gate behind an opt-in). `vb-utils.css` re-exports them for completeness.

---

## 9. Token-to-Utility Mapping Tables

### `vb-utils.css` — Proposed Class List (~70 classes)

#### Spacing

| Class | CSS | Token |
|-------|-----|-------|
| `.p-3xs` | `padding: var(--size-3xs)` | `0.125rem` |
| `.p-2xs` | `padding: var(--size-2xs)` | `0.25rem` |
| `.p-xs` | `padding: var(--size-xs)` | `0.5rem` |
| `.p-s` | `padding: var(--size-s)` | `0.75rem` |
| `.p-m` | `padding: var(--size-m)` | `1rem` |
| `.p-l` | `padding: var(--size-l)` | `1.5rem` |
| `.p-xl` | `padding: var(--size-xl)` | `2rem` |
| `.p-2xl` | `padding: var(--size-2xl)` | `3rem` |
| `.p-3xl` | `padding: var(--size-3xl)` | `4rem` |
| `.px-*` | `padding-inline: var(--size-*)` | Same scale |
| `.py-*` | `padding-block: var(--size-*)` | Same scale |
| `.m-0` | `margin: 0` | — |
| `.mx-auto` | `margin-inline: auto` | — |
| `.mt-*` | `margin-block-start: var(--size-*)` | T-shirt scale |
| `.mb-*` | `margin-block-end: var(--size-*)` | T-shirt scale |
| `.gap-*` | `gap: var(--size-*)` | T-shirt scale |

*Note: `.px-*` and `.py-*` use logical properties (`padding-inline`, `padding-block`) per VB convention.*

#### Typography

| Class | CSS | Token |
|-------|-----|-------|
| `.text-xs` | `font-size: var(--font-size-xs)` | `0.75rem` |
| `.text-sm` | `font-size: var(--font-size-sm)` | `0.875rem` |
| `.text-md` | `font-size: var(--font-size-md)` | `1rem` |
| `.text-lg` | `font-size: var(--font-size-lg)` | `1.125rem` |
| `.text-xl` | `font-size: var(--font-size-xl)` | `1.25rem` |
| `.text-2xl` | `font-size: var(--font-size-2xl)` | `1.5rem` |
| `.text-3xl` | `font-size: var(--font-size-3xl)` | `1.875rem` |
| `.font-light` | `font-weight: var(--font-weight-light)` | `300` |
| `.font-normal` | `font-weight: var(--font-weight-normal)` | `400` |
| `.font-medium` | `font-weight: var(--font-weight-medium)` | `500` |
| `.font-semibold` | `font-weight: var(--font-weight-semibold)` | `600` |
| `.font-bold` | `font-weight: var(--font-weight-bold)` | `700` |
| `.font-sans` | `font-family: var(--font-sans)` | System sans-serif stack |
| `.font-serif` | `font-family: var(--font-serif)` | Charter stack |
| `.font-mono` | `font-family: var(--font-mono)` | ui-monospace stack |
| `.leading-tight` | `line-height: var(--line-height-tight)` | `1.25` |
| `.leading-normal` | `line-height: var(--line-height-normal)` | `1.5` |
| `.leading-loose` | `line-height: var(--line-height-loose)` | `1.75` |
| `.text-start` | `text-align: start` | — |
| `.text-center` | `text-align: center` | — |
| `.text-end` | `text-align: end` | — |

#### Color

| Class | CSS | Token |
|-------|-----|-------|
| `.bg-primary` | `background: var(--color-primary)` | Theme primary |
| `.bg-surface` | `background: var(--color-surface)` | Theme surface |
| `.bg-surface-raised` | `background: var(--color-surface-raised)` | Raised surface |
| `.bg-surface-sunken` | `background: var(--color-surface-sunken)` | Sunken surface |
| `.text-primary` | `color: var(--color-primary)` | Theme primary |
| `.text-muted` | `color: var(--color-text-muted)` | Muted text |
| `.text-subtle` | `color: var(--color-text-subtle)` | Subtle text |
| `.text-on-primary` | `color: var(--color-text-on-primary)` | Text on primary bg |
| `.border-default` | `border: var(--border-width-thin) solid var(--color-border)` | Default border |
| `.border-strong` | `border: var(--border-width-thin) solid var(--color-border-strong)` | Strong border |

#### Display & Layout

| Class | CSS | Token |
|-------|-----|-------|
| `.block` | `display: block` | — |
| `.inline-block` | `display: inline-block` | — |
| `.flex` | `display: flex` | — |
| `.inline-flex` | `display: inline-flex` | — |
| `.grid` | `display: grid` | — |
| `.hidden` | `display: none` | — |
| `.flex-col` | `flex-direction: column` | — |
| `.flex-wrap` | `flex-wrap: wrap` | — |
| `.items-center` | `align-items: center` | — |
| `.items-start` | `align-items: start` | — |
| `.justify-center` | `justify-content: center` | — |
| `.justify-between` | `justify-content: space-between` | — |

#### Visual

| Class | CSS | Token |
|-------|-----|-------|
| `.rounded-xs` | `border-radius: var(--radius-xs)` | `0.125rem` |
| `.rounded-s` | `border-radius: var(--radius-s)` | `0.25rem` |
| `.rounded-m` | `border-radius: var(--radius-m)` | `0.5rem` |
| `.rounded-l` | `border-radius: var(--radius-l)` | `0.75rem` |
| `.rounded-xl` | `border-radius: var(--radius-xl)` | `1rem` |
| `.rounded-full` | `border-radius: var(--radius-full)` | `9999px` |
| `.shadow-xs` | `box-shadow: var(--shadow-xs)` | Subtle shadow |
| `.shadow-sm` | `box-shadow: var(--shadow-sm)` | Small shadow |
| `.shadow-md` | `box-shadow: var(--shadow-md)` | Medium shadow |
| `.shadow-lg` | `box-shadow: var(--shadow-lg)` | Large shadow |

#### Existing (re-exported)

| Class | CSS | Source |
|-------|-----|--------|
| `.visually-hidden` | Screen-reader only | `src/utils/visually-hidden.css` |
| `.flow` | Adjacent sibling spacing via `--flow-space` | `src/utils/flow.css` |

**Total: ~70 classes** (9 padding + 9 px + 9 py + 5 margin + 9 gap + 10 typography + 8 font + 3 text-align + 10 color + 12 display/layout + 6 radius + 4 shadow + 2 existing ≈ 96 declarations, ~70 unique class names with `*` scale expansion)

---

### `tailwind-compat.css` — Mapping Table (excerpt)

#### Spacing (Tailwind → VB Token)

| Tailwind | Value | VB Token | Notes |
|----------|-------|----------|-------|
| `p-0` | `0` | — | Exact |
| `p-0.5` | `0.125rem` | `--size-3xs` | Exact |
| `p-1` | `0.25rem` | `--size-2xs` | Exact |
| `p-2` | `0.5rem` | `--size-xs` | Exact |
| `p-3` | `0.75rem` | `--size-s` | Exact |
| `p-4` | `1rem` | `--size-m` | Exact |
| `p-5` | `1.25rem` | `--size-4` | Numeric alias only |
| `p-6` | `1.5rem` | `--size-l` | Exact |
| `p-7` | `1.75rem` | `--size-6` | Numeric alias only |
| `p-8` | `2rem` | `--size-xl` | Exact |
| `p-10` | `2.5rem` | — | **No equivalent — interpolate** |
| `p-12` | `3rem` | `--size-2xl` | Exact |
| `p-16` | `4rem` | `--size-3xl` | Exact |
| `p-20` | `5rem` | `--size-10` | Numeric alias only |
| `p-24`+ | `6rem+` | — | **Beyond VB scale** |

#### Typography (Tailwind → VB Token)

| Tailwind | Value | VB Token | Notes |
|----------|-------|----------|-------|
| `text-xs` | `0.75rem` | `--font-size-xs` | Exact |
| `text-sm` | `0.875rem` | `--font-size-sm` | Exact |
| `text-base` | `1rem` | `--font-size-md` | Exact |
| `text-lg` | `1.125rem` | `--font-size-lg` | Exact |
| `text-xl` | `1.25rem` | `--font-size-xl` | Exact |
| `text-2xl` | `1.5rem` | `--font-size-2xl` | Exact |
| `text-3xl` | `1.875rem` | `--font-size-3xl` | Exact |
| `text-4xl` | `2.25rem` | `--font-size-4xl` | Exact |
| `text-5xl` | `3rem` | `--font-size-5xl` | Exact |

Typography maps cleanly — the scales are nearly identical.

#### Colors (Tailwind → VB Semantic)

Tailwind uses palette-based naming (`blue-500`, `gray-200`). VB uses semantic naming. The compat file maps Tailwind's most common semantic usages:

| Tailwind (common usage) | VB Token |
|------------------------|----------|
| `bg-white` | `var(--color-surface)` |
| `bg-gray-50` | `var(--color-surface-raised)` |
| `bg-gray-100` | `var(--color-surface-sunken)` |
| `text-gray-500` | `var(--color-text-subtle)` |
| `text-gray-600` | `var(--color-text-muted)` |
| `text-gray-900` | `var(--color-text)` |
| `border-gray-200` | `var(--color-border)` |
| `border-gray-300` | `var(--color-border-strong)` |

**Not mapped:** Tailwind's full color palette (`red-500`, `blue-300`, etc.) — these have no VB equivalent. The compat file only covers structural/neutral colors used for layout, not decorative palette colors.

---

## 10. Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Utility classes encourage class soup, undermining VB philosophy** | High | Medium | Document as escape hatch, not primary API. Conformance checker warns on >5 utilities per element. All docs show token/element approach first. |
| **Naming collisions with existing project CSS** | Medium | High | No prefix in VB-native (accept risk for clean DX). Document known collisions (`.hidden`, `.block`). Consider `[data-u-*]` attribute pattern as alternative. |
| **Tailwind compat file becomes permanent (migrations never finish)** | High | Low | Document explicit deprecation timeline. Track download metrics separately. Periodically publish "migration complete" guides. |
| **File size exceeds budget** | Low | High | `vb-utils.css` is ~3KB, well within opt-in budget. `tailwind-compat.css` is separate — never in core. Monitor and prune. |
| **Developers confuse VB-native and Tailwind naming** | Medium | Medium | Separate files, separate docs. VB-native uses t-shirt sizes (`p-m`), Tailwind uses numbers (`p-4`). Never mix in examples. |
| **Maintenance burden of tracking Tailwind releases** | Medium | Low | Compat file targets a fixed Tailwind version (v3/v4 core). Not a moving target — it's a bridge, not a mirror. |
| **Token changes break utility class contracts** | Low | Medium | Utilities reference tokens by name, not value. Token renames are already breaking changes in VB. No additional risk. |
| **VB purists reject the feature, fragmenting community** | Low | Low | Opt-in only. Zero impact on non-users. Core CSS unchanged. Position as "we met the market where it is." |

---

## Appendix: Layer Placement

Both utility files should declare their rules inside `@layer utils`:

```css
/* vb-utils.css */
@layer utils {
  .p-s   { padding: var(--size-s); }
  .p-m   { padding: var(--size-m); }
  /* ... */
}
```

This ensures:
1. Utilities beat `native-elements`, `custom-elements`, and `web-components` (lower layers)
2. Unlayered user CSS beats utilities (the override guarantee)
3. Theme bundles (`bundle-theme`) beat utilities (intentional — theme-specific styles should win)

Layer order for reference:
```
@layer tokens, reset, native-elements, custom-elements, web-components, utils, bundle-theme, bundle-effects, bundle-components;
```

## Appendix: File Size Context

| File | Raw | Purpose |
|------|-----|---------|
| `vanilla-breeze.css` | 647KB | Full bundle |
| `vanilla-breeze-core.css` | 319KB | Core only |
| `vanilla-breeze-charts.css` | 21KB | Opt-in charts |
| `vanilla-breeze-labs.css` | 5.2KB | Opt-in experimental |
| `vanilla-breeze-dev.css` | 12KB | Opt-in dev tools |
| **`vb-utils.css` (proposed)** | **~3KB gz** | **Opt-in utilities** |
| **`tailwind-compat.css` (proposed)** | **~8-12KB gz** | **Opt-in migration** |

Both proposed files are smaller than existing opt-in files. No core size increase.
