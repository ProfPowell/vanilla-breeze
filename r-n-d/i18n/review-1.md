# Vanilla Breeze i18n Review (Codex + Gemini)

Reviewed on: February 23, 2026

## Scope
- Proposal artifacts: `r-n-d/i18n/` (Overview, JS, CSS, Ruby)
- Current implementation: `src/lib/`, `src/native-elements/`, `src/web-components/`, `src/utils/`
- Performance & Scalability analysis

## Executive Summary
The i18n direction is strong and pragmatic, with solid script-aware typography and ruby support. However, significant gaps exist in **runtime integration**, **package distribution**, and **execution performance**. While the "static" story is good, the "dynamic" story suffers from inefficient DOM operations and high overhead in formatting utilities.

## Idea vs Implementation
| Area | Proposal Intent | Current State | Assessment |
|---|---|---|---|
| Script-aware typography | First-class CSS defaults | Implemented in `styles.css` | Good |
| Ruby visibility | `show` / `hide` / `auto` | Implemented via complex `:lang` CSS | Good, but verbose |
| Translation hook (`data-i18n`) | Lightweight content swap | Implemented in `src/lib/i18n.js` | Functional but fragile |
| Performance (Execution) | "Get out of the way" | High `Intl` overhead & blocking DOM ops | **Critical Gap** |
| Runtime i18n controller | `<vb-settings>` ownership | Not present in `settings-panel` | Not implemented |
| Package-level API | Developer can import helpers | Source API not exported in `package.json` | Gap |

## Findings (Concerns)

### 1) Translation-protection is non-functional (High)
- **Issue:** `src/native-elements/i18n/styles.css` uses `translate: no;`, which is an invalid CSS property (intended for transforms).
- **Result:** Browser translation engines will still attempt to translate technical identifiers (code, kbd) unless authors manually add the HTML `translate="no"` attribute.

### 2) Performance: `Intl` Instantiation Overhead (High)
- **Issue:** Formatting utilities (`formatNumber`, `formatDate`) create a new `Intl.*` instance on every call.
- **Impact:** `Intl` constructors are expensive (10-20x slower than the actual formatting). In loops or data-heavy tables, this causes significant main-thread lag.
- **Recommendation:** Implement a static cache/Map for `Intl` instances keyed by locale + options.

### 3) Performance: Blocking Ruby Annotation (High)
- **Issue:** `annotateElement` performs a synchronous $O(N)$ walk of all text nodes with regex testing.
- **Impact:** Large documents will freeze the UI during annotation.
- **Recommendation:** Use `IntersectionObserver` to lazy-annotate or `requestIdleCallback` to chunk the work.

### 4) `VbI18n` Robustness & Fragility (Medium)
- **Text Node Loss:** `apply()` only replaces the *first* text node it finds. Complex markup like `<div>Text <span>icon</span> More Text</div>` will lose the "More Text" update.
- **JSON Parsing:** `data-i18n-vars` parsing is unguarded. A single malformed JSON string in the HTML will crash the entire translation loop for the page.
- **Lookup Precedence:** `t()` prefers primary subtags (`pt`) over specific regions (`pt-BR`), which can lead to incorrect dialect rendering.

### 5) Modularization & Tree-Shaking (Medium)
- **Issue:** `ruby-annotate.js` bundles all providers (Jisho, Custom) together.
- **Impact:** Developers paying for code they don't use.
- **Recommendation:** Move providers to separate files so they are only pulled in if imported.

### 6) Runtime controller & Event Mismatch (Medium)
- **Issue:** `vb-settings` is missing the promised locale/dir/ruby controls.
- **Mismatch:** Documentation cites `vb:settings-change` while implementation listens for `vb:locale-change`.

### 7) Logical Properties: Stated vs Actual (Low)
- **Issue:** Codebase still contains many physical `left/right` properties despite the "non-negotiable" logical-property stance.
- **Recommendation:** Include a Stylelint configuration in the library to enforce logical properties.

## Opportunities for Enhancement

### 1. Advanced i18n Features
- **Pluralization:** Integrate `Intl.PluralRules` into `VbI18n.t()` to handle complex count-based strings (one, few, many, other).
- **Numeric Systems:** Support mapping to local numbering systems (e.g., Arabic-Indic digits) via `Intl` options.
- **Skeleton States:** Add a `vb-i18n-loading` state for elements while message maps are being fetched.

### 2. CSS Optimization
- **Ruby Active State:** Instead of 20+ lines of `:lang()` selectors, have the runtime set `[data-ruby-active]` on `<html>`. This simplifies CSS and improves selector performance.
- **Directional Isolation:** Provide a utility for `unicode-bidi: isolate` to handle mixed-directionality inline spans safely.

## Overall Assessment
Vanilla Breeze has a strong "static" foundation for i18n, but the **runtime implementation is currently "heavy" and incomplete**. To achieve the goal of being a lightweight, high-performance framework, it must address the `Intl` caching and DOM traversal overhead while fixing the documentation-to-distribution contract.
