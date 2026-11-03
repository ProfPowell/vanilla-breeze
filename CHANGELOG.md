# Changelog

All notable changes to Vanilla Breeze will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **D-element review.**
  - **drag-surface**: `data-move-controls` renders per-item Move buttons: up/down (left/right for horizontal, RTL-aware) and "Move <item> to <surface>" for adjacent grouped surfaces. This is the single-pointer alternative to dragging (WCAG 2.5.7). The buttons fire the same `reorder`/`transfer` events and keep focus, using `aria-disabled` at the ends of the list. New `disabled` property reflects the attribute.

### Changed

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
