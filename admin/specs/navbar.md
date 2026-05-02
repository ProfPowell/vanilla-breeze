# Spec: `<nav-bar>` — minimal active-link primitive (v1)

**Status:** Approved for v1 implementation, 2026-05-01.
**Predecessor:** This spec replaces an earlier draft that proposed a
larger surface (custom `renderItem`, cancellable `nav-bar:navigate`,
keyed diff preservation). After auditing three downstream consumers
(Cook, Montane, HTML-Star) we found the only durable cross-consumer
need is `aria-current` synchronization plus an ergonomic JSON/code-first
path for declaring the link list. The larger surface is deferred to a
Phase 2 that requires a concrete consumer ask. See "What we deferred"
at the bottom.

## Why

Every VB site builds nav from raw `<nav>` + `<a>`. That works fine for
static sites, but consumers hit two pains the rest of the dual-mode
rollout already solved elsewhere:

1. **Active-state duplication.** Each consumer hand-rolls
   `pathname` → `aria-current` matching. HTML-Star's `shop` and `crm`
   examples use *different event names* and *different a11y stances*
   (one sets `aria-current`, one doesn't). Cook does it at build time;
   VB's docs site does it for the sidebar at build time but not for
   the top nav at all.
2. **JSON-first declaration.** Reactive consumers want
   `nav.items = [...]` instead of templating, escaping, and injecting
   markup themselves.

Per the dual-mode contract documented at `/docs/concepts/data-api/`,
nav-bar follows the standard shape: idempotent `.items` and `.current`
setters, `:upgraded` event, source-tagged change events.

## Non-goals

We are **not** building a router. nav-bar **does not** intercept link
clicks or emit a cancellable navigate event. Reasons:

- The browser has the Navigation API, popstate, and View Transitions.
- Reactive frameworks each have routing opinions (Montane's `Link`
  already binds to its router; React-Router/SolidRouter/Vue-Router
  exist).
- HTML-Star intercepts at its own framework layer (`data-target`,
  `htmlstar:navigated`). It does not need VB to litigate the same.
- VB's no-framework view-switching is already covered by
  `<content-swap>`.

We are **not** replacing `<mobile-menu>`, `<page-toc>`,
`<command-palette>`, `<drop-down>`, or `<context-menu>`. nav-bar is
**the top-level link list** — that's the entire scope.

We are **not** shipping a custom `renderItem` hook. Bespoke markup →
author renders children themselves and skips `.items`. Add later only
if a concrete consumer asks.

## HTML-first shape

The DOM the component renders is the DOM an HTML-first author would
write themselves. There is no shadow DOM. `aria-current="page"` is the
only state the component owns on each link.

```html
<nav-bar aria-label="Main">
  <a href="/">Home</a>
  <a href="/dashboard">Dashboard</a>
  <a href="/settings">Settings</a>
</nav-bar>
```

After upgrade, the link matching `location.pathname` (per the
matching policy below) gets `aria-current="page"`. The component sets
`role="navigation"` on itself if no `role` is present.

**Nested-link opt-in:** If any descendant `<a>` carries
`data-nav-link`, those become the candidate set instead of direct
children. This is for layouts where each item is wrapped in `<li>`
or `<drop-down>` (e.g. the VB docs site). Direct-children remains
the default for the simple HTML-first shape above.

Without JS, the nav still renders as a working set of links — that's
the progressive-enhancement floor. `aria-current` simply isn't set
until upgrade; native focus/keyboard works regardless.

## JS-first API

### Properties

| Property | Type | Description |
|---|---|---|
| `.items` | `NavItem[] \| null` | The link list. Setter rebuilds children with the default renderer. Idempotent (deep-equal → no-op, no event re-fire). Reading returns the data shape inferred from current children, or the last array assigned. |
| `.current` | `string \| null` | The currently active route — matched by `data-route` attribute first, then `href`. Setter updates `aria-current` on the matching link. **Setting `.current` (even to `null`) takes ownership and disables the popstate auto-sync.** |

```ts
type NavItem = {
  href: string;          // <a href="...">
  label: string;         // link text
  route?: string;        // optional .current target. Falls back to href.
  icon?: string;         // optional icon name (renders <icon-wc>)
  external?: boolean;    // adds rel="noopener noreferrer" target="_blank"
  badge?: string;        // optional pill / count chip
};
```

### Events

| Event | Detail | When |
|---|---|---|
| `nav-bar:upgraded` | — | Once after first connect (free from VBElement). |
| `nav-bar:items-changed` | `{ items, source }` | After `.items` is assigned to a new value. `source: 'property'` for v1 (no other writer exists). |
| `nav-bar:current-changed` | `{ current, previous, source }` | After `.current` changes. `source: 'property' \| 'popstate' \| 'pathname'`. |

`source` strings follow the dual-mode contract; bubbling and composed
match other components in the family.

### Active-state resolution

Default policy:

1. **Explicit wins.** Setting `.current` (string or `null`) takes
   ownership. Auto popstate sync is disabled until the consumer
   removes ownership by re-enabling the attribute (see below).
2. **Auto from pathname.** When no `.current` is set, match
   `location.pathname` against each link's `href`:
   - **Exact match wins.**
   - Otherwise **longest `href` prefix wins** (so `/docs/api/elements`
     matches `/docs/api/` over `/docs/`).
   - Ties broken by **first-in-DOM-order**.
   - Opt out via `data-match="exact"` to require exact match only.
3. **Auto from popstate.** While auto mode is active, listen for
   `popstate` and re-match.

To return ownership to auto-mode after explicitly assigning `.current`,
call `nav.releaseCurrent()` — it clears the explicit flag and re-runs
pathname matching. (Why a method instead of `delete nav.current`?
`.current` is an accessor property; `delete` on accessors is a no-op,
so a method is the only honest escape hatch.)

### Reactive integration sketch (HTML-Star)

```html
<nav-bar aria-label="Main">
  <a href="/">Home</a>
  <a href="/dashboard">Dashboard</a>
  <a href="/settings">Settings</a>
</nav-bar>
```

```js
// HTML-Star fires its own navigation event.
window.addEventListener('htmlstar:navigated', () => {
  // Manually re-trigger pathname matching after AJAX-driven URL change.
  document.querySelector('nav-bar').refresh();
});
```

### Reactive integration sketch (JSON-first)

```js
const nav = document.querySelector('nav-bar');
await new Promise(r => nav.addEventListener('nav-bar:upgraded', r, { once: true }));

nav.items = [
  { href: '/',          label: 'Home' },
  { href: '/dashboard', label: 'Dashboard', icon: 'gauge' },
  { href: '/settings',  label: 'Settings' },
];

// React to client-side route changes by setting .current.
nav.current = '/dashboard';
```

## Composition with existing components

| Companion | Relationship |
|---|---|
| `<mobile-menu>` | nav-bar is content; mobile-menu is the off-canvas shell. They compose: `<mobile-menu><nav-bar>...</nav-bar></mobile-menu>`. |
| `<page-toc>` | Different scope — page-toc is per-page heading nav. No overlap. |
| `<command-palette>` | Different surface — keyboard launcher. No overlap. |
| `<drop-down>` / `<context-menu>` | Compose with nav-bar children for sub-menus (no nested-nav baked in). |
| `<site-map-wc>` | Different shape (full IA tree). No overlap. |
| `<recently-visited>` | Different intent (history). No overlap. |
| `<content-swap>` | The no-framework view-switcher pair. Consumer wires their own routing on top of either component. |

## Accessibility

- Container: `role="navigation"` set if absent. `aria-label` from author.
- Active link: `aria-current="page"` (only one at a time).
- External links: `rel="noopener noreferrer"` and `target="_blank"`
  when `item.external` is true; visible "(opens in new tab)" SR text.
- Keyboard: Tab through links (native); Enter / Space activates.
  No custom focus management — links are links.
- No live-region announcements for `.current` changes; the
  `aria-current` flip is enough.

## Reactive integration caveat (must appear on doc page)

v1 does **not** support driving `.items` from a signal/effect with
preserved in-flight state. Each `.items` assignment **fully replaces**
children. There is no keyed diff, so:

- A link mid-focus will lose focus on `.items` reassignment.
- Any `<icon-wc>` inside the rendered link will re-mount.
- This is fine for nav (links don't carry load-bearing state).

If you need reactive routing with keyed preservation, **use your
framework's link primitive** instead of nav-bar:

- **Montane**: use `Link()` (`montane/router.js`) — it's bound to the
  Montane router and reactively tracks active state. nav-bar would
  duplicate that work less well.
- **For view-switching without a router**: use `<content-swap>`.
- If your use case needs `renderItem` or keyed diff, **open an issue
  with the concrete scenario** so we can scope a Phase 2.

## What we deferred (Phase 2 candidates)

All require a concrete consumer ask before they ship.

- `.renderItem` custom renderer.
- `nav-bar:navigate` cancellable event (SPA click-interception).
- Keyed diff-by-route preservation (in-flight state on `.items` reassignment).
- Nested nav / sections / mega-menus.
- Brand / logo slot.
- Hash-route matching (`data-match="pathname+hash"`).
- Sticky / scroll-collapse behaviors (handled at layout level today).

## Bundle placement

`<nav-bar>` ships in the **core** bundle (`src/web-components/core.js`).
Nav is universal; the component is small (~150 lines).

## Suggested phasing

- **Phase 1 (this spec)** — `.items`, `.current`, three events,
  default renderer, pathname matching with prefix-longest tiebreak,
  popstate, `aria-current` sync, `data-match="exact"` opt-out. Doc
  page + concept-page link. Playwright spec covering HTML-first
  upgrade, `.items` rebuild + idempotency, `.current` aria-current
  sync, popstate auto-sync, explicit-takes-ownership invariant.
- **Phase 2** — Open only if a concrete consumer asks for one of the
  deferred items above.

## Verification when implementation lands

1. `npm run build`
2. `npm run test:components -- nav-bar` (Playwright spec).
3. Migrate `site/src/includes/header.html` top nav: wrap the existing
   `<nav>` in `<nav-bar>` and confirm active highlighting works on
   every section without the build-time plugin needing to do anything
   for the top nav specifically.
4. (Optional, downstream) HTML-Star adoption test — replace one app's
   hand-rolled active-link sync with `<nav-bar>` and confirm parity.
