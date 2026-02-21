# CSS Layout Future — Vanilla Breeze Roadmap

> **Last updated:** 2026-02-21
> **Purpose:** Where VB can go with modern CSS. Each proposal includes browser readiness, VB integration path, progressive enhancement fallback, and priority assessment.
> **Philosophy:** Progressive enhancement to the future — use modern features now with graceful fallbacks.

---

## 1. Subgrid for Aligned Card Internals

**Problem:** Card grids where headings, body text, and CTAs don't align across cards. Each card sizes its own rows independently — no cross-card coordination.

**Solution:** `grid-template-rows: subgrid` on card children inheriting parent row tracks.

```css
[data-layout="grid"] {
  grid-template-rows: subgrid; /* cards share row tracks */
}

[data-layout="grid"] > layout-card {
  display: grid;
  grid-row: span 3; /* header + body + footer */
  grid-template-rows: subgrid;
}
```

**VB integration:** `data-layout-subgrid` opt-in on `[data-layout="grid"]` children. Doesn't force subgrid everywhere — only where cross-card alignment matters.

**Browser:** Baseline 2023 (Chrome 117+, Firefox 71+, Safari 16.4+) — safe now.

**Progressive enhancement:** Without subgrid, cards render as regular grid items — each card self-sizes. Alignment isn't pixel-perfect but layout is functional.

```css
@supports not (grid-template-rows: subgrid) {
  [data-layout="grid"] > layout-card { /* regular grid fallback */ }
}
```

**R&D reference:** `r-n-d/container-queries-fluidity/subgrid-enhancement.md` — spec and LLM guide exist, implementation not started.

---

## 2. Container Query Expansion — Targeted Additions

Each new query must solve a real layout problem. Not a blanket expansion.

**Candidate queries:**

| Query | Container | Purpose |
|:---|:---|:---|
| `@container region-main (width < 40rem)` | `region-main` | Main-level sidebar nav stacks to top bar |
| `@container card (width < 200px)` | `card` | Micro-card mode: icon-only, hide text |
| `@container (width < 45ch)` | Anonymous (prose parent) | Prose adaptation: reduce margins, slightly smaller font |

**VB integration:** Each uses existing named containers (`region-main`, `card`) or anonymous semantic containment. No new `container-type` declarations needed.

**Browser:** Container size queries are Baseline 2023 — safe now.

**What to avoid** (from `container-queries-expansion.md`):
- Don't make all layout primitives containers (stack/cluster collapse to 0px without extrinsic sizing)
- Don't replace the 768px page-layout breakpoint with CQ (page layouts are viewport-level concerns)
- Don't bake CQ units into typography (unpredictable without controlled containment)

---

## 3. Scroll-Driven Animations

**Problem:** Scroll-linked effects (sticky header shrink, progress bars, parallax) currently require JS `IntersectionObserver` or `scroll` event listeners.

**Solution:** CSS `animation-timeline` property.

**Candidates:**

1. **Sticky header shrink** — `animation-timeline: scroll()` on `header[data-sticky]`. Header compresses padding and font-size as user scrolls.
2. **Reading progress bar** — `animation-timeline: scroll()` on `progress[data-scroll-progress]`. Width animates from 0% to 100% tied to page scroll.
3. **Parallax sections** — `animation-timeline: view()` on hero sections. Subtle depth effect as section enters viewport.

```css
header[data-sticky] {
  animation: shrink-header linear both;
  animation-timeline: scroll();
  animation-range: 0 200px;
}

@keyframes shrink-header {
  to {
    padding-block: var(--size-xs);
    font-size: var(--font-size-sm);
  }
}
```

**VB integration:** `data-scroll-animate` attribute or utility classes in the `utils` layer. Opt-in only.

**Browser:** Chrome 115+, Firefox 110+ (Baseline 2024). Safari has partial support.

**Progressive enhancement:** Without support, elements remain static. Headers stay full-size, progress bars don't animate. Acceptable fallback for all candidates.

---

## 4. `@property` Expansion for Animatable Design Tokens

**Current state:** VB already uses `@property` for 4 declarations:
- `--hue-primary`, `--hue-secondary`, `--hue-accent` (`tokens/colors.css:10–22`) — enable smooth hue transitions on theme change
- `--gradient-angle` (`labs/labs.css:138`) — animatable gradient rotation

**Problem:** Most CSS custom properties can't transition or animate — they change instantly. Theme switches, sidebar resizing, and corner radius changes are jarring without `@property`.

**Expansion candidates:**

| Property | Syntax | Purpose |
|:---|:---|:---|
| `--sidebar-width` | `<length>` | Smooth sidebar collapse/expand transitions |
| `--color-primary` | `<color>` | Smooth theme color transitions (not just hue) |
| `--radius-s`, `--radius-m`, `--radius-l` | `<length>` | Morphing corners on theme change |
| `--view-transition-duration` | `<time>` | Animatable timing for dynamic speed adjustments |

```css
@property --sidebar-width {
  syntax: "<length>";
  inherits: true;
  initial-value: 280px;
}
```

**Browser:** Baseline 2024 (Chrome 85+, Firefox 128+, Safari 15.4+) — safe to adopt.

**Progressive enhancement:** Without `@property`, tokens still work as regular custom properties — they just don't animate. Instant change instead of transition.

---

## 5. Same-Document View Transitions

**Current state:** VB uses cross-document view transitions only (`@view-transition { navigation: auto }` in `view-transitions.css`). No `document.startViewTransition()` usage.

**Problem:** SPA-style interactions within a page (tab switching, content swaps, accordion expansion) use CSS transitions that don't composite as smoothly as view transitions.

**Candidates:**

| Component | Transition Type | Benefit |
|:---|:---|:---|
| `content-swap` | `document.startViewTransition()` wrapping swap | Composited cross-fade between old/new content |
| `tabs-wc` | `view-transition-name` per panel | Smooth panel-to-panel morph |
| Accordion / `<details>` | View transition wrapping `open` toggle | Expand/collapse with composited animation |

**VB integration:** Shared utility function:

```js
// src/utils/swap-transition.js
export function startSwapTransition(callback) {
  if (!document.startViewTransition) return callback();
  return document.startViewTransition(callback);
}
```

Components opt-in by wrapping their DOM mutations in this helper.

**Browser:** Chrome 111+, Safari 18+ (Baseline 2024).

**Progressive enhancement:** Without support, callback executes directly. CSS transitions (existing) handle the animation. Identical behavior, slightly less smooth.

---

## 6. `@starting-style` Expansion

**Current state:** Only `tooltip/styles.css` uses `@starting-style` (lines 49, 215) for popover entry animations — fade+slide from `opacity:0; translateY(4px)`.

**Expand to:**

| Component | Entry Animation | File |
|:---|:---|:---|
| `toast-wc` | Slide-in from edge | toast-wc/styles.css |
| `dropdown-wc` | Scale-fade from trigger | dropdown-wc/styles.css |
| `command-wc` | Fade-scale from center | command-wc/styles.css |
| `combobox-wc` | Listbox appear | combobox-wc/styles.css |
| `context-menu` | Scale-fade from cursor | context-menu/styles.css |

**Pattern** (same as tooltip):
```css
.dropdown-panel:popover-open {
  opacity: 1;
  transform: scale(1);
  transition: opacity 0.15s, transform 0.15s;
}

@starting-style {
  .dropdown-panel:popover-open {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

**Benefit:** Replace JS animation triggers with CSS-only entry effects. Reduced JS complexity.

**Browser:** Baseline 2024 (Chrome 117+, Firefox 129+, Safari 17.5+) — safe to expand.

**Progressive enhancement:** Without support, elements appear instantly. Fully functional, no animation.

---

## 7. Popover API Expansion

**Current state:** Only tooltip uses `popover="hint"` and `popover="auto"` with `:popover-open` styling.

**Expand to:**

| Component | Popover Type | Benefit |
|:---|:---|:---|
| `dropdown-wc` | `popover="auto"` | Light-dismiss (click outside closes), top-layer stacking |
| `command-wc` | `popover="auto"` | Modal behavior, focus trapping |
| `context-menu` | `popover="auto"` | Light-dismiss, proper z-index stacking |

**What this replaces:**
- Manual `addEventListener('click', closeOnOutsideClick)` → native light-dismiss
- Manual `z-index` stacking → native top-layer
- Manual focus trap logic → native popover focus management

**Browser:** Baseline 2024 (Chrome 114+, Firefox 125+, Safari 17+) — safe to expand.

**Progressive enhancement:** Keep existing JS stacking and dismiss logic as fallback behind `HTMLElement.prototype.hasOwnProperty('popover')` check.

---

## 8. `interpolate-size: allow-keywords` for Auto Height Transitions

**Problem:** `height: auto` can't animate. Accordion, `<details>`, collapsible nav, and content sections either jump open/closed or require JS measurement (`scrollHeight`). This is the single most impactful missing feature for VB's disclosure patterns.

**Solution:**

```css
:root {
  interpolate-size: allow-keywords;
}
```

One declaration enables transitioning to/from `auto`, `min-content`, `max-content` everywhere.

**VB candidates:**
- `accordion-wc` — expand/collapse animation
- `<details>` element — native disclosure animation
- Collapsible nav sections — sidebar category expand
- `content-swap` — height-aware swap transitions

```css
details[open] > :not(summary) {
  transition: height 0.3s ease, opacity 0.3s ease;
}
```

**Browser:** Chrome 129+ (Sep 2024), Safari 18.2+ (Dec 2024). Firefox not yet (as of Feb 2026).

**Progressive enhancement:** Without support, disclosure is instant open/close. Fully functional. The `interpolate-size` declaration is ignored by non-supporting browsers.

---

## 9. Progressive Enhancement Strategy Summary

| Feature | Baseline | VB Status | Fallback Impact | Priority |
|:---|:---|:---|:---|:---|
| `text-wrap: balance/pretty` | 2024 | **Done** | Normal wrapping | — |
| Popover API (tooltip) | 2024 | **Done** | — | — |
| `@starting-style` (tooltip) | 2024 | **Done** | Instant appear | — |
| `field-sizing: content` | 2024 | **Done** | JS fallback exists | — |
| CSS anchor positioning | 2024 | **Done** | JS fallback | — |
| `@property` (hue/angle) | 2024 | **Done** | Tokens work, don't animate | — |
| Subgrid | 2023 | **Not started** | Regular grid | High |
| `@starting-style` expansion | 2024 | **Expand** | Instant appear for other components | High |
| Popover API expansion | 2024 | **Expand** | Keep existing JS stacking | High |
| `@property` expansion | 2024 | **Expand** | Tokens work, don't animate | Medium |
| `interpolate-size` | Chrome 129, Safari 18.2 | **PE** | Instant expand/collapse | High |
| Same-doc View Transitions | Chrome 111, Safari 18 | **PE** | CSS transitions work fine | Medium |
| Scroll-driven animations | Chrome 115, Firefox 110 | **PE** | Static elements | Low |
| Container query expansion | 2023 | **Targeted** | Existing layouts work | Low |
| Style queries | Chrome only | **Wait** | Data attributes work | — |

**PE** = Progressive Enhancement (use where supported, acceptable fallback)

### Adoption Priority Rationale

**High priority** — Baseline 2023–2024, zero-risk progressive enhancement, high value:
- **Subgrid**: Solves card alignment — a visible, common layout problem
- **`@starting-style` expansion**: Pattern already proven in tooltips; extend to 5 more components
- **Popover API expansion**: Eliminates significant JS complexity in 3 components
- **`interpolate-size`**: Single most impactful feature for disclosure patterns; one-line opt-in

**Medium priority** — Valuable but lower urgency:
- **`@property` expansion**: Smooth theme transitions are nice-to-have, not critical
- **Same-doc View Transitions**: Existing CSS transitions work well; view transitions are a polish layer

**Low priority** — Useful for specific cases, not systemic:
- **Scroll-driven animations**: Opt-in effects, not core layout
- **Container query expansion**: Current 6 queries cover real needs; expand only when a specific layout problem demands it

**Wait** — Browser support insufficient:
- **Style queries**: Chrome + Safari TP only; data attributes serve the same purpose with universal support
