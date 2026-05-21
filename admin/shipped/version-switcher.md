---
title: version-switcher Component Plan
description: Component for surfacing and switching between versions of a page over time. Two modes — docs releases (v1.x / v2.x / latest) and per-page edit history. Three switch actions (navigate / swap / diff). Pluggable data source (inline / src URL / meta tags). Integrates with the existing provenance system (`meta[itemprop=version]` + new `meta[name=vb:versions-manifest]`, page-info, change-set).
tags:
  - web-components
  - specification
  - content-management
  - vanilla-breeze
date: 2026-05-14
status: draft
---

# version-switcher Component Plan

## Why this exists

A small label "v2.1" hidden in a docs corner is not enough. Authors need a primitive that:

1. **Surfaces** the current page's version state visibly (badge or trigger),
2. **Lists** the other versions available, and
3. **Switches** to one of them — by navigating, by swapping content in place, or by showing a diff.

Two distinct use-cases that share enough machinery to live in one component:

- **Mode A — release versions** (classic docs version selector): switch between `/v1/page` and `/v2/page` and `/latest/page`. Each version lives at a different URL. The current version is declared via `<meta itemprop="version">` (the open-standard tag the provenance system already emits).
- **Mode B — per-page edit history**: a chronological list of how *this same URL* has changed over time. Each entry is a snapshot or a change-set. Useful for evolving canonical pages — policies, glossaries, ADRs.

The user's requirement was explicit: **one component, both modes**. Same trigger UI, same picker UI, the data shape and switch action determine which mode you get.

## Adjacency — what's already in the neighborhood

| Existing | What it does | Why this isn't it |
|----------|--------------|-------------------|
| `<page-info>` | Shows authorship + history + trust badge from the provenance meta tags. Currently surfaces the *current* version via `meta[itemprop=version]` + `vb:version-url`. | Display-only; no switching, no listing of other versions. **`<version-switcher>` complements it** — page-info answers "what version is this?", switcher answers "what other versions exist, and how do I get there?". |
| `<change-set>` | Wraps `<ins>` / `<del>` for inline diff display with tracking / final / original view modes. | Per-change visual diff of authored markup. **`<version-switcher>` reuses change-set as the renderer** for its diff switch-action. |
| `<time-index>` | Changelog / version-filtered release timeline (the GLOBAL release history). | Site-level changelog, not per-page. Switcher's mode-A history likely cross-links to time-index entries via `vb:version-url`. |
| `<comment-thread>` | Persistent discussion attached to a page. | Related to versioning of conversation, not page content. |
| Future `<diff-viewer>` | Side-by-side / unified diff display. | If we ship diff-viewer as a separate primitive, switcher's diff action composes it. If we keep diff-viewer as a recipe on `review-surface`, switcher composes that recipe. **Decision can defer** — the diff action plugs into whichever shape we settle on. |

## Scope (in)

### Surfaces

- **Inline trigger** (default): a small button showing the current version label (e.g., `v2.1` or `Current`); click opens the picker.
- **Banner** (`data-banner`): a full-width banner above the page warning "You're viewing v1.x — Latest is v2.1 →". For mode-A archived versions.
- **Compose-into-page-info**: when `<page-info>` is on the page, switcher exposes a `data-page-info-target="ID"` attribute that has it render as a section inside that page-info's expandable panel rather than as a standalone trigger.

### Picker UI

- A popover / dropdown listing every available version with: version label, release date (relative), short description / summary, link/action to that version.
- Current version highlighted; archived versions show "archived" badge; in-progress / draft versions show "draft" badge.
- Composes `<pop-over>` for the picker surface (mirrors selection-menu / combo-box / context-menu / drop-down / tool-tip / reaction-bar consolidation).
- Mode B (history): same picker UI, but each row is a date + author + commit message instead of a semver.

### Switch actions

Three actions, configurable via `data-action`:

| Value | Behavior | Use case |
|-------|----------|----------|
| `navigate` (default) | Sets `location.href` to the picked version's URL. Standard docs version selector. | Mode A: `/v1/page` → `/v2/page` |
| `swap` | Fetches the picked version's HTML and swaps the `[data-versioned]` region in place. No navigation. Updates `<meta itemprop="version">` accordingly. | Mode B: time-travel preview without losing scroll/state. |
| `diff` | Renders a diff between the current and picked version inline, using `<change-set>` (or future `<diff-viewer>`). | Reviewing what changed between two snapshots. |

### Data sources (3-tier: inline > src > meta fallback)

```html
<!-- 1. Inline (highest priority): all data on the host -->
<version-switcher
  data-versions='[
    { "id": "v2.1", "label": "v2.1 (current)", "url": "/v2.1/api", "date": "2026-05-01", "summary": "Adds rate-limit headers" },
    { "id": "v2.0", "label": "v2.0",            "url": "/v2/api",   "date": "2026-01-15", "summary": "Breaking: auth flow renamed" },
    { "id": "v1.4", "label": "v1.4 (archived)", "url": "/v1.4/api", "date": "2025-08-10", "summary": "Last v1 release", "archived": true }
  ]'
></version-switcher>

<!-- OR -->
<script type="application/json" data-versions>
[ … same shape … ]
</script>
<version-switcher></version-switcher>
```

```html
<!-- 2. Fetched manifest (for shared / cross-page version data): -->
<version-switcher data-src="/api/versions.json?page=/api"></version-switcher>
```

```html
<!-- 3. Meta-tag fallback: derive current from <meta itemprop="version"> +
        the manifest URL from <meta name="vb:versions-manifest"> -->
<version-switcher></version-switcher>
<!-- in <head>: -->
<!-- <meta itemprop="version" content="v2.1"> -->
<!-- <meta name="vb:versions-manifest" content="/data/versions/api.json"> -->
```

Resolution order: inline `data-versions` → inline `<script type="application/json" data-versions>` → `data-src` fetch → meta-tag fallback. First match wins.

### Manifest schema

```ts
type VersionEntry = {
  id: string;          // stable id (semver or commit sha or "current"); required
  label?: string;      // display label (defaults to id)
  url?: string;        // URL to navigate / fetch from
  date?: string;       // ISO-8601; rendered as relative time
  author?: string;     // (mode B) commit / change author
  summary?: string;    // short description / commit message
  archived?: boolean;  // archived release (banner trigger)
  draft?: boolean;     // pre-release / draft
  current?: boolean;   // marks the "current" entry; if absent, derived from
                       //   matching <meta itemprop="version"> or first entry
  versionUrl?: string; // (mode A) link out to the changelog anchor
                       //   (matches existing vb:version-url semantics)
};
```

Mode is derived from the data, not declared:
- If two or more entries have distinct `url` values → **mode A** (release versions).
- If entries share the same canonical URL but differ by `date` / `author` → **mode B** (per-page history).
- If ambiguous, the author can force mode via `data-mode="releases" | "history"`.

## Scope (out)

- **Authoring history backend** — the component does NOT track edits. It renders whatever data is supplied. Generating the manifest is a separate concern (see "Build-time tooling").
- **Version creation / draft preview** — out of scope. A "create new version" workflow belongs to a CMS, not a presentational primitive.
- **Live collaboration / multi-author conflict resolution** — way out of scope.
- **Full git-blame display** — `vb:version-url` already links out to the changelog. Per-line authorship is a different primitive.
- **Permanent URLs / archive.org integration** — could be a future enhancement that wires `data-archive` per entry; defer to v2.

## Composition with the existing provenance system

This is the load-bearing integration the user called out. The provenance system (per `admin/specs/meta-tag-contract-v1.md`) already declares per-page version metadata via `<meta itemprop="version">` (the open-standard tag) and `<meta name="vb:version-url">`. `<page-info>` reads these and shows them.

`<version-switcher>` extends this in two directions:

1. **Adds a manifest tag**: `<meta name="vb:versions-manifest" content="/data/versions/<page-id>.json">` — points at the JSON list of all versions of the page. The site-build step (`generate-provenance-meta.js`) gets a frontmatter `versionsManifest` field that emits this tag. Existing `<meta itemprop="version">` becomes the *current-version* marker; `vb:versions-manifest` is the *index*.

2. **Renders inside `<page-info>`'s panel**: when `data-page-info-target="ID"` is set, the switcher mounts as a section inside that page-info's expandable detail. So `page-info` becomes the canonical "what's the provenance of this page?" surface and `version-switcher` is one of the sections inside it. Standalone use (without page-info) still works — it renders a button + popover on its own.

3. **Diff via `<change-set>` reuse**: when `data-action="diff"` is selected, the switcher fetches the picked version's HTML and renders the diff using `<change-set>`'s tracking-view machinery. We're not inventing a new diff renderer — we're feeding existing markup-level change tracking with computed `<ins>` / `<del>` runs (text-level diff via a small lib at first; node-level diff later if needed).

## Switch actions in detail

### `navigate` (default)

```js
location.href = entry.url;
```

History API friendly: emits `version-switcher:before-navigate` (cancellable, so authors can intercept for confirm-before-leaving flows on dirty forms).

### `swap`

```js
const html = await fetch(entry.url).then(r => r.text());
const doc = new DOMParser().parseFromString(html, 'text/html');
const incoming = doc.querySelector('[data-versioned]') || doc.body;
document.querySelector('[data-versioned]').replaceChildren(...incoming.children);
// Update meta tags so page-info reflects the swapped state
updateMeta('itemprop:version', entry.id);  // sets <meta itemprop="version" content="…">
emit('version-switcher:swap', { entry, previousId });
```

Author marks the swappable region with `<main data-versioned>` (or any element). Out of the box swaps `<main>` if `data-versioned` isn't found. View Transition (`document.startViewTransition`) used when supported for smooth crossfade.

### `diff`

```js
const oldHtml = await fetch(currentEntry.url).then(r => r.text());
const newHtml = await fetch(pickedEntry.url).then(r => r.text());
const diffed = computeDiff(extractVersioned(oldHtml), extractVersioned(newHtml));
mountChangeSet(diffed); // wraps the diffed markup in <change-set> with tracking view
```

Renders inline above or below the versioned region (configurable via `data-diff-position`). Uses `<change-set>` to expose tracking / final / original view toggle.

## HTML API summary

```html
<version-switcher
  data-versions="…"            <!-- inline JSON; OR <script type="application/json" data-versions> -->
  data-src="…"                 <!-- URL of versions manifest to fetch -->
  data-mode="…"                <!-- releases | history (default: derived) -->
  data-action="…"              <!-- navigate (default) | swap | diff -->
  data-banner                  <!-- show full-width banner for archived versions -->
  data-page-info-target="…"    <!-- ID of a <page-info> to mount inside -->
  data-versioned-region="…"    <!-- selector for swap target (default: [data-versioned] or main) -->
  data-diff-position="…"       <!-- before | after (default: before) — diff render position -->
  aria-label="Version"
></version-switcher>
```

## Events

- `version-switcher:open` — picker popover opened
- `version-switcher:close` — picker closed
- `version-switcher:select` — `{ entry }` user picked an entry (before action)
- `version-switcher:before-navigate` — `{ entry }` cancellable; `navigate` action
- `version-switcher:swap` — `{ entry, previousId }` after `swap` succeeded
- `version-switcher:diff` — `{ entry, previousId }` after `diff` rendered
- `version-switcher:error` — `{ message, entry?, error }` fetch / parse / swap failure

## Programmatic API

```js
const sw = document.querySelector('version-switcher');
sw.versions;           // array of resolved version entries
sw.currentId;          // id of the current entry
sw.openPicker();
sw.closePicker();
sw.switchTo(entryId);  // programmatic selection (honors data-action)
sw.refresh();          // re-resolve data source (e.g. after server emits new version)
```

## Accessibility

- Trigger button: `aria-haspopup="dialog"`, `aria-expanded` reflects open state, `aria-label` describes the version (overridable via host `aria-label`).
- Banner mode (`data-banner`): `role="region"` with `aria-live="polite"` so AT users hear "You are viewing v1.x; latest is v2.1" when it appears or updates.
- Picker popover: `role="dialog"` rendered via `<pop-over>` in the top layer; light-dismiss via Escape and outside click.
- Each version entry inside the picker: a button with derived `aria-label` like `"v1.4 — released August 10 2025 (archived)"`.
- Mode B (history): each entry's date renders as `<time datetime>` with absolute date in `title`.
- Diff action: focus moves to the diff region after render; new region announced.

## CSS architecture

- Layer: `@layer components`.
- Trigger: pill-style with version label + chevron icon.
- Banner: full-width row with subtle warning color (uses `--color-warning-subtle`).
- Picker: list inside the popover with current entry highlighted; archived entries muted; draft entries with badge.
- Tokens reused: `--color-action-*`, `--color-warning-*`, `--color-surface-raised`, `--space-*`, `--radius-*`.

## File structure

```
src/web-components/version-switcher/
├── api.json
├── logic.js
├── styles.css
├── _diff.js          — small text/markup diff helper (mode B + diff action)
└── static.html
```

Plus:

```
demos/examples/demos/version-switcher-modes.html
  — mode A (releases) + mode B (history) + all three actions
site/src/pages/docs/elements/web-components/version-switcher.html
  — usage docs with adjacency table and integration patterns
```

## Build-time tooling considerations

The user noted this is bigger than it looks because of the data side. The component itself can ship without any tooling — authors hand-author the manifest JSON. But for real adoption we likely want:

1. **`vb:versions-manifest` meta-tag generator** — extend `site/plugins/generate-provenance-meta.js` to emit the new meta tag when frontmatter sets `versionsManifest`.
2. **Manifest derivation from frontmatter** — a frontmatter `versions: […]` field that the build collapses into a per-page JSON file at `dist/data/versions/<id>.json` and links via the meta tag.
3. **Future: git-history extractor** — a `cook` plugin that reads each page's git log and emits a default mode-B manifest. Out of scope for v1.

These are tracked as **separate beads** since they're build-pipeline work, not the component itself.

## Implementation phases

This component is bigger than a single-session ship. Suggested phases:

### Phase 1 — Core component (single session)

- Inline data source (`data-versions` attribute + `<script type="application/json">`)
- Trigger + picker UI composing `<pop-over>`
- `navigate` action only
- Mode auto-detection (release vs history)
- A11y wiring + ARIA
- Doc page + demo (mode A only)

Plenty of value just from this. Authors can already wire up classic docs version selectors.

### Phase 2 — Swap + diff actions (separate session)

- `data-action="swap"` with `[data-versioned]` region + View Transition
- `data-action="diff"` composing `<change-set>` + small text-diff helper (`_diff.js`)
- Mode B history demo
- `version-switcher:swap` / `:diff` events

### Phase 3 — Provenance integration (separate session)

- `data-page-info-target` mounting inside `<page-info>`
- `data-banner` archived-version banner
- Meta-tag fallback resolution (`vb:versions-manifest`)
- Frontmatter / build-plugin support (separate bead in the site-build neighborhood)

Each phase is its own bead. Ship phase 1 first; phases 2 and 3 unblock as authors actually use the component and surface real needs.

## Open questions

- **Diff algorithm** — text-level (line-by-line via myers / patience) or markup-aware? For docs prose, line-level diff is usually fine. **v1: line-level**; defer markup-aware to phase 2 if real authors hit confusing diffs.
- **Cross-version anchor preservation** — if user is at `/v1/page#section-foo` and switches to v2, does v2 also have `#section-foo`? **v1: pass through the hash; if v2 doesn't have it, browser scrolls to top**. Author can opt-in to a smarter anchor-mapping table later.
- **Version-aware deep links into the picker** — `?version=v1.4` query param to pre-open the picker on a specific entry? **Defer to v2**; nice-to-have, not load-bearing.
- **Should the picker show "what's new" / changelog excerpt inline?** — for releases, the `summary` field renders as a one-line description. Full changelog stays at `versionUrl`. **Yes, one-line summary inline; full changelog via link out**.

## References

- `admin/specs/meta-tag-contract-v1.md` — `meta[itemprop=version]` + `vb:version-url` (existing); add `vb:versions-manifest` (new)
- `site/plugins/generate-provenance-meta.js` — needs `versionsManifest` frontmatter wiring (separate build-tooling bead)
- `src/web-components/page-info/` — primary integration target via `data-page-info-target`
- `src/web-components/change-set/` — diff-action renderer
- `src/web-components/time-index/` — adjacent (changelog timeline, not per-page)
- `src/web-components/pop-over/` — picker surface
- WAI-ARIA Dialog Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog/
