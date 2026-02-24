# HTML Upscaling Ideas

> Closing gaps, adding features, and improving native HTML elements from a markup-first perspective.

**Last updated:** 2026-02-23

---

## Methodology

Reviewed all 95+ native element doc pages, 43 CSS module directories, 21 custom elements, and 30+ data-attribute enhancers. Ideas below target elements where VB's current coverage is thin relative to what's possible, or where a small enhancement unlocks a disproportionate amount of value.

Each idea is rated:

- **Effort:** CSS-only < data-attr enhancer < web component
- **Value:** How many real pages would use this

---

## Tier 1 — CSS-Only Enhancements (No JS)

### 1. `<blockquote>` Variants

Current coverage is minimal (22 lines — left border + em-dash attribution). This is one of the most visually diverse elements on the web.

```html
<!-- Pull quote — large, centered, decorative -->
<blockquote class="pull">
  <p>Design is not just what it looks like. Design is how it works.</p>
  <footer><cite>Steve Jobs</cite></footer>
</blockquote>

<!-- Testimonial — card-style with avatar -->
<blockquote class="testimonial">
  <p>Vanilla Breeze replaced our entire component library.</p>
  <footer>
    <img src="avatar.jpg" alt="" aria-hidden="true">
    <cite>Jane Doe</cite>, <span>CTO at Acme</span>
  </footer>
</blockquote>

<!-- Alert/callout — colored sidebar for docs -->
<blockquote class="callout">
  <p><strong>Note:</strong> This API is experimental.</p>
</blockquote>

<!-- Epigraph — small, right-aligned, for chapter openers -->
<blockquote class="epigraph">
  <p>In the beginner's mind there are many possibilities.</p>
  <footer><cite>Shunryu Suzuki</cite></footer>
</blockquote>
```

```css
blockquote.pull {
  font-size: var(--font-size-xl);
  text-align: center;
  border-inline-start: none;
  padding-inline: var(--size-l);
  font-style: normal;
}

blockquote.pull::before {
  content: "\201C"; /* " */
  display: block;
  font-size: var(--font-size-4xl);
  color: var(--color-text-muted);
  line-height: 1;
}

blockquote.testimonial {
  border-inline-start: none;
  background: var(--color-surface-raised);
  border-radius: var(--radius-m);
  padding: var(--size-m);
}

blockquote.testimonial footer {
  display: flex;
  align-items: center;
  gap: var(--size-s);
}

blockquote.testimonial footer img {
  inline-size: 2.5rem;
  block-size: 2.5rem;
  border-radius: 50%;
  object-fit: cover;
}

blockquote.callout {
  background: oklch(65% 0.15 250 / 0.08);
  border-inline-start-color: oklch(65% 0.15 250);
  border-radius: var(--radius-s);
  padding: var(--size-s) var(--size-m);
  font-style: normal;
}

blockquote.epigraph {
  border-inline-start: none;
  text-align: end;
  font-size: var(--font-size-sm);
  max-inline-size: 24rem;
  margin-inline-start: auto;
}
```

**Effort:** CSS-only | **Value:** High — pull quotes, testimonials, and callouts appear on nearly every content site.

---

### 2. `<dl>` Layout Variants

Definition lists are the semantic choice for key-value metadata (settings pages, product specs, profile fields) but VB only styles `<dt>` bold and `<dd>` indented. Grid and inline layouts would unlock real use cases.

```html
<!-- Grid: key-value pairs in two columns -->
<dl class="grid">
  <dt>Status</dt>
  <dd>Active</dd>
  <dt>Plan</dt>
  <dd>Enterprise</dd>
  <dt>Members</dt>
  <dd>24</dd>
</dl>

<!-- Inline: horizontal flow with separator -->
<dl class="inline">
  <dt>Runtime</dt>
  <dd>Node.js 20</dd>
  <dt>Framework</dt>
  <dd>Eleventy</dd>
  <dt>Host</dt>
  <dd>Cloudflare</dd>
</dl>

<!-- Stacked with dividers (for settings/specs) -->
<dl class="stacked">
  <div>
    <dt>Email notifications</dt>
    <dd>Enabled</dd>
  </div>
  <div>
    <dt>Two-factor auth</dt>
    <dd>SMS</dd>
  </div>
</dl>
```

```css
dl.grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--size-2xs) var(--size-m);
}

dl.grid dd { margin: 0; }

dl.inline {
  display: flex;
  flex-wrap: wrap;
  gap: var(--size-2xs) var(--size-m);
}

dl.inline dt::after { content: ":"; }
dl.inline dd { margin: 0; }

dl.stacked > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-block: var(--size-xs);
  border-block-end: var(--border-width-thin) solid var(--color-border);
}

dl.stacked dd { margin: 0; text-align: end; }
```

**Effort:** CSS-only | **Value:** High — settings pages, product specs, metadata displays, profile pages.

---

### 3. `<kbd>` Shortcut Combos

VB styles `<kbd>` via code elements but doesn't address keyboard shortcut display — a common pattern for docs, command palettes, and keyboard-heavy apps.

```html
<!-- Single key -->
<kbd>Esc</kbd>

<!-- Combo with separator -->
<kbd class="combo"><kbd>Ctrl</kbd><kbd>S</kbd></kbd>

<!-- Chord sequence -->
<kbd class="combo"><kbd>Ctrl</kbd><kbd>K</kbd> <kbd>Ctrl</kbd><kbd>S</kbd></kbd>
```

```css
kbd kbd {
  display: inline-block;
  padding: var(--size-3xs) var(--size-2xs);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  background: var(--color-surface-raised);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-s);
  box-shadow: 0 1px 0 var(--color-border);
  line-height: 1;
  white-space: nowrap;
}

kbd.combo {
  background: none;
  border: none;
  box-shadow: none;
  padding: 0;
}

kbd.combo > kbd + kbd::before {
  content: "+";
  padding-inline: var(--size-3xs);
  color: var(--color-text-muted);
  font-weight: normal;
}
```

**Effort:** CSS-only | **Value:** Medium — any app with keyboard shortcuts, docs sites, command palettes.

---

### 4. `<s>` and `<del>` Price Strikethrough

E-commerce's most common pattern: show the old price struck through next to the new price. `<s>` is semantically correct for "no longer accurate" (a superseded price), while `<del>` is for tracked edits.

```html
<p class="price">
  <s>$49.99</s>
  <strong>$29.99</strong>
</p>

<!-- With discount badge -->
<p class="price">
  <s>$120.00</s>
  <strong>$84.00</strong>
  <small>30% off</small>
</p>
```

```css
.price {
  display: flex;
  align-items: baseline;
  gap: var(--size-2xs);
}

.price s {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-decoration-color: currentColor;
}

.price strong {
  font-size: var(--font-size-xl);
  color: oklch(55% 0.2 25); /* sale red */
}

.price small {
  background: oklch(55% 0.2 25 / 0.1);
  color: oklch(55% 0.2 25);
  padding: var(--size-3xs) var(--size-2xs);
  border-radius: var(--radius-s);
  font-weight: 600;
}
```

**Effort:** CSS-only | **Value:** High — every e-commerce page and pricing table.

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

### 7. `<meter>` Comparison / Multiple Meters

Side-by-side meters for comparing values (poll results, survey data, resource usage).

```html
<dl class="meter-list">
  <dt>JavaScript</dt>
  <dd><meter value="0.67" min="0" max="1">67%</meter></dd>
  <dt>Python</dt>
  <dd><meter value="0.28" min="0" max="1">28%</meter></dd>
  <dt>Rust</dt>
  <dd><meter value="0.05" min="0" max="1">5%</meter></dd>
</dl>
```

```css
dl.meter-list {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--size-2xs) var(--size-s);
  align-items: center;
}

dl.meter-list dd {
  margin: 0;
}

dl.meter-list meter {
  inline-size: 100%;
}
```

**Effort:** CSS-only | **Value:** Medium — dashboards, surveys, analytics pages.

---

## Tier 2 — Data-Attribute Enhancers (Light JS)

### 8. `<time data-relative>` — Live Relative Timestamps

VB has `.relative` and `.datetime` CSS variants for `<time>` but no JS to actually compute relative display. This is one of the most requested web patterns.

```html
<!-- Static: shows "February 20, 2026" -->
<time datetime="2026-02-20T14:30:00Z">February 20, 2026</time>

<!-- Enhanced: shows "3 days ago", updates periodically -->
<time datetime="2026-02-20T14:30:00Z" data-relative>February 20, 2026</time>
```

```js
function initRelativeTime() {
  const elements = document.querySelectorAll('time[data-relative]');
  if (!elements.length) return;

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  function update() {
    const now = Date.now();
    for (const el of elements) {
      const date = new Date(el.dateTime);
      const diff = date - now;
      const seconds = diff / 1000;
      const minutes = seconds / 60;
      const hours = minutes / 60;
      const days = hours / 24;

      if (Math.abs(days) >= 30) {
        el.textContent = rtf.format(Math.round(days / 30), 'month');
      } else if (Math.abs(days) >= 1) {
        el.textContent = rtf.format(Math.round(days), 'day');
      } else if (Math.abs(hours) >= 1) {
        el.textContent = rtf.format(Math.round(hours), 'hour');
      } else if (Math.abs(minutes) >= 1) {
        el.textContent = rtf.format(Math.round(minutes), 'minute');
      } else {
        el.textContent = rtf.format(Math.round(seconds), 'second');
      }
    }
  }

  update();
  setInterval(update, 60_000); // update every minute
}
```

The original text remains visible without JS. The `datetime` attribute is the machine-readable truth; the displayed text is the human-readable view. `Intl.RelativeTimeFormat` handles i18n automatically.

**Effort:** Data-attr enhancer | **Value:** Very high — comment timestamps, activity feeds, dashboards, blog dates.

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

### 10. `<table data-filter>` — Client-Side Table Filtering

VB's table CSS is extremely rich (301 lines, 18+ data-attrs) but there's no built-in filtering. A simple text filter on a table is one of the most common dashboard patterns.

```html
<table data-filter>
  <thead>
    <tr>
      <th>Name</th>
      <th>Role</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Alice</td><td>Engineer</td><td>Active</td></tr>
    <tr><td>Bob</td><td>Designer</td><td>Inactive</td></tr>
  </tbody>
</table>
```

The enhancer prepends a `<search>` element with an `<input type="search">` above the table. Typing filters rows by text content, hiding non-matching rows with `data-state-hidden` (which VB already styles as `display: none`).

```js
function initTableFilter(table) {
  const search = document.createElement('search');
  search.innerHTML = `
    <label>
      Filter
      <input type="search" placeholder="Type to filter rows…"
             aria-controls="${table.id}">
    </label>
  `;

  table.before(search);
  const input = search.querySelector('input');

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase();
    for (const row of table.querySelectorAll('tbody tr')) {
      const match = !query || row.textContent.toLowerCase().includes(query);
      row.toggleAttribute('data-state-hidden', !match);
    }
  });
}
```

**Effort:** Data-attr enhancer | **Value:** High — any data table on a dashboard or admin page.

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

### 15. `<video>` Chapter Markers from `<track>`

The `<track>` element supports `kind="chapters"` in WebVTT format, but browsers don't expose chapters in a useful UI. An enhancer could read the chapter track and render a clickable chapter list.

```html
<video controls>
  <source src="tutorial.mp4" type="video/mp4">
  <track kind="chapters" src="chapters.vtt" default data-chapter-list>
</video>
```

The enhancer reads the cue list from the `<track>` element and renders an `<ol>` of chapter links below the video. Clicking a chapter seeks to that timestamp. Without JS: the video plays normally, chapters available in browser's native UI (where supported).

**Effort:** Data-attr enhancer | **Value:** Medium — tutorials, courses, long-form video content.

---

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

## Tier 4 — Speculative / Future-Facing

### 17. `<search>` Form Pattern

The `<search>` element is semantically correct for search UI but VB provides minimal styling. A search-specific form pattern would handle the common variations.

```html
<!-- Inline search (nav bar) -->
<search class="inline">
  <form action="/search" method="get">
    <input type="search" name="q" placeholder="Search…" aria-label="Search">
  </form>
</search>

<!-- Expanded search (search page) -->
<search class="expanded">
  <form action="/search" method="get">
    <input type="search" name="q" placeholder="Search documentation…">
    <button type="submit">Search</button>
  </form>
</search>

<!-- Search with filters -->
<search class="filtered">
  <form action="/search" method="get">
    <input type="search" name="q" placeholder="Search…">
    <select name="category">
      <option value="">All</option>
      <option value="elements">Elements</option>
      <option value="attributes">Attributes</option>
    </select>
    <button type="submit">Search</button>
  </form>
</search>
```

**Effort:** CSS-only | **Value:** Medium — every site with search.

---

### 18. `<map>` / `<area>` Modern Image Regions

Image maps are a forgotten HTML feature. With modern CSS they could be resurrected for annotated images, floor plans, or interactive diagrams — without a canvas or SVG dependency.

```html
<figure>
  <img src="floorplan.png" alt="Office floor plan" usemap="#office">
  <map name="office">
    <area shape="rect" coords="10,10,200,150"
          href="#conference-a" alt="Conference Room A"
          data-tooltip="Conference Room A — seats 12">
    <area shape="rect" coords="210,10,400,150"
          href="#kitchen" alt="Kitchen"
          data-tooltip="Kitchen — 2nd floor">
  </map>
</figure>
```

The areas are natively clickable and accessible. A JS enhancer could add hover tooltips (using `data-tooltip`) and highlight overlays. Without JS: clicking an area follows the `href` as a normal link.

**Effort:** Data-attr enhancer | **Value:** Niche — floor plans, anatomy diagrams, interactive maps.

---

### 19. `<dialog popover>` Tooltip/Popover Unification

The Popover API (`popover` attribute) and `<dialog>` serve overlapping purposes. VB could provide a unified pattern where lightweight content uses `popover` and heavier content uses `<dialog>`, both sharing the same positioning and animation system.

```html
<!-- Light popover — no dialog, no backdrop -->
<button popovertarget="info">Info</button>
<article popover id="info">
  <p>This is a lightweight popover. No backdrop, no focus trap.</p>
</article>

<!-- Heavy popover — dialog for forms/complex content -->
<button commandfor="settings" command="show-modal">Settings</button>
<dialog id="settings">
  <form method="dialog">
    <header><h2>Settings</h2></header>
    <section><!-- form fields --></section>
    <footer><button type="submit">Save</button></footer>
  </form>
</dialog>
```

The CSS for positioning, animation, and backdrop could share tokens so popovers and dialogs feel like the same design system at different weight classes.

**Effort:** CSS tokens + docs | **Value:** Medium — clarifies when to use which pattern.

---

### 20. `<hr>` Section Divider Variants

`<hr>` is used everywhere but VB provides minimal styling. Decorative dividers are a common design request.

```html
<hr>                           <!-- Default thin line -->
<hr class="thick">             <!-- Heavier weight -->
<hr class="dashed">            <!-- Dashed line -->
<hr class="dotted">            <!-- Dotted line -->
<hr class="fade">              <!-- Gradient fade to transparent -->
<hr class="ornament">          <!-- Centered ornament (◆ or similar) -->
<hr class="spacer">            <!-- Invisible, just vertical space -->
```

```css
hr.thick { border-block-start-width: 3px; }
hr.dashed { border-style: dashed; }
hr.dotted { border-style: dotted; }

hr.fade {
  border: none;
  block-size: 1px;
  background: linear-gradient(to right, transparent, var(--color-border), transparent);
}

hr.ornament {
  border: none;
  text-align: center;
  line-height: 0;
}

hr.ornament::after {
  content: "◆";
  background: var(--color-surface);
  padding-inline: var(--size-s);
  color: var(--color-text-muted);
}

hr.spacer {
  border: none;
  margin-block: var(--size-xl);
}
```

**Effort:** CSS-only | **Value:** Medium — content pages, blog posts, documentation.

---

## Summary

| # | Idea | Element | Effort | Value |
|---|------|---------|--------|-------|
| 1 | Blockquote variants | `<blockquote>` | CSS | High |
| 2 | DL layout variants | `<dl>` | CSS | High |
| 3 | Keyboard shortcut combos | `<kbd>` | CSS | Medium |
| 4 | Price strikethrough | `<s>` | CSS | High |
| 5 | Step progress bar | `<progress>` | CSS | Medium |
| 6 | Collapsible fieldsets | `<details>` + `<fieldset>` | Docs | Medium |
| 7 | Meter comparison list | `<meter>` + `<dl>` | CSS | Medium |
| 8 | Relative timestamps | `<time>` | JS enhancer | Very high |
| 9 | Expandable abbreviations | `<abbr>` | JS enhancer | Medium |
| 10 | Table filtering | `<table>` | JS enhancer | High |
| 11 | Step indicators | `<ol>` | CSS + data-attr | High |
| 12 | Rich datalist suggestions | `<datalist>` | JS enhancer | Medium |
| 13 | Custom input type upgrades | `<input>` | Web component | High |
| 14 | Figure gallery | `<figure>` | CSS + optional JS | High |
| 15 | Video chapter markers | `<video>` + `<track>` | JS enhancer | Medium |
| 16 | Output live calculations | `<output>` | Integration | Medium |
| 17 | Search form patterns | `<search>` | CSS | Medium |
| 18 | Modern image maps | `<map>` + `<area>` | JS enhancer | Niche |
| 19 | Popover/dialog unification | `<dialog>` + `popover` | CSS + docs | Medium |
| 20 | HR divider variants | `<hr>` | CSS | Medium |

### Recommended Priority

**Ship first (CSS-only, high value):** Blockquote variants, DL layouts, price strikethrough, step indicators, HR variants.

**Ship second (JS enhancers, high value):** Relative timestamps, table filtering, figure gallery.

**Explore further:** Custom input type upgrades (generalizes the emoji bead), expandable abbr, datalist enhancement.
