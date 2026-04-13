# UX Planning Elements — Implementation Plan

**Date:** 2026-03-27
**Status:** Ready for implementation
**Components:** `<user-persona>`, `<user-story>`, `<user-journey>`
**Target:** Vanilla Breeze `ux-planning` pack

---

## Context

Three web components for the UX planning phase of product development have been prototyped in R&D. They visualise user personas, user stories (Agile format), and user journey maps with emotion curves. The goal is to graduate these into production-quality Vanilla Breeze components and ship them as part of a new **ux-planning pack** — a coherent toolset for the design/research phase that sits alongside wireframe mode, page-diagnostics, and future planning tools.

The R&D prototypes are functional and well-designed but use standalone patterns (Shadow DOM, inline CSS, self-managed dark mode) that need to be refactored to match VB's production architecture.

---

## Component Inventory

### 1. `<user-persona>`

Displays a user persona card with avatar, demographics, quote, and slotted sections.

**Attributes:**

| Attribute | Type    | Purpose |
|-----------|---------|---------|
| `name`    | string  | Persona name (drives avatar initials + color) |
| `role`    | string  | Job title / role |
| `age`     | string  | Age display |
| `location`| string  | Location display |
| `avatar`  | URL     | Optional avatar image URL |
| `quote`   | string  | Key quote displayed in highlight block |
| `compact` | boolean | Reduced spacing variant |

**Slots:**

| Slot           | Content | Purpose |
|----------------|---------|---------|
| `bio`          | `<p>`   | Background narrative |
| `goals`        | `<ul>`  | What the persona wants to achieve |
| `frustrations` | `<ul>`  | Pain points and blockers |
| `behaviors`    | `<ul>`  | Observable patterns and habits |

**Events:** None in R&D (add `persona-ready` for consistency).

**Key rendering features:**
- Deterministic avatar color from name hash (hue-based HSL)
- Initial-based avatar fallback when no `avatar` URL provided
- Four-column auto-fit grid for sections
- SVG icons for section headers (person, check, warning, document)

---

### 2. `<user-story>`

Displays an Agile user story card: "As a [persona], I want [action] so that [benefit]."

**Attributes:**

| Attribute  | Type    | Purpose |
|------------|---------|---------|
| `persona`  | string  | The "As a..." role |
| `action`   | string  | The "I want..." description |
| `benefit`  | string  | The "so that..." outcome |
| `priority` | enum    | `critical` · `high` · `medium` · `low` |
| `status`   | enum    | `backlog` · `to-do` · `in-progress` · `review` · `done` |
| `points`   | string  | Story point estimate |
| `epic`     | string  | Parent epic label |
| `story-id` | string  | Ticket/story identifier (e.g. PROJ-142) |
| `compact`  | boolean | Reduced spacing variant |

**Slots:**

| Slot                  | Content | Purpose |
|-----------------------|---------|---------|
| `acceptance-criteria` | `<ul>`  | AC checklist |
| `tasks`               | `<ul>`  | Implementation tasks |
| `notes`               | `<p>`   | Additional context |

**Events:**
- `story-ready` — Fired on render with full story detail payload
- `status-changed` — Fired when `updateStatus()` called
- `priority-changed` — Fired when `updatePriority()` called

**Public methods:**
- `updateStatus(newStatus)` — Programmatic status change with validation
- `updatePriority(newPriority)` — Programmatic priority change with validation

**Key rendering features:**
- Color-coded priority badges (red/orange/yellow/green)
- Color-coded status badges (gray/blue/purple/amber/green)
- Circular points badge
- "As a / I want / so that" structured sentence with keyword highlighting
- Drag handle hint for future Kanban use
- Hover elevation effect

---

### 3. `<user-journey>`

Visualises a multi-phase user journey with an SVG emotion curve and a structured breakdown grid.

**Attributes:**

| Attribute    | Type    | Purpose |
|-------------|---------|---------|
| `title`     | string  | Journey map title |
| `persona`   | string  | Persona name |
| `persona-id`| string  | Links to `<user-persona id="...">` |
| `summary`   | string  | One-line journey description |
| `story-ids` | CSV     | Comma-separated related story IDs |
| `src`       | URL     | JSON file for complex phase data |
| `compact`   | boolean | Reduced spacing variant |

**Data model** (set via `src` JSON or `.phases` property):

```json
{
  "name": "Awareness",
  "emotion": "curious",
  "storyIds": ["PROJ-142"],
  "actions": ["..."],
  "thoughts": ["..."],
  "touchpoints": ["..."],
  "painPoints": ["..."],
  "opportunities": ["..."]
}
```

**Emotion scale** (9 values, drives SVG curve y-position and dot color):
`delighted` → `satisfied` → `hopeful` → `curious` → `neutral` → `uncertain` → `confused` → `frustrated` → `angry`

**Key rendering features:**
- SVG Bézier curve with gradient fill and emotion-colored dots
- Three-zone background (positive / neutral / negative)
- Full grid table: phase columns × row types (actions, thoughts, touchpoints, pain points, opportunities)
- Sticky row labels and corner cell for horizontal scroll
- Semantic row tinting (pain points = red bg, opportunities = green bg)
- Cross-reference chips linking to stories and personas
- Async JSON loading with loading/error states

---

## Component Interactions

The three components form a **connected triad** for UX planning:

```
┌──────────────┐    persona attr     ┌──────────────┐
│ user-persona │◄────────────────────│ user-journey │
│   id="p-1"   │    persona-id="p-1" │              │
└──────────────┘                     └──────┬───────┘
                                            │ story-ids
       ┌───────────────┐                    │ phase.storyIds
       │  user-story   │◄───────────────────┘
       │ story-id="S1" │   anchor links
       └───────────────┘
```

### Linking mechanism

1. **Journey → Persona**: `persona-id` attribute on `<user-journey>` matches the `id` attribute of a `<user-persona>` on the same page. Renders as an anchor link `<a href="#persona-id">`.

2. **Journey → Stories**: Top-level `story-ids` attribute (CSV) and per-phase `storyIds` array both render as chip links targeting `<user-story story-id="...">` elements. The `story-id` attribute on `<user-story>` should also be set as the element's `id` for anchor targeting.

3. **Story → Persona**: The `persona` attribute on `<user-story>` is a display string (not a link). When stories and personas coexist on a page, the persona text matches the persona's `name` attribute.

### Interaction patterns for page authors

**Full planning page** (all three together):
```html
<!-- Persona definition -->
<user-persona id="persona-sarah" name="Sarah Chen" role="PM" ...>
  <ul slot="goals">...</ul>
  <ul slot="frustrations">...</ul>
</user-persona>

<!-- Stories linked to this persona -->
<user-story id="PROJ-142" story-id="PROJ-142" persona="Sarah Chen" ...>
  <ul slot="acceptance-criteria">...</ul>
</user-story>

<!-- Journey linking both -->
<user-journey
  persona="Sarah Chen"
  persona-id="persona-sarah"
  story-ids="PROJ-142,PROJ-143"
  src="/data/journey.json">
</user-journey>
```

**Standalone use**: Each component works independently. No component requires the others to be present — links simply become non-functional anchors when targets don't exist.

### Event-based coordination (future)

The `story-ready` and `status-changed` events on `<user-story>` enable future coordination scenarios:
- Journey map could listen for story status changes and update phase indicators
- A parent orchestrator could sync story status across views
- Kanban boards could reorder story elements via drag events

This is **not** in scope for initial implementation but the event surface is designed for it.

---

## Architectural Decisions

### Shadow DOM — Keep It

The R&D prototypes use Shadow DOM. **Keep this approach** for the UX planning components.

**Rationale:**
- These components have complex internal structure (cards, grids, SVG) that benefits from style encapsulation
- Named slots (`bio`, `goals`, `acceptance-criteria`) are the natural HTML API — slots require Shadow DOM
- As a package for planning/documentation, style isolation prevents VB's own layout utilities from leaking into the component internals
- CSS custom properties pierce the Shadow boundary, so VB design tokens are still available

**Consequence:** These components cannot extend `VBElement` directly (which assumes light DOM with `data-upgraded` guard). Options:
1. **Extend HTMLElement** with a similar upgrade guard pattern — simplest, matches R&D code
2. **Create a `VBShadowElement`** base class if more Shadow DOM components follow — premature for 3 components

**Recommendation:** Option 1 — extend HTMLElement directly with `data-upgraded` guard. Revisit if a pattern emerges.

### Theme Integration — Use VB tokens, drop self-managed dark mode

The R&D prototypes detect `prefers-color-scheme` internally and hardcode light/dark values. Production components should:

1. **Define CSS custom properties** on `:host` that map to VB design tokens
2. **Let VB's theme system** handle dark/light via the cascade
3. **Keep `mode` attribute** as an explicit override escape hatch

```css
/* Production pattern */
:host {
  --_bg:     var(--user-persona-bg, var(--color-surface, #ffffff));
  --_text:   var(--user-persona-text, var(--color-text, #1a1a1a));
  --_border: var(--user-persona-border, var(--color-border, #e0e0e0));
  --_muted:  var(--user-persona-muted, var(--color-text-muted, #666));
  --_accent: var(--user-persona-accent, var(--color-interactive, #0066cc));
}
```

This gives three levels of control:
1. VB theme tokens set the defaults
2. Component-specific tokens (`--user-persona-*`) allow per-component overrides
3. Direct `:host` style overrides via `::part()` for one-off customisation

### File Structure

```
src/web-components/
├── user-persona/
│   ├── logic.js          ← Component class + registration
│   ├── styles.js         ← CSS template literal (Shadow DOM inline)
│   ├── api.json          ← Attribute/event/slot metadata
│   ├── static.html       ← Zero-JS fallback structure
│   └── README.md         ← Spec per template
├── user-story/
│   ├── logic.js
│   ├── styles.js
│   ├── api.json
│   ├── static.html
│   └── README.md
└── user-journey/
    ├── logic.js
    ├── styles.js
    ├── api.json
    ├── static.html
    └── README.md
```

**Note:** Using `styles.js` (not `styles.css`) because Shadow DOM requires inline `<style>` — a JS module exporting a template string is the cleanest way to keep styles separate from logic while still injecting into the shadow root.

### Pack Registration

Add a new functional pack: `ux-planning.pack.js`

```javascript
import '../user-persona/logic.js';
import '../user-story/logic.js';
import '../user-journey/logic.js';
```

Register in `scripts/build-cdn.js` alongside `ui.pack`, `effects.pack`, `prototype.pack`.

### Progressive Enhancement (static.html)

Each component needs a zero-JS static form. Since these components render structured data from attributes + slots, the static form uses semantic HTML that is readable without JS:

**user-persona static form:**
```html
<user-persona name="Sarah Chen" role="PM" age="34" location="SF">
  <p slot="bio">...</p>
  <ul slot="goals"><li>...</li></ul>
  <ul slot="frustrations"><li>...</li></ul>
</user-persona>
```
Without JS, the slotted content renders as normal children. The attributes are hidden but content is accessible. Add a `:not(:defined)` CSS rule in the pack stylesheet to provide minimal visual structure.

**user-journey static form:**
The `src` (JSON-driven) mode shows nothing without JS. The component should render a `<noscript>` or fallback message. Since journey data is complex, the static form is a simplified summary paragraph rather than the full grid.

---

## Implementation Plan

### Phase 1: Shared Infrastructure (30 min)

1. **Create base module** `src/web-components/_ux-base.js`:
   - Shared upgrade guard pattern for Shadow DOM components
   - Shared `_esc()` HTML escaping utility
   - Shared `_initials()` and `_hashColor()` avatar utilities
   - Shared emotion metadata (used by journey, potentially by story priority colors)

2. **Create pack entry** `src/web-components/ux-planning-pack.js`:
   - Imports all three components
   - Registered in build-cdn.js

### Phase 2: `<user-persona>` (1.5 hr)

**Files to create:**
- `src/web-components/user-persona/logic.js`
- `src/web-components/user-persona/styles.js`
- `src/web-components/user-persona/api.json`
- `src/web-components/user-persona/static.html`
- `src/web-components/user-persona/README.md`

**Refactoring from R&D:**
1. Extract inline CSS from `_render()` into `styles.js` as a template literal export
2. Replace hardcoded color values with VB token references (3-tier: VB token → component token → fallback)
3. Remove `mode` attribute dark/light detection — let CSS custom properties + `prefers-color-scheme` media query handle it via the token cascade
4. Add `data-upgraded` attribute on connectedCallback
5. Add `persona-ready` custom event (bubbles, composed) for consistency with user-story
6. Keep Shadow DOM + slots architecture as-is
7. Replace inline SVG icons with `<icon-wc>` if appropriate, or keep inline SVGs for zero-dependency isolation

**CSS tokens to define:**

| Token | Default | Purpose |
|-------|---------|---------|
| `--user-persona-bg` | `var(--color-surface)` | Card background |
| `--user-persona-text` | `var(--color-text)` | Primary text |
| `--user-persona-muted` | `var(--color-text-muted)` | Secondary text |
| `--user-persona-border` | `var(--color-border)` | Card border |
| `--user-persona-accent` | `var(--color-interactive)` | Role text, links |
| `--user-persona-radius` | `16px` | Card corner radius |
| `--user-persona-avatar-size` | `80px` | Avatar dimensions |
| `--user-persona-goals` | `#22c55e` | Goals section accent |
| `--user-persona-frustrations` | `#ef4444` | Frustrations section accent |
| `--user-persona-behaviors` | `#8b5cf6` | Behaviors section accent |

**Accessibility:**
- `role="article"` on card with `aria-label`
- `role="img"` on avatar with `aria-label`
- `aria-hidden="true"` on decorative quote mark
- Slot fallback text for empty sections

### Phase 3: `<user-story>` (1.5 hr)

**Files to create:**
- `src/web-components/user-story/logic.js`
- `src/web-components/user-story/styles.js`
- `src/web-components/user-story/api.json`
- `src/web-components/user-story/static.html`
- `src/web-components/user-story/README.md`

**Refactoring from R&D:**
1. Same CSS extraction and token integration as persona
2. Keep `PRIORITIES` and `STATUSES` static maps — move color values to CSS custom properties where possible
3. Keep `updateStatus()` and `updatePriority()` public API methods
4. Keep event dispatching (`story-ready`, `status-changed`, `priority-changed`)
5. Add `data-upgraded` guard
6. Remove `mode` attribute, use token cascade

**CSS tokens to define:**

| Token | Default | Purpose |
|-------|---------|---------|
| `--user-story-bg` | `var(--color-surface)` | Card background |
| `--user-story-text` | `var(--color-text)` | Primary text |
| `--user-story-muted` | `var(--color-text-muted)` | Secondary text |
| `--user-story-border` | `var(--color-border)` | Card border |
| `--user-story-accent` | `var(--color-interactive)` | Keyword color, points badge |
| `--user-story-radius` | `12px` | Card corner radius |

Priority and status colors remain hardcoded in the static maps (they are semantic — red=critical, green=done — and should not change with themes).

**Accessibility:**
- `role="article"` on card with `aria-label="User story: [story-id]"`
- Status and priority communicated via visible text (not color alone)
- Drag handle hidden from tab order until drag feature is implemented

### Phase 4: `<user-journey>` (2 hr)

**Files to create:**
- `src/web-components/user-journey/logic.js`
- `src/web-components/user-journey/styles.js`
- `src/web-components/user-journey/api.json`
- `src/web-components/user-journey/static.html`
- `src/web-components/user-journey/README.md`

**Refactoring from R&D:**
1. Extract `_css()` method content into `styles.js`
2. Replace `var(--bg)`, `var(--text)`, etc. with VB token references
3. Keep the SVG curve rendering (`_curve()`) and grid rendering (`_grid()`) methods
4. Keep `_loadSrc()` async JSON loading with loading/error states
5. Keep the `.phases` property setter API
6. Move `EMOTION_META` and `ROWS` constants into the module (or shared base if useful)
7. Add `data-upgraded` guard
8. Add `journey-ready` event after render completes

**CSS tokens to define:**

| Token | Default | Purpose |
|-------|---------|---------|
| `--user-journey-bg` | `var(--color-surface)` | Card background |
| `--user-journey-text` | `var(--color-text)` | Primary text |
| `--user-journey-muted` | `var(--color-text-muted)` | Secondary text |
| `--user-journey-border` | `var(--color-border)` | Card/grid borders |
| `--user-journey-curve-stroke` | `#6366f1` | SVG curve line color |
| `--user-journey-radius` | `12px` | Card corner radius |

Emotion colors stay hardcoded (semantic meaning: green=happy, red=angry).

**Accessibility:**
- `aria-label` on the grid table
- `aria-hidden="true"` on the SVG curve (decorative — emotion is also shown via emoji + text)
- Phase numbers in the grid header for screen reader orientation
- Sticky column headers for keyboard navigation in the scrollable grid

### Phase 5: Build Integration (30 min)

1. **Register in `src/web-components/index.js`** (or extras.js if keeping core slim):
   ```javascript
   import './user-persona/logic.js';
   import './user-story/logic.js';
   import './user-journey/logic.js';
   ```

2. **Create pack entry** and register in `scripts/build-cdn.js`

3. **Run `npm run build`** to verify:
   - Individual CDN bundles created in `dist/cdn/components/`
   - Pack bundle created in `dist/cdn/packs/`
   - `manifest.json` updated with new entries

4. **Verify no regressions**: `npm test` and `npm run conformance`

### Phase 6: Documentation Pages (1 hr)

Create three `.njk` doc pages:
- `site/src/pages/docs/elements/web-components/user-persona.njk`
- `site/src/pages/docs/elements/web-components/user-story.njk`
- `site/src/pages/docs/elements/web-components/user-journey.njk`

Each page follows the standard doc layout with:
- Overview description
- Live demo(s) in `<browser-window>` + `<code-block>`
- Attributes table
- Slots table
- Events table (story, journey)
- CSS tokens table
- Accessibility notes
- Compact variant demo

Additionally, create a **pack overview page**:
- `site/src/pages/docs/packs/ux-planning.njk`
- Explains the UX planning package concept
- Shows how the three components work together on a single page
- Links to individual component doc pages

### Phase 7: Testing (1 hr)

1. **Component tests** (`npm run test:components`):
   - Attribute reflection
   - Slot content rendering
   - Event dispatch (story, journey)
   - `updateStatus()` / `updatePriority()` validation
   - JSON `src` loading (journey)
   - Compact mode rendering
   - Edge cases: missing attributes, empty slots, invalid priority/status values

2. **Conformance** (`npm run conformance`):
   - `api.json` matches actual implementation
   - All attributes documented
   - All events documented

3. **Visual verification**:
   - Light mode + dark mode
   - Compact mode
   - Mobile viewport (< 480px)
   - Print stylesheet
   - Cross-references work (clicking persona chip scrolls to persona)

---

## Verification Checklist

Before marking complete:

- [ ] All three components render correctly in light and dark modes
- [ ] Compact mode works for all three
- [ ] `<user-journey>` loads JSON from `src` attribute
- [ ] `.phases` property setter triggers re-render
- [ ] Cross-reference links between components work on a shared page
- [ ] Each component works standalone (no dependency on siblings)
- [ ] CSS tokens can be overridden by themes
- [ ] `npm test` passes
- [ ] `npm run conformance` passes
- [ ] `npm run build` succeeds — CDN bundles + manifest updated
- [ ] Doc pages render correctly on the 11ty site
- [ ] Pack page shows all three working together
- [ ] `prefers-reduced-motion` respected (story card hover transition)
- [ ] No FOUC — `:not(:defined)` styles provide structure before upgrade
- [ ] Events fire correctly (story-ready, status-changed, etc.)

---

## Open Questions

1. **Icon approach**: Keep inline SVGs (zero dependency, Shadow DOM friendly) or use `<icon-wc>` (consistent with VB, but adds a dependency and may not work across shadow boundary)?
   **Recommendation:** Keep inline SVGs. These are small, semantic icons within Shadow DOM. Using `<icon-wc>` would require piercing the shadow boundary or duplicating icon definitions.

2. **Pack naming**: `project-tools`
   **Recommendation:** `ux-planning` — matches the directory name and is specific enough to distinguish from UI components.

3. **Extras vs core**: These are niche components. Should they go in `extras.js` or only be available via the pack and individual CDN bundles?
   **Recommendation:** Pack + individual CDN only. Don't add to core or extras — users opt in via the pack.

4. **Future components in this pack**: wireframe mode, site-map (for IA planning), ilities/requirements components, empathy-map? The pack structure should accommodate growth.
   **Recommendation:** Design the pack entry to be the single import point. Future components just add another import line.
