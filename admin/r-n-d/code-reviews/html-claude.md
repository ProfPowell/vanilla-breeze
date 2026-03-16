# HTML Upscaling Ideas

> Closing gaps, adding features, and improving native HTML elements from a markup-first perspective.

**Last updated:** 2026-02-23


---

### 5. `<progress>` Multi-Step Indicator

A progress bar showing discrete steps rather than a continuous fill. Uses the native `<progress>` element with CSS to show step markers.

```html
<!-- 3 of 5 steps complete -->
<progress class="steps" value="3" max="5">Step 3 of 5</progress>
```

```css
progress.steps {
  appearance: none;
  block-size: var(--size-xs);
  inline-size: 100%;
  border-radius: var(--radius-s);
  background:
    repeating-linear-gradient(
      to right,
      transparent,
      transparent calc(20% - 2px),
      var(--color-surface) calc(20% - 2px),
      var(--color-surface) 20%
    ),
    var(--color-border);
}

progress.steps::-webkit-progress-bar {
  background: inherit;
  border-radius: var(--radius-s);
}

progress.steps::-webkit-progress-value {
  background: var(--color-interactive);
  border-radius: var(--radius-s) 0 0 var(--radius-s);
}

progress.steps::-moz-progress-bar {
  background: var(--color-interactive);
  border-radius: var(--radius-s) 0 0 var(--radius-s);
}
```

**Effort:** CSS-only | **Value:** Medium — checkout flows, onboarding, wizards.

---

### 6. `<fieldset>` Collapsible Sections

Combine `<fieldset>` with `<details>` for collapsible form sections. Pure HTML, no JS.

```html
<form class="stacked">
  <details open>
    <summary>Shipping Address</summary>
    <fieldset class="minimal">
      <label>Street <input type="text" name="street" required></label>
      <label>City <input type="text" name="city" required></label>
    </fieldset>
  </details>

  <details>
    <summary>Billing Address</summary>
    <fieldset class="minimal">
      <label>Street <input type="text" name="billing-street"></label>
      <label>City <input type="text" name="billing-city"></label>
    </fieldset>
  </details>
</form>
```

No new CSS needed — `<details>` and `<fieldset class="minimal">` already exist. This is a **documented pattern** opportunity, not a CSS addition. Worth a snippet or section on the fieldset doc page showing the composition.

**Effort:** Documentation only | **Value:** Medium — long forms with logical sections.

---


### 9. `<abbr data-expand>` — Inline Definition Toggle

`<abbr>` shows a dotted underline and a hover tooltip via `title`. But on mobile there's no hover, and the title tooltip is often missed. An expandable inline definition fixes both.

```html
<p>
  The <abbr data-expand title="Web Content Accessibility Guidelines">WCAG</abbr>
  define success criteria for accessible content.
</p>
```

On first click/tap, expands inline: "The **WCAG (Web Content Accessibility Guidelines)** define success criteria..."

On second click or after a timeout, collapses back to the abbreviation.

```js
function initExpandableAbbr() {
  for (const abbr of document.querySelectorAll('abbr[data-expand]')) {
    if (!abbr.title) continue;

    abbr.style.cursor = 'pointer';
    abbr.setAttribute('role', 'button');
    abbr.setAttribute('tabindex', '0');

    const short = abbr.textContent;
    const full = `${short} (${abbr.title})`;
    let expanded = false;

    function toggle() {
      expanded = !expanded;
      abbr.textContent = expanded ? full : short;
      abbr.setAttribute('aria-expanded', expanded);
    }

    abbr.addEventListener('click', toggle);
    abbr.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  }
}
```

**Effort:** Data-attr enhancer | **Value:** Medium — documentation, legal, medical, technical writing.

---
---

### 11. `<ol data-steps>` — Step Indicator

Ordered lists as visual step indicators for processes, tutorials, or onboarding flows.

```html
<ol data-steps>
  <li data-complete>Create account</li>
  <li data-complete>Verify email</li>
  <li aria-current="step">Choose plan</li>
  <li>Add payment</li>
</ol>
```

```css
ol[data-steps] {
  list-style: none;
  padding: 0;
  display: flex;
  gap: var(--size-s);
  counter-reset: step;
}

ol[data-steps] li {
  counter-increment: step;
  flex: 1;
  text-align: center;
  font-size: var(--font-size-sm);
  position: relative;
}

ol[data-steps] li::before {
  content: counter(step);
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 2rem;
  block-size: 2rem;
  border-radius: 50%;
  margin-inline: auto;
  margin-block-end: var(--size-2xs);
  border: 2px solid var(--color-border);
  color: var(--color-text-muted);
  font-weight: 600;
}

ol[data-steps] li[data-complete]::before {
  content: "✓";
  background: var(--color-interactive);
  border-color: var(--color-interactive);
  color: white;
}

ol[data-steps] li[aria-current="step"]::before {
  border-color: var(--color-interactive);
  color: var(--color-interactive);
}

/* Connector line between steps */
ol[data-steps] li + li::after {
  content: "";
  position: absolute;
  inset-block-start: 1rem;
  inset-inline-end: calc(50% + 1.25rem);
  inline-size: calc(100% - 2.5rem);
  block-size: 2px;
  background: var(--color-border);
}

ol[data-steps] li[data-complete] + li::after {
  background: var(--color-interactive);
}
```

**Effort:** CSS-only (data-attrs for state) | **Value:** High — checkout, onboarding, tutorials, wizards.

---

### 12. `<datalist>` Rich Suggestions

`<datalist>` autocomplete is functional but visually plain and uncontrollable. A data-attribute could enhance it with grouped options, descriptions, or recent selections — while keeping the native `<datalist>` as the no-JS fallback.

```html
<label>
  Country
  <input type="text" list="countries" data-suggest>
  <datalist id="countries">
    <option value="United States" data-group="Americas">
    <option value="Canada" data-group="Americas">
    <option value="United Kingdom" data-group="Europe">
    <option value="Germany" data-group="Europe">
    <option value="Japan" data-group="Asia-Pacific">
  </datalist>
</label>
```

With JS: the enhancer reads `<datalist>` options, builds a custom dropdown with group headers, and handles keyboard navigation. Without JS: the native `<datalist>` autocomplete works as normal.

**Effort:** Data-attr enhancer (heavier) | **Value:** Medium — any form with many options where grouping helps.

---

## Tier 3 — Progressive Enhancement Patterns (Markup Compositions)

### 13. `<input type="___">` Custom Type Upgrades

Browsers render unknown input types as `type="text"`. This creates a progressive enhancement seam: declare intent in markup, upgrade with JS.

```html
<!-- Emoji picker (bead vanilla-breeze-t095) -->
<input type="emoji" name="reaction" placeholder="Pick an emoji">

<!-- Star rating -->
<input type="rating" name="score" min="1" max="5" value="3">

<!-- Token/tag input -->
<input type="tags" name="skills" value="html,css,js">

<!-- Color with swatches -->
<input type="palette" name="theme-color" data-swatches="#fff,#000,#0066cc">
```

Each falls back to a text input. The JS enhancer pattern:

```js
const upgrades = {
  emoji: () => import('./emoji-picker/logic.js'),
  rating: () => import('./star-rating/logic.js'),
  tags: () => import('./tag-input/logic.js'),
  palette: () => import('./color-palette/logic.js'),
};

for (const [type, loader] of Object.entries(upgrades)) {
  const inputs = document.querySelectorAll(`input[type="${type}"]`);
  if (inputs.length) loader().then(mod => mod.upgrade(inputs));
}
```

This generalizes the `<input type="emoji">` idea (bead vanilla-breeze-t095) into a reusable upgrade pattern. The key design question: should the upgrade replace the input with a web component, or wrap it?

**Effort:** Web component per type | **Value:** High — each custom type solves a real, common form problem.

---

### 14. `<figure>` Gallery Composition

Multiple `<figure>` elements inside a container, with CSS grid layout and optional lightbox enhancement.

```html
<section class="gallery" aria-label="Product photos">
  <figure>
    <img src="front.jpg" alt="Product front view" loading="lazy">
    <figcaption>Front</figcaption>
  </figure>
  <figure>
    <img src="side.jpg" alt="Product side view" loading="lazy">
    <figcaption>Side</figcaption>
  </figure>
  <figure>
    <img src="detail.jpg" alt="Product detail" loading="lazy">
    <figcaption>Detail</figcaption>
  </figure>
</section>
```

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--size-s);
}

.gallery figure {
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-m);
}

.gallery figure img {
  inline-size: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  transition: scale 300ms ease;
}

.gallery figure:hover img {
  scale: 1.05;
}
```

JS enhancement: clicking opens the image in a `<dialog>` (using VB's existing dialog styles) with prev/next navigation. Without JS: images display in a grid, user can right-click to open full-size.

**Effort:** CSS + optional enhancer | **Value:** High — product pages, portfolios, documentation.

---
--

### 16. `<output>` Live Calculation Display

`<output>` is the semantic element for computed results but rarely used because connecting it to inputs requires JS. A declarative attribute could make simple calculations markup-driven.

```html
<form oninput="total.value = (price.valueAsNumber * qty.valueAsNumber).toFixed(2)">
  <label>Price <input type="number" name="price" value="9.99" step="0.01"></label>
  <label>Quantity <input type="number" name="qty" value="1" min="1"></label>
  <output name="total" for="price qty" data-format-number="currency">9.99</output>
</form>
```

The `oninput` handler is native HTML (no framework needed). VB's `data-format-number` already exists for number formatting — it just needs to work on `<output>` elements that update dynamically. The connection point: a MutationObserver on the output's `value` property to re-format when it changes.

**Effort:** Integration with existing data-format-number | **Value:** Medium — calculators, order forms, configuration pages.

---
