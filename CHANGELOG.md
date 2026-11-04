# Changelog

All notable changes to Vanilla Breeze will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Security

- **M+N-element review.**
  - **sanitize-html** — Fixed a confirmed mutation-XSS bypass: `<math><mtext><table><mglyph><style><img src=x onerror=…>` survived because the cleaned tree was serialised and parsed again, and the second parse turned the `<style>` text into a live `<img>`. This reached every consumer (markdown-viewer, the markdown-editor preview, comment-thread, chat-window, include-file, card-list, glossary-wc, `data-markdown-editable`). New `sanitizeToFragment(html, options)` returns the cleaned DocumentFragment, and every in-repo consumer inserts those nodes without re-parsing. `sanitizeHTML()` still returns a string, but re-sanitizes its own output until stable and returns `''` if the parse keeps mutating. A regression corpus of 35 known mXSS payloads runs in the unit tests (parse5 round trip) and in the browser (real insertion, no handler may fire).
  - **sanitize-html** — `<style>` is removed everywhere, as are the raw-text and legacy elements (`xmp`, `noembed`, `noframes`, `plaintext`, `title` outside SVG), MathML `mglyph`/`malignmark`/`annotation-xml`, elements outside the HTML/SVG/MathML namespaces, and comments. An SVG `<title>`/`<desc>` survives only while it holds plain text.
  - **sanitize-html** — The untrusted (default) profile drops every `style` attribute; drops `form`/`formaction`/`formmethod`/`formtarget`/`formenctype`/`formnovalidate`/`action`/`method`, `popovertarget`/`commandfor`/`command`/`interestfor`, `autofocus` and `ping`; and forces buttons and submit/reset/image inputs to `type="button"`. Against DOM clobbering, `id`/`name` are prefixed with `user-content-` and in-fragment references are rewritten to match (`href="#…"`, `for`, `headers`, `list`, `usemap`, ARIA id refs, SVG `url(#…)`); other id references are dropped. include-file uses a fragment profile (`keepIds`, `keepStyle`) that keeps ids, names, filtered `style` attributes, popover/command invokers and button types. Nested `<markdown-viewer>` also loses `allow-cross-origin`.
  - **markdown-viewer** — `src` is same-origin by default (http(s) only, redirects re-checked); `allow-cross-origin` opts in, as on `<include-file>`.
  - **math-init** — `data-mathml` is no longer an innerHTML gadget. New `sanitizeMathML()` keeps only MathML-namespace elements (no HTML/SVG, `mglyph`, `malignmark`) and strips `on*`, `href`, `src`, `style`, `id`, `name` and `xlink:`/`xml:` attributes; the cleaned nodes are inserted directly, wrapped in `<math>` when there is no root.
  - **nav-bar / notification-wc** — URLs from `.items` (nav-bar) and from feeds, the `.notifications` setter and the watch list (notification-wc) render as links only when they resolve to `http:`/`https:` or are relative; `javascript:` and `data:` URLs are refused (nav-bar renders an anchor with no `href`).
- **I-element review.**
  - **include-file / sanitize-html** — Fixed an XSS chain (vanilla-breeze-9vrm): sanitized content (e.g. markdown rendered by `<markdown-viewer>`) could contain `<include-file src="blob:…">`, and `<include-file>` fetched any URL and inserted it raw, so an `<img onerror>` in the fetched HTML ran. `sanitizeHTML` now neutralises fetch-capable VB elements (`<include-file>` loses `src`/`trusted`/`allow-scripts`/`allow-cross-origin`; `<markdown-viewer>` loses `src`/`sanitize`/`ping`), and `<include-file>` is same-origin and sanitizing by default (below).
  - **sanitize-html** — Hardened denylist: `javascript:`/`vbscript:` detection survives whitespace/control-char obfuscation; `data:` refused on navigation/loader attributes (media `src`/`poster`/`srcset` keep `data:image|audio|video|font`); also removes `frame`/`frameset`/`applet`/`portal`/`fencedframe`/SVG `foreignObject`, href-targeting SVG `animate`/`set`, script-bearing or `@import` `<style>` and `style` attributes; `<template>` contents are sanitized recursively. New `sanitizeSVG(element)` export sanitizes an SVG element in place (used by `<icon-wc>`).

### Added

- **G+H-element review.**
  - **geo-map**
    - On-screen zoom in / zoom out / recenter / exit buttons, two-finger pinch zoom, click-to-centre, Home/0 to recenter, and a polite live region announcing the new centre.
    - `loading="consent"`: no tile request until the user presses "Load map" (placeholder names the tile host).
    - `provider="carto-auto"` follows `data-mode` / `prefers-color-scheme`.
    - Tile templates support `{s}` subdomain rotation and `{r}` retina suffix; every placeholder occurrence is replaced.
    - `data-label-*` overrides for every string; `label` attribute; `data-ready` reflected when tiles load.
- **D-element review.**
  - **drag-surface**: `data-move-controls` renders per-item Move buttons: up/down (left/right for horizontal, RTL-aware) and "Move <item> to <surface>" for adjacent grouped surfaces. This is the single-pointer alternative to dragging (WCAG 2.5.7). The buttons fire the same `reorder`/`transfer` events and keep focus, using `aria-disabled` at the ends of the list. New `disabled` property reflects the attribute.

### Changed

- **Changes from the O-element review.**
  - **ol**
    - Lists that carry long markers get a `2.5em` indent instead of `1.5rem`, so "VIII." or "100." no longer overflows the list edge and gets clipped (most visible in RTL). This covers roman numerals (`type="i"`/`"I"`), any `start`, `reversed`, an `li[value]`, 27+ lettered items and 100+ items. New `--ol-indent` custom property sets the indent explicitly (for CJK counter styles, a large `start`, and so on).
  - **select / optgroup / option (customizable select)**
    - `appearance: base-select` and the picker styling now apply to single-row selects only. A `size` > 1 listbox was getting base-select with the flex trigger layout, which centred its rows in the box and clipped the first options out of scroll reach.
    - Group headings look the same whether they come from the `label` attribute or a `<legend>` (small, muted, uppercase); before, only `<legend>` headings were styled. Grouped options keep full size, case and spacing.
    - Option text uses `--color-text` to match the themed picker surface.
- **Changes from the M+N-element review.**
  - **sanitize-html** — Breaking: sanitized output drops `style` attributes and `<style>`, prefixes `id`/`name` with `user-content-`, removes form-submission and invoker attributes, and makes buttons `type="button"` (see Security).
  - **markdown-viewer**
    - Breaking: `src` on another origin needs `allow-cross-origin`; `blob:`/`data:`/`javascript:` `src` is refused. Use `sanitize="off"` only for trusted first-party markdown.
    - Callout blocks are built in: `:::note|info|tip|warning|danger [title]` … `:::` renders `<aside class="callout" role="note" data-kind>` with a visible title, using a private vendored-`marked` instance. The broken `vb-extensions.js` import and the bare `'marked'` import in the demo are gone.
    - The load-failure message is a real `role="alert"` element whose text comes from `data-label-error` (default "Failed to load markdown"), replacing English CSS `content`. `.md-content` gets `dir="auto"` unless the host sets `dir`.
    - api.json: removed the unimplemented `loading`; added `allow-cross-origin`, `data-label-error`, `data-auto-mermaid` and the `.markdown` property; `sanitize` lists its real values.
  - **include-file** — Breaking: `<style>` elements in non-`trusted` partials are removed. Sanitized fragments use the fragment profile and are inserted as nodes; `include-file:loaded` `detail.html` is the serialised sanitized fragment.
  - **markdown-editor**
    - Breaking: the host `name` attribute is removed. Put `name` (and `required` etc.) on the `<textarea>`, which now submits, validates and resets natively, including without JavaScript. The authored textarea is adopted (moved into the source pane) instead of replaced, keeping `id`/`<label for>`, constraints, `dir`, `form`, `placeholder` and `aria-*`; one is created only when none is authored.
    - Breaking: no default "Write markdown here..." placeholder; host `placeholder`/`rows` override the textarea's own (`rows` default 10).
    - `markdown-editor:change` carries `detail.source` (`"user"` on blur, `"api"` on `.value` assignment) and is always `composed`.
    - The narrow layout follows the editor's own width (intrinsic `auto-fit` grid) instead of a viewport media query. The editor imports `<markdown-viewer>` itself.
    - New `data-label-source`, `data-label-preview`, `data-label-tab-hint`; `data-auto-mermaid` and `rows` documented in api.json; phantom `persist` removed from JSDoc.
  - **mobile-menu**
    - Breaking: `<mobile-menu>` must be a direct child of the `<header>`. Sibling `nav` / `nav-bar` / `site-tools` are hidden by CSS (`header:has(> mobile-menu[data-mobile]) > …`) instead of inline `display: none`, so removing the element or leaving mobile mode always restores the desktop nav.
    - The default 52rem breakpoint also applies as a CSS media query, so the mobile state paints before upgrade and the native popover menu works without JavaScript. `breakpoint` is observed; changing it re-evaluates mobile mode.
    - Docs and api.json describe it as a breakpoint observer with an author-supplied trigger and panel (inside `<mobile-menu>`). The docs no longer claim a focus trap: the popover is non-modal.
  - **nav-bar**
    - Breaking: the host no longer gets `role="navigation"` when it contains a `<nav>`; label the inner `<nav>` instead. The docs site header no longer nests two navigation landmarks.
    - Links match by origin plus normalised pathname against the document base URL: relative hrefs, same-origin absolute URLs, `<base>` and `/docs` vs `/docs/` now match; bare `#fragment` links never match.
    - Re-syncs on the Navigation API `currententrychange` event (new event source `'navigation'`), so `pushState` routers no longer need `refresh()` in supporting browsers. New `data-label-new-tab` overrides the "(opens in new tab)" suffix.
  - **notification-wc**
    - Breaking markup: row content is phrasing-only: `<strong class="notification-title">`, `<span class="notification-text">` and `<time>` inside a `<span class="notification-body">`, replacing `<div>`/`<h4>`/`<p>`. CSS hooks on `.notification-body h4` / `p` must move to the new classes.
    - The All/Watching switcher is a full tabs pattern: a generic tablist (not `<nav>`), tabs with `aria-controls`, lists in `role="tabpanel"` panels, arrow/Home/End keys and a roving tabindex.
    - The minted trigger name includes the unread count ("Notifications, 2 unread") and the badge is `aria-hidden`. Opening the panel moves focus into the dialog; tabbing out of the component closes it.
    - `variant` and `position` react to changes after upgrade. Every English string can be overridden with `data-label-*`; dates use `Intl.DateTimeFormat` in the document language, and date-only values are no longer shifted by the time zone.
    - The `notifications` setter documents the fields that actually render (`date`, `type`, `url`), replacing the old `timestamp`/`variant` fields.
  - **note-wc** — Without `for` and outside `<selection-menu>`, note-wc no longer renders a dead "View notes" button; it only hosts the note panel. Every string can be overridden with `data-label-*`; the panel heading is uppercased by CSS instead of an uppercase literal.
  - **menu**
    - Breaking: `menu.toolbar` no longer forces every button transparent. Non-ghost buttons keep their fill and `aria-pressed="true"` keeps its pressed look; use `.ghost` buttons for the flat toolbar look. A `role="toolbar"` menu needs `<li role="none">` items (documented; the pills demo marks the selected pill with `aria-pressed`).
    - `menu.context` sizes to its content (`inline-size: fit-content`, `min-inline-size: 10rem`) and uses `--shadow-m`.
    - win9x and NES themes: the raised dropdown chrome applies only to pop-up menus (`menu.context`, `drop-down menu`, menu-bar menus), not to every `<menu>`. Items use `text-align: start`.
  - **nav**
    - The current page link in default, `.horizontal`, `.vertical`, `.minimal` and `.bottom` navs is underlined by default as a non-colour cue (WCAG 1.4.1), locked with a layered `!important` like the colour. `.pills`, `.tabs`, `.pagination`, `.tree`, `.breadcrumb` and `<bread-crumb>` turn it off; opt out with `--nav-active-decoration: none`.
    - `nav.breadcrumb` and `<bread-crumb>`: in RTL the default and `chevron` separators become "‹" and `arrow` becomes "←". New token `--sep-breadcrumb-rtl`.
    - Removed the `@media (width < 48rem)` rule hiding `nav drop-down menu`; it never applied and would have stranded mobile users.
  - **main** — `main.narrow` caps at `var(--measure-normal, 65ch)` so it follows the fluid scaling profiles; `.contained` (1200px) and `.wide` (1600px) are documented as fixed caps. The `main.with-sidebar` content column is `minmax(0, 1fr)`, so a wide `<pre>`/table scrolls inside it instead of widening the grid.
  - **map / area** — The `map`/`area` rules (including the `area:focus-visible` ring) moved from `native-elements/iframe/styles.css` to a new `native-elements/map/styles.css`. Same output.
  - **mark** — `.success`, `.warning` and `.error` are documented as highlight categories (for example review annotations), not status badges; status points to `<layout-badge>`. The journal pack maps them to its mint, butter and coral highlighter tints.
  - **math**
    - The core CSS declares a self-hosted Latin Modern Math `@font-face` (woff2, `font-display: swap`, GUST Font License shipped as `cdn/fonts/latinmodern-math-GUST-LICENSE.txt`), fetched only when a page renders math. `cdn/fonts/math-fonts.css` (still injected by `data-math`) points at the same file instead of a jsDelivr OTF.
    - VB no longer colours `mi`/`mn`/`mo`, so `mathcolor` works and math inherits colour. Inline `vertical-align: middle; line-height: 0`, `mo { margin-inline }` and the `0.7em` script size are removed in favour of MathML Core and the font's MATH table. The numbered wrapper is `figure.equation` or `p.equation` (no `div`).
  - **data-math** — Breaking markup: `copyable` renders a real `<button data-math-copy>` (keyboard operable, `:focus-visible`) instead of a click handler on the wrapper. Its text comes from `data-label-copy` (default "Copy LaTeX") and the announcement from `data-label-copied` (default "Copied to clipboard") in a persistent `role="status"` region.
  - **meter** — The track has a 1px `--meter-track-border` edge (`--control-border`, 3.8:1 light / 5.8:1 dark; was about 1:1). New tokens `--meter-track-bg`, `--meter-track-border`, `--meter-fill-optimum`, `--meter-fill-suboptimum`, `--meter-fill-even-less-good`. The light suboptimum fill is darkened to 4.06:1 (was 2.76:1). `.labeled` applies only to `.labeled:has(> meter)`, and its header row is `<header>` or `<label>`.
  - **Docs site** — Every shared layout starts with a "Skip to main content" link to `<main id="main">`; the head include carries the documented `.skip-link` styles.
- **Changes from the K+L-element review.**
  - **layout-badge** — Breaking: `data-size="sm"` / `"lg"` are renamed `data-size="s"` / `"l"` (matching the other elements; no alias). All docs, demos and patterns are updated. The small size uses the type scale with an 11px floor instead of a fixed 10px.
  - **layout-switcher** — Breaking: `data-layout-reverse` now reverses only the stacked order (`flex-wrap: wrap-reverse`), with or without `data-layout-threshold`; the row keeps DOM order. Before, the bare attribute did `row-reverse` and the stack reversed only when a threshold was also set. The bare `data-layout-threshold` form is gone.
  - **layout-columns**
    - Breaking: `data-layout-column-count="2"` / `"3"` are maximums (`columns: 14rem N`) and collapse to fewer columns in narrow containers, down to one on a phone. `auto` no longer waits for a 48rem viewport; it fits columns to the element's own width.
    - `data-layout-measure` / `data-layout-max` work in multi-column modes: counts 2/3 cap each column (block ≤ count × measure + gaps), and `auto` uses the measure as its column width.
    - The theme border reset covers only the flow's own headings and paragraphs (direct children, or children of one wrapping article/section); nested article/nav/details/aside keep their borders.
  - **layout-card** — Breaking: grid mode is now "structured mode", a flex column. The header is pinned to the top, the footer to the bottom, and every other child stacks between them in source order (several content children used to overlap in one grid cell). `slot="header|content|footer"` children alone also turn it on. `container-type: inline-size` applies only in structured mode, so a block-mode card no longer collapses as a content-sized flex/grid item.
  - **data-hotkey (kbd)**
    - Breaking markup: the generated caps are `aria-hidden` and a visually hidden span carries the spoken combo ("Command Shift P", "Control S"). The element no longer gets an `aria-label` (prohibited on `<kbd>`; screen readers read the Mac glyph string).
    - Named keys get short labels and spoken names: `escape`/`esc` → Esc, `arrowup`/`up` → ↑ ("Up arrow"), `pageup`/`pagedown` → PgUp/PgDn; Enter, Tab, Space, Backspace, Del, Ins, Home and End are mapped too (were upper-cased, e.g. "ESCAPE"). `formatHotkey()` shares the map, so `<command-palette>`, `<context-menu>` and `<short-cuts>` badges also show "Esc".
    - The plus key can be written `plus` or `ctrl++`; modifier aliases `option` (alt) and `control` (ctrl) are accepted.
    - `data-label-<key>` on the element or any ancestor (e.g. `<html data-label-ctrl="Strg">`) localises a key's label and spoken name. On Mac the modifier glyphs stay and only the spoken name changes.
    - `data-hotkey-init` holds the rendered combo: re-running is a no-op, and a changed `data-hotkey` rebuilds the caps.
    - In RTL the caps keep left-to-right order (`direction: ltr; unicode-bidi: isolate`).
  - **data-splitter** — Breaking: the utility's event is renamed `split-surface:resize` → `splitter:resize` and no longer fires at init (`<split-surface>` keeps `split-surface:resize`). New `data-label-resize` on the container; the divider gets `aria-controls` (first panel, id generated when missing).
  - **layout primitives (grid, stack, switcher, cluster, cover, center, text, split, regions, media, sidebar, reel, imposter, badge, card)** — Private `--_*` custom properties are reset or re-declared on every host (sidebar, reel, imposter, badge and card props are renamed `--_sidebar-*`, `--_reel-*`, `--_imposter-*`, `--_badge-*`, `--_card-*`), so a nested layout or an ancestor no longer leaks gap, min, threshold, width, padding, position, colours or `data-padding` into it. A `<nav data-layout="cluster">` with no gap attribute now gets the cluster default `s` (it used to pick up nav's internal `xs`).
  - **layout-text / prose / columns** — `[data-bleed]` breaks out to the nearest query container (`100cqi`) instead of the viewport. A text host that is itself a query container stops being one while it holds a bleed child.
  - **layout-reel** — One rule set for `<layout-reel>` and `[data-layout="reel"]` (the attribute form and `<card-list data-layout="reel">` previously had no CSS). Snap is `proximity` instead of `mandatory`. The scrollbar is always shown under forced colours and on touch-only devices. Scroll hints are logical (mirrored in RTL) and, where scroll-driven animations are supported, each edge fades only while there is more content in that direction. Removed `-webkit-overflow-scrolling` and the redundant per-variant `scroll-padding-inline`.
  - **layout-imposter** — Every position uses `inset: 0` + fit-content + auto margins instead of `inset-inline-start: 50%` + a physical translate, so centred/top/bottom are correct in RTL and a centred overlay can use the full container width (was capped at 50%). `data-layout-contain` caps at the containing block (positioned ancestor, or the viewport when fixed). New `--imposter-z` (default 1, `--z-float` when fixed).
  - **layout-canvas** — A 1px border is always reserved: a `--color-border` hairline on plain pages, transparent under `data-backdrop`, `CanvasText` in forced colours. The elevated variant and depth sheets apply only at 37.5rem and up, so element and attribute forms both go flush on mobile. Nested canvases set `--canvas-bg` instead of `background`. The `data-max="narrow"` fallback is 40rem.
  - **label** — Checkbox and radio labels align the control with the first line of text (`align-items: first baseline` plus a small `translate` on the box), so a wrapped label no longer centres the box against the whole block. Switch labels stay centred; segmented and rating labels keep their own alignment (the rule now has single-element specificity).
  - **lists (ul / ol / li)** — `data-marker`, the `.meta` separator and the `.inline` / `.unstyled` item rules target direct `> li` children only, so a nested list keeps its own bullets or numbers (a nested `<ol>` inside `ul[data-marker="check"]` used to lose its ordinals). `data-marker="arrow"` shows a left-pointing glyph (`--marker-arrow-rtl`, U+2B9C) in RTL.
  - **kawaii theme** — List hearts are drawn with `li::marker` instead of `list-style: none` + `::before`. Ordered lists count with the native `list-item` counter, so `<li value>`, `start` and `reversed` are honoured; an `<ol type>` keeps its native marker text. `ul[data-marker]` and lists inside `<nav>` are left alone, and lists that are direct children of `<article>` are now matched.
  - **a11y-dyslexia theme** — The extra `li` margin applies only to plain block-flow lists (`:is(ul, ol):not([class], [data-layout]) > li`), so it no longer doubles the gap in layout-primitive lists or offsets `.inline` / `.meta` items.
- **Changes from the I-element review.**
  - **icon-wc**
    - Filled icon sets (Phosphor, Bold) now render filled: the shadow stylesheet no longer forces `fill: none; stroke: currentColor; stroke-width: 2` over each file's own presentation attributes (stroked sets carry their own stroke attributes).
    - Without a `set` attribute the icon resolves `data-icon-set` from the element, any ancestor, then `<html>` (same as `[data-icon]`), and re-renders when an ancestor's `data-icon-set` or `<html data-icon-path>` changes.
    - New opt-in `data-flip-rtl` mirrors directional glyphs in RTL contexts.
    - api.json: removed phantom `width`/`height`/`role` attributes; `size` is an enum incl. `2xl`; documented `base-path`, `data-flip-rtl`, `data-animate`, `data-error`, `data-upgraded` and the read-only properties.
  - **image-gallery**
    - `.images` string captions now render as text, never HTML; pass a Node, DocumentFragment or `<template>` for rich captions. The getter returns a string for text-only captions and a cloned DocumentFragment for markup captions (was an innerHTML string).
    - Assigning `.images` re-runs the lifecycle (`_reinit`) and closes an open lightbox.
    - Counter reads "Image {n} of {total}" by default (was a bare "{n} of {total}"); all lightbox strings are overridable via `data-label-dialog`, `-close`, `-prev`, `-next`, `-show-details`, `-hide-details`, `-counter`.
    - Close button no longer carries `commandfor`/`command="close"`: the native invoker closed the dialog before the morph transition could snapshot it.
  - **image-map**
    - `image-map:area-activate` is now cancelable (`preventDefault()` stops link navigation) and fires for keyboard activation (Enter/Space) as well as pointer clicks; `area-enter`/`area-leave` also fire on focus/blur.
    - `.regions` round-trips `tooltip`, `disabled` and `content` (string = text, Node/DocumentFragment/`<template>` = rich); `regions-changed` detail carries the normalised regions.
    - Click-mode tooltips are disclosures: the hotspot gets `aria-expanded`/`aria-controls`, keyboard activation moves focus to the first focusable item inside, Escape closes and returns focus. Hover tooltips describe their hotspot via a per-area `aria-describedby` (the `<map-area>` itself) instead of one shared tooltip id; `aria-live` removed.
    - Without JS, `<map-area href>` now shows its label like other areas (docs recommend an authored `<a href>` in the content for no-JS reachability).
    - Host group name fallback is `data-label-map` (default "Image map").
  - **input (native)**
    - Control borders now meet WCAG 1.4.11 (3:1). New base `--control-border: color-mix(in oklab, var(--color-border-strong), var(--color-text) 30%)` (~3.8:1 light, >5:1 dark by default). It also feeds `--input-border`, `--range-track-bg` and the new `--switch-track-bg`, replacing `--color-border` (~1.3:1). Text fields, checkboxes, radios, range tracks, unchecked switches and the data-range track rest colour all get darker borders. Themes that set `--input-border` / `--control-border` themselves are unchanged.
    - Number inputs keep their native spinners. They are hidden only on an upgraded `data-stepper` (`[data-stepper-init]`), so without JS the spinners stay.
    - `type="search"` keeps the native clear (cancel) button. Only the decorative search-results chrome is removed.
    - Readonly text fields (not select, checkbox, radio, range, color or file) get `--input-readonly-bg` and a dashed border (`--input-readonly-border-style`). New tokens.
    - Invalid text fields (`aria-invalid="true"`, `:user-invalid`) get a 4px inline-start border as well as the error colour, so the state does not rely on colour alone.
    - A label that wraps a checkbox or radio is at least 1.5rem tall, giving a 24px pointer target (WCAG 2.5.8).
    - Toggle switch colours are now tokens: `--switch-track-bg`, `--switch-track-checked-bg`, `--switch-knob-bg`. Sizes come from private `--_switch-w` / `--_switch-h`.
    - The range fill stop is `--range-pct` (the property data-range already sets). The dead `--_pct` hook is gone.
  - **img** — `img[loading="lazy"]` no longer gets a `--color-surface-raised` background (it never cleared, leaving grey boxes behind transparent PNG/SVG logos). `.contain`/`.cover` now come after the ratio classes so `class="ratio-square contain"` letterboxes.
  - **picture** — `picture > img` is no longer forced to `inline-size: 100%`; it keeps `max-inline-size: 100%` and is never upscaled past its intrinsic width. Stretch with `picture.full` (or `img.full`). `[data-media] > picture > img` now fills the ratio box (`object-fit: var(--_fit, cover)`).
  - **i / em (italic toggle)** — the "italic inside an italic context goes upright" toggle now only fires in contexts that are actually italic: `cite[data-variant="quoted"]` is no longer a context, and emphasis inside a blockquote attribution (`blockquote > footer`, `blockquote > cite`) or a quoted cite is italic again. Themes with an upright blockquote (brutalist, cyber, super2026, swiss) re-assert italic for emphasis in it; editorial's italic `h1`/`h3` toggle emphasis upright; the dyslexia theme keeps `<i>` italic inside its upright `<em>`.
  - **i (CJK)** — `<i>` in `zh`/`ja`/`ko` text is upright in a calligraphic face (`--font-cjk-alternate`, kai/mincho stack) with a dotted underline instead of an invisible italic.
  - **del / ins** — block-change detection also covers `details`, `nav`, `header`, `footer`, `form`, `fieldset`, `hgroup`, `menu`, `hr`, `address` and `search`.
- **include-file (I-element review).**
  - **include-file** — Breaking: only same-origin http(s) URLs load (resolved against `document.baseURI`); `blob:`/`data:`/`javascript:` and other schemes are always refused, a same-origin URL redirecting off-origin is refused, and other origins need the new `allow-cross-origin` attribute. Fetched HTML is sanitized unless the new `trusted` attribute is set; `allow-scripts` now requires `trusted` (ignored with a warning otherwise). Nested includes in sanitized fragments keep `src` but lose trust attributes.
  - **include-file** — The error message is now a real `<p role="alert">` (text from the new `data-label-error`, default "Failed to load content"), rendered only when no fallback remains, replacing the CSS `::after` text. `aria-busy="true"` is set while loading. `include-file:loaded` detail adds `url` (resolved) and `html` is the markup as inserted.
- **Changes from the G+H-element review.**
  - **ThemeManager** — authored root attributes are page defaults: `<html data-fluid / data-accent / data-border-style / data-icon-set / data-backdrop / data-backdrop-chrome>` are no longer stripped when the visitor has no stored preference (fluid type was off sitewide on the docs). Stored prefs or setter calls override them; `reset()` restores them. Stored-pref schema v2: `null` = page default, `''` = explicitly off (v1 blobs migrate on read). `getState()` reports resolved values (bare `data-fluid` → `'default'`). Now public as `window.VB.themeManager` and the `ThemeManager` export of `vanilla-breeze.js` / `-core.js` / `-autoload.js` (wja7)
  - **ThemeManager** — keeps `<meta name="theme-color">` in sync with the painted page background after every mode/theme/accent change (media pair collapses to one value) (wja7)
  - **a11y-dyslexia theme** — Atkinson Hyperlegible is self-hosted (`/cdn/fonts/`, SIL OFL, Latin + Latin Ext, `local()` first). `vanilla-breeze.css` / `-core.css` no longer `@import` Google Fonts: no third-party request on any default page; fonts download only while the theme renders. CSP needs only `font-src 'self'` (wja7)
  - **Scoped `data-mode`** — `[data-mode="light|dark"]` elements re-derive the colour tokens from their own seeds (one shared token source for `:root` and scoped regions), and scoped `data-mode` / `data-theme` elements paint `background-color: var(--color-background)` + `color: var(--color-text)` at zero specificity. A dark aside on a light page is no longer light text on white; scoped light inside a dark page gets light tokens (wja7)
  - **hgroup**: removed `.reversed` (column-reverse broke reading order) and `hgroup > small` styling (`<small>` is not allowed in hgroup). Put kicker text in a `<p>` before the heading instead.
  - **i18n**: script typography rules are now zero-specificity (`:where(:lang(...))`), so element and component rules win: headings keep their tight leading in CJK pages (CJK headings use `--line-height-snug`), `code` keeps its monospace font, and `header.centered` / `hgroup.centered` stay centred in Arabic-script pages (the redundant `text-align: start` is gone). Korean now uses `word-break: keep-all` instead of `break-all`.
  - **headings**: the ornament tokens now cover h4–h6 too (`--h4-ornament-*` … `--h6-ornament-*`). Set them to plain strings.
  - **themes**: theme `hr` rules now skip `.decorative` and the shape variants (`.wave`, `.zigzag`, `.scallop`, `.diamonds`, `.dots`) as well as `[data-ornament]`. Previously cyber flattened `hr.wave` to 1px and editorial laid its "§" over `.decorative`.
  - **geo-map**
    - Attribution is per provider: OSM shows "© OpenStreetMap contributors"; `carto-*` adds "© CARTO". A `tile-url` source shows no credit unless you set the new `attribution` (+ `attribution-href`) attribute or slot an element with `slot="attribution"`.
    - Accessible name comes from `label`, the slotted `<address>` text, the `src` name or `place` ("Map of …") instead of bare coordinates. The activate button's name is now its visible text (default "Activate interactive map"); the whole map surface is the activation target, and on touch screens the button is always visible.
    - Default pin colour is the theme's `--color-error` via the (now working) `--geo-map-marker-color` property; `marker-color` must be a valid CSS colour (invalid values are ignored) and `.data.markerColor` is `''` when unset.
    - Interactive mode no longer makes the host focusable: the new `viewport` part is a focusable region (`aria-roledescription="map"`, instructions via `aria-describedby`); state is exposed as `.active` / `:state(active)` instead of the host `data-interactive-active` attribute, and `data-has-caption` is gone (internal).
    - Escape in `interactive="eager"` now stays static; eager activation no longer moves focus.
    - Styles are adopted as a constructable stylesheet (no `style-src 'unsafe-inline'` needed); the hover preconnect now only runs before tiles are requested (consent mode).
  - **glossary-wc**: heading comes from `data-title` (+ `data-heading-level`, default 2) instead of `title`, which also produced a hover tooltip and description (breaking; docs/demo/static/README migrated). Jump bar lists only the letters the terms use, from `Intl.Collator` for the element's `lang`: accents fold where the language treats them as variants, Cyrillic/kana etc. by first grapheme, digits/symbols under `#`. Each letter links to the first term with that letter, so per-category `<span>` anchors (duplicate ids, invalid `<dl>` children) are gone. Search sits in a `<search>` landmark. Count badges are `aria-hidden` `<span>`s (were `<output>` live regions read into heading/toggle names). New `data-label-*` strings (`search`, `search-placeholder`, `terms`, `alphabet`, `found-<plural>`, `all-<plural>`, `uncategorized`, `see-also`, `error`) use `Intl.PluralRules`. New `glossary-wc:error` event and `data-state` (`loading`/`ready`/`error`) in src mode. JSON `definition` renders as text; `definitionHtml` is a sanitized opt-in.
  - **glossary-index**: search input wrapped in `<search>` and named by `data-label-filter` (the placeholder was its only label). Without a `<main>` it goes before `.glossary-jump` (after the heading/lead) instead of first. Each `dt[id]` gets a permalink that follows the fragment and copies the term URL (the deep-link copy the JSDoc and /glossary page promised). Filtering announces the match count through a polite status, shows an empty state, `aria-disabled`s jump links to emptied sections, walks dt/dd groups (several dt per dd, several dd per dt, div-wrapped), and fires `glossary-index:filter`. api.json drops the internal `data-glossary-search`/`href` host attributes and documents structure + labels.
  - **heading-links**
    - Generated ids are Unicode-aware: letters in any script keep their diacritics (`Café crème` → `café-crème`, `日本語の見出し` kept), emoji/punctuation dropped, leading/trailing hyphens trimmed; an empty slug (emoji-only) becomes `section` (deduped `section-1`…). Previously non-Latin headings got `id=""` / `href="#"` and were dropped by `<page-toc>`. `scripts/check-links.mjs` mirrors the slug and the `-1`/`-2` dedupe exactly.
    - Heading accessible name is now its text alone (text wrapped in `.heading-text`, heading `aria-labelledby` it); the anchor is named "Copy link to <heading>" via `aria-labelledby`, prefix localisable with `data-label-anchor`. Copy announcement text via `data-label-copied`.
    - Copy feedback is `data-state="copied"` on the anchor (the `.copied` class is gone); the icon swaps by `icon-wc[name]` only.
    - `heading-links:navigate` detail is now `{ id, url, heading }`.
    - Headings inside `<browser-window>` and a nested `<heading-links>` are skipped (in addition to `dialog` / `[data-toc-ignore]`).
    - `levels` is validated (h1–h6 tokens; invalid → default `h2,h3`) and observed.
    - Scroll offset is `scroll-margin-block-start: calc(var(--site-header-height) + var(--size-m))` (was physical `--size-xl`).
  - **highlight-wc** — Documented as a `<selection-menu>` action first; standalone mode is explicitly programmatic (no UI) and gains `highlightSelection(color?)`. `readonly` is honoured inside selection-menu (no highlighter button, target rendered readonly). Stored highlights on a selection-menu's targets now paint on load, not after the first new highlight. `importHighlights()` drops malformed records (shape, out-of-range offsets, colour not in the palette) and returns `{ imported, rejected }`; stored records are validated the same way on load.
  - **highlights (data-highlights)** — Highlight colour tokens are `light-dark()` pairs and highlighted text takes the new `--highlight-ink` (per-colour `--highlight-{name}-ink`); `::highlight` and `<mark>` fallback set text colour, not just background. Engine strings overridable via `data-highlights-label-{annotation,added,removed,note-saved}` (forwarded from `<highlight-wc data-label-*>`).
  - **time-grid**: `sharesHalfHour()` is shared from `src/lib/time-grid.js` (day-view and week-view had copies).
- **Changes from the F-element review.**
  - **form coordinator (`data-validate`)**
    - Native mode submits with `requestSubmit(submitter)` instead of `form.submit()`, so the clicked button's `name`/`value`, `formaction` and `formmethod` apply (and other `submit` listeners see the real submission).
    - `data-submit="fetch"` defaults to POST when the form has no `method` attribute (was always GET via `form.method`); GET builds a query string; the submitter's `formaction`/`formmethod` and `name`/`value` are honoured. `vb:submit`'s FormData includes the submitter.
    - `vb:beforesubmit` detail is now `{ form, submitter }`.
    - Untouched fields are no longer focused and blurred on every submit; `form-field.validate()` shows errors and bare controls get `aria-invalid="true"`.
    - The error summary updates only on submit and then on blur/change when the error set changes (no per-keystroke rewrite of the `role="alert"` region); it gets `hidden` once collapsed. Radio groups appear once, links target the first control (ids generated when missing), checkbox-group entries link their first box, messages match the field's displayed message.
    - Network errors show an authored or generated `[data-form-error]` element (`role="alert"`) instead of CSS `::before` text; fetch success focuses `[data-form-success]` (adds `tabindex="-1"`/`role="status"` if absent); `data-success`/`data-error` are cleared on the next submit.
    - New form-level text overrides: `data-label-summary[-one|-other|…]` (Intl.PluralRules, `{count}`), `data-label-group`, `data-message-min-checked`/`-max-checked` (`{min}`/`{max}`), `data-message-invalid-selection`, `data-message-match`, `data-message-network`. An element with `data-summary-heading` in an authored summary receives the count heading.
  - **data-show-when / data-hide-when** — controls inside a hidden conditional section are now disabled (restored on show; author-disabled controls untouched), so hidden required fields no longer block submit and hidden values are not submitted.
  - **data-loading buttons** — activate only when a submission proceeds (uncancelled native submit, or an uncancelled `vb:beforesubmit`); an invalid submit no longer locks the button for 10 s.
  - **wizard** — the "Step X of Y" counter words come from `--wizard-label-step` / `--wizard-label-of` (localisable); font size uses `--font-size-s`.
  - **form-field**
    - The field now wires ARIA itself: `aria-describedby` lists the hint output(s) and textarea counter, then the error output only while invalid (author ids kept, missing output ids generated); `aria-invalid` mirrors the state (radios in the field, the OTP group, or a custom control's inner combobox/group).
    - Authored text inside `output.error` is now the no-JS message and the JS fallback: the output is emptied on upgrade and filled only when invalid (`data-message-*` and custom-error messages still win).
    - Validation runs when focus leaves the field (not when it moves to the password toggle / OTP boxes / combobox popup) and on the control's `invalid` event; state (`data-invalid`, `aria-invalid`, eager re-validation) survives moving the field.
    - Binds form-associated custom elements (`<date-picker>`, `<star-rating>`, `<combo-box>`) in preference to native inputs inside them, reading their validity/`:invalid` and re-binding if they are defined later. `input` returns that element.
    - `validate({ show })`: `{ show: false }` returns validity without touching the UI.
    - OTP/PIN: the source input is no longer turned into `type="hidden"` — it stays a visually hidden text input that keeps `required` and gets a `\d{length}` pattern, so empty/partial codes block submission. Digits are a `role="group"` named by the label and described by the hints; `autocomplete="one-time-code"` moves to the first box, which also spreads a pasted/autofilled code. `data-enhanced="otp"` is replaced by `data-otp-ready`.
    - Required asterisk only on the field's sole `<label>` or its `<legend>` (no longer on every radio label) and is silent to screen readers (`content: " *" / ""`).
    - Docs: removed `data-type="file"` and `data-required` (never implemented).
  - **fieldset**: the `.minimal` class is now `data-variant="minimal"` (`<fieldset data-variant="minimal">`). The class no longer applies; all docs, demos and patterns were migrated. Extreme themes (neumorphism, win9x) leave minimal fieldsets flat.
  - **fieldset**: a disabled fieldset no longer sets `opacity: 0.5` + `saturate(0.3)` on itself. Its controls already dim (button opacity 0.5), so the old rule compounded to ~0.25. The group now gets muted text and a dashed border (minimal: muted text only), and `GrayText` in forced-colors mode.
  - **form helpers**: `.group`, `.actions`, `.help` and `.error` are scoped instead of global. `.group` applies inside a `form` or on a `fieldset`; `.actions` inside a `form`/`dialog` or on any `footer`; `.help`/`.error` on `p`, `span`, `small`. Specificity unchanged (`:where()`), so components using these class names outside forms (emoji-picker groups, `progress.error`, `mark.error`, site-search) no longer pick them up.
  - **figure**: `<figure data-media>` with a `<figcaption>` no longer hides its caption under the media — the ratio box (`data-ratio`, `data-fit`, `data-radius`) moves to the media child and the caption flows below (or above, when first). Captionless `data-media` containers are unchanged.
  - **figure**: removed the automatic "sticky caption" rule for figures containing a table or pre (it never worked — the figure is not the scroll container).
  - **figure**: direct `svg`, `embed` and `object` children are now block-level and full-width like `img`/`video`/`picture`/`iframe`/`canvas`, matching `data-media`.
  - **figcaption**: caption-first figures put the spacing below the caption; `.bordered` moves its divider below it and `.code` swaps its rounded corners.
  - **figcaption**: `.hidden` now uses the exact `.visually-hidden` declarations (adds `white-space: nowrap`, `margin: -1px`, `padding: 0`, `border: 0`), marked `!important` so `.bordered`/`.code` caption styles can't re-expose it.
  - **footer**: `footer.site` muted, un-underlined link styling is scoped to links inside `nav` and lists; inline links (copyright, credits) keep the underline (WCAG 1.4.1). Hover colour now also applies on `:focus-visible`.
  - **article[data-numbered]**: `.quote` figures are no longer counted as Figures and keep their attribution dash; `.code` figures count only as Listings, so Figure numbers no longer skip.
  - **flow-diagram**
    - **Breaking:** the heading attribute is now `data-title` (was `title`, which also produced a native hover tooltip). JSON `src` payloads keep their `title` key, applied as `data-title`. New `data-heading-level` (1–6, default 2).
    - The rendered diagram is now a `<figure>` named by the heading (or `data-label`) holding a nested list (`ol > li`, decision branches as a labelled sublist, annotations as text) instead of a `role="img"` container that hid all node text from assistive tech. The source `<ol>` is hidden only while upgraded, so nothing is read twice.
    - Nodes are `<button>`s with a spoken type prefix ("Decision: …") and the annotation as description, behind one roving tab stop (arrow keys, Home/End; Enter/Space select). Replaces `tabindex="0"` + `role="img"` on every node.
    - Node and Yes/No colours use theme status tokens (`--color-*-text` / `-subtle`, accent tint) with per-type `--fd-<type>-text|border|bg` hooks: AA text in light and dark schemes (YES was ~2.3:1). Connectors use `--color-text-muted` (3:1+ for graphics).
    - Localizable strings: `data-label`, `data-label-selected`, `data-label-steps-<plural category>` (via `Intl.PluralRules`), `data-label-type-<type>`.
    - `flow-diagram:ready` fires after every render, including each `.steps` assignment (now documented that way). `compact` is CSS-only and no longer triggers a rebuild.
  - **foot-notes**
    - BREAKING: `data-back-label` renamed `data-label-back`; new `data-label-ref` (default "Footnote {n}") and `data-label-heading` (default "Notes"). All `data-label-*`, `data-mode` and new `data-preview` are observed and re-render in place.
    - Footnote content is now *moved* (not copied via innerHTML) into the notes list — no duplicate ids, listeners preserved, no clip-hidden copy left in the paragraph. Reference links are named "Footnote N" with no `aria-describedby`, so notes are read once and the note's links are no longer invisible tab stops.
    - DPUB-ARIA: references `role="doc-noteref"`, backlinks `role="doc-backlink"`, list wrapped in `<section role="doc-endnotes">` labelled by a visually hidden heading (or an authored heading child). Sidenotes keep `role="note"`.
    - Reference `id` now sits on the generated link (`fnref-I-N`), not the `<foot-note>`; the author's `id` on `<foot-note>` is preserved. Bracket characters around the number are CSS-generated.
    - Repeat citations: `<foot-note data-ref="id">` cites an existing note — same number, backlinks lettered a, b, … (`fnref-I-N-b` …).
    - Hover / keyboard-focus preview popover on references (anchor-positioned, inert + aria-hidden, Escape closes, reduced-motion aware); `data-preview="false"` disables.
    - Teardown restores the authored markup; reconnect re-renders in document order (notes inserted meanwhile are numbered in place instead of starting a second list from 1).
  - **fab-stack**
    - Child order is now defined as "first child = primary action, nearest the anchored edge, focused first". `top-*` stacks switch to `flex-direction: column` so the primary sits at the top edge (previously `column-reverse` put it at the bottom, away from the edge); bottom/center stacks keep `column-reverse`.
    - `<dialog>` and `[popover]` children are no longer forced to `position: static; inset: unset; margin: 0` (`fab-stack > :not(dialog, [popover])`), so a modal dialog child centres in the top layer again. `[data-float]` descendants also lose their own `translate`.
  - **back-to-top** — while hidden (`[data-back-to-top-init]:not([data-visible])`) the link is now `visibility: hidden` as well as transparent, so it is out of the tab order and accessibility tree; visibility transitions with the fade. The background/border hover transition, previously overridden by the fade transition, is restored.
  - **VBElement**: form-associated components (star-rating, combo-box, color-picker, calendar-wc, time-picker…) expose the native constraint-validation surface — `validity`, `validationMessage`, `willValidate`, `form`, `checkValidity()`, `reportValidity()` — so `<form-field>` and author code read their validity like a native control.
  - **textarea counter**: unlimited counters take `data-label-characters` / `data-label-words` (with `{count}` and optional plural-category suffixes via `Intl.PluralRules`).
- **Changes from the E-element review.**
  - **em / i**: emphasis inside an italic context (`<blockquote>`, `<cite>`, `<dfn>`, `<var>`, or another `<em>`/`<i>`) now toggles back to upright. Replaces the zero-specificity blockquote de-emphasis rule, which never won (blockquote emphasis rendered italic-on-italic) and also added medium weight. The a11y-dyslexia theme override is unchanged.
  - **em**: in Chinese, Japanese and Korean content (`:lang(zh|ja|ko)`) `<em>` renders emphasis marks instead of an italic CJK fonts don't have — sesame over (ja, ko), filled dot under (zh).
  - **embed / object / iframe**: new `data-ratio` on the element itself (`1:1`, `4:3`, `3:2`, `16:9` default, `21:9`, `2:3`, `3:4`, `9:16`, `page`) — block size follows the used width, a `width` attribute stays the preferred width, no `width` fills the container. `.embed-responsive` now sizes `embed` and `object` children as well as `iframe`.
  - **emoji-picker**
    - Panel is now a top-layer `popover="manual"` positioned below the trigger (start-aligned, RTL-aware), flipped above when there is no room and clamped to the viewport — no longer clipped by overflow containers or dialogs.
    - ARIA restructured: categories are plain buttons in a `role="toolbar"` (roving tabindex, arrow keys, `aria-current` synced to the scrolled group via IntersectionObserver) instead of tabs without panels; the grid is a `role="listbox"` of labelled `role="group"` categories with `role="option"` emoji named by their CLDR name (tooltip shows `:shortcode:`). Exactly one option is tabbable; Tab moves search → toolbar → list and leaving the component closes it (Tab no longer closes from inside the grid).
    - Arrow keys follow the rendered layout (across group headings and Recently used) instead of a flat ±8; Home/End = first/last, PageUp/PageDown = category jumps; Left/Right mirror in RTL.
    - `data-upgraded` is set only once the panel is built (the data loads asynchronously); new `ready` promise. `open()`/`close()`/`toggle()` before that are queued instead of throwing.
    - Grid is built once and filtered with `hidden`; one delegated listener per event type. Glyphs listed under several shortcodes appear once; every shortcode stays searchable.
    - Localizable strings via `data-label-*` (trigger, dialog, search, placeholder, categories, emoji, recent, empty, results with `{count}`, and per-category `data-label-smileys` … `data-label-flags`). The trigger's visible text is kept as its name; `aria-label` is only added to emoji-only triggers.
    - No-JS: the `[data-trigger]` is hidden while the element is undefined (no dead control).
    - api.json trimmed to the public surface (`for`, `recent-limit`, `data-trigger`, `data-label-*`, reflected `open`) with methods, properties and event detail.
  - **emoji-extended / data-emoji** — the extended set now hands over through one shared `Symbol.for('vanilla-breeze.emoji-extended')` registry that every bundled copy of `emoji-data.js` merges lazily (replacing the single-reader `__vbEmojiExtended` / overwritten `__vbEmojiRegister` globals), so `data-emoji` and `<emoji-picker>` both see it in any load order, autoload included. It dispatches `vb:emoji-extended`; already-scanned `data-emoji` containers are rescanned.
  - **package** — `dist/cdn/emoji-extended.js` now ships in the npm package with a `vanilla-breeze/emoji-extended` export (side-effect module).
- **Breaking and behaviour changes from the D-element review.**
  - **diagram-wc**
    - Breaking (security): removed the per-element `data-mermaid-src` override. Only page script can change the Mermaid module URL, via `window.VB_MERMAID_URL`; markup (including sanitized markdown) can no longer choose which module is imported (c4mc).
    - Accessibility: the rendered figure no longer carries `role="img"` with a caption or generic "mermaid diagram" label. The SVG keeps Mermaid's `graphics-document` role so node text stays reachable; its name comes from Mermaid `accTitle` (falls back to `caption`), its description from `accDescr` plus a collapsed "Diagram source" `<details>` linked via `aria-describedby`. Primed figures from `enhanceMermaidFences` get the same treatment (8kf7).
    - Moving the element keeps the rendered figure and the current source (including a JS-set `.source`); `src` is fetched once per URL instead of on every reconnect (egb6).
    - `logic.js` (and so `dist/cdn/components/diagram-wc.js`) re-exports `enhanceMermaidFences`.
  - **date-picker**
    - `aria-selected` moved from the day `<button>` to its gridcell `<td>`; the selected-day style now targets `td[aria-selected="true"] button`.
    - Disabled days use `aria-disabled="true"` only (no native `disabled`), so they stay keyboard-focusable but cannot be selected. Custom CSS targeting `td button[disabled]` should use `td button[aria-disabled="true"]`.
    - The host's internal `data-disabled` state attribute is gone; disabled styling uses `date-picker:disabled` (attribute or disabled `<fieldset>`).
    - A `name` / `disabled` on the inner `<input type="date">` moves to the host on upgrade (no-JS fallback path); exactly one value is submitted.
    - `date-picker:change` detail is now `{ value, date, source }` on every path (typed commits used to omit `source`); `value` is `''` and `date` `null` when cleared. It no longer fires when a typed date equals the current value.
    - Weekday headers come from `Intl` for the nearest `lang` (were hardcoded English two-letter names); new `data-label-toggle|dialog|prev|next|year|placeholder|required|input` attributes translate the remaining UI strings.
  - **data-table**
    - Sortable headers now wrap their content in a native `<button data-sort-button>` inside the `<th>` (APG sortable table); `aria-sort` stays on the th. The th no longer gets `tabindex="0"` / `role="columnheader"`. Enter/Space come from the native button.
    - `data-filterable` / `data-paginate` are documented as `<table>` attributes (they always were read from the table); the host gains `data-label-no-results`.
    - `refresh()` now re-applies rollups and heatmaps, keeps the current page when still valid, and fires `data-table:filter`.
    - Heatmap tints use `--color-error-subtle` / `--color-warning-subtle` / `--color-success-subtle` (light-dark) with `--color-text`, replacing fixed light oklch values.
  - **drag-surface**
    - `aria-grabbed` is gone (deprecated in ARIA 1.1). Grab state is now `data-grabbed` on the item (style hook), a transient `aria-description="Grabbed"` (only if the item has no `aria-description` of its own), and `aria-pressed` on a `<button data-drag-handle>`. Restyle `[aria-grabbed="true"]` selectors to `[data-grabbed]`.
    - The live region is now the surface's next sibling (`[data-drag-surface-live]`, hidden by component CSS) rather than a styled-inline child prepended inside `role="list"`.
    - The base `flex: 1` is removed. A surface in a kanban column only fills it if you set `flex: 1` yourself (the kanban and retro demos now do).
    - Keyboard reorder only responds when focus is on the item or its `data-drag-handle`. Enter/Space/arrows in nested buttons, links and inputs are no longer hijacked.
    - Horizontal surfaces follow the computed `direction`: in RTL `ArrowLeft` moves toward the end, and the drop index and `data-drop-target` indicator use the inline axis. Perpendicular transfer arrows move to the surface physically on that side.
    - Keyboard transfer hands the grab to the target surface. `Escape` then returns the item to where it landed, and the drop reports a real `oldIndex` instead of `null`. Moving focus out of a grabbed item cancels the grab.
    - Ungrouped surfaces only accept drops of their own items. Before, any two ungrouped surfaces accepted each other's items.
    - api.json: `disabled` is `host-api`/`semantic-state`; child attributes moved to `childAttributes`; state attributes are `output-state`; events document `detail`; `properties` lists `sortedOrder`, `draggableChildren`, `group`, `orientation`, `disabled`.
  - **drop-down**
    - `hover` mode is now an APG disclosure navigation instead of a menu: no `role="menu"`/`menuitem`/`aria-haspopup`, links stay in the Tab order, and a `<button data-dropdown-toggle aria-expanded>` is generated next to a link trigger (the link still navigates; touch users can reach the submenu). Opens on mouse hover or toggle click/Enter/Space — focus alone no longer opens it, so tabbing across a navbar stops popping every menu. The toggle draws the chevron; a link trigger's own `::after` chevron is suppressed. (8s1z)
    - `items` setter renders disabled entries as focusable `data-disabled` + `aria-disabled="true"` (buttons too, no longer native `disabled`), and uses `type="button"` for buttons. (8kf7)
    - Keyboard opening (Enter/Space on the trigger) focuses the first item; printable characters typeahead to the next matching item; disabled items stay in the arrow-key order. (qim5)
    - `no-flip` now works: menus flip via `position-try-fallbacks` by default, `no-flip` sets it to `none`. (rb3n)
  - **pop-over**
    - `top-start`/`top-end`/`bottom-start`/`bottom-end` use logical `position-area` values (`self-block-end span-self-inline-end` …) so they mirror in RTL (including `dir` set on a section), and anchored pop-overs get `position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline`. The no-anchor-positioning JS fallback and inset fallback are direction-aware. Affects every pop-over consumer (drop-down, combo-box, version-switcher, tool-tip…). (rb3n)
  - **day-view**
    - Loose `<calendar-event>` children now build a grid without `data-start-hour="auto"`: numeric `data-start-hour` / `data-end-hour` (default 7–19) are honoured, and the range grows to fit events outside it instead of dropping them. Authored `<ol>` grids ignore both. (qim5)
    - `data-date` now names the hour list (`aria-label`, full date) and is passed as `detail.date` in `day-view:event-click`. (qim5)
    - Events get `role="group"` + an accessible name (time + title) unless authored; Enter/Space fire `day-view:event-click`, Home/End jump to first/last; click/keyboard delegation now covers all-day events too. (egb6)
    - Hour rows reset `margin` so the base `li + li` spacing no longer opens 8px gaps between rows (visual change; spans now line up with row edges).
  - **week-view**
    - Enter/Space fire `week-view:event-click`, Home/End jump to first/last event; events get `role="group"` + accessible name; ArrowLeft/Right follow the visual direction in RTL. (egb6)
    - A numeric hour range grows to fit events outside it. The `events` setter formats the time label and derives `date` from a full ISO `time` when `date` is omitted.
  - **datalist**
    - The dropdown arrow now applies only to text-like inputs (`text`, `search`, `url`, `email`, `tel`, `number`, or no `type`). `input[type=range|color|date|time…][list]` are no longer restyled, so the range track and colour swatch render correctly.
    - The arrow and the `.search` icon are drawn with CSS gradients in `currentColor` (no fixed-grey SVG switched by `prefers-color-scheme`), so they follow `data-mode`, themes and forced-colours, and mirror to the left in RTL.
  - **data**
    - `<data>` is no longer monospace by default: it keeps the prose font with `font-variant-numeric: tabular-nums`. Opt into monospace with `data-variant="mono"`.
    - `data-format-number` / `data-format-bytes` no longer copy the original text into `title`; an empty `value` now leaves the text alone (was rendered as "0" / "0 B"); changing the `value` attribute re-formats.
  - **del / ins**
    - `.block` removed: a `<del>`/`<ins>` wrapping block content (p, lists, tables, headings, pre, blockquote…) is styled as a block automatically via `:has()`.
    - New opt-in `data-announce` (on the change or any ancestor) inserts visually hidden "deletion/insertion start/end" text; words are translatable via `--del-announce-start/-end` and `--ins-announce-start/-end`.
    - `data-author` is now also revealed on focus-within and always on touch (hover: none) screens; its fade respects `prefers-reduced-motion`.
  - **dfn / cite**
    - `dfn` keeps the surrounding weight inside `dt`, `th`, headings, `strong`, `b`, `legend` (was forced to 500); uses `--font-weight-medium`. `dfn[id]:target` gets a glossary-style highlight.
    - In Chinese, Japanese and Korean text `dfn` and `cite` are upright: `dfn` semibold, `cite` a muted wavy underline (except `data-variant="quoted"`).
  - **dialog**
    - Open dialogs are now a flex column: header and footer keep their size and the body (`dialog > :is(p, section, article, form)`) shrinks and scrolls (`overflow-y: auto`, `min-block-size: 0`). Long content in a default modal is no longer cut off at 85dvh. The dialog itself scrolls only as a fallback (`overflow-y: auto` replaces `overflow: hidden`).
    - `<form method="dialog">` wrapping header/body/footer: the form gets no padding and becomes the column; `dialog > form > header` / `> footer` are styled like `dialog > header` / `> footer` (full-width footer border, styled header). A fields-only form is still a padded body.
    - Enter and exit are CSS transitions declared on `dialog` (not only `[open]`), so closing animates; the `vb-scale-in` keyframe that ran alongside `@starting-style` is gone. Drawers slide through the same transition via `--_dialog-hidden`. Reduced motion keeps a fade only.
    - Modal dialogs lock page scroll: `html:has(dialog:modal) { overflow: hidden }`.
    - Drawer keyframes `vb-slide-in-end` / `vb-slide-in-start` removed (drawers use transitions); `vb-slide-in-bottom` / `-top` kept for consent-banner.
    - Side drawers grow their body so the footer sits at the bottom edge; the drawer-only `max-block-size: calc(100dvh - 8rem)` body rule is gone.
  - **details**
    - Adjacent `<details>` only join (shared border, squared corners) in normal flow. Inside gap layouts (`layout-*` primitives, `[data-layout]`, `[data-layout-gap]`) they keep their own borders; `data-layout-gap="none"` opts back in.
  - **dl / dl-item** — Description-list variants moved from classes to data attributes on `<dl>` (pre-release breaking): `.horizontal` → `data-variant="horizontal"`, `.stacked` → `data-variant="stacked"`, `.bordered` → `data-bordered`, `.compact` → `data-density="compact"` (matches `table[data-density]`). `data-striped` is unchanged. The rules moved from `src/custom-elements/dl-item/styles.css` to `src/native-elements/lists/styles.css` and apply equally to spec `<div>` wrappers, `<dl-item>` wrappers and (horizontal/stacked) flat dt/dd pairs.
  - **dl / dl-item** — Horizontal variant is now a grid with subgrid rows: the term column lines up across all rows, sized `fit-content(--dl-term-max, 40%)` with a `--dl-term-min` (10ch) floor instead of a hard-coded 120px; below 24rem of available width (container query) each term sits above its description.
  - **dl-item** — html-validate now requires `<dl> > <dl-item>`: a `<dl-item>` outside a `<dl>`, and the `<dt>`/`<dd>` in it, are flagged.

### Fixed

- **O-element review.**
  - **output**
    - Variant classes now apply. The base chip selector's `:not()` exclusions gave it (0,3,1) specificity, so `.block` stayed inline-block, `.inline` / `.large` kept chip padding, and `.highlight` / `.success` / `.warning` / `.error` kept the grey raised background. The exclusions now sit in `:where()` (element-only specificity).
    - Form-field messages (`output.hint`, `form-field output.error`, `output.error-summary`, checkbox-group fieldset outputs) no longer pick up the monospace chip font, padding and background.
    - Empty outputs no longer render a blank chip; forced-colors mode draws a chip border (tints are dropped); `.highlight` text mixes toward the text colour so it meets AA in dark mode without `data-mode`; result chips use tabular numerals.
    - Docs: output is an implicit `role="status"` (polite + atomic), not "aria-live by default"; `for` is not exposed to assistive technology; `name` does not submit the value; range-slider example no longer wraps the output in the slider's label (which left the slider unnamed) and uses `aria-live="off"`; CSS reference matches the source. Demos: labels point at their outputs, no inline styles or `oninput` handlers, the calculated total recomputes, and the error chip is no longer hidden by form-field's validation-message rule.
  - **object**
    - Docs: new Security section (no sandbox/allow/referrerpolicy, untrusted HTML/SVG alternatives, `type`, CSP `object-src`), `data-ratio` in the attributes table, corrected `name` / `form` / `width` / `height` descriptions, PDF fallback wording, and a caveat that `role="img"` fallbacks must be text-only (presentational children). Demo adds an unsupported-type fallback example and moves the link out of the `role="img"` object.
  - **select / optgroup / option**
    - Disabled options no longer get a hover fill. Disabled options and the headings of disabled groups stay dimmed.
    - Forced colors: the `::picker-icon` is painted in `FieldText` at full opacity (it inherited the select's forced-colour opt-out). Disabled options and groups use `GrayText`, and the hovered option uses `Highlight`/`HighlightText`.
    - Docs: the optgroup and option pages no longer say VB cannot style options. They describe the customizable-select styling, the legend form, placeholder validation rules and the default-selection rules, and each has its own demo (`optgroup-basic`, `option-states`). The `select-examples` demo drops its inline style.
  - **ol**
    - `ol.meta` honours `data-separator` (`pipe`/`dash`/`slash`). Before, only `ul.meta` did, although the docs said both did.
    - Docs: corrected the screen-reader claims (position is always announced from 1, and the marker text is not read reliably). Added the Safari `role="list"` note for `.inline`/`.unstyled`/`.meta`, nested numbering via `type`, an `.meta` section, and a "Long markers and other scripts" section with a new `ol-i18n` demo (Arabic-Indic RTL, CJK).
  - **Themes** — dyslexia list indent only on plain block lists (no longer re-indents `.inline`/`.unstyled`/`.meta`, keeps the wide `ol` indent); memphis select rules scoped to single-row selects and style `optgroup` headings from `label=`; kawaii hearts skip lists with their own counter style; neumorphism no longer sinks form-field messages or the tinted `output` variants.
- **M+N-element review.**
  - **markdown-viewer** — Removing `src` re-renders from the slots instead of leaving stale fetched content. Overlapping renders (a slow fetch followed by a `src` change) no longer let a stale response overwrite newer output.
  - **markdown-editor**
    - Upgrade no longer strips the textarea's accessible name, label association, `name` and constraints. Reconnecting keeps the same textarea and viewer, so the cached `.textarea`, caret and undo history survive.
    - `form.reset()` resets the preview along with the value. Assigning `.value` no longer produces a second change event on the next blur.
    - The preview pane is no longer an `aria-live` region (it re-read the whole document while typing).
    - `data-tab-indent` is no longer a keyboard trap: Escape then Tab moves focus, a described hint says so, and read-only/disabled textareas never capture Tab. Indentation goes through the native undo stack.
    - The textarea gets `dir="auto"` unless authored, and the preview follows the source direction. `static.html` holds a real no-JS fallback.
  - **mobile-menu** — The current-page link in the panel was unreadable (interactive-coloured text on the interactive fill); it now uses `--color-text-on-interactive-auto` through the nav `--_active-*` hooks, and has an outline and underline in forced colours. The docs-site menu panel is labelled ("Site menu"); the orphaned `site/src/includes/mobile-menu.html` and dead `.mobile-menu` rules in docs.css are removed.
  - **nav-bar**
    - Assigning `.items` while `.current` is explicitly owned no longer moves `aria-current` or fires a false `nav-bar:current-changed`. In nested (`data-nav-link`) mode it no longer pulls anchors out of their `<li>` / `<drop-down>` shells.
    - The current link has an outline and underline in forced colours.
    - api.json lists `.items`, `.current`, `releaseCurrent()` and `refresh()`. The docs say `nav-bar:upgraded` fires on every reconnect; the basic demo loses its inline `<style>` and the Composition section is rewritten.
  - **notification-wc**
    - Reconnecting or moving the element no longer duplicates the panel (the docs site header hit this); the panel and trigger are reused and `aria-controls` stays valid. Async setup is cancelled on disconnect, so a mid-setup disconnect no longer leaks the poll interval or document listeners. One delegated panel listener replaces per-row listeners that piled up on every poll.
    - Escape and outside click return focus to the trigger when focus was inside the panel. Dismissing a focused banner moves focus to `<main>` instead of `<body>`. Unwatching keeps focus in the list.
    - With scripting off, the banner and the static `<article>` fallback render (`:not(:defined)` used to hide both modes); while scripts load, only the panel articles and persisted banners are hidden.
    - The "Changed" badge uses dark text on amber to meet AA. Forced-colours borders were added for the badge pill, the selected tab and unread rows. Link and button rows align their icons.
    - Docs: removed the false claims about heading navigation, "nearest `<toast-msg>`" and reduced motion; documented `notifications`, `notification-wc:notifications-changed`, `page-watch:remove` and the `data-trigger` child. The banner demo sets `persist`, so it no longer logs a warning.
  - **note-wc**
    - Reconnecting no longer adds a second button. A panel closed before its first frame no longer leaks a document `pointerdown` listener.
    - Save, Cancel, Escape (anywhere in the panel), Ctrl/Cmd+Enter and outside click return focus to the opener; when the opener is gone, focus goes to the highlight's `<mark>` or the article instead of `<body>`.
    - The selection-menu note action matches existing highlights by text offset instead of a 20-character substring, so a short highlight such as "the" no longer captures unrelated selections.
    - The target becomes a positioning context through a `data-note-host` hook while the panel is open, instead of a permanent inline `position: relative`.
    - api.json covers `for`, `data-label-*` and `openFor()`. The docs cover all three modes and embed the selection-menu demo; static.html text corrected.
  - **menu**
    - Focus rings are no longer clipped in `.toolbar` and `.context` (dropped `overflow: hidden`).
    - `<li role="separator">` renders in default, `.toolbar` and `.pills` menus as a vertical rule (it was zero-size outside `.context`), drawn as a border so it survives forced colours.
    - `.toolbar` and `.context` hovers are gated by `(hover: hover)`.
    - Docs: `<menu>` is exposed as a list, not as "commands"; they document `role="toolbar"` + `aria-label` + `role="none"` items and note that no arrow-key roving is provided. The stale CSS snippet and the demos' inline styles are gone.
  - **nav**
    - `nav.steps` connectors use logical insets and sizes, so labels-below and vertical steps mirror in RTL. Completed-step text uses `--color-text-on-success-auto` instead of fixed white.
    - `nav.pagination` wraps instead of overflowing on narrow screens; item sizes are logical. Compact pagination end caps and `.tree` link corners use logical radii. `.pagination` transitions only colour, background and border (was `transition: all`); dead current-item colours on `.pagination` and `.bottom` are removed.
    - `.horizontal > ul` keeps a gap when a `data-layout` host resets `--_gap`.
    - Docs: the breadcrumb default separator is "›" (`--sep-breadcrumb`), not "/". `.steps`, `.bottom.frosted`, `.pagination-bar`/`.pagination-info`/`.page-size-selector`, the `<drop-down>`-in-nav composition and RTL are documented, with new nav-steps, nav-rtl and nav-pagination-bar demos.
  - **main** — `main.contained`, `.narrow` and `.wide` no longer collapse to their padding as a grid or flex item (for example under `data-page-layout`); they set `inline-size: 100%`. The full-page demo uses `data-page-layout="stack"` so main gets the stretch row; main demos keep their `<h1>` inside a landmark, and new `.full`, `.padded` and `.flex` demos plus an "In VB layouts" section are added.
  - **map** — The doc page no longer claims native areas have no focus indicator, explains that VB's `img { max-inline-size: 100% }` reset is what makes native maps drift, and states that `id` must equal `name`. The demo figcaption matches what clicking does.
  - **mark** — Text used the UA's black `MarkText` in every mode (1.3:1 in dark mode). The base now uses `var(--color-text)` and the categories `--color-{success,warning,error}-text` (6.4–16:1 in light and dark). In forced colours every mark is solid `Mark`/`MarkText`.
  - **math** — The "Font Loading" docs no longer point at a 404 `/fonts/math-fonts.css`. The orphaned `native-elements/math/fonts.css`, the no-op `data-theme="dark"` block and the "dark mode support" claim are removed. Each doc section has its own demo.
  - **data-math** — Math inside `<pre><code data-math>` was inserted inside the hidden `<pre>`, so it never showed; it now renders after the `<pre>`. The docs describe the copy button, its `data-label-copy` / `data-label-copied` labels and the status announcement, and state that `data-mathml` is sanitized to MathML only.
  - **meter** — Firefox uses the token fills (`:-moz-meter-optimum`, `-sub-optimum`, `-sub-sub-optimum`). Forced colours get a `CanvasText` track edge and a distinct fill per state. Every doc and demo meter is labelled (`for`/`id`, plus `aria-describedby` → `<output>` in the labelled pattern); the demos drop inline styles.
  - **include-file** — The docs explain the sanitizer policy for non-`trusted` partials: `<style>` elements, `on*` and form-submission attributes are removed; ids and filtered inline styles are kept; `include-file:loaded` `detail.html` is the serialised sanitized fragment and must not be re-inserted with innerHTML.
  - **markdown-viewer docs** — The Sanitising section no longer contradicts itself and lists what is removed, rewritten and kept. It documents same-origin `src`, `data-label-error`, `data-auto-mermaid`, `.markdown` and escaping `<` in `<pre>`/`<template>` slots.
  - **meta / noscript** — Both doc pages are written in full, replacing stubs (an invalid bare `<meta>` example; a `<div>`-based noscript example). meta covers attributes, ThemeManager rewriting `theme-color`, the components that read meta tags, the public-first / `vb:*` rule and accessibility (no zoom blocking, no timed refresh). noscript covers head limits, `<noscript>` vs `data-requires-js` vs `data-js-enhanced` vs `@media (scripting: none)`, and caveats.
  - **topic-map** — The stylesheet header comment describes v1.1 concepts, not the removed `vb:topic` dotted paths.
- **K+L-element review.**
  - **layout-grid**
    - Tracks are clamped with `minmax(min(var(--_min), 100%), 1fr)`, so `data-layout-min="l"` / `"xl"` no longer overflow containers narrower than the min (phones, sidebars).
    - Removed the dead `@container card (width < 200px)` micro-card rule (it never won the cascade and only covered the attribute form).
    - `data-layout-subgrid="3"` is an explicit value; docs explain the subgrid row gap and include a demo.
  - **layout-stack** — With `data-layout-align="start|center|end"`, direct `section`/`article`/`aside`/`main` children no longer collapse to 0 width (their container-type is removed; opt back in with `data-container`).
  - **layout-columns** — Theme heading borders (brutalist h2 and others) no longer show inside the column flow (the reset is `!important`, so it beats the bundle-theme layer). Bleed children span all columns (`column-span: all`).
  - **layout-text** — `[data-bleed]` works in uncentered containers and no longer causes horizontal scrolling from the classic scrollbar width. Extra block spacing also applies to `table`, `blockquote`, `video`, `code-block` and `browser-window`.
  - **layout-cluster** — The overlap amount is set on the items, so an item that is itself a cluster still gets its parent's overlap.
  - **data-splitter / split-surface**
    - `aria-orientation` was inverted (side-by-side panels now report `vertical`).
    - Pointer drag and arrow keys are direction-aware in RTL. `pointercancel` / `lostpointercapture` end the drag (no stuck `user-select: none`). The initial position is clamped into `data-min` / `data-max`.
    - Any content child (not just main/article/section) drops its min width beside the splitter, fixing horizontal overflow with `section[data-layout]` or nested layouts.
    - Reconnect/clone safety: no duplicate dividers (the utility tracks live containers; split-surface ignores stale async inits). split-surface also gains the `data-label-resize` override and `aria-controls` on the divider.
  - **loading-spinner**
    - Removed the invalid `role: status` CSS declaration. Docs give the real pattern: `role="status"` plus `aria-label` for a standalone spinner, `aria-hidden="true"` next to visible text, and note that the live region must already exist to announce.
    - `data-overlay` no longer draws a parent-sized ellipse; it centres a spinner at the chosen size over a translucent backdrop (docs explain the positioned-ancestor requirement).
    - Forced colours: transparent track and a system-colour arc, so the rotation stays visible. The `warning` variant reads `--color-warning`.
    - New `api.json` (variant and size enums, overlay, `--spinner-*` properties); the override entry is removed.
  - **layout-badge** — Subtle and outlined badges meet 4.5:1 in light and dark mode (`--color-*-text` tokens; primary, brand, secondary and accent get a mode-aware tint and ink); default badges use surface and text tokens. Every badge has a `CanvasText` border in forced colours. Docs gain an Accessibility section (colour is never the only signal; counts need context).
  - **layout-card** — `data-max` centres the card in normal block flow (`margin-inline: auto`). Non-ghost cards get a `CanvasText` border in forced colours. The subgrid card actually aligns rows across siblings now (`container-type` had turned it into an independent grid). `api.json` documents the child/slot structure and the structured-mode padding scale.
  - **kbd** — Nested `<kbd><kbd>…</kbd></kbd>` draws caps only on the inner elements: the outer drops its border, background, shadow and padding and inherits the font size, so inner caps are 0.85em instead of 0.72em. This also applies inside buttons and to `kbd[data-hotkey]` (its duplicate reset was removed from data-utilities). Before JS runs, the data-hotkey fallback text renders as one ordinary cap.
  - **magna theme** — The kbd cap rule no longer boxes a `kbd` that wraps other `kbd`s.
  - **label / legend demos** — Removed typed `*` from required labels inside `<form-field>` (label-patterns, legend-examples, textarea-examples, input-states), which rendered "Name * *" next to form-field's automatic asterisk.
  - **a11y-dyslexia theme** — `p, li, blockquote` use `text-align: start` instead of `left`, so RTL text aligns right.
  - **kawaii pack** — `kawaii.effects.css` (what the kawaii pack theme actually loads) draws its list hearts with `::marker` too, so list semantics survive.
  - **math-init** — The math font stylesheet resolves against the VB CDN base (`{cdn}/fonts/math-fonts.css`) instead of root-absolute `/fonts/math-fonts.css`, and the CDN build ships it. It used to 404 on the docs site and for every CDN or subpath consumer.
  - **theme-loader** — `preloadTheme()` no longer adds a `<link rel="preload">` on every theme-picker hover or focus when one already exists; loading a theme or pack removes every matching preload. Theme names are `CSS.escape`d in selectors. New export: `getCdnBase()`.
  - **rel lookups (page-info / canonicalize / share-wc / geo-map / sign-pages)** — `rel` is matched case-insensitively as a token list (`[rel~="canonical" i]`), so combined values such as `rel="author license"` work; the sign-pages canonical lookup matches multi-token `rel` too. share-wc shares a relative canonical as an absolute URL (`.href`).
  - **geo-map** — The tile-origin `preconnect` no longer sets `crossorigin` (tiles are no-cors `<img>`, so a CORS-mode connection was never reused).
  - **Docs**
    - Layouts: grid, stack, switcher, columns and layout-text pages gain attribute forms, escape hatches and new demos (subgrid, stack align with sections, switcher reverse with a WCAG 2.4.3 focus-order note, bleed). Sidebar is documented as 16rem with "how the sidebar is chosen", sticky prerequisites and a DOM-order note; reel has region/keyboard guidance and RTL demos; imposter has an Accessibility section; canvas documents `data-canvas`, token coupling with `data-backdrop` and the 37.5rem breakpoint. Demos drop divs and inline styles (`<figure data-media>`, `<section data-layout="reel" aria-label tabindex="0">`).
    - kbd covers nested kbd, data-hotkey and caps inside buttons; data-hotkey documents spoken names, named keys, the plus key, `data-label-*` and idempotency. The label page documents form-field's automatic asterisk and has a CSS Reference synced to source; the legend page covers required, disabled and status states.
    - The `<link>` page is written in full (rel values, resource hints, attributes, VB theme links and `data-vb-theme*`, links VB reads and inserts). The `blocking` page states correctly what already blocks and shows real non-blocking CSS patterns. The `<li>` page has a corrected CSS properties table, a Markers section and a Safari/VoiceOver `role="list"` note; the `<ul>` page no longer contradicts itself.
- **I-element review.**
  - **icon-wc**
    - Changing `name`/`set` mid-fetch no longer leaves the stale icon: results are tokened and the `<svg>` is swapped in place (no shadow-root rebuild, no flash).
    - Adding `label` after load now sets `role="img"`/`aria-label` and drops `aria-hidden`; removing it clears `aria-label` and restores `aria-hidden`.
    - Fetched SVG is sanitized (`sanitizeSVG`) before insertion: scripts, `foreignObject`, `on*` handlers and `javascript:` hrefs are stripped.
    - Missing icons are negative-cached (one request per URL); the cache is keyed by base path; non-default sets consult `<base>/<set>.json` once and go straight to the Lucide fallback for names they lack.
    - Reconnecting (moving) an icon no longer refetches or re-renders it.
  - **image-gallery**
    - Lightbox captions were re-injected with innerHTML (XSS via `.images` captions); nodes are now cloned/created as text.
    - An empty gallery never became interactive; it now upgrades and works once thumbnails arrive (markup or setter).
    - RTL: ArrowLeft/Right and swipe follow the reading direction; prev/next chevrons are mirrored.
    - Lightbox `<dialog>` is named ("Image viewer"); info button has `aria-controls`.
    - Changing `captions`/`controls` rebuilds the lightbox instead of keeping the first-open layout.
    - Setter thumbnails load lazily; entries without `alt` warn once and name the link from the caption or counter.
    - Swipe module resolving after disconnect no longer attaches listeners; thumbnail hover zoom honours `data-motion-reduced`.
  - **image-map**
    - Overlay could build twice (raw load listener firing after disconnect/reconnect); now built once per lifecycle via `listen(..., { once: true })` and an already-built guard.
    - `crypto.randomUUID` threw on insecure http origins; ids use a module counter.
    - Tooltip was only `opacity: 0` when closed (in tab order and a11y tree); now `hidden` when not showing, placed after its hotspot so Tab flows into it.
    - WCAG 1.4.13: hover tooltip is hoverable (300 ms grace), Escape dismisses it from anywhere, tap/click outside closes it.
    - `tooltip="none"` was ignored on focus; empty `label` falls back to the area's text content.
    - Fixed-position tooltip follows scroll (passive, rAF-throttled).
    - Forced colors: system-colour strokes (CanvasText, Highlight on hover/focus, thicker).
  - **input (native)**
    - Forced colors: checkbox and radio repaint in system colours (CanvasText border, Highlight fill, HighlightText tick, dot or bar), so unchecked, checked and indeterminate stay distinct. Disabled uses GrayText.
    - Forced colors: switch tracks are outlined in CanvasText with a CanvasText knob. Checked shows a Highlight track and a HighlightText knob; disabled uses GrayText.
    - Forced colors: range keeps a visible Highlight/CanvasText track, both plain and data-range.
    - Forced colors: text fields show a 2px Highlight focus outline (the box-shadow halo was dropped), and invalid fields get a double border.
    - RTL: the switch knob slides toward the inline end. Previously the physical translate pushed it out of the track.
    - RTL: the range fill (plain and data-range) grows from the inline start. Firefox now fills via `::-moz-range-progress`.
    - Docs: removed the wrong "44x44px checkboxes" claim and documented the data-switch sizes, indeterminate, readonly, submit/reset/button/image types, the styled color swatch and forced colors. The CSS reference is corrected (`--range-pct` default 0%, `[type="image"]` in the selector).
    - Demos: input-states, input-text-types and input-numeric-date no longer use inline styles. The hardcoded error colour is now `<output class="error">` / `class="hint"`. Added indeterminate checkbox, month, week and readonly number examples.
  - **iframe** — `.full` no longer sets `block-size: auto`, which discarded the `height` attribute and collapsed the frame to 150px. `.fixed` now sets `inline-size: 100%` as documented. Docs: `data-ratio` (incl. `page`) and `[data-media]`, sandbox warning for `allow-scripts allow-same-origin` + full token table, CSP uses `youtube-nocookie.com`, new Attributes (`allow`/Permissions Policy, `allowfullscreen`, `srcdoc`, `credentialless`, `referrerpolicy`), Performance and Printing sections; demos drop inline styles and show `.fixed` and `data-ratio`.
  - **img** — added the documented `.ratio-landscape` (4:3, cover). Removed a dead `::before` on the missing-`src` rule. Docs: CLS (`width`/`height`), `srcset`/`sizes`, `decoding`, `fetchpriority` and not lazy-loading the LCP image, `[data-media]` + `data-ratio`/`data-fit`, `data-outlined`, `data-mock` presets (which use external CDNs), missing-source placeholder, complex-image pattern; dropped the `role="presentation"` advice. Demo uses one off-ratio local placeholder so the ratio/fit differences show.
  - **i / em / dfn / cite (CJK)** — romanised tags (`ja-Latn`, `zh-Latn`, `ko-Latn`) keep the real italic; the CJK upright cues no longer apply to them.
  - **i** — docs described a nonexistent blockquote rule; now document the real toggle, italic contexts, the `font-synthesis: none` caveat, CJK treatment, and a "Not for icons" note.
  - **ins / del** — the tint-vs-body-text contrast claim is now backed by a themed AA check (tests/visual/site-pages.spec.js).
  - **Themes / form controls**: text inputs, checkboxes, radios, unchecked switch tracks, range tracks and `data-stepper` wrappers now reach 3:1 non-text contrast (WCAG 1.4.11) against the surface in every theme, light and dark. 20 extreme themes (8bit, alpha1999, art-deco, bauhaus, claymorphism, cottagecore, cyber, editorial, glassmorphism, kawaii, nes, neumorphism, nord, organic, rough, super2026, swiss, terminal, vaporwave, win9x) mix their own `--control-border` / `--input-border` / `--range-track-bg` toward `--color-text`, which keeps the hue. Theme input rules that hard-coded `--color-border` or literal colours now use `--input-border`. Claymorphism controls gain a 2px edge and neumorphism a 1px edge next to their soft insets. Win9x dark lifts the outer bevel of form controls through a new `--_win9x-field-edge` token. Guarded by `tests/components/i-theme-form-contrast.spec.js`.
  - **data-stepper**: the wrapper border uses `--input-border`, the same 3:1 edge as a text field, in place of the low-contrast `--color-border`. Under forced colors it shows a 2px `Highlight` outline on `:focus-within`, because the box-shadow halo disappears there.
  - **icon-wc usages**: demos and docs used `size="s"`, `size="20"` and `size="24"`, which icon-wc never supported (presets only); they now use `sm`/`md`.
- **include-file (I-element review).**
  - **include-file** — Include cycles (self, A→B→A) and nesting deeper than 10 are refused with the error state instead of recursing forever.
  - **include-file** — `append`/`prepend` with `allow-scripts` no longer re-runs earlier scripts, and without it no longer deletes the author's own scripts: each fragment is parsed in a `<template>` and only its nodes are processed.
  - **include-file** — No double fetch (and aborted request) on upgrade; a `src` changed while detached now loads on reconnect; an unknown `mode` behaves as `replace` (with a warning) instead of silently inserting nothing.
  - **include-file** — Docs: live demo, Security & Nesting section, accurate API manifest (`src` property, `reload()`, `include-file:src-changed`, new attributes, event details); demo no longer uses an inline `<style>`.
- **G+H-element review.**
  - **data-motion-reduced** — now zeroes every `--duration-*` token, disables smooth scrolling and the root theme transition (previously only the media query did) (wja7)
  - **Reset** — `text-size-adjust: 100%` instead of `none` (no longer blocks mobile text zoom); touch-target comment/docs corrected (44px is WCAG 2.5.5 AAA; 2.5.8 AA is 24px) (wja7)
  - **Docs boot script** — snapshots authored root attributes (`window.__vbAuthoredRoot`), applies stored accent / border style / icon set / backdrop / backdrop-chrome before first paint, keeps a pinned `data-theme` when the stored brand is `default`, dark theme-color seed matches the real dark surface (wja7)
  - **html / head docs** — html: `data-accent` section, backdrop / backdrop-chrome / sticky / scrollbar sections, theme loading caveats (bundled vs on-demand vs pack, fixed-scheme themes), accurate motion-reduced, ruby default, dev-bundle note for debug/wireframe, reset table (`background`, `cursor`, `text-size-adjust: 100%`, `scrollbar-gutter` advice), `dir` without removed bidi rules, ThemeManager via `VB.themeManager`. head: rewritten as the recommended VB head (CSS/JS entry tables with npm specifiers, layer-order note, modulepreload, real VBStore keys in the boot snippet, metadata VB reads, CSP/nonce, Twitter `name=`, no Google Fonts preconnect, manifest note) (wja7)
  - **header**: `data-scroll-hide` now adds up upward scroll since the last direction change, so slow or small scroll steps reveal the header. Focus moving into a hidden header reveals it (JS on `focusin`, plus a CSS `:focus-within` fallback).
  - **header**: a body-level `header[data-sticky]` now sets `scroll-padding-block-start` on `<html>`, so anchor targets land below it, not under it. It uses `--sticky-offset`, falling back to `--header-sticky-size`. The coordinated system drops the padding on mobile, where the header is static.
  - **sticky-manager**: the sticky system now pins the body-level banner header, not the first `<header>` in the document, which could be an article header. It reports a 0 offset when the header's computed position is static.
  - **hgroup**: the byline author link now has an underline, so it doesn't rely on colour alone. The "·" separator is no longer read aloud.
  - **headings**: theme ornament glyphs (`--heading-ornament-*`, plus the kawaii, 8bit, terminal, cyber and memphis heading glyphs) are no longer part of the heading's accessible name.
  - **hr**: `.decorative` dots, `data-ornament` glyphs and theme hr glyphs (editorial §, kawaii, cottagecore, art-deco, terminal) are no longer read aloud. In forced colors, shape dividers and theme-painted rules now show a `CanvasText` line instead of disappearing (also the journal doodle). Shape dividers now print. The rough dark-mode hr rule no longer overrides ornament or shape hrs.
  - **docs**: corrected the header, hgroup, headings and hr pages (banner landmark rule, hgroup is not announced as a group, h1 is not a landmark, `data-display`, heading spacing, ornament resolution, hr shapes, forced colors and print). Added demos for sticky, auto-hiding and transparent headers, the hgroup variants and hr shapes.
  - **geo-map**
    - Marker colour and slotted text can no longer inject markup: the shadow DOM is built with DOM APIs (no `innerHTML` interpolation).
    - Tiles re-lay out on resize (ResizeObserver) and cover any box size instead of a fixed 3×3 grid; maps that start hidden load when shown.
    - `.data` compares every field and writes attributes as one batch (one render; marker-only changes now apply).
    - Activating twice, or disconnecting during the lazy import, no longer creates duplicate or orphaned interactions.
    - High-zoom interactive panning no longer overflows CSS layout limits; caption and attribution use logical properties.
  - **glossary-wc**: moving the element no longer empties it. The authored `<dl>` stays in place (hidden) and teardown moves the term divs back, so reconnects re-render identically. `src` mode works without an inline `<dl>`, no longer loops fetching when a fallback exists, fetches once per URL, fires `ready` after the load (not while loading), and handles fetch/JSON errors with a message while keeping the fallback. Fixed the XSS through `innerHTML` of JSON definitions and the see-also link text (now the target term's real text, not a title-cased id). Searching reveals matches in collapsed categories (the user's collapsed state comes back when the search is cleared), disables letters with no visible term, and announces when cleared. Links into a collapsed category expand it. Jump letters are at least 24px (WCAG 2.5.8). The sticky category header works (`overflow: clip`). The chevron mirrors in RTL. The reduced-motion rule now beats the chevron/letter transitions. Collation-aware sort and search.
  - **glossary-index**: reconnecting no longer adds another search input (it is removed in teardown and the listener is tracked). The scroll-spy `aria-current="true"` letter is now styled (native glossary styles). `static.html` has a real fallback.
  - **heading-links**
    - Copy announcement survives: it is no longer appended inside the link and then destroyed by an `innerHTML` icon swap; repeated clicks within 1.5s no longer leave the check icon stuck.
    - Navigation uses `goToFragment`: `:target` applies, `hashchange` fires, reduced motion scrolls instantly, focus uses `preventScroll`, and it stays on the page under `<base href>`; the copied URL is the document URL + hash.
    - Ctrl/Cmd/Shift/Alt and middle clicks are no longer hijacked.
    - Anchors are visible on keyboard focus and always on touch (`hover: none`) devices.
  - **highlight-wc** — One highlighter button inside `<selection-menu>` (was 2 at load from the reparent, 3+ after moves): setup reuses an existing button and teardown removes what setup created. Every selection-menu target gets its own controller (later articles no longer reuse the first one's). Palette disclosure: `aria-expanded`/`aria-controls` on the button, focus moves to the pressed swatch, Escape closes the palette (keeping the toolbar) and returns focus, outside click and `selection-menu:dismiss` close it, palette nudged to stay in the viewport. Swatch styles actually apply inside selection-menu (were wiped by its `all: unset`); swatches have tooltips and keep their fills in forced-colors mode. Labels via `data-label-button`/`-palette`/`-annotation`/`-added`/`-removed`.
  - **highlights (data-highlights)** — A destroyed controller is no longer handed back by `initHighlights()` (re-init after a move paints again). Dark-mode highlights meet AA (were light pastels under light text). Forced colors: highlights use `Mark`/`MarkText` with a distinct underline style per colour. Margin annotations and the note panel use logical insets (RTL puts them on the inline-end side). Ranges are cached per render instead of re-walking the text per highlight on every click.
  - **hour-view**
    - Events in a plain `<hour-view>` (no `data-overlap`) now stack instead of being drawn on top of each other; extra events add rows and the hour grows to fit. `data-start="30"` still places an event in the bottom half. hour-view is no longer a subgrid (a subgrid has no implicit rows, so a third event would overlap).
    - `data-overlap` gives every event in a half-hour row an equal column (any count, not just two); long nowrap titles truncate instead of widening an implicit third column.
    - hour-view no longer hard-codes day-view's grid placement globally; day-view places it (column 2, both rows) and week-view no longer has to undo it.
  - **day-view, week-view**
    - Generated grids add `data-overlap` only when two or more in-grid events share a half-hour row; a :00 and a :30 event in the same hour stay full width.
  - **i18n**: Chinese and Japanese use `word-break: normal` with `line-break: strict` instead of `break-all`, so embedded Latin words and URLs no longer split mid-word.
- **F-element review.**
  - **form coordinator** — legacy `output.error-summary` was built with `innerHTML` from labels and messages (including server messages passed to `setError`), allowing HTML injection; now built with text nodes. Without a summary, an invalid submit focuses the first invalid control instead of possibly a `<fieldset>`.
  - **form docs/demos** — `[data-form-summary][hidden]`, `[data-form-success][hidden]` and `[data-form-error][hidden]` now really hide (author `display:block` beat UA `[hidden]`); fetch demo mock matched no request (compared an absolute `form.action` to a path); inline styles removed from form-layouts/form-contact snippets.
  - **form-field**
    - `setError()` no longer sticks forever: the field's own message clears on the next edit; custom errors set by others (`data-match`, date-picker's mirror) are left alone.
    - `badInput` is handled (`data-message-badinput`); unmatched states fall back to `validationMessage`.
    - Checkboxes and radios validate on `checked` (an unchecked box no longer reads as "valid"); radio fields bind every radio in the name group; no success icon on checkable fields.
    - Valid-state styling uses `background-color`, so the select chevron survives; the status icon is offset clear of the chevron.
    - Collapsed `output.error` is `visibility: hidden`, so it leaves the accessibility tree.
    - Status icons stay visible in forced-colors mode (system colours; invalid controls get a double border).
    - Password toggle and strength meter no longer duplicate when a field is moved (per-feature idempotence instead of one shared `data-enhanced` slot). Toggle, strength levels, rule labels, "Password requirements" and OTP digit labels are localizable via `data-label-*` on the field; the meter has an accessible name.
  - **data-count**: the counter is added to the textarea's `aria-describedby`, is no longer mistaken for the field's error output, and stops announcing every keystroke (announced only near/over the limit, after typing pauses).
  - **data-floating-label**: a real placeholder keeps the label floated instead of overlapping it; enhanced password inputs get the floated-label top padding.
  - **fieldset/legend**: removed the duplicate fieldset/legend rule in `input/styles.css`. The legend uses `padding-inline: var(--size-s)` and `font-size: var(--font-size-s)` as documented; the legend docs were also corrected (they described the shadowed `--size-xs` copy).
  - **fieldset**: `data-status` and `data-invalid` get a non-colour cue in forced-colors mode: a 3px border, solid for success, dotted for warning, double for error/invalid. It uses `!important` so theme layers can't remove it. Docs now say to pair status with text.
  - **fieldset**: the neumorphism and win9x themes no longer erase `data-status`/`data-invalid` borders (neumorphism `border: none`, win9x border shorthand). Status colours are exposed as `--fieldset-status-color` for themes to reuse.
  - **form**: removed the empty "Verification Code Inputs" comment block (the phantom `fieldset.code-inputs`).
  - **figure**: `figure.code` caption sits flush under the code block (the base caption top margin left a gap under the squared corners).
  - **print**: `header[data-sticky]` / `footer[data-sticky]` print in normal flow; `fab-stack`, `[data-float]` and `[data-back-to-top]` are hidden in print.
  - **docs**: figure/figcaption/footer pages use demo files instead of inline example wrappers and styles; footer sticky is documented as `data-sticky` (the `.sticky` class never existed), including the mobile forms guide; figure role/accessible-name guidance corrected; the decorative-image hidden-caption example removed.
  - **flow-diagram**
    - `.steps` no longer throws (and blanks the diagram) on steps without `branches`; input is normalized and the documented shape is corrected to `{ type, text, annotation?, branches?: [{ label, steps }] }`.
    - `.steps` writes into the source `<ol>` and re-runs the lifecycle, so assigned data survives later attribute changes and moves, `select` keeps firing, and no stale listeners remain.
    - `src` set before the element connects is now loaded on connect; stale responses for a superseded `src` are ignored.
    - Forced colors: connectors, split bars, arrows and the decision marker repaint in `CanvasText`.
    - RTL: horizontal flows run right-to-left with arrows pointing to the inline end; Left/Right keys follow the visual order. Branch split bars are drawn per branch, so they now meet every branch exactly (horizontal bars previously missed rows of unequal height).
  - **foot-notes, glossary-wc, site-index**
    - Generated `#id` links (footnote refs/backlinks, glossary jump bar + see-also links, site-index jump nav) no longer navigate away on pages with `<base href>`; shared `src/web-components/_shared/fragment-link.js` sets `location.hash`, focuses the target and keeps the relative hrefs (vanilla-breeze-ihgb).
  - **foot-notes**
    - Back glyph uses text presentation (U+21A9 U+FE0E); print hides backlinks and the preview, prints references as plain superscript numbers and avoids breaking notes across pages; `.sidenote-number` bold rule now actually matches (was scoped to `foot-notes`, but the aside lives in `foot-note`).
  - **data-float**
    - `*-center` positions use the physical viewport midpoint (`left: 50%` + `translate: -50%`) and are now centred in RTL; the logical `inset-inline-start: 50%` was off-centre by the element's width.
    - Inline edges take the safe-area inset of the physical edge they touch: in RTL `-right` (inline-end) adds `--safe-left` and `-left` adds `--safe-right` (via private `--_float-safe-start/-end` swapped under `:dir(rtl)`). Same fix for the bare `<fab-stack>` and bare `[data-back-to-top]` fallbacks.
  - **fab-stack docs** — removed phantom `--fab-stack-bottom` / `--fab-stack-end` tokens (real: `--fab-stack-gap`, `--float-offset`, `--nav-bottom-height`, `--z-float`), replaced the stale positioning sample, frontmatter no longer says "bottom-right corner", back-to-top visibility documented as JS-driven `[data-visible]`, new Child order section, and a dedicated `fab-stack-basic` demo. The data-float positions demo no longer overlaps its own bottom-left pill with a fab-stack and drops the unused `.stage` styling.
- **E-element review.**
  - **embed / object**: print styles keep `embed`, `object` (and `iframe`) from splitting across pages and cap `embed`/`object` at the page width.
  - **embed / object docs**: PDF examples used invalid `width="100%"`; now integer sizes plus `data-ratio="page"`. Added Sizing and Security sections (no sandbox, scripts in SVG/HTML embeds, `<iframe sandbox>`/`<img>` for untrusted content, CSP `object-src 'none'`, `type` is only a hint), accessible-name guidance, and the mobile PDF caveat (recommend `<object>` with a download link). Demo drops inline styles and its placeholder "Embedded content" name.
  - **em docs**: documents the `font-synthesis: none` invisible-emphasis caveat, the italic-context toggle, CJK marks, and corrects the screen-reader claim (most don't convey emphasis by default).
  - **emoji-picker**
    - Inserting into a contenteditable no longer deletes text selected elsewhere on the page: a saved selection is used only if it lies inside the target, otherwise the emoji goes at the end of the target.
    - Disconnecting while the data loads no longer leaves document listeners behind; reconnects never duplicate the panel.
    - Insertion uses `execCommand('insertText')` (undo works, native `InputEvent`) with a `setRangeText` + `InputEvent({ inputType: 'insertText', data })` fallback; email/number inputs no longer throw; contenteditable insertion fires `input` too.
    - Search results are announced in a polite `role="status"` region ("N emoji found" / "No emoji found"); the search input has `aria-controls`; "No emoji found" is no longer a div inside the grid.
    - Focus after selection goes to the target (or back to the trigger when there is none); Escape returns focus to the trigger.
- **D-element review.**
  - **diagram-wc**
    - Setting `.source` no longer removes the figure before rendering: the new figure is crossfaded in, and on a parse error the previous diagram stays visible (with no prior render, a `<pre>` of the current source is shown).
    - Concurrent renders with different tokens/`data-theme-base` no longer cross configs: `mermaid.initialize()` + `render()` run through one queue; superseded renders are discarded.
    - `diagram-wc:ready` now fires after the new figure is in the DOM (it previously fired before the view-transition swap ran).
    - The 220ms crossfade timing no longer applies to every view transition on the page; it is scoped with `view-transition-class: dwc` (8s1z).
    - Error note uses `--color-error` / `--color-error-subtle` / `--color-error-text` instead of hardcoded `#ef4444`; removed a dead `:not([data-upgraded])` rule.
    - Docs: corrected token-map table, `src` priority, error-event behaviour, manual-wiring import; added Accessibility and Security/CSP sections; demos drop inline `<style>` blocks and the hand-built theme toolbar (now `<theme-picker>`) (rb3n). api.json gains `source`/`svg` properties and typed event details (qim5).
  - **date-picker**
    - Reconnecting (move/remove+reinsert) no longer duplicates the text input and calendar, accumulates disabled/highlight dates, or leaves stale open state; the form-reset target no longer drifts after a reconnect.
    - The generated combobox is now named by the author's `<label for>` (on the inner input or the host) or `aria-label`; label clicks focus it.
    - Dates can be cleared: empty text on blur/Enter, or `value = ''`, clears the selection and form value, re-validates and fires change.
    - Home/End are correct for Monday-first locales; PageUp/PageDown (and Shift) clamp to the target month length instead of overflowing (Jan 31 → Feb 28).
    - Impossible typed or assigned dates (2026-02-31, April 31) are rejected instead of rolling over.
    - Re-picking the already-selected date closes the calendar.
    - `disabled` and `required` are observed, and a disabled `<fieldset>` disables the picker (`formDisabledCallback`); `form`, `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()` exposed.
    - Arrow/Home/End/Page keys in the year select no longer move the day grid; setting `.value` no longer steals focus.
    - Docs: the hero demo `date-picker-basic.html` existed only as a 404 — added; `static.html` is a real no-JS fallback.
    - The host now owns validity via ElementInternals: `valueMissing`, `rangeUnderflow` (before `min`) and `rangeOverflow` (after `max`), anchored on the visible combobox. Submitting focuses the text input instead of failing with "An invalid form control is not focusable". After upgrade the hidden native `<input type="date">` is detached from its form, so its constraints can never block submission and it never sends a second FormData entry. An authored `form` attribute on it moves to the host. It still mirrors the host's message via `setCustomValidity`, so `<form-field>` shows it. The host's `invalid` event also prompts `<form-field>` to show the message on submit. (vanilla-breeze-lywa)
    - Changing `min`/`max` never rewrites the value: a value outside the new range is kept and flagged invalid, and the change notifies `<form-field>`. The combobox gets `aria-invalid` (out-of-range, or required and empty once touched or submitted), and the trigger gets an error border.
    - New `data-label-range-underflow` / `data-label-range-overflow` messages, with a `{date}` placeholder. A `data-message-range*` attribute on the inner input wins.
    - Linked-range demo: the start date sets the end date's `min` (never below the authored floor; check-out is at least one night after check-in), and the start is no longer capped by the end. An end date left before a new start is kept, shows its form-field message straight away, and blocks submit until fixed. Reset restores the derived `min`. The demo adds error outputs, a submittable timeline form, and top-aligned fields.
  - **data-table**
    - Sort arrow never changed: the indicator keyed on `th[data-state-sorted]`, which the component never sets; it now follows `aria-sort` (arrow alt text is empty so it is not read twice).
    - Added a visually hidden `role="status"` live region announcing sort column/direction, filter result counts ("3 of 12 rows shown" / no results) and selection counts; removed doc claims for unimplemented arrow-key row navigation, Home/End paging and `aria-selected` rows.
    - "No matching rows found" is a real `<p data-table-empty>` element (overridable via `data-label-no-results`) instead of English CSS `::after` content on `<tbody>`.
    - Pagination no longer drops keyboard focus: focus moves to the replacement Prev/Next button, or to the new current-page button.
    - Expansion content rows are hidden along with their parent when it is filtered out or paged away; `refresh()` no longer counts them as data rows; `goToPage()` is a no-op without `data-paginate` (was NaN).
    - Toggle buttons (`data-action="toggle-expand"`) get `aria-expanded` from the authored state on upgrade.
    - The bulk-actions bar only appears for the `data-table` whose rows are selected (was every bar on the page).
  - **drag-surface**
    - `disabled` now calls `preventDefault()` on `dragstart`, rejects drops (including from grouped surfaces), cancels an active grab, sets `aria-disabled="true"`, and drops the grab cursor on handles. Grouped neighbours skip it as a transfer target.
    - `dragend` and `drop` clear `data-drag-over` and `data-drop-target` on every surface, and `data-dragging` on the item. Abandoned or cross-surface drags no longer leave a stuck highlight. `reorder-end` fires on the source surface.
    - Items added after upgrade get `role="listitem"` and `tabindex="0"` (a MutationObserver). Teardown clears `data-reorder-mode`, grab state and move controls.
    - The drop indicator is drawn on the correct edge: block-end for `after`, and inline-start/inline-end (flipped in RTL) on horizontal surfaces.
    - Announcement labels skip the control buttons and decorative or `aria-hidden` handle glyphs.
    - Removed unused `#reducedMotion` (the CSS already handles reduced motion).
  - **drop-down**
    - Removing an open drop-down from the DOM left it thinking it was open (removal hides the popover without `beforetoggle`), so after reconnecting `open()` and `close()` were no-ops. (egb6)
    - `items` setter re-runs the lifecycle via `_reinit()` instead of stripping `data-upgraded` and calling `setup()` directly; disabled links are no longer activatable menuitems. (8kf7)
    - `drop-down:select` (`{ item, value }`) is now actually dispatched; `drop-down:items-changed`, `items`, `isOpen` and the methods are documented in api.json. (rb3n)
    - Nested drop-downs: the outer one no longer reacts to the inner pop-over's bubbling `pop-over:show/hide`, no longer claims the inner menu's rows as its own items, and ignores keys from the inner menu. (qim5)
    - Clicking the trigger of an open action menu closes it (light-dismiss used to close it on pointerdown and the click reopened it).
    - Menu items show a `:focus-visible` outline from the `--focus-ring-*` tokens instead of only a background tint. (qim5)
    - Escape / light-dismiss with focus in the menu returns focus to the trigger.
  - **day-view / week-view**
    - Full ISO datetimes (`2026-04-10T09:30:00Z`) place events: day-view auto mode no longer reads hour 2026 and drops every event. Shared parser in `src/lib/time-grid.js`, wall-clock time as written. (8kf7)
    - Durations: `1.5h` is 90 minutes (was 5h), and ISO-8601 (`PT1H30M`), bare minutes (`60`), `90min` are understood; garbage/zero falls back to 1 hour. (8s1z)
    - Spanning events re-position on resize (ResizeObserver), overlapping spans are laid out side by side instead of stacking, spans past the last visible hour are clipped with `data-continues` (dashed end edge, name says it continues; `data-label-continues` to localise), and the pending frame is cancelled on teardown. Teardown only clears the inline properties it set, so `--event-color` (e.g. from calendar-wc) survives. (rb3n)
    - Roving tabindex is reset in setup, so a reconnect no longer leaves two tab stops. (egb6)
  - **day-view, week-view, tab-set, glossary-wc, image-map, flow-diagram, site-map**
    - Data setters (`events`, `tabs`, `terms`, `regions`, `pages`, glossary/flow-diagram `src` reloads, flow-diagram attribute refresh) re-run the lifecycle through `_reinit()`: `data-upgraded` is restored (day-view no longer falls back to its no-JS styles), old `listen()` handlers are released, and nothing renders while disconnected. site-map re-binds drag-pan after a rebuild. (egb6)
  - **data**
    - The ticker's tabular-nums rule targeted `data[data-ticker]`, which never matched; it now targets `data[data-effect~="ticker"]`.
  - **datalist docs/demos**
    - Range recipe rewritten around `data-range` (VB's `appearance: none` removes native tick marks); dynamic-suggestions recipe uses `new Option()` + `encodeURIComponent`; colour swatches use real `<li>` items; inline styles removed from demos.
  - **del / ins / dfn docs**
    - Corrected claims that screen readers announce del/ins by default, that `datetime` is exposed to assistive technology, and that search engines use `<dfn>`; CSS references now show the token-based rules.
  - **details**
    - Closed `<details>` now print open: the print rule targets `details::details-content` (content-visibility/block-size) instead of the children, which could not reveal it.
    - Chevron points left when closed in RTL (was down) and down when open (was left).
    - `summary` font-weight uses `--font-weight-medium`.
  - **dialog**
    - Forced colors: the dialog has a transparent border that shows as CanvasText, so its edge no longer vanishes with the shadow.
    - RTL drawers: `start`/`end` slide in from the correct edge and use logical corner radii.
    - Doc demos: every dialog named via `aria-labelledby`; dropped the "… heading" labels; removed the unpinned unpkg invokers-polyfill (Invoker Commands ship in all engines); `dialog-variants` Subscribe form uses `method="dialog"` instead of navigating the iframe.
  - **accordion-wc**
    - Removed the dead `accordion-wc > details > ::details-content` rules (descendant combinator never matched; the base details animation applies).
  - **Docs**
    - details: correct accordion-wc override row, interpolate-size (Chromium-only) note, ::details-content support (Chrome 131 / Safari 18.4 / Firefox 143), no inline styles in demos.
    - dialog: `closedby` documented (Safari fallback), structural/backdrop/animation snippets synced with the CSS, naming guidance, scroll lock, support lines.
    - div: allowlist path is `scripts/vb-conformance-allowlist.json`; severities corrected; fieldset example uses layout-stack; `generic` role wording; dl > div auto-exemption. Removed the stale unused `.claude/vb-conformance-allowlist.json`.
  - **dl-item** — Horizontal: second and later `<dd>` in a group no longer wrap under the `<dt>`; every `<dd>` stays in the description column and several `<dt>` stack in the term column.
  - **dl / dl-item** — Horizontal: long values (e.g. email addresses) wrap inside the description column instead of overflowing narrow containers.
  - **dl / dl-item** — Plain wrapped groups (`<div>` or `<dl-item>` in a `<dl>` without class/data-layout) get the same group spacing and `<dd>` indent as flat pairs; the dd indent reset now applies only in the horizontal/stacked variants.
  - **dl** — `data-striped` on flat lists stripes the whole run of up to four `<dd>` after an odd `<dt>` (was: first `<dd>` only); docs recommend wrapping multi-term groups.
  - **dl / dt / dd docs** — CSS block synced with the shipped rules; screen-reader claims softened; dd demos now match their code samples; spec-correct "Required Parent" text; dl-item Conformance note; new dl-div-wrapper, dd-*, dt-multiple-descriptions demos.
  - **docs** — Added the missing `floating-label-basic`, `hotkey-action-basic` and `loading-button-basic` demos embedded by the data-floating-label, data-hotkey and data-loading attribute pages.
  - **select**
    - The dropdown chevron is now a `currentColor` conic gradient instead of an SVG data URI, so it matches the text colour under `data-mode="dark"`, themes and forced-colors (it used to stay black). It sits on the inline-end side and mirrors to the left under `:dir(rtl)`. `multiple` and `size > 1` selects no longer get an arrow or the extra end padding in browsers without `appearance: base-select`. In forced-colors mode the single-row select opts out (`forced-color-adjust: none`) and re-applies `Field`/`FieldText`/`GrayText`/`Highlight` so the arrow survives (forced colors drop gradient backgrounds). `--select-chevron` is still the override hook; new `--select-chevron-size` and `--select-chevron-inset` tokens size and place it (set `--select-chevron-size` when you swap in a `url()`). The chevron is now a filled triangle that matches the `input[list]` (datalist) indicator. (vanilla-breeze-c7lt)
  - **kbd / data-hotkey**
    - Key caps inside buttons (`<button>`, `.button`, `[role="button"]`) are legible again: a `<kbd>` (including the caps `data-hotkey` generates) now keeps the button's text colour, draws its edge from `currentColor`, and gets a translucent neutral fill at the text's opposite lightness, so a cap is never less legible than the button label. Previously the cap kept the page surface fill under the button's text colour and rendered blank inside primary buttons (vanilla-breeze-hzt3). Standalone `<kbd>` is unchanged; the magna theme's accent `kbd` override no longer applies inside buttons.
    - The `data-hotkey` action demo and doc snippet show the shortcut inside the Save button again (`<button …>Save <kbd data-hotkey="meta+s">Ctrl+S</kbd></button>`).
  - **Repo-wide**
    - `vanilla-breeze.dev` links, QR codes and copy buttons now use `vanilla-breeze.com`. The link checker also checks `<browser-window src>` and `<include-file src>` demo embeds, which found four doc pages whose demos had never existed (now added).
    - `flow-diagram` and `site-map` crossfade timing no longer retimes every view transition on the page.
    - win9x and nes dialogs keep a visible edge in forced-colors mode; accordion-wc and settings-panel chevrons point the right way in RTL.

## [0.5.0] - 2026-11-02

0.5.0 is the first element quality release, covering every A, B and C element. Components rebuild cleanly when moved or re-populated, keyboard and screen-reader access is fixed across the C components, and several XSS paths are closed. Themes gain a `--btn-border-width` hook, reach 4.5:1 contrast for links and outline buttons, and paint their own dark-mode backgrounds. It includes breaking changes, listed under Changed: C-component API cleanups, `<cite data-variant="quoted">`, removed legacy link and abbr classes, and the brand demo and stale per-accent theme files are no longer in the package.

### Added

- **`--btn-border-width` button hook.** Themes set the border width through it
  (plus `border-color`/`border-style`) instead of a `border` shorthand. The
  padding gives the width back, so primary, secondary and ghost buttons are the
  same height in every theme. All bordered themes and packs use it.

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

- **Brand demo themes are no longer in the package.** `themes/anthropic.css`,
  `themes/ibm.css`, `themes/mcdonalds.css` and `themes/starbucks.css` were
  demonstrations of building a theme from a brand, not library themes. They
  now live with the alpenglow demo (`/docs/alpenglow/themes/`) and are no
  longer in `dist/cdn/themes/` or the theme manifest.

- **Stale per-accent theme files removed from the package.**
  `themes/{ocean,sunset,forest,rose,lavender,coral,amber,indigo,slate,emerald}.css`
  were leftovers from before accents were bundled. Use `data-accent="ocean"`
  (and so on) with the main bundle instead.

- **Breaking API changes from the C-element review.**
  - **`<comment-thread>`:** `addComment()`/`updateComment()` take `bodyText` (set as text) or `bodyHtml` (sanitized) instead of `body`. Author links are kept only for http(s) and relative URLs.
  - **`<comment-box>` submit:** the event detail offers `waitUntil(promise)`. The box stays busy, clears when the promise resolves and keeps the text when it rejects. `comment-thread:reply` follows the same pattern and is now cancelable.
  - **`<chat-input>`:**
    - Inside a form it now submits the form (Enter or the send button) instead of firing `chat-input:send`.
    - The send detail is `{ message }`.
    - `--chat-input-radius` is removed.
  - **`<chat-window>`:** user messages are always shown as plain text. `resolveTyping()` fills a typing placeholder.
  - **`<card-list>`:**
    - `setItems()`/`getItems()` are removed; use `.items`.
    - URL attributes bound from data must be safe URLs, and `on*`/`style` are never written.
    - It follows the global `data-layout` system.
  - **`<popularity-index>`:** the analytics endpoint moves to `analytics-src`.
  - **Change events:** `<compare-surface>` and `<content-lens>` no longer fire them during setup or when changed from script.
  - **`<content-swap>`:** without explicit triggers, it adds a real toggle button instead of turning the container into a button.
  - **`<color-picker>`:** `required` is removed. `name` and `disabled` on the inner input move to the host.
  - **`<context-menu>`:** `select` detail is `{ item, value }`.
  - **`<change-set>`:** gains `controls="none"`.
  - **`<calendar-wc>`:** month titles are plain text unless `data-heading-level` is set.
  - **`<calendar-event>`:** is a block (titles ellipsize). It shows a pointer only when it contains a link or button.
  - **Overlapping clusters:** `data-layout-overlap` keeps source order (the "+N" chip comes last).
  - **`<cite>`:** the quoted variant is `data-variant="quoted"` (was `class="quoted"`), matching `a` and `abbr`. Its quotation marks follow the language, as `<q>` does: «…» in French, „…" in German.

- **`<brand-mark>` never modifies its content.** Authored children (an
  `<img>`, an `<svg>`, text, a tagline) are left exactly as written. `src`
  adds one owned `<picture>`; image-only vs wordmark is CSS, with the
  authored text kept as the accessible name. `alt` and `height` now work,
  `src-compact` is implemented (plus `compact-media`), and the host no
  longer gets an `aria-label`. New `api.json`.
- **Blockquote attribution belongs outside the quote.** `figure.quote` +
  `figcaption` is the documented pattern; `blockquote > footer` /
  `> cite` still style as a legacy attribution line, and only as direct
  children.

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

- **Themes.**
  - Links, outline buttons and primary-button labels reach 4.5:1 contrast in every theme and accent, in both modes (art-deco, claymorphism, cyber, journal, nord, solarized, super2026, tokyo-night, dusk, bauhaus, high-noon, dawn, cottagecore; forest, sunset, coral and amber accents). Brand primaries keep their brand value; only `--color-interactive` changed.
  - Dark mode paints each theme's own `--color-background` as the page background. A fixed VB blue-black used to cover it in most themes (solarized dark showed blue-black, not #002b36). The light-only a11y-dyslexia palette declares `color-scheme: light`, so in dark mode it is a readable cream page instead of dark text on a dark page.
  - Theme blockquote glyphs are silent to screen readers and sit on the inline-start side in right-to-left text, with logical padding.
  - A breadcrumb's linked current crumb is plain current text, not the nav current-page pill (starbucks pill, neumorphism inset, wrong colour elsewhere).
- **Range sliders.** The value bubble and datalist labels are positioned in CSS, so they track the thumb after late layout changes and resizes. The chat `[data-bubble]` shape no longer narrows range inputs to 75%.

- **Security and data loss.**
  - `<card-list>` no longer writes `javascript:` URLs from data.
  - `<comment-thread>` no longer injects unsanitized HTML or `javascript:` author links.
  - `<chat-window>` no longer parses typed text as HTML.
  - `ConsentBanner.getConsent()` honours expiry and the docs await it. Before, the sample never started analytics.
- **Components that broke when moved or re-populated.** These now rebuild cleanly on reconnect and on data setters: `<calendar-wc>`, `<color-picker>`, `<command-palette>`, `<context-menu>`, `<comment-thread>`, `<comment-box>`, `<carousel-wc>` and `<card-list>`. Before, they duplicated their UI, doubled their listeners, or left actions dead.
- **Keyboard and screen-reader access in the C components.**
  - **`<content-swap>`:** explicit triggers work.
  - **`<chat-input>`:**
    - Confirming input-method composition with Enter no longer sends.
    - It has a focus ring.
    - `disabled` and `maxlength` are enforced.
  - **`<context-menu>`:**
    - Opens with Shift+F10 or the Menu key.
    - Reports the chosen item.
    - Uses correct menu roles.
  - **`<command-palette>`:** announces the active option.
  - **`<color-picker>`:**
    - Its button is named by the field's label.
    - Escape closes it.
  - **`<calendar-wc>`:**
    - Arrow keys move from the focused day.
    - The day detail opens from the keyboard.
    - Multi-day events no longer lose a day across daylight-saving changes.
    - `data-year-range` sets how many years the year select lists either side of the current year (default 10).
  - **`<carousel-wc>`:**
    - Autoplay has a pause/play button.
    - It stops announcing every slide while rotating.
  - **`<chart-wc>`:**
    - The fallback table stays available to screen readers.
    - Charts print as a table.
    - Charts built from data get a generated table.
- **CSS for the C elements.**
  - **Invalid rule removed:** the `translate: no` rule did nothing; use the HTML `translate="no"` attribute.
  - **`<pre>`:**
    - Bare `<pre>` no longer wraps ASCII art.
    - `<pre><samp>` gets the code-block treatment.
  - **Inline `<code>`:** wraps long identifiers.
  - **Editorial theme:** no longer turns inline citations into block lines.
  - **Cover hero:** headers span the full width.
  - **`<compare-surface>`:** works in right-to-left layouts and reacts to `position` changes.
  - **`<content-lens>`:** chips show keyboard focus.
- **C element doc pages.**
  - Removed false screen-reader claims (cite, code, colgroup, caption, chat-thread, comment-thread).
  - Layout pages show the `data-layout` attribute form.
  - Canvas demos follow the theme.
  - The carousel transitions demo meets 4.5:1 text contrast on every slide.
  - colgroup documents `scope="colgroup"`.
  - Every C component's `api.json` now matches its runtime.

- **`<bdo dir="rtl">` reverses text again.** VB's own `unicode-bidi`
  rules outranked the element and weakened the browser's isolation on
  every `[dir]` element; they are removed and the UA defaults apply.
- **`data-loading` buttons keep the submitter.** The button was disabled
  inside the submit event, dropping its `name`/`value` from the form data;
  it now uses `aria-disabled` and swallows repeat activations, only the
  button that submitted shows the spinner, and spinner-only keeps its
  label as hidden text.
- **Buttons.** `a.button` follows `--btn-color` (a gold link button was
  white on gold); `input[type=submit|button|reset]` match `<button>`; all
  variants share a transparent border (equal heights, visible in forced
  colours); disabled buttons ignore hover, hover is skipped on touch;
  `aria-disabled` and `aria-pressed` are styled; icon-only buttons are
  square; the focus ring follows the `--focus-ring-*` tokens.
- **`<bread-crumb>` and `nav.breadcrumb`.** Separators are silent to
  screen readers, `data-truncated` shows an ellipsis, collapsed trails get
  a real "Show full path" button, `<nav aria-label="Breadcrumb">` is the
  canonical markup (no duplicate landmark), JSON-LD resolves relative
  hrefs, and path segments are decoded.
- **B-element doc pages.** `<base>` and `<body>` are written (they were
  placeholders); `<bdi>`/`<bdo>` guidance and demos corrected; `<b>` and
  `<strong>` no longer claim screen readers announce them; `<br>` and
  button pages updated.

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
