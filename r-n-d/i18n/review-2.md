# i18n Implementation Review: Vanilla Breeze

This document compares the vision outlined in `i18n-overview.md` with the current implementation across `i18n.js`, `i18n.css`, and `ruby-annotate.js`.

## 1. Major Bugs & Technical Oversights

### The CSS `translate: no` Bug
In `i18n.css` (Section 5), the following rule is present:
```css
code, kbd, samp, pre, var {
  translate: no;
  font-family: var(--vb-font-mono), monospace;
}
```
**Issue:** `translate: no` is invalid CSS. The `translate` CSS property is for 2D/3D transformations and expects length/percentage values (e.g., `translate: 10px 20px`). 
**Fix:** Translation control is strictly an HTML concern. This should be handled via the HTML attribute `translate="no"`. The CSS should instead target these elements to ensure they look correct, but it cannot control the browser's translation engine.

### `data-i18n-vars` JSON Parsing
In `i18n.js`, the `apply()` method calls `JSON.parse(el.dataset.i18nVars)`.
**Issue:** If a developer provides malformed JSON in the `data-i18n-vars` attribute, the entire translation loop will crash with an unhandled exception.
**Opportunity:** Add a `try...catch` block around the JSON parsing to gracefully handle errors and perhaps log a warning.

### Event Name Mismatch
- `i18n-overview.md` states: `<vb-settings>` emits `vb:settings-change`.
- `i18n.js` and `LocaleMixin` listen for: `vb:locale-change`.
**Issue:** While `vb-settings` might emit both, the documentation and implementation should be explicitly aligned on which event drives the i18n runtime. If `vb:locale-change` is a subset of `settings-change`, the distinction should be clear.

### `data-i18n` Text Node Fragility
The `apply()` method in `i18n.js` attempts to preserve child elements by finding the first text node:
```javascript
const textNode = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE);
```
**Issue:** This only replaces the *first* text node. If a developer has markup like:
`<div data-i18n="key">Prefix <span>icon</span> Suffix</div>`
The "Suffix" will never be updated, and if "Prefix" is missing, it might prepend a new node or fail to find one. 
**Opportunity:** Define a clearer contract for `data-i18n` on elements with complex children, or use a specific selector (like `[data-i18n-target]`) for the text portion.

---

## 2. Structural Gaps

### Logical Properties Enforcement
The "Core Stance" claims logical properties are non-negotiable, but `i18n.css` only provides a `box-sizing` reset. 
**Observation:** There is no "linting" or structural enforcement mentioned to ensure developers don't use `margin-left`.
**Opportunity:** Provide a recommended Stylelint configuration as part of the VB "contract" to enforce logical properties.

### Direction Isolation
The `[dir="rtl"]` utility in `i18n.css` is minimal. 
**Opportunity:** While logical properties handle layout, "Directional Isolation" (`unicode-bidi: isolate`) is often needed for inline spans containing mixed scripts (e.g., an English brand name inside an Arabic sentence). VB should provide a standard utility class for this beyond just `[dir="auto"]`.

### Font Loading Strategy
The philosophy says "VB does not dictate font loading," but it provides many `--vb-font-*` variables.
**Observation:** Without a "System Font Stack" fallback that is script-aware, the initial render might look poor before custom fonts load. 
**Opportunity:** Improve the default fallback chains in `i18n.css` to better utilize system-specific script fonts (e.g., `Meiryo` or `Yu Gothic` for Japanese on Windows).

---

## 3. Opportunities for Enhancement

### `data-i18n` Pluralization
The current `VbI18n` class only supports simple string replacement and variables.
**Opportunity:** Leverage `Intl.PluralRules` within the `t()` function to support pluralization keys (e.g., `count.one`, `count.other`) which is a standard requirement for production i18n.

### Ruby "Auto" Logic in JS
The CSS `auto` logic for ruby is clever but verbose. 
**Opportunity:** Since `i18n.js` already has a `usesRuby(locale)` helper, the `<vb-settings>` component could set a `data-ruby-active="true"` attribute on `<html>` based on the locale, simplifying the CSS selectors significantly.

### Skeleton States for Translations
When loading message maps asynchronously via `i18n.load()`, there is no "loading" state.
**Opportunity:** Elements with `data-i18n` could receive a `vb-i18n-loading` class or attribute while the map is being fetched, allowing for CSS-based skeleton UI.

### Numeric System Mapping
Some locales use different numbering systems (e.g., Arabic-Indic digits `٠١٢٣`).
**Opportunity:** The `formatNumber` utility could support a `numberingSystem` option or automatically infer it from the locale if the developer opts-in via `<vb-settings>`.
