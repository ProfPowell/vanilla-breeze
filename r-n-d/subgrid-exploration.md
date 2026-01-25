# Subgrid Exploration

## Overview

Create before/after demos comparing traditional approaches with CSS subgrid to evaluate whether subgrid can reduce code complexity in Vanilla Breeze components.

## What is Subgrid?

Subgrid allows nested grid items to participate in their parent's grid tracks, enabling alignment across nested structures.

```css
.parent {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
}

.child {
  display: grid;
  grid-template-columns: subgrid; /* Inherit parent's columns */
  grid-column: span 3;
}
```

## Browser Support

Subgrid is Baseline 2023 - safe to use.

| Browser | Version |
|---------|---------|
| Chrome | 117+ |
| Firefox | 71+ |
| Safari | 16+ |
| Edge | 117+ |

## Demo 1: Card Grid Alignment

### Problem
Cards in a grid with varying content heights have misaligned headers and footers.

### Before (Current Approach)

```html
<div data-layout="grid" data-min="300px">
  <semantic-card>
    <header><h3>Short Title</h3></header>
    <section>Content varies in length...</section>
    <footer><button>Action</button></footer>
  </semantic-card>
  <semantic-card>
    <header><h3>Much Longer Card Title Here</h3></header>
    <section>Different content...</section>
    <footer><button>Action</button></footer>
  </semantic-card>
</div>
```

```css
/* Current: Each card manages its own grid independently */
semantic-card {
  display: grid;
  grid-template-rows: auto 1fr auto; /* Forces alignment within card */
}
```

**Limitation:** Headers don't align across cards if one title wraps.

### After (Subgrid Approach)

```css
/* Parent grid defines row tracks */
[data-layout="card-grid"] {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  /* Define row template for card structure */
  grid-auto-rows: auto 1fr auto;
  gap: var(--size-m);
}

/* Cards span 3 rows and use subgrid */
[data-layout="card-grid"] > semantic-card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
}
```

**Benefit:** All card headers align, all footers align, regardless of content length.

### Demo File: `docs/examples/demos/subgrid-cards.html`

---

## Demo 2: Form Field Alignment

### Problem
Form labels and inputs don't align across different field groups.

### Before (Current Approach)

```html
<form data-layout="stack">
  <fieldset>
    <legend>Personal Info</legend>
    <div class="field">
      <label>Full Name</label>
      <input type="text">
    </div>
    <div class="field">
      <label>Email Address</label>
      <input type="email">
    </div>
  </fieldset>
  <fieldset>
    <legend>Address</legend>
    <div class="field">
      <label>Street</label>
      <input type="text">
    </div>
    <div class="field">
      <label>City</label>
      <input type="text">
    </div>
  </fieldset>
</form>
```

```css
/* Current: Labels have fixed/max width */
.field {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--size-s);
}
```

**Limitation:** Fixed label width doesn't adapt to content; labels can truncate or waste space.

### After (Subgrid Approach)

```css
form[data-layout="form-grid"] {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--size-m) var(--size-s);
}

form[data-layout="form-grid"] fieldset {
  display: grid;
  grid-column: span 2;
  grid-template-columns: subgrid;
  gap: var(--size-s);
}

form[data-layout="form-grid"] .field {
  display: grid;
  grid-column: span 2;
  grid-template-columns: subgrid;
}
```

**Benefit:** Label column auto-sizes to longest label; all labels align across fieldsets.

### Demo File: `docs/examples/demos/subgrid-form.html`

---

## Demo 3: Definition Lists

### Problem
`<dl>` with `<dt>`/`<dd>` pairs don't align consistently.

### Before (Current Approach)

```html
<dl data-layout="grid">
  <dt>Term</dt>
  <dd>Definition text here</dd>
  <dt>Longer Term</dt>
  <dd>Another definition</dd>
</dl>
```

```css
/* Current: grid on dl, manual column placement */
dl[data-layout="grid"] {
  display: grid;
  grid-template-columns: max-content 1fr;
}
```

**Limitation:** Works for simple cases but breaks with grouped dt/dd or multiple dd per dt.

### After (Subgrid Approach)

```css
dl[data-subgrid] {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--size-s) var(--size-m);
}

/* Wrapper div for dt/dd pairs (needed for grouping) */
dl[data-subgrid] > div {
  display: grid;
  grid-column: span 2;
  grid-template-columns: subgrid;
}
```

**Benefit:** Consistent alignment even with wrapped `<div>` groupings (which HTML5 allows in `<dl>`).

### Demo File: `docs/examples/demos/subgrid-dl.html`

---

## Demo 4: Nested Article Layout

### Problem
Article with aside where article content and aside should share a baseline grid.

### Before (Current Approach)

```html
<main>
  <article>
    <header>Article Title</header>
    <p>Content paragraph...</p>
    <p>Another paragraph...</p>
  </article>
  <aside>
    <h4>Related</h4>
    <ul>...</ul>
  </aside>
</main>
```

```css
main {
  display: grid;
  grid-template-columns: 1fr 300px;
}
/* Article and aside are independent - no shared rhythm */
```

### After (Subgrid Approach)

```css
main[data-subgrid] {
  display: grid;
  grid-template-columns: 1fr 300px;
  /* Implicit rows with consistent sizing */
}

main[data-subgrid] > article {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 4; /* Number of content rows */
}

main[data-subgrid] > aside {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 4;
}
```

**Benefit:** Article sections and aside sections align on shared row grid.

### Demo File: `docs/examples/demos/subgrid-article.html`

---

## Implementation Plan

### Phase 1: Create Demo Files

Create 4 demo HTML files showing before/after:
1. `docs/examples/demos/subgrid-cards.html`
2. `docs/examples/demos/subgrid-form.html`
3. `docs/examples/demos/subgrid-dl.html`
4. `docs/examples/demos/subgrid-article.html`

Each demo should have:
- Side-by-side "before" and "after" examples
- Code snippets showing the CSS difference
- Visual indication of alignment (debug grid lines)

### Phase 2: Evaluate Results

After creating demos, evaluate:
- [ ] Does subgrid meaningfully reduce CSS complexity?
- [ ] Are the alignment benefits visible and valuable?
- [ ] Any edge cases where subgrid causes problems?
- [ ] Performance implications?

### Phase 3: Decide on Integration

Based on evaluation:
- **If beneficial:** Add `[data-subgrid]` utilities to layout-attributes.css
- **If marginal:** Document as optional technique, don't add to core
- **If problematic:** Document findings, skip integration

## Proposed Utilities (if approved)

```css
/* src/custom-elements/layout-attributes.css additions */

/* Subgrid column inheritance */
[data-subgrid="cols"] {
  display: grid;
  grid-template-columns: subgrid;
}

/* Subgrid row inheritance */
[data-subgrid="rows"] {
  display: grid;
  grid-template-rows: subgrid;
}

/* Subgrid both axes */
[data-subgrid="both"] {
  display: grid;
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;
}
```

## Testing Checklist

- [ ] All 4 demos render correctly
- [ ] Alignment benefits are clearly visible
- [ ] Responsive behavior preserved
- [ ] Works in Chrome, Firefox, Safari
- [ ] No regressions in existing demos
- [ ] Document any gotchas discovered

## Success Criteria

1. At least 2 of 4 demos show clear complexity reduction
2. No significant drawbacks discovered
3. Clear documentation of when to use subgrid vs alternatives
4. Decision on whether to add to core or keep as documentation

## References

- [MDN: Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid)
- [CSS-Tricks: Subgrid](https://css-tricks.com/css-subgrid/)
- [Baseline status](https://caniuse.com/css-subgrid)
