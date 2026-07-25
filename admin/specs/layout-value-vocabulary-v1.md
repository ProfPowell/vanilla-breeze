# Layout Value Vocabulary v1

> **Status:** adopted, 2026-07-25
> **Owner:** VB project
> **Decides:** `vanilla-breeze-x1yl`
> **Related:** [`syntax.md`](../reference/syntax.md) (the public attribute catalog), [`component-state-conventions.md`](./component-state-conventions.md) (the sibling contract for state attributes).
> **Sequences before:** `vanilla-breeze-aoku` (layout fork merge), `vanilla-breeze-qoi8` (layout api.json + doc pages).

Layout attribute values are a **closed, named vocabulary**. Raw lengths are not part of the HTML API. A documented custom property provides the escape hatch for genuine one-offs, and a conformance rule rejects anything outside the vocabulary.

## The problem this closes

Layout lengths were hand-enumerated attribute selectors:

```css
[data-layout="grid"][data-layout-min="15rem"] { --_min: 15rem; }
[data-layout="grid"][data-layout-min="200px"] { --_min: 200px; }
/* …14 of these on grid alone */
```

Any value not on the list silently falls back to the default. No error, no warning, no visual clue that the attribute did nothing. An audit of 4,655 `data-layout-*` usages across 1,512 files found **148 silent no-ops** in four distinct classes:

| Class | Count | Examples |
|---|---|---|
| Keyword typos | ~44 | `justify=flex-end`, `max=readable`, `side=right` |
| Raw lengths off the enum | ~58 | `min=220px` (15×), `min=14rem` (6×), `min=180px` (6×) |
| Values belonging to another enum | ~30 | `ratio=1:1`, `4:3`, `16:9` |
| Wrong attribute name entirely | ~10 | `min-width=280px`, `columns=auto-fit`, `sidebar=collapsed` |

The docs made this worse rather than better. `syntax.md:741` describes the vocabulary as `` `6rem`…`25rem`, `150px`…`400px` `` and elsewhere as "Various rem/px values". The ellipsis reads as a range; it is a discrete list of 14. **The API looked open and was closed, and nothing told the author which.**

## Why closed-and-named, not open

Three models were considered.

**Open (any length).** Rejected as the primary model. The native mechanism — `attr(data-layout-min type(<length>))` — is [Chrome-only and explicitly not Baseline](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/attr); Firefox and Safari do not support typed `attr()`. So "open" has to route through a custom property anyway, and once every value is bespoke there is no consistency pressure left: `14rem`, `220px` and `15rem` coexist forever, and conformance can only ask "is this a length", never "is this a sanctioned length".

**Tiered (both first-class).** Rejected. Two mechanisms to document, teach and test, and the raw-length path becomes the default in practice because it is the path of least resistance when you already know the pixel value you want.

**Closed and named (adopted).** Decisive factor: **7 of the 10 length-taking layout attributes were already tokenized** — `max`, `gap`, `padding`, `margin`, `item-width`, `sidebar-width` and `measure` all use named values today. Only `min`, `threshold` and `content-min` still took raw lengths. This is not a redesign; it finishes one that was already most of the way done. VB is pre-release, so the migration is cheap now and grows with the corpus (see `project_prerelease.md`).

## The vocabulary

The t-shirt scale, matching `gap` / `padding` / `margin` / `item-width` and `--size-*` itself. Values sit on the existing usage clusters so most migrations are exact.

| Attribute | Context | `xs` | `s` | `m` (default) | `l` | `xl` |
|---|---|---|---|---|---|---|
| `data-layout-min` | grid — column minimum | `8rem` | `10rem` | `15rem` | `20rem` | `25rem` |
| `data-layout-min` | cover — block minimum | — | `50vh` | `70vh` | `80vh` | `100dvh` |
| `data-layout-threshold` | switcher breakpoint | — | `25rem` | `30rem` | `40rem` | — |
| `data-layout-content-min` | sidebar content floor | — | `40%` | `50%` | `60%` | — |

### Behavioral keywords are not scale points

`auto` remains valid on `data-layout-min` (cover) and `data-layout-item-width`. It means "no constraint", which is not a point on a size scale — there is nowhere on `xs…xl` for it to go.

`full` likewise stays distinct where it exists. On `item-width` it already coexists with `xl` and means something different: `full` is `inline-size: 100%` (fill the container), `xl` is `30rem` (a size). Folding one into the other would lose a behavior.

The scale is **per-attribute contextual**, as it already is elsewhere in the system: `item-width="m"` is `20rem` while grid `min="m"` is `15rem`, exactly as `--size-m` and `--content-normal` are both "medium" at different magnitudes. `m` means "the middle of this attribute's range", not a global constant.

### `xl` on cover is `100dvh`, not `100vh`

26 usages currently say `min=100vh`; they migrate to `xl`, which resolves to `100dvh`. This is a deliberate behavior change and a fix: `dvh` accounts for mobile browser chrome, so covers stop being cropped on phones. It will move pixels and requires visual-baseline review. `100vh`, `100svh` and `100dvh` all currently exist as separate enum entries; the vocabulary keeps one.

## The escape hatch

Public custom properties: `--layout-min`, `--layout-threshold`, `--layout-content-min`. An explicit author value beats the token:

```css
layout-grid, [data-layout="grid"] {
  --_min: var(--layout-min, var(--_min-token, 15rem));
  grid-template-columns: repeat(auto-fit, minmax(var(--_min), 1fr));
}

[data-layout-min="m"] { --_min-token: 15rem; }
```

Usage — deliberately less convenient than a token, so it stays the exception:

```html
<section data-layout="grid" style="--layout-min: 220px">
```

### `vb/no-inline-style` must be amended

That rule is **error** severity today and its message reads *"Move inline styles to CSS. Use data-\* attributes for dynamic values."* — it would reject the escape hatch on arrival, while pointing authors at the attribute that cannot take their value.

Amendment: permit a `style` attribute whose declarations are **all** custom properties. Setting a custom property passes a value into a documented CSS contract; it is not styling. A `style` attribute mixing custom properties with real declarations stays an error.

## The conformance rule

New rule `vb/layout-attr-value`: flag any `data-layout-*` value outside the vocabulary. This is the highest-leverage part of the change — it catches all four failure classes, including the wrong-attribute-name cases that no amount of enum work would ever fix.

**The vocabulary is extracted from the CSS at lint time, not hand-maintained.** A second copy of this list is a second thing to drift, which is precisely the failure `vanilla-breeze-zccp` just spent a batch eliminating from the JS entry points. The rule parses `data-layout-*="…"` selectors out of `layout-attributes.css` and `layout-*/styles.css` and validates usage against what it finds.

Severity is **error**, matching `no-inline-style`. It can only go to error once the migration lands, since it would otherwise flag all 148 existing violations on day one.

## Scope boundaries

- The keyword typos (`flex-end` → `end`, `readable` → `prose`, `side=right` → `end`) are `vanilla-breeze-f16e`, not this spec. They land in the same batch because the conformance rule needs them cleared.
- `ratio=1:1` / `4:3` / `16:9` are a *missing enum entry* problem, not a vocabulary-model problem. Handle under `f16e` or a follow-up; `1:1` in particular is a trivial addition.
- Attribute-name consistency (prefixes, `sidebar-width` default, gap vocabulary) is `vanilla-breeze-vqw8`.
- Scale-naming unification across the whole token system (`s/m/l` vs `sm/md/lg`) is `vanilla-breeze-j1hi`. This spec commits layout to the t-shirt scale; if `j1hi` later renames the scale globally, layout follows it.

## Sequencing

1. `f16e` — keyword typo migration (mechanical).
2. **This spec** — token vocabulary, enum deletion, escape hatch, `no-inline-style` amendment.
3. `vb/layout-attr-value` at error severity, once 1 and 2 leave it green.
4. `aoku` — the element/attribute fork merge, which then collapses the *final* selector shape instead of merging raw-length enums it is about to delete.
5. `qoi8` — layout `api.json` + doc pages, documenting the settled vocabulary.

`syntax.md:741` and `syntax.md:1344` must be corrected as part of step 2 — the misleading ellipsis is what taught authors the API was open.
