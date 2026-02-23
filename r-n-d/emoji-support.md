# Emoji Support Design Plan for Vanilla Breeze (r-n-d/emoji-support.md)

## Summary

Design and document a hybrid v1 emoji system for Vanilla Breeze:

- data-* attribute enhancement for :shortcode: interpretation in content.
- A dedicated emoji-picker web component for insertion into inputs/editable targets.

Chosen defaults:

- Architecture: Hybrid
- Dataset: Core subset
- Replacement mode: Unicode text in text nodes

The output document (r-n-d/emoji-support.md) will define public APIs, lifecycle, accessibility, performance constraints, and a phased rollout path to avoid regressions while enabling future expansion.

## Scope

In scope:

- Shortcode parsing and replacement (:emoji-name: -> Unicode).
- Picker component behavior and insertion contract.
- Data model for a curated emoji subset.
- Progressive enhancement and fallback behavior.
- Test plan and acceptance criteria.

Out of scope (v1):

- Full Unicode dataset shipping by default.
- Rich image emoji sprite sheets.
- Server-side shortcode rendering pipeline.
- Complex markdown/HTML AST transforms.

## Public APIs / Interfaces

### 1) Content Enhancement API (attribute-based)

- Attribute: data-emoji
	- Applied to any container (main, article, etc.).
	- Enables shortcode interpretation in descendant text nodes.
- Optional attributes:
	- data-emoji-scan="once|observe" (default once)
	- data-emoji-unknown="keep|strip" (default keep)
	- data-emoji-init="true" internal init marker (set by enhancer)
- Behavior:
	- Scan text nodes only (skip script, style, code, pre, textarea, contenteditable roots by default).
	- Replace known shortcodes with Unicode.
	- Leave unknown shortcodes unchanged by default.

### 2) Picker Component API

- Custom element: <emoji-picker-wc>
- Core attributes/properties:
	- for (id of target input/textarea/contenteditable element)
	- open (reflective state)
	- recent-limit (default 24)
	- skin-tone (optional preference key/state)
- Events:
	- emoji-select with payload { shortcode, emoji, name, keywords }
	- emoji-picker-open
	- emoji-picker-close
- Insertion rules:
	- If for points to input/textarea, insert at cursor and restore caret.
	- If for points to [contenteditable], insert text at current range.
	- Dispatch native input and change-compatible flows as appropriate.

### 3) Emoji Data Contract

- Core dataset shape:
	- shortcode (canonical, e.g. :smile:)
	- emoji (Unicode glyph)
	- name
	- keywords[]
	- group
- Alias map:
	- Optional aliases mapping to canonical shortcode.
- Loading:
	- Static JSON/module in repo for v1 curated subset.
	- Structured so future adapter/provider swap is possible without API break.

## Implementation Design (for document content)

### A) Shortcode Engine

- Parser pattern: :([a-z0-9_+-]+):
- Resolve via map lookup (canonical + aliases).
- Replace strictly in eligible text nodes.
- Idempotency: enhancer marks initialized containers; avoid double-processing loops.
- Mutation strategy:
	- once mode: one pass on init.
	- observe mode: MutationObserver on subtree additions/characterData with debounced rescans.

### B) Picker UX

- Use existing web-component patterns in repo (search/combobox/dropdown conventions).
- Keyboard support:
	- Arrow navigation in grid/list.
	- Enter select, Esc close.
	- Search input filters by shortcode/name/keywords.
- A11y:
	- Trigger has accessible name.
	- Picker surface labeled and focus-managed.
	- Active option announced via ARIA patterns.

### C) Progressive Enhancement

- Without JS:
	- Content remains raw shortcodes.
	- Inputs remain standard text fields.
- With JS:
	- Enhanced render + picker augmentation.
- No hard dependency between enhancer and picker; they can be adopted independently.

### D) Performance and Safety

- Limit scanning scope to explicit [data-emoji].
- Avoid HTML string replacement; operate on text nodes to reduce XSS risk.
- Skip large excluded blocks (pre/code) by default.
- Debounce observer work and avoid full-tree rescans when possible.

## Testing Plan and Scenarios

### Unit tests

1. Parses valid shortcode formats and rejects invalid tokens.
2. Resolves canonical and alias shortcodes correctly.
3. Unknown shortcode handling (keep default).
4. Text-node replacement does not alter surrounding markup.
5. Exclusion behavior for code/pre/script/style/textarea.

### Integration tests

1. [data-emoji] one-time enhancement on page load.
2. observe mode processes dynamically inserted content.
3. Idempotency: repeated init does not duplicate/alter already replaced text.
4. Picker inserts into textarea at caret and emits expected events.
5. Picker inserts into contenteditable and preserves selection expectations.
6. Keyboard navigation and selection flow for picker.
7. Basic screen-reader semantics (roles/labels/focus transitions).

### Regression checks

1. No conflict with existing data-attribute initializers.
2. No mutation of excluded areas.
3. No breaking behavior when dataset entry missing.

## Rollout Plan

1. Add design doc (r-n-d/emoji-support.md) with API and behavior spec.
2. Implement shortcode enhancer with curated dataset.
3. Implement emoji-picker-wc and target insertion contract.
4. Add docs/demo pages in both API and examples sections.
5. Add tests and run quality gates.
6. Optional v1.1: pluggable dataset provider, wrapped-span output mode if needed.

## Assumptions and Defaults

- Default strategy is Unicode replacement in text nodes.
- Curated core emoji subset is sufficient for first release.
- Picker is a separate component; enhancer does not require it.
- Shortcodes remain visible when unknown or when JS is unavailable.
- Future compatibility is preserved by stable event names and data shape.