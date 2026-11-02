# Changelog

All notable changes to Vanilla Breeze will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Stop buttons and history for the AI components.** `<ai-chat>` and
  `<ai-summary>` show a Stop button while a reply streams (plus a public
  `stop()`); endpoint mode sends prior turns as `messages[]`
  (ai-page-tools v1.1 — servers that ignore it still work); the
  `{content}` fallback-URL token is filled (capped at 1,500 characters;
  `<ai-chat>` uses only its `context` region); `format="plain-text"`
  renders as text; `<ai-summary>` warns when input exceeds the on-device
  quota.
- **`heading` and `heading-level` on `<analytics-panel>` and
  `<author-index>`.** `<analytics-panel title>` is renamed `heading` (the
  global `title` put a tooltip on the whole panel).
- **`<activity-feed>` load-more contract.** `load-more` carries
  `detail.done()`, the feed is `aria-busy` while loading, and removing
  `data-infinite` ends it. Authored `<time datetime>` works as the
  timestamp without JavaScript.

- **`Analytics.getStatus()`** — a read-only snapshot of the analytics
  runtime: whether it is running, why it is off (user, GPC, DNT, consent),
  the fields an event carries, and per-page send counts. A
  `vb:analytics-status` event fires when it changes.
- **`<markdown-viewer sanitize>`** — parsed markdown now goes through the
  shared sanitizer by default; `sanitize="off"` opts out for trusted
  content.

- **`data-accent` for colour accents.** Accent presets (ocean, forest,
  sunset, …) were inline seeds ThemeManager wrote on `<html>`, and the
  themes page's `data-theme="forest"` examples did nothing. `data-accent`
  now applies them on `<html>` or any element, as a separate axis from
  `data-theme`: accents tint the default and personality themes (modern,
  minimal, classic); fixed-palette themes keep their colours.
  `ThemeManager.setAccent()` sets the attribute. The CSS is generated from
  `src/lib/theme-data.js` (`scripts/generate-accent-css.mjs`).

- **`VB.store` and `VB.service` are public.** The storage and fetch layers
  VB's components already used are now on `window.VB` and exported by name
  from the main, core and autoload bundles (`import { VBStore, VBService,
  VBServiceError } from 'vanilla-breeze/js'`). `VB.service.configure({
  baseUrl })` points every `/go/` role (notify, email, newsletter) at your
  own backend; `VB.store.clearAll()` clears every `vb:*` key. Their state
  is shared across bundles, so configuration reaches autoloaded components
  too. Documented at `/docs/concepts/vb-service/` and
  `/docs/concepts/vb-store/`.

### Changed

- **`<analytics-panel>` rebuilt on the runtime's real state.** It used to
  read storage keys nothing writes, so it always said "No data stored"
  while page views were being sent, and it reported "active" to visitors
  whose Global Privacy Control or Do Not Track kept analytics off. It now
  shows what is actually sent and why analytics is off, Pause/Resume go
  through `setConsent()`, "Clear my data" is gone (there was nothing local
  to clear), it renders once and keeps focus, and it uses VB tokens, so it
  is readable in dark mode. The unused `--font-size-0`/`--font-size-1`
  Open Props aliases are removed.

- **Legacy link and abbr classes removed.** `a.muted`, `a.plain` and
  `a.external` are gone (use `data-variant="muted"` / `"plain"` and
  `rel="external"`), and `abbr.plain` is now `abbr[data-variant="plain"]`,
  matching the link API.

- **`vanilla-breeze-autoload.js` ships in the npm package.** The
  autoloader was documented as a loading strategy but excluded from the
  package. It finds its `components/` chunks next to its own script, so it
  works from unpkg.

- **Buttons follow the theme's hover and active colours.** Themes set
  `--color-primary-hover` / `--color-primary-active`, but `button`
  computed its own states, so those overrides never showed. A button with
  no custom colour now uses `--color-interactive-hover` and the new
  `--color-interactive-active` (both follow primary); a button with
  `--btn-color` still derives its own states.
- **`nav.pills` and `nav.pagination` pick readable text for the current
  item** with `contrast-color()` instead of a fixed white, which failed in
  dark themes that lighten their primary colour. The current-page tokens
  (`--color-active-text`, `--color-active-bg`) are now documented on the
  nav page.

### Fixed

- **A-element review, batch 5.**
  - `<audio-player>`: the seek slider announces "0:13 of 0:30", mute
    reports `aria-pressed`, load errors show a message, shuffle plays each
    track once per cycle, scrubbing no longer jumps, and the player and the
    `.audio-standalone` utility share one track helper (both auto-advance).
  - `<audio-visualizer>`: caches its canvas and colours instead of doing
    the work every frame, draws a baseline instead of a blank box (and a
    single frame under reduced motion), and follows `for`/`data-mode`
    changes.
  - `<activity-feed>`: follows the APG feed pattern (Page keys move one
    article; feed children are all articles; `aria-setsize` is -1 while
    infinite), and avatars render (they never did).
  - `<author-index>`: a failed fetch keeps the filter on authored markup,
    ids are unique for any script, unsafe hrefs are dropped, result counts
    are announced, and moving it doesn't refetch.
  - Article highlights: every article paints its own palette (only the
    first did), two articles sharing a colour no longer overwrite each
    other, and custom colours work in the `<mark>` fallback.
  - `<comment-thread>` avatars render.
  - `<area>` focus uses the theme's interactive colour.

- **`<ai-summary>` XSS.** Model or endpoint output rendered through
  `<markdown-viewer>` was inserted as raw HTML; it is now sanitized.
- **`<activity-feed>` froze grouped feeds.** Any child change on a
  `data-group` feed started an endless regroup loop. Moving the feed no
  longer stacks infinite-scroll sentinels, and keyboard navigation now
  works (a single Tab stop with a roving tabindex; keys work from links
  inside an entry).
- **`<audio-player>` keyboard.** Shortcuts were bound on the host and
  could not see past the shadow boundary, so arrow keys on the volume
  slider seeked the track and Space on the playlist started playback.
  Focused controls now keep their own keys. `loop` now loops a single
  track.
- **`<audio-visualizer>`** restarts after a DOM move, no longer silences
  cross-origin audio (it skips hooking and sets `data-state`), no longer
  doubles the volume when two visualizers share an `<audio>`, and clamps
  bad `data-fft-size` values instead of throwing.
- **`<ai-chat>` / `<ai-summary>`** no longer duplicate their UI when
  moved; `<ai-chat>` ignores a send while a reply is streaming (Escape to
  stop keeps working), and streaming output is `aria-busy`.
- **`<accordion-wc>` `panels` setter** bound listeners twice when assigned
  before connection (with `transition`, a click never opened the panel)
  and dropped `data-upgraded` when assigned later. A lone `<p>` or `<ul>`
  answer is now wrapped instead of being turned into `role="region"`.

- **Link auto-icons.** A `download` link to a PDF shows the download
  arrow instead of the PDF badge; links in `nav`, `header` and `footer` and
  button-styled links suppress every auto-icon (some slipped through
  before); an authored `<icon-wc>` replaces the auto glyph instead of
  doubling it; the glyphs carry empty alternative text, so screen readers
  read only the link text. `<abbr>` gets the dotted underline and help
  cursor only when it has a `title`.
- **A-element doc pages corrected** after a quality review: `article`
  highlights (the toolbar is `<selection-menu>`; no `initHighlights`
  export; real colour defaults and events), `article.compact` no longer
  collapses its text column, `data-drop-cap` no longer applies twice,
  `address.inline` sample is valid HTML and `.compact` separators are
  CSS-generated and silent, `aside.float` un-floats below 40rem, wrong
  landmark/screen-reader claims fixed on `article`, `aside` and `address`,
  `area` (`shape` is optional; coordinates; document order), `audio`
  captions, the accordion custom-indicator escapes and `flush` wording,
  the author-index JSON sample, and stray parsed placeholders on the AI
  component pages.

- **Theme text contrast on real pages.** A new themed site-pages suite
  (5 doc pages × 10 aggressive themes × light/dark, with an AA check on
  every text node) found 37 failures; all are fixed. Kawaii dark inline
  code was 1.6:1 (the kawaii pack hardcoded the light-mode colour);
  brutalist light code inside `<pre>` sat on the inline-code chip (2.4:1)
  and its links deepen a step; vaporwave light links and code use a
  deeper `--color-interactive`; win9x dark links, muted text and the
  active nav link are lighter on the dark window.
- **win9x puts page content in a window.** Text sat directly on the teal
  desktop (body ~3:1, links and muted text under 2:1); `main` now has the
  window surface, framed by the teal desktop.

- **Themes no longer frame every form and blockquote.** Under the ~28
  themes that set a border style (swiss, genai, kawaii, organic, …),
  `data-border-style` auto-applied a full border to bare `form` and
  `blockquote` with no padding, so controls and quote text touched the
  frame. Those rules were inert until 0.4.0 moved them out of the tokens
  layer. Auto-apply now targets padded containers only (`.card`, the
  preview panels).

- **`tab-set` panels span the full width.** The open panel sat in the
  first tab's column, which stretched that tab across the component and
  pushed the others to the far edge (off-screen on phones). Chromium and
  Safari wrap `<details>` content in a `::details-content` box that became
  the grid item; tab-set now flattens it and gives the grid one explicit
  column per tab.

- **`data-page-layout="sidebar-right"` stacks on phones.** The mobile stack
  template had no `body-aside` area, so the aside got an implicit column
  beside the stack and overflowed the viewport.

- **Print styles and two themes match the current effect syntax.** They
  still targeted `[data-gradient-text]`, `[data-shimmer]` and friends,
  which became `data-effect` tokens.

- **Component transitions animate again.** `tab-set`, `accordion-wc` and
  `carousel-wc` animate their `transition` modes with `vt-*`
  keyframes that only existed in the opt-in `utils/view-transitions.css`,
  which neither bundle imports, so the transitions silently did nothing.
  The keyframes now ship in `vanilla-breeze.css` and
  `vanilla-breeze-core.css`; cross-document `@view-transition` stays
  opt-in.

- **`data-transition` presets animate.** `slide`, `fade`, `scale` and
  `none` played the browser's plain crossfade, for two reasons: the
  runtime processed elements before the presets registered, so they never
  got their `view-transition-class`, and the rules for those classes lived
  only in the opt-in `utils/view-transitions.css`. Late registrations now
  re-wire waiting elements, like effects and triggers. The class rules,
  the `--view-transition-duration` tokens and the reduced-motion rule now
  ship in every bundle, so content-swap, image-gallery and
  version-switcher transitions also respect reduced motion.

- **`combo-box` exposes one combobox, the W3C way.** The `combobox` role
  went through `ElementInternals`, which put it on the host in Chromium
  while `aria-expanded`, `aria-controls` and `aria-activedescendant` sat on
  the inner input (Firefox put everything on the input). The role is now a
  plain `role="combobox"` on the input in every browser, as the docs
  already described.

- **`data-effect="stamp"` is visible on dark surfaces.** It blended with
  `multiply` and dark ink, which nearly vanished on dark backgrounds. On
  dark surfaces (nearest `data-mode="dark"`, or the system preference) it
  now uses `screen` with lighter ink; `--vb-stamp-blend` overrides it for
  custom stages.

## [0.4.1] - 2026-10-31

Patch release: the package no longer drags in a runtime dependency, and the
npm listing gains an author and keywords.

### Fixed

- **No runtime dependencies.** `codex-claude-bridge` (the Codex review
  tooling) had sat in `dependencies` since 0.1.3, so every install of
  vanilla-breeze pulled 138 packages it never used. It is a devDependency
  now and a unit gate keeps `dependencies` empty.

## [0.4.0] - 2026-10-31

First release since 0.3.1 and breaking in aggregate: themes self-declare the
`bundle-theme` cascade layer and the charts add-on is layered, every layout
lives once as `:is(layout-x, [data-layout="x"])`, the size scale is spelled
`s/m/l` everywhere with no aliases, 76 dead tokens are gone, and the tokens
layer holds custom properties only. Also in this release: generated and gated
api.json manifests for all 14 layouts, a vendored `marked`, local placeholder
images, a page-pinned `data-theme` that survives saved preferences, and the
effects runtime fix for scroll-triggered effects. Details below.

### Changed (breaking)

- **The charts add-on is layered.** `vanilla-breeze-charts.css` now lands in
  `@layer web-components` like any bundled component, below utils, themes
  and your own CSS; it used to be unlayered and outranked everything. The
  file carries the layer-order prefix so it is order-safe in `<head>`.
  chart-wc's hidden-table overrides lock the properties the
  `.visually-hidden` utility sets. Visible effect: an author rule such as
  `.tall-spark { block-size: 120px }` on a sparkline now applies.

- **One scale spelling: `s` / `m` / `l` everywhere** (j1hi). `--font-size-sm/md/lg`
  are now `--font-size-s/m/l`, `--shadow-sm/md/lg` are `--shadow-s/m/l`, and
  the breakpoint references `--bp-sm/md/lg` are `--bp-s/m/l`, matching
  `--size-*` and `--radius-*`. No aliases: the two-letter names are gone.
  Every usage in the framework, themes, packs, demos and docs was renamed
  by codemod; downstream consumers rename the same three families.
- **72 dead core tokens removed** (p0wn): the Open Props numeric aliases
  (`--size-1..10`, `--gray-0..9`, `--radius-1..6`, `--shadow-1/3..6`,
  `--font-size-00/2..8`, `--ease-1/2/4/5`), the unused easings
  (`--ease-in-*`, `--ease-out-*`, `--ease-squish-*`), the colour harmonics
  (`--color-complement`, `--color-triad-*`, `--color-analog-*`), the
  surface gradient/texture tokens nothing rendered, `--cursor-grab/grabbing`,
  `--font-weight-light/range`, `--filter-rough-heavy`, `--opacity-60`,
  `--prose-font-size`, `--page-bg-overlay`, the animated-border duration
  tokens, and `--color-secondary-active` / `--color-accent-active`. Nothing
  in the framework, demos, docs, themes or packs read any of them. A gate
  (`tests/unit/token-usage.test.js`) rejects new unread tokens; 28 tokens
  that themes set or the docs list but nothing reads are tracked there for
  a wire-or-prune decision.
- **Layout attribute API made consistent** (vqw8):
  - One gap scale everywhere: `none`, `3xs` … `3xl` on every gap-bearing
    layout (cluster, grid, cover, sidebar, switcher, reel, split, media,
    page-layout, body regions). Previously each layout accepted a random
    subset.
  - One sidebar width: `--sidebar-width` defaults to `16rem` and
    `data-layout-sidebar-width` is `12 / 16 / 20rem` in every context
    (layout-sidebar and page-layout `normal` were 15rem, grid identity 280px,
    the page templates 250px).
  - One max-width keyword set: `narrow | normal | wide | prose` on
    layout-center, layout-card and canvas, mapped to `--content-*` tokens.
    `content` is gone (card's read a token that never existed; card `wide`
    was 90rem, now the shared 80rem).
  - Prefix rule: flow primitives use `data-layout-*`; surfaces use bare
    `data-*`. Canvas moves from `data-layout-max` / `data-layout-padding` to
    `data-max` / `data-padding` to match card and badge.
  - `data-layout-min` stays on both grid (column minimum) and cover (block
    minimum), as the vocabulary spec already defines: the minimum on that
    layout's principal axis.
- **Layout element and attribute forms now share one rule set.** Eight
  layouts existed twice, as `layout-x/styles.css` and as a `[data-layout="x"]`
  block in `layout-attributes.css`, and the copies had drifted. Each now lives
  once, selected via `:is(layout-x, [data-layout="x"])`. Where the forks
  disagreed, the better behaviour wins on both sides:
  - `layout-cover` defaults to `100dvh` (was `100vh`) and auto-centers a sole
    child; `layout-center` honours the documented `data-layout-max="prose"`
    (65ch; the element form silently fell back to `normal`) and its
    `[data-layout-gap]` flex-collapse guard now fills the parent exactly
    (the attribute form's `inline-size: 100%` overflowed by the padding);
    `layout-cluster` accepts `data-layout-gap="none"`
    and `"2xl"`; `layout-sidebar` is now semantic-aware like the attribute
    form (`nav`/`aside` are the sidebar, `data-layout-side="end"` keeps DOM
    order via `order`; position-based fallback when no `nav`/`aside` child);
    the attribute forms lose their blanket container-query fallbacks
    (`grid` to one column under 400px, `switcher` stacking under 30rem):
    auto-fit and the threshold formula already do that job, and the
    fallbacks overrode `data-layout-min="xs|s"` and
    `data-layout-threshold="s"` inside any section on a phone.
  - **Typographic containers share one core** (`layout-text/styles.css`):
    `layout-text`, `layout-columns`, `[data-layout="columns"]` and
    `[data-layout="prose"]` all get the same measure variants
    (`data-layout-measure` or `data-layout-max`: narrow/normal/wide, mapped
    to `--measure-*`), vertical rhythm, `data-layout-centered`, the
    `[data-bleed]` breakout and the narrow-container width release. Notable
    shifts: `data-layout="prose"` gains rhythm; `layout-columns` line-height
    moves from `--line-height-relaxed` (1.625) to `--prose-line-height`
    (1.6); `article[data-measure="narrow"]` is `--measure-narrow` (45ch),
    was 55ch.
  - Selector specificity for the element forms rises from (0,0,1) to
    (0,1,0), matching the attribute forms. Author rules that relied on
    out-specifying `layout-x {}` with a bare element selector will need the
    attribute form's specificity; layered author CSS is unaffected.

- **Themes now live in the `bundle-theme` cascade layer.** Every file in
  `src/tokens/themes/` wraps its rules in `@layer bundle-theme { }`, and the
  entries import the bundled themes directly instead of through the tokens
  barrel. Before, the bundled themes sat in the lowest layer (`tokens`) and
  the standalone CDN theme files were unlayered, so a linked theme beat every
  framework layer, packs included, and beat your own unlayered CSS.
  - **What changes for you:** unlayered author CSS now overrides theme rules,
    as it already did for every other part of the framework. Packs
    (`bundle-effects`, `bundle-components`) now sit above themes as
    documented. A theme's element rules now beat `native-elements` without
    `!important`.
  - The CDN build prefixes each standalone theme file with the layer-order
    statement from `main.css`, so a theme `<link>` placed before the bundle
    still slots in correctly.
  - `_access-dyslexia` dropped its three `!important` declarations; the layer
    now does that job.

### Added

- **api.json manifests for all 14 layout elements**, generated from and
  gated against the CSS (`tests/unit/layout-manifests.test.js`). The
  html-validate registry previously carried layout manifests with attribute
  names the CSS never read (`data-gap` for `data-layout-gap`), so it now
  validates the real layout API — which immediately caught `layout-imposter`
  demos using `data-position` / `data-margin` (the CSS reads
  `data-layout-position` / `data-layout-margin`; 42 sites migrated) and two
  badges using `data-variant` for a color. Every layout element's doc page
  attribute table is regenerated from its manifest.

### Fixed

- **Two dead `exports` entries removed.** `vanilla-breeze/ux-planning-css`
  and `vanilla-breeze/ux-planning-js` pointed at pack files the Workstream D
  removal deleted before 0.3.1 shipped, so importing them failed to resolve.
  A unit gate now checks that every `exports` target exists in `dist/`.

- **markdown-viewer and markdown-editor are in the full barrel; `marked` is
  vendored** (kdkb). Both imported `marked` by bare specifier, which esbuild
  resolves but a browser cannot, so they were kept out of
  `src/web-components/index.js` (one unresolvable import kills the whole raw
  `/src/main.js` graph in dev). `marked` now lives in `src/vendor/marked/`
  as a verbatim copy of the installed package, imported by relative path;
  `npm run vendor:marked` refreshes it and a unit gate fails on drift. The
  eleven demos that carried an esm.sh import map for `marked` no longer hit
  the network, and the barrel parity test has no exemptions left.

- **Scroll-triggered effects and self-wrapping effects work again on every
  page** (t5r2). Since the effects runtime began booting its own observer
  (6xxy), it processed elements while `vb.js` evaluated — before
  `vb-triggers.js` and the effect modules had registered. Every
  `data-trigger="scroll"` element sat at opacity 0 forever (the slide-in
  demo, the effects kitchen-sink hero), and `animate-image` lost its
  play/pause control because the observer treated the effect wrapping its
  own image as a removal and unwrapped it. `VB.trigger()` now wires
  already-processed elements, `VB.effect()` activates an element that
  activated before the effect existed, and a node that is still connected
  after a mutation batch is a move, not a removal.

- **A page-pinned `<html data-theme>` is now that page's default** (psme).
  ThemeManager used to replace it on load in two cases: any saved
  preference, even a light/dark toggle or a `default` picked on another
  page of the same origin, resolved the brand to `default`; and a brand VB
  has no CSS file for (a site's own theme) failed to load and was reset to
  `default` on every first visit. Now only a saved preference naming a
  different, explicit brand replaces the pin, a pinned brand that fails to
  load is kept (the page supplies its CSS), cross-document sync applies the
  same precedence, and `reset()` returns to the pin.

- **Demos and docs no longer hot-link picsum.photos** (uz4f). 145 image
  references across 27 demos, 5 docs pages and image-gallery's static
  example pointed at picsum, so every page load fetched random third-party
  photos and screenshots were never reproducible. They now use deterministic
  local SVG placeholders under `src/assets/placeholders/`, generated from a
  manifest by `scripts/generate-placeholders.mjs` and served at the same
  `/src/assets/…` path in dev and on the built site. The visual suite's
  picsum interception shim is gone. `data-mock="photo"` and
  `mock.imageUrl()` still name picsum as their documented opt-in service.

- 30 media containers in demos and docs used `data-layout-ratio` on
  `[data-media]`, which reads `data-ratio`; the aspect ratio never applied.
  Found by the per-layout conformance check below.

- **The tokens layer holds custom properties only** (dtw6). Backdrop's
  application rules (body padding, region elevation, chrome modes, the
  mobile flush breakpoint), the `[data-scrollbar]`, `[data-border-style]`
  and `[data-spotlight]` rules, the OpenType utility classes and the
  external-component token bridge all lived in `@layer tokens` — the lowest
  layer — where any component rule beat them. They now live in
  `src/utils/` in `@layer utils`; their custom properties stay in
  `src/tokens/`. Visible effect: with `data-backdrop`, regions are centered
  to the canvas width and separated by the canvas gap as documented. A gate
  in bundle-parity keeps selector rules out of the tokens graph
  (`color-scheme`, `interpolate-size` and the root token transition are the
  documented exceptions).

- **Theme cursors now apply to every control** (vjpn). The reset wires
  `cursor: var(--cursor-custom-pointer)` so a theme can ship its own
  pointer, but 169 component rules hardcoded `cursor: pointer` in higher
  layers, so the theme cursor only ever reached bare links. Every one now
  reads `var(--cursor-custom-pointer, pointer)`; a gate keeps it that way.
  Also: backdrop's mobile breakpoint moves from 640px to the contract's
  `--bp-sm` (37.5rem / 600px), and heading weights use the
  `--font-weight-*` tokens.

- **Effects activate on elements added after load on core-only pages**
  (6xxy). `VB.observe()` was only called from the full and autoload entries;
  the production docs load the core entry, so a `data-effect` element
  inserted later never activated. The runtime now boots its own observer
  once the DOM is ready, and is one instance per document, so a page that
  loads both extras and the effects pack (five shared effect modules) no
  longer gets two registries and two observers.

### Removed

- **`data-layout="body-*"` page templates** (tfcw). They were a
  line-for-line legacy copy of `data-page-layout` and used by one demo;
  use `data-page-layout="stack | sidebar-left | sidebar-right | holy-grail |
  app-shell | dashboard | article | landing"`. The page regions keep their
  named containers (`region-main` / `region-nav` / `region-aside`) under
  `data-page-layout`. The dormant `main[data-layout] > *` and
  `article[data-layout] > *` grid-area rules, which fired for every
  layout value and named areas no template defined, are scoped to the
  `main[data-layout="sidebar-*"]` templates that use them.

- `layout-cover`'s `data-hero-overlay` and `data-layout-nospace` (zero
  usages; `data-layout-padding="none"` is the latter). `src/charts/index.css`
  and `markdown-viewer/vb-extensions.js`, both imported by nothing (822u).

### Internal

- The demos visual suite pins the clock to 2026-07-06 so calendars and
  anything rendering "today" stop drifting from their baselines monthly.
  17 stale desktop baselines triaged: 3 were the regressions above (they
  match their July baselines again), 1 was the clock, 13 are intended drift
  (16rem sidebar, the s/m/l rename making demo-CSS token references
  resolve, the border-style system reaching `form`, the 120px sparkline,
  the sidebar merge, semantic-HTML rewrites) and were refreshed. The mobile
  project, not run since July, had 12 stale baselines of the same kinds
  (mostly horizontal overflow that no longer happens); refreshed. Two demos
  join the skip list: `effects-kitchen-sink` (live scramble effect, never
  stable) and `markdown-viewer-mermaid` (loads Mermaid and D3 from esm.sh
  at runtime).

- **Per-theme visual regression is back** (iwuq): `tests/visual/theme-surfaces.spec.js`
  screenshots a purpose-built surfaces page (`demos/examples/demos/theme-surfaces.html`:
  typography, actions, forms, cards, table, details) under all 48 CDN
  themes plus the bundled seven, in light and dark, and the form-validation
  demo per theme — replacing the theme-lab coverage lost in the pack
  decomposition. Desktop only.
- The CI quality gate now runs `validate:api` and `check:api-drift`; the
  registry that lint:html validates against is generated from the manifests.
- Width media queries in `src/` use the breakpoint contract (`--bp-s/l`)
  and a gate rejects px widths (s3hy). Four documented-but-wired-to-nothing
  extension tokens removed: `--motion-hover-glow`, `--border-roughness`,
  `--gradient-subtle`, `--page-bg-type` (z1im); the remaining unread tokens
  are categorised in the token gate, and the seed-derived state colours
  themes override but components never read are tracked as o4tj.
- The native-elements layer contract now admits element-scoped semantic
  modifier classes (`p.lead`, `section.hero`, `article.card`) and classes
  the framework's own init modules write, instead of claiming "no classes"
  while defining 147 of them (hl9c). Seven classes nothing used were
  removed (`.hn-action-remove`, `.hn-swatch`, `fieldset.code-inputs`,
  `img.ratio-landscape`, `.changelog-year/-month`, `video.ultrawide`); the
  hex fallbacks inside `var()` and the Tailwind-palette highlight colours
  are gone (tokens are always loaded; the highlight colours are oklch); a
  gate (`tests/unit/native-element-classes.test.js`) rejects dead classes.
- youtube-player and social-embed no longer wrap themselves in
  `@layer web-components` (the entry owns the layer; they nested as
  `web-components.web-components`) (7371).
- Per-component autoload chunks stay self-contained: code splitting was
  measured (1.3 MB → 775 KB raw across all chunks) and rejected because a
  single component file is a documented cherry-pick contract (6xxy).
- **The web-components CSS barrels are pure import manifests** (jhku).
  `index.css` and `core.css` carried 1477 and 650 lines of inline rules,
  hand-copied between them; 96 of core's 103 rules were verbatim copies and
  the rest had drifted (core's `data-copy` selector still named components
  moved to packs in 0.3.0; its gradient-text and shimmer rules predated the
  composable animation slots). The rules live once under
  `src/web-components/_shared/` (data utilities, form enhancements, effects,
  math) and geo-map's no-JS fallback in `geo-map/styles.css`; core imports
  the core subset. Core therefore adopts the slot design for gradient-text
  and shimmer, and both bundles now clear those effects' decoration slot
  under reduced motion (only core did before). A gate rejects inline rules
  in either barrel.
- Stale headers corrected: the core and extras JS barrels state their real
  counts (29 + 27 and 29 + 9 modules); `pointer.css` no longer re-sets
  `--size-touch-min` under `(pointer: coarse)` to the value sizing.css
  already sets; the CDN build comment no longer claims the slim bundle has
  no themes (822u).
- `layout-attributes.css` is layout again (tfcw, 1294 → 760 lines):
  density modes moved to `src/utils/density.css`, the scroll-driven header
  shrink / `data-animate` reveals / `data-parallax` to
  `src/utils/scroll-driven.css`, and the canvas surface into
  `layout-canvas/styles.css`. `<layout-badge>` keeps its tag; it is
  documented as a surface element rather than a layout primitive.
- `vb/layout-attr-value` now validates each `data-layout-*` value against
  the vocabulary of the element's own layout (resolved from `<layout-x>`,
  `data-layout="x"` or `data-page-layout`), instead of the union across all
  layouts — `data-layout-min="auto"` on a grid is now caught. Child
  attributes and elements naming no layout fall back to the merged check.
- Conformance guards that tested a whole line now judge the tag they
  examine: a styled element sharing a line with a `<link>`, a state class
  beside an `<output>`, or a second `<svg>` on a line are no longer exempt.
- `check:api-drift` no longer claims tab-set manages `aria-selected`; it
  manages `aria-expanded` on its summaries by design.
- `context-menu` and `drop-down` reset themed button styling on their items
  through their own stylesheets (`!important` in the component layer) instead
  of inline styles written by JavaScript. The nav active-item `!important`
  rules stay, with their rationale corrected: themes sit above
  `native-elements` by contract and most of them color bare links.
  `_extreme-neumorphism` dropped an unneeded `!important`.

## [0.3.1] - 2026-07-07

### Removed

- Purged stale build artifacts left over from the 0.3.0 decomposition: the
  `design-system` + `ux-planning` pack bundles (`dist/cdn/packs/*`) and the
  individual component bundles for the 36 removed components
  (`dist/cdn/components/*`). No `package.json` export referenced them — this
  just trims dead weight from the published tarball.

## [0.3.0] - 2026-07-06

### Changed (breaking)

- **Decomposed the design-system and project-planning packs out of core.** These 36 components now ship as standalone, token-driven packages and were removed from `vanilla-breeze`:
  - **Design system → [`@profpowell/vb-design-system`](https://www.npmjs.com/package/@profpowell/vb-design-system):** accessibility-, breakpoint-, layout-, motion-, spacing-, token-, and type-specimen; color-palette, component-sampler, font-pairer, gradient-builder, palette-generator, semantic-palette; theme-catalog, theme-export, theme-import. (The pack also adds new components with no core equivalent: brand-specimen, icon-set, icon-specimen.)
  - **Project planning → [`@profpowell/vb-project-planning`](https://www.npmjs.com/package/@profpowell/vb-project-planning):** adr-wc, burndown-chart, capacity-plan, empathy-map, gantt-chart, impact-effort, iron-triangle, kanban-board, product-roadmap, quadrant-grid, quality-target, requirement-card, review-surface, risk-register, story-map, traceability-matrix, user-journey, user-persona, user-story, work-item.
  - **Migration:** `npm i @profpowell/vb-design-system` and/or `@profpowell/vb-project-planning`. Both read VB design tokens and adopt the active theme automatically — load them on any page that also loads `vanilla-breeze`.
  - Core primitives the packs build on — `icon-wc`, `brand-mark`, `color-picker`, `drag-surface`, `chart-wc` — **remain in core.** The new terse `[data-icon]` primitive (0.2.0) also stays.

### Internal

- Relocated the DTCG serialize/deserialize/parse modules to `src/lib/dtcg/` and the public token-set catalog to `src/data/theme-catalog/` (they back the core theme/CDN build and were previously co-located with the now-removed theme components).

## [0.2.0] - 2026-07-02

### Added

- **`[data-icon]` icon primitive** — a terse, native way to place a single monochrome icon (`<i data-icon="star">`, or on any element) via a CSS `mask` `::before` plus a tiny core-loaded enhancer, alongside `<icon-wc>`. Ships build-generated per-set no-JS stylesheets and name manifests at `/cdn/icons/<set>.css` and `/cdn/icons/<set>.json`.

### Fixed

- **Site header layout shift** — the site header now reserves its height (`header.site`), so it no longer grows and pushes the page down as chrome components upgrade on first (uncached) load.
- **List flow-spacing in flex/grid layouts** — `li` spacing no longer misfires as a cross-axis offset in flex-row or grid lists. The base `li + li` rule is now an overridable `:where()` default, and every `[data-layout]` list (which spaces with `gap`) resets it.

## [0.1.0] - 2025

Initial public release.

### Added

- **Tokens** — design tokens for spacing, typography, colors, sizing, borders, shadows, motion, and fluid scaling
- **Native element styles** — layered CSS for `<nav>`, `<table>`, `<form>`, `<aside>`, `<main>`, `<dialog>`, `<details>`, and more
- **Layout system** — `data-layout` attributes (stack, cluster, sidebar, grid) plus `data-page-layout` presets
- **30+ web components** — accordion, carousel, tabs, toast, tooltip, data-table, command-palette, combo-box, drag-surface, emoji-picker, geo-map, and more
- **Theme engine** — 10 brand themes, 18 extreme themes, 4 accessibility themes, dark/light mode
- **Accessibility** — ARIA mapping, reduced-motion support, high-contrast themes, dyslexia-friendly mode
- **Utilities** — copy-to-clipboard, hotkeys, format-number, format-date, spoiler, typewriter, and more
- **i18n** — CSS layer and JS locale utilities
- **Doc site** — Eleventy-powered documentation with interactive demos and examples
