---
date: 2026-04-04
topic: open-ideation
focus: open-ended
---

# Ideation: Open-Ended Vanilla Breeze Improvements

## Codebase Context

**Project**: Vanilla Breeze — HTML-first CSS framework + Web Components library (v0.1.0, pre-release). 11ty + Nunjucks doc site. 30+ custom elements. 32 themes. Zero-class styling via cascade layers and data-attributes.

**Key patterns**: No div wrappers, semantic HTML first, data-attributes drive state, element.class scoping, logical CSS properties, OKLCH colors. Web components are last resort (escalation ladder enforced).

**Known pain points**:
- combo-box has 6 open bugs (3 at P1/P2) — largest single quality cluster
- 48KB duplicated CSS in layout-attributes.css (gap/align selectors)
- 44KB dev-only code ships in production bundle
- Monolithic bundle — planned Core+Context+Bundle+Pack architecture designed but unimplemented
- Theme consistency gaps: dark mode tokens incomplete in some themes
- 5 fragmented test suites need orchestration
- No per-theme token coverage enforcement
- Component contract system partially adopted
- API manifests can drift from runtime reality
- 48 of ~75 components missing api.json; 22+ missing static.html

## Ranked Ideas

### 1. Component Quality Foundation (Auto-Scaffold + Enforce the Full Contract)
**Description:** Unify three related gaps: (a) scaffold command generating complete component directory structure, (b) conformance rule failing build when api.json or static.html missing, (c) pre-commit hook blocking commits without corresponding doc page.
**Rationale:** 48 components missing api.json; 22+ missing static.html. Closing the gap activates three existing quality systems across the full component surface.
**Downsides:** Backfilling 48 api.json files is real work. Scaffold only helps future components.
**Confidence:** 85%
**Complexity:** Medium
**Status:** Explored

### 2. Honest Quality Gate (Wire All Existing Scripts Into One Command)
**Description:** Create tiered check:full that runs every auditor in dependency order with unified pass/fail. Wire undefined-token-audit and theme-token-coverage into default check path.
**Rationale:** Sophisticated quality tooling exists but isn't integrated. npm run check gives false-passing signal.
**Downsides:** Full suite may be slow. May need fast/full split.
**Confidence:** 90%
**Complexity:** Low
**Status:** Unexplored

### 3. Layout-Attributes CSS Deduplication
**Description:** Collapse 48KB of repeated gap/align selectors using :is() grouping or build-time generator. Target ~70% reduction with zero API change.
**Rationale:** Performance R&D doc has the approach. Maintenance trap that grows with every new value.
**Downsides:** Specificity implications in cascade layers. Adds build step.
**Confidence:** 85%
**Complexity:** Medium
**Status:** Unexplored

### 4. Production Dev-Code Elimination
**Description:** Guard 44KB of wireframe/debug/mock-image behind __DEV__ compile-time constant. Add bundle size budget to CI.
**Rationale:** Dev utilities in production is a category error. CDN split is opt-in by URL, not enforced by build.
**Downsides:** Requires auditing import paths.
**Confidence:** 90%
**Complexity:** Low
**Status:** Unexplored

### 5. Combo-Box Native-First Inversion
**Description:** Replace current 752-line combo-box with native select progressive enhancement via data-combobox attribute.
**Rationale:** 6 open bugs suggest the abstraction boundary is wrong. Aligns with project's own escalation ladder.
**Downsides:** High complexity, essentially a rewrite. Custom rendering may not fit on native select.
**Confidence:** 60%
**Complexity:** High
**Status:** Unexplored

### 6. Theme Token Coverage Wired Into CI
**Description:** Wire existing lint:theme-tokens and undefined-token-audit into npm run check as required CI gates.
**Rationale:** 32 themes with no automated consistency enforcement. Tooling exists but isn't integrated.
**Downsides:** May surface wave of existing violations blocking PRs.
**Confidence:** 92%
**Complexity:** Low
**Status:** Unexplored

### 7. Silent Upgrade Failure Diagnostics
**Description:** Add console.warn, data-state="upgrade-failed", and vb:upgrade-failed event to VBElement when setup() returns false.
**Rationale:** Silent failures violate DX contract. One-file change with outsized impact.
**Downsides:** Console warnings could be noisy.
**Confidence:** 88%
**Complexity:** Low
**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Sitemap & PWA manifest | Already tracked as open issues; too obvious |
| 2 | Contributor dev setup verification | Nice-to-have, not high leverage pre-release |
| 3 | Theme-preview web component | New component when existing ones need fixing |
| 4 | Fluid typography token scale | Feature request, not structural improvement |
| 5 | Escalation ladder linter | Limited ROI at current scale |
| 6 | Parameterized theme engine | Major refactor, unclear value vs. cost |
| 7 | Compile themes at build time | Contradicts runtime theme-switching |
| 8 | Component spec as runtime contract | Overengineered for pre-release |
| 9 | Zero-class compiler enforcement | Too aggressive; conformance is adequate |
| 10 | data-table DOM scalability | Valid but narrow edge case |
| 11 | Monospace font-metric compensation | Per-component fix, not systemic |
| 12 | Cascade layer consumer boundary | Documentation issue, not architecture |
| 13 | activateBundle SRI/error recovery | Valid but narrow scope |
| 14 | Combo-box scroll positioning | Subsumed by native-first inversion |
| 15 | Theme x component matrix smoke tests | 2,370 test pairs impractical |
| 16 | Capability matrix replacing escalation ladder | Too abstract |
| 17 | Demo/doc site detachment | Current model works |
| 18 | PE waterfall visibility | Low practical value now |
| 19 | Per-component CSS token extraction | Lower priority than fixing existing tools |
| 20 | Theme personality invariant tests | Hard to define programmatically |
| 21 | Cascade layer audit lint | Subsumed by Honest Quality Gate |
| 22 | Auto-generate demos from api.json | Demos need human authoring |
| 23 | Combo-box stabilization (fix-in-place) | Weaker than native-first inversion |

## Session Log
- 2026-04-04: Initial ideation — 48 generated across 6 frames, 33 after dedupe + 4 cross-cutting, 7 survived. User selected #1 for brainstorm.
