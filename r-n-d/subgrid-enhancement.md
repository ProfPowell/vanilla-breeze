# leverage-subgrid.md

A compact spec for using **CSS Subgrid** effectively (especially for code-generating LLM tools that underuse modern CSS).  Vanilla Breeze may or may not be leveraging subgrid well enough, this specification is intended to help.

## Goal

Use **CSS Subgrid** to keep layouts **aligned across nested DOM structure** (semantic HTML, reusable components, and “cards inside grids”) without duplicating track definitions or resorting to brittle hacks.

Subgrid lets a nested grid **inherit the parent grid’s track sizing** (rows and/or columns), so the grandchildren can line up with siblings elsewhere in the parent grid.

---

## Major reasons to use CSS Subgrid

### 1) Keep semantic HTML *and* keep alignment
Sometimes the markup you *should* write (e.g., `<ul><li>…</li></ul>`, `<figure><figcaption>…</figcaption></figure>`, nested components) breaks a “flat-grid-only” approach. Subgrid lets you keep semantic groupings while still allowing inner elements to participate in the outer grid’s rhythm.

**Smell this avoids:** “Flatten the DOM so the grid works” / “wrap everything in divs so it aligns”.

---

### 2) Align repeated UI patterns across many components
If you have a parent grid of cards, and each card is its own grid, the internal columns can drift because each card’s track sizing is independent. Subgrid lets every card share the same underlying column (and/or row) structure so edges line up.

**You get:** cleaner, more consistent UIs without brittle pixel math.

---

### 3) Make “featured” items and mixed-content layouts line up with the global grid
Common layout: a global multi-column grid, plus a “featured card” that spans multiple columns and has its own internal layout (thumbnail + content). With subgrid, the featured item’s internal pieces can snap to the global grid lines.

---

### 4) Equalize/align headings and sections in multi-column footers and nav blocks
Footers often have multiple columns where the heading heights vary; without subgrid, lists under headings can start at different vertical positions. With subgrid rows, you can make each footer column span the same rows, aligning headings and subsequent content cleanly.

---

### 5) Reduce duplication + improve maintainability
Without subgrid, you often repeat the same `grid-template-columns` across parent and child components, which becomes error-prone during redesigns. Subgrid centralizes the “source of truth” for tracks in the parent.

---

## When to reach for subgrid (decision rule)

Use subgrid when **both** are true:

1. You need a grid **inside** a grid (nested structure / reusable component / semantic wrapper), **and**
2. The inner layout must **share track sizing** with the outer layout (things must line up across boundaries).

If the nested grid does *not* need to share track sizing, use a normal nested grid (or flex) instead.

---

## Syntax essentials (LLM-friendly)

### Parent grid (defines the tracks)
- `display: grid;`
- `grid-template-columns` / `grid-template-rows`

### Child becomes a subgrid (inherits tracks)
- child must be `display: grid;`
- `grid-template-columns: subgrid;` and/or `grid-template-rows: subgrid;`
- child usually needs `grid-column` / `grid-row` to define *which portion* of the parent grid it inherits.

---

## Examples

### Example 1: Semantic list inside a grid (UL/LI) that still aligns to parent tracks

**Use-case:** You want a sidebar + a grid of items, but items should be a real list.

```html
<div class="layout">
  <header class="intro">
    <h1>My Portfolio</h1>
    <p>Some description…</p>
  </header>

  <ul class="thumbs">
    <li><img alt="" src="a.jpg"></li>
    <li><img alt="" src="b.jpg"></li>
    <li><img alt="" src="c.jpg"></li>
    <li><img alt="" src="d.jpg"></li>
    <li><img alt="" src="e.jpg"></li>
    <li><img alt="" src="f.jpg"></li>
  </ul>
</div>

```css
.layout {
  display: grid;
  grid-template-columns: 16rem 1fr 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 1rem;
}

.intro {
  grid-row: 1 / 3; /* sidebar spans both rows */
}

.thumbs {
  /* occupy the right side of the parent grid */
  grid-column: 2 / 5;
  grid-row: 1 / 3;

  /* become a subgrid */
  display: grid;
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;

  list-style: none;
  padding: 0;
  margin: 0;
}

.thumbs > li {
  /* each li can now land in a parent-aligned cell */
}
```
Why this matters: You get semantic grouping and true grid participation.

⸻

Example 2: Featured card that aligns its internals to the global grid

Use-case: Global grid has 5 columns. Featured card spans columns 2–4 and its thumbnail/content should align to those same columns.

```html
<section class="section">
  <article class="card card--featured">
    <div class="card__content">…</div>
    <div class="card__thumb">…</div>
  </article>
</section>
```
```css
.section {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
}

.card--featured {
  grid-column: 2 / 5;   /* choose the region of the parent grid */
  display: grid;
  grid-template-columns: subgrid; /* inherit those columns */
}

.card--featured .card__thumb {
  grid-column: 2 / 4; /* snaps to inherited lines */
}
```

Why this matters: internal alignment is now driven by the parent grid lines.

⸻

Example 3: Footer columns where headings align and lists start consistently

Use-case: Footer has multiple columns; one heading wraps onto two lines. You want all headings to “reserve the same row height” so lists beneath start aligned.

```html
<footer class="site-footer">
  <div class="footer-grid">
    <section class="footer-col">
      <h2>Short</h2>
      <ul>…</ul>
    </section>

    <section class="footer-col">
      <h2>A much longer heading that wraps</h2>
      <ul>…</ul>
    </section>

    <section class="footer-col">
      <h2>Medium</h2>
      <ul>…</ul>
    </section>
  </div>
</footer>
```
```css
.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 2rem;

  /* implicit rows: row 1 for headings, row 2 for lists */
}

.footer-col {
  grid-row: span 2; /* each column spans both implicit rows */
  display: grid;
  grid-template-rows: subgrid; /* inherit the shared row sizing */
  gap: 1rem;
}
```

Why this matters: all columns share row sizing, so the list blocks align.

⸻

Gotchas and constraints (important for LLM-generated CSS)
1.	Subgrid inherits track sizing, but line numbers get re-indexed

	•	Inside a subgrid, inherited lines typically start again at 1, even if you subgrid columns 2–5 from the parent.
	•	Prefer named grid areas for clarity when useful.

	2.	Be careful with “unknown number of rows”

	•	Subgridding rows can be tricky when content is dynamic and you don’t know row count ahead of time.

	3.	Some fluid/auto-fill grid patterns can be incompatible

	•	Subgrid may not behave the way you expect with certain “fluid grid” recipes (like repeat(auto-fill, minmax(...))) depending on the scenario.

	4.	Use progressive enhancement

	•	Provide a reasonable fallback with feature queries so older/limited browsers still get a good experience.

```css
@supports not (grid-template-columns: subgrid) {
  /* fallback: use a simpler internal layout */
  .thumbs,
  .card--featured {
    grid-template-columns: 1fr;
  }
}
```

Output requirements for an LLM coding tool

When generating layout code:
•	Prefer semantic wrappers (e.g., <ul>, <figure>, <section>) and use subgrid instead of flattening markup.
•	Keep the “source of truth” for tracks in the parent grid.
•	Only apply subgrid to the axis that needs shared alignment (columns, rows, or both).
•	Always include a @supports not (...) fallback when the UI is public-facing or must be robust.
•	Avoid duplicating track definitions unless you explicitly want divergence.

⸻

Summary

Use subgrid to:
•	preserve semantic structure,
•	keep alignment consistent across nested UI,
•	reduce duplicated grid templates,
•	enable “global grid rhythm” across components.