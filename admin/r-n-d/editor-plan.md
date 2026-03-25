# Editor Evaluation Plan

**Status**: Research / Pre-Decision
**Date**: 2026-03-24
**Related**: [editor-component.md](forms-and-interactions/editor-component.md), [MASTER-PLAN.md](MASTER-PLAN.md) (line 36–38), [global-overview.md](../global-overview.md) (line 60–68)

---

## Problem Statement

Vanilla Breeze needs an editor at two distinct layers:

1. **Component layer** — a `<rich-editor>` (or similar) web component that any VB site can drop in for content editing, form submissions, CMS admin panels, etc. Must be form-associated, progressive-enhancement friendly, and ship with docs + demos like every other VB component.

2. **CMS layer** — the editing engine inside Vanilla Press that produces VB-native output (semantic HTML with custom elements). This is a superset of the component layer: it needs block-level editing, VB component awareness, and API persistence.

The master plan correctly holds editor work until VB itself stabilizes. This document evaluates three approaches so the decision is ready when that gate opens.

---

## Option A: notectl (External Dependency)

**What it is**: `@notectl/core` — a TypeScript Web Component (`<notectl-editor>`) rich text editor.
**Repo**: https://github.com/Samyssmile/notectl
**npm**: `@notectl/core` v2.0.5
**License**: MIT

### Capabilities

- Framework-agnostic Web Component
- Immutable state with transaction-based updates
- Plugin system: headings, lists, links, tables, code blocks, images, blockquotes, checklists, alignment, colors, print layouts
- CSP-safe styling via `adoptedStyleSheets`
- Preset configs: `createMinimalPreset()` / `createFullPreset()`
- Content I/O: `setContentHTML()`, `getJSON()`, `getText()`
- Lifecycle events: `ready`, `stateChange`

### Bundle Size

| Variant | Size (gzipped) |
|---------|---------------|
| Minimal preset | ~8 KB |
| Core | ~75 KB |
| Full bundle | ~375 KB |

### Production Dependencies

Only `dompurify` (^3.3.2). Minimal surface area.

### Strengths

- **Web Component distribution** aligns with VB's architecture — just register and use
- **Minimal deps** fits VB's platform-first philosophy
- **Quick start** — `npm install @notectl/core` and drop in `<notectl-editor>`
- **Dual presets** allow lightweight or full-featured usage
- **TypeScript strict** — well-typed API

### Concerns

- **Single maintainer** — sustainability risk. 127 stars, 6 forks. Small ecosystem.
- **No accessibility documentation** — no mention of ARIA roles, screen reader support, or keyboard navigation guarantees. Critical gap for VB's a11y requirements.
- **No collaborative editing** — immutable state model suggests single-user only (no CRDT/OT).
- **Shadow DOM likely** — may conflict with VB's light-DOM / cascade-layer approach. Styling overrides could be difficult.
- **No form association** — not form-associated via `ElementInternals`. Would need wrapping to participate in VB forms.
- **Known bug** — open issue on mouse interactions in list items (cursor, drag-select). Core UX concern.
- **Philosophy gap** — notectl is a traditional rich-text WYSIWYG. VB needs block-level editing that maps to custom elements, not just formatted HTML blobs.

### Integration Path

1. Install as npm dependency
2. Create a VB wrapper component (`<vb-editor>`) that:
   - Adds form association via `ElementInternals`
   - Maps notectl output HTML to VB semantic markup
   - Provides VB-themed toolbar/chrome
3. Use for basic rich-text needs (comments, descriptions, simple content)
4. For CMS (Vanilla Press), would still need a separate block-editing layer on top

### Verdict

**Viable as a quick-start for simple rich text**, but insufficient for VB's full needs. The lack of block-level component editing means Vanilla Press would still need its own editor layer. The single-maintainer risk and a11y gaps are red flags for a framework dependency.

---

## Option B: Vanilla Press Editor (Existing Work)

**What it is**: A ProseMirror-based WYSIWYG editor built specifically for VB output.
**Location**: `~/src/vanilla-press/editor/`
**Status**: Phase 4 complete, 326 passing tests

### Capabilities

- **25+ block types** defined in content schema
- **Custom NodeViews** for VB components: callout, code-block, tabs, steps, collapsible, figure, card
- **Rich text marks**: strong, em, code, strikethrough, highlight, kbd, sub, sup
- **Slash commands** (block palette) for inserting blocks by category
- **Markdown input rules** (`**bold**`, `- list`, etc.)
- **Full keyboard shortcuts** + undo/redo
- **API persistence** with auto-save (500ms debounce)
- **Editor shell** with sidebar: doc browser, meta panel, theme picker, AST inspector
- **Multi-format output**: HTML (semantic + custom elements), Markdown, RSS/Atom, sitemaps

### Architecture

- ProseMirror loaded from CDN via import maps (no bundle step)
- Editor components are vanilla JS web components (no framework)
- Content stored as typed block AST mapping 1:1 to VB custom elements
- Pure-function renderers (HTML, Markdown, Feed) — no side effects
- SQLite backend (local dev) / Cloudflare D1 (production)

### Strengths

- **Already built and tested** — 326 tests, custom NodeViews for 7 component types
- **VB-native output** — same custom elements, same CSS, same theme system
- **Block AST model** — "one concept, multiple serializations" eliminates lossy conversion
- **Philosophy aligned** — platform-first, no build tools for client code, ES modules
- **WYSIWYG matches published output** — editor renders VB components the same way pages do
- **Proven foundation** — ProseMirror is battle-tested (used by NYT, Confluence, etc.)

### Concerns

- **Tightly coupled to CMS** — the editor is embedded in Vanilla Press's server + API architecture. Extracting a standalone component requires decoupling.
- **ProseMirror is complex** — steep learning curve for maintenance and extension. Not a "platform-native" solution.
- **No standalone component mode** — currently requires API server for persistence. A VB component needs to work in any form without a backend.
- **Bundle size unknown** — ProseMirror via CDN import maps avoids bundling, but total payload for the editor subsystem hasn't been measured.
- **Phase 5-6 deferred** — no collaboration, no migration tools yet.

### Reuse Path

1. **Extract the ProseMirror schema + NodeViews** from `~/src/vanilla-press/editor/assets/js/` into a reusable module
2. **Create a VB component** (`<block-editor>`) that:
   - Initializes ProseMirror with VB-aware schema
   - Provides form association via `ElementInternals` (value = HTML or JSON AST)
   - Works without API server (local state, emits content on change)
   - Optionally connects to Vanilla Press API for CMS mode
3. **Progressive enhancement**: degrade to `<textarea>` or `<div contenteditable>` without JS
4. Keep Vanilla Press as the full CMS shell that uses this component

### Verdict

**Strongest option for VB's full needs.** The hard work (ProseMirror schema, NodeViews, block types) is done. The main effort is extraction into a standalone component that works without the CMS backend.

---

## Option C: Custom Build (From Scratch)

**What it is**: Build a new editor using `contenteditable`, platform APIs, and VB's existing utilities.
**Foundation**: VB's `contenteditable` documentation, `sanitize-html.js`, `form-coordinator.js`

### What VB Already Has

- `contenteditable` attribute documented with usage patterns, `plaintext-only` mode, a11y notes
- `src/lib/sanitize-html.js` — HTML sanitization for safe output
- `src/lib/form-coordinator.js` — form state coordination
- Form-associated web component patterns (`ElementInternals`) established across 60+ components
- `emoji-picker` already inserts into contenteditable targets

### What Would Need to Be Built

1. **Core editing engine** — cursor management, selection handling, input event processing
2. **Block model** — mapping content blocks to VB custom elements
3. **Formatting toolbar** — applying marks (bold, italic, etc.) via `execCommand` or Range API
4. **Block insertion** — slash commands or palette for adding headings, lists, code blocks, components
5. **Undo/redo** — history management (non-trivial to get right)
6. **Paste handling** — sanitize and normalize pasted content
7. **Keyboard shortcuts** — comprehensive keymap
8. **Output serialization** — contenteditable HTML → clean VB markup
9. **Testing** — comprehensive test suite for all editing operations

### Strengths

- **Maximum philosophy alignment** — pure platform-native, zero external deps
- **Full control** — no upstream breaking changes, no dependency risk
- **Light weight** — only what VB needs, nothing more
- **Deep form integration** — built from the ground up with `ElementInternals`

### Concerns

- **Massive undertaking** — contenteditable is notoriously difficult. Browser inconsistencies in selection, cursor, and input handling are well-documented pain points.
- **Years of edge cases** — ProseMirror exists because `contenteditable` + `execCommand` alone produce unreliable results. The platform APIs are necessary but insufficient for a production editor.
- **Maintenance burden** — every browser update can introduce new contenteditable quirks. The VB team would own all of this.
- **Reinventing the wheel** — this is exactly the problem ProseMirror, Slate, TipTap, and notectl solve. Building from scratch means re-discovering their hard-won solutions.
- **Opportunity cost** — time spent on editor internals is time not spent on VB's core value proposition.

### Verdict

**Not recommended as a primary approach.** The platform-purity appeal is real, but the engineering cost is disproportionate to the value. `contenteditable` is a necessary primitive, not a sufficient editor — that's why every serious editor framework wraps it with a model layer.

---

## Comparison Matrix

| Criterion | notectl | Vanilla Press Editor | Custom Build |
|-----------|---------|---------------------|--------------|
| **Philosophy fit** | Partial — Web Component, but traditional rich text | Strong — block AST maps to VB elements | Maximum — pure platform |
| **VB component output** | No — generic HTML, needs post-processing | Yes — renders VB custom elements directly | Would need to be built |
| **Block editing** | No — inline rich text only | Yes — 25+ block types with custom NodeViews | Would need to be built |
| **Form association** | No — needs wrapper | No — needs extraction + wrapper | Built from ground up |
| **Bundle size** | 8–375 KB gzipped | Unknown (ProseMirror via CDN) | Smallest possible |
| **Accessibility** | Undocumented | Inherits ProseMirror's ARIA support | Full control |
| **Maintenance burden** | Low (upstream) but risky (single maintainer) | Medium (ProseMirror is stable) | Very high |
| **Time to usable** | Days | Weeks (extraction work) | Months to years |
| **Test coverage** | External | 326 tests | From zero |
| **Progressive enhancement** | Limited | Possible with extraction | Built-in |
| **CMS readiness** | Needs separate layer | Already integrated | Needs everything |

---

## Recommendation

### Phased Approach

**Phase 1 — Extract Vanilla Press Editor into a Standalone Component**

The Vanilla Press editor is the clear winner. The block AST model, ProseMirror schema, and custom NodeViews are exactly what VB needs and they already exist with 326 tests. The work is extraction, not creation:

- Pull the ProseMirror schema, NodeViews, and input rules into a reusable ES module
- Wrap in a VB web component (`<block-editor>` or `<content-editor>`)
- Add `ElementInternals` for form association
- Provide `<textarea>` fallback for progressive enhancement
- Ship docs + demos per VB convention

**Phase 2 — Evaluate notectl for Lightweight Use Cases**

After the primary editor exists, evaluate notectl as an optional lightweight alternative for simple rich-text fields (comments, descriptions) where the full block editor is overkill:

- Install as optional dependency
- Create a thin VB wrapper with form association
- Use only the minimal preset (~8 KB)
- Keep as "contrib" tier — nice to have, not core

**Phase 3 — Platform-Native Micro-Editor**

For the simplest cases (single-line rich text, inline editing), consider a tiny custom editor using `contenteditable="plaintext-only"` + VB's `sanitize-html.js`. This would be a minimal component, not a full editor — think `<editable-text>` rather than `<block-editor>`.

### Timing

Per the master plan, this work should begin only after VB core stabilizes. The evaluation and extraction planning can happen now; implementation should wait.

---

## Open Questions

1. **Shadow DOM vs Light DOM** — Should the editor component use Shadow DOM for style isolation, or stay light-DOM consistent with other VB components? ProseMirror typically assumes document-level styles.

2. **Content format** — Should the component's form value be HTML string, JSON AST, or both? JSON AST is lossless but requires a renderer; HTML is universal but lossy for VB-specific blocks.

3. **ProseMirror loading** — Import maps (current VP approach) vs bundled? Import maps keep ProseMirror out of VB's bundle but add a CDN dependency.

4. **Scope of extraction** — How much of Vanilla Press's editor infrastructure should move into VB vs stay in VP? The schema, NodeViews, and rendering seem like VB concerns; the API client, doc browser, and meta panel are CMS concerns.

5. **notectl's roadmap** — Is the maintainer responsive? Would they accept PRs for a11y and form association? Worth opening a dialogue before betting on it even for Phase 2.

6. **Accessibility audit** — Before adopting any approach, a thorough a11y audit of the editing experience is needed. What WCAG criteria apply specifically to rich text editors?
