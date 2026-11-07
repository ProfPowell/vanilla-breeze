# View transitions: contract for component authors

How VB components use the View Transitions API today, and the rules a new
or changed component must follow. Author-facing docs live on the site:
`/docs/attributes/data-transition/` (same-document, components, `VB.swap()`)
and `/docs/attributes/view-transitions/` (cross-page, and the one canonical
browser-support table). Keep this file current when a pattern changes.

## The pieces

| Piece | File | What it is for |
|---|---|---|
| `viewTransitionSwap(host, swap, prefix)` | `src/lib/vb-view-transition.js` | **Default for components.** Crossfades a whole host while a synchronous `swap()` mutates it. Pins a unique name, clears it after `finished`, falls back to plain `swap()` in all three cases below. |
| `startSwapTransition(cb)` | `src/utils/swap-transition.js` | Thin wrapper used by tab-set, accordion-wc, carousel-wc and content-swap. Only checks API support; reduced motion is left to CSS. |
| `VB.swap(update)` | `src/lib/vb.js` | Author-facing. Also fires `vb:vt-update-done` on `[data-trigger~="vt"]` after `updateCallbackDone` so deferred entrance effects start in sync. |
| `VB.transition(name, handler)` | `src/lib/vb.js`, presets in `src/lib/vb-transitions.js` | Handlers for the `data-transition` attribute. Late registrations re-wire elements already processed (the runtime self-boots before presets register). |
| Keyframes, presets, tokens, reduced motion | `src/utils/vt-keyframes.css` | **Always shipped.** `vt-{fade,slide,scale}-{in,out}*` keyframes, `::view-transition-*(*.slide-left|slide-right|scale|fade|none)` presets, `--view-transition-duration[-fast|-slow]`, and the global reduced-motion rule. |
| Cross-document opt-in | `src/utils/view-transitions.css` | **Opt-in, never bundled.** `@view-transition { navigation: auto }`, `data-vt` groups, `data-vt-class` mappings. Importing it changes every navigation on the site, which is why it stays out of the bundles. Built to `dist/cdn/view-transitions.css` (export `vanilla-breeze/view-transitions-css`). |

## Who does what today

- **Whole-host crossfade:** chart-wc, diagram-wc, flow-diagram and
  site-map use `viewTransitionSwap` (the last three migrated in v4m9; each
  keeps its own "only animate a re-render" guard). site-map chains the
  returned transition's `updateCallbackDone` to restore scroll position,
  and handles the `null` fallback return. version-switcher awaits
  `startViewTransition(apply).updateCallbackDone`.
- **Per-part, author-selectable mode:** tab-set, accordion-wc and
  carousel-wc read a `transition` attribute (`fade` | `slide` | `scale`)
  and set a component-scoped class (`vt-tabs`, `vt-tabs-slide`, ...).
  Their `::view-transition-*` rules live in the component's `styles.css`.
- **Gallery morph:** image-gallery hands one name from the thumbnail (old
  snapshot) to the lightbox image (new snapshot) inside the update
  callback, so the two morph; the name is cleared afterwards
  (`transition`: `morph` | `fade` | `none`). This is the pattern for any
  shared-element morph between two different elements.
- **Two-face swap:** content-swap names each instance
  `content-swap-<n>` and uses its own effect names (`flip`, ...).

## Rules

### 1. Every fallback branch still mutates the DOM, synchronously

There are three no-animation branches: host not connected,
`startViewTransition` missing, and reduced motion. Each must run the same
DOM change, immediately. Never put the mutation inside a `.then()` that only
the animated path reaches. `viewTransitionSwap` does this for you; if you
inline, copy its guard exactly.

### 2. Names are unique among *rendered* elements

Two rendered elements with the same `view-transition-name` abort the whole
transition (silently, page-wide). Rules of thumb:

- One host, one name: `<prefix>-<module counter>` (`chart-vt-3`). Module
  counters, not `Math.random()`, so names are stable within a page.
- Several mutually exclusive parts may share a name only if at most one is
  rendered at a time. tab-set gives every panel `tabs-<id>` because closed
  `<details>` content isn't rendered.
- An author `id` makes a good stable name (`VB.uid(el)` returns it), but
  only for elements that won't be duplicated by templates.
- Set names as late as possible and clear them after `finished` when the
  element doesn't need one permanently. A permanent name also takes part in
  cross-document navigations and in every other component's transition.
- Never name `<main>`: it creates a containing block that traps
  `position: fixed` descendants (maximized `<browser-window>`).

### 3. Classes: presets or a component namespace

`view-transition-class` selects the animation. Use a shared preset
(`slide-left`, `slide-right`, `scale`, `fade`, `vt-none`) when the component
has no opinion. Use `vt-<component>[-mode]` when its timing or direction
differs. Don't invent unprefixed class names: they collide with the
presets and with author CSS.

### 4. Direction lives on `:root`, for the duration of one transition

Pseudo-elements hang off the document, not the component, so direction is
signalled with `document.documentElement.dataset.vtDirection = 'forward' |
'backward'` and removed in `finished.then()`. Rules read
`:root[data-vt-direction="forward"] ::view-transition-old(*.vt-x-slide)`.
Set it immediately before starting the transition, never at setup.

### 5. Keyframes and reduced motion come from the shared CSS

Reuse the `vt-*` keyframes in `vt-keyframes.css`; don't redeclare them in
a component. The global reduced-motion rule (`prefers-reduced-motion` and
`:root[data-motion-reduced]`) shortens every view transition to `0.01ms`.
Components that call `startViewTransition` without their own
`matchMedia` check rely on it; that's fine. Components with their own
component-scoped classes may restate it for clarity, as tab-set does.

Everything a component needs at runtime must be in the bundles. Before
g7nl and 4rgo, keyframes and presets lived only in `view-transitions.css`,
and component transitions silently did nothing.

### 6. Durations

Use `--motion-enter-duration` / `--motion-exit-duration` (with fallbacks)
for component animations, or `--view-transition-duration[-fast|-slow]` for
the presets. Keep it under about 400ms.

## Tests

- **Unit (node):** the three fallback branches each call `swap`
  synchronously and return `null` or no transition. See
  `tests/unit/vb-view-transition.test.js` for the fake `document` /
  `matchMedia` shim. A component with its own inline guard needs the same
  three cases.
- **Component (Playwright):** the name and class actually land on the
  element in the built bundle (`tests/components/vt-presets-bundle.spec.js`
  is the template), and the rules it needs exist in
  `/cdn/vanilla-breeze.css`. Test against the built CDN files, not source:
  boot order and bundling are where these bugs have hidden.
- Disable CSS transitions in fixtures (`* { transition: none !important }`)
  when reading computed styles right after a change.
- Wait on `transition.updateCallbackDone` (DOM committed, about 10ms), not
  `finished` (animation done, seconds).

## Browser support

The canonical table is on `/docs/attributes/view-transitions/#browser-support`.
Same-document transitions, including `view-transition-class`, are Baseline
since Firefox 144 (October 2025). Cross-document transitions aren't in
Firefox yet. Update the site table, not copies of it.
