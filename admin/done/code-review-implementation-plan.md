# Code Review Implementation Plan

**Source:** `code-review.md`
**Reviewed:** 2026-03-12
**Verdict:** Agree with all findings. Minor corrections noted below.

---

## Verification Summary

| # | Finding | Severity | Verified? | Notes |
|:--|:--------|:---------|:----------|:------|
| 1 | Playwright port mismatch (5173 vs 4321) | Critical | Yes | Path claim partially wrong — `/docs/examples/demos/` resolves correctly via 11ty passthrough copy. The port mismatch is the real blocker. |
| 2 | `include-file` HTML/script injection | Critical | Yes | `innerHTML` + manual script re-execution with zero sanitization. |
| 3 | `chat-window` innerHTML injection | Critical | Yes | Endpoint response piped to `innerHTML` with no sanitization. XSS via event-handler attributes (`onerror`, `onload`, etc.), not `<script>` tags (those don't execute via innerHTML). |
| 4 | `check` script misses `lint:js` and `typecheck` | High | Yes | CI quality-gate runs them, but local `npm run check` gives false green. |
| 5 | Media components not reconnect-safe | High | Yes | `attachShadow()` in `connectedCallback()` with no guard — throws on reinsert. |
| 6 | `site-search` `new Function()` (CSP) | Medium | Yes | Requires `unsafe-eval`. Stale dev guidance references nonexistent commands. |
| 7 | `registerComponent()` vs direct `define()` | Medium | Yes | `video-player` and others bypass `bundle-registry.js`. |
| 8 | `card-list` ad-hoc sanitizer | Medium | Yes | Covers basics but misses edge cases a vetted lib would catch. |
| 9 | Developer message drift | Low | Yes | Systemic — search, Playwright, and build docs reference wrong commands/paths. |

---

## Implementation Phases

### Phase 1: Unblock the test infrastructure (p0)

**Goal:** Make Playwright tests runnable so every subsequent phase can be validated.

#### 1a. Fix port configuration

**Files:**
- `playwright.config.js` (lines 15, 29-34)
- `tests/element-visual/playwright.config.js` (lines 22, 32-37)

**Changes:**
- Change `port: 5173` → `port: 4321` in both `webServer` blocks
- Change `baseURL: 'http://localhost:5173'` → `'http://localhost:4321'`
- Change `command: 'npm run dev'` to point at the site dev server that actually runs on 4321 (verify with `site/package.json` line 7)

**Verification:**
```bash
npx playwright test tests/components/youtube-player.spec.js --headed
```

#### 1b. Audit all test fixture paths

**Files:** All specs under `tests/components/` and `tests/element-visual/`

**Changes:**
- Confirm each spec's navigation path matches a file that 11ty's passthrough copy will serve
- The youtube-player path (`/docs/examples/demos/youtube-player-basic.html`) is actually correct — it maps via `demos/ → /docs/` passthrough. Document this so the confusion doesn't recur.

**Acceptance:**
- `npx playwright test` passes (or only has real component failures, not infrastructure failures)

---

### Phase 2: Close security holes (p0)

**Goal:** Eliminate the three HTML injection vulnerabilities.

#### 2a. Make `include-file` inert by default

**File:** `src/web-components/include-file/logic.js` (lines 69-106)

**Changes:**
1. Remove the script re-execution loop (lines 99-106) entirely
2. Add an opt-in attribute `data-allow-scripts` that must be explicitly set to re-enable script execution
3. If `data-allow-scripts` is not set, the fetched HTML is inserted via `innerHTML` only (scripts are inert by default)
4. Consider using a `<template>` element to parse + filter before insertion

**Out of scope:** Full sanitization library — that's Phase 5 (shared trust layer).

#### 2b. Sanitize `chat-window` endpoint responses

**File:** `src/web-components/chat-window/logic.js`

**Changes:**
1. In `#buildMessage()` (line 194): replace `bubble.innerHTML = html` with sanitized insertion
2. In `#populateTypingMessage()` (line 229): same treatment
3. Minimal approach: strip event-handler attributes (`on*`), `javascript:` URLs, and dangerous elements (`<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`) — similar to what `card-list` already does
4. Extract that sanitizer to a shared utility (see Phase 5) or inline it here for now

**Note:** The `!html.includes('<')` check on line 189 is fine as a fast path for plain text — it's not a security boundary. The security fix goes on the `else` branch.

#### 2c. Strengthen `card-list` sanitizer

**File:** `src/web-components/card-list/logic.js` (lines 59-79)

**Changes:**
1. Add `<base>` and `<link>` to the dangerous-elements list
2. Check `href` on all elements (not just `<a>`) — `<area>`, `<base>`, `<link>` can also carry `javascript:` URLs
3. Strip `srcdoc` and `data` attributes that can load content

**Acceptance:**
- XSS test cases: `<img onerror=alert(1)>`, `<svg onload=alert(1)>`, `<a href="javascript:alert(1)">`, `<base href="https://evil.com">` — all neutralized

---

### Phase 3: Make media components reconnect-safe (p1)

**Goal:** Prevent `attachShadow` errors when custom elements are moved/reinserted in the DOM.

**Files:**
- `src/web-components/audio-player/logic.js` — `#buildShadow()` (line 107)
- `src/web-components/audio-visualizer/logic.js` — `#buildShadow()` (line 103)
- `src/web-components/video-player/logic.js` — `#buildShadow()` (line 146)

**Changes (same pattern in all three):**
```javascript
#buildShadow() {
  if (this.shadowRoot) return;
  const shadow = this.attachShadow({ mode: 'open' });
  // ... rest unchanged
}
```

**Also check:**
- `connectedCallback()` in each file — ensure event listeners aren't double-bound on reconnect
- `disconnectedCallback()` — ensure cleanup (pause playback, remove listeners, cancel animation frames)

**Verification:**
- Write a Playwright test that appends the element, removes it, re-appends it, and verifies no errors + playback still works

---

### Phase 4: Align the local quality gate (p1)

**Goal:** `npm run check` should fail when CI would fail.

**File:** `package.json` (line 63)

**Changes:**
```json
"check": "npm run lint && npm run lint:js && npm run typecheck && npm run test && npm run conformance"
```

This mirrors the CI quality-gate steps (`.github/workflows/deploy.yml` lines 40-61), minus `build:cdn` and `budget` which are build artifacts.

**Pre-requisite:** The existing `lint:js` and `typecheck` failures need to be triaged:
1. Run `npm run lint:js` — count warnings vs errors
2. Run `npm run typecheck` — count errors
3. If the backlogs are too large to fix now, add `|| true` temporarily with a tracking issue, or fix them in a dedicated sub-phase

**Sub-phase 4b: Burn down lint/typecheck backlog**

- Fix or suppress the `src/packs/kawaii/kawaii.bundle.js:6` ESLint failure (likely needs an ignore directive for a vendored file)
- Fix TypeScript errors in `src/lib/*`, `audio-player`, `video-player` — these are the areas called out by the review
- Target: zero errors on both commands (warnings are acceptable for now)

---

### Phase 5: Shared trust-policy layer (p2)

**Goal:** Replace ad-hoc HTML insertion across components with a single sanitizer utility.

**New file:** `src/lib/sanitize-html.js`

**Design:**
```javascript
/**
 * Sanitize untrusted HTML for safe innerHTML insertion.
 * Strips scripts, iframes, event handlers, javascript: URLs.
 * NOT a full DOMPurify replacement — covers OWASP top-10 XSS vectors.
 */
export function sanitizeHTML(html) { ... }
```

**Consumers to migrate:**
| Component | Current approach | Migration |
|:----------|:-----------------|:----------|
| `card-list` | Inline sanitizer (lines 59-79) | Replace with import |
| `chat-window` | None | Add import |
| `include-file` | None (inert-by-default after Phase 2a) | Add import for `data-allow-scripts` mode |
| `tool-tip` | Check if uses innerHTML | Migrate if needed |
| `image-map` | Check if uses innerHTML | Migrate if needed |

**Acceptance:**
- Single source of truth for HTML sanitization
- Each consumer passes XSS test suite

---

### Phase 6: Unify bundle registration (p2)

**Goal:** All `customElements.define()` calls go through `registerComponent()`.

#### 6a. Audit all direct `define()` calls

```bash
grep -rn 'customElements.define' src/web-components/
```

**Expected:** Every component file has a direct call. Each needs to be replaced with:
```javascript
import { registerComponent } from '../../lib/bundle-registry.js';
registerComponent('tag-name', ComponentClass);
```

#### 6b. Add bundle-composition tests

**New file:** `tests/unit/bundle-composition.test.js`

**Tests:**
- Loading `index.js` (full bundle) registers all expected tags
- Loading `extras.js` after `index.js` doesn't throw duplicate-definition errors
- Loading individual component files after the full bundle doesn't throw
- `registerComponent()` priority resolution works (higher priority wins)

---

### Phase 7: Fix site-search CSP issue (p2)

**File:** `src/web-components/site-search/logic.js`

**Changes:**
1. Replace `new Function('return import(...)')` (lines 208-211) with a standard dynamic `import()` — this is the native ESM mechanism and doesn't require `unsafe-eval`
2. Fix the console warning (line 216): change `npm run search:dev` to the correct command
3. Fix the fallback HTML (lines 277-280): change `npx pagefind --site dist` to the correct path (`site/_site` per `package.json` lines 49-55)

**Why `new Function` was there:** To "bypass Vite" — Vite rewrites bare `import()` calls. Solutions:
- Use `import(/* @vite-ignore */ '/pagefind/pagefind.js')` — the `@vite-ignore` comment tells Vite to leave it alone
- This is the standard approach and doesn't need `unsafe-eval`

---

### Phase 8: Developer message alignment (p3)

**Goal:** Audit all user-facing console messages, error text, and inline docs for stale command/path references.

**Approach:**
```bash
grep -rn 'npm run\|npx ' src/web-components/ src/lib/
```

Cross-reference each against `package.json` scripts. Fix any that reference nonexistent commands or wrong paths.

Also check:
- `src/main-autoload.js` docs vs `package.json` exports
- Demo file paths referenced in test specs vs actual file locations

---

## Execution Order & Dependencies

```
Phase 1 (test infra) ──┐
                        ├── Phase 2 (security) ── Phase 5 (shared sanitizer)
                        ├── Phase 3 (reconnect)
                        ├── Phase 4 (quality gate) ── Phase 4b (backlog)
                        │
                        ├── Phase 6 (bundle reg)
                        ├── Phase 7 (CSP)
                        └── Phase 8 (message drift)
```

Phase 1 is prerequisite for everything (need working tests to verify fixes).
Phases 2-4 can run in parallel after Phase 1.
Phase 5 builds on Phase 2 (extracts the sanitizers added there).
Phases 6-8 are independent and lower priority.

---

## Items from the review I'm deferring or skipping

| Item | Review section | Reason |
|:-----|:---------------|:-------|
| Export autoload as npm entry point | Extensions | Low risk — only affects CDN consumers, not a correctness issue |
| Package-consumer smoke test | Extensions | Good idea but orthogonal to these fixes |
| Component contract manifest | Extensions | Tooling improvement, not a bug fix |
| Typed theme/environment contract | Extensions | TypeScript backlog item — covered by Phase 4b |
| Broader component integration coverage | Missing Features | Ongoing work, not a discrete fix |
| Accessibility auditing | Missing Features | Already have pa11y in hooks; formalizing is separate work |
| Reconnect/lifecycle regression tests | Missing Features | Partially covered by Phase 3 verification |
| Security/trust-model docs | Missing Features | Partially covered by Phase 5 (the code becomes the doc) |
