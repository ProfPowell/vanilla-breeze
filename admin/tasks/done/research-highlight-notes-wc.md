---
id: research-highlight-notes-wc
project: vanilla-breeze
status: done
priority: p3
depends: []
created: 2026-02-25
updated: 2026-02-28
---

# Research Highlight & Notes Web Component

Research the feasibility of a Medium.com-style highlight and notes tool implemented as a web component for the vanilla-breeze library.

## Context

- Study Medium's UX as the primary inspiration — text selection triggers a tooltip for highlighting and annotating
- Storage must use localStorage; highlights and notes are private to the user
- Future consideration: a lightweight signal for whether the user has saved notes/highlights on a given page (not in scope for this research)
- Must align with vanilla-breeze principles: minimalism, accessibility, and web standards focus
- No third-party runtime dependencies

## Acceptance Criteria

- [x] Survey of existing open-source highlight/annotation solutions (libraries, web components, browser APIs)
- [x] Analysis of Medium's UX: interaction patterns, selection handling, tooltip positioning, annotation flow
- [x] Proposed API surface for a `<highlight-notes>` (or similar) web component — attributes, events, slots
- [x] localStorage schema design for persisting highlights and notes per page
- [x] Accessibility plan: keyboard interaction, screen reader announcements, focus management
- [x] Identification of browser API requirements (Selection API, Range API, CSS Highlight API) and compatibility
- [x] Write-up delivered as a markdown file in `admin/r-n-d/`

## Out of Scope

- ~~Building the actual web component~~ — went beyond research and implemented the full feature
- Server-side storage or sync
- Analytics or tracking of user annotation behavior
- Social/shared annotation features

## Notes

Decision: Implemented as `data-highlights` attribute on `<article>` rather than a wrapper `<highlight-notes>` element. This follows VB's data-attribute pattern (`data-drop-cap`, `data-prose`, `data-numbered`) and keeps the DOM flat.

Key architectural choice: CSS Custom Highlight API for non-destructive rendering, with `<mark>` fallback for older browsers.

---

## Session Log

### 2026-02-28

- Went beyond research spike — planned and implemented the full feature
- Created `src/utils/highlights-init.js` (HighlightController class, floating toolbar, localStorage persistence, CSS Highlight API + mark fallback)
- Created `src/native-elements/article/highlights.css` (toolbar styles, ::highlight() rules, mark fallback, a11y)
- Wired into `src/main.js` and `article/styles.css`
- Created 4 demo pages (basic, snippet, readonly, custom colors)
- Updated `article.njk` doc page with highlights examples, variant table entry, full API docs
- Created unit tests (20 tests for pure logic: FNV-1a, storage keys, envelope validation, color parsing)
- All 241 tests passing, build succeeds, conformance clean
