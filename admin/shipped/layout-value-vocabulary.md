# Layout Value Vocabulary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-enumerated raw-length values on `data-layout-min` / `-threshold` / `-content-min` with a closed t-shirt-scale vocabulary, add a documented custom-property escape hatch, and add a conformance rule that rejects any unknown layout attribute value.

**Architecture:** Four CSS enum blocks (each currently forked between an element form and an attribute form) are rewritten to map tokens onto private custom properties. A `var()` chain lets an author-set public custom property override the token. A codemod migrates ~246 files. A new conformance rule derives its vocabulary by parsing the CSS at lint time rather than carrying a second copy of the list.

**Tech Stack:** Plain CSS (nesting, custom properties), Node ESM scripts, `node --test` for unit tests, Playwright for visual/component baselines, `linkedom` (already a conformance dependency).

**Spec:** [`admin/specs/layout-value-vocabulary-v1.md`](../specs/layout-value-vocabulary-v1.md)

## Global Constraints

- **Vocabulary is closed.** Only `xs|s|m|l|xl` plus the behavioral keywords `auto` and `full`. No raw lengths in the HTML API.
- **The conformance vocabulary is never hand-written.** It is parsed from `src/custom-elements/layout-attributes.css` and `src/custom-elements/layout-*/styles.css` at lint time. A hardcoded copy is the exact failure `vanilla-breeze-zccp` eliminated from the JS entry points.
- **Escape-hatch properties are `--layout-min`, `--layout-threshold`, `--layout-content-min`.** Author value beats token value.
- **`auto` and `full` are behavioral keywords, not scale points.** `full` (`inline-size: 100%`) coexists with `xl` (`30rem`) on `item-width` and must not be folded into it.
- **Cover `xl` is `100dvh`**, replacing the current `100vh` / `100svh` / `100dvh` trio. This is a deliberate behavior change requiring visual-baseline review.
- **Tie-breaks round UP.** Where a legacy value sits exactly between two tokens (`200px`, `280px`, `360px`, `75vh`, `35rem`, `45`), it maps to the larger token. Applied consistently so the mapping is mechanical and reviewable.
- **Both forks get the same block.** Each enum currently exists twice (element form in `layout-*/styles.css`, attribute form in `layout-attributes.css`). Write the token block into both, identically. `vanilla-breeze-aoku` merges them via `:is()` afterwards — deliberately *not* this plan's job, so aoku merges the final shape once.
- **Conformance gates `.html` / `.htm` / `.xhtml` only** (`vb-conformance.js:335`), and `npm run conformance` targets `demos/examples/demos/`. `.njk` files under `site/src` are migrated by the codemod but not gated. That is existing behavior; do not change it here.
- Every task ends green on `npm test` and `npm run conformance`.

---

### Task 0: Migrate the f16e keyword typos

Prerequisite for the conformance rule — these are unrelated to the vocabulary change but would light up the new rule on day one. `vanilla-breeze-f16e`.

**Files:**
- Modify: ~60 files under `demos/` and `site/src/`
- Test: `tests/unit/layout-vocabulary.test.js` (created in Task 1 — for this task, verification is grep + existing suites)

**Interfaces:**
- Produces: a corpus with zero keyword typos, so Task 4's rule can go to error severity.

The five mechanical substitutions, with counts from the audit:

| From | To | Count | Why |
|---|---|---|---|
| `data-layout-justify="flex-end"` | `data-layout-justify="end"` | 18 | enum is `start\|end\|center\|between` (`layout-attributes.css:57-60`) |
| `data-layout-justify="space-between"` | `data-layout-justify="between"` | 7 | same enum |
| `data-layout-max="readable"` | `data-layout-max="prose"` | 10 | enum is `content\|narrow\|normal\|prose\|wide` |
| `data-layout-side="right"` | `data-layout-side="end"` | 6 | only `end` is defined (`layout-attributes.css:324`) |
| `data-layout-side="left"` / `="start"` | *remove the attribute* | 3 | start is the implicit default; there is no `start` rule |

`data-layout="reel"` (5 uses) must become the `<layout-reel>` element — reel has **no** attribute form (verified: zero `[data-layout="reel"]` rules exist), so those sections currently render completely unstyled.

- [ ] **Step 1: Confirm the current counts before touching anything**

```bash
cd /Users/tpowell/src/vanilla-breeze
for pat in 'data-layout-justify="flex-end"' 'data-layout-justify="space-between"' \
           'data-layout-max="readable"' 'data-layout-side="right"' \
           'data-layout-side="left"' 'data-layout-side="start"' 'data-layout="reel"'; do
  printf '%-45s %s\n' "$pat" "$(grep -rho "$pat" demos site/src 2>/dev/null | wc -l)"
done
```

Expected: `flex-end` 18, `space-between` 7, `readable` 10, `right` 6, `left` 1, `start` 2, `reel` 5. If these differ, stop and reconcile — the corpus has moved since the audit.

- [ ] **Step 2: Apply the four straight substitutions**

```bash
cd /Users/tpowell/src/vanilla-breeze
files=$(grep -rl 'data-layout-justify="flex-end"\|data-layout-justify="space-between"\|data-layout-max="readable"\|data-layout-side="right"' demos site/src 2>/dev/null)
for f in $files; do
  perl -pi -e 's/data-layout-justify="flex-end"/data-layout-justify="end"/g;
               s/data-layout-justify="space-between"/data-layout-justify="between"/g;
               s/data-layout-max="readable"/data-layout-max="prose"/g;
               s/data-layout-side="right"/data-layout-side="end"/g;' "$f"
done
```

- [ ] **Step 3: Remove the no-op `side` values**

`left` and `start` have no rule at all, so the attribute is dead weight. Delete the attribute, preserving surrounding whitespace:

```bash
cd /Users/tpowell/src/vanilla-breeze
files=$(grep -rl 'data-layout-side="left"\|data-layout-side="start"' demos site/src 2>/dev/null)
for f in $files; do
  perl -pi -e 's/\s*data-layout-side="(left|start)"//g' "$f"
done
```

- [ ] **Step 4: Convert `data-layout="reel"` to the element form**

These need judgment — the wrapper element changes, so review each. List them:

```bash
grep -rn 'data-layout="reel"' demos site/src
```

For each hit, replace the host element with `<layout-reel>` and drop `data-layout="reel"`, e.g.

```html
<!-- before: renders unstyled, reel has no attribute form -->
<section data-layout="reel" data-layout-item-width="m">…</section>

<!-- after -->
<layout-reel data-layout-item-width="m">…</layout-reel>
```

Keep any other `data-layout-*` attributes on the element — they work on both forms.

- [ ] **Step 5: Verify all five patterns are gone**

```bash
cd /Users/tpowell/src/vanilla-breeze
grep -rn 'data-layout-justify="flex-end"\|data-layout-justify="space-between"\|data-layout-max="readable"\|data-layout-side="right"\|data-layout-side="left"\|data-layout-side="start"\|data-layout="reel"' demos site/src
```

Expected: no output.

- [ ] **Step 6: Run conformance and the unit suite**

```bash
npm run conformance && npm test
```

Expected: conformance `0 error(s), 0 warning(s)`; unit tests all pass.

- [ ] **Step 7: Rebuild and review visual baselines**

These layouts genuinely change — they were silently broken, so the corrected rendering is the point.

```bash
npm run build && npx playwright test tests/visual/
```

Review each diff. Where the new rendering is correct, update the baseline:

```bash
npx playwright test tests/visual/ --update-snapshots
```

**Never run two Playwright invocations concurrently** — they share a server that gets torn down.

- [ ] **Step 8: Commit**

```bash
git add demos site/src tests/visual
git commit -m "fix(layout): migrate keyword typos to the defined vocabulary (f16e)

justify=flex-end/space-between, max=readable, side=right and the
attribute form of reel were never defined in CSS, so ~44 usages
silently fell back to defaults. Layouts change because they were
broken; baselines regenerated accordingly."
```

---

### Task 1: Vocabulary extraction module

The single source of truth reader. Everything downstream — the conformance rule, the tests, the codemod's validation — asks this module what the vocabulary is.

**Files:**
- Create: `scripts/quality/layout-vocabulary.js`
- Create: `tests/unit/layout-vocabulary.test.js`

**Interfaces:**
- Produces:
  - `readLayoutVocabulary(root?: string): Map<string, Set<string>>` — attribute name **without** the `data-layout-` prefix (e.g. `"min"`, `"gap"`) → set of valid values.
  - `LAYOUT_ATTR_RE: RegExp` — matches `data-layout-<name>="<value>"`, global.
  - `ESCAPE_HATCH_PROPS: Set<string>` — `--layout-min`, `--layout-threshold`, `--layout-content-min`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/layout-vocabulary.test.js`:

```js
/**
 * The layout vocabulary is parsed out of the CSS, never hand-listed.
 * A second copy of this list is a second thing to drift — the same
 * failure vanilla-breeze-zccp removed from the JS entry points.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readLayoutVocabulary, ESCAPE_HATCH_PROPS } from '../../scripts/quality/layout-vocabulary.js';

describe('readLayoutVocabulary', () => {
  const vocab = readLayoutVocabulary();

  it('finds every layout attribute that has enumerated values', () => {
    for (const attr of ['min', 'max', 'gap', 'threshold', 'content-min', 'item-width']) {
      assert.ok(vocab.has(attr), `data-layout-${attr} missing from the parsed vocabulary`);
    }
  });

  it('keys attributes without the data-layout- prefix', () => {
    assert.ok(!vocab.has('data-layout-min'));
  });

  it('reads values from both the element and attribute forks', () => {
    // gap is defined in layout-attributes.css; item-width only in
    // layout-reel/styles.css. Both must be picked up.
    assert.ok(vocab.get('item-width').has('full'), 'element-fork file not scanned');
    assert.ok(vocab.get('gap').has('m'), 'attribute-fork file not scanned');
  });

  it('names the three escape-hatch custom properties', () => {
    assert.deepEqual(
      [...ESCAPE_HATCH_PROPS].sort(),
      ['--layout-content-min', '--layout-min', '--layout-threshold'],
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
node --test tests/unit/layout-vocabulary.test.js
```

Expected: FAIL — `Cannot find module '.../scripts/quality/layout-vocabulary.js'`.

- [ ] **Step 3: Write the module**

Create `scripts/quality/layout-vocabulary.js`:

```js
/**
 * layout-vocabulary — the parsed source of truth for data-layout-* values.
 *
 * The layout system encodes its vocabulary as attribute selectors:
 *
 *   [data-layout="grid"][data-layout-min="m"] { --_min-token: 15rem; }
 *
 * Rather than maintain a second copy of that list for the conformance
 * checker to validate against, read it back out of the CSS. A hand-written
 * copy drifts the moment someone adds a token — which is precisely the
 * failure mode vanilla-breeze-zccp removed from the JS entry points.
 *
 * See admin/specs/layout-value-vocabulary-v1.md.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(HERE, '../..');

/** Matches data-layout-<name>="<value>" in CSS selectors and in HTML. */
export const LAYOUT_ATTR_RE = /data-layout-([a-z-]+)="([^"]*)"/g;

/** Public custom properties that override a token. */
export const ESCAPE_HATCH_PROPS = new Set([
  '--layout-min',
  '--layout-threshold',
  '--layout-content-min',
]);

/**
 * Every CSS file that defines layout vocabulary.
 *
 * @param {string} root - Repo root.
 * @returns {string[]} absolute paths
 */
function vocabularyFiles(root) {
  const base = join(root, 'src', 'custom-elements');
  const files = [join(base, 'layout-attributes.css')];
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith('layout-')) {
      files.push(join(base, entry.name, 'styles.css'));
    }
  }
  return files.filter((f) => {
    try {
      readFileSync(f);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Parse the valid value set for every data-layout-* attribute.
 *
 * @param {string} [root] - Repo root; defaults to the checkout this file is in.
 * @returns {Map<string, Set<string>>} attribute name (no prefix) → valid values
 */
export function readLayoutVocabulary(root = DEFAULT_ROOT) {
  const vocab = new Map();
  for (const file of vocabularyFiles(root)) {
    const css = readFileSync(file, 'utf8');
    for (const [, attr, value] of css.matchAll(LAYOUT_ATTR_RE)) {
      if (!vocab.has(attr)) vocab.set(attr, new Set());
      vocab.get(attr).add(value);
    }
  }
  return vocab;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test tests/unit/layout-vocabulary.test.js
```

Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add scripts/quality/layout-vocabulary.js tests/unit/layout-vocabulary.test.js
git commit -m "feat(quality): parse the layout value vocabulary from CSS (x1yl)

Single source of truth for what data-layout-* values exist, read back
out of the CSS instead of hand-listed, so the conformance rule can
never disagree with the stylesheet."
```

---

### Task 2: Tokenize the four enums + add the escape hatch

**Files:**
- Modify: `src/custom-elements/layout-grid/styles.css:1-29` (element fork, nested `&`)
- Modify: `src/custom-elements/layout-attributes.css:95-117` (grid attribute fork)
- Modify: `src/custom-elements/layout-cover/styles.css:11-19` and `layout-attributes.css:526-534`
- Modify: `src/custom-elements/layout-switcher/styles.css:23-28` and `layout-attributes.css:598-603`
- Modify: `src/custom-elements/layout-sidebar/styles.css:40-42` and `layout-attributes.css:340-342`
- Test: `tests/unit/layout-vocabulary.test.js` (extend)

**Interfaces:**
- Consumes: `readLayoutVocabulary()` from Task 1.
- Produces: vocabulary where `min` = `{xs,s,m,l,xl,auto}`, `threshold` = `{s,m,l}`, `content-min` = `{s,m,l}`; private props `--_min`, `--_min-height`, `--_threshold`, `--_content-min` resolved through `--layout-*`.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/layout-vocabulary.test.js`:

```js
describe('tokenized layout vocabulary', () => {
  const vocab = readLayoutVocabulary();

  it('min is the t-shirt scale plus auto — no raw lengths', () => {
    assert.deepEqual(
      [...vocab.get('min')].sort(),
      ['auto', 'l', 'm', 's', 'xl', 'xs'],
      'data-layout-min still enumerates raw lengths; they belong to --layout-min now.',
    );
  });

  it('threshold and content-min are tokenized', () => {
    assert.deepEqual([...vocab.get('threshold')].sort(), ['l', 'm', 's']);
    assert.deepEqual([...vocab.get('content-min')].sort(), ['l', 'm', 's']);
  });

  it('no layout attribute enumerates a raw length anywhere', () => {
    const offenders = [];
    for (const [attr, values] of vocab) {
      for (const v of values) {
        if (/^[\d.]+(rem|px|vh|dvh|svh|vw|%)$/.test(v) || /^\d+$/.test(v)) {
          offenders.push(`data-layout-${attr}="${v}"`);
        }
      }
    }
    assert.deepEqual(
      offenders,
      [],
      'Raw lengths are not part of the HTML API — use a token or --layout-*.',
    );
  });

  it('behavioral keywords survive tokenization', () => {
    // full is inline-size:100%, xl is 30rem — different things, both needed.
    assert.ok(vocab.get('item-width').has('full'));
    assert.ok(vocab.get('item-width').has('xl'));
    assert.ok(vocab.get('min').has('auto'));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
node --test tests/unit/layout-vocabulary.test.js
```

Expected: FAIL — `min` still contains `6rem`, `150px`, `100vh`, etc.

- [ ] **Step 3: Rewrite the grid element fork**

Replace `src/custom-elements/layout-grid/styles.css` entirely:

```css
layout-grid {
  /* Author escape hatch beats the token; token beats the default.
     See admin/specs/layout-value-vocabulary-v1.md. */
  --_min: var(--layout-min, var(--_min-token, 15rem));

  display: grid;
  gap: var(--_gap, var(--size-m));
  grid-template-columns: repeat(auto-fit, minmax(var(--_min), 1fr));

  &[data-layout-min="xs"] { --_min-token: 8rem; }
  &[data-layout-min="s"]  { --_min-token: 10rem; }
  &[data-layout-min="m"]  { --_min-token: 15rem; }
  &[data-layout-min="l"]  { --_min-token: 20rem; }
  &[data-layout-min="xl"] { --_min-token: 25rem; }

  &[data-layout-gap="none"] { --_gap: 0; }
  &[data-layout-gap="xs"]   { --_gap: var(--size-xs); }
  &[data-layout-gap="s"]    { --_gap: var(--size-s); }
  &[data-layout-gap="m"]    { --_gap: var(--size-m); }
  &[data-layout-gap="l"]    { --_gap: var(--size-l); }
  &[data-layout-gap="xl"]   { --_gap: var(--size-xl); }
}
```

- [ ] **Step 4: Rewrite the grid attribute fork**

In `src/custom-elements/layout-attributes.css`, replace lines 95-117 (the `[data-layout="grid"]` base rule plus both raw-length blocks) with:

```css
[data-layout="grid"] {
  --_min: var(--layout-min, var(--_min-token, 15rem));

  display: grid;
  gap: var(--_gap, var(--size-m));
  grid-template-columns: repeat(auto-fit, minmax(var(--_min), 1fr));
}

[data-layout="grid"][data-layout-min="xs"] { --_min-token: 8rem; }
[data-layout="grid"][data-layout-min="s"]  { --_min-token: 10rem; }
[data-layout="grid"][data-layout-min="m"]  { --_min-token: 15rem; }
[data-layout="grid"][data-layout-min="l"]  { --_min-token: 20rem; }
[data-layout="grid"][data-layout-min="xl"] { --_min-token: 25rem; }
```

Leave the `[data-layout="grid"][data-layout-gap=…]` block below it untouched.

- [ ] **Step 5: Rewrite the cover enums (both forks)**

`src/custom-elements/layout-cover/styles.css`, replacing lines 11-19:

```css
/* xl is 100dvh, not 100vh — dvh accounts for mobile browser chrome, so
   covers stop being cropped on phones. See the spec's rationale. */
layout-cover {
  --_min-height: var(--layout-min, var(--_min-height-token, 100dvh));
}

layout-cover[data-layout-min="s"]    { --_min-height-token: 50vh; }
layout-cover[data-layout-min="m"]    { --_min-height-token: 70vh; }
layout-cover[data-layout-min="l"]    { --_min-height-token: 80vh; }
layout-cover[data-layout-min="xl"]   { --_min-height-token: 100dvh; }
layout-cover[data-layout-min="auto"] { --_min-height-token: auto; }
```

Apply the identical block in `layout-attributes.css` at lines 526-534, with `[data-layout="cover"]` in place of `layout-cover`. Check the surrounding base rule already consumes `--_min-height`; if it reads `var(--_min-height, 100vh)`, change it to `var(--_min-height)` since the fallback now lives in the chain above.

- [ ] **Step 6: Rewrite the switcher and sidebar enums (both forks)**

`src/custom-elements/layout-switcher/styles.css`, replacing lines 23-28:

```css
layout-switcher {
  --_threshold: var(--layout-threshold, var(--_threshold-token, 30rem));
}

layout-switcher[data-layout-threshold="s"] { --_threshold-token: 25rem; }
layout-switcher[data-layout-threshold="m"] { --_threshold-token: 30rem; }
layout-switcher[data-layout-threshold="l"] { --_threshold-token: 40rem; }
```

`src/custom-elements/layout-sidebar/styles.css`, replacing lines 40-42:

```css
layout-sidebar {
  --_content-min: var(--layout-content-min, var(--_content-min-token, 50%));
}

layout-sidebar[data-layout-content-min="s"] { --_content-min-token: 40%; }
layout-sidebar[data-layout-content-min="m"] { --_content-min-token: 50%; }
layout-sidebar[data-layout-content-min="l"] { --_content-min-token: 60%; }
```

Mirror both into `layout-attributes.css` at lines 598-603 and 340-342 respectively, using `[data-layout="switcher"]` / `[data-layout="sidebar"]` selectors.

- [ ] **Step 7: Run the test to verify it passes**

```bash
node --test tests/unit/layout-vocabulary.test.js
```

Expected: 8 passing.

- [ ] **Step 8: Verify the escape hatch actually resolves in a browser**

The `var()` chain is the load-bearing part of the design; assert it rather than assume it.

```bash
npm run build:cdn
```

Then create `/tmp/hatch.html` and open it against the built CSS:

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>hatch</title>
<link rel="stylesheet" href="/dist/cdn/vanilla-breeze.css"></head>
<body>
<layout-grid id="token" data-layout-min="m"><p>a</p></layout-grid>
<layout-grid id="hatch" style="--layout-min: 220px"><p>a</p></layout-grid>
<layout-grid id="both" data-layout-min="m" style="--layout-min: 220px"><p>a</p></layout-grid>
</body></html>
```

```js
// node /tmp/hatch-check.mjs — serve the repo root on :8199 and read computed styles
const read = (id) => getComputedStyle(document.getElementById(id)).gridTemplateColumns;
```

Expected: `#token` resolves from `15rem`, `#hatch` from `220px`, and `#both` from `220px` — the author value wins. If `#both` shows `15rem`, the `var()` chain is inverted.

- [ ] **Step 9: Commit**

```bash
git add src/custom-elements tests/unit/layout-vocabulary.test.js
git commit -m "feat(layout): tokenize min/threshold/content-min + add escape hatch (x1yl)

Raw-length enums (14 on grid, 9 on cover, 6 on threshold, 3 on
content-min, each duplicated across the element and attribute forks)
collapse to the xs..xl scale. --layout-min/-threshold/-content-min
override the token for genuine one-offs.

Cover xl is 100dvh, replacing the 100vh/100svh/100dvh trio."
```

---

### Task 3: Migrate the corpus

**Files:**
- Create: `scripts/migrate-layout-values.mjs`
- Modify: ~246 files under `demos/` and `site/src/`

**Interfaces:**
- Consumes: `readLayoutVocabulary()` from Task 1 (to verify every output value is valid).
- Produces: a corpus using only vocabulary values, so Task 4's rule reports zero.

**The mapping.** Rem equivalents at a 16px root; ties round up per the global constraint.

`data-layout-min` on **grid** — `xs`=8rem, `s`=10rem, `m`=15rem, `l`=20rem, `xl`=25rem:

| From | → | From | → | From | → |
|---|---|---|---|---|---|
| `4rem`, `6rem`, `8rem`, `80px`, `120px`, `140px` | `xs` | `150px`, `180px`, `10rem`, `12rem` | `s` | `200px`, `220px`, `240px`, `250px`, `260px`, `14rem`, `15rem`, `16rem` | `m` |
| `280px`, `300px`, `320px`, `18rem`, `20rem`, `22rem` | `l` | `360px`, `400px`, `25rem` | `xl` | | |

`data-layout-min` on **cover** — `s`=50vh, `m`=70vh, `l`=80vh, `xl`=100dvh:

| From | → |
|---|---|
| `50vh` | `s` |
| `60vh`, `70vh` | `m` |
| `75vh`, `80vh` | `l` |
| `100vh`, `100svh`, `100dvh` | `xl` |
| `auto` | `auto` (unchanged) |

`data-layout-threshold`: `20rem`,`25rem`→`s`; `30rem`→`m`; `35rem`,`40rem`,`45rem`→`l`.
`data-layout-content-min`: `40`→`s`; `45`,`50`→`m`; `60`→`l`.

**Values with no token** go to the escape hatch: `55%`, `60%`, `65%` on `min` become `style="--layout-min: 55%"` etc. The unitless `min="15"` / `min="20"` and `min-width="280px"` / `min-width="300px"` are broken markup, not migrations — list them for manual review.

- [ ] **Step 1: Write the codemod**

Create `scripts/migrate-layout-values.mjs`:

```js
#!/usr/bin/env node
/**
 * One-shot migration from raw-length layout values to the token vocabulary.
 * See admin/specs/layout-value-vocabulary-v1.md.
 *
 * Usage:
 *   node scripts/migrate-layout-values.mjs --dry-run
 *   node scripts/migrate-layout-values.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { readLayoutVocabulary } from './quality/layout-vocabulary.js';

const dryRun = process.argv.includes('--dry-run');

/** Raw value → token, per layout context. */
const GRID_MIN = {
  '4rem': 'xs', '6rem': 'xs', '8rem': 'xs', '80px': 'xs', '120px': 'xs', '140px': 'xs',
  '150px': 's', '180px': 's', '10rem': 's', '12rem': 's',
  '200px': 'm', '220px': 'm', '240px': 'm', '250px': 'm', '260px': 'm',
  '14rem': 'm', '15rem': 'm', '16rem': 'm',
  '280px': 'l', '300px': 'l', '320px': 'l', '18rem': 'l', '20rem': 'l', '22rem': 'l',
  '360px': 'xl', '400px': 'xl', '25rem': 'xl',
};
const COVER_MIN = {
  '50vh': 's', '60vh': 'm', '70vh': 'm', '75vh': 'l', '80vh': 'l',
  '100vh': 'xl', '100svh': 'xl', '100dvh': 'xl', 'auto': 'auto',
};
const THRESHOLD = { '20rem': 's', '25rem': 's', '30rem': 'm', '35rem': 'l', '40rem': 'l', '45rem': 'l' };
const CONTENT_MIN = { '40': 's', '45': 'm', '50': 'm', '60': 'l' };

/** Values with no token — move to the escape hatch instead. */
const NO_TOKEN = /^\d+(\.\d+)?%$/;

const vocab = readLayoutVocabulary();
const manual = [];

/**
 * Is this tag a cover? Decides which min map applies.
 *
 * @param {string} tag - The full opening tag text.
 * @returns {boolean}
 */
const isCover = (tag) => /<layout-cover\b/.test(tag) || /data-layout="cover"/.test(tag);

const files = execSync(
  "find demos site/src -name '*.html' -o -name '*.njk'",
  { encoding: 'utf8' },
).trim().split('\n').filter(Boolean);

let changed = 0;

for (const file of files) {
  const before = readFileSync(file, 'utf8');

  const after = before.replace(/<[a-z][^>]*>/gi, (tag) => {
    return tag.replace(/data-layout-(min|threshold|content-min)="([^"]*)"/g, (whole, attr, value) => {
      const map = attr === 'threshold' ? THRESHOLD
        : attr === 'content-min' ? CONTENT_MIN
        : isCover(tag) ? COVER_MIN : GRID_MIN;

      if (map[value]) return `data-layout-${attr}="${map[value]}"`;

      // Already a token — leave it.
      if (vocab.get(attr)?.has(value)) return whole;

      if (NO_TOKEN.test(value)) {
        manual.push(`${file}: data-layout-${attr}="${value}" → style="--layout-${attr}: ${value}"`);
        return whole;
      }

      manual.push(`${file}: data-layout-${attr}="${value}" — UNMAPPED, review by hand`);
      return whole;
    });
  });

  if (after !== before) {
    changed++;
    if (!dryRun) writeFileSync(file, after);
  }
}

console.log(`${dryRun ? '[dry run] ' : ''}${changed} file(s) ${dryRun ? 'would change' : 'changed'} of ${files.length} scanned`);
if (manual.length) {
  console.log(`\n${manual.length} usage(s) need manual handling:`);
  manual.forEach((m) => console.log('  ' + m));
}
```

- [ ] **Step 2: Dry-run it and read the manual list**

```bash
node scripts/migrate-layout-values.mjs --dry-run
```

Expected: ~246 files would change, plus a manual list containing the `55%`/`60%`/`65%` percentages and the unitless/misnamed junk. Read every line of that list — it is the part the codemod deliberately refuses to guess at.

- [ ] **Step 3: Run it for real**

```bash
node scripts/migrate-layout-values.mjs
```

- [ ] **Step 4: Hand-fix the reported usages**

For each percentage, move it to the escape hatch:

```html
<!-- before -->
<section data-layout="sidebar" data-layout-min="55%">

<!-- after -->
<section data-layout="sidebar" style="--layout-min: 55%">
```

For `min-width="280px"` / `columns="auto-fit"` / `sidebar="collapsed"` / `order="-1|1|99"`, the attribute name itself is wrong — these never did anything. Delete them, or replace with the intended attribute if the author's intent is obvious from context.

- [ ] **Step 5: Verify zero raw lengths remain**

```bash
cd /Users/tpowell/src/vanilla-breeze
grep -rnE 'data-layout-(min|threshold|content-min)="[0-9]' demos site/src
```

Expected: no output.

- [ ] **Step 6: Run the suites**

```bash
npm test && npm run conformance
```

Expected: all green.

- [ ] **Step 7: Rebuild and review visual baselines**

Cover `100vh` → `xl` (`100dvh`) moves 26 covers, and every rounded grid minimum shifts column counts at some widths. This is the largest visual diff in the batch — review it properly rather than blanket-updating.

```bash
npm run build && npx playwright test tests/visual/
```

Review, then update the ones that are correct:

```bash
npx playwright test tests/visual/ --update-snapshots
```

- [ ] **Step 8: Commit**

```bash
git add demos site/src scripts/migrate-layout-values.mjs tests/visual
git commit -m "refactor(demos): migrate layout values to the token vocabulary (x1yl)

~246 files move from raw lengths to xs..xl. Percentages move to the
--layout-* escape hatch; wrong-attribute-name usages (min-width=,
columns=, sidebar=) are deleted since they never applied.

Cover minimums shift from 100vh to 100dvh; baselines reviewed."
```

---

### Task 4: The conformance rule + the `no-inline-style` amendment

**Files:**
- Modify: `scripts/quality/vb-conformance.js` (add rule near `:182`; amend `no-inline-style` at `:182-191`)
- Create: `tests/unit/conformance-layout-values.test.js`

**Interfaces:**
- Consumes: `readLayoutVocabulary`, `ESCAPE_HATCH_PROPS` from Task 1.
- Produces: rule id `vb/layout-attr-value`, severity `error-new`, consistent with the other rules.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/conformance-layout-values.test.js`:

```js
/**
 * vb/layout-attr-value rejects values outside the parsed vocabulary, and
 * vb/no-inline-style tolerates a custom-property-only style attribute so
 * the documented escape hatch is not a conformance error.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const dir = mkdtempSync(join(tmpdir(), 'vb-conf-'));

/**
 * Run the conformance checker over one snippet.
 *
 * @param {string} html
 * @returns {string} combined stdout
 */
function check(html) {
  const file = join(dir, `case-${Math.random().toString(36).slice(2)}.html`);
  writeFileSync(file, `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title></head><body>${html}</body></html>`);
  try {
    return execFileSync('node', ['scripts/quality/vb-conformance.js', file], { encoding: 'utf8' });
  } catch (err) {
    return `${err.stdout ?? ''}${err.stderr ?? ''}`;
  }
}

describe('vb/layout-attr-value', () => {
  it('accepts a value in the vocabulary', () => {
    const out = check('<section data-layout="grid" data-layout-min="m">x</section>');
    assert.ok(!out.includes('vb/layout-attr-value'), out);
  });

  it('flags a raw length', () => {
    const out = check('<section data-layout="grid" data-layout-min="220px">x</section>');
    assert.match(out, /vb\/layout-attr-value/);
    assert.match(out, /220px/);
  });

  it('flags a keyword typo', () => {
    const out = check('<section data-layout="cluster" data-layout-justify="flex-end">x</section>');
    assert.match(out, /vb\/layout-attr-value/);
  });

  it('flags an attribute name that does not exist', () => {
    const out = check('<section data-layout="grid" data-layout-min-width="280px">x</section>');
    assert.match(out, /vb\/layout-attr-value/);
  });
});

describe('vb/no-inline-style escape hatch', () => {
  it('allows a style attribute holding only custom properties', () => {
    const out = check('<section data-layout="grid" style="--layout-min: 220px">x</section>');
    assert.ok(!out.includes('vb/no-inline-style'), out);
  });

  it('still flags a real declaration', () => {
    const out = check('<section style="color: red">x</section>');
    assert.match(out, /vb\/no-inline-style/);
  });

  it('still flags custom properties mixed with a real declaration', () => {
    const out = check('<section style="--layout-min: 220px; color: red">x</section>');
    assert.match(out, /vb\/no-inline-style/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
node --test tests/unit/conformance-layout-values.test.js
```

Expected: FAIL — the raw-length case reports no `vb/layout-attr-value`, and the escape-hatch case reports `vb/no-inline-style`.

- [ ] **Step 3: Amend `no-inline-style`**

In `scripts/quality/vb-conformance.js`, replace the block at lines 182-191:

```js
    // vb/no-inline-style — style="..." attributes.
    //
    // Exception: a style attribute whose declarations are ALL custom
    // properties is the documented layout escape hatch
    // (style="--layout-min: 220px"). Setting a custom property passes a
    // value into a CSS contract; it is not styling. Mixing custom
    // properties with real declarations is still a violation.
    const styleMatch = line.match(/\sstyle="([^"]+)"/i);
    if (styleMatch && !/<(meta|link)/i.test(line)) {
      const declarations = styleMatch[1]
        .split(';')
        .map((d) => d.trim())
        .filter(Boolean);
      const customPropsOnly =
        declarations.length > 0 && declarations.every((d) => d.startsWith('--'));

      if (!customPropsOnly) {
        issues.push({
          line: lineNum,
          col: line.indexOf('style="') + 1,
          rule: 'vb/no-inline-style',
          severity: severity('vb/no-inline-style', 'error-new'),
          message: 'Move inline styles to CSS. Use data-* attributes for dynamic values.'
        });
      }
    }
```

- [ ] **Step 4: Add the new rule**

Import at the top of `scripts/quality/vb-conformance.js`, beside the existing imports:

```js
import { readLayoutVocabulary } from './layout-vocabulary.js';
```

Below the allowlist load (around line 47), read the vocabulary once per process rather than per file:

```js
// Parsed from the layout CSS — never hand-listed. See
// admin/specs/layout-value-vocabulary-v1.md.
const layoutVocabulary = readLayoutVocabulary(projectRoot);
```

Then add the rule inside the per-line loop, directly after the `no-inline-style` block:

```js
    // vb/layout-attr-value — data-layout-* values outside the vocabulary.
    //
    // These fail silently: an unknown value matches no attribute selector,
    // so the element falls back to its default with no error anywhere. An
    // audit found 148 such usages across the repo. Catches raw lengths,
    // keyword typos, values borrowed from another attribute's enum, and
    // attribute names that do not exist at all.
    for (const m of line.matchAll(/data-layout-([a-z-]+)="([^"]*)"/g)) {
      const [, attr, value] = m;
      const known = layoutVocabulary.get(attr);

      const message = !known
        ? `Unknown layout attribute data-layout-${attr}. No CSS defines it, so it does nothing.`
        : `data-layout-${attr}="${value}" is not in the vocabulary (${[...known].sort().join(', ')}). ` +
          `Unknown values fall back to the default silently. For a one-off, use style="--layout-${attr}: ${value}".`;

      if (!known || !known.has(value)) {
        issues.push({
          line: lineNum,
          col: line.indexOf(m[0]) + 1,
          rule: 'vb/layout-attr-value',
          severity: severity('vb/layout-attr-value', 'error-new'),
          message
        });
      }
    }
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
node --test tests/unit/conformance-layout-values.test.js
```

Expected: 7 passing.

- [ ] **Step 6: Run conformance across the real corpus**

```bash
npm run conformance
```

Expected: `0 error(s), 0 warning(s)`. Any hit here is a usage Tasks 0 and 3 missed — fix the markup, not the rule.

- [ ] **Step 7: Run the full suite**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add scripts/quality/vb-conformance.js tests/unit/conformance-layout-values.test.js
git commit -m "feat(conformance): add vb/layout-attr-value + allow the escape hatch (x1yl)

Unknown data-layout-* values fail silently — the element falls back to
its default with no error. The rule validates against the vocabulary
parsed from the CSS, so it can never disagree with the stylesheet.

no-inline-style now permits a style attribute holding only custom
properties; otherwise the documented escape hatch would be an error."
```

---

### Task 5: Correct the documentation that taught the wrong model

**Files:**
- Modify: `admin/reference/syntax.md:741`, `:749`, `:1344`

**Interfaces:**
- Consumes: the vocabulary settled in Task 2.

- [ ] **Step 1: Read the current rows**

```bash
sed -n '739,751p;1342,1346p' admin/reference/syntax.md
```

The `` `6rem`…`25rem`, `150px`…`400px` `` ellipsis reads as a range but names a discrete list; "Various rem/px values" is worse. This phrasing is what taught authors the API was open.

- [ ] **Step 2: Replace the three rows**

Line 741 (grid):

```markdown
| `data-layout-min` | `xs` \| `s` \| `m` \| `l` \| `xl` | Minimum column width (8/10/15/20/25rem). One-off: `style="--layout-min: 220px"` |
```

Line 749 (cover):

```markdown
| `data-layout-min` | `s` \| `m` \| `l` \| `xl` \| `auto` | Minimum block size (50/70/80vh, 100dvh). One-off: `style="--layout-min: 65vh"` |
```

Line 1344:

```markdown
| `data-layout-min` | `xs` \| `s` \| `m` \| `l` \| `xl` | Minimum size; see the layout vocabulary spec |
```

- [ ] **Step 3: Add a vocabulary note near the layout section**

Insert above the layout attribute tables:

```markdown
> **Layout values are a closed vocabulary.** Every `data-layout-*` value is a
> named token; raw lengths are not part of the HTML API. An unknown value
> matches no CSS and silently falls back to the default, so `vb/layout-attr-value`
> rejects it at conformance time. For a genuine one-off, set the public custom
> property instead: `style="--layout-min: 220px"`. Full contract:
> [`layout-value-vocabulary-v1.md`](../specs/layout-value-vocabulary-v1.md).
```

- [ ] **Step 4: Verify no stale vocabulary claims survive**

```bash
grep -nE '`[0-9]+(rem|px|vh)`|Various rem/px' admin/reference/syntax.md | grep -i layout
```

Expected: no output referring to layout attribute *values* (token definitions like "8/10/15/20/25rem" in the description column are fine).

- [ ] **Step 5: Commit**

```bash
git add admin/reference/syntax.md
git commit -m "docs(syntax): document the layout vocabulary as closed (x1yl)

The '6rem…25rem' ellipsis read as a range but named a discrete list of
14 — this phrasing is why ~58 raw-length usages were written against an
API that never accepted them."
```

---

## Self-Review

**Spec coverage.** Token vocabulary table → Task 2. `auto`/`full` keywords → Task 2 Step 1 test + Step 5. Cover `100dvh` → Task 2 Step 5, Task 3 Step 7. Escape hatch + `var()` chain → Task 2 Steps 3-6, verified Step 8. `no-inline-style` amendment → Task 4 Step 3. Conformance rule with CSS-parsed vocabulary → Tasks 1 and 4. Migration → Task 3. Keyword typos (`f16e`) → Task 0. `syntax.md` corrections → Task 5. Sequencing before `aoku` → both forks written identically in Task 2, noted in Global Constraints.

**Out of scope, per the spec:** `ratio=1:1|4:3|16:9` (missing enum entries, not a vocabulary-model problem), attribute-name consistency (`vqw8`), global scale-name unification (`j1hi`), the fork merge itself (`aoku`).

**Type consistency.** `readLayoutVocabulary()` returns `Map<string, Set<string>>` keyed without the `data-layout-` prefix in Task 1, and is consumed that way in Tasks 2, 3 and 4. `ESCAPE_HATCH_PROPS` is defined and asserted in Task 1 only. Private property names (`--_min`, `--_min-height`, `--_threshold`, `--_content-min`) match the existing CSS; the new `--_*-token` layer is introduced consistently in Task 2 and referenced nowhere else.

**Known risk.** Task 2 writes the same token block into both forks, which is the duplication `aoku` exists to remove. This is deliberate sequencing, not an oversight — merging here would mean doing `aoku`'s work against a shape that is still changing.
