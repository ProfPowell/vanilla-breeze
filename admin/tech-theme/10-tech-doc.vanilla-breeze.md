---
title: Technical Order — vanilla-breeze Dialect Tokens & Document Tier
description: The pure-CSS document components (memo, docs page, RFC, changelog, index, incident) and the dialect token bundles that retune them.
author: handoff for Claude Code
date: 2026-05-29
tags:
  - vanilla-breeze
  - css
  - technical-order
  - documents
---

# Technical Order — vanilla-breeze Dialect Tokens & Document Tier

The large, cheap half of the family: **dialect token bundles** plus a set of **pure-CSS document components**. No SVG, no JS. Covers memo, documentation page, RFC/spec, changelog, index, and incident report — all real website content types.

Depends on [bg-wc technical surfaces](./30-tech-surfaces.bg-wc.md).

## Table of contents

- [Dialect tokens](#dialect-tokens)
- [Document API grammar](#document-api-grammar)
- [Shared chrome](#shared-chrome)
- [Components](#components)
- [Marginalia (the sidenote pattern)](#marginalia-the-sidenote-pattern)
- [Files to add or edit](#files-to-add-or-edit)
- [Acceptance criteria](#acceptance-criteria)
- [Clangs](#clangs)

## Dialect tokens

Each dialect is a `[data-theme]` block setting a small token contract that every document component reads. Ship as lazy theme bundles.

```css
/* contract every component reads */
:root{
  --doc-bg: #fbfbf8; --doc-ink: #141414; --doc-soft: #555; --doc-accent: oklch(0.55 0.21 28);
  --doc-rule: #141414; --doc-line: 1px;
  --doc-head: "Archivo", system-ui, sans-serif;
  --doc-body: "Share Tech Mono", ui-monospace, monospace;
  --doc-title: "Michroma", sans-serif;
}
[data-theme="techorder"]{ /* defaults above */ }
[data-theme="nasa"]{ --doc-bg:#fff; --doc-ink:#1a1a1a; --doc-title:"Archivo"; }
[data-theme="blueprint"]{ --doc-bg:#15356b; --doc-ink:#eaf2ff; --doc-soft:#aecbff; --doc-rule:#eaf2ff;
  --doc-head:"Share Tech Mono"; --doc-title:"Share Tech Mono"; }
[data-theme="vellum"]{ --doc-bg:oklch(0.9 0.04 92); --doc-ink:oklch(0.34 0.04 70); --doc-rule:currentColor; }
[data-theme="control"]{ --doc-bg:#07100f; --doc-ink:oklch(0.86 0.16 150); --doc-accent:oklch(0.8 0.2 25);
  --doc-rule:oklch(0.7 0.18 150 / .5); --doc-head:"Share Tech Mono"; --doc-title:"Share Tech Mono"; }
```

Components reference only `--doc-*`, never literal colors, so a dialect swap is a token swap.

## Document API grammar

```bnf
<doc>        ::= <element class="doc" [data-theme]>
<band>       ::= .docband ( .tm , .h , .to )        ; control band: TM no, title, TO code
<title>      ::= .doctitle [ .docsub ]
<chapter>    ::= .chap                               ; "CHAPTER I · SURFACES"
<article>    ::= .art                                ; "ARTICLE 1 — DEFINITION"
<clause>     ::= .cl ( .num , <text> [ <sup> ] )     ; hanging numbered paragraph
<sidenote>   ::= <aside class="sidenote">            ; floats into the right gutter
<leaders>    ::= .lead ( <label> , .d , <value> )    ; dot-leader row
<table>      ::= .conf  | .meta                       ; conformance / metadata grid
<stamp>      ::= .stamp                               ; rotated rubber stamp
<keyword>    ::= .kw                                  ; RFC-2119 MUST/SHOULD/MAY
<rev>        ::= .revtri | .tag(.t-add|.t-fix|.t-chg|.t-dep)
<footer>     ::= .docfoot ( form , retention , sheet )
```

## Shared chrome

The pieces every document reuses. All read `--doc-*`.

```css
.doc{ background:var(--doc-bg); color:var(--doc-ink); border:2px solid var(--doc-rule);
  padding:18px 22px; font-family:var(--doc-head); }
.docband{ display:flex; justify-content:space-between; align-items:flex-start;
  border-bottom:var(--doc-line) solid var(--doc-rule); padding-bottom:8px; }
.docband .tm{ font-family:var(--doc-body); font-size:9px; color:var(--doc-soft); letter-spacing:.06em; }
.docband .h{ font-weight:800; font-size:14px; letter-spacing:.12em; }
.docband .to{ font-family:var(--doc-body); font-size:12px; }

.body{ font-family:var(--doc-body); font-size:12px; line-height:1.72; text-align:justify; }
.cl{ display:flex; gap:8px; margin:0 0 8px; } .cl .num{ flex:none; }
.chap{ font-family:var(--doc-head); font-weight:800; font-size:12px; letter-spacing:.16em;
  text-transform:uppercase; border-bottom:var(--doc-line) solid var(--doc-rule); padding-bottom:3px; margin:16px 0 4px; }
.art{ font-family:var(--doc-body); font-size:10px; letter-spacing:.16em; color:var(--doc-accent); margin:12px 0 4px; }

.lead{ display:flex; align-items:baseline; gap:6px; font-family:var(--doc-body); font-size:11px; }
.lead .d{ flex:1; border-bottom:1.5px dotted currentColor; opacity:.5; transform:translateY(-3px); }

.stamp{ display:inline-block; border:2px solid var(--doc-accent); color:var(--doc-accent);
  font-family:var(--doc-head); font-weight:800; font-size:13px; letter-spacing:.12em; padding:5px 11px;
  border-radius:4px; transform:rotate(-7deg); opacity:.82; mix-blend-mode:multiply; }
.kw{ font-family:var(--doc-body); font-weight:700; background:var(--doc-ink); color:var(--doc-bg); padding:0 4px; }
.docfoot{ display:flex; justify-content:space-between; font-family:var(--doc-body); font-size:9px;
  color:var(--doc-soft); border-top:var(--doc-line) solid var(--doc-rule); margin-top:14px; padding-top:6px; }
```

## Components

Each is a thin composition over the shared chrome. Implement and demo all six.

| Component | Markup root | Adds |
|-----------|-------------|------|
| **Memo** | `.doc` | `.meta` TO/FROM grid, `.stamp`, `.lead` distribution |
| **Documentation page** | `.doc` | `.chap` / `.art` / `.cl` numbering + `<aside class="sidenote">` |
| **RFC / Spec** | `.doc` | `.rfcstat` status grid, `.kw` keywords, `.conf` conformance table |
| **Changelog** | `.doc` | `.ver` blocks, `.tag` (add/fix/chg/dep), `.revtri` |
| **Index** | `.doc` | `.lead` dot-leader contents with doc numbers |
| **Incident** | `.doc[data-theme="control"]` | severity chip, timeline (`::before` dots), status lamps |

Ruled grids (`.meta`, `.rfcstat`, `.conf`) follow one pattern: 1px cells, a dark header cell with `--doc-bg` text. The timeline is a left-bordered column with `::before` lamp dots. Keep them token-driven so `control` re-tones them automatically.

## Marginalia (the sidenote pattern)

Tufte-style float sidenotes into a right gutter; the body carries a `<sup>` ref.

```css
.withnotes{ padding-right:200px; position:relative; }
.sidenote{ float:right; clear:right; width:172px; margin-right:-192px;
  font-family:var(--doc-body); font-size:9.5px; line-height:1.55; color:var(--doc-soft);
  border-left:2px solid var(--doc-accent); padding-left:9px; text-align:left; }
sup{ font-family:var(--doc-body); color:var(--doc-accent); font-size:9px; }

@media (max-width:640px){
  .withnotes{ padding-right:0; }
  .sidenote{ float:none; width:auto; margin:8px 0; }   /* inline footnote fallback */
}
```

> ⚠️ **Warning:** `float`/`clear:right` places notes in flow order, so two notes near the same line stack and can drift below their reference. Keep notes short; the breakpoint fallback above is required, not optional.

## Files to add or edit

```text
vanilla-breeze/
  src/themes/techorder.css … control.css   # NEW — dialect token bundles (lazy)
  src/tech-doc.css                          # NEW — shared chrome + components (this doc)
  src/<layers entry>.css                    # @import into the document @layer
  demos/tech-documents.html                 # NEW — all six, plus a techorder→blueprint toggle
  docs/tech-order.md                         # NEW — authoring guide + dialect table
```

## Acceptance criteria

- [ ] All six components render with zero JS in `techorder`.
- [ ] Toggling `data-theme` (techorder → blueprint → control) retones the same markup; components read only `--doc-*`.
- [ ] Incident report under `control` reuses the same timeline/lamp/severity markup, no duplicate CSS.
- [ ] Sidenotes float in the gutter ≥640px and become inline footnotes below it.
- [ ] RFC keywords (`MUST`/`SHOULD`) and conformance rows render; dot-leader index aligns values right.
- [ ] No literal colors in component CSS — only tokens.

## Clangs

- **Justified mono can open rivers.** OCR justification is authentic but loosens on narrow columns; cap line length (~70ch) or switch to left-aligned below a width.
- **Stamp uses `multiply`.** On the `control` dark dialect, `multiply` darkens to nothing — switch the stamp to `screen`/outline there (token it).
- **`.meta` four-column grid wraps awkwardly on mobile.** Provide a 2-column fallback under ~480px.
- **Numbered clauses aren't a real `<ol>`.** For semantics/AT, prefer `<ol>` with CSS counters where the numbering is structural; use `.cl` only where authors hand-number (e.g. "1.1").
