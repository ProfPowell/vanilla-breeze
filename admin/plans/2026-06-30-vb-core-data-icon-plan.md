# VB-core `[data-icon]` Icon Architecture — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a terse, native `[data-icon]` way to place a single icon in Vanilla Breeze — CSS-mask `::before` + a tiny always-on enhancer + full per-set no-JS stylesheets — without changing `icon-wc`.

**Architecture:** A static CSS rule paints `[data-icon]::before` as a `currentColor`-tinted, `em`-sized box masked by `var(--vb-icon)`. A small core-loaded enhancer resolves each element's icon set and sets `--vb-icon` to the SVG URL (browser loads it as a mask — no fetch/inject in JS). A build script generates per-set stylesheets (`--vb-icon` rule per icon) so any icon renders with zero JS when its set's CSS is loaded. `icon-wc` is untouched and shares the same `/cdn/icons` assets and `data-icon-set` global.

**Tech Stack:** Vanilla JS (ES modules, no deps), native CSS cascade layers + `@property`, Node.js scripts, `node --test` (unit), Playwright (component).

## Global Constraints

- No new runtime dependencies; platform-native only (project rule: "prefer platform-native over packages").
- Monochrome icons only for `[data-icon]` (mask + `currentColor`); multi-color/dynamic stays `icon-wc`.
- Set resolution must match `icon-wc`: per-element/ancestor `data-icon-set`, else `<html data-icon-set>`, else `lucide`. Base path: `document.documentElement.dataset.iconPath || '/cdn/icons'`.
- Generated per-set CSS uses **relative** `url()` (e.g. `url("lucide/star.svg")` from `/cdn/icons/lucide.css`) so it resolves correctly under GitHub-Pages subpaths.
- Conventional commits; commit after each task. Work on branch `work/decompose-packs`.
- Decorative by default; functional icon-only controls carry their own accessible name (unchanged from today).

---

### Task 1: Shared icon-URL resolver

Pure, DOM-light helpers reused by the enhancer (and available to future callers). Isolating the logic makes it unit-testable without a browser.

**Files:**
- Create: `src/lib/icon-url.js`
- Test: `tests/unit/icon-url.test.js`

**Interfaces:**
- Produces:
  - `buildIconUrl({ basePath, set, name }) => string` — returns `` `${basePath}/${set}/${name}.svg` ``.
  - `resolveIconSet(el, doc) => string` — `el.closest('[data-icon-set]')?.getAttribute('data-icon-set')` || `doc.documentElement.dataset.iconSet` || `'lucide'`.
  - `resolveIconBase(doc) => string` — `doc.documentElement.dataset.iconPath || '/cdn/icons'`.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/icon-url.test.js
// Run with: node --test tests/unit/icon-url.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildIconUrl, resolveIconSet, resolveIconBase } from '../../src/lib/icon-url.js';

// Minimal DOM stand-ins (project does not use jsdom).
const el = (attrs = {}, ancestorSet) => ({
  getAttribute: (k) => (k in attrs ? attrs[k] : null),
  closest: (sel) => (sel === '[data-icon-set]' && ancestorSet
    ? { getAttribute: () => ancestorSet } : null),
});
const doc = (iconSet, iconPath) => ({ documentElement: { dataset: { iconSet, iconPath } } });

describe('icon-url', () => {
  it('builds the SVG url from base/set/name', () => {
    assert.equal(
      buildIconUrl({ basePath: '/cdn/icons', set: 'lucide', name: 'star' }),
      '/cdn/icons/lucide/star.svg'
    );
  });

  it('resolves set from element attr first', () => {
    assert.equal(resolveIconSet(el({ 'data-icon-set': 'phosphor' }), doc('tabler')), 'phosphor');
  });

  it('resolves set from ancestor when element has none', () => {
    assert.equal(resolveIconSet(el({}, 'mage'), doc('tabler')), 'mage');
  });

  it('falls back to global data-icon-set, then lucide', () => {
    assert.equal(resolveIconSet(el({}), doc('tabler')), 'tabler');
    assert.equal(resolveIconSet(el({}), doc(undefined)), 'lucide');
  });

  it('resolves base path from data-icon-path or default', () => {
    assert.equal(resolveIconBase(doc(undefined, '/vb/cdn/icons')), '/vb/cdn/icons');
    assert.equal(resolveIconBase(doc(undefined, undefined)), '/cdn/icons');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/icon-url.test.js`
Expected: FAIL — `Cannot find module '../../src/lib/icon-url.js'`.

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/icon-url.js
/**
 * Icon URL/set resolution shared by icon-wc and the [data-icon] enhancer.
 * Kept DOM-light so it is unit-testable without a browser.
 */

/** @param {{basePath:string,set:string,name:string}} p */
export function buildIconUrl({ basePath, set, name }) {
  return `${basePath}/${set}/${name}.svg`;
}

/**
 * @param {Element} el
 * @param {Document} [doc]
 * @returns {string} resolved icon set
 */
export function resolveIconSet(el, doc = document) {
  const own = el.getAttribute('data-icon-set');
  if (own) return own;
  const anc = el.closest('[data-icon-set]');
  if (anc) return anc.getAttribute('data-icon-set');
  return doc.documentElement.dataset.iconSet || 'lucide';
}

/** @param {Document} [doc] */
export function resolveIconBase(doc = document) {
  return doc.documentElement.dataset.iconPath || '/cdn/icons';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/unit/icon-url.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/icon-url.js tests/unit/icon-url.test.js
git commit -m "feat(icons): shared icon-url resolver for [data-icon]"
```

---

### Task 2: `[data-icon]` CSS rule

The static rule that paints the icon. Uses `@property --vb-icon` with an empty-SVG initial value so an unresolved icon renders **invisible** (not a solid `currentColor` square).

**Files:**
- Create: `src/custom-elements/icon-attributes.css`
- Modify: `src/custom-elements/index.css` (add one `@import`, after `layout-attributes.css` on line 3)
- Test: `tests/components/data-icon.spec.js` (created here; extended in Task 3)

**Interfaces:**
- Produces: the `[data-icon]::before` rule keyed on the `--vb-icon` custom property (set by Task 3 enhancer or Task 4 generated CSS).

- [ ] **Step 1: Write the failing component test**

```js
// tests/components/data-icon.spec.js
import { test, expect } from '@playwright/test';

// Serves a tiny page that loads VB core CSS and sets --vb-icon by hand
// (isolates the CSS rule from the enhancer, which Task 3 covers).
const page = `<!doctype html><html data-icon-path="/cdn/icons"><head>
<link rel="stylesheet" href="/src/main.css"></head><body>
<i data-icon="star" style="--vb-icon:url('/cdn/icons/lucide/star.svg')"></i>
<i id="bare" data-icon="star"></i>
</body></html>`;

test('[data-icon]::before paints a currentColor-tinted em box', async ({ page: p }) => {
  await p.route('**/x.html', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('https://vb.test/x.html');
  const star = p.locator('i[data-icon="star"]').first();
  const box = await star.evaluate((el) => {
    const cs = getComputedStyle(el, '::before');
    return { content: cs.content, w: cs.width, mask: cs.maskImage || cs.webkitMaskImage,
             bg: cs.backgroundColor };
  });
  expect(box.content).toBe('""');
  expect(box.mask).toContain('star.svg');
  // 1em box; default font-size 16px
  expect(box.w).toBe('16px');
});

test('unresolved [data-icon] renders no visible square', async ({ page: p }) => {
  await p.route('**/x.html', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('https://vb.test/x.html');
  const mask = await p.locator('#bare').evaluate((el) => {
    const cs = getComputedStyle(el, '::before');
    return cs.maskImage || cs.webkitMaskImage;
  });
  // @property initial value is an empty SVG -> effectively invisible, not "none"
  expect(mask).not.toBe('none');
  expect(mask).toContain('svg');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/components/data-icon.spec.js`
Expected: FAIL — no `::before` mask (rule not present yet).

- [ ] **Step 3: Write the CSS rule**

```css
/* src/custom-elements/icon-attributes.css
   [data-icon] — terse, native single-icon primitive (sibling of <icon-wc>).
   The enhancer (src/web-components/icon-wc/enhance-data-icon.js) or a generated
   per-set stylesheet sets --vb-icon to the SVG url; the browser loads it as a
   CSS mask, tinted by currentColor. Monochrome only; multi-color -> <icon-wc>. */

@property --vb-icon {
  syntax: "<image>";
  inherits: false;
  /* Empty SVG: an unresolved icon masks to nothing (invisible), never a solid square. */
  initial-value: url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22/%3E');
}

[data-icon]::before {
  content: "";
  display: inline-block;
  inline-size: 1em;
  block-size: 1em;
  vertical-align: -0.125em;
  background-color: currentColor;
  -webkit-mask: var(--vb-icon) no-repeat center / contain;
          mask: var(--vb-icon) no-repeat center / contain;
}
```

- [ ] **Step 4: Wire the import**

Modify `src/custom-elements/index.css` — add after line 3 (`@import "./layout-attributes.css";`):

```css
@import "./icon-attributes.css";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx playwright test tests/components/data-icon.spec.js`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/custom-elements/icon-attributes.css src/custom-elements/index.css tests/components/data-icon.spec.js
git commit -m "feat(icons): [data-icon] CSS mask rule with @property fallback"
```

---

### Task 3: The `[data-icon]` enhancer

Core-loaded module that scans `[data-icon]` elements, sets `--vb-icon`, and watches for added nodes / attribute changes. No SVG fetch/inject — it only sets the custom property.

**Files:**
- Create: `src/web-components/icon-wc/enhance-data-icon.js`
- Modify: `src/web-components/icon-wc/icon-wc.js` (add one import at top)
- Test: `tests/components/data-icon.spec.js` (extend)

**Interfaces:**
- Consumes: `buildIconUrl`, `resolveIconSet`, `resolveIconBase` from `src/lib/icon-url.js` (Task 1).
- Produces: side-effect on import — enhances all current and future `[data-icon]` elements by setting inline `--vb-icon`.

- [ ] **Step 1: Write the failing tests (append to data-icon.spec.js)**

```js
// Append to tests/components/data-icon.spec.js
const appPage = `<!doctype html><html data-icon-path="/cdn/icons"><head>
<link rel="stylesheet" href="/src/main.css">
<script type="module" src="/src/web-components/icon-wc/icon-wc.js"></script></head><body>
<i id="a" data-icon="star"></i>
<button id="b" data-icon="x">Close</button>
<span id="c" data-icon="home" data-icon-set="phosphor"></span>
</body></html>`;

test('enhancer sets --vb-icon from name + resolved set', async ({ page: p }) => {
  await p.route('**/app.html', r => r.fulfill({ contentType: 'text/html', body: appPage }));
  await p.goto('https://vb.test/app.html');
  const a = await p.locator('#a').evaluate(el => el.style.getPropertyValue('--vb-icon'));
  const c = await p.locator('#c').evaluate(el => el.style.getPropertyValue('--vb-icon'));
  expect(a).toContain('/cdn/icons/lucide/star.svg');
  expect(c).toContain('/cdn/icons/phosphor/home.svg');
});

test('icon coexists with button text', async ({ page: p }) => {
  await p.route('**/app.html', r => r.fulfill({ contentType: 'text/html', body: appPage }));
  await p.goto('https://vb.test/app.html');
  await expect(p.locator('#b')).toHaveText('Close');
  const mask = await p.locator('#b').evaluate(el =>
    (getComputedStyle(el, '::before').maskImage || getComputedStyle(el, '::before').webkitMaskImage));
  expect(mask).toContain('x.svg');
});

test('dynamically added [data-icon] is enhanced', async ({ page: p }) => {
  await p.route('**/app.html', r => r.fulfill({ contentType: 'text/html', body: appPage }));
  await p.goto('https://vb.test/app.html');
  const val = await p.evaluate(async () => {
    const i = document.createElement('i');
    i.setAttribute('data-icon', 'search');
    document.body.appendChild(i);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return i.style.getPropertyValue('--vb-icon');
  });
  expect(val).toContain('/cdn/icons/lucide/search.svg');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx playwright test tests/components/data-icon.spec.js -g "enhancer|coexists|dynamically"`
Expected: FAIL — `--vb-icon` empty (enhancer not wired yet).

- [ ] **Step 3: Write the enhancer**

```js
// src/web-components/icon-wc/enhance-data-icon.js
/**
 * [data-icon] enhancer — sets --vb-icon on every [data-icon] element so the
 * CSS rule in custom-elements/icon-attributes.css can mask the SVG. Does NOT
 * fetch or inject SVG; the browser loads the url as a mask resource.
 * Loaded as a side effect of icon-wc.js (which is in both core.js and index.js).
 */
import { buildIconUrl, resolveIconSet, resolveIconBase } from '../../lib/icon-url.js';

/** @param {Element} el */
function enhance(el) {
  const name = el.getAttribute('data-icon');
  if (!name) return;
  const url = buildIconUrl({
    basePath: resolveIconBase(document),
    set: resolveIconSet(el, document),
    name,
  });
  el.style.setProperty('--vb-icon', `url("${url}")`);
}

function enhanceAll(root = document) {
  for (const el of root.querySelectorAll('[data-icon]')) enhance(el);
}

let started = false;
function start() {
  if (started) return;
  started = true;
  enhanceAll();

  // React to added nodes and data-icon / data-icon-set attribute changes.
  const mo = new MutationObserver((records) => {
    for (const rec of records) {
      if (rec.type === 'attributes') {
        const t = /** @type {Element} */ (rec.target);
        if (t.hasAttribute && t.hasAttribute('data-icon')) enhance(t);
        // An ancestor's data-icon-set changed -> re-resolve its descendants.
        if (rec.attributeName === 'data-icon-set' && t.querySelectorAll) enhanceAll(t);
      } else {
        for (const node of rec.addedNodes) {
          if (node.nodeType !== 1) continue;
          const el = /** @type {Element} */ (node);
          if (el.hasAttribute('data-icon')) enhance(el);
          if (el.querySelectorAll) enhanceAll(el);
        }
      }
    }
  });
  mo.observe(document.documentElement, {
    subtree: true, childList: true,
    attributes: true, attributeFilter: ['data-icon', 'data-icon-set'],
  });
}

// Modules are deferred, so the DOM is parsed by the time this runs.
if (typeof document !== 'undefined') start();
```

- [ ] **Step 4: Wire it into icon-wc.js**

Modify `src/web-components/icon-wc/icon-wc.js` — add as the first import (line 1, before the existing `import { styles }`):

```js
import './enhance-data-icon.js';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx playwright test tests/components/data-icon.spec.js`
Expected: PASS (5 tests total).

- [ ] **Step 6: Commit**

```bash
git add src/web-components/icon-wc/enhance-data-icon.js src/web-components/icon-wc/icon-wc.js tests/components/data-icon.spec.js
git commit -m "feat(icons): [data-icon] enhancer (core-loaded via icon-wc)"
```

---

### Task 4: Per-set no-JS stylesheet generator

A build script that enumerates `dist/cdn/icons/{set}/*.svg` and emits `dist/cdn/icons/{set}.css` with a `--vb-icon` rule per icon. Default set (`lucide`) rules are unscoped; other sets are scoped by `data-icon-set`. Relative `url()` keeps it subpath-portable.

**Files:**
- Create: `scripts/gen-icon-css.js` (exports a pure `generateSetCss(setName, iconNames, { isDefault }) => string`, plus a CLI main)
- Test: `tests/unit/gen-icon-css.test.js`

**Interfaces:**
- Produces: `generateSetCss(setName: string, iconNames: string[], opts?: {isDefault?: boolean}) => string`.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/gen-icon-css.test.js
// Run with: node --test tests/unit/gen-icon-css.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateSetCss } from '../../scripts/gen-icon-css.js';

describe('generateSetCss', () => {
  it('emits unscoped rules with relative url for the default set', () => {
    const css = generateSetCss('lucide', ['star', 'x'], { isDefault: true });
    assert.match(css, /\[data-icon="star"\]\{--vb-icon:url\("lucide\/star\.svg"\)\}/);
    assert.match(css, /\[data-icon="x"\]\{--vb-icon:url\("lucide\/x\.svg"\)\}/);
    assert.doesNotMatch(css, /data-icon-set/);
  });

  it('emits set-scoped rules for a non-default set', () => {
    const css = generateSetCss('phosphor', ['star'], { isDefault: false });
    assert.match(
      css,
      /\[data-icon-set="phosphor"\] \[data-icon="star"\],\[data-icon-set="phosphor"\]\[data-icon="star"\]\{--vb-icon:url\("phosphor\/star\.svg"\)\}/
    );
  });

  it('escapes nothing unusual and is deterministic (sorted)', () => {
    const css = generateSetCss('lucide', ['x', 'a'], { isDefault: true });
    assert.ok(css.indexOf('data-icon="a"') < css.indexOf('data-icon="x"'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/gen-icon-css.test.js`
Expected: FAIL — `Cannot find module '../../scripts/gen-icon-css.js'`.

- [ ] **Step 3: Write the generator**

```js
// scripts/gen-icon-css.js
/**
 * Generate per-set [data-icon] stylesheets so every icon in a set renders with
 * zero JS. Default set -> unscoped rules; other sets -> data-icon-set-scoped.
 * Relative url() (e.g. "lucide/star.svg") resolves against the stylesheet's own
 * location (/cdn/icons/lucide.css), so it works under GitHub-Pages subpaths.
 *
 * CLI:  node scripts/gen-icon-css.js            (scans dist/cdn/icons/*)
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_SET = 'lucide';

/**
 * @param {string} setName
 * @param {string[]} iconNames
 * @param {{isDefault?: boolean}} [opts]
 * @returns {string}
 */
export function generateSetCss(setName, iconNames, { isDefault = false } = {}) {
  const rules = [...iconNames].sort().map((name) => {
    const url = `url("${setName}/${name}.svg")`;
    if (isDefault) return `[data-icon="${name}"]{--vb-icon:${url}}`;
    return `[data-icon-set="${setName}"] [data-icon="${name}"],` +
           `[data-icon-set="${setName}"][data-icon="${name}"]{--vb-icon:${url}}`;
  });
  return `/* generated by scripts/gen-icon-css.js — do not edit */\n${rules.join('\n')}\n`;
}

// --- CLI ---
const here = dirname(fileURLToPath(import.meta.url));
const iconsRoot = join(here, '..', 'dist', 'cdn', 'icons');

function main() {
  const sets = readdirSync(iconsRoot).filter((n) => {
    try { return statSync(join(iconsRoot, n)).isDirectory(); } catch { return false; }
  });
  for (const set of sets) {
    const names = readdirSync(join(iconsRoot, set))
      .filter((f) => f.endsWith('.svg'))
      .map((f) => f.slice(0, -4));
    if (!names.length) continue;
    const css = generateSetCss(set, names, { isDefault: set === DEFAULT_SET });
    writeFileSync(join(iconsRoot, `${set}.css`), css);
    // Also emit a names manifest so DS's <icon-set> catalog can list the set.
    writeFileSync(join(iconsRoot, `${set}.json`), JSON.stringify([...names].sort()));
    console.log(`icons: ${set}.css + ${set}.json (${names.length} icons)`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/unit/gen-icon-css.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/gen-icon-css.js tests/unit/gen-icon-css.test.js
git commit -m "feat(icons): per-set no-JS [data-icon] stylesheet generator"
```

---

### Task 5: Wire the generator into the build + verify lucide output

**Files:**
- Modify: `package.json` (add `gen:icon-css` script; call it from the CDN build)
- Verify: `dist/cdn/icons/lucide.css` produced with real rules

- [ ] **Step 1: Add the npm script**

In `package.json` `scripts`, add:

```json
"gen:icon-css": "node scripts/gen-icon-css.js",
```

- [ ] **Step 2: Hook it into the CDN build**

Find the existing CDN build script (`grep -n '"build:cdn"' package.json`). Append `&& npm run gen:icon-css` to that script so the stylesheets regenerate whenever icons/CDN are built. Example (adapt to the real value):

```json
"build:cdn": "node scripts/build-cdn.js && npm run gen:icon-css",
```

- [ ] **Step 3: Run the generator against the real icons**

Run: `npm run gen:icon-css`
Expected: prints `icons: lucide.css (1913 icons)` and lines for the other sets.

- [ ] **Step 4: Verify the output**

Run: `grep -c 'data-icon=' dist/cdn/icons/lucide.css && grep -m1 'data-icon="star"' dist/cdn/icons/lucide.css`
Expected: a count of ~1913, and a line `[data-icon="star"]{--vb-icon:url("lucide/star.svg")}` (unscoped, relative url).

Run: `grep -m1 'data-icon="star"' dist/cdn/icons/phosphor.css`
Expected: a `[data-icon-set="phosphor"] [data-icon="star"],…` scoped rule.

- [ ] **Step 5: Commit**

```bash
git add package.json dist/cdn/icons/*.css dist/cdn/icons/*.json
git commit -m "build(icons): generate per-set [data-icon] stylesheets + name manifests"
```

---

### Task 6: Documentation page

Author a VB docs page for the `[data-icon]` primitive covering: usage on `<i>`/`<span>`/`<button>`, `data-icon-set`, sizing via `font-size`, the no-JS per-set stylesheet, and the boundary with `icon-wc` (multi-color/dynamic).

**Files:**
- Create: `site/src/pages/docs/elements/web-components/data-icon.html` (follow the structure of a sibling page, e.g. `site/src/pages/docs/elements/web-components/icon-wc.html` if present, else `theme-picker.html`)

- [ ] **Step 1: Inspect a sibling doc page for the exact layout/front-matter**

Run: `ls site/src/pages/docs/elements/web-components/ | head` and open the closest existing page to copy its front-matter + `<browser-window>`/`<code-block>` demo structure.

- [ ] **Step 2: Write the page**

Include, at minimum: a live `<browser-window>` demo showing `<i data-icon="star">`, a size example (`style="font-size:2rem"`), a `data-icon-set` example, a "no-JS" note pointing at `/cdn/icons/<set>.css`, and a "when to use icon-wc instead" callout (multi-color, runtime name changes). Use real VB doc conventions (no `<div>`; `<browser-window>` + `<code-block>`).

- [ ] **Step 3: Build the docs and check the nav/links**

Run: `npm run build:site-assets && npm run conformance`
Expected: no conformance regressions; the new page builds and appears in `check:nav`.

- [ ] **Step 4: Commit**

```bash
git add site/src/pages/docs/elements/web-components/data-icon.html
git commit -m "docs(icons): [data-icon] element page"
```

---

### Task 7: Full verification

- [ ] **Step 1: Run the unit + component suites**

Run: `npm test && npx playwright test tests/components/data-icon.spec.js`
Expected: all green.

- [ ] **Step 2: Run conformance**

Run: `npm run conformance`
Expected: no new warnings attributable to the icon changes.

- [ ] **Step 3: Manual smoke (optional)**

Load a page using only `src/main.css` + `src/main.js` with `<i data-icon="check">` and confirm the icon renders in `currentColor` and scales with `font-size`; toggle `<html data-icon-set="phosphor">` and confirm the glyph changes.

- [ ] **Step 4: Final commit (if anything pending)**

```bash
git add -A && git commit -m "test(icons): verify [data-icon] end-to-end" || echo "nothing to commit"
```

---

## Self-Review

**Spec coverage** (against `admin/plans/2026-06-30-ds-port-icons-brand-design.md`, Icons/core section):
- `[data-icon]::before` mask rule + `em` sizing + `currentColor` → Task 2. ✓
- Enhancer sets `--vb-icon`, reuses set resolution, MutationObserver → Tasks 1, 3. ✓
- Full per-set no-JS stylesheets, set-scoped, relative url → Tasks 4, 5. ✓
- `icon-wc` unchanged (only an added import) → Task 3 (import only). ✓
- `data-icon-set` element + global switching → Tasks 1, 3 (tested). ✓
- Decorative-by-default a11y → Global Constraints + Task 6 doc. ✓
- Docs page → Task 6. ✓

**Placeholder scan:** Task 5 Step 2 and Task 6 reference "adapt to the real value"/"closest existing page" — these are deliberate because the exact `build:cdn` string and the sibling doc-page markup must be read from the repo at implementation time; every other step has literal code/commands. No `TBD`/`TODO`.

**Type consistency:** `buildIconUrl`/`resolveIconSet`/`resolveIconBase` signatures are identical across Tasks 1 and 3. `generateSetCss(setName, iconNames, {isDefault})` identical across Tasks 4 and 5. `--vb-icon` custom property name identical across Tasks 2, 3, 4.

## Non-goals

Multi-color icons, `<use>` sprites, shipping all sets' CSS by default, and any `icon-wc` behavior change are explicitly out of scope (see design doc).
