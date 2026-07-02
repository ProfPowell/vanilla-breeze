# Design-System Package Growth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow `@profpowell/vb-design-system` from 8 to 19 components — port 8 existing VB components and build 3 new specimens (`brand-specimen`, `icon-set`, `icon-specimen`) — each with a doc page on the mini-site.

**Architecture:** Ports are moves: copy the component directory from `vanilla-breeze` into the DS package (its VB-core lib/util deps are already vendored there), wire it into the barrel/CSS/exports, and author a doc page. New components are light-DOM `vb-element` components following the existing 8, consuming VB tokens via CSS custom properties with hardcoded fallbacks. `color-picker` becomes a documented runtime peer.

**Tech Stack:** Vanilla JS (ES modules), `vb-element` base class (vendored), cook-ssg doc site, esbuild package build, Playwright (component), `node --test` (unit).

## Global Constraints

- Repo: `~/src/vb-design-system`. Branch: `main`. Conventional commits; commit per task.
- No new runtime dependencies. VB tokens consumed via CSS custom properties **with hardcoded fallbacks** in each `styles.css` (token contract — no build coupling to VB).
- Documented runtime peers (VB core, not bundled): `color-picker`, `drag-surface`, `icon-wc`, `brand-mark`, `theme-picker`.
- Build/verify: `cd site && npm run build`; publish (only in the final task): `node scripts/publish-docs.js /vb-design-system`.
- Package build: `npm run build` at repo root (esbuild); it must stay green.
- Doc pages are flat files: `site/src/pages/elements/<comp>.html` (rendered via the `element.html` layout). Every new element also gets a `site/src/includes/sidebar-elements.html` entry (alphabetical).
- Depends on plan `2026-06-30-vb-core-data-icon-plan.md` for `[data-icon]` + the `/cdn/icons/<set>.json` manifests. If that plan has not landed, `icon-set`/`icon-specimen` fall back to `<icon-wc>` and a `names` attribute (no manifest fetch).

---

## Port Procedure (referenced by Tasks 1–8)

For a component `<comp>` whose source is `~/src/vanilla-breeze/src/web-components/<comp>/`:

1. **Copy the directory:**
   `cp -R ~/src/vanilla-breeze/src/web-components/<comp> ~/src/vb-design-system/src/web-components/<comp>`
   (For `palette-generator`, which already exists as vendored utils, see Task 1's reconciliation note.)
2. **Barrel:** add `import './web-components/<comp>/logic.js';` to `src/index.js`.
3. **CSS:** if `src/web-components/<comp>/styles.css` exists, add
   `@import "./web-components/<comp>/styles.css";` to `src/index.css` **above** the
   `/* design-system authoring patterns */` block.
4. **Exports:** add `"./<comp>": "./src/web-components/<comp>/logic.js",` to `package.json`
   `exports`, immediately before `"./package.json"`.
5. **Token fallbacks:** grep the copied `styles.css` for `var(--` occurrences that lack a
   fallback (`var(--x)` with no comma). For any VB token without one, add a sensible literal
   fallback (`var(--color-border, #d4d4d8)` etc.), matching how the existing 8 components do it.
6. **Doc page:** create `site/src/pages/elements/<comp>.html` by copying the closest existing
   sibling page (e.g. `site/src/pages/elements/semantic-palette.html` for tools,
   `spacing-specimen.html` for specimens) and replacing the element name, `${title}`/description,
   and the `<browser-window>` demo markup with a real `<comp>` demo.
7. **Sidebar:** add a `<comp>` link to `site/src/includes/sidebar-elements.html` in alphabetical order.
8. **Verify (task's test step):**
   - `cd ~/src/vb-design-system && npm run build` — package build green.
   - `cd site && npm run build` — doc site builds.
   - `grep -c "<comp>" ../dist/... ` and a Playwright check (below) confirm registration + render.

**Registration smoke test** (reused per port; create once in Task 1, extend per task):

```js
// tests/components/ds-ports.spec.js  (served against the built site or src)
import { test, expect } from '@playwright/test';
async function loads(p, tag, demoUrl) {
  await p.goto(demoUrl);
  await expect.poll(() => p.evaluate(t => !!customElements.get(t), tag)).toBe(true);
}
```

---

### Task 1: Port `palette-generator` (+ reconcile vendored utils, rewire semantic-palette)

`palette-generator` already exists in DS as **vendored utils only** (`_palette-utils.js`, imported by
`semantic-palette`). This task upgrades it to the full component.

**Files:**
- Copy into: `src/web-components/palette-generator/` (adds `logic.js`, `styles.css`, `api.json`, `static.html`)
- Modify: `src/index.js`, `src/index.css`, `package.json`
- Create: `site/src/pages/elements/palette-generator.html`, `tests/components/ds-ports.spec.js`
- Modify: `site/src/includes/sidebar-elements.html`

**Interfaces:**
- Consumes: vendored `src/lib/{bundle-registry,vb-element}.js`, `src/utils/copy-init.js`,
  `src/web-components/color-picker/_color-utils.js` (all already present).
- Produces: registered `<palette-generator>`; `semantic-palette` continues to import
  `../palette-generator/_palette-utils.js`.

- [ ] **Step 1: Copy component files without clobbering the working vendored util**

```bash
cd ~/src/vb-design-system
# Back up the current vendored util, copy the full component, then reconcile.
cp src/web-components/palette-generator/_palette-utils.js /tmp/ds-palette-utils.bak.js
cp -R ~/src/vanilla-breeze/src/web-components/palette-generator/. src/web-components/palette-generator/
diff /tmp/ds-palette-utils.bak.js src/web-components/palette-generator/_palette-utils.js || true
```
Expected: the VB `_palette-utils.js` imports `../color-picker/_color-utils.js`, which exists in DS.
If the diff shows meaningful divergence, keep the VB version (source of truth) — Step 4 verifies
`semantic-palette` still renders.

- [ ] **Step 2: Apply Port Procedure steps 2–7** (barrel, index.css, exports, token fallbacks, doc page, sidebar) for `palette-generator`.

- [ ] **Step 3: Write the registration smoke test**

```js
// tests/components/ds-ports.spec.js
import { test, expect } from '@playwright/test';

test('palette-generator registers and renders', async ({ page }) => {
  await page.goto('https://vb.test/vb-design-system/elements/palette-generator/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('palette-generator'))).toBe(true);
  await expect(page.locator('palette-generator')).toBeVisible();
});

test('semantic-palette still renders after palette-generator port', async ({ page }) => {
  await page.goto('https://vb.test/vb-design-system/elements/semantic-palette/');
  await expect(page.locator('semantic-palette').first()).toBeVisible();
});
```

- [ ] **Step 4: Build + run the smoke test**

```bash
cd ~/src/vb-design-system && npm run build
cd site && npm run build && node scripts/publish-docs.js /vb-design-system
npx playwright test tests/components/ds-ports.spec.js -g "palette-generator|semantic-palette"
```
Expected: package build green; both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(ds): port palette-generator (full component) + doc page"
```

---

### Task 2: Port `accessibility-specimen`

**Files:** copy `src/web-components/accessibility-specimen/`; modify `src/index.js`,
`src/index.css`, `package.json`, `site/src/includes/sidebar-elements.html`; create
`site/src/pages/elements/accessibility-specimen.html`.

- [ ] **Step 1: Apply the Port Procedure** (steps 1–7) for `accessibility-specimen`. Model the doc page on `spacing-specimen.html`; the demo shows a WCAG contrast table (`<accessibility-specimen>` with representative fg/bg pairs).
- [ ] **Step 2: Add smoke test** (append to `ds-ports.spec.js`):

```js
test('accessibility-specimen registers and renders', async ({ page }) => {
  await page.goto('https://vb.test/vb-design-system/elements/accessibility-specimen/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('accessibility-specimen'))).toBe(true);
  await expect(page.locator('accessibility-specimen').first()).toBeVisible();
});
```

- [ ] **Step 3: Build + test**

```bash
cd ~/src/vb-design-system && npm run build && cd site && npm run build && node scripts/publish-docs.js /vb-design-system
npx playwright test tests/components/ds-ports.spec.js -g accessibility-specimen
```
Expected: green.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat(ds): port accessibility-specimen + doc page"`

---

### Task 3: Port `breakpoint-specimen`

Same shape as Task 2 for `breakpoint-specimen` (doc page modeled on `spacing-specimen.html`; demo shows the responsive breakpoint readout).

- [ ] **Step 1:** Apply Port Procedure for `breakpoint-specimen`.
- [ ] **Step 2:** Append smoke test (same shape, tag `breakpoint-specimen`).
- [ ] **Step 3:** Build + `npx playwright test tests/components/ds-ports.spec.js -g breakpoint-specimen` → green.
- [ ] **Step 4:** `git commit -m "feat(ds): port breakpoint-specimen + doc page"`

---

### Task 4: Port `layout-specimen`

Same shape for `layout-specimen`. `layout-specimen` documents VB **layout primitives**
(`layout-grid`, `layout-center`, …), which are VB core — the DS component only visualizes them, so
no extra dependency. Doc page modeled on `spacing-specimen.html`.

- [ ] **Step 1:** Apply Port Procedure for `layout-specimen`.
- [ ] **Step 2:** Append smoke test (tag `layout-specimen`).
- [ ] **Step 3:** Build + test → green.
- [ ] **Step 4:** `git commit -m "feat(ds): port layout-specimen + doc page"`

---

### Task 5: Port `font-pairer`

`font-pairer` bundles `_font-data.js` (copied with the dir) and uses `utils/copy-init.js` (vendored).
Doc page modeled on `semantic-palette.html` (interactive tool).

- [ ] **Step 1:** Apply Port Procedure for `font-pairer`. Confirm `_font-data.js` copied.
- [ ] **Step 2:** Append smoke test (tag `font-pairer`).
- [ ] **Step 3:** Build + test; also verify the tool renders its font controls (`await expect(page.locator('font-pairer button, font-pairer select').first()).toBeVisible()`).
- [ ] **Step 4:** `git commit -m "feat(ds): port font-pairer + doc page"`

---

### Task 6: Port `gradient-builder`

Bundles `_gradient-utils.js`; uses `utils/copy-init.js`. Doc page modeled on `semantic-palette.html`.

- [ ] **Step 1:** Apply Port Procedure for `gradient-builder`. Confirm `_gradient-utils.js` copied.
- [ ] **Step 2:** Append smoke test (tag `gradient-builder`).
- [ ] **Step 3:** Build + test → green.
- [ ] **Step 4:** `git commit -m "feat(ds): port gradient-builder + doc page"`

---

### Task 7: Port `theme-import` (with `dtcg-deserialize.js`)

`theme-import` bundles `dtcg-deserialize.js` (copied with the dir). It is the counterpart to the
already-ported `theme-export`. Port `theme-import` **before** `theme-catalog` (Task 8 depends on it).

- [ ] **Step 1:** Apply Port Procedure for `theme-import`. Confirm `dtcg-deserialize.js` copied.
- [ ] **Step 2:** Append smoke test (tag `theme-import`).
- [ ] **Step 3:** Build + test → green.
- [ ] **Step 4:** `git commit -m "feat(ds): port theme-import (+dtcg-deserialize) + doc page"`

---

### Task 8: Port `theme-catalog` (depends on Task 7)

`theme-catalog` imports `../theme-import/dtcg-deserialize.js` — which now exists in DS (Task 7).

- [ ] **Step 1:** Apply Port Procedure for `theme-catalog`. Verify the build resolves
  `../theme-import/dtcg-deserialize.js` (fails loudly if Task 7 was skipped).
- [ ] **Step 2:** Append smoke test (tag `theme-catalog`).
- [ ] **Step 3:** Build + test → green.
- [ ] **Step 4:** `git commit -m "feat(ds): port theme-catalog + doc page"`

---

### Task 9: Document `color-picker` as a runtime peer

`color-picker` stays in VB core but is used at runtime by `semantic-palette`/`palette-generator`/`gradient-builder`. Make the dependency explicit (mirrors the `drag-surface` peer note).

**Files:** Modify `package.json` (peer note) and `README.md`.

- [ ] **Step 1:** In `package.json`, ensure `"vanilla-breeze"` is in `peerDependencies` and add a comment/section documenting that `<color-picker>`, `<icon-wc>`, `<brand-mark>` are runtime peers provided by `vanilla-breeze`. (If a `peerDependenciesMeta` block exists, keep `vanilla-breeze` optional as today.)
- [ ] **Step 2:** In `README.md`, add a "Runtime peers" subsection listing `color-picker`, `drag-surface`, `icon-wc`, `brand-mark`, `theme-picker` and noting they come from VB core (the color tools degrade without `color-picker`).
- [ ] **Step 3:** Commit — `git add package.json README.md && git commit -m "docs(ds): document color-picker et al. as runtime peers"`

---

### Task 10: New component `brand-specimen`

A DS specimen documenting a brand mark: shown on light/dark surfaces, at a size scale, with a
clear-space box. Renders `<brand-mark>` (VB core peer) internally.

**Files:**
- Create: `src/web-components/brand-specimen/{logic.js,styles.css,api.json,static.html}`
- Modify: `src/index.js`, `src/index.css`, `package.json`, `site/src/includes/sidebar-elements.html`
- Create: `site/src/pages/elements/brand-specimen.html`
- Test: `tests/components/brand-specimen.spec.js`

**Interfaces:**
- Consumes: vendored `lib/{bundle-registry,vb-element}.js`; `<brand-mark>` (runtime peer).
- Produces: registered `<brand-specimen>`; attrs `src` (logo URL), `name` (brand name),
  `data-sizes` (space-separated brand-mark sizes, default `"s m l xl"`).

- [ ] **Step 1: Write the failing component test**

```js
// tests/components/brand-specimen.spec.js
import { test, expect } from '@playwright/test';

test('brand-specimen renders the mark on light and dark panels + a size scale', async ({ page }) => {
  await page.goto('https://vb.test/vb-design-system/elements/brand-specimen/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('brand-specimen'))).toBe(true);
  const el = page.locator('brand-specimen').first();
  await expect(el).toBeVisible();
  // one mark per surface panel (light + dark) + one per size in the scale
  await expect(el.locator('[data-surface="light"] brand-mark')).toHaveCount(1);
  await expect(el.locator('[data-surface="dark"] brand-mark')).toHaveCount(1);
  await expect(el.locator('[data-scale] brand-mark')).toHaveCount(4); // default s m l xl
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd ~/src/vb-design-system && cd site && npm run build && node scripts/publish-docs.js /vb-design-system
npx playwright test tests/components/brand-specimen.spec.js
```
Expected: FAIL — `brand-specimen` undefined.

- [ ] **Step 3: Implement the component**

```js
// src/web-components/brand-specimen/logic.js
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class BrandSpecimen extends VBElement {
  static get observedAttributes() { return ['src', 'name', 'data-sizes']; }
  connectedCallback() { this.render(); }
  attributeChangedCallback() { this.render(); }

  render() {
    const src = this.getAttribute('src') || '';
    const name = this.getAttribute('name') || 'Brand';
    const sizes = (this.getAttribute('data-sizes') || 's m l xl').trim().split(/\s+/);
    const mark = (size) =>
      `<brand-mark${src ? ` src="${src}"` : ''} wordmark="${name}"${size ? ` data-size="${size}"` : ''}></brand-mark>`;
    this.innerHTML = `
      <section class="brand-specimen">
        <div class="bs-surfaces">
          <figure data-surface="light">${mark('l')}<figcaption>On light</figcaption></figure>
          <figure data-surface="dark">${mark('l')}<figcaption>On dark</figcaption></figure>
        </div>
        <div class="bs-scale" data-scale>
          ${sizes.map(s => `<span>${mark(s)}<small>${s}</small></span>`).join('')}
        </div>
        <div class="bs-clearspace"><span class="bs-clear-box">${mark('l')}</span>
          <figcaption>Clear space</figcaption></div>
      </section>`;
  }
}
registerComponent('brand-specimen', BrandSpecimen);
```

```css
/* src/web-components/brand-specimen/styles.css */
.brand-specimen { display: grid; gap: var(--size-l, 1.5rem); }
.bs-surfaces { display: grid; grid-template-columns: 1fr 1fr; gap: var(--size-m, 1rem); }
.bs-surfaces figure { margin: 0; padding: var(--size-l, 1.5rem); border-radius: var(--radius-m, 0.5rem);
  display: grid; place-items: center; gap: var(--size-s, 0.75rem); }
.bs-surfaces [data-surface="light"] { background: #fff; color: #111; }
.bs-surfaces [data-surface="dark"]  { background: #111; color: #fff; }
.bs-scale { display: flex; align-items: end; gap: var(--size-l, 1.5rem); flex-wrap: wrap; }
.bs-scale span { display: grid; justify-items: center; gap: var(--size-2xs, 0.25rem); }
.bs-clear-box { display: inline-block; padding: 1em; outline: 1px dashed var(--color-border, #d4d4d8);
  outline-offset: 0.25em; }
```

Also create `api.json` (attrs `src`, `name`, `data-sizes`) and a minimal `static.html`, matching a
sibling component's file shapes. Then apply Port Procedure steps 2–4, 6–7 (barrel, css, exports, doc
page from a specimen sibling, sidebar).

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ~/src/vb-design-system && npm run build && cd site && npm run build && node scripts/publish-docs.js /vb-design-system
npx playwright test tests/components/brand-specimen.spec.js
```
Expected: PASS.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(ds): brand-specimen component + doc page"`

---

### Task 11: New component `icon-set` (catalog/browser)

Searchable grid of every icon in a set with click-to-copy. Fetches `{iconBase}/{set}.json`
(from the icon plan); accepts a `names` attribute to bypass the fetch (tests/offline).

**Files:**
- Create: `src/web-components/icon-set/{logic.js,styles.css,api.json,static.html}`
- Modify: `src/index.js`, `src/index.css`, `package.json`, `site/src/includes/sidebar-elements.html`
- Create: `site/src/pages/elements/icon-set.html`
- Test: `tests/components/icon-set.spec.js`

**Interfaces:**
- Produces: registered `<icon-set>`; attrs `set` (default `lucide`), `names` (optional
  space/comma list — overrides fetch). Icon base = `document.documentElement.dataset.iconPath || '/cdn/icons'`.

- [ ] **Step 1: Write the failing test (uses `names` to avoid network)**

```js
// tests/components/icon-set.spec.js
import { test, expect } from '@playwright/test';

test('icon-set renders a filterable, copyable grid from names', async ({ page }) => {
  await page.goto('https://vb.test/vb-design-system/elements/icon-set/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('icon-set'))).toBe(true);
  await page.evaluate(() => {
    const s = document.createElement('icon-set');
    s.id = 'probe'; s.setAttribute('names', 'star home search');
    document.body.appendChild(s);
  });
  const grid = page.locator('#probe');
  await expect(grid.locator('[data-icon-name]')).toHaveCount(3);
  // filter
  await grid.locator('input[type="search"]').fill('hom');
  await expect(grid.locator('[data-icon-name]:visible')).toHaveCount(1);
});
```

- [ ] **Step 2: Run to verify it fails** — `npx playwright test tests/components/icon-set.spec.js` → FAIL (undefined).

- [ ] **Step 3: Implement**

```js
// src/web-components/icon-set/logic.js
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const iconBase = () => document.documentElement.dataset.iconPath || '/cdn/icons';

class IconSet extends VBElement {
  static get observedAttributes() { return ['set', 'names']; }
  connectedCallback() { this.render(); this.load(); }
  attributeChangedCallback() { this.render(); this.load(); }

  get set() { return this.getAttribute('set') || 'lucide'; }

  async load() {
    const attr = this.getAttribute('names');
    let names = attr ? attr.split(/[\s,]+/).filter(Boolean) : null;
    if (!names) {
      try { names = await (await fetch(`${iconBase()}/${this.set}.json`)).json(); }
      catch { names = []; }
    }
    this.renderGrid(names);
  }

  render() {
    this.innerHTML = `
      <div class="icon-set">
        <label class="icon-set__search">
          <span class="visually-hidden">Filter icons</span>
          <input type="search" placeholder="Filter ${this.set} icons…">
        </label>
        <ul class="icon-set__grid" role="list"></ul>
      </div>`;
    this.querySelector('input').addEventListener('input', (e) => this.filter(e.target.value));
  }

  renderGrid(names) {
    const ul = this.querySelector('.icon-set__grid');
    if (!ul) return;
    ul.innerHTML = names.map((n) => `
      <li data-icon-name="${n}">
        <button type="button" title="Copy “${n}”" data-copy="${n}">
          <i data-icon="${n}" data-icon-set="${this.set}"></i>
          <span>${n}</span>
        </button>
      </li>`).join('');
    ul.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-copy]');
      if (btn) navigator.clipboard?.writeText(btn.dataset.copy);
    });
  }

  filter(q) {
    const term = q.trim().toLowerCase();
    for (const li of this.querySelectorAll('[data-icon-name]')) {
      li.hidden = term && !li.dataset.iconName.includes(term);
    }
  }
}
registerComponent('icon-set', IconSet);
```

```css
/* src/web-components/icon-set/styles.css */
.icon-set__search input { inline-size: 100%; padding: var(--size-s, 0.5rem);
  border: 1px solid var(--color-border, #d4d4d8); border-radius: var(--radius-s, 0.25rem); }
.icon-set__grid { list-style: none; margin: var(--size-m, 1rem) 0 0; padding: 0;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr)); gap: var(--size-2xs, 0.25rem); }
.icon-set__grid [hidden] { display: none; }
.icon-set__grid button { inline-size: 100%; display: grid; justify-items: center; gap: var(--size-2xs, 0.25rem);
  padding: var(--size-s, 0.75rem); background: none; border: 1px solid transparent; border-radius: var(--radius-s, 0.25rem);
  cursor: pointer; font-size: var(--font-size-xs, 0.75rem); color: inherit; }
.icon-set__grid button:hover { border-color: var(--color-border, #d4d4d8); background: var(--color-surface-2, #f4f4f5); }
.icon-set__grid i[data-icon] { font-size: 1.5rem; }
```

Create `api.json` (`set`, `names`) + minimal `static.html`; apply Port Procedure steps 2–4, 6–7. The
doc page's demo uses `<icon-set set="lucide"></icon-set>` (fetches the manifest on the live site).

- [ ] **Step 4: Run test to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(ds): icon-set catalog component + doc page"`

---

### Task 12: New component `icon-specimen` (design specimen)

Presents the project's icon *language*: a curated set shown across the sizing scale, with a
do/don't slot pair. Simpler than `icon-set` (no fetch/search).

**Files:**
- Create: `src/web-components/icon-specimen/{logic.js,styles.css,api.json,static.html}`
- Modify: `src/index.js`, `src/index.css`, `package.json`, `site/src/includes/sidebar-elements.html`
- Create: `site/src/pages/elements/icon-specimen.html`
- Test: `tests/components/icon-specimen.spec.js`

**Interfaces:**
- Produces: registered `<icon-specimen>`; attrs `set` (default `lucide`), `names` (space/comma list,
  required), `data-sizes` (default `"1rem 1.5rem 2rem"`). Slots `dont`/`do` optional.

- [ ] **Step 1: Write the failing test**

```js
// tests/components/icon-specimen.spec.js
import { test, expect } from '@playwright/test';

test('icon-specimen shows each icon across the size scale', async ({ page }) => {
  await page.goto('https://vb.test/vb-design-system/elements/icon-specimen/');
  await expect.poll(() => page.evaluate(() => !!customElements.get('icon-specimen'))).toBe(true);
  const el = await page.evaluateHandle(() => {
    const s = document.createElement('icon-specimen');
    s.setAttribute('names', 'check x'); s.setAttribute('data-sizes', '1rem 2rem');
    document.body.appendChild(s); return s;
  });
  // 2 icons × 2 sizes = 4 rendered [data-icon] cells
  const count = await page.evaluate(e => e.querySelectorAll('[data-icon]').length, el);
  expect(count).toBe(4);
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Implement**

```js
// src/web-components/icon-specimen/logic.js
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class IconSpecimen extends VBElement {
  static get observedAttributes() { return ['set', 'names', 'data-sizes']; }
  connectedCallback() { this.render(); }
  attributeChangedCallback() { this.render(); }

  render() {
    const set = this.getAttribute('set') || 'lucide';
    const names = (this.getAttribute('names') || '').split(/[\s,]+/).filter(Boolean);
    const sizes = (this.getAttribute('data-sizes') || '1rem 1.5rem 2rem').trim().split(/\s+/);
    const cell = (n) => `<td>${sizes.map(sz =>
      `<i data-icon="${n}" data-icon-set="${set}" style="font-size:${sz}"></i>`).join('')}</td>`;
    this.innerHTML = `
      <table class="icon-specimen">
        <thead><tr><th>Icon</th><th>Sizes (${sizes.join(' · ')})</th></tr></thead>
        <tbody>${names.map(n => `<tr><th scope="row"><code>${n}</code></th>${cell(n)}</tr>`).join('')}</tbody>
      </table>`;
  }
}
registerComponent('icon-specimen', IconSpecimen);
```

```css
/* src/web-components/icon-specimen/styles.css */
.icon-specimen { inline-size: 100%; border-collapse: collapse; }
.icon-specimen th, .icon-specimen td { text-align: start; padding: var(--size-s, 0.75rem);
  border-block-end: 1px solid var(--color-border, #d4d4d8); }
.icon-specimen td i[data-icon] { margin-inline-end: var(--size-m, 1rem); vertical-align: middle; }
```

Create `api.json` (`set`, `names`, `data-sizes`) + minimal `static.html`; apply Port Procedure steps 2–4, 6–7. Doc page demo: `<icon-specimen names="check x star settings" data-sizes="1rem 1.5rem 2rem"></icon-specimen>`.

- [ ] **Step 4: Run test to verify it passes** → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(ds): icon-specimen component + doc page"`

---

### Task 13: Full build, verify, publish

**Files:** none new — regenerate `docs/` and validate.

- [ ] **Step 1: Package build + exports parity**

```bash
cd ~/src/vb-design-system && npm run build
for c in accessibility-specimen breakpoint-specimen layout-specimen font-pairer gradient-builder theme-catalog theme-import palette-generator brand-specimen icon-set icon-specimen; do
  grep -q "\"./$c\"" package.json || echo "MISSING export: $c"
done
```
Expected: no `MISSING export` lines; build green.

- [ ] **Step 2: Doc site build + broken-link sweep**

```bash
cd site && npm run build && node scripts/publish-docs.js /vb-design-system
cd .. && grep -rhoE '(href|src)="/vb-design-system/[^"#?]*' docs --include='*.html' \
 | sed -E 's/.*="\/vb-design-system\///; s/\?.*//' | sort -u \
 | while read p; do [ -z "$p" ] && continue; [ -e "docs/$p" ] || [ -e "docs/${p}index.html" ] || echo "BROKEN: /$p"; done
```
Expected: elements index + sidebar list all 19; no `BROKEN` lines.

- [ ] **Step 3: Run all component tests**

```bash
npx playwright test tests/components/
```
Expected: all green (ds-ports, brand-specimen, icon-set, icon-specimen).

- [ ] **Step 4: Commit the regenerated docs**

```bash
git add -A && git commit -m "build(ds): regenerate docs for 11 new/ported components"
```

- [ ] **Step 5: Push (owner-gated)**

Do NOT push automatically. Report completion and let the owner run `git push` (matches the
decomposition workflow — publishing is owner-gated).

---

## Self-Review

**Spec coverage** (against `2026-06-30-ds-port-icons-brand-design.md`):
- Port the 8 (accessibility/breakpoint/layout specimens, font-pairer, gradient-builder,
  theme-catalog, theme-import, palette-generator) → Tasks 1–8. ✓
- New `brand-specimen`, `icon-set`, `icon-specimen` → Tasks 10–12. ✓
- `color-picker` documented runtime peer → Task 9. ✓
- Token contract (fallbacks, no build coupling) → Port Procedure step 5 + Global Constraints. ✓
- Doc page + sidebar per component → Port Procedure steps 6–7, each task. ✓
- theme-catalog depends on theme-import → Tasks 7→8 ordering + explicit build check. ✓
- semantic-palette keeps working after palette-generator port → Task 1 Step 4. ✓
- Depends on the icon plan for `[data-icon]`/manifests, with `<icon-wc>`/`names` fallback → Global Constraints, Tasks 11–12. ✓

**Placeholder scan:** Port tasks say "apply the Port Procedure" — this references a fully-specified
procedure in this document (not another task), and each task adds its component-specific details;
that is DRY, not a placeholder. Doc-page steps say "model on `<sibling>.html`" because the exact
sibling markup must be read at implementation time. All code steps for new components contain
complete code.

**Type/name consistency:** `registerComponent(tag, Class)` and `VBElement` import paths match the
existing 8 and the vendored `src/lib`. New tags (`brand-specimen`, `icon-set`, `icon-specimen`) are
consistent across their logic.js, tests, and doc-page demos. `data-icon`/`data-icon-set` usage
matches the icon plan.

## Non-goals

- No changes to VB core in this plan (the `[data-icon]` mechanism is the separate icon plan).
- No `theme-picker` port (stays core). No new icon assets. No multi-color `[data-icon]`.
