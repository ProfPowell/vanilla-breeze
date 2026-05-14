# R&D: DTCG (Design Tokens Community Group) format vs. Vanilla Breeze tokens

> Status: research → action. DTCG hit stable v1 on 2025-10-28; companion
> implementation plan in [dtcg-theme-pipeline-plan.md](./dtcg-theme-pipeline-plan.md).
> DTCG spec: [W3C Design Tokens stable spec 2025.10](https://www.designtokens.org/)
> Authored: 2026-05-14 · Updated: 2026-05-14 (stable-spec correction)

## TL;DR

DTCG is a JSON file format for **exchanging** design tokens between tools
— Figma, Style Dictionary, code generators, documentation systems. It is
not a runtime format and not an authoring format for hand-written CSS.

**The DTCG specification reached its first stable version (2025.10) on
2025-10-28.** It now has first-class support for OKLCH and all CSS Color
Module 4 spaces, native theming variants (light/dark/a11y/brand without
file duplication), and reference implementations in Style Dictionary,
Tokens Studio, Terrazzo, Penpot, and others. The earlier "do not
implement" caveat was on a later in-flight draft, not the stable target.

Vanilla Breeze has a mature, runtime-native token system built on CSS
custom properties, OKLCH, `light-dark()`, and relative-color computation.
DTCG can faithfully express VB's static *resolved* values (color spaces
match), but cannot express VB's *parametric* themes (relative-color,
seed-based derivation, `@supports`-gated tokens). There is **no reason
to restructure VB's runtime** to fit DTCG.

The opportunity is at the **interoperability seam** — and it is now a
real opportunity worth scheduling, not a "wait and see":

1. Extend `<theme-export>` to emit DTCG-shaped JSON.
2. Publish all 50 VB themes as `.tokens.json` artifacts alongside the CSS.
3. Add a DTCG importer to the Theme Composer web UI (no CLI).
4. Catalog public token sets (Material, IBM Carbon, Salesforce Lightning,
   GOV.UK, Atlassian) as importable starting points.
5. Promote the existing brand experiments (McDonald's, Starbucks, IBM,
   Anthropic in `demos/alpenglow/themes/`) to first-class themes by
   round-tripping them through the new pipeline, validating the workflow.
6. **Future / speculative:** a "paste a URL, infer a theme" service that
   scrapes a site and proposes a VB theme from its computed styles.

See [dtcg-theme-pipeline-plan.md](./dtcg-theme-pipeline-plan.md) for the
phased implementation plan.

---

## What DTCG actually is

A W3C Community Group specification that defines a JSON schema for
design tokens. Reached its first stable version (`2025.10`) on
2025-10-28. Headline properties:

- File extension `.tokens` or `.tokens.json`; MIME
  `application/design-tokens+json`.
- **Status:** stable v1 backed by reference implementations in Style
  Dictionary, Tokens Studio, Terrazzo, Penpot, plus contributing
  implementers across Adobe, Amazon, Google, Microsoft, Meta,
  Salesforce, Shopify, Sony, Pinterest, Disney, NYT, Cisco, Intuit, GM.
- **First-class support for OKLCH, Display P3, and all CSS Color Module 4
  spaces** — important for VB, which is OKLCH-native.
- Stable theming model — light/dark/a11y/brand variants without file
  duplication.
- Cross-platform generation — same token file produces CSS, iOS, Android,
  Flutter via Style Dictionary.
- Note: the spec continues to iterate; later in-flight drafts (e.g. a
  draft also numbered 2025.10 published 2026-05-07) carry "do not
  implement" warnings and are *not* the stable target. Pin to stable
  2025.10.

### Token shape

```json
{
  "color": {
    "primary": {
      "$type": "color",
      "$value": { "colorSpace": "srgb", "components": [0.2, 0.4, 0.8] },
      "$description": "Primary brand color"
    }
  }
}
```

Every token has `$value` and (transitively, via group inheritance)
`$type`. Optional `$description`, `$deprecated`, `$extensions` (vendor
namespace).

### Groups

Groups are nested JSON objects without `$value`. They can carry their
own `$type` for inheritance:

```json
{
  "color": {
    "$type": "color",
    "primary": { "$value": { "hex": "#0066cc" } },
    "accent":  { "$value": { "hex": "#ff7700" } }
  }
}
```

### Aliases

Two reference forms:

- **Curly brace** (`{group.token}`) — references a complete token.
- **JSON Pointer** (`{ "$ref": "#/group/token/$value/components/0" }`)
  — references a sub-property.

```json
{
  "semantic": {
    "interactive": { "$type": "color", "$value": "{color.primary}" }
  }
}
```

### Type system

Primitive types: `color`, `dimension`, `fontFamily`, `fontWeight`,
`duration`, `cubicBezier`, `number`, `string`, `boolean`.

Composite types: `typography`, `shadow`, `border`, `transition`,
`gradient`, `strokeStyle`.

A `typography` token bundles the related primitives:

```json
{
  "$type": "typography",
  "$value": {
    "fontFamily": "{font.sans}",
    "fontSize":   { "value": 1, "unit": "rem" },
    "fontWeight": 600,
    "lineHeight": 1.5
  }
}
```

### Variants (light/dark)

Recent drafts add `$root` for the base value of a group with variants:

```json
{
  "color": {
    "primary": {
      "$root": { "$type": "color", "$value": { "hex": "#0066cc" } },
      "light": { "$value": { "hex": "#3388dd" } },
      "dark":  { "$value": { "hex": "#0044aa" } }
    }
  }
}
```

Tools choose how (or whether) to honor the variants. There is no
standard "this token swaps based on `prefers-color-scheme`" — it's a
convention layered on top.

---

## What Vanilla Breeze actually does

VB's token system lives in `src/tokens/` — 17 CSS files (colors,
typography, spacing, sizing, borders, shadows, motion, breakpoints,
forms, etc.) plus 50 themes in `src/tokens/themes/` (brand-X, extreme-X
for visual styles like cyber/dracula/swiss, access-X for a11y modes).

### Architecture in one paragraph

Tokens are CSS custom properties on `:root`. The base layer in
`src/tokens/index.css` is the **fallback contract** — every token has a
sensible default; themes override existing tokens only and may not
introduce new ones (a contract violation if they do). Themes apply via
`[data-theme~="modern"]`, with a separate dark-mode override under
`[data-theme~="modern"][data-mode="dark"]`. The 3-layer mental model
matches DTCG cleanly:

| Layer | DTCG analog | Example |
|---|---|---|
| Primitive | leaf token | `--color-gray-500: oklch(55% 0 0)` |
| Semantic | aliased token | `--color-text: light-dark(var(--color-gray-900), var(--color-gray-100))` |
| Component | aliased token (per component) | `--button-radius: var(--radius-m)` |

### What VB does that DTCG cannot express

This is the heart of the mismatch. VB leans hard on platform features
that DTCG has no representation for:

#### 1. Relative color: "derive state from base"

```css
--color-primary: oklch(var(--lightness-primary) var(--chroma-primary) var(--hue-primary));
--color-primary-hover:  oklch(from var(--color-primary) calc(l - 0.08) calc(c + 0.02) h);
--color-primary-active: oklch(from var(--color-primary) calc(l - 0.12) c h);
--color-primary-subtle: oklch(from var(--color-primary) 0.95 0.03 h);
```

VB's `colors.css` derives every state variant (hover, active, subtle)
from the base via the CSS `from <color>` syntax. Themes set the seed
(`--hue-primary`, `--lightness-primary`, `--chroma-primary`) and the
states fall out automatically. **This is the single most important
property of VB's token design — themes set 3 numbers, get a complete
button.**

DTCG has no derivation. Each variant is a separate token with its own
`$value`. To round-trip VB into DTCG you'd either:

- **Eagerly resolve** the relative-color expressions at export time
  (loses the "themes only set seeds" benefit).
- **Round-trip the seeds only** and re-derive on import (requires a
  consumer that knows about VB's derivation rules — i.e. a
  VB-specific tool, not interop with generic tools).
- Stash the expression in `$extensions["com.vanilla-breeze.derive"]`
  (data is preserved, no other tool understands it).

None of these is satisfying.

#### 2. `light-dark()` — one token, both modes

```css
--color-text: light-dark(var(--color-gray-900), var(--color-gray-100));
```

DTCG's `$root` + `light`/`dark` variants is the closest analog but it
isn't standardized as an automatic `prefers-color-scheme` switch. The
shape also differs: DTCG splits one token into three keys; VB keeps it
as one CSS expression.

#### 3. OKLCH with seed-based hue/chroma/lightness math

```css
--lightness-primary: 50%;
--chroma-primary: 0.2;
--hue-primary: 260;
--color-primary: oklch(var(--lightness-primary) var(--chroma-primary) var(--hue-primary));
```

DTCG `color` does support multiple color spaces (you'd use
`{ "colorSpace": "oklch", "components": [0.5, 0.2, 260] }`), but the
**recomposition from named seed tokens is a CSS-side capability** that
DTCG can't represent. You can express the resulting OKLCH color, not
the recipe that produced it.

#### 4. `contrast-color()` and other progressive-enhancement tokens

```css
@supports (color: contrast-color(red)) {
  :root {
    --color-text-on-primary-auto: contrast-color(var(--color-primary));
  }
}
```

VB layers tokens behind `@supports` for graceful degradation. DTCG has
no equivalent — values are static.

#### 5. Animatable custom properties

```css
:root {
  transition:
    --hue-primary var(--duration-slow) var(--ease-default),
    /* … */;
}
```

Theme transitions in VB animate the *seed tokens themselves* via
`@property`-registered custom properties. DTCG describes static values;
the transition is a runtime concern outside its scope.

### What VB and DTCG agree on

- Hierarchical organization is good.
- Names are stable contracts; values are theme-controlled.
- Aliases (`var(--…)`) / references (`{group.token}`) are first-class.
- A small number of explicit token *kinds* is better than infinite
  freeform values.
- Themes override semantic tokens, not primitives.

VB's discipline (the [token strategy
spec](r-n-d/themes/review-first/token-strategy.md) lays out
primitive/semantic/component) is essentially the DTCG philosophy in
CSS form, predating it.

---

## What VB already does that's adjacent to DTCG

### `<theme-export>` already emits JSON

`src/web-components/theme-export/logic.js` walks a scope's inline-style
custom properties (filtering by prefixes like `--color-`, `--font-`,
`--size-`) and serializes them as either a CSS block or flat JSON:

```json
{
  "--color-primary": "oklch(55% 0.22 270)",
  "--font-sans": "\"Inter\", system-ui, sans-serif"
}
```

This is the natural place to add a DTCG output. The collection logic is
already correct; it's a serializer change, not a re-architecture.

### `<theme-picker>`, `<palette-generator>`, `<semantic-palette>`

VB has a Theme Composer flow today:

- `<palette-generator>` — pick brand colors;
- `<semantic-palette>` — assign semantics to those colors;
- editable specimens (`<type-specimen>`, `<spacing-specimen>`,
  `<token-specimen>`) — tweak everything else;
- `<theme-export>` — paste the result into a `theme.css`.

Adding a DTCG import would let you start that flow from a `.tokens.json`
file (e.g. exported from Figma via Tokens Studio) instead of from
scratch. Useful for onboarding teams that already have a token JSON.

### The token fallback contract

`src/tokens/index.css` declares: *every token has a default; themes
override existing tokens only*. This matches DTCG's group-inheritance
model: a theme is effectively a partial overlay of the base token tree.
The contract is enforceable in DTCG via a "this file overrides
`base.tokens.json`" convention — but again, the value is in interop, not
in changing how authors work.

---

## Where DTCG could plug in — case by case

### 1. Optional DTCG export from `<theme-export>` — **strongest fit**

Add `format="dtcg"` alongside `css` and `json`. The serializer:

- Walks the same prefix list it already walks.
- Groups by prefix (`--color-` → `color/*`, `--font-size-` →
  `typography/size/*`).
- For each token, emits `{ "$value": "<oklch(…)>", "$type": "color" }`.
- For OKLCH values, parses the CSS string and emits structured DTCG
  color (`{ "colorSpace": "oklch", "components": [l, c, h] }`) — or
  keeps the raw string under `$extensions` if parsing fails.
- For relative-color expressions, **gives up gracefully**: emits the
  resolved computed value (which the browser already provides via
  `getComputedStyle`) and stashes the original expression under
  `$extensions["com.vanilla-breeze.expression"]`.

**Pros**
- Real interop value: themes flow into Tokens Studio, Style Dictionary,
  documentation tools.
- Trivial to add — pure serializer.
- Doesn't require any change to the runtime CSS.
- Optional — current consumers see no difference.

**Cons**
- Round-trip is lossy for relative-color and `light-dark()` (the static
  resolved values lose the parametric origin).
- DTCG spec is moving; we'd need to track drafts. Style Dictionary is
  still in v5-WIP territory for the latest format. Pin to a specific
  draft and document.

**Verdict:** Plausible, valuable, low cost. Worth a small spike when
there's a real consumer asking for it. Until then, it's an opportunity
on the shelf, not work to schedule.

### 2. DTCG importer — **plausible**

Companion to #1. Reads a `.tokens.json` file and produces a CSS block
the user can paste into a theme. Could live in `<theme-picker>` as an
import button.

**Pros**
- Lets teams bring an existing token system into VB.
- A natural Theme Composer entry point.

**Cons**
- Composite types (`typography`, `shadow`) need to be unpacked into
  VB's separate scalar tokens (`--font-family`, `--font-size`, etc.).
- DTCG `dimension` units are `px` or `rem`; VB uses both plus `em` and
  unitless. Conversions are mostly direct but need care.
- Color spaces other than OKLCH need conversion. We can lean on CSS's
  built-in `color()` function and let the browser convert at parse time.

**Verdict:** Useful in tandem with #1. Don't ship in isolation.

### 3. DTCG as the canonical theme storage format — **no**

Replacing VB's hand-written `_brand-modern.css` files with
`brand-modern.tokens.json` (and a build-step that turns them into CSS)
would:

**Pros (theoretical)**
- Single source of truth in a portable format.
- Easier for design tools to write.

**Cons (real)**
- We lose every CSS-side capability listed above (relative-color,
  `light-dark()`, `@supports`, animatable seeds). The build step would
  have to either eagerly resolve them (losing the parametric design)
  or use VB-specific extensions (defeating the interop goal).
- We're betting the framework on a draft spec the authors say "do not
  implement."
- Authoring CSS in a JSON file is worse, not better, for the human
  writing it. Tooling that converts back and forth is brittle.

**Verdict:** Hard no. CSS is the right authoring surface for VB themes.

### 4. DTCG inside `@profpowell/canvas-text` and similar stand-alones — **no**

Stand-alone components (planned: `canvas-text`, `meme-maker`) read VB
tokens via `getComputedStyle`. Whether the **source** of those tokens is
hand-written CSS or generated-from-DTCG doesn't change anything about
how they consume them. Don't introduce DTCG dependencies in these
packages.

### 5. Vanilla-press build-time token bundle — **maybe later**

Vanilla-press could publish a `vanilla-breeze.tokens.json` artifact
alongside the CSS bundles, generated at build time from the live token
state. Lets downstream consumers (Figma plugins, doc sites, CMS theme
editors) discover what tokens exist and what their values are without
parsing CSS.

**Pros**
- Discoverability for non-CSS consumers.
- Cheap to generate (same serializer as #1, run once at build).

**Cons**
- Speculative until someone wants the artifact.
- Bundle is theme-specific; either ship one per theme (50 files) or
  ship the seeds and require consumers to derive (puts them back in
  the position of needing to know VB's derivation rules).

**Verdict:** Nice if there's demand. No rush.

---

## Tooling reality check

| Tool | DTCG support |
|---|---|
| **DTCG spec** | **Stable 2025.10** (published 2025-10-28) |
| **Style Dictionary v4** | First-class DTCG support; v5 brings fuller coverage of newer composite types |
| **Tokens Studio (Figma)** | Reference implementation; reads/writes DTCG and pipes through Style Dictionary |
| **Terrazzo** | Reference implementation; joint format work with Style Dictionary |
| **Penpot** | Native DTCG export |
| **Figma** | Native variables + plugin-based DTCG (via Tokens Studio and others) |
| **Sketch, Framer** | Plugin or partial native support |
| **Knapsack, Supernova, zeroheight** | Documentation/management platforms; DTCG as canonical exchange |

The ecosystem now has a stable spec to converge on. Adopting today is
buying into a coalition that includes Adobe, Amazon, Google, Microsoft,
Meta, Salesforce, Shopify, and most major design-system platforms. The
small framework / big-coalition signal is a credibility win on top of the
direct interop value.

---

## Insights and recommendations

1. **VB's runtime token model is more capable than DTCG.** OKLCH,
   relative color, `light-dark()`, animatable seeds, `@supports`-gated
   tokens, and `contrast-color()` are CSS-native expressivity DTCG
   cannot capture. Don't sacrifice them for portability.

2. **VB's *philosophy* matches DTCG cleanly.** The
   primitive/semantic/component layering documented in
   `r-n-d/themes/review-first/token-strategy.md` is the DTCG model in
   CSS form. We were already aligned with the *intent* before DTCG
   existed.

3. **`<theme-export>` already does most of the work for an interop
   layer.** It walks scopes, filters by prefix, and emits JSON.
   Upgrading the JSON shape to DTCG is a serializer change, not an
   architecture change.

4. **The `$extensions` field is the escape hatch.** Anything VB-specific
   that doesn't fit DTCG (relative-color expressions, derivation seeds,
   theme transition timing) goes there under
   `com.vanilla-breeze.*`. Other tools preserve unknown extensions per
   spec. We get full round-trip fidelity for VB-aware consumers and
   degraded-but-correct behavior for everyone else.

5. **The interesting question is which composite types to expose.**
   DTCG's `typography` composite is conceptually nicer than VB's
   four-token spread (`--font-family`, `--font-size`, `--font-weight`,
   `--line-height`). When emitting DTCG, we could synthesize composite
   `typography`/`shadow`/`border` tokens that bundle the related
   scalars. Useful for Figma but invisible to the runtime.

6. **Import is harder than export.** Going DTCG → CSS is mostly
   straightforward except for `light`/`dark` variants (need to fold
   into `light-dark()`) and composite types (need to split). Import
   should be additive — never replace existing VB tokens, only suggest
   them in the Theme Composer.

7. **Don't bet on it for runtime — but don't hold back at the seam.**
   With stable v1 plus reference implementations across the major
   tooling vendors, the "wait and see" posture from the original draft
   of this doc is no longer the right call. Build the interop layer;
   keep the runtime CSS-native.

8. **Brand experiments are the validation set.** The
   `demos/alpenglow/themes/` brands (McDonald's, Starbucks, IBM,
   Anthropic) are hand-written CSS today, parked in demos. Promoting
   them to first-class themes via the new DTCG pipeline gives us a
   real-world round-trip test (export → DTCG → re-import → CSS) and
   proves the toolchain on something that matters.

---

## Concrete next steps

Phased plan in [dtcg-theme-pipeline-plan.md](./dtcg-theme-pipeline-plan.md).
The summary of phases:

1. DTCG export from `<theme-export>` (web, no CLI).
2. Publish all 50 themes as `.tokens.json` artifacts in `dist/cdn/themes/`.
3. DTCG importer in the Theme Composer web UI.
4. Public token-set catalog (Material, Carbon, Salesforce, GOV.UK,
   Atlassian) as importable starting points.
5. Promote `demos/alpenglow/themes/` brand experiments (McD, Starbucks,
   IBM, Anthropic) to first-class themes via the new pipeline.
6. **Future / speculative:** URL-inference service ("paste a URL, get a
   theme proposal"). Researched separately; not committed.

---

## Sources

- [DTCG draft 2025.10 — designtokens.org](https://www.designtokens.org/tr/drafts/format/)
- [Design Tokens Community Group — W3C](https://www.w3.org/community/design-tokens/)
- [Style Dictionary DTCG support docs](https://styledictionary.com/info/dtcg/)
- [Tokens Studio for Figma](https://tokens.studio/)
- VB internal: [r-n-d/themes/review-first/token-strategy.md](r-n-d/themes/review-first/token-strategy.md)
- VB internal: `src/tokens/index.css` (token fallback contract)
- VB internal: `src/web-components/theme-export/logic.js` (existing JSON serializer)
