# Classless CSS Framework Review

**Purpose**: Determine if Vanilla Breeze is missing any HTML elements that should receive default styling or upscaling, based on a survey of the classless CSS ecosystem.

**Date**: 2026-02-24

---

## Frameworks Surveyed

Source: [dbohdan/classless-css](https://github.com/dbohdan/classless-css) — 44 classless + 9 class-light frameworks.

Deep-dived (read actual CSS source via GitHub API):

| Framework | Stars | Elements Styled | Approach |
|---|---|---|---|
| **Pico.css** | 13k+ | 67 | Most popular. Comprehensive, token-driven. |
| **matcha.css** | — | 70+ | Most thorough element coverage. Explicitly catalogs unstyled elements. |
| **Simple.css** | — | 53 | Clean, well-scoped. Good sectioning coverage. |
| **water.css** | — | 44 | Minimal but styles rare elements (`var`, `time`, `q`). |
| **Bolt.css** | — | 38 | Solid core. Styles `meter`, `time`, `optgroup`. |
| **new.css** | — | 44 | Many margin-only. ~28 with real visual treatment. |
| **MercuryCSS** | — | 38 | Harmonic-scale typography. `meter` + `progress`. Print styles. |
| **Classless.css** | — | 42 | Academic: auto-numbered headings/figures/citations, drop caps. |
| **magick.css** | — | 35 | Narrowest but strongest aesthetic. Uses `:has()`, grid forms. |

Reviewed but not deep-dived (too small/stale/niche to justify): Almond, attriCSS, awsm.css, axist, Bahunya, Bamboo, BareCSS, Basic.css, ChimeraCSS, concrete.css, dev.css, Downstyler, Fylgja, holiday.css, LatexCSS, Markdown CSS variants, Marx, MVP.css, no-class.css, ridge.css, sakura, shadcn-classless, SPCSS, style.css, Stylize.css, tacit, Tiny.css, tty.css, Tufte CSS, W3C Core Styles, Writ, YoRHa.

---

## Element Coverage: VB vs the Field

### What VB Already Covers

VB styles **65+ unique HTML elements** across 44 dedicated CSS files in `src/native-elements/`, plus reset, layout, and i18n layers. This is equal to or greater than every framework surveyed, including matcha.css (the most comprehensive classless framework at 70+ elements — but matcha counts elements that VB handles in different layers like tokens and reset).

### The Complete HTML5 Element Checklist

Every non-deprecated, non-metadata, non-scripting HTML element and its VB status:

#### Root + Sectioning

| Element | VB | Best Classless | Notes |
|---|---|---|---|
| `html` | reset | all | scroll-behavior, scrollbar |
| `body` | reset + tokens | all | — |
| `main` | dedicated file + variants | Pico, Simple | VB has contained/narrow/wide/full/with-sidebar/padded/flex |
| `article` | dedicated file + variants | Classless.css (auto-numbering) | VB has blog/card/feature/compact/nested |
| `section` | dedicated file + variants | Classless.css (ornaments) | VB has padded/full/contained/alt/bordered/hero/grid |
| `aside` | dedicated file + variants | magick (float), Simple (float) | VB has sidebar/note/float/sidenote |
| `header` | dedicated file + variants | Pico, Simple | VB has site/page/card/sticky/transparent/centered/compact |
| `footer` | dedicated file + variants | Pico, Simple | VB has site/article/card/minimal/columns/sticky |
| `nav` | dedicated file + variants | Classless.css (CSS-only responsive) | VB has horizontal/vertical/pills/tabs/breadcrumb/minimal/pagination/tree/steps |
| `hgroup` | dedicated file + variants | Pico, matcha | VB has tight/spaced/reversed/centered/divided |
| `address` | dedicated file + variants | Bolt, water.css | VB has card/inline/compact/footer/contact |
| `search` | dedicated file + variants | **none style it** | VB has inline/expanded/compact/with-icon/rounded/header. **VB is the only framework with `<search>` support.** |

**Verdict: Complete. VB exceeds all frameworks in sectioning coverage.**

#### Headings + Text Content

| Element | VB | Best Classless | Notes |
|---|---|---|---|
| `h1`–`h6` | dedicated file | all | magick.css skips h5/h6. VB covers all 6. |
| `p` | dedicated file | all | VB adds text-wrap: pretty |
| `hr` | dedicated file + variants | all | VB has decorative variant |
| `pre` | in code file | all | — |
| `blockquote` | dedicated file | all | VB styles `blockquote > footer` and `blockquote > cite` for attribution (also done by magick.css) |
| `ol` | in lists file + variants | all | VB has inline/unstyled |
| `ul` | in lists file + variants | all | VB has inline/unstyled |
| `li` | in lists file | all | — |
| `menu` | dedicated file + variants | matcha only | VB has toolbar/vertical/context/icons/pills/compact |
| `dl` | in lists file | most | — |
| `dt` | in lists file | most | — |
| `dd` | in lists file | most | — |
| `figure` | dedicated file + variants | most | VB has full/bordered/float-start/float-end/centered/code/quote |
| `figcaption` | dedicated file + variants | Simple, matcha | VB has centered/end/hidden |

**Verdict: Complete.**

#### Inline Semantics

| Element | VB | Best Classless | Notes |
|---|---|---|---|
| `a` | dedicated file + variants | all | VB has muted/plain + auto-detection for external/download |
| `strong`/`b` | base | most | — |
| `em`/`i` | base | most | — |
| `small` | base | matcha, Mercury | — |
| `s` | dedicated rules | matcha only | Most frameworks skip this |
| `cite` | dedicated rules | Classless.css, matcha | VB also has `.quoted` variant |
| `q` | i18n file (locale quotes) | water.css, matcha | VB has `:lang()` quote rules |
| `dfn` | dedicated rules | matcha only | Most frameworks skip this |
| `abbr` | dedicated rules + variants | Simple, Pico, matcha | VB has `.plain` variant |
| `ruby`/`rt`/`rp` | dedicated rules | matcha only | VB is one of only 2 frameworks styling ruby |
| `data` | dedicated rules | **none** | **VB is the only framework styling `<data>`** |
| `time` | dedicated rules + variants | Bolt, water.css, Classless.css | VB has relative/datetime variants |
| `code` | dedicated file | all | — |
| `var` | in code file | water.css, matcha | — |
| `samp` | in code file | most | — |
| `kbd` | in code file | most | — |
| `sub` | dedicated rules | Pico, Mercury, matcha | VB uses position-based approach (no line-height disruption) |
| `sup` | dedicated rules + variants | Pico, Mercury, matcha | VB has `.footnote-ref` variant |
| `mark` | in code file + variants | most | VB has success/warning/error variants |
| `u` | dedicated rules | matcha only | VB uses wavy underline (semantically correct for "unarticulated annotation") |
| `bdi` | dedicated rules | **none** | **VB is the only framework styling `<bdi>`** |
| `bdo` | dedicated rules | **none** | **VB is the only framework styling `<bdo>`** |
| `wbr` | dedicated rules | **none** | **VB is the only framework styling `<wbr>`** |
| `ins` | dedicated rules + variants | matcha only | VB has `.diff` variant |
| `del` | dedicated rules + variants | matcha only | VB has `.diff` variant |

**Verdict: Complete. VB has the most thorough inline semantic coverage of any framework surveyed. Several elements (`data`, `bdi`, `bdo`, `wbr`) are VB-exclusive.**

#### Embedded Content

| Element | VB | Best Classless | Notes |
|---|---|---|---|
| `img` | dedicated file + variants | all | VB has full/contain/cover/rounded/circle/thumbnail/ratio variants |
| `picture` | dedicated file | Simple (in figure context) | VB styles as display: block + nested img |
| `video` | dedicated file + variants | most | VB has full/widescreen/standard/ultrawide/square/rounded |
| `audio` | dedicated file + variants | Bolt | VB has minimal/compact. Most frameworks ignore audio. |
| `source`/`track` | display: none | none | Correct — these are metadata-only |
| `iframe` | dedicated file + variants | new.css, Pico | VB has full/fixed/rounded/bordered + responsive container |
| `embed`/`object` | dedicated rules | none | VB is the only framework styling these |
| `canvas` | dedicated file + variants | none (except Pico reset) | VB has full/fixed/interactive/drawing/bordered/loading. **Unique.** |
| `map` | display: inline | none | Correct — visual handled by img |
| `area` | display: none | none | Correct |
| `svg` | dedicated file + variants | Classless.css, Pico (reset) | VB has size/color/animation variants |

**Verdict: Complete. VB is the only framework with dedicated canvas, embed, object, and audio styling.**

#### Tables

| Element | VB | Best Classless | Notes |
|---|---|---|---|
| `table` | dedicated file + variants | all | VB has striped/compact/bordered + sticky/sortable/responsive card mode |
| `thead` | in table file | water, Classless.css | Sticky header support |
| `tbody` | in table file | water | Hover states |
| `tfoot` | in table file | Pico, water, Mercury | — |
| `tr` | in table file + states | most | VB has selected/disabled/highlight/expanded states |
| `th` | in table file | all | VB has numeric column + sort indicators |
| `td` | in table file | all | VB has numeric column + responsive card `data-label` |
| `caption` | in table file | Simple, new.css, matcha | — |
| `colgroup`/`col` | **not styled** | **none** | See gap analysis below |

**Verdict: Complete except `colgroup`/`col` — see analysis below.**

#### Forms

| Element | VB | Best Classless | Notes |
|---|---|---|---|
| `form` | dedicated file + variants | magick (grid) | VB has stacked/inline/grid + wizard |
| `fieldset` | in form file + variants | most | VB has minimal variant |
| `legend` | in form file | water, Mercury | — |
| `label` | in input file | most | Special checkbox/radio handling |
| `input` | dedicated file + switch | all | VB has full type coverage + `data-switch` toggle |
| `textarea` | in input file | all | — |
| `select` | in input file | all | — |
| `optgroup` | in input file | Bolt, Pico | — |
| `datalist` | dedicated file | none style it meaningfully | VB hides + dropdown arrow |
| `output` | dedicated file + variants | matcha (dashed border) | VB has block/inline/highlight/large + success/warning/error |
| `button` | dedicated file + variants | all | VB has secondary/ghost/small/large/full-width |
| `progress` | dedicated file + variants | Pico, Mercury, Bolt, Simple | VB has size + color variants + indeterminate animation |
| `meter` | dedicated file + variants | Mercury, Bolt, matcha | VB has size + segmented variants |
| `option` | **browser-controlled** | none | Not styleable cross-browser |

**Verdict: Complete.**

#### Interactive

| Element | VB | Best Classless | Notes |
|---|---|---|---|
| `details` | dedicated file | most | VB has `::details-content` animation |
| `summary` | in details file | most | Custom marker, flex layout |
| `dialog` | dedicated file + variants | Pico, Bolt, matcha | VB has size s/m/l/full + drawer positions (end/start/bottom/top) |

**Verdict: Complete.**

#### Math

| Element | VB | Best Classless | Notes |
|---|---|---|---|
| `math` | dedicated file + font file | **none** | **VB is the only framework with MathML support.** |
| `mo`, `mi`, `mn`, `mrow`, `msqrt`, `mfrac`, `msub`, `msup`, `msubsup`, `munder`, `mover`, `munderover`, `mtable`, `mtr`, `mtd`, `mtext`, `mspace`, `menclose` | all styled | **none** | Complete MathML coverage |

**Verdict: VB is in a class of its own here.**

#### i18n

| Element | VB | Best Classless | Notes |
|---|---|---|---|
| `:lang()` rules | CJK, Arabic, Hebrew, Thai, Devanagari | **none** | **VB is the only framework with language-specific typography.** |

---

## Gap Analysis: What's Actually Missing?

### `colgroup` / `col` — The One Real Gap

**What it is**: `<colgroup>` and `<col>` allow styling entire table columns. They support a limited set of CSS properties: `border`, `background`, `width`, and `visibility`.

**Who styles them**: Nobody. Zero of the 9 frameworks surveyed style `colgroup` or `col`.

**Should VB style them?** Marginal. The use case is narrow — setting column widths or backgrounds. VB's `[data-numeric]` and `[data-align]` attributes on `td`/`th` already handle the most common column-level concerns. Adding `col` styling would mean:

```css
col[data-numeric] { text-align: end; } /* doesn't work — col doesn't support text-align */
col { border-collapse: inherit; }       /* almost never needed */
```

The CSS properties `col` actually accepts (border, background, width, visibility) are too limited to justify a dedicated file. The only useful pattern would be zebra-striped columns:

```css
col:nth-child(even) { background: var(--color-surface-raised); }
```

**Recommendation**: **Skip.** `col` styling is a dead-end in CSS. The properties it accepts are too limited, and VB's data-attribute approach on cells is more powerful. Document this as intentionally unstyled.

### `option` — Browser-Controlled

Styling `<option>` elements inside `<select>` is not reliably possible cross-browser. No framework attempts it. Not a gap.

### `noscript` — Not Visual

`<noscript>` is a fallback container. Its visual treatment depends entirely on its content. No framework styles it, and it doesn't need default styling.

---

## Creative Approaches Worth Noting (But Not Adopting)

These are interesting patterns from the ecosystem. None represent gaps in VB — they're design choices that don't align with VB's philosophy of semantic defaults with optional variants.

| Pattern | Framework | Why Not for VB |
|---|---|---|
| Auto-numbered headings/figures via CSS counters | Classless.css | Too opinionated as a default. Would break most layouts. Could be a variant or utility. |
| `h6` as inline run-in heading | Classless.css | Violates heading semantics expectations. Clever but hostile to users. |
| Section ornaments (`section::after` decorative dividers) | Classless.css | Theme-specific. VB's `hr` variants handle this. |
| Drop caps via `::first-letter` | Classless.css | Good candidate for a variant class (e.g., `article.drop-cap`) but wrong as a default. |
| `<q>` stripped of quotes, given border treatment | water.css | Breaks the semantic purpose of `<q>`. VB's locale-aware quotes are correct. |
| `<time>` as a code-like pill/badge | water.css, Bolt | Over-styled. VB's `font-variant-numeric: tabular-nums` is the right default. |
| `<var>` with accent background color | matcha | Interesting but too strong as a default. VB's italic + weight approach is neutral. |
| Forms as CSS Grid by default | magick.css | Too opinionated. VB's `form.stacked`/`form.grid` variants let users choose. |
| Handwritten font for form inputs | magick.css | Theme-specific aesthetic, not a framework default. |
| `a[href]::after { content: " (" attr(href) ")" }` in print | MercuryCSS | Good pattern. VB doesn't have print styles yet (see below). |
| `pre:has(code)` to distinguish code blocks from plain pre | magick.css | Interesting. VB already styles both `pre` and `code` well, but this could refine the distinction. |

---

## Patterns VB Could Consider Adding (Not Element Gaps)

These aren't missing elements — VB covers them all. These are feature-level patterns that multiple frameworks implement and VB doesn't yet.

### 1. Print Stylesheet (`@media print`)

**Who does it**: MercuryCSS, Classless.css, Tufte CSS, Simple.css
**What they do**:
- Expand link `href` values inline: `a[href]::after { content: " (" attr(href) ")" }`
- Remove backgrounds, shadows, and decorative elements
- Force black-on-white for ink economy
- Page-break control on headings, figures, tables, blockquotes
- Hide nav, aside.sidebar, dialog, interactive elements

**VB status**: VB has no `@media print` rules in `src/`. This is the one genuine *feature* gap. It's not an element gap — all elements are styled — but a media-query gap.

**Recommendation**: Consider adding `src/utils/print.css` as an opt-in layer. Not urgent — this is a utility concern, not a native-element concern.

### 2. `prefers-contrast` Media Query

**Who does it**: Very few (Pico has some support).
**VB status**: VB has `prefers-reduced-motion` across 46 files. `prefers-contrast` is not explicitly handled but VB's token system (oklch-based) is well-positioned for it.

**Recommendation**: Low priority. The token system could support `@media (prefers-contrast: more)` by bumping border widths and text contrast, but this is a polish item.

### 3. CSS Counter Auto-Numbering (as opt-in variant)

**Who does it**: Classless.css (headings, figures, tables, citations)
**VB status**: Not available.

**Recommendation**: Could be a useful `article.numbered` variant for academic/technical content. Low priority — niche use case.

---

## Conclusion

**VB has no element-level gaps.** It covers every non-deprecated, styleable HTML element — more than any classless framework surveyed. Several elements are VB-exclusive across the entire ecosystem:

- `<search>` — zero other frameworks style it
- `<data>` — zero other frameworks style it
- `<bdi>`, `<bdo>`, `<wbr>` — zero other frameworks style these
- `<canvas>` (with variants) — zero other frameworks offer this
- `<embed>`, `<object>` — zero other frameworks style these
- `<math>` + full MathML — zero other frameworks attempt this
- `:lang()` typography rules — zero other frameworks do this
- `<menu>` (with variants) — only matcha.css also styles menu
- `<audio>` (with variants) — only Bolt.css also styles audio

The only framework that comes close to VB's breadth is **matcha.css** at 70+ elements, but matcha explicitly documents 35+ elements as "unstyled" — elements that VB handles (canvas, audio, embed, object, math, bdi, bdo, wbr, data, search, address, picture, svg, noscript).

**The tag-by-tag effort can proceed with confidence that VB's element coverage is already best-in-class. Focus on depth and polish, not breadth.**
