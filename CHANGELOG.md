# Changelog

All notable changes to Vanilla Breeze will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed
- **Themes ship real italics for their body typefaces.** Inter, Nunito, DM Sans, Josefin Sans, Exo 2, Lora, Merriweather, JetBrains Mono, Barlow Condensed and DM Serif Display now include their italic files, so `<em>` and `<cite>` are drawn by the typeface and not slanted by the browser. An italic file is downloaded only when a page has italic text. The package grows by about 1.1 MB.
- **Integration guide pages use the full docs canvas**, like the other docs pages, in place of a narrower fixed column.
- **`<icon-wc>`'s `basePath` property returns an absolute URL** when it is derived from the bundle location.

### Added
- **Grid Identity guide: two purpose-built demos.** A landing page that labels its named areas and shows that source order does not move them, and a three-tier page that highlights the page, main and component tiers in turn.

### Fixed
- **Icons and packs load from where the bundle was loaded.** A page that loads Vanilla Breeze from a CDN or a sub-path requested `/cdn/icons/...` and `/cdn/packs/...` on its own origin and got 404s, so `<icon-wc>`, `[data-icon]` and the icons inside `<theme-picker>` were blank unless `data-icon-path` was set. They now resolve beside the loaded script. `data-icon-path` and `base-path` still override.

## [0.6.2] - 2026-11-11

0.6.2 makes every theme ship its own fonts: no theme calls Google Fonts, themes load the typefaces they name, and eight themes gain a face. Headings read `--font-heading`, so a theme or page can set a separate heading typeface. `<theme-picker>`, `<site-index>`, `<time-index>` and `<glossary-index>` are simplified, with breaking changes marked under Changed, and `<site-search>`, `<mobile-menu>` and `<notification-wc>` work better on a phone. The docs gain a Typefaces guide, a regrouped Guide section, rewritten Principles, Typography and Grid Identity pages, and integration guides for sixteen related web components. The package grows to about 6.5 MB because of the font files.

### Changed

- **Grid Identity guide rebuilt.** The page opens with the idea in one example, replaces the tier cards with a table, and gains a live demo that switches one page between all eight templates and shows the grid area each region receives. It now says which elements each template places, and that an element with no area (an `<aside>` under `sidebar-left`) collapses into a zero-width track, and that a `hidden` element still keeps its column. The regions and media sections get focused demos. Every demo window was 265px tall and showed little of the layout; they now have proper heights. The catch-all "Quick Reference" is split into Modifiers, Container names, Accessibility and Related.
- **Integrations section rebuilt.** The Integrations page lists every related package: sixteen standalone web components, the two packages built on Vanilla Breeze (`vb-design-system`, `vb-project-planning`), Cook and Vanilla Press. It gains a breadcrumb and section links and uses the full page width like the other Resources pages; the starter-kit contents are one table, and the kit location is corrected to `demos/integrations/` in the repository. All sixteen component guides now share one structure (at a glance, install, demo, usage, reference, theming with Vanilla Breeze, accessibility, related) and were checked against the current published packages. Five guides are new: `blink-wc`, `border-wc`, `http-component`, `json-viewer` and `pattern-grid`, each with a demo. Corrections include: `bg-wc` documented 0.2.1 and is now at 0.5.1 (199 presets, a third renderer, an open-ended `data-background-*` binder); `code-block` and `browser-window` are not bundled into Vanilla Breeze (the docs site loads them); `epub-reader` renders in light DOM and persists reading state; and several attribute, method and token names that no longer matched the code. A card that leaves the site shows its arrow after the title.
- **Themes ship their own fonts; no theme calls Google Fonts.** Nineteen themes loaded their typefaces from Google Fonts with an `@import`. They now use font files in the package (`dist/cdn/fonts/`, Latin and Latin Extended, each family with its SIL Open Font License text beside it), declared with `@font-face` and `font-display: swap`. A browser downloads only the files for the theme in use, and a Content Security Policy needs `font-src 'self'` (or the origin that serves Vanilla Breeze) and nothing else. The Kawaii pack's Nunito and the wireframe fonts in the dev stylesheet moved the same way. The Icons pack still loads Material Symbols from Google. The files come from pinned Fontsource packages through `scripts/vendor-fonts.mjs`. Newsreader in the Journal theme no longer varies its optical size. The package grows by about 2.2 MB.
- **Eight themes gain a typeface.** Nord, Tokyo Night, Gruvbox and Rosé Pine set text in Inter and code in JetBrains Mono. Four themes gain a heading face through `--font-heading` and keep system fonts for text: Midnight and Vaporwave (Orbitron), Dusk (Fraunces) and High Noon (Big Shoulders Display). The Typefaces guide lists the faces every theme uses.
- **Themes load the fonts they name.** Ten themes put a web font first in a stack without loading it, so most readers saw the fallback: Modern, GenAI and Glassmorphism (Inter), Editorial (Playfair Display, Courier Prime), Super 2026 (Big Shoulders Display, Barlow Condensed, Space Mono), Alpha 1999 (Josefin Sans, Nunito, Share Tech Mono), Cyber and Catppuccin Mocha (JetBrains Mono), Dracula (Fira Code), Solarized and Organic (Source Code Pro). Bauhaus, Claymorphism, Cottagecore, Kawaii and the Catppuccin themes also gain the code font they named. These themes now look as designed on every device.
- **Headings read `--font-heading`.** `h1` to `h6` now use `font-family: var(--font-heading, inherit)`, so a theme, a pack or your own CSS gives every heading a separate face by setting one token. The token no longer defaults to `var(--font-sans)`: unset, a heading keeps the font of the text around it, as before. An element with its own `data-theme` clears it. The Editorial, Super 2026, Alpha 1999 and Magna themes set this token, so all six of their heading levels now use their heading face (some levels used the text font before).
- **Typography guide reviewed.** Corrected: emphasis inside a blockquote turns upright (the page said it became medium weight); hyphenation needs `lang` on the article or any ancestor, not only on `<html>`; the vertical-rhythm example used a `.prose` class that does not exist. Added: a Foundations section (fonts, scale, line height, measure, text wrapping), paragraph classes, the prose reading defaults, drop-cap tokens, the `--sep-breadcrumb-rtl` token and the core text utility classes (`all-caps`, `digits`, `display-heading`, `display-subheading`, `prose-indented`), which had no documentation. Sections now link to the element, attribute and token pages that hold the reference, and fifteen of those pages link back to the matching section. The opening demo is rebuilt as one short article that uses the features in context, followed by a grid of the smaller ones; it no longer stacks four headings, cites a past year or repeats the corrected claims.
- **Guide regrouped; "Concepts" dissolved.** The Concepts section mixed rationale, service reference, content conventions and craft notes, and its landing page and sidebar listed different subsets of it. Its pages now sit in five named groups, each at a matching URL: Architecture (`/docs/architecture/`), Content Management (`/docs/content-management/`), Extensibility (`/docs/extensibility/`), Interaction (`/docs/interaction/`) and Process (`/docs/process/`). Gestures, Debugging, Prototyping and Analytics moved into those groups, and Shadows joined Styling at `/docs/shadows/`. Every guide page is now in the sidebar. The old URLs are gone (no redirects), as are the Concepts landing page and `/docs/bundles/`, a stale copy of the Packs page. Moved pages keep their last-changed dates.
- **Principles page rewritten.** It opens with a statement of what the framework is, sets out one grammar for HTML, CSS and JavaScript (element, class, attribute, `data-*` state) with the rule for when an attribute carries `data-`, lists eight principles, names the check that enforces each, and says what the library will not do. The arguments it shared with Architecture Decisions now live only there.
- **Sitemap rebuilt.** The docs site's sitemap is generated at build time from the pages that exist (it was a hand-kept list of about 45 links on a 500-page site): one headed block per header section with its page count, groups side by side, and the large branches (elements, attributes) collapsed with their counts. `<site-map>` in its default mode now styles its nav as an outline (text links, a leading disclosure arrow, no accordion borders or centred summaries), puts the expand/collapse buttons directly above the tree as small secondary buttons, and takes `data-label-expand` / `data-label-collapse` / `data-label-controls`. New styling hooks: `data-sitemap`, `data-sitemap-section`, `data-sitemap-leaves`, `data-sitemap-label`, `data-sitemap-updated`.
- **Real page dates in both sitemaps.** `scripts/generate-page-dates.mjs` records when each docs page last changed, from git history (ignoring sweeps that touch more than 25 pages at once). The sitemap page shows the date beside pages changed in the week up to the newest change, a count of changed pages on each collapsed branch and the last change on each section. `sitemap.xml` now carries those dates as `<lastmod>` (it stamped every URL with the build date) and no longer emits `changefreq` or `priority`.
- **`<site-index>` reduced to one filter box.** The scope and sort selects are gone, along with the `sort` attribute and the `data-label-scope*` / `data-label-sort*` strings: the filter matches terms and page titles by default (`filter="topic"` for terms only), and letters always stay in order. Letter headings count terms ("4 terms", `data-label-terms` / `data-label-terms-one`), not references, and the per-term `(N)` badges are removed. The jump strip is a row of equal letter cells with the term count as a hover hint, references render as ordinary links, and the index flows into as many columns as fit.
- **Docs site: Explore menu, Releases and a version badge** — The header's "Explore" menu is renamed "Resources" (snippets, patterns, demos, tools, integrations). "Reference" becomes the new "Explore": the ways into the content other than search (Keyword Index, Glossary, Topics, Sitemap; Topics was previously unlinked). The changelog leaves that menu and becomes "Releases", reached from a version badge beside the site name. The Releases page states the latest release and its install command at the top and marks it in the list.
- **glossary-index: permalinks are opt-in** (breaking) — The copy-link "#" beside each term is now added only with the `permalinks` attribute. It was hidden until hover, so a page describing it pointed at nothing, and a glossary is mostly linked to rather than from.
- **time-index: order select instead of a sort toggle** (breaking) — The lone "Oldest first" toggle button read as the current state rather than the action. It is now a labelled select, "Order: Newest first / Oldest first", that always names the order in force; the version select gains a visible label. `data-label-sort` is replaced by `data-label-order`, `data-label-newest`, `data-label-oldest` and `data-label-version`.
- **theme-picker: reduced to color mode and theme** (breaking) — The picker now has two controls: the mode buttons and one grouped `<select>` of every theme, in a popover about 200px tall (it was about 807px). `themes="default modern swiss"` limits the list to the themes a site offers, and `swatches` shows that short list as colour swatches, with the name of the hovered or current theme beside the legend. `compact` is gone: the select is the only default. Removed from the picker: color accents, sizing, accessibility themes, motion/sound toggles and the per-theme token download links, with their `data-label-accent|style|featured|more-themes|a11y|sizing|extensions|download` strings and the `theme-picker:dtcg-download` event. Sizing, accessibility themes and effects are `<settings-panel>`'s; accents remain available through `ThemeManager.setAccent()` and `data-accent`.

### Added

- **Typefaces guide** — A new page in the Styling group covers the system font stacks, the font slots and which of them the library reads, loading your own font, `--font-size-adjust`, the three font packs, and how themes treat fonts. Three live demos show the system stacks, the heading slot and the Foundation and Display packs. Typography, Tokens, Themes, the headings page and the font pack pages link to it.
- **site-search: browse links** — An authored `<nav data-browse>` child (links to an index, a glossary, a sitemap) is shown in the dialog under a "Browse instead" heading while there are no results: before a query and when a query finds nothing. It never shows in the page itself.
- **mobile-menu: `data-mobile-menu` moves a header tool into the panel** — A sibling of `<mobile-menu>` marked `data-mobile-menu` (one element that should exist once, such as a notification bell) is moved into the panel in mobile mode, at the `data-mobile-menu-slot` element when there is one, and back to its place on leaving it. If the tool carries `data-unread`, the menu button shows a dot. The docs site's bell now collapses into the menu this way.
- **notification-wc: `data-unread`, and a sheet on small screens** — The element reflects its unread count as `data-unread`. On a screen narrower than 37.5rem, or when the bell is inside a popover such as a mobile menu, the panel opens as a sheet in the top layer (full width from the top edge on a phone, centred otherwise) with a backdrop and a close button (`data-label-close`), instead of a 360px dropdown that would be clipped or squeezed. The menu behind it stays open.
- **site-search: close button, and a layout that fits a phone** — The Esc key cap beside the input is now a button (`data-label-dismiss`). Below 37.5rem it becomes a touch-sized ×, the keyboard hints are dropped from the footer, and the input row is tighter, so nothing wraps or truncates at 300px.
- **site-search: `data-label-count-more`** — When the index matches more results than the eight listed, the status reads "8 of 23 results" (`{count}` listed, `{total}` matched) instead of reporting the cap as the count.

### Fixed

- **Sitemap link text** showed backslashes for a page title with escaped quotes (`data-effect=\"animate-image\"`).
- **Docs site Topics pages.** The pressed sort button was coral (it used the accent token and several tokens that do not exist); the sort control is now one joined row in the interactive colour with its label on the same line, and is named for what it sorts by (Name, Most articles, Latest, Oldest). The list is a grid with a one-line summary of each topic between its name and its article count and date. On a topic page the Includes / Related links read as one sentence (they were stacked blocks with stray commas), article titles are a sensible size and summaries are no longer escaped twice.
- **Docs site glossary-term preview** stayed where it opened while the page scrolled away under it. It now closes on scroll or resize, and a term whose entry is on the current page (the glossary's own Related links) jumps straight to it.
- **page-tools: floating button collided with a fab-stack** — On narrow screens the collapsed toolbar's button took the bottom corner for itself and sat on top of a `<fab-stack>` there (the docs site's settings gear). When the page has a `<fab-stack>` the button now joins it as its last child and returns home when the toolbar expands; its panel opens just above the button wherever the stack puts it, positioned before it paints. In the stack the button takes its neighbours' size and look.
- **drop-down: split-toggle hover hid the chevron on a filled item** — Hovering the chevron button of the current nav item painted a fixed light-grey square under a white chevron. The hover is now a tint of the chevron's own colour, so it shows on any fill.
- **Glossary: a targeted term drew two overlapping boxes** — Arriving at a term by its anchor outlined the term and its definition separately, with different edges, so the outlines crossed. The term and definition now share one left edge and highlight as a single tinted block with an accent bar. Letter groups have space between them, the sticky letter heading sits below a sticky site header instead of under it, and definitions keep a readable measure.
- **glossary-index: wrong letter marked in the jump strip** — A short first section never entered the observer's band, so at the top of the page the strip marked the second letter. The current letter is now the last section whose top has passed a third of the viewport, else the first.
- **Docs site: page intros broken by tags in the description** — Twelve pages had a raw tag in their frontmatter description ("First mention in `<dfn>`, …"), which the layout prints unescaped as the intro paragraph: the tag became a real element and its name vanished from the sentence. Seven had a double quote that cut the meta description short. Both are escaped or reworded, with a unit test guarding them.
- **fab-stack: a hidden back-to-top left a hole** — A `[data-back-to-top]` that is not showing was only made invisible, so it still took a slot in the stack. It now takes no room until it shows.
- **site-search: stray dot in the dialog** — The status line used the class `status`, which is also the global status-dot pattern, so a "●" showed under the input (and before the result count). The line is now `search-status`, takes no room while empty, and the empty dialog has one divider instead of two. `<emoji-picker>`'s hidden live region drops the same dot.

## [0.6.1] - 2026-11-09

0.6.1 fixes navigation and button hover colours (the current nav item stays readable while hovered or open, buttons inside a nav keep their own colours, and a button's label always contrasts with its hover and pressed fill), marks the current section in `<nav-bar>` when the page sits below a menu entry, clears `<form-field>` errors on form reset, and repairs five `<chart-wc>` rendering bugs. The Tutorials section is rewritten as four step-by-step builds with a live preview after every step.

### Added

- **nav-bar: current section** — When no `data-nav-link` link matches the location but a link nested beside one does (a menu item in the same `<drop-down>` or `<li>`), the trigger gets `aria-current="true"` and the current-item styling. `.current` stays `null`.

### Changed

- **Tutorials rewritten** — The hub lists the four tutorials as numbered link cards and the four layers as a plain list. Each tutorial (landing page, dashboard, contact form, blog post) now starts from a file you create, shows the page after every step in its own demo, says what to check, and ends with exercises and a previous/next pager. Install snippets in Quick Start and the tutorials pin `@0.6`.

### Fixed

- **nav: current item on hover** — A current item in `nav.pills` whose `<drop-down hover>` opens on hover kept its white label but lost its fill to the hover background, so the label vanished. The current fill now holds while hovered or open (mixed slightly toward the text colour as feedback).
- **nav: `.button` inside `<nav>`** — `nav a:hover` no longer applies to `.button`, which took the nav hover text colour on its own hover fill (blue on darker blue in the default theme).
- **button: label follows the painted fill** — The label colour is computed from the fill being painted (rest, hover, active or pressed), not from the rest colour. In dark mode a black label on the lighter primary dropped to about 3.6:1 on the darker hover fill; it now flips to white there.
- **form-field: form reset** — A reset returns each field to neutral. An emptied field used to keep `data-valid` (the green tick) or a stale error. A cancelled reset changes nothing.
- **page-toc without JavaScript** — An empty, not-yet-defined `<page-toc>` no longer takes a slot in a stack or prose rhythm.
- **chart-wc: legend and tooltip switches** — Both have always been on by default, while the docs said the `data-legend` and `data-tooltip` attributes enabled them; the attributes did nothing. The default stays on, and `data-legend="false"` / `data-tooltip="false"` now turn each off (on `<chart-wc>` or its source `<table>`), winning over `data-config`. Moving the mouse over a column, bar, line or area chart whose legend was off threw on every move; the tooltip now works without a legend.
- **chart-wc: legend in a narrow chart** — In a chart 400px wide or less the legend moves under the plot as a wrapping row. The rule that was meant to do this was a container query styling its own container, so the legend stayed beside the plot and squeezed it.
- **chart-wc: last x-axis label on line and area charts** — The final category lost its label, tick and guide line to a rounding error (seven categories drew six labels). With more than 15 categories the labels now sit on the points they name.
- **chart-wc: dark mode** — Title, axis labels, grid lines, ticks and axis follow the theme (`--color-text`, `--color-text-muted`, `--color-border`, `--color-border-strong`) instead of fixed greys, which left near-white grid lines and a dark grey title on a dark surface. The `--chart-*` properties still override them.
- **layout-card in a list grid** — A card that is the only child of an `<li>` in `data-layout="grid"` or `<layout-grid>` now fills the item, so every card in a row matches the tallest, as bare cards in a grid already do. Lists of cards (`<ul data-layout="grid"><li><layout-card>`) had uneven heights since the guides moved to list markup.
- **Docs site** — The element and attribute indexes were unstyled in 0.6.0, and their search and type filters matched nothing: the index grids are written by `site/plugins/generate-indexes.js`, which still emitted the class names the class clean-up had retired. The plugin now writes the templates' markup (`.index-heading`, `.index-entry`, `<layout-badge>`), and a unit test keeps the two in step. The kitchen-sink "Jump to Section" box and the tokens spacing chart are restored; `tests/visual/site-index-pages.spec.js` screenshots these regions.

## [0.6.0] - 2026-11-08

0.6.0 adds themes set by the site (`<html data-theme-source="site">`: the page's brand wins over a visitor's stored brand, and the theme manager keeps the ids it did not write) and scoped themes (a theme on an `<article>` or `<main>` gets its own derived colors, fonts and content rules). It also carries the native attributes review, a docs-wide class clean-up (samples and demos use VB primitives instead of classes VB never styled, enforced by `lint:doc-classes`), fixes for skeleton loading, description lists, `nav.steps` and the wizard summary, and one breaking rename: the native audio playlist is enabled by `data-audio-playlist` instead of `.audio-standalone`. The element and attribute reviews are listed below.

### Security

- **Native attributes review.**
  - **Analytics outbound links (privacy)** — The hyperlink-audit `ping` is now set at click time and only when the visitor has not opted out; it used to be written when the link was wired, so opted-out visitors (vb_optout, GPC, DNT, withdrawn consent) still sent pings in Chrome and Safari. Authored `ping` attributes are untouched.
- **Form attribute review.**
  - **data-autosave / data-wizard-persist** — Drafts go through one shared privacy filter (`isPersistable()`, `src/utils/_persist-filter.js`). Never saved or restored: `type=password|hidden|file`, buttons (`<button>`, `input[type=submit|button|reset|image]`), `<output>` / `<fieldset>`, `autocomplete="off"`, the autocomplete tokens `cc-number`, `cc-csc`, `cc-exp*`, `one-time-code`, `new-password` and `current-password`, and anything inside `data-autosave-ignore`. Before, autosave stored hidden inputs (CSRF tokens, record versions) and restored stale values over fresh server ones, and the wizard persisted the whole `FormData`, passwords included.
  - **data-upload** — Dropped files are filtered against the input's `accept` (the picker's rules: `.ext`, `type/*`, exact MIME, case-insensitive); before, a drop bypassed `accept`. The `accept` hint is built with `textContent` instead of being interpolated into `innerHTML`.
- **U–Y-element review.**
  - **version-switcher** — Entries whose `url` is a `javascript:` / `vbscript:` / `data:` URL are dropped (with a `version-switcher:error`); an unsafe `versionUrl` drops only the changelog link, and the banner's latest pointer is a link only for a safe url. `swap` and `diff` only fetch same-origin URLs, and the swapped region is inserted through `sanitizeToFragment`, so inline `on*` handlers never go live.
  - **sanitize-html** — The untrusted profile also strips `data-versions` from custom elements, so user content cannot carry a version-switcher entry list.
- **T-element review.**
  - **time-index** — The `updates-src` feed is built with DOM APIs. Titles are always text, and a link is kept only when its `href`/`url` resolves to http(s) through `new URL(href, baseURI)` (relative is fine); `javascript:`, `data:` and other schemes are dropped, as are items with no title. Before, `title`, `href` and `modified` from the JSON went straight into `innerHTML`, so a compromised or third-party feed could inject script. Version `<option>`s are built with `new Option()` instead of re-parsing `.version-tag` text as HTML.
  - **topic-map / trust-filter** — Page and result links are scheme-checked (http(s) and relative only, the author-index `safeHref` pattern); `javascript:` / `data:` URLs from `src`, `data-lens-src` or `.data` render as plain text. Both build their output with DOM APIs, and load errors show a generic message (the URL and detail go to `console.warn`).
- **S-element review.**
  - **site-search** — Results are built with DOM APIs. Page titles render as text (Pagefind does not escape `meta.title`, and docs titles such as `<table>` rendered as live elements), excerpts keep only Pagefind's `<mark>` highlights, and result URLs must be same-origin http(s).
  - **social-embed** — Providers no longer insert oEmbed HTML or third-party script. X, Instagram, Bluesky and Mastodon render a sandboxed iframe (`sandbox`, `referrerpolicy="strict-origin"`, `loading="lazy"`, `title`, minimal `allow`) whose URL is rebuilt from the post URL after `new URL()` parsing, https only, with an exact hostname allowlist. This closes attribute injection through crafted X/Instagram URLs (unanchored regexes interpolated into `innerHTML`) and script execution from a hostile Mastodon instance's oEmbed `html`. Mastodon (any host) gets the tightest sandbox; frame resize messages are accepted only from that frame's window and origin.
  - **sanitize-html** — The untrusted profile unwraps `<social-embed>`, `<youtube-player>` and `<geo-map>` to their sanitized fallback children, and strips `src`, `src-dark`, `data-src`, `url`, `endpoint` and `tile-url` from every other custom element (`<audio-player>`, `<video-player>`, `<image-map>` and `<brand-mark>` keep a URL-checked `src`). User content in markdown-viewer, chat-window, comment-thread, card-list etc. can no longer pull in third-party frames, fetch remote data or point chat/summary components at an exfiltration endpoint. The include-file fragment profile is unchanged.
  - **site-index / site-map** — `src` JSON is rendered with DOM APIs and links are scheme-checked: only http(s), relative and fragment hrefs become links (site-index renders anything else, such as `javascript:`, as text; site-map drops it).
  - **share-wc** — `label` is set as text, not HTML.
  - **youtube-player** — `video-id` must match the YouTube id alphabet (anything else warns and renders nothing), and the title is escaped before it goes into the play button and iframe markup.
- **Q+R-element review.**
  - **recently-visited** — Tracking is opt-in. Before, every page of every site that loaded the VB bundle was written to the reader's history. The tracker now records a page only when it has `<meta name="vb:track-history" content="on">` or contains a `<recently-visited>` element. It never records under `<html data-vb-no-track>` (shared with analytics), under a per-page `<meta name="vb:no-track-history">`, or while the reader has paused it. Query strings are stripped before storing (`<meta name="vb:track-history-params" content="q page">` keeps the listed ones), and entries expire after 30 days. Stored URLs are resolved against `location.origin`, a leading `//` or `/\` is collapsed, and only same-origin http(s) paths are kept and rendered, so a crafted `https://site//evil.example/x` can no longer become an off-site protocol-relative link. The list is built with DOM APIs, so titles are always text.
- **P-element review.**
  - **page-info** — Auto mode no longer builds its panel from `<meta>` values with `innerHTML`; it uses DOM nodes and text, so page metadata cannot inject markup. Author, license, version and concept links render only when they resolve to `http:`/`https:` (a `javascript:` URL becomes plain text).
  - **popularity-index** — Entry URLs are restricted to http(s) and same-origin paths (`javascript:`, `data:` and `//host` entries are dropped), and the list is built with DOM APIs. Raw error text (HTTP status, JSON parse errors) is no longer shown.
  - **page-tour / page-tools** — `data-action-hint` (page-tour) is rendered as text and the card is built with DOM APIs; `data-fab-icon` (page-tools) is set with `setAttribute`. Neither goes through `innerHTML` any more.
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

- **Self-hosted fonts ship with the CDN build** — `dist/cdn/fonts/` (Atkinson Hyperlegible, Latin Modern Math) is committed, and `tests/unit/dist-css-urls.test.js` checks that every relative `url()` in the built CSS resolves to a file the published package contains.
- **Themes set by the site.** `<html data-theme-source="site">` makes the page's `data-theme` brand win over a visitor's stored brand (the first id is the brand, `default` is valid); the theme manager keeps every `data-theme` id it did not write (`swiss vp-site`); an authored `data-mode="light|dark"` is kept unless the visitor picks a mode; a theme whose `<link data-vb-theme>` is on the page is not fetched again. The flash-prevention snippet in the docs follows the same rules.
- **Doc class clean-up.**
  - **lint:doc-classes** — Reads same-file CSS and JS code samples, page scripts and selector-valued `data-*` attributes as definitions, keeping live `<style>` and sample CSS apart. Theme- and pack-only classes, and classes VB styles only inside another component, no longer count as VB API. Pattern and snippet demos are scanned too. A docs-page `<style>` rule that duplicates another page's local CSS or shadows a VB or docs-chrome class is flagged. The grandfathered baseline (278 pairs) is now empty.
  - **data-audio-playlist attribute page** — `/docs/attributes/data-audio-playlist/`, listed under Interaction.
  - **Autoload guard parity test** — Fails when a `utils/*-init.js` from the full barrel can't be reached from the core or autoload entry.
- **Native attributes review.**
  - **New native attribute pages** — `minlength / maxlength` (data-count counter, tooShort/tooLong messages), `min / max / step` (data-stepper, range tokens, data-range, step base), `accept` (data-upload drop filtering, `capture`, not to be confused with `data-accept`), `formaction` (formaction/formmethod/formenctype/formtarget/formnovalidate and how each VB submit mode treats them), `ARIA states` (what VB styles and sets for aria-current, -pressed, -expanded, -disabled, -busy, -invalid, -sort, -selected and -keyshortcuts, with the native-first alternative for each), `commandfor` (invoker commands for dialogs, popovers and custom `--` commands, the `command` event, VB's command-palette discovery; VB does not polyfill), `interestfor` (interest invokers with `popover="hint"`, delays set on the invoker, events, VB's polyfill and its ARIA wiring) and `inert` (what it does and doesn't do, VB's `tr[inert]` style and the features that set it, and how it differs from hidden, disabled, aria-disabled and modal dialogs).
  - **data-markdown-editable page** — `/docs/attributes/data-markdown-editable/` documents the inline markdown editor (text elements and textarea/input with `data-preview`, the `markdown-editable:change` event, styling hooks, sanitising, and the role and Enter-key gotchas), with a new textarea preview demo.
  - **lint:doc-classes** — New `npm run lint:doc-classes` (in CI and `npm run lint`): every class in docs pages and demos, in live markup and code samples, must be defined by VB (src CSS, classes src JS reads, the docs chrome stylesheet, or the page's own `<style>`) or be allowlisted with a reason in `scripts/lint-doc-classes.allow.txt`. The 278 undefined uses that already existed (mostly pattern and snippet pages) are grandfathered per file in `scripts/lint-doc-classes.baseline.json`, so new ones fail and the debt can only shrink.
  - **Syntax reference** — `admin/reference/syntax.md` has a "Native attributes VB styles/enhances" table, by group, with the files behind each hook.
- **Utility attributes review.**
  - **Shared announcer** — `src/lib/announce.js`: `announce(message, { politeness, root })` keeps one visually hidden live region per politeness per document on `<body>` (`[data-vb-announcer]`), clears it and then writes, so repeats are announced. `readLabel(el, name, fallback, values)` looks up `data-label-*` on the element or an ancestor. data-copy (and every `copyText()` / `copyRich()` / `pasteFromClipboard()` caller), data-math, data-spoiler, data-sortable, data-paged, highlights and animate-image use it instead of their own live regions. Failures are announced assertively, everything else politely.
  - **Single-key shortcuts preference (WCAG 2.1.4)** — `<settings-panel>` → Accessibility has a "Single-Key Shortcuts" toggle (`data-label-char-shortcuts`). It is stored as `vb:settings:extensions` `charShortcuts` and applied as `<html data-char-shortcuts="off">`; authors may set the attribute too. While it is off, the shared hotkey binder skips every unscoped single-character shortcut: `data-hotkey` actions, `<short-cuts>`'s `?` and any component using `bindHotkey()`. `<short-cuts>` leaves those shortcuts out of its list. New `src/lib/char-shortcuts.js` restores the stored choice on import, and the docs-site head script restores it before paint. `<theme-picker>` keeps the preference in the shared extensions record, and Reset in settings-panel returns to the page's authored state.
  - **data-hotkey** — New `data-hotkey-scope` (selector): the shortcut is active only while focus is inside that region, and stays on when single-key shortcuts are off. Bound elements get `aria-keyshortcuts` (unless authored). `<context-menu>` now uses the same `toAriaKeyShortcuts()` helper, so Space, Plus and Escape are named correctly. `bindHotkey()` gains `scope` and `enabled` options.
  - **data-format-date** — `data-time-zone` sets an IANA zone for date-time values; unknown zones are ignored.
  - **data-format-number** — `data-fraction-digits` (0–20) fixes decimal places for any style. The ticker uses it too.
  - **Localisable strings** — `data-label-*` sets, read from the element or an ancestor: data-copy (`copied`, `pasted`, `copy-failed`, `paste-failed`), data-math (`copy`, `copied`, `copy-failed`), data-spoiler (`spoiler-reveal`, `spoiler-hide`, `spoiler-revealed`, `spoiler`), animate-image (`animation-pause` with an `{alt}` token), data-sortable (`sorted`) and data-paged (the `<pager-wc>` set plus `showing`).
  - **data-spoiler** — `data-spoiler-print="hidden"` keeps a concealed spoiler hidden in print. The default still prints it revealed.
  - **View transitions** — `view-transitions.css` ships as `dist/cdn/view-transitions.css` (built with its keyframes inlined) and as the package export `vanilla-breeze/view-transitions-css`. The previously documented `vanilla-breeze/utils/view-transitions.css` never resolved. New logical `data-vt-class="slide-forward"` and `"slide-back"` presets mirror under `dir="rtl"`.
  - **Inert definitions for CSS-only custom elements** — Every CSS-only custom element (`layout-*`, `user-avatar`, `chat-bubble`, `chat-message`, `chat-thread`, `calendar-event`, `hour-view`, `dl-item`, `fab-stack`, `loading-spinner`, `semantic-card`, `site-legal`, `site-tools`, `status-message`, `text-divider`, `token-swatch`) is defined inertly (`INERT_ELEMENTS` in `src/custom-elements/register.js`), so it matches `:defined`. reset.css's `:not(:defined)` animation suppression no longer applies to them. A unit test keeps the list in sync with `src/custom-elements/`.
  - **hide-until-ready** — The element is never hidden under `@media (scripting: none)`, and it is revealed after `--vb-until-ready-timeout` (default `3s`) if its definition never arrives. Before, a blocked module, CSP error or 404 hid it for good. The timer is a root animation that runs only while an undefined `[hide-until-ready]` element exists. Browsers without style queries do not hide at all.
  - **Docs** — New `/docs/attributes/data-toc-ignore/` page with a demo, live demos for hide-until-ready, data-select-all (count, scope), data-spoiler (effects, options) and relative dates (`format-date-relative.html`).
- **Styling and shapes review.**
  - **--color-row-stripe** — One stripe token (5% text mix) shared by `table[data-striped]` and `dl[data-striped]`.
  - **layout-badge shape hooks** — `--badge-notch` (notch depth, 0.75em, matched by padding on the notched side) and `--badge-shape-fill` (fill of the shape layer; gradients OK).
  - **Callout and bubble hooks** — `--callout-bg`, `--callout-accent` and `--callout-tail` for `data-callout`; `--bubble-bg` for `data-bubble`. Themes recolour through these instead of `background`/`border`.
  - **Counter-style hooks** — `--numbered-style` (default `decimal`) sets the counter style of every `data-numbered` / `data-section-numbers` number (headings, figures, tables, listings, § numbers), e.g. `arabic-indic`; `--numbered-sub-style` (default `lower-alpha`) letters subfigures and § sub-sections.
  - **Drop-cap hooks** — `--drop-cap-lines` (3), `--drop-cap-color` (`--color-primary`), `--drop-cap-font`, `--drop-cap-weight` (700).
  - **Shape hooks** — `--shape-edge-padding` (gap after a shaped section edge, default `--size-l`), `--shape-border-color` (`data-border-shape` frame), `--shape-morph-depth` (0.75rem).
  - **data-morph-loop / data-paused** — `data-morph-loop` opts a morph into looping; a loop pauses on hover, under `data-paused` on itself or an ancestor, and while focus is inside.
  - **Undefined-token lint** — `npm run lint:undefined-tokens` (`scripts/quality/undefined-token-lint.js`), chained into `lint:theme-tokens` and so into CI. It fails on `var(--token)` with no fallback when a core-family token is declared nowhere in `src/`, or only by a theme or pack; fallback-hidden misses are warnings. Replaces the unwired `undefined-token-audit.js`.
  - **Generated section edges** — `src/shapes/edges.css` (16 start/end pairs + RTL variants) is generated by `npm run generate:shape-edges`; `check:shape-edges` and a unit test fail when it is stale. A second unit test parses every theme and pack theme file and fails on unbalanced braces or a theme root nested inside another rule.
  - **Docs** — New attribute pages `data-callout`, `data-cutout`, `data-border-shape` and `data-shape-start` (section edges); a demo of all ten accents (`theme-accents.html`), `layout-badge-shapes.html` and `callout-kinds.html`.
- **Effects review.**
  - **data-paused** — `data-paused` on an effect element or any ancestor pauses slot loops, glitch layers, marquee children, the typewriter cursor and `typewriter.loop` (the WCAG 2.2.2 pause hook; demo `effect-pause-control.html`).
  - **data-effect-armed** — Runtime-set marker while a registered trigger is wired and waiting. Entrance and text-effect pre-states hide only under `[data-effect-armed]:not([data-effect-active])`.
  - **data-trigger** — `view-progress[:entry|exit|cover|contain]` and `scroll-progress` are registered triggers: with `animation-timeline` support they only arm (the CSS timeline drives the effect); without it they fall back to a one-shot scroll entrance. `click:replay` replays on every click.
  - **data-stagger** — CSS-time shorthand (`data-stagger="40ms"`, combinable with a mode: `grid 60ms`) sets `--vb-stagger`. `grid` mode indexes by row + column distance (cells on a diagonal share a delay).
  - **data-transition** — `slide:back` (reverse of the writing direction), physical `slide:left` / `slide:right`, and the `--view-transition-stagger` root token (default 40ms) for the new `stagger` delay ladder.
  - **data-parallax** — Value presets `data-parallax="subtle|medium|strong"` (no inline custom properties needed).
  - **data-emoji** — `data-emoji-skip` opts a subtree out; `kbd`, `samp`, `var` and `<code-block>` are skipped automatically.
  - **Effect catalogue** — The data-effect catalogue and each effect's class / custom-property tables are generated from the effect CSS and JS (`site/data/effectReference.js`, `site/plugins/generate-effect-reference.js`, drift unit test), with bundle badges from the real CSS @import and JS import graphs. `rating`, `animate-image`, `depth-pulse` and `memphis-*` are now listed.
  - **Accessible text splitting** — `src/lib/split-text.js` splits only text nodes (links, `em`, `code` survive), chunks by grapheme cluster or word via `Intl.Segmenter`, and exposes the text once to assistive technology through a visually hidden `.vb-split-sr` copy beside the `aria-hidden` animated part. Used by `reveal`, `blur-reveal`, `typewriter`, `scramble` and `flipboard`.
- **Form attribute review.**
  - **onFormReset()** — `onFormReset(el, fn)` in `src/utils/_init-registry.js` runs `fn(el)` one task after the owning form's reset has been applied; a cancelled reset (`preventDefault`) runs nothing. The value-mirroring form enhancements (range, stepper, color, mask, accept, upload, toggle-tags, strength, count, grow, show-when) re-sync through it.
  - **Persistence filter** — `isPersistable(control)` (`src/utils/_persist-filter.js`) is shared by `data-autosave` and `data-wizard-persist`. New `data-autosave-ignore` on a control or a container keeps it out of both.
  - **Form conditions** — `src/lib/form-conditions.js` is the one condition language for `data-show-when`, `data-hide-when` and `data-wizard-if`: `name`, `!name`, `name=value` / `name:value`, `name!=value` / `name:!value`, `&&`, `||`. It reads checkbox groups, `select[multiple]`, form-associated components and `form="id"` controls through `form.elements`.
  - **data-strength-min** — Opt-in `data-strength-min="fair|good|strong"` makes a weaker non-empty password invalid via `setCustomValidity` (`data-label-strength-too-weak`). Without it the meter stays advisory.
  - **data-mask-message** — Validation message for an incomplete masked value (default uses the `placeholder`).
  - **data-label-\* strings** — `data-upload`: `data-label-prompt`, `-browse`, `-files`, `-rejected`, `-single`. `data-toggle-tags`: `data-label-limit` (`{max}`). `data-strength` (on `<form-field>`): `data-label-strength-empty`, `-strength-too-weak`, `-rule-met`, `-rule-unmet`. `data-stepper`: `data-label-decrease` / `-increase` (as `<stepper-wc>`). `data-wizard`: `data-label-back`, `-next`, `-submit`, `-step`, `-status`, `-completed`. Numbers and sizes use `Intl.NumberFormat` for the closest `[lang]`.
  - **data-wizard** — `data-wizard-steps` can point at a `<progress-tracker>` (the wizard sets `data-current`, hides skipped steps' items, and a click on a completed step goes back). `data-wizard-history` pushes a history entry per user step change, so browser Back/Forward move between steps (a forward move that fails validation restores the URL). New `data-wizard-persist-hours` (default 24) and `wizard:restore` event (`{ step, fields }`).
  - **data-autosave** — New `autosave:restore` event (`{ key, fields }`). Without `<toast-msg>` the restore is announced in a visually hidden `role="status"` region (`[data-autosave-status]`).
  - **data-accept** — New `letters` preset (`\p{L}\p{M}`); custom classes compile in Unicode mode, so `\p{…}` classes and astral characters work.
- **Layout docs and layout fixes.**
  - **data-canvas / data-container** — New attribute pages. `data-canvas` covers values, `data-max` / `data-padding` / `data-canvas-depth`, `--canvas-*` one-offs, nesting, mobile flush and backdrop coupling. `data-container` covers the bare and `card` / `panel` / `media` presets, where VB removes containment and how the escape hatch works, with a new `data-container-basic.html` demo. `<layout-canvas>`'s api.json now lists `data-canvas` (bare, `flush`, `elevated`) as its attribute form.
  - **data-layout reference** — `/docs/attributes/data-layout/` is the complete layout reference. Its value tables, modifier table (an anchored row per modifier: `#modifier-gap`, `#modifier-sticky`, …) and general-purpose table (`#data-container`, `#data-bleed`, `#data-measure`, `#data-scroll-hint`) are generated at build time from the layout CSS and the layout api.json manifests (`site/data/layoutReference.js`, `site/plugins/generate-layout-reference.js`), so they can't drift. `tests/unit/layout-reference-drift.test.js` keeps the hub and `admin/reference/syntax.md` in step with the CSS. The attribute index gains a generated "Layout Modifiers" category plus `data-container`, `data-canvas`, `data-paged`, `data-sortable`, `data-responsive` and `data-visible`, and its search matches descriptions.
  - **data-page-layout="dashboard"** — `data-nav-toggle` marks the drawer toggle button; it is hidden at 48rem and up and with `data-layout-nowrap`. A `<nav popover>` opened by `<button popovertarget>` is the no-script drawer, and it renders in flow as the nav column at 48rem and up.
  - **data-layout-density** — Compact and spacious steps are `--size-unit` multiples (rem) instead of px, so density regions follow the root font size, the `data-fluid` profiles and the large-text theme. Values at the default size are unchanged.
  - **Conformance** — `vb/layout-attr-value` also checks presence-only modifiers per layout: `data-layout-centered` on a cluster or reel (bare or `=""`) is now reported, because no rule reads it there.

- **U–Y-element review.**
  - **youtube-player**
    - `poster` attribute: a local facade image. When set, no thumbnail is requested from i.ytimg.com, so nothing contacts Google until play. `<social-embed poster>` passes it through for YouTube URLs.
    - `end` attribute (whole seconds).
    - `youtube-player:activate` event (bubbles), detail `{ videoId, fromUser }`.
- **P-element review.**
  - **analytics** — `GET /api/analytics/popular` Pages Function: a public most-visited list over the D1 `page.view` hits (`?window=24h|7d|30d`, `?limit=1-50`, `?site=`), returning `{ ok, site, window, pages: [{ url, views }] }`. Failures return a generic `{ ok: false, error: 'unavailable' }` 503 (D1 messages are logged, not echoed). This is the default endpoint of `<popularity-index>`, which previously 404'd.
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

- **Doc class clean-up.**
  - **data-audio-playlist** — The native-audio playlist utility is enabled by a `data-audio-playlist` attribute on the container instead of the `.audio-standalone` class (breaking; no alias). Behaviour and the `data-audio-playlist-init` marker are unchanged.
  - **Pattern docs** — Samples and demos no longer teach classes VB never styled. Dashboards, stats and shells use `<score-card>`, `<chart-wc>` and `<data-table>`; profiles and timelines use `data-layout="media"`, stacked `<dl>` stats and `<activity-feed>`; settings use `nav.vertical` and `<tab-set>`; checkout and contact details are description lists; pricing uses `<layout-card>`, `<layout-badge data-shape="ribbon">`, `ul[data-marker="check"]` and a script-free `input[data-switch]` billing toggle; testimonials use `<figure>`, `<blockquote>` and `<star-rating readonly>`; the mobile navbar uses `<mobile-menu>`; wizards are working `form[data-wizard]` demos. Recipes whose look is the point keep their class and show their CSS. The scroll recipes rename `.row` / `.stack` to `.scroll-row` / `.card-stack`.
  - **Skeleton pattern** — Rewritten around `data-loading="skeleton"`: 17 invented skeleton classes are gone, and each direct child becomes a placeholder sized by its own content.
  - **Element and snippet docs** — Invented classes are replaced by VB primitives (`<brand-mark>`, `<layout-badge>`, `<user-avatar>`, `<site-legal>`, `section.hero`, `.display-heading`, `<hgroup>`, `ul.meta`, `fieldset[data-segmented]`, `button.full-width`). Bespoke classes ship with their CSS in the sample. `icon-only`, `primary` and `danger` are gone: a button named by `aria-label` with a lone `<icon-wc>` is already square, and a plain button is already the primary look.
  - **Overrides guide** — Level 4 no longer claims VB ships `.bg-primary` / `.text-*` / `.p-*` utilities; it shows token-driven elements following `data-theme` and token-based helpers in an author layer. The cascade-contract layer list matches `src/main.css`.
  - **Docs chrome** — /docs/attributes/ and /docs/elements/ share one filter, search, entry-card and heading set in docs.css, with `data-layout="grid"` and `<layout-badge>` type badges; the page-local `.pack-badge` copies that overrode docs.css are gone. One `browser-window[data-demo-height="s|m|l|xl|2xl"]` scale replaces per-page copies and inline min-heights. About 330 inline styles moved into docs.css (themes, tokens, concepts, principles, bundles, accessibility, docs landing). Colliding demo classes were renamed (`.hover-card`, `.preview-card`, `.toggle-row`, `.bouncy`).
  - **nav.steps** — Now an inline-size container (`vb-steps`); below 36rem horizontal steppers switch to labels below the markers.
  - **Description lists** — A horizontal `dl` stays two-column down to 16rem (was 24rem, so it stacked in every sidebar).
- **Native attributes review.**
  - **Native attribute groups** — Ten groups, in this order: Global, Internationalization, Accessibility, Forms, Interactivity, Links & Security, Embeds, Media, Performance, Structure. `dir`, `lang` and `translate` move to the new Internationalization group; `is` moves to Global; `dirname` and `wrap` to Forms; `open` to Interactivity; `ping` to Links & Security; `srcdoc`, `sandbox` and `allow` to the new Embeds group; Accessibility now holds the ARIA states page. Each page declares its group in its own `nativeGroup` frontmatter, and the attribute index, the native landing page and the sidebar are all generated from it (`site/data/nativeAttributes.js`); a unit test fails when a page has no group or index entry. Attributes documented on another page (fetchpriority, decoding, sizes, controlslist, start, li value, popovertarget, command, closedby, formnovalidate, formmethod/formtarget/formenctype) have index rows that link there.
  - **Page template** — All 60 native attribute pages follow one template: Overview with "Applies to" and a live `<browser-window>` demo, Values (with defaults), Examples, In Vanilla Breeze (hooks with source files), Accessibility, Security where relevant, a dated Browser support line where support is not universal, Gotchas, and Related with a "Which to choose" list. "See Also" headings and "future enhancement" asides are gone. 63 new `attr-*.html` demos replace inline-styled examples (`crossorigin` and `ping` explain why they have none). The native landing page describes the template and lists every group.
  - **Docs demos** — The last live `class="example"` blocks on attribute pages (data-format-number, -date, -bytes, data-math, data-lorem, data-mock) are `<browser-window>` demos now (19 new demo files), and the i18n typography demo no longer uses inline `onclick` handlers or undefined classes.
  - **Duplicate loading page** — `/docs/attributes/native/loading/` redirects to `/docs/attributes/loading/`.
  - **Cross-links** — Element pages (input, textarea, select, button, form, fieldset, dialog, details, iframe, media, image, list, quote and time elements), web component pages, the related `data-*` pages and the accessibility, i18n, performance and quick-start guides link the native attribute pages.
- **Utility attributes review.**
  - **data-copy** — The `copy` and `paste` CustomEvents are renamed `copy:done` and `paste:done`, with new `copy:error` and `paste:error`. The old names collided with native ClipboardEvents, so page-level `copy`/`paste` handlers received an event without `clipboardData` and threw. One delegated click listener replaces per-button set-up and the `data-copy-init` flag, so cloned buttons and buttons restored from saved markup work.
  - **copyText() / copyRich() / pasteFromClipboard()** — Failures are no longer silent. They set `data-state="failed"`, announce assertively ("Copy failed", `data-label-copy-failed` / `-paste-failed`) and try an `execCommand('copy')` fallback. When that fails too, the source text is selected for a manual copy. This applies to every caller (code-block, qr-code, color-picker, share-wc, heading-links, glossary-index, data-math). New `failureMessage` and `source` options. The success announcement moved out of the button, where it changed the button's accessible name, to the shared body-level region.
  - **data-spoiler** — Only a bare `<div>`/`<span>` host gets `role="group"` and a label; list items, cells, paragraphs and headings keep their own role. The trigger and Hide controls are always real `<button>`s (inline spoilers used `<span role="button">`). The content wrapper is a `<span>` unless the host takes flow content, so spoilers in `<p>` and headings stay valid.
  - **data-effect="animate-image"** — The wrapper is a `<span class="animate-image-wrapper">` and the button keeps one name ("Pause animation: <alt>") with `aria-pressed`. The `.paused` class is gone.
  - **bindHotkey()** — Key repeat, IME composition and already-handled (`defaultPrevented`) keystrokes are ignored.
  - **data-select-all** — Only `input[type=checkbox]` masters are enhanced. Scope is the nearest `[data-select-all-scope]`, `<table>`, `<form>` or `<fieldset>`.
  - **data-format-bytes** — Values and units are formatted with `Intl.NumberFormat`'s unit style, so unit labels are localised (`1,5 Mo` in French) and follow the nearest `[lang]`. English labels change from `KB` to the SI `kB` (`MB` and `GB` are unchanged). Bytes read `512 bytes` and zero reads `0 bytes`. Binary (÷1024) sizes keep the same labels, because `Intl` has no KiB.
  - **data-effect="ticker"** — Formats with exactly the `data-format-number` options, so the last frame equals the static output and what reduced-motion users see: compact `1.5M` (was `2M`), percent `85%` (was `85.00%`), currency `$48,200.00`. `--vb-ticker-decimals` still fixes every frame. Duration is capped at 5 s (WCAG 2.2.2), and the element is `aria-busy="true"` while counting. It no longer sets `data-format-number-init`.
  - **data-math** — Copy results go through `copyText()` and the shared announcer instead of a per-equation `role="status"` span, and show on the button for 2 s (`data-state="copied|failed"`). Equation numbers follow document order and are renumbered on insert and removal; `VBMath.equations` is rebuilt in that order.
  - **Enhancement markers** — `data-format-date-init`, `data-format-number-init`, `data-format-bytes-init` and `data-math-init` are now state hooks only. Enhancement is tracked in a WeakSet, so clones are formatted or adopted on insert.
  - **data-visible internal state → data-state-visible** — back-to-top, the page-tour backdrop, the image-map tooltip and the form error summary used `data-visible` for their own shown state, which clashed with the public `data-visible="mobile|desktop"` utility. They now use `data-state-visible`, and an authored `data-visible` on `[data-back-to-top]` is no longer wiped. There is no shim: CSS that targeted `[data-back-to-top][data-visible]` or `[data-form-summary][data-visible]` must switch.
  - **View transitions** — The `none` preset's class is now `vt-none`. `view-transition-class: none` means "no class", so the old `*.none` rules could never match and `data-vt-class="none"` / `data-transition="none"` still animated. The attribute values stay `none`.
  - **Readiness and responsive visibility CSS** — `hide-until-ready`, `show-until-ready` and `data-visible` moved to the reset layer with `display: none !important` (imported from `main.css` / `main-core.css` as `layer(reset)`). They now beat components' structural `display: … !important` rules, such as `<content-swap>`'s, and unlayered author `display` rules. An `!important` in the utils layer would still have lost to earlier layers. `data-visible`'s queries are screen-only: in print the `desktop` variant shows and the `mobile` one is hidden.
  - **data-responsive** — An authored `sizes` is respected, except `auto` on an eager image; `auto` with `loading="lazy"` is left to the browser. An authored `srcset` wins over the shorthand. The script no longer sets `loading="lazy"`, which had no effect because the parser had already requested the image.
  - **page-toc** — Shares `<heading-links>`' skip list (`dialog`, `[data-toc-ignore]`, `browser-window`; `src/web-components/_shared/toc-skip.js`) and also skips unrendered headings. Headings in a closed `<details>` are kept. An auto-generated ToC rebuilds live when headings are added or removed, or when `data-toc-ignore`, `id` or `hidden` change.
- **Styling and shapes review.**
  - **data-badge shapes (breaking)** — The `[data-badge="ribbon|notch|flag|double-arrow|stamp"]` shape attribute and `src/shapes/badges.css` are removed, with no shim. The shapes are now values of `<layout-badge data-shape>` (next to `square`): `<span data-badge="ribbon">` → `<layout-badge data-shape="ribbon" data-color="brand">`. The shape is painted on `::before`, so the badge's focus outline, text and theme drop-shadows are never clipped; shapes use the badge's own `data-color`/`data-variant`/`data-size` (AA on every fill; the old shapes used the undefined `--color-on-primary`, about 3.1:1); notches mirror in RTL; forced colours fall back to a `CanvasText` border; print keeps the fill. `data-badge` is now only the boolean `time[data-badge]` chip.
  - **table (breaking)** — The `.striped`, `.compact` and `.bordered` classes are replaced by `data-striped`, `data-density="compact"` and `data-bordered` (vanilla-breeze-aqmv). html-validate knows the three attributes.
  - **Callouts (breaking)** — `data-callout` is the one callout primitive: a token list of one kind (`note` default, `info`, `tip`, `warning`, `danger`) plus an optional shape (`speech`, `notched`). `<markdown-viewer>` `:::kind` blocks render `<aside data-callout="kind" role="note">` with `<p data-callout-title>` instead of `aside.callout[data-kind]` / `.callout-title`, and its own callout CSS is gone, so markdown and hand-written callouts look identical (custom CSS targeting `.callout` must move). `tip` is now the success colour, not primary. Shapes are painted on `::before`, so the callout is never clipped. Docs moved to `/docs/attributes/data-callout/`; `/docs/attributes/data-badge-shape/` redirects there.
  - **data-bubble** — Tails are painted on `::before` (the bubble is no longer clipped) and themes recolour through `--bubble-bg` (kawaii and cyber migrated). Without `shape()` support bubbles are coloured rounded rectangles instead of unstyled. The `typing` bubble animates only its empty `<span>`s, so a visually hidden "X is typing" label can sit inside a `role="status"` bubble.
  - **--shape-depth (breaking)** — Now a registered `<length>` (default `48px`) instead of a percentage, so the section-edge clip and its compensating padding use the same value; percentages are invalid and fall back to the default (cyber `40px`, kawaii `32px`). The padding on a shaped side is `!important`; tune it with `--shape-edge-padding`. Unknown values no longer add padding. `--shape-curve` (unused) removed.
  - **data-morph (breaking)** — Runs one cycle by default (stops within 5s, WCAG 2.2.2); `data-morph-loop` loops. Clip depth is a length (`--shape-morph-depth`) and non-media elements get that much padding. Skipped on elements that also carry a static shape (`data-clip`, `data-cutout`, `data-border-shape`, `data-shape-start/-end`). Off in forced colours and print as well as reduced motion.
  - **data-border-shape** — Rebuilt as a real frame: the wrapper's `::before` paints the colour across the shape and each direct child is clipped to the same shape, inset by `--shape-border`; the wrapper is no longer clipped. The frame switches to `--color-focus-ring` while the wrapper or its child has keyboard focus.
  - **Shapes docs** — One attribute page per family. The section-edge page is now `/docs/attributes/data-shape-start/` (`/docs/attributes/data-shape/` redirects there, since `data-shape` is `<layout-badge>`'s attribute); `data-clip`, `data-cutout`, `data-border-shape` and `data-morph` have their own pages.
  - **Theme drop caps (breaking)** — Organic, swiss and editorial no longer add a drop cap to every article: they only style elements with `data-drop-cap`, through the new hooks, and never set their own (physical `float: left`) geometry. `--drop-cap-color` defaults to `--color-primary` (was the link colour).
  - **article[data-numbered] / [data-section-numbers]** — Only captioned figures (`figure > figcaption`), tables (`table > caption`) and listings consume a number. A numbered article and its `<section>`/`<aside>` elements are no longer container-query containers (`container-type: normal`; `data-container` opts a box back in, restarting its numbering). Headings inside a nested `<aside>` or `<article>` are no longer numbered.
  - **article[data-prose]** — Every image or `<picture>` that is a direct child of a paragraph floats to the inline-end (CSS cannot tell `<p><img> text</p>` from `<p><img></p>`; use `<figure>` for a full-width image); `h2`–`h4`, `hr` and `footer` clear the float. The `--font-size-l` step-up for `data-prose` and `.blog` follows the surrounding container (`@container (inline-size >= 40rem)`), not the viewport.
  - **data-accent** — A scoped accent (`<section data-accent="forest">`) re-derives `--color-interactive` (+ hover/active), hover/active text, the focus ring tokens and the `--color-text-on-*-auto` tokens at its own scope, so buttons, links and focus rings inside it take the accent.
  - **Theme hr rules** — Themes restyle only plain rules, `hr:not([data-ornament], [class])`, replacing the hard-coded `.decorative, .wave, .zigzag, …` list in every theme and pack. Any class now opts an `hr` out of theme styling, so new variants need no theme edits (an author-classed `hr` keeps the base rule).
  - **cyber / kawaii themes** — Badge, callout and bubble styling goes through `--badge-shape-fill`, `--callout-bg`/`--callout-accent` and `--bubble-bg` with `filter: drop-shadow()` glows that follow the shape. Cyber light-mode badges use light text (was 3.96:1). Neither restyles `time[data-badge]` any more.
- **Effects review.**
  - **data-trigger="click" (breaking)** — `click` is now a real toggle: the second click deactivates. Use `click:replay` for the old replay-on-every-click behaviour (attention effects such as `shake`); in-repo demos and docs are updated.
  - **data-trigger="hover"** — Also fires on keyboard focus (focus-within for containers) and deactivates only when neither hovered nor focused. `hover`, `event:*`, `vt` and `click:replay` replays go through `VB.deactivate()`, so `vb:phase-change {active:false}` fires. `time:` accepts `2000`, `2000ms` and `2s`.
  - **Entrance pre-state (breaking)** — `fade-in`, `slide-up`, `pop`, `slide-in`, `fade-in slide-up`, `shadow` and the text effects (`typewriter`, `scramble`, `reveal`, `blur-reveal`) are hidden only while armed (`[data-effect-armed]:not([data-effect-active])`), no longer on bare `[data-trigger]`. Without JS, with an unknown trigger or on an unprocessed clone the content is visible. Entrance slots use fill-mode `both`, so stagger delays keep the start frame.
  - **Processed flags (breaking)** — The `data-effect-processed` and `data-transition-processed` attributes are gone; the runtime tracks processed state in WeakSets (`VB._processed`, `VB._transitionProcessed`) and strips stale copies. Per-effect `data-effect-<name>-init` attributes are CSS hooks only, never "already initialised" guards. `view-transition-init.js` no longer sets `data-vt-name-init`: it re-applies `view-transition-name` on clones, value changes and removal.
  - **Text effects (breaking)** — `reveal`, `blur-reveal`, `typewriter` and `scramble` use the shared splitter; the host `aria-label`, `data-typewriter-text` and `data-scramble-text` attributes are removed.
  - **data-transition="slide" (breaking)** — Follows the writing direction: `slide` / `slide:forward` is `slide-left` in LTR and `slide-right` in RTL (the parameter used to be ignored).
  - **data-transition="stagger"** — Really staggers: each child gets `fade vt-stagger-N` (capped at 11) and the always-shipped ladder in `vt-keyframes.css` delays it by N × `--view-transition-stagger`. Child names are keyed to the child, so reordered children glide; children added, removed or moved later are re-laddered. `none` also freezes the group / image-pair animation. Generated names are CSS-escaped; `effect:<class>` falls back to `fade` for an invalid class.
  - **blink** — Stops after about five seconds (`--vb-blink-count`, default 5; `.slow` 2, `.fast` 12). Set `--vb-blink-count: infinite` only with a pause control.
  - **Loop speed** — `.slow` / `.fast` on looping effects slow / speed the loop: `pulse` 3s / 0.75s, `bounce` 2s / 0.5s, `float` 6s / 1.5s, `glow` 4s / 1s.
  - **marquee** — Always pauses while keyboard focus is inside it, and scrolls toward the inline end in RTL.
  - **Reduced motion** — One rule wins for every effect under both `prefers-reduced-motion: reduce` and `:root[data-motion-reduced]`: each slot animation runs as one zero-length iteration with no delay, so entrances end visible, exits end gone and loops stop at rest; `animationend` / `vb:effect-phase-end` still fire.
  - **stamp / flipboard bundling** — `stamp` moved out of `flipboard.js` into `src/effects/stamp.js`; both now ship in `vanilla-breeze-extras.js` too (the docs site's core + extras + full-CSS pairing), so the ink filter and the split-flap board work there. `--vb-flip-ms` accepts a number of milliseconds or a CSS time and drives both the JS timing and the CSS flap.
  - **data-emoji** — `data-emoji-unknown="strip"` removes the whole unresolved token and only for letter-containing names. `alt`, `title` and `aria-label` inside the container are converted too. Live input replacement uses `execCommand('insertText')` while focused, so Ctrl/Cmd+Z restores the shortcode (fallback `setRangeText()`). Enhancement is tracked in a WeakMap instead of `data-emoji-init`. Removed the wrong `:poop:` (→ 💀) and `:raised_fist:` (→ 💪) core aliases (209 emoji / 252 shortcodes).
  - **data-parallax** — `data-parallax-group` clips (`overflow: clip`) and isolates its section. The resting state (reduced motion, unsupported browsers) keeps `translateY(--vb-parallax-from) scale(--vb-parallax-scale)`; `will-change: transform` only while the animation can run.
  - **Docs** — `data-effect`, `data-trigger`, `data-stagger`, `data-transition`, `data-emoji` and `data-parallax` rewritten on the common attribute template (Overview, Usage, Options, Events, Styling, Accessibility, Examples, Related) with motion / vestibular / screen-reader guidance; invented custom properties (`--vb-fade-in-duration`, `--vb-float-distance`, `--vb-pulse-scale`, `--vb-shake-intensity`, `--vb-slide-up-distance`, …) removed; "core" badges corrected (most entrance / attention / decoration effects are **full**); parallax support is Safari 26+.
- **Form attribute review.**
  - **data-switch (breaking)** — Size values renamed to the VB size vocabulary: `data-switch="s"` / `data-switch="l"` (were `sm` / `lg`; no alias, the old values now render the default size). All in-repo uses are updated (theme-picker, settings-panel, docs, demos). An authored `role` is no longer overwritten. A required switch left off shows a dashed `--color-error` outline (`:user-invalid` / `aria-invalid`).
  - **Init markers (breaking)** — `data-upload-init`, `data-toggle-tags-init` and `data-accept-init` are no longer set. Switch, color, accept, upload, toggle-tags, show-when and autosave moved onto the shared `registerInit` observer (own MutationObservers removed). These and count, grow and the wizard guard with a WeakSet/WeakMap or controller property instead of trusting a copied attribute, so clones and template copies are wired instead of skipped.
  - **data-wizard (breaking)** — `data-wizard-persist` stores through VBStore (`vb:wizard:{form id}`, `{ data: { step, data, session }, timestamp }`) instead of raw `vb-wizard:{id}` session/local storage; old `vb-wizard:*` entries are ignored. Saved state expires after `data-wizard-persist-hours`; `"session"` is tied to the tab by a per-tab id. Restore skips read-only and author-disabled controls, restores checkbox groups and multi-select by value, and dispatches `input`.
  - **data-show-when (breaking)** — `name=!value` now means "not equal" (it was a literal match on `!value`).
  - **data-upload (breaking)** — File sizes use decimal units (1 kB = 1000 B, `Intl.NumberFormat` in the closest `[lang]`); they were 1024-based "KB". The drop zone no longer contains a "browse" `<button>`: the native input is the single control and tab stop, and the zone draws a focus ring (`:has(input:focus-visible)`, `Highlight` in forced colours). The prompt is a `<p class="upload-prompt">` linked with `aria-describedby`, singular unless the input has `multiple`; `role="presentation"` is gone.
  - **data-wizard** — Enter in a text field before the last step runs Next instead of attempting a submit. Steps hidden by `data-wizard-if` disable their controls (`data-conditional-disabled`, the `data-show-when` contract), so their `required` fields no longer block submit and their values are not submitted. After a step change focus moves to the new step's `<legend>` (`tabindex="-1"`), only when focus was already in the wizard or on `<body>`.
  - **data-color** — The generated `<button class="color-display">` is gone. The native colour input is the only control (one tab stop, named by its label); the swatch and hex are an `aria-hidden` `<span class="color-display">` inside a `<span>` wrapper, coloured from `--color-swatch-value`.
  - **data-stepper** — Buttons call the native `stepUp()` / `stepDown()`, so the step base is honoured (`min="1" step="5"`: 2 → 6, not 7) and the result is always valid; `step="any"` moves by 1. A press that changes nothing fires no `input` / `change`.
  - **data-range** — The bubble, tick markers and datalist labels are `aria-hidden`; the input gets `aria-valuetext` (the matching datalist label, else prefix + `Intl.NumberFormat` value for the closest `[lang]` + suffix), so the value is announced once with its unit. The bubble shows the same text. `data-markers` draws nothing above 100 steps.
  - **data-mask** — Only `text`, `tel`, `search` and untyped inputs are masked. An incomplete value sets `setCustomValidity`, so `required` and `<form-field>` reject it. `data-mask-init` is set only once a valid mask is wired.
  - **data-toggle-tags** — At the `data-max` limit, unchecked boxes get `aria-disabled="true"` + `data-max-blocked` instead of `disabled`, so they stay focusable; clicks and Space on them are cancelled and a polite `.toggle-tags-status` message announces the limit. Chips use a `--control-border` edge, checked text uses `--color-text-on-interactive-auto` (was literal `white`), transitions are narrowed and off under reduced motion, and the legend floats `inline-start`.
  - **data-strength** — The meter is a size-`s` `<meter>` with a visible track (was the decorative `.xs` hairline) and carries `aria-valuetext` with the level name. Level text uses the status `*-text` tokens (AA in light and dark). The rules list is linked with `aria-describedby`, each rule ends in visually hidden "met"/"not met" text, and a debounced polite region announces level changes. Rules are Unicode-aware (`\p{Lu}`, `\p{Ll}`, `\p{N}`; special = neither letter nor digit; length counts code points); unknown rule tokens are skipped with a console warning.
  - **data-autosave** — Checkboxes are stored per name as an array of checked values (was `"on"`/`""` per name, last box wins), so checkbox groups round-trip by value; old `"on"` drafts still restore a single default-valued checkbox. Restored controls get `change` as well as `input`. An expired (>24h) or unreadable draft is deleted on load.
  - **data-show-when / data-hide-when** — One capture-phase document listener replaces the per-form listeners.
- **Layout docs and layout fixes.**
  - **data-layout (breaking)** — `data-layout="holy-grail"` and `data-layout="dashboard"` are removed, with no shim. They were a drifted second copy of the page templates. Use `data-page-layout="holy-grail"` / `"dashboard"`, which work on any element. `data-header-height` is gone with them; the dashboard drawer is full height. For a sticky header or nav, use `data-layout-sticky` with `<html data-sticky>`.
  - **data-page-layout (breaking)** — The `--tpl-*` template tokens and `--_sidebar-width` / `--_sidebar-collapsed` are declared on the layout host (`:where([data-page-layout])`) instead of `:root`. Override a template on the host (`body { --tpl-sidebar-left: … }`); a `:root` override of `--tpl-*` no longer reaches the grid. `--sidebar-collapsed` defaults to `4rem` (was `64px`). A bare `data-page-layout` is a `stack`.
  - **data-page-layout="dashboard"** — Below 48rem the nav is an off-canvas drawer: fixed to the inline-start edge, full height, `min(sidebar width, 85vw)` wide, sliding in from the right in RTL (no slide with reduced motion). While closed it is `visibility: hidden`, so its links are out of the tab order and the accessibility tree. It opens with `data-nav-open` on the host or as a native popover. Before, it stacked the nav above main.
  - **data-page-layout="app-shell" / "dashboard"** — `data-layout-sidebar-width` and `data-sidebar="collapsed"` switch the content-sized nav column to a fixed `--_sidebar-width` column.
  - **data-layout="regions" (breaking)** — Now a flex column: the header region first, the footer region last, and every other child in between in DOM order. A `section` / `[slot="content"]` grows; with no section, the footer is pinned to the bottom. The `header` / `content` / `footer` grid areas no longer exist.
  - **data-layout="media" (breaking)** — Every non-figure child takes its own row in the content column, and the figure spans them (up to five content children; the last row absorbs a taller figure). When stacked (container under 25rem), the figure stays on top, also when reversed. The `figure` / `content` grid areas no longer exist.
  - **data-layout-area (breaking)** — Only `hero`, `feature` and `cta` (the `landing` template's areas) remain. The `sidebar`, `content`, `banner` and `toc` selectors named areas that no VB template defines, so a child using them dropped into an implicit zero-width track. With your own `grid-template-areas`, set `grid-area` directly.
  - **layout-sidebar / data-layout="sidebar"** — The narrow-region rule (`@container region-main (width < 40rem)`) now applies to both forms and respects `data-layout-nowrap`. It stacks by giving every child a full row. Before, it was attribute-only and used `flex-direction: column`, which turned the 16rem basis into a height and overrode `side="end"`.
  - **Docs** — Every layout element page (stack, cluster, sidebar, center, cover, grid, imposter, reel, switcher, columns, text, canvas, card) follows one template:
    - a live "Element and attribute forms" demo, or an explicit "element only" note with alternatives
    - an Attributes table with an "Applies to" column
    - Child attributes
    - Examples, each demo with matching code
    - Accessibility
    - Related links

    data-page-layout, data-sticky, data-layout-density and data-splitter were rewritten against the shipped CSS. The Semantic Layouts, Grid Identity and Fluid Scaling guides were corrected: no `<div>`s, real area names, and the placement order for regions and media. The custom-elements index treats `data-layout` as an equal form of each layout, not a tool for one-off adjustments.

- **Changes from the U–Y-element review.**
  - **ul** — `data-marker="arrow"` now uses a matched glyph pair from one Unicode block, ▸ U+25B8 / ◂ U+25C2 for RTL. The old pair was ➤ U+27A4 / ⮜ U+2B9C, two mismatched shapes, and the RTL glyph had patchy font coverage. `--marker-arrow` and `--marker-arrow-rtl` changed to match.
  - **user-avatar**
    - Layout is now `inline-grid` with the `[data-fallback]` stacked under the `<img>` (a failed or transparent photo shows the initials), `vertical-align: middle`, and `isolation: isolate`.
    - Status dots differ in shape as well as colour (away crescent, busy bar, offline hollow ring); text inside `[data-status]` is read but clipped visually.
    - The `xs` initials size is now 0.625rem (was 0.5rem).
  - **var** — No longer uses the link colour (`--color-interactive`), which made variables look clickable where links are not underlined. It now takes the surrounding text colour; set the new `--var-color` hook to tint it. Added `font-synthesis: weight style` so single-face fonts still get a slant.
  - **version-switcher**
    - The host no longer gets a default `aria-label`; the trigger is named "<aria-label>: <current>" (e.g. "API version: v2.1"), and the picker is named the same way.
    - Entry markup: each `<li class="version-switcher-item">` holds the entry button (label, badges, date), then author / summary (linked by `aria-describedby`) and the changelog link as siblings. The link is no longer nested in the button, and the overriding `aria-label` is gone.
    - Navigating to an entry whose url is the current page (history entries sharing one URL) no longer reloads; it fires `version-switcher:error`. Give revisions distinct URLs or use `swap` / `diff`.
    - The banner is a labelled `<aside>` with a `role="status"` line filled after insertion (it now announces); `role="region"` / `aria-live` on the aside are gone.
    - All strings are overridable with `data-label-*`; dates use `Intl.RelativeTimeFormat` / `Intl.DateTimeFormat` with the nearest `[lang]`; the diff caption reads `data-diff-label`.
  - **video** — Aspect-ratio classes (`.widescreen`, `.standard`, `.square`, `.ultrawide`) now letterbox (`object-fit: contain`) instead of always cropping; add the new `.cover` class to crop-to-fill (decorative/background video). The documented `.ultrawide` (21:9) rule is restored.
  - **video-player**
    - `autoplay` is skipped under `prefers-reduced-motion: reduce` (which also cancels a native `autoplay` on the inner `<video>`) and runs only on first connect, never again on a move/reconnect.
    - The host is now a `role="group"` named "Video player" with `aria-keyshortcuts`; all UI strings are overridable with `data-label-*` and times/numbers follow the closest `[lang]` (Intl.DurationFormat, NumberFormat fallback). Controls are always laid out LTR, also in RTL pages. Host `loop` now loops a single video. The volume slider steps by 5%. The undocumented `--video-player-controls-bg` hook (never applied) is removed.
  - **watch-wc**
    - The compact and button variants no longer carry an `aria-label`: the visible text is the accessible name (WCAG 2.5.3); only the icon variant is named by `aria-label`. State stays on `aria-pressed`.
    - Authored children are now a real no-JS fallback: shown until upgrade, hidden afterwards (the `watch-wc:not(:defined) { display: none }` rule is gone).
    - New `data-label-watch`, `data-label-watching`, `data-label-action`, `data-label-stop` overrides. `variant`, `label` and `data-label-*` changes after upgrade re-render.
    - `server-sync` is documented as page-global (it always was).
  - **page-watch (`[data-watch-page]`)**
    - Watches are keyed by a normalised path: `/x`, `/x/` and `/x/index.html` share one key. Entries under an old key move to the new key on the next page load. `entry.url` stays the real pathname.
    - Plain buttons take `data-label-watch`, `data-label-watching`, `data-label-action` and `data-label-stop` overrides.
  - **week-view**
    - Without `data-start-date` the view shows the current week, starting on the locale's first day (`Intl.Locale` week info, with a region fallback). An empty `<week-view>` renders the grid. Today's header carries `aria-current="date"`.
    - Keyboard: Up/Down walk the day's events in time order, including events that share a cell. Left/Right move to the event nearest in time on the next or previous day that has events. Home/End use date-then-time order. Every placed event is now reachable.
    - `data-days` is clamped to 1–14 (invalid values fall back to 7). Changing `data-start-date`, `data-days`, `data-start-hour`, `data-end-hour` or `data-label-*` after upgrade rebuilds the generated table.
    - Unplaced events (date out of range, or no time) are hidden after upgrade and stay in the `events` getter.
  - **youtube-player**
    - The inner play `<button>` is now the only control: the host no longer gets `role="button"`, `tabindex="0"` or `aria-label` in the facade state (removes the nested-interactive double tab stop). The button covers the whole facade, so clicking anywhere on the thumbnail still plays.
    - Default `title` is now "YouTube video" (was "Play video", which produced "Play Play video"). The play-button name is a template, `data-label-play` (default "Play {title}").
    - `autoplay` no longer moves focus into the iframe on page load or reconnect, and is ignored under `prefers-reduced-motion` / `data-motion-reduced` (the facade is shown instead).
    - `start` accepts whole seconds only; other values (e.g. `1m30s`) are ignored with a console warning.
    - Reconnect (move/reinsert) renders the facade again, by design: a moved iframe reloads and would restart playback.
    - api.json rewritten from the runtime: `state` is output-state (`ready|active`), `thumbnail` is an enum, `role` removed, `poster`/`end`/`data-label-play` and events added.
- **Changes from the T-element review.**
  - **tab-set**
    - Breaking: `tab-set:change` fires once per activation, from the newly opened tab, with detail `{ index, previousIndex, tab, panel }` (`tab` is the `<details>`). It no longer fires for the closing tab, during setup, or when the open tab is selected again.
    - On upgrade, `<details>` with a missing, mixed or page-shared `name` get a per-instance `tab-set-N` name, so two tab-sets never close each other's tabs. The `tabs` setter builds named `<details>` with `<section>` panels.
    - `data-orientation="vertical"` (documented but inert) puts the tabs in a column with the panel beside them and adds ArrowUp/ArrowDown.
    - Horizontal tabs are a wrapping flex row: tabs that don't fit wrap onto another row instead of overflowing narrow screens.
    - A host with `aria-label`/`aria-labelledby` and no role of its own gets `role="group"`.
  - **table**
    - Breaking: `table[data-responsive="scroll"]` is removed (the table itself was an unfocusable, unnamed scroller and broke `data-sticky="header"`). Wrap wide tables in `<section data-table-scroll tabindex="0" aria-labelledby="caption-id">`; `data-table-scroll="block"` also caps the height (`--table-scroll-max-block`, default 70dvh) so a sticky header pins inside it.
    - Breaking: `tr[data-disabled]` is visual only (muted text colour instead of 50% opacity, no `pointer-events: none`); add `inert` to disable the row (`tr[inert]` gets the same styling).
    - Only column headers get the raised header band; row headers (`tbody th[scope=row]`) look like data cells, so hover, stripe and selection tints run across the whole row. The `.striped` stripe is a text-tinted wash, distinct from hover. A bare `th[data-sort]` with no enhancement no longer shows a pointer or ⇅ affordance.
  - **data-sortable** — Table mode follows the APG sortable-table pattern: each `th[data-sort]` keeps its columnheader role and `aria-sort`, and its content is wrapped in an injected native `<button data-sort-button>` (the th no longer gets `role="button"`, `tabindex` or an inline cursor). Glyphs are the shared ⇅/↑/↓ set, and `data-sort-value` (the `<data-table>` name) is accepted alongside `data-value`.
  - **text-reader**
    - Breaking: `label-play` / `label-pause` / `label-stop` are renamed `data-label-play` / `-pause` / `-stop` (no alias). New `data-label-reader`, `-controls`, `-voice`, `-loading-voices`, `-speed`, `-slower`, `-faster`.
    - The icon variant's toolbar sits right after the trigger inside the host (not in `<body>`) as a manual popover; Escape hides it and returns focus to the trigger.
    - The reading language comes from the target's nearest `[lang]` (sets `utterance.lang`, orders and preselects voices). Text is re-extracted on each play, and `aria-hidden` / `hidden` / script / style / template descendants are not spoken. `stop()` is a no-op unless this reader is speaking; if another reader takes the queue, this one resets and fires `text-reader:stop`.
  - **theme-picker** — Radio names are per instance (`theme-mode-<n>` etc., with `data-field` hooks), so pickers no longer share radio groups. Auto-dismiss happens only on pointer selections; tabbing out closes the popover (non-modal, no focus trap). With no stored a11y preference, `a11y-*` tokens authored on `<html data-theme>` are kept. New `data-label-*` overrides for every string.
  - **text-divider** — Lines use `border-block-start` (visible in forced colours); an empty divider is one continuous line.
  - **time-index**
    - Breaking: removed the `group` and `view` attributes and the "Grouping by Month" docs (neither was ever read).
    - The sort toggle keeps a stable "Oldest first" label and reports state with `aria-pressed`. Sorting works for one `.changelog-entries` container and for one container per release.
    - The version filter reads `data-version`, then the entry's `.version-tag`, then a `v2-1-0` id, and a polite status announces "Showing N of M entries for vX". `<time data-relative>` keeps the absolute date in `title`. New `data-label-controls`, `-sort`, `-filter`, `-all`, `-status`, `-status-all`, `-recent`. The feed is appended at the end of the host and is never added twice on reconnect.
  - **time-picker**
    - Breaking: `name`/`disabled`/`form` on the inner input move to the host on upgrade and the inner input is detached from the form, so exactly one value submits; the `data-disabled` host attribute is gone.
    - The value can be empty (an input with no `value` no longer becomes `00:00`): it submits nothing, `required` reports `valueMissing`, and clearing the text or `.value = ''` clears it.
    - `min`/`max`/`step` set validity: typed values are kept and flagged `rangeUnderflow`/`rangeOverflow`/`stepMismatch` (`min` after `max` is an overnight range); spinners snap to the step and stay in range; hour-scale steps work; `step="any"` turns step checks off.
    - `disabled` is observed and a disabled `<fieldset>` disables it. The combobox is named from the input's `<label>`, a host label or `aria-label`; the popup is `role="dialog"` with localised `aria-valuetext` on every spinner. Display and AM/PM order come from `Intl.DateTimeFormat` for the nearest `[lang]`, and every string has a `data-label-*`. `time-picker:change` fires only on real changes and always carries `source`.
  - **toast-msg**
    - Breaking: the host is the single live region, `role="log"` + `aria-live="polite"` + `aria-relevant="additions"` (it was `role="region"` with per-toast `role="status"`/`role="alert"`). Toasts have no role. Authored `aria-label` / `aria-live` are kept.
    - Each toast starts with a visually hidden variant prefix ("Error: …"). New `data-label-region`, `-dismiss`, `-info|success|warning|error`, a `dismiss(toast)` method, and `toast` / `queued` in the `toast-msg:enqueued` detail.
  - **tool-tip** — Without `popover="hint"`, tooltips use `popover="manual"` with their own Escape and outside dismiss instead of `auto` (which closed any open drop-down, combo-box or menu); `data-tooltip` (tooltip-init) does the same. Cards set `aria-controls` + `aria-expanded` on the trigger.
  - **notification-wc** — `toast-new="#id"` targets a specific `<toast-msg>`; a bare `toast-new` still uses the first one.
  - **time[data-format-date]** — Date-only values are formatted in UTC and keep their precision: `YYYY` shows only the year, `YYYY-MM` month and year, and `data-format-time` is ignored. The locale comes from `data-locale`, then the nearest `[lang]`, then `<html lang>` (`getLocale(el)` in `src/lib/i18n.js` takes an optional element).
  - **textarea[data-grow]** — Sizing moved to CSS: `field-sizing: content` + `resize: none` under `@supports`, starting at `rows` lines (default 2) instead of the 8rem textarea floor. `data-max-rows` caps at rows plus padding and border and scrolls past it. The init script only writes `--grow-rows` / `--grow-max-rows`; the JS fallback (`data-grow-init="fallback"`) is the only path that hides overflow.
  - **textarea[data-count]** — Limited counters read "{count} of {max} characters" (or "words") instead of "170 / 200", with `Intl.NumberFormat` for the nearest `[lang]` and `data-label-limit` / `data-label-limit-<plural>` overrides. Warning and error colours use `--color-warning-text` / `--color-error-text` (error is also bold). The counter recounts after form reset; dispatch an `input` event after setting `.value` from script.
  - **video** — New token-based `video::cue` default (`--cue-text`, `--cue-bg`, `--cue-font`); OS caption preferences and forced colours still win.
  - **topic-map** — Summaries are text-only (name and count); the `/topics/{id}/` link moved into the disclosure body as `p.topic-link`. Counts carry units ("5 pages", `Intl.PluralRules`). New `data-heading-level` (default 2, `0` = no heading) and `data-label-heading` / `-page` / `-pages` / `-uncategorized` / `-topic-link` / `-error`. `.data` takes precedence over `data-lens-src` and survives reconnect.
  - **trust-filter** — The "Signed" group is now "Has signature" with neutral styling: `signed` means a `vb:signature` meta is declared, not verified (page-info verifies). Only the count (`output[data-trust-filter-count]`) is a live region; results are a sibling `ul[data-trust-filter-results]`, and nothing is announced on load. Checkboxes have no ids (input nested in label). `trust-filter:change` fires only on reader input or reset. New `data-label-*` overrides; values show hyphens as spaces; provenance colours use `--color-*-text` and match per token (`~=`).
  - **analytics** — `ui.tab_change` sends `{ tab: index, from: previousIndex }` from the new `tab-set:change` detail (it sent the `<details>` element).
- **Changes from the S-element review.**
  - **docs site header** — The notification bell moved out of `<site-tools>` to sit after `<mobile-menu>`, so it stays visible on mobile, where mobile-menu hides site-tools.
  - **score-card** — The recommended static fallback is slotted children directly under the host (block `<p>` children); the `<figure>` wrapper never worked with shadow slots. Slotted `margin-block` is reset. `loading` mirrors `aria-busy="true"`; trend text uses `--color-success-text` / `--color-error-text`; the unused `container-type: inline-size` (which collapsed it as a content-sized flex item) is gone.
  - **search** — Variant classes (`.inline`, `.compact`, `.rounded`, `.expanded`, `.with-icon`) also style the input and button inside a direct `<form>` child: `:is(search, search > form) > input|button`. The recommended markup is `<search class="inline"><form action method="get">…</form></search>`; form-less markup still works.
  - **section** — `data-angle` mirrors under `dir="rtl"`, and its padding compensation is relative to the containing block instead of `100vw`.
  - **selection-menu** — The composed pop-over is `role="toolbar"` (`aria-orientation`, `aria-label` from `data-label`, roving tabindex). A `for` target is marked `data-selection-menu` only when the menu has an id.
  - **settings-panel**
    - Non-modal focus model: `open()` moves focus into the panel; Escape and the close button close it and return focus to the trigger; tabbing out closes it. No focus trap.
    - Reset to Defaults asks for confirmation inside the panel (Reset / Cancel, focus on Cancel) instead of `confirm()`.
    - Every string is a `data-label-*` override (68 keys). Radio `name`s, `<details name>` and control ids carry a per-instance suffix, so two panels no longer share groups or `label[for]` targets; the `#settings-theme` and `#settings-page-bg` ids are gone.
    - The panel renders synchronously on upgrade and hydrates from VBStore afterwards, so it exists when `settings-panel:upgraded` fires. Dead `.accent-*` CSS removed.
  - **share-wc**
    - Breaking: the `title` JS property is now `shareTitle` (it shadowed `HTMLElement.title`); the `title` attribute is unchanged.
    - `url` / `shareTitle` / `text` set from JS win over attributes, survive reconnect and re-substitute slotted `{url}`/`{title}`/`{text}` tokens. `share()` resolves `Promise<boolean>` and copies the link outside the native tier (it was a silent no-op).
    - With `color`, brand colours apply only to the border and icon (the label keeps `--color-text`); WhatsApp and Telegram light-mode values are darker.
  - **short-cuts** — New `hotkey` attribute (default `shift+?`; `none` disables it, WCAG 2.1.4) and `show()` / `close()` / `toggle()` / `open`. Groups render as `<section>` + `<h3>` + `<dl>`, and the dialog has a header with a close button.
  - **site-index**
    - The controls bar is a `<search>` landmark (it was a `<nav>`). The index nav is found structurally (`nav[data-index]`, else the direct-child `<nav>` holding sections), so its `aria-label` can be localised; the columns CSS follows the same hook.
    - Jump-strip letters come from the section ids, sorted with `Intl.Collator` (`index-é` adds É); `letters="all"` shows A–Z plus any extra letters. New `data-label-*` overrides.
  - **site-legal** — Links stay underlined (thicker on hover/focus). Separators are decorative generated content (`content: "·" / ""`) placed in the gap outside each item, no longer part of a link's underline, hit area or name; the separator that would start a wrapped row is clipped. New `data-justify="start|center|end|between"` (`--site-legal-justify`) and a list form (one `<ul>`/`<ol>` child).
  - **site-map** — ia-tree uses a roving tabindex with one Tab stop; Enter follows the node's link, Space toggles a parent or follows a leaf; arrows and the ▸ glyph mirror in RTL. Visual nodes are `role="treeitem"` tracked with `aria-activedescendant`, re-renders keep toolbar focus, and colours come from theme tokens (with a forced-colors block). `observedAttributes` match behaviour (`title`/`collapsed`/`data-view` rebuild, `data-orientation`/`data-detail` re-render).
  - **site-search**
    - The panel is a native `<dialog>` opened with `showModal()` (top layer, page inert, Escape closes even with a query typed). The input is a `role="combobox"`, the listbox holds only `role="option"` links, and a separate `role="status"` region announces searching, counts and errors.
    - New `data-pagefind-path` (default `/pagefind/`) and `data-base-url` for subpath deploys (replaces the pack mini-sites' `replaceAll` patching). `data-label-*` overrides every string; a missing index shows "Search unavailable" (developer hint in the console only).
    - Cmd/Ctrl+K is bound once per page and opens the first visible instance. Results are real links (modifier/middle-click open new tabs); Enter with no active result goes to the first result.
  - **site-tools** — New `--site-tools-gap` token (default `var(--size-s)`).
  - **slide-accept**
    - A tap or click on the handle, or Enter / Space / End, also confirms (WCAG 2.5.7 single-pointer alternative).
    - Form-associated: `name` submits `value` (default `on`) once confirmed, `required` is `valueMissing` until then, form reset calls `reset()`, `disabled` or a disabled `<fieldset>` blocks interaction.
    - The authored text is the default label (`label` still wins). After activation the handle keeps focus with `aria-disabled="true"`.
  - **small** — Sized relative to its context, `max(0.875em, var(--font-size-xs))`, instead of the fixed `--font-size-s` (smaller inside headings, still steps down inside small text).
  - **social-embed** — The idle state is a real `<button>` ("Load Bluesky post") beside the fallback link, with a note naming the host; the host lost `role="button"`/`tabindex`/`aria-label`. New `data-title`, `data-label-load` / `-loading` / `-error` / `-note`. Providers may return a Node from `render(host, url, { theme, title })` and gain `label`, `noun`, `themeable`, `frameHost(url)`; new export `createEmbedFrame()`. Built-in providers are plain objects registered by `logic.js` (import `social-embed/logic.js` only); Instagram/X no longer load `embed.js`/`widgets.js`. `theme` re-renders only themeable providers (X, Bluesky).
  - **split-surface**
    - Breaking: with `persist`, the stored value is `{ position, collapsed }` (a bare number is no longer read), and a stored layout wins over the `position` attribute on load. `reset()` clears it.
    - `split-surface:resize` no longer fires on load or reconnect; it and `split-surface:collapse` gain `source` (`pointer` | `keyboard` | `api` | `attribute`).
    - `position`, `min`, `max`, `direction`, `collapsible` and `data-label-*` are observed; reconnect keeps the live position and collapsed state; a collapsible surface has `aria-valuemin="0"`.
  - **star-rating / rating effect**
    - star-rating's internal radios are detached from the owner form (`form="_star-rating-detached"`, per-instance group name), so `FormData` holds exactly one `name=value` entry (the `_sr_<name>` field is gone). All attributes are observed, `.value` set before connect applies on build, and `form.reset()` returns to the `value` attribute.
    - Empty stars render as outlines and filled stars solid (a shape cue, hover preview too); empty colour defaults to `--color-text-muted`. New `--rating-color` / `--rating-color-empty` tokens and `data-label-one|other|readonly|required|cleared` templates (`Intl.PluralRules` / `Intl.NumberFormat`).
    - The rating effect announces only the clear, from one persistent `[data-rating-live]` region (selection was announced twice); Space on the checked star or Delete/Backspace clears.
  - **status-message** — `[data-dismiss]` is implemented (`src/custom-elements/status-message/logic.js`): it hides the message (`data-dismiss="remove"` removes it), fires cancelable `status-message:dismiss` and moves focus to `data-dismiss-focus` or the next focusable element. Title/compact text uses `--color-*-text`; border and filled background use the base colour.
  - **status-wc** — With no slot text, a visually hidden default label per variant (`data-label-<variant>`, else `aria-label`) follows `data-variant`, so bare dots are never colour-only. Author `role`/`aria-live` are left alone (`data-live="off"` removes only what the component added). The dot gains a 1px ring (`--status-dot-ring`) so amber variants reach 3:1.
  - **stepper-wc** — `readonly` disables the −/+ buttons and sets `aria-readonly="true"`; in RTL, ArrowLeft steps up and ArrowRight steps down, matching the button order.
  - **sticky-manager** — Owns the banner header's `data-sticky` outright: it adds the attribute only when missing, removes only what it added and tracks every header it marked. Calling `initStickyManager()` again re-measures.
  - **strong / b / em / i** — `font-synthesis: weight style` (was `none`). A real bold/italic face still wins; synthesis fills in for single-face theme fonts (DM Serif Display, VT323, Press Start 2P), where `<strong>`/`<em>` looked like body text.
  - **sub / sup** — The `0.75em` size and baseline offset always apply. The `@supports (font-variant-position)` reset is gone (browsers do not synthesise sub/sup glyphs, so subscripts rendered full-size on the baseline in most fonts); `font-variant-position` is opt-in with `data-variant="opentype"`.
  - **svg**
    - Breaking: `svg.responsive` is removed (it duplicated `.full`). Use `.full`.
    - `.currentcolor` no longer overrides `fill="none"`, so stroke (Lucide) icons stay outlines. `.interactive` / `.muted` set `color` (and fill unless `fill="none"`), so `stroke="currentColor"` icons follow. `.spin` / `.pulse` stop under reduced motion (`prefers-reduced-motion` or `:root[data-motion-reduced]`).
- **Changes from the Q+R-element review.**
  - **ruby / rt / rp (`data-ruby`)**
    - Breaking: annotations are visible by default on every page (the browser default). A missing `data-ruby` used to act like `auto` and hid every `<rt>` on non-CJK pages, including VB's own ruby demos. Pages that relied on that must set `data-ruby="hide"` or `"auto"`.
    - `data-ruby` works on any element (a section, a paragraph, the `<ruby>` itself), not only `<html>`. The nearest one wins (`@scope ([data-ruby=…]) to ([data-ruby])`), and `show` undoes an outer `hide`/`auto`.
    - `auto` keys on each annotation's own `:lang()` instead of the root's, and counts Cantonese (`yue`) and Wu (`wuu`) as CJK, matching `RUBY_LANGUAGES` in `src/lib/i18n.js`.
    - `hide` is a real visually-hidden technique (zero size, clipped, kept in the ruby layout), so the reading stays in the accessibility tree; it was `visibility: hidden`. `<rp>` stays `display: none` in every mode.
  - **q / cite[data-variant="quoted"]**
    - Locale rules are `:is(q, cite[data-variant="quoted"]):lang(x)`, so `lang` on the `<q>` itself works (a `<q lang="en">` in Japanese text gets English marks).
    - The base is `quotes: auto`, so languages outside VB's table (nl, sv, cs, he, …) get the browser's locale marks instead of English ones.
    - New locale marks: `zh` / `zh-Hans` / `zh-CN` get “…” ‘…’ (「…」『…』 is reserved for `zh-Hant` / `zh-TW` / `zh-HK` / `zh-MO`); `pt` / `pt-BR` get “…” ‘…’ («…» “…” is reserved for `pt-PT`); new `de-CH` «…» ‹…›; Polish corrected to „…” «…».
  - **qr-code**
    - The encoder is the vendored Project Nayuki qrcodegen (MIT, `src/vendor/qrcodegen/`, pinned commit; `npm run vendor:qrcodegen`): versions 1–40, numeric/alphanumeric/byte (UTF-8) modes. The old encoder produced codes no decoder could read.
    - Breaking: the default is black on an opaque white background with a 4-module quiet zone. It no longer follows `currentColor` or the theme, so dark mode and forced colours stay scannable. `color` / `background` are opt-ins and warn in the console when inverted, under ~4:1 contrast or translucent. `toDataURL()` / `copy()` export an opaque PNG.
    - Breaking: `size` is the edge of the whole box, quiet zone included, in CSS pixels.
    - `error-correction` accepts `L|M|Q|H` (case-insensitive) as well as `0`–`3`, and the level is used as given (no silent boost). Invalid values warn and fall back to M (`4`+ used to throw).
    - Children are kept as the caption instead of being wiped: visually hidden by default, shown with `data-caption="visible"`, while a link inside has focus, or when no code can be drawn. The canvas is `role="img"` named "QR code" (`data-label-prefix`), so the value is no longer announced twice; `data-label-copied` sets the copy announcement.
    - `value`, `size`, `color`, `background` and `error-correction` are all reactive; new `value` property.
  - **reaction-bar**
    - Chip names come from `data-label` or `aria-label` on the chip and its palette button, with the emoji as fallback ("Thumbs up, 3 reactions"). The ", you reacted" suffix is gone (`aria-pressed` carries it), as is the redundant `role="button"`.
    - New `data-label-toolbar`, `data-label-dialog` and `data-label-count-{one|other|…}`. Counts use `Intl.NumberFormat` and `Intl.PluralRules` for the closest `lang`.
    - A chip is `data-pending` / `aria-busy` from the click until `setCount()` for that reaction, so a double click sends one request. Call `setCount()` with the old values to roll back.
    - `data-disabled` is observed: chips get `aria-disabled` and the disabled trigger leaves the arrow-key order.
  - **reader-view**
    - Breaking: the host no longer sets a bare `upgraded` attribute. Use `data-upgraded`.
    - Breaking: persistence is per page and instance. The default key is `vb-reader:<pathname>[#id]` (was a shared `vb-reader`), and a saved mode is restored only with the new `data-remember-mode`. Font size and columns are still restored; setup no longer writes to storage.
    - Pages mode is a modal overlay: the rest of the page is `inert`, document scroll is locked, focus moves into the pager, and Escape returns to scroll mode with focus on the mode toggle. It stacks at `--reader-view-z` (default `var(--z-overlay)`; was `z-index: 10`).
    - The built wrapper is a plain element instead of `<main class="reader-book">`. Control sets are labelled `role="group"`s (the `role="toolbar"` is gone); column buttons carry `aria-pressed` and names such as "2 columns", and the active styling keys off `aria-pressed`.
    - `mode` and `columns` are observed. `reader-view:mode` no longer fires for the initial mode; `reader-view:page` also fires when the page count changes. Every UI string has a `data-label-*`, including the page indicator `{page} / {total}`.
  - **reading-progress**
    - The bar is decorative: the inner `<progress>` is always `aria-hidden` and gets no English `aria-label`. The CSS-driven path used to announce a progressbar stuck at 0%.
    - New `--reading-progress-offset` (for sticky headers) and `--reading-progress-z` (default `var(--z-sticky-header)`; was 100). `data-for` is observed.
  - **recently-visited**
    - Breaking: tracking is opt-in (see Security). The docs site opts in from its shared head.
    - Breaking: `empty-text` is replaced by `data-label-empty`. New `data-heading-level` (1–6, default 2, `0` = no heading) and `data-label-heading` / `-explainer` / `-pause` / `-anchors` / `-clear` / `-anchor-one` / `-anchor-other`; the anchor count uses `Intl.PluralRules`.
    - Breaking: removed the `no-track` attribute (never implemented; use `<meta name="vb:no-track-history">`) and the `recently-visited:refreshed` event (documented but never dispatched).
    - The current page is no longer listed; `include-current` opts back in. Pause and Anchors keep fixed labels and report state through `aria-pressed`; Clear uses `aria-disabled` instead of `disabled`.
- **Changes from the P-element review.**
  - **pager-wc**
    - Breaking: the control-style attribute is `data-style` (`numbered` | `prev-next` | `load-more`). The global `style` is no longer read, so inline CSS on the host no longer switches the pager. Rename `<pager-wc style="prev-next">` to `<pager-wc data-style="prev-next">`.
    - Strings are attributes: `data-label-nav`, `-prev`, `-next`, `-page` (`Page {page}`), `-status`, `-load-more`, `-no-more`, `-missing`. Page-number buttons are named "Page N"; give a top and bottom pager distinct landmark names with `data-label-nav`.
    - Targets resolve lazily and must carry `[data-paged]`; a target inserted after the pager is picked up on its first `paged:change`. The "No paginated target found" note is a plain visible note (no `aria-live`).
  - **data-paged** — `paged:change` detail adds `visible` (items shown) and `style`. `data-paged-controls="none"` also suppresses the load-more button (the infinite sentinel still renders).
  - **page-toc**
    - Breaking: the title is `data-title` (was the global `title`, which also put a tooltip over the whole ToC). No alias.
    - Link activation scrolls with `behavior: 'auto'` under `prefers-reduced-motion: reduce` and really moves focus to the heading (`tabindex="-1"` added when needed). On wide screens (≥ 64rem) the summary no longer collapses the always-visible ToC.
  - **page-tools**
    - Implements the toolbar keyboard pattern: roving tabindex, arrow keys by orientation (mirrored in RTL), Home/End and `aria-orientation` (always `vertical` while collapsed).
    - Focus returns to the FAB only when it was inside the popover as it closed; a light-dismiss click elsewhere or the resize-driven close no longer steals focus.
    - `data-orientation` and `data-position` are observed, and `data-resolved-orientation` is reflected for every orientation. `tools` also returns the tools while collapsed.
  - **page-tour**
    - Breaking: `data-placement` is `top` / `bottom` / `inline-start` / `inline-end` / `auto`; `left` and `right` are removed. The inline values follow the text direction and the action-hint arrow flips in RTL.
    - With anchor positioning the card is centred on its side of the target (`position-area`) and flips when it would overflow (`position-try-fallbacks`).
    - `start()` during a running tour goes to the requested step and reuses the overlay (it used to build a second overlay that `stop()` left behind).
    - Action gates no longer move focus: Next is `aria-disabled` and described by the hint while waiting, then enabled with a live announcement (`data-label-ready`). The card is `aria-modal="true"` only on ungated steps.
    - Keyboard handling is on the document while active, so Escape, arrows, Home/End and the Tab trap also work from the target; arrow/Home/End are left alone in text fields.
    - `data-skippable="false"` on a `<tour-step>` now takes effect. `--tour-spotlight-padding` sets the spotlight padding (`data-spotlight-padding` overrides). New `data-label-step`, `-skip`, `-close`, `-prev`, `-next`, `-finish`, `-nav`, `-ready` replace hardcoded English.
  - **page-info**
    - Breaking: the unimplemented `og-preview` attribute and the never-set `domain-anchored` tier are removed.
    - Breaking markup: the author is plain text in `<summary>` and the author link lives in the panel's Author section (no interactive content in the disclosure control); the panel is a `<section>`, not a `<nav>`.
    - The trust tier is spelled out in the badge (`.page-info-tier`: Self-declared / Verified / Signature failed / Key unavailable), not shown by colour alone; badge colours use the `--color-*-subtle` / `--color-*-text` tokens (AA in light and dark).
    - Relative times use `Intl.RelativeTimeFormat` in the closest `[lang]`, keep the absolute date in `title`, and handle future dates. New `data-label-*` overrides, `data-concept-base` (default `/topics/`) and `data-heading-level` (2–6).
    - Reading time skips `[data-signable="false"]`, nested roots, hidden and script content, uses `Intl.Segmenter`, and shares the 238 wpm constant with page-stats (was 200).
  - **page-stats**
    - Breaking: `last-modified` no longer falls back to `document.lastModified` (it showed "just now" on dynamic pages); it reads `meta[name=last-modified]`, then `article:modified_time`.
    - Words are counted with `Intl.Segmenter` (Japanese, Chinese and Thai count correctly; CJK is timed at 500 characters per minute). Script, style, template, `[hidden]`, `[aria-hidden="true"]`, `[inert]` and `[data-stats-ignore]` content is skipped.
    - Numbers, plurals and relative dates follow the document language; new `data-label-*` labels with `{n}` templates. Changing `data-for`, `data-show`, `data-wpm` or a label recomputes; only author/SSR `<dl>` markup is adopted (the generated one is marked `data-generated`).
  - **poll-wc**
    - Single-choice arrow keys move focus and vote (APG radio group; Left/Right flip in RTL). Multi-choice no longer handles arrow keys (every option is a Tab stop).
    - A vote marks the option `data-pending` (group `aria-busy`) and ignores further clicks until `setCount()`/`setCounts()` clears it.
    - Options show their percentage beside the count ("33 · 60%"), formatted with `Intl.NumberFormat`/`PluralRules` for the nearest `lang`, with `data-label-vote|votes|your-choice|closed|poll` overrides. `data-hide-counts` also hides the bars and drops the numbers from the accessible name.
    - A host `aria-label` moves onto the option group (default name "Poll"). Can enhance a native `<form><fieldset><legend>` of radio/checkbox inputs as a no-JS fallback.
  - **popularity-index**
    - The default endpoint now exists (see Added). Reflects `data-state="loading|ready|empty|unavailable"` (with `aria-busy` while loading) and fires `popularity-index:state`; the unavailable message is generic (`data-label-unavailable`), the reason goes to `data-error` and the console.
    - New `data-heading-level` (1–6, `0` = no heading; default 2) and `data-label-heading|view|views|unavailable|empty`; view counts use compact `Intl.NumberFormat` ("1.8K views").
    - Provenance chips use the `--color-success-text` / `--color-warning-text` / `--color-error-text` tokens.
  - **pop-over**
    - The anchor's `anchor-name` is a comma-separated list: each pop-over appends its own counter-based ident (`--pop-over-anchor-N`, no longer derived from the host id) and removes only that on disconnect, so several pop-overs can share one trigger.
    - `data-mode`, `data-anchor` and `data-position` are observed and re-wire after upgrade; disconnect clears the anchor name, `position-anchor` and `data-anchor-name`.
    - `data-mode="hint"` falls back to `auto` where `popover="hint"` is unsupported; unknown modes resolve to `auto`. An unanchored pop-over keeps the viewport centring. `pop-over:not(:defined)` hiding skips hosts with an authored `popover`, so they open via `popovertarget` without script.
  - **print-page** — The raw-toggle group is named after the button label and the checkbox text can be set with `data-label-raw`. The docs agree that the default variant is `icon`.
  - **progress**
    - Colour variants (`.success` / `.warning` / `.error`) now set `--progress-fill` instead of painting the fill pseudo-elements, so one rule covers Blink, Firefox, rings and themes.
    - The track has a 1px `--progress-track-border` edge (`--control-border`, 3:1), like meter; `.xs` stays a borderless hairline. New tokens `--progress-track-border`, `--progress-fill-warning` (light mode darkened; was 2.76:1) and `--progress-ring-track`.
    - `.labeled` is scoped to `.labeled:has(> progress)` and accepts a `<header>` row (label + `<output>`), like meter.
    - The `<progress-ring>` custom element docs and compendium entry are removed: it never existed. Rings are `progress[data-type="ring"]`.
  - **progress-tracker**
    - Breaking markup: steps are a native `<ol>` inside the element (`<progress-tracker><ol><li>…</li></ol></progress-tracker>`); direct `<li>` children are no longer decorated. The host no longer gets `role="list"`; the `<ol>` is named from `data-label-list` (default "Progress").
    - `data-clickable` renders completed step labels inside a native `<button>`; the current step is not activatable. The `<li>` tabindex, roving focus and inline `cursor` are gone.
    - `data-current` matches `data-step` ids before indexes; `data-step` is optional. Step status is visually hidden text from `data-label-step`/`-complete`/`-current`/`-upcoming`/`-error`, replacing the English `aria-label` on each `<li>`. New `data-direction="vertical"`.
  - **8bit / nes / win9x themes** — Progress fills are painted from `--progress-fill`, so colour variants apply (8bit's default fill is its green `--progress-fill` instead of `--color-primary` stripes). The theme track no longer hides the indeterminate shimmer, and enhanced rings stay circular.
  - **pre** — `tab-size: var(--tab-size, 4)` on every `pre`. Code and output blocks (`pre:has(code, samp)`) are `direction: ltr` unless the `pre` has its own `dir`.
  - **p** — CJK (`:lang(zh|ja|ko)`): `p.lead` keeps the 1.8 body leading and `p.indent` indents one full-width character.
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

- **Scoped themes** — Themes scoped to an element (e.g. an article) now get their own derived colors, not the page's. `--color-primary`, interactive, surface, form, tint and chart tokens, the font slots (`--font-display`, `--font-heading`, `--font-body`, `--font-code`, …), the radius/shadow aliases and glass values are re-derived on `:where([data-theme])`, the scoped element uses its theme's `--font-sans`, (zero specificity, `@layer tokens`, so a theme's own colors still win), and a themed element inside a `data-mode` region (or the system dark scheme) gets that theme's dark or light values. Theme content rules written as `[data-theme~=x] :is(main, article) …` (headings, links, code, buttons in 42 themes) now also apply when the `<main>` or `<article>` itself carries the theme. Root-applied themes compute the same colors as before.
- **Icons pack font** — The icons pack (`icons.theme.css` / `icons.full.css`, the `./icons-css` export) loads Material Symbols Outlined from Google Fonts through an `@import` at the top of the file. The self-hosted file was never in the npm package, so icons failed to load from npm/CDN. To self-host, replace the `@import` with your own `@font-face` (see the comment in `src/packs/icons/icons.theme.css`).
- **Doc class clean-up.**
  - **Forced colors inside scoped themes** — Under `forced-colors: active` the system colour mapping is also asserted on `:root [data-theme]`, so a scoped theme re-deriving its own aliases cannot paint its palette over Canvas / CanvasText / Highlight.
  - **data-loading** — The overlay rules no longer outrank their own variants: skeleton placeholders render at full strength (they were stuck at 0.3 opacity), `data-loading="minimal"` pulses, reduced motion stops the shimmer, and a direct `<img>` / `<svg>` child of a skeleton is a grey block instead of vanishing.
  - **Description lists** — A stacked `dl` that is also `data-layout` spaces its groups with the layout gap (the group margin pushed items off the row), and a horizontal `dl` as a flex or cluster item no longer collapses to a few pixels.
  - **Reduced transparency** — `--color-overlay-strong` is a dense dark scrim (80% black) instead of an opaque light grey that hid hero and CTA background images behind white-on-grey text.
  - **nav.steps** — With `data-labels="below"` every step gets an equal column, so the final connector no longer runs past the last marker; horizontal steppers no longer overflow sideways in narrow containers (4 steps at 360px ran ~230px past the edge).
  - **Autoload guards** — `[data-audio-playlist]` now loads from the core and autoload bundles, and `track[kind="chapters"][data-chapter-list]` from the autoload bundle; both only worked with the full bundle.
  - **chart-wc** — The `data-type="ring"` hole follows `--color-surface`; it was painted white in dark mode.
  - **data-wizard** — The review step shows what the user chose: a select's option text, a checked radio's or grouped checkbox's label, and "Yes" for a standalone checkbox (`data-label-yes`), instead of submitted values. Summary rows align, and the data-wizard page's demo is a working wizard.
  - **Pattern demos** — The newsletter footer's "Email address" label is visually hidden (it used `.sr-only`, which exists only inside nav-bar), footer column headings match their CSS, and the FAQ notes and carousel props table name the real `single` / `bordered` / `indicator` and `item-width` / `gap` attributes.
- **Native attributes review.**
  - **integrity** — Corrected the claim that SRI is "silently skipped" without `crossorigin`: a cross-origin no-cors load with `integrity` is blocked (fails closed). Corrected multiple-hash guidance (only the strongest algorithm's hashes count). Replaced the malformed 63-character sample hash with the real SHA-384 hashes of the VB 0.5.0 CDN entry files and the `openssl dgst -sha384 -binary file | openssl base64 -A` command. Added `rel=preload`/`modulepreload`, import-map `integrity`, and what SRI on VB's entry tags does not cover (packs, themes, autoload chunks, Mermaid).
  - **nonce** — Corrected "nonces do not protect external scripts": nonces apply to `<script src>` too, and the recommended strict CSP is a nonce on every script plus `'strict-dynamic'`, `object-src 'none'`, `base-uri 'none'`. Replaced the caching rationale with the real risk (nonce reuse), noted that nonce hiding needs a header-delivered policy, and fixed the Express sample (valid JS). Added a "VB under CSP" section and a live meta-CSP demo.
  - **sandbox** — Fixed the "can escape" sample: escape requires same-origin content (own paths, `srcdoc`, `about:blank`). `allow-same-origin` is described as keeping the real origin. The payment example uses `allow-top-navigation-by-user-activation`. Removed "no console warning" (Chromium logs blocked actions). Added `allow-storage-access-by-user-activation`, support notes and VB's social-embed sandboxing.
  - **srcdoc** — Corrected the isolation claim: unsandboxed srcdoc inherits the parent's origin and CSP. Untrusted HTML now requires `sandbox` (never with both `allow-scripts` and `allow-same-origin`); corrected the escaping rules (only `"` and `&` must be escaped). Added VB's sanitiser/card-list blocking and `data-mock` placeholders.
  - **allow** — Corrected "prefer `allow="fullscreen"` over `allowfullscreen`": Safari does not support `fullscreen` in `allow`, so keep `allowfullscreen`. `allowpaymentrequest` is marked obsolete; noted that the `Permissions-Policy` header is Chromium-only and which features Safari honours. Added youtube-player/social-embed defaults and a sandbox warning.
  - **crossorigin** — Corrected "same-origin resources ignore it": font preloads need `crossorigin` even for same-origin fonts, and the stylesheet does not. Added module-script CORS, `anonymous` credentials meaning same-origin cookies, and the VB CDN example.
  - **ping** — Now covers `<area>` as well as `<a>`; corrected the `Ping-From` rule (omitted for any cross-origin ping from an HTTPS page); added credentials and privacy notes, VB analytics' `ping` on outbound links and the sanitiser stripping it.
  - **rel** — `noopener` is documented as the default for `_blank`, `noreferrer` as a privacy trade-off, plus `opener`; `rel` on forms only matters with a new browsing context; prev/next are no longer an SEO signal; added `expect` + `blocking`, legal and meaning values, VB's rel styling hooks and links-init's automatic `noopener`.
  - **list** — The dynamic-suggestions sample built options from API data with `innerHTML` and put raw input in the URL; it now uses `new Option()`, `encodeURIComponent` and an `AbortController`. Browser notes corrected (Safari supports datalist since 12.1; Firefox for Android shows no dropdown) and VB's `input[list]` arrow and variants documented.
  - **contenteditable** — Corrected: there is no implicit `role="textbox"` (authors add role, name and aria-multiline), and no browser shortcut creates links. Added the empty-string and inherit values, `plaintext-only` support (Baseline 2025), a Security section on sanitising pasted HTML (`setHTML()`), `beforeinput` in place of deprecated `execCommand`, and VB's `data-markdown-editable`.
  - **pattern** — The username example `[a-zA-Z][a-zA-Z0-9_-]{2,15}` was invalid under the `v` flag browsers compile `pattern` with, so it silently did not validate; it is now `[a-zA-Z0-9_\-]`, with a section on v-flag escaping. The page no longer claims `pattern` applies to `<select>` and `<textarea>`, and the min/max/step, minlength/maxlength, required and form/formaction material moved to their own pages.
  - **form** — Corrected the claim that `<fieldset form>` associates its children; it associates only the fieldset. Added the failure mode where a wrong id leaves a control with no form owner, removed the "dialog is a separate DOM subtree" and "accessibility tree respects the attribute" claims, and replaced inline `style`/`onclick` samples with `commandfor`/`command`.
  - **disabled** — The page said `data-loading` "handles the disabled state"; it uses `aria-disabled` + `aria-busy` and deliberately avoids `disabled`. The `inert` advice for readable content is gone (inert hides content from assistive technology), the submit-disabling script is replaced by `data-loading`, and VB's disabled styling and conditional-section disabling are documented.
  - **required** — Removed hand-typed asterisks (`<form-field>` adds them) and the claim that validation only runs on submit; corrected the select "empty" rule (placeholder label option only). Documents `data-message-valuemissing`, `:user-invalid` styling, `data-min-checked` and how `data-show-when` / `data-wizard-if` disable hidden required fields.
  - **autocomplete** — Dropped the invalid `autocomplete="nope"` workaround; added `<form>` to "applies to", the `section-*`, `shipping`/`billing`, contact-kind and `webauthn` tokens, and the rule that data-autosave and data-wizard-persist never store `off` or secret-token fields.
  - **enterkeyhint** — The Enter-to-send handler now skips IME composition (`isComposing` / keyCode 229); the textarea advice no longer suggests non-`enter` hints without intercepting Enter; inline `onsubmit` and div demos replaced.
  - **readonly** — The `:read-only` sample matched checkboxes, radios and range inputs; it is now scoped to text-like fields. The applies-to list includes number, date and time types, and VB's `--input-readonly-bg` / dashed border tokens are documented.
  - **placeholder** — Corrected "line breaks are ignored" (textarea placeholders render line feeds) and "cannot add backgrounds" (`::placeholder` takes the `::first-line` property set); helper text uses `output.hint`, which is wired to `aria-describedby`.
  - **multiple** — The email value is `a@x.com,b@y.com` (whitespace is stripped), not comma-space; added `size` on `<select>` (VB styles single-row selects only; iOS Safari ignores `size`), `data-min-checked`, `data-upload` and `<combo-box multiple>`.
  - **inputmode** — Replaced the "type=number strips leading zeros" claim (the value keeps them) with the real problems; documents the inputmode that data-mask, data-accept and OTP fields set.
  - **dirname** — Full applies-to list (including hidden and submit inputs, not `<button>`), the `dir="auto"` requirement, an escaping server sample and Baseline 2023 support.
  - **wrap** — Corrected the HTML 4 history of `wrap="off"` (never standard) and the "hard needs cols or acts as soft" claim; documents that VB's full-width textareas make hard-wrap breaks follow the rendered width.
  - **autofocus** — The page said browsers focus the *last* autofocus element; they focus the first focusable one, per scope. It also said a dialog with no autofocus focuses itself; `showModal()` focuses the first focusable descendant (put `autofocus` on the `<dialog>` to focus the dialog itself). Removed the non-existent `button.danger`, documented that popovers have no first-focusable fallback, and added the VB hooks (data-focus-trap, content-swap, chat-input, sanitizer).
  - **autocorrect** — The support section was years out of date: it is Baseline 2026 (Chrome 153, Firefox 136, Safari 14.1) and in the WHATWG spec, and desktop Safari does correct. Added the empty value, the always-off `password`/`email`/`url` types and form-owner inheritance; dropped the no-op `autocorrect="off"` on a URL input.
  - **accesskey** — Removed invented data-hotkey features (sequences, conflict detection, a Ctrl+/ dialog). Duplicate data-hotkey bindings only warn in the console and the last one wins; `<short-cuts>` opens with Shift+?. Explained that accesskey always has a modifier, so WCAG 2.1.4 and VB's single-key shortcut preference do not apply, and that VB never reads `accesskey`. The self-contradicting Alt+D example is gone.
  - **class** — Removed `.sticky` (it is `data-sticky`) and `table.compact` (tables use `data-density`); fixed `.lead` (it is `p.lead`). Added VB's class-versus-data-attribute rule, a table of variants that are attributes, and the missing element classes, each checked against `src/native-elements`.
  - **tabindex** — The skip link uses the `.skip-link` recipe instead of `.visually-hidden`, which hid the focused link. Removed the advice to "disable" controls with `tabindex="-1"`. Corrected the focus-ring claim (no VB rule for arbitrary `[tabindex]`), replaced inline `onclick` and `<div role="button">` samples, and listed the VB components that manage roving tabindex.
  - **title** — Documented VB's hooks: `abbr[title]` styling, print expansion, icon-only button padding, `<tool-tip>`'s title fallback and data-hotkey labels. Explained the accessible name versus description rule and fixed the outdated multi-line support note.
  - **dir** — Added how VB handles RTL: `:dir(rtl)` mirroring across navigation, dialogs, form controls, lists, tables, shapes and view transitions; `icon-wc[data-flip-rtl]`; code blocks forced LTR. Added `:dir()` versus `[dir]` and removed the copy-and-paste and form-submission claims (form submission needs `dirname`).
  - **lang** — The `:lang()` sample uses VB's `q:lang()` form (the old `:lang(x) > q` missed `lang` on the `<q>` itself) and no longer hard-codes CJK fonts. Documented script typography tokens, CJK inline substitutes, the quote table, hyphenation and that VB's formatters use the nearest `[lang]`. Corrected `lang=""` (it only marks the language as unknown) and added WCAG 3.1.1/3.1.2.
  - **translate** — The "forms" example put `translate="no"` on text inputs, where it does nothing to typed values; the page now lists the translatable attributes it does cover (title, alt, placeholder, label, value, abbr, download, meta content, srcdoc). Added the empty value and `data-lorem`'s automatic `translate="no"`.
  - **spellcheck** — Removed an internal tracker reference and the non-existent `data-spellcheck`. Added the empty value, a privacy note, VB components that set the attribute, and VB's spelling-mark style for `<u>`.
  - **autocapitalize** — Added form-owner inheritance, browser defaults and support (no desktop Safari); the booking-reference pattern now accepts lowercase.
  - **is** — Rewrote the support and fallback notes (WebKit position: oppose), noted that `is` is read only at creation, and added VB's approach: data-* enhancers such as `data-mask` on native elements.
  - **hidden** — Corrected: `hidden="until-found"` content is not in the accessibility tree until revealed, and `inert` has no default styling (removed the faked opacity demo). The until-found example is no longer nested inside `<details>` and shows `beforematch`. Documents VB's reset-layer `[hidden]` rule with the `data-visible` and `hide-until-ready` gates. Inert moved to its own page.
  - **draggable** — Removed the recommendation of deprecated `aria-grabbed` / `aria-dropeffect`; the default is the `auto` state, and protected drag data applies to every drag (not only cross-origin). Documents VB's global `[draggable]` styles and drag state hooks, WCAG 2.5.7 single-pointer alternatives, and leads with `<drag-surface>`.
  - **open** — VB does animate `<details>` (via `::details-content` + `interpolate-size`, Chromium only), and the source path and internal bead reference are fixed. Dialog examples use invoker commands instead of `onclick`; added `closedby`, a warning against removing `open` by hand, and VB's details/dialog `[open]` styles.
  - **srcset** — Removed the stale "future data-responsive" aside: `data-responsive` ships, and the page explains when to use it versus `sizes="auto"` (Chrome 126, Firefox 150, Safari 27 partial). Added `<source>` width/height for art direction and `img.currentSrc`.
  - **controls** — Removed the "future media-controls" aside: `<video-player>` and `<audio-player>` ship and wrap native `controls`. The keyboard list (Space/K, M, F, C…) was VB `<video-player>`'s, presented as browser behaviour; native keys are now described as browser-defined. `controlslist` is stated as Chromium-only. Added `disablepictureinpicture`/`disableremoteplayback`.
  - **loading** — `fetchpriority` does not apply to `<iframe>` (removed). Added that lazy loading is disabled when scripting is disabled, that lazy images need a size, `loading` on video/audio (Chrome 150 only, experimental) and an Accessibility section. Dropped the `decoding="sync"` advice and the parser-blocking `fetchpriority="low"` script sample (now `async`).
  - **blocking** — Support corrected: Chrome 105 and Safari 18.2, not Firefox. Added `rel="expect"` (Chrome 124, Safari 18.2), a feature-detection demo, and how VB's theme boot avoids a flash without `blocking`.
  - **async / defer** — Inline module scripts do honour `async` (the page said inline scripts ignore both). Added how VB loads (one module from the quick start, five ordered modules in the docs layouts, classic inline theme boot), `modulepreload`, `fetchpriority` on scripts and `nomodule`.
  - **cite** — Added `<q>`, which also takes `cite`. Replaced a quote misattributed to Leonardo da Vinci "from The Design of Everyday Things" (Don Norman's book, which does not contain it) with correctly sourced spec text, and the retired W3C HTML 5.2 link with WHATWG. Documented `figure.quote` attribution, the blockquote dash prefix and the sanitizer's URL check.
  - **datetime** — `data-format-date` already provides the formatting and tooltip the page said needed custom JavaScript. Removed the invalid `P1Y6M` duration (HTML durations allow weeks, days, hours, minutes and seconds only) and the claim that assistive technology reads `datetime`. Added year, yearless, offset and week forms and the `del`/`ins` restriction.
  - **reversed** — Documented VB's wider ordered-list indent for `reversed`, `start`, `li[value]` and Roman numerals, and the `--ol-indent` override. Samples use the `type` attribute instead of inline `list-style-type`; corrected "there is no way to override a single item".
  - **poster** — Removed inline `style` from samples and the "responsive poster" sample that had nothing responsive. Added `<video-player>` `data-poster`, `<youtube-player poster>`, `data-mock` and LCP preloading.
  - **preload** — Removed the Chrome Data Saver claim (retired in Chrome 100). The default is browser-defined, with the spec suggesting `metadata`. Added how VB players show duration under each value.
  - **target, download, referrerpolicy** — Template conformance, live demos, VB integration (links-init, the `a[download]` glyph, `[data-file]`, component referrer policies), dated support notes (including cross-site clamping of loose referrer policies), and the Blob sample revokes the object URL after a delay instead of straight after `click()`.
  - **form-field** — A field marked `data-invalid` (for example a server-side error) showed the green check instead of the red cross. The shared icon rule's `:is(:has(:user-valid:required), …)` took the specificity of its most specific argument and outranked the invalid rule; the state list is now `:where()`.
  - **chart-wc download()** — The object URL is revoked a minute after the click instead of immediately, which could cancel the download in Safari and Firefox.
  - **data-format-date** — Only dates and date-times (values starting with the year) are formatted. Yearless dates (`09-22`), times and durations are left as written; V8's lenient parser turned `datetime="09-22"` into 22 Sep 2001.
  - **Docs classes** — Attribute pages no longer use the undefined `table.prose` and `.icon-only` classes (found by the new lint).
  - **popover (reset)** — a closed popover is now `display: none !important` in the reset layer (`:where([popover]:not(:popover-open, dialog[open], [data-page-layout="dashboard"] > nav))`), the same mechanism as `[hidden]`. VB's element rules (nav, section, article, aside, form, figure, header, footer, menu, dl, search) used to beat the UA hiding rule, so closed popovers on those elements stayed on the page. `<dialog popover>` opened with `showModal()` still shows (dialog[open] excluded, as in the UA rule); exit transitions of `display` still run. The dashboard `nav[popover]` stays exempt: it is a grid column at 48rem and up and a slide-out drawer below.
  - **popover (reset)** — `:where([popover]) { margin: auto }` restores the browser's viewport centring for bare popovers, which the reset's `* { margin: 0 }` had pinned to the top-left corner. Zero specificity, so every component and anchored placement that sets a margin still wins (audited across all popover demos: no component moved).
  - **section / article / aside popovers** — no longer inline-size query containers (`layout-attributes.css` excludes `[popover]` via `:not(:where([popover]))`, specificity unchanged). Size containment collapsed an open sectioning popover to ~20px.
  - **interestfor timing** — VB's 200ms / 100ms tooltip timing moved from `[popover="hint"]` (where nothing reads it) to the invoker, `[interestfor] { interest-delay: 200ms 100ms; --interest-delay: 200ms 100ms }`. Native interest invokers read the standard property, the polyfill the custom one, both from the invoker. Set as shorthands so an author's shorthand or longhand overrides them. `<tool-tip variant="card">` triggers get 300ms / 200ms, matching its JS fallback.
  - **role="tooltip" popovers** — a click tooltip opened by a plain `popovertarget` (no `data-anchor`) is now anchored to its invoker through the implicit anchor (`position-anchor: auto` + the same `anchor()` placements as `data-anchor` tips, including `data-tooltip-position`). It used to need tooltip-init's script placement and landed at (0,0) without it. `tooltip-init.js` no longer writes inline top/left where anchor positioning is supported; it still places click tips with script elsewhere.
  - **popover="hint"** — `kbd` and `code` inside a plain hint (no `role="tooltip"`) get the same translucent-currentColor tints as tooltips; they kept the page's light key-cap fill under light hint text.
  - **color-picker** — the panel's open/close fade survives the new closed-popover rule (display/overlay in the exit transition, `@starting-style` on open); the closed panel used to stay displayed at `visibility: hidden`.
  - **html-validate** — `hidden="until-found"` and `contenteditable="plaintext-only"` are accepted (global `"*"` override in `src/htmlvalidate/elements-overrides.cjs`); the disable comments in `attr-hidden-until-found.html` and `attr-contenteditable-basic.html` are gone (the latter keeps `prefer-native-element` for role="textbox").
  - **docs** — tooltip page: interestfor native in Chrome 142+ (not 133), the Custom Timing sample sets the delays on the invoker with both native and polyfill properties, Tier 2 samples use `<p popover="hint" role="tooltip">`. data-toggle page: `[commandfor]` is not wired via `data-command`; VB does not polyfill it and only lists `[commandfor]` buttons in `<command-palette discover>`. popover page: describes the new reset rules and drops the "add display:none / margin:auto / container-type:normal yourself" workarounds.
  - **form[data-validate] + formnovalidate** — a submission started by a button or `input type=submit|image` with `formnovalidate` now skips the coordinator's checks in native, `data-submit="fetch"` and `data-submit="event"` modes, as the browser does for a plain form. Before, the coordinator validated every submission (and had set `novalidate`, so the browser couldn't skip either), so Save-draft buttons were blocked by empty required fields. An open error summary is hidden; `vb:beforesubmit` still fires (`src/lib/form-coordinator.js`).
  - **data-submit="fetch"** — the POST body now follows the submitter's `formenctype`, else the form's `enctype` attribute (`application/x-www-form-urlencoded`, `text/plain`, `multipart/form-data`); with neither authored it stays multipart so file inputs keep working. `formtarget` is still ignored by design: the response is handled in the page, there is no window to target.
  - **data-wizard + data-validate** — submit on the last step routes back to the step holding the first invalid control again. The wizard read the `novalidate` that the coordinator sets as "validation off"; only an authored `novalidate` (without `data-validate`) now turns routing off. `wizard:complete` (and the clearing of persisted wizard state) now waits for the coordinator's `vb:beforesubmit` on `data-validate` forms: it used to fire for a blocked, invalid submit (wiping `data-wizard-persist` data) and twice for a valid native submit (`src/lib/wizard.js`).
  - **data-upload** — the accept hint reads in words: `.pdf` / `application/pdf` → "PDF", `image/*` → "images" (also "audio", "video"; translatable with `data-label-images` / `-audio` / `-video` on the input), other MIME types as written in lower case, duplicates collapsed. It used to upper-case every token ("IMAGE/*") (`src/utils/upload-init.js`).
  - **tool-tip** — `delay` now applies when the tip is driven by `interestfor` (native or polyfilled): it is written to the trigger as `interest-delay-start` and `--interest-delay-start`, and removed on teardown. Only the JS-timer path used to read it.
  - **Docs indexes** — The pack badge on the elements and attributes indexes is styled; it rendered as bare text.
- **Utility attributes review.**
  - **data-copy** — The copied, pasted and failed states add a ✓ / ✕ mark (empty alt text) and a forced-colors outline, so colour is not the only cue. On a `<button>` the state sets `--btn-color` instead of the text colour, so a filled button turns success / error with readable text (success-green text on the blue primary button was about 1.5:1).
  - **data-select-all** — Disabled targets are no longer toggled or counted; a disabled unchecked row used to keep the master from ever reaching "all". The master re-syncs after form reset, when rows are added, removed, enabled or disabled in the scope, and when `data-select-all` changes. State is kept in a WeakMap (cloned masters work) and torn down on removal. The count is `Intl`-formatted, and an `<output data-selected-count>` is announced.
  - **data-hotkey** — Key aliases work in bindings: `?`, `space`, `esc`, `up`/`down`/`left`/`right`, `return`, `del` and `plus`. Shifted punctuation matches with or without `shift+`, `ctrl++` matches on layouts where `+` needs Shift, and Alt/Option letter combos match by physical key (Mac Option+K). Bindings are removed when the element leaves the document (they used to fire forever and leak), re-made when `data-hotkey*` changes, and skipped while the target is hidden, inert or disabled. The shortcuts-dialog label defaults to the accessible name without `<kbd>` hints ("Save", not "Save ⌘S Command S"). Duplicate-binding warnings compare normalised combos (`meta+k` = `cmd+k`).
  - **data-spoiler** — Revealing moves focus to the revealed content; focus used to drop to `<body>` when the trigger hid. Hide and Escape return focus to the trigger. The Hide button reads "Hide spoiler", and the generated buttons have a visible focus ring. Delegated listeners make cloned and restored spoilers work, and group names are `CSS.escape`d (a quote used to throw).
  - **data-effect="animate-image"** — Pause shows `data-poster`, else the captured first frame. A cross-origin image with no capturable frame is hidden behind its alt text (`[data-animate-image-hidden]`, `.animate-image-placeholder`) instead of animating under a "paused" button (WCAG 2.2.2). `<picture>` and `srcset` work: the whole `<picture>` is wrapped, and `srcset`, `sizes` and `<source>` are set aside while paused and restored on play. It watches `<html data-motion-reduced>` at runtime as well as `prefers-reduced-motion`, and turning that off resumes only the images it paused. A missing `alt` warns in the console. A clone of a paused image restores its animated source. The effects pack imports one copy of the toggle CSS, and forced-colors styles are added.
  - **data-sortable** — List-mode controls resolve their target when used, so a `<select>` or `<button>` rendered before its `[data-sortable]` container is no longer skipped, and a select's initial value applies when the container appears. Button controls get `aria-pressed`, and list sorts are announced ("Sorted: Newest first. 24 items"). Text sorts collate in the container's closest `[lang]`. Number sorts read formatted text ("1,234", "$5", "12 %", "1.234,5", "(4)") through the new `parseSortNumber()` export.
  - **data-paged** — The injected nav reads the same `data-label-*` set as `<pager-wc>` (from the container or an ancestor) and formats numbers with `Intl`. Numbered page changes are announced ("Page 2 of 5"), and load-more and infinite modes announce "Showing {visible} of {total}".
  - **data-format-date** — Relative times put the exact date and time in `title`; it used to hold the authored placeholder text. Changes to `datetime`, `data-format-date`, `data-format-time`, `data-time-zone`, `data-locale` or any `lang` re-format the element and reschedule the relative refresh. Clones of an enhanced `<time>` are formatted and get their own timer. 350 days reads "last year" instead of "12 months ago", because units round up into the next one.
  - **data-format-number / data-format-bytes** — The locale follows the nearest `[lang]` (it was `<html lang>` only). Changes to `lang`, `data-locale` and the style attributes re-format. A negative `data-format-bytes` precision no longer throws, negative values keep their sign, and `value="0.5"` no longer renders "512 undefined"-style output.
  - **data-math** — Rendered `<math>` gets `alttext` (the LaTeX source) unless it has one. A refused clipboard write is announced instead of failing silently. Cloned rendered equations keep a working copy button (one delegated listener) and are not rendered twice. In a browser without MathML the source stays visible.
  - **data-responsive** — The ResizeObserver no longer feeds a request loop: `sizes` only grows, and an image that fails to load is no longer measured. The live demo issued about 27 requests per second for a missing candidate. The shorthand parses URLs properly: a dot in the hostname is no longer treated as the extension, extension-less URLs are skipped with a warning, and the query and hash are kept. The `w`-descriptor check no longer matches any URL that contains a "w". One shared ResizeObserver replaces one per image. The debug badge uses CSS instead of inline styles and is never inserted inside `<picture>`. The demo uses real local placeholders at every width (`src/assets/placeholders/responsive{,-400,-800,-1200}.svg`).
  - **Print** — `[data-print-only]` keeps its own display type in print: spans stay inline, tables stay tables and list items keep their markers. Article-mode section breaks now match sections directly in the element, its `<main>` or its `<article>`, so VB's own demo breaks. Page modes are inside the `data-print-raw` guard. `aside.note` keeps its inset box, and `[aria-hidden="true"]` elements can be printed with `data-print-keep`.
  - **Docs** — The data-copy, data-select-all, data-hotkey, data-spoiler, animate-image, data-sortable, data-paged, data-format-date, data-format-number, data-format-bytes, data-math, data-responsive, data-visible, hide-until-ready, data-print and view-transitions pages follow the attribute template. Options, events and styling hooks are verified against the code. Demos replace inline `<div class="example">` blocks, and each page has a Related section with "which to choose" guidance. data-format-date no longer ships `${relativeDates…}` placeholders and "Loading..." text literally. The data-visible demo is readable in dark mode, and the print demo no longer prints "vb.test". The attribute index drops the stale `data-ticker` entry, moves data-select-all to form behaviour and lists animate-image as `data-effect="animate-image"`.
- **Styling and shapes review.**
  - **article[data-numbered] / [data-section-numbers]** — Numbering restarted at 1 in every `<section>` (container style containment on the article and its sections scoped the counters), and every subfigure was lettered "(a)".
  - **Numbered equations** — `.equation` numbers restarted at (1) in every `<section>` of an article for the same reason. An article that contains an equation, and its sections/asides, are no longer query containers (`data-container` opts back in). `ol` and footnote list numbering were checked and are not affected.
  - **data-drop-cap** — Under organic, swiss and editorial a `data-drop-cap` article got the initial-letter cap plus a physical left float (wrong side in RTL); articles without the attribute got a cap anyway.
  - **article[data-prose]** — The headline image float never applied (`img:not(:only-child)` ignores text nodes).
  - **hr[data-ornament]** — A bare `data-ornament` (or `""`) rendered an invisible 0px separator; it now shows `--hr-ornament` (default ⁂).
  - **time[data-badge]** — No longer matches the shape-badge rule in `shape()`-capable browsers, where it rendered as a solid primary box with dark text instead of the documented bordered chip.
  - **dl[data-striped]** — Skips `[hidden]` entries (flat and wrapped), so filtering keeps the alternation; the stripe (was `--color-surface-raised`) is visible on white in light mode.
  - **Section edges** — Content at the end of a tall section on a narrow viewport was clipped (percentage padding resolved against width, the clip against height). Mixed start/end values (e.g. `chevron` + `scallop`) dropped the start shape; all 16 pairs now compose. `diagonal` mirrors in RTL. Clips bleed past the straight sides so focus rings and shadows are not cut. Forced colours and print drop the clip.
  - **data-clip** — `<figure data-clip>` clips an image inside a direct `<picture>`; `swoosh`, `diagonal-frame` and `torn` mirror in RTL.
  - **data-cutout** — `badge-corner` is a concave bite (it rendered as a rounded corner) and moves to the top-left in RTL; `circle` is a true circle on square elements; the element's own focus ring survives; forced colours and print drop the clip.
  - **data-bubble** — `outgoing` text used the undefined `--color-on-primary` (dark text on primary, about 3.2:1); it now uses `--color-text-on-primary-auto` (AA, kawaii's gradient included: worst stop 5.1:1). Tails mirror in RTL, the `error` edge stays on the accent side, and forced colours/print draw a frame with a thick edge on the tail side.
  - **data-callout** — In RTL `tip` rounded the side the border was on; the speech tail is a fixed length so the reserved padding matches it at every size; speech and notched mirror in RTL; forced colours and print draw a real frame, and the print stylesheet no longer strips `aside[data-callout]`.
  - **Undefined tokens** (found by the new lint) — `image-gallery`, `carousel-wc`, `compare-surface`, `recently-visited`, `slide-accept`, `split-surface` and the article highlight marks used `--color-focus` (undefined, or hidden behind a fallback); they use `--color-focus-ring`. `page-tour` buttons use `--color-text-on-primary-auto` instead of `--color-on-primary, #fff`. `reader-view` uses `--duration-normal` / `--ease-out` instead of the non-existent `--motion-*` names, so its transition honours reduced motion. The `css-shapes-dividers` demo used the undefined `--color-on-primary`.
  - **Docs** — Themes page lists all ten accents in one demo (no `div`/inline styles) with a hue table generated from `COLOR_ACCENTS` (the old forest/sunset hues were wrong); shapes demos lost auto-generated aria-labels, `css-shapes-chat` uses `role="log"` and sender names; attribute index, sidebar and navigation entries point at the new pages (badge shapes → `layout-badge#shapes`).
- **Effects review.**
  - **Bundle parity** — `vb-triggers.js` and `vb-transitions.js` ship in every bundle that carries the runtime (`vanilla-breeze-core.js`, `vanilla-breeze-extras.js`, `packs/effects.full.js`, `packs/kawaii.full.js`). Before, every `data-trigger` was inert and every `data-transition` preset unnamed on core, core + extras (the docs site) and pack pages. `stamp` and `flipboard` were missing from extras. Unit test asserts the entry imports; a built-bundle spec covers the rest.
  - **Reduced motion** — Loops kept animating under `prefers-reduced-motion` (specificity) and `:root[data-motion-reduced]` left entrances stuck at opacity 0. `data-motion-reduced` now also stops `data-parallax`, `data-animate` reveals and `scroll-driven.css`; reduced motion zeroes view-transition `animation-delay` so staggered transitions are instant.
  - **data-trigger** — Unknown or misspelled triggers no longer leave content hidden: the runtime warns once per name and activates the element after `load`. `view-progress` / `scroll-progress` without `animation-timeline` support no longer stay hidden.
  - **Clones and reinsert** — Cloned elements wire their own trigger and drop a duplicate `view-transition-name` (which aborted every view transition on the page); a removed + reinserted element is re-wired and re-named; changing or removing `data-transition` re-applies / clears. JS effects run real `cleanup()`: `typewriter` (incl. `.loop`), `scramble`, `ticker`, `flipboard` timers are cancelled, re-activation restarts one run instead of stacking, and split text, `animate-image` and `highlight` are restored. `flipboard` rebuilds after reinsert and from clones; cloned `data-emoji` inputs are enhanced.
  - **data-transition** — The fallback name for an unregistered value is a valid ident from the name only (`effect-vb-4`, not `effect:fade-vb-4`). `[data-swap]` / `<content-swap>` hosts are skipped, keeping content-swap's own transition.
  - **data-stagger** — The time shorthand was documented but ignored (every demo ran at 80ms). Children added or removed later are re-indexed; `grid` works for auto-placed grids (RTL-aware). The `[data-stagger] > *` delay rule moved to `effects-core.css` so it ships with the core runtime.
  - **Accessible names** — `flipboard` reads the original text once (cells `aria-hidden`, graphemes never split); `glitch` pseudo-element copies carry empty alt text, so the name is the text once; text effects no longer put `aria-label` on `p` / `span`.
  - **Keyboard** — `glitch` and kawaii `wiggle` with `data-trigger="hover"` also run on `:focus-visible` / `:focus-within`.
  - **Text effects** — `reveal class="line"` yields real lines (measured from rendered word boxes) and `reveal` / `blur-reveal` re-measure on resize. `--vb-scramble-chars` with quotes (`'01'`) no longer feeds the quotes into the fill. `view-progress` / `scroll-progress` `slide-in` uses the RTL keyframe in RTL.
  - **data-emoji** — Times and ratios (`10:30:45`, `16:9`) are never changed (a token's opening colon must not follow a letter, digit or underscore); adjacent codes (`:fire::rocket:`) both convert; skips apply at any depth (highlighted `<pre><code><span>` is safe). Adding `data-emoji` to an existing element is picked up and removing it stops observe mode, including on autoload pages that had no `[data-emoji]` at boot (the full-tier guard now watches for the first late one).
  - **rating** — Dropped the `data-effect-processed` workaround.
  - **Demos** — `transition-morph` is keyboard-operable (a button in each card title, focus moved into the swap, `hidden` instead of `style.display`); `parallax-hero` uses tokens, a preset and a contrast scrim. New demos `data-transition-presets.html`, `data-emoji-rules.html`, `effect-pause-control.html`, `effect-text-markup.html`.
- **Form attribute review.**
  - **Form reset** — range, stepper, color, mask, accept, upload, toggle-tags, strength, count, grow and show-when re-sync after `form.reset()` (via `onFormReset`); cancelled resets do nothing. Range fill/bubble, stepper button state, colour swatch, mask format and `data-raw-value`, the accept filter, the upload list and status, the toggle-tags limit and the strength meter used to keep their pre-reset state.
  - **data-stepper** — The +/- buttons no longer change a `readonly` or `disabled` input; they are disabled with it (including attribute changes after load and a disabled fieldset). Button state also re-syncs on `change`. Button icons are `aria-hidden`.
  - **data-range** — In RTL the value bubble and datalist labels are centred on the thumb (they were off by their own width). `max="0"` is honoured (ranges like -100..0).
  - **data-color** — In forced colours the swatch keeps its colour and focus is a `Highlight` outline.
  - **data-mask** — A custom pattern whose literals contain token characters (`+1 ###-####`) no longer re-reads the literal as typed input. The caret stays put when an edit leaves nothing before it and stays after a character typed mid-value; Backspace/Delete next to a separator removes the neighbouring character. An unknown preset or missing pattern is retried when the attribute is fixed. No more `setSelectionRange` errors on `email` / `number` inputs.
  - **data-upload** — Dropping several files on an input without `multiple` keeps only the first (all were assigned); rejected names are announced in a `role="status"` line and, if every file is rejected, the current selection is kept. A drop fires `input` before `change`.
  - **data-toggle-tags** — `data-max` no longer re-enables options the author disabled. The limit re-syncs when `data-max` changes. Forced-colours mode distinguishes checked chips (`Highlight` / `HighlightText`).
  - **data-strength** — Prefilled and browser-restored values are evaluated at setup (the meter was empty until typing).
  - **data-show-when / data-hide-when** — Conditions in forms added after load, and sections outside any form on pages that also have form sections, now update. Checkbox groups match when any checked box has the value and `select[multiple]` when any selected option does (was: first control only). Form-associated components (combo-box, date-picker, star-rating …) and `form="id"` controls take part.
  - **data-wizard** — On a submit attempt, an invalid control in another step takes the user to that step and reports it instead of failing with "not focusable" (fixes `data-wizard-validate="none"`). Step validation, `data-wizard-if` and the summary include form-associated custom elements. The auto summary joins checkbox-group / multi-select values, labels groups from their legend, and leaves out hidden and password inputs. The live region is not re-written on every keystroke. `nav.steps` items map one-to-one to step fieldsets (a skipped step shifted later items). A cloned wizard is enhanced with one status region and delegated handlers; the `hashchange` listener is removed once the form is detached. A native reset re-evaluates conditions before returning to step 1.
  - **data-autosave** — A pending 500 ms save is cancelled on submit and reset, so a fetch submit or reset no longer writes the sent/cleared data back; a cancelled reset keeps the draft. Named submit buttons are no longer all set to the last saved value. Disabled controls are not saved.
  - **data-count / data-grow** — A cloned `data-count` textarea adopts the cloned counter (new id, `aria-describedby` repointed) instead of showing a frozen count. Without JavaScript, `data-max-rows` caps and `rows` sets the starting height in browsers with typed `attr()`.
  - **Docs** — The data-switch, data-range, data-stepper, data-color, data-mask, data-accept, data-upload, data-toggle-tags, data-strength, data-show-when, data-wizard, data-autosave, data-count and data-grow pages were rewritten on the attribute template (Overview, Usage, Options, Events, Styling, Accessibility, Examples, Related) from the shipped code. Removed claims include invented custom properties, "gated on `[data-*-init]`", a `readonly` switch, mask upper-casing, a submitted `data-raw-value`, `data-show-password`, `.strength-fill`, `--strength-track-*`, `inert` as the show-when validation skip, and `toast-msg::part(toast)`. Every `<div class="example">` became a `<browser-window>` demo with matching code. The autosave page has the real `vb:autosave:{key}` key, a Privacy section and a working clear snippet. Related sections cross-link the enhancements, the native input/textarea/form/select/fieldset pages, `<form-field>`, `<stepper-wc>`, `<color-picker>`, `<combo-box>` and `<progress-tracker>`. The file-display pattern no longer calls data-accept file-type gating, and the accept-filter demo no longer misuses `<nav>`.
- **Layout docs and layout fixes.**
  - **data-page-layout** — `data-layout-sidebar-width` and `data-sidebar="collapsed"` had no effect on `sidebar-left`, `sidebar-right` and `holy-grail`, because the templates resolved `--_sidebar-width` on `:root`. Host-level `--sidebar-width` overrides now reach the grid too.
  - **data-page-layout** — `sidebar-left` without a `<nav>` rendered `<main>` 0px wide (main fell into an implicit auto column and its container-type zeroed it). `sidebar-right` without an aside had the same problem. `data-sidebar="hidden"` left an empty sidebar-width column. In all three cases the template now drops the column.
  - **data-page-layout** — `@container region-nav (…)` never matched, because nav was not a size container. nav is now `container-type: inline-size` where its column has a definite width: bare/stack, sidebar-left, holy-grail, landing, and dashboard with a set width or collapsed. App-shell, the default dashboard and `nav.bottom` keep `normal`, so the content-sized column does not collapse.
  - **main[data-layout="sidebar-left|right"]** — Resets `--_gap`, which used to inherit an outer stack's or grid's gap. Supports `data-layout-gap` and `data-layout-sidebar-width`, and no longer inherits a page layout's sidebar width. Without its nav/aside, the article takes the full width (it was 0px wide).
  - **data-layout="regions" / "media"** — Extra children no longer overlap in a single content cell.
  - **data-layout-subgrid** — `main` / `article` / `section` / `aside` children now align on the subgrid. They were query containers, and the layout containment that requires made each child an independent grid, so its rows ignored its siblings'. As with cluster and reel, `data-container` on such a child keeps the container, and the child then sizes its own rows.
  - **Layout vocabulary** — `readLayoutVocabularyByLayout()` expands `:is()` / `:where()` arms. It used to credit `data-layout-centered` to cluster and reel, through the cover arm of a shared `:is()` group.
  - **header** — The `header[data-sticky]` comment said the header drops its sticky positioning on mobile. Only the coordinated `<html data-sticky>` mode does that; a standalone sticky header stays sticky at every width.
  - **Docs** — The dashboard `data-nav-open` script pattern also closes on an outside tap and has a close button inside the nav; touch users have no Escape key. `admin/handoffs/vanilla-press-integration.md` lists the real `data-layout` values and moves the page templates to `data-page-layout`. Fixed several layout element docs:
    - layout-cluster: the overlap demo uses the accessible avatar-group pattern
    - layout-cover: the 404 demo and code match
    - layout-center: the narrow width (40rem) is labelled correctly
    - layout-imposter: the badge is `aria-hidden` and the count is in the button's name
    - layout-reel: samples are named, focusable regions
    - layout-switcher: the threshold is the switcher's own width
    - layout-columns: the reader-view sample keeps the rhythm

- **Contrast pass (themes, buttons, system dark mode).**
  - **Colour tokens** — A dark system setting with no `data-mode` (CSS-only / no-JS pages) now gets the same dark primary seeds, hue-tinted dark surfaces, text, border and shadow tokens as `data-mode="dark"`: links went from 3.31 / 3.15 / 2.55:1 to 6.14 / 5.89 / 5.49:1 on background / surface / surface-raised. `data-mode="light"` still forces light under a dark OS. classic, minimal, modern and win9x mirror their own dark blocks the same way (links 2.48 → 5.40, 1.84 → 7.77, 3.99 → 5.99, 1.34 → 8.99), the brand and theme templates show the pattern, and a11y-dyslexia keeps its light primary seeds under dark mode. (3650)
  - **button** — Without `contrast-color()` the label now falls back to black or white picked from the button's own fill (WCAG luminance), matching what `contrast-color()` chooses; fixed white was 3.3:1 on the dark-mode primary and failed on pale `--btn-color` fills. Labels now reach 4.5:1 on the button's own background in every theme: `.secondary` uses the interactive hover tone in nord, organic, glassmorphism, super2026, gruvbox and rose-pine; startup paints its gradient pill only on primary buttons (secondary/ghost were 1:1 / ~3:1); vaporwave's gradient is dimmed (white label 5.1:1, was 3.4 / 2.75); genai's gradient primary keeps a white label; nes dark primary buttons get a deeper blue fill (2.41 → 5.65). (4vhi)
  - **layout-badge** — Solid badges without `contrast-color()` fall back to black or white from the badge's own luminance (dark-mode primary/brand 3.3 → 6.36:1, success 4.37 → 4.81:1). (nkfy)
  - **browser-window (themes)** — URL text ≥ 4.5:1 and window dots, hover and focus ring ≥ 3:1 on the header: nes light (URL 1.17 → 13.58, focus ring 1 → 11.06) and dark, super2026 dark (dots 1.04 → 4.95, URL 3.99 → 7.56), 8bit light (dots 1:1 → 3.95+), win9x both modes (all three dots and the focus ring; the minimize dot was 1.11 against the gradient's light end), journal light (URL 3.81 → 4.91). Removed the unused `--browser-window-url-color` mapping. (5kag, m8vd, qvhc, 3yhd, hm8h, yciu)
  - **Themes** — Fixed-palette themes declare a `color-scheme` matching their surfaces with no `data-mode`: 8bit, cyber and terminal `dark`; nes, win9x and alpha1999 `light`. Scrollbars, form controls and `light-dark()` now follow the theme. (aw6w)
  - **Clones** — Cloning an upgraded component (`cloneNode`/`importNode`) now upgrades the copy; it carried `data-upgraded` and skipped `setup()`, so it had no listeners. (kkmj)

- **U–Y-element review.**
  - **u** — In Chinese, Japanese and Korean text (`:lang(zh|ja|ko)`, but not `*-Latn`), `<u>` is now the proper-name mark, a solid `currentColor` underline under the line. Before, it was the red wavy spell-check line, which made names look like typos and clashed with CJK `<cite>`'s wavy book-title mark.
  - **ul**
    - `.meta` separators (all four variants) and the `data-marker` glyphs now have empty alt text (`content: "…" / ""`), so screen readers no longer read "dot", "vertical line", "slash" or "heavy check mark". The plain declaration stays first as the fallback.
    - Added the `--sep-slash` and `--marker-star` tokens. The slash separator and the star marker were the only hardcoded glyphs.
  - **user-avatar**
    - `data-ring` now survives inside `[data-layout-overlap]` clusters (it is composed through `--_ring`). In the `<ul>`/`<li>` group form the avatar draws its own separator.
    - The initials disc uses `light-dark()` tokens (it showed as a bright disc in dark mode). Forced colours draw a `CanvasText` border, a ring outline, and status dots in system colours.
    - Demos use local placeholder photos instead of `i.pravatar.cc`. The docs gained an Accessibility section (alt text, initials label, "+N" label, list groups, status text), and there is a new `api.json`.
  - **comment-thread, activity-feed** — Stopped setting a `name` attribute on `<user-avatar>` that nothing read.
  - **var** — CJK text no longer gets a synthesised oblique. `<var>` stays upright with a dashed muted underline, which differs from the CJK cues on u (solid), i (dotted) and cite (wavy).
  - **version-switcher**
    - The picker / panel heading follows fetched data and `data-mode` (it was frozen at "History" for manifest-backed switchers); `data-mode` and `aria-label` are now observed.
    - Entries mounted in a `<page-info>` panel are styled (rules now scope to `.version-switcher-panel-section` too).
    - `teardown()` removes the page-info panel section and stops the mount observer and timeout; reconnect mounts exactly one section.
    - The swap crossfade timing no longer retimes every root view transition on the site (scoped to the `version-swap` transition type).
  - **video-player**
    - Keyboard shortcuts no longer hijack the player's own controls: arrows on the volume slider change volume (not seek), arrows on the seek slider seek 5 s (not volume), Space on a button is the button's, and Ctrl/Cmd/Alt chords (e.g. Cmd+F, Ctrl+C) are never intercepted (ported audio-player's composedPath + modifier guard).
    - Auto-hide never hides the controls while keyboard focus is inside them; the invisible big play button is `inert` outside idle/ended; fullscreen state is per player (no cross-talk between players on one page).
    - Media, track-list and control listeners are re-attached on every connect (a `<video>` swapped while disconnected used to freeze the UI); state, time and captions-button visibility are recomputed on reconnect; clicking playlist links no longer also toggles play/pause.
    - Mute button exposes `aria-pressed` (incl. an authored `<video muted>`); seek `aria-valuetext` reads "0:05 of 3:20" from the start, volume reads "37%"; progress/volume fills stay visible in forced-colors mode; `video-player:src-changed` is now `composed` like the other events. api.json rewritten from the runtime.
  - **video (chapter list)** — The active chapter's button carries `aria-current="true"`; the nav name is overridable with `data-label` on the track; a rejected `play()` after a chapter click is no longer an unhandled rejection.
  - **watch-wc** — An already-watched page now shows "Watching" and the bookmark-check icon on load. The component repaints from the button's `aria-pressed`, which page-watch-init sets.
  - **page-watch / notification-wc**
    - The "content changed" notice now appears in the bell. notification-wc panels ingest a document-level `notification-wc:new` (deduped by id). page-watch-init waits for `notification-wc` to be defined before dispatching.
    - Unwatching from the bell's Watching tab now calls the server unsubscribe (when server sync is on). Every `[data-watch-page]` button resyncs on any `page-watch:add/remove`.
    - page-watch-init loaded twice (autoload bundle + watch-wc chunk) no longer runs twice. A global sentinel makes the second copy inert: one observer, one change check.
  - **week-view, day-view** — Grid lines are logical borders instead of box-shadows, so they stay visible in forced colors and mirror correctly in RTL.
  - **week-view** — Day headers carry the full date as accessible text, and the month is shown when the range crosses one. The corner header uses visually hidden text (`data-label-time`) instead of `aria-label`.
  - **youtube-player**
    - `thumbnail="sd"` / `"maxres"` fall back to `hqdefault` when the video has no such image (404 or YouTube's 120×90 placeholder).
    - The thumbnail `<img>` sends no referrer (`referrerpolicy="no-referrer"`); the iframe sets `referrerpolicy="strict-origin-when-cross-origin"` explicitly so a page-wide `no-referrer` policy does not break the player.
    - `widescreen` class now has a rule (16:9, same as the default).
  - **Docs** — wbr: removed the false claim that VB uses `word-break: break-all` for CJK (VB deliberately avoids it); added how `<wbr>` relates to VB's `overflow-wrap: break-word`, a copy/paste/search table (wbr vs `&shy;` vs zero-width space), and a correct CJK example with `<wbr>` inside the Latin URL; demo inline styles moved to a class. u: quotes theme tokens (`--color-error`, `--color-success`) instead of stale oklch values, uses real Hanzi instead of pinyin, adds a forced-colours note, and the table is renamed "VB text decorations". ul: breadcrumbs point to `nav.breadcrumb` / `<bread-crumb>`, not `.meta`; documents `.meta` CSS and the separator/marker custom properties, adds `role="list"` in the list-style:none samples and demos, and notes that markers are decorative (a task list needs checkboxes). version-switcher: removed the "Phase 1/2/3" and "coming" copy, corrected `meta[itemprop="version"]` (not `vb:version`), embedded the actions and provenance demos, and added Security and Localisation sections; `api.json` rewritten from the runtime (enums, `data-label-*`, methods). video: removed the false claim that autoplay pauses automatically under reduced motion (now guidance + snippet); background-video guidance includes a pause control (WCAG 2.2.2); documented the `video::cue` hooks (`--cue-text`, `--cue-bg`, `--cue-font`); demos use local media with captions and a background-video example. youtube-player: new Privacy section naming the i.ytimg.com request, Local Poster / Start and End / params / no-JS fallback demos, accessibility list corrected, static.html filled in.
- **T-element review.**
  - **tab-set** — The `tabs` setter created unnamed `<details>`, so a second click left two panels open. Arrow keys mirror in RTL. Printing shows every panel under its tab label. Forced colours mark the selected tab with `Highlight` (including the extreme-neumorphism theme). A `<details>` without a `<summary>` no longer throws on toggle.
  - **table** — `data-responsive="card"` keeps table semantics: the thead is hidden visually, and a new `card-init.js` restores table/row/cell roles and fills missing `data-label` from the column header, including for rows added later; card mode covers `tbody th` and `tfoot`. The sticky header honours `--sticky-offset` and keeps its rule once stuck. `data-state-selected` rows get the `data-selected` tint, and selected/highlighted rows add a non-colour inline-start bar. Frozen cells show the row's hover, stripe and state tint, and the frozen edge flips in RTL. Stripes skip hidden rows. `tfoot th` matches the other footer cells. New forced-colours block (`Highlight` / `Mark` rows, real borders for the state bar, frozen edge and stuck header).
  - **print** — Tables may break across pages (rows don't split, thead/tfoot repeat), row tints print, and sticky columns and `[data-table-scroll]` regions are reset.
  - **textarea[data-grow]** — With `data-max-rows`, content past the cap scrolls in field-sizing browsers (it was clipped), and the cap shows full lines (padding no longer eats one). It re-measures after form reset.
  - **time[data-format-date]** — Date-only `datetime` values no longer show the previous day west of UTC, and a removed and reinserted relative element restarts its refresh timer.
  - **video-player** — The captions button starts pressed when a `default` captions track is showing (the first click turns captions off), an authored `[captions]` turns on static caption tracks, and state follows `textTracks` `change`.
  - **text-reader** — Reconnecting no longer duplicates the control bar, and slotted icons are reused. The word highlight no longer drifts on indented HTML or between inline elements. Focus moves to the swapped-in button on Play/Pause and to Play on Stop. The initial `for` attribute no longer cancels other readers' speech or throws without speechSynthesis. Auto-scroll is instant under reduced motion; buttons have forced-colours borders.
  - **theme-picker** — The header and mobile-menu pickers no longer uncheck each other's mode radio, and `open()` focuses into the panel. Remove + reinsert during async init no longer renders a second panel or leaks listeners. Changes from other pickers and settings-panel (`vb:a11y-themes-change`, `vb:extensions-change`) are adopted instead of reverted on the next pick. Teardown resets the open state, the trigger is `type="button"`, and every swatch group is a `role="radiogroup"`. Forced-colours styles for the segments, options and swatches.
  - **time-index** — Sorting moved only the first container's articles and ignored `<li>` entries; list markup can now be filtered; a reconnect during the feed fetch no longer adds a second feed.
  - **time-picker** — Hour-scale steps no longer freeze the minutes spinner, form reset restores the authored `value`, focus rings show in forced colours, and the trigger reflects `aria-invalid`.
  - **toast-msg** — Auto-dismiss pauses while hovered, while focus is inside and while the page is hidden (WCAG 2.2.1); Escape closes the focused toast. Focus moves to the next toast, or back to where it was, instead of `<body>`. Remove + reinsert keeps timers and the queue. Bottom positions play their exit animation, centred positions stay centred in RTL, and toasts get forced-colours borders.
  - **autosave** — "Draft restored" goes through `toast-msg` `show()` on the first `<toast-msg>` (created if absent) instead of appending an unannounced, never-dismissed element; the text is `data-label-restored` on the form.
  - **tool-tip / tooltip-init** — The card survives remove + reinsert (`[data-content]` is restored). `aria-describedby` is appended to authored ids and only the added id is removed. A trigger named only by `title` keeps it as `aria-label` and is not also described by the tooltip. The JS-path card is keyboard-usable (focus keeps it open, Escape returns focus to the trigger). The no-anchor-positioning fallback honours `position` and centres the tip. RTL arrows point at the trigger; forced-colours edges on tooltip, arrow and card.
  - **topic-map** — Counts are distinct pages per subtree (a page tagged with a parent and its narrower concepts counted several times), cyclic vocabularies no longer overflow the stack, load errors are shown instead of swallowed, and stale fetches no longer render after a reconnect.
  - **trust-filter** — Reconnect clears the selection (the list stayed filtered behind unchecked boxes); ticking both signature values means no filter (it returned zero pages); stale fetches no longer render. The demo uses a varied `trust-filter-pages.json` fixture.
  - **Docs** — Pages for tab-set, table, thead, tbody, tfoot, tr, th, td, data-sortable, template, title, track, time, textarea, data-format-date, data-grow, data-count, text-reader, theme-picker, text-divider, time-index, time-picker, toast-msg, tool-tip, topic-map and trust-filter rewritten to match the code, with `<browser-window>` demos replacing `div.example` wrappers and inline styles. New demos: `tabs-keyboard`, `tabs-rich-content`, `tabs-wrap-rtl`, `table-sticky`, `table-scroll`, `table-card`, `table-minimal`, `template-clone`, `track-captions`, `toast-variants`.
- **S-element review.**
  - **Reconnect sweep** — `status-wc` no longer duplicates dots or nests labels on reconnect (or with serialized markup) and fires no `status-wc:change` on upgrade; `star-rating` re-wires listeners on every reconnect and rebuilds serialized markup with its own radio group; the rating effect re-wires after a real remove + reinsert; `selection-menu` disconnects its targets MutationObserver (one leaked per reconnect); `site-map` ia-tree no longer deletes every link on remove + reinsert (anchors are moved back before teardown); `settings-panel` no longer duplicates panels or leaks window/document listeners when removed during hydration (a generation token guards the async work), and reconnecting while open resets it to closed.
  - **effects runtime** — Cleanup clears `data-effect-processed`, so every `data-effect` re-initialises after a remove + reinsert (all but rating stayed inert).
  - **theme-picker** — The a11y theme toggles dispatch `vb:a11y-themes-change`, so `<settings-panel>` stays in sync.
  - **score-card** — Forced-colours outline on the loading skeleton.
  - **section** — `section.hero[data-bleed]` gives the header its surface back under `<html data-scrolled>` (the old selector never matched `body > header`); `.alt` sections keep a system-colour block border in forced colours.
  - **select** — The rich trigger (`<select><button><selectedcontent>`) is a plain content slot again: no global 44px button minimum (it was ~20px taller than a plain select), and theme button skins (nes, win9x, brutalist, neumorphism, kawaii) no longer paint it; background, border, radius, shadow, padding and minimum sizes are locked with `!important`.
  - **selection-menu** — Keyboard selections open the toolbar (Shift keyup + debounced `selectionchange`) and Alt+F10 focuses it; Escape / `dismiss()` return focus (Escape also the selection) to the target and respect `defaultPrevented`; the toolbar follows the selection on scroll/resize, hides once it scrolls away and sits below touch selections; the `data-selection-menu` id selector is `CSS.escape`d.
  - **settings-panel** — External `vb:extensions-change` / `vb:a11y-themes-change` apply their `detail` before the controls re-sync (no stale toggles written back to VBStore), and `vb:theme-change` re-hydrates. The sticky toggle and Reset touch only `<html data-sticky>`: an authored `header[data-sticky]` is no longer deleted and an article `<header>` is no longer targeted. The `data` setter applies to the page, and it and `open()` are safe before render (both threw). The service-worker line is `role="status"` and button results are announced. api.json and the doc page match the runtime.
  - **share-wc** — The selection-copy announcement is no longer lost; the quote links to the resolved URL with a `#:~:text=` fragment; native share failures fall back to copying; the native button is named by its visible label; every string has a `data-label-*`; icon-variant labels stay in the accessibility tree; slotted copy buttons copy once per click.
  - **short-cuts** — The `shortcuts` property feeds the dialog (it was never read); the dialog is named by its heading, key badges carry spoken names, strings are `data-label-*`, and the dialog keeps a border in forced colours.
  - **site-index** — Clearing the filter re-applies `limit` (it showed every overflow item under a stale "Show N more"), the buttons hide while filtering, a polite status announces "N terms match" / "No matches", and emptied letters get `aria-disabled` and leave the Tab order (was an inline `opacity`).
  - **site-map** — Enter on a node navigates; `.pages` and `site-map:pages-changed` no longer return blank labels and hrefs; nav-enhance `src` replaces the sitemap, not the controls, and JSON-only sitemaps get controls; the status dot's meaning is visually hidden text instead of an `aria-label` on a role-less span; focus no longer jumps to the root after a toggle in the visual chart.
  - **site-search** — `crypto.randomUUID()` threw on non-secure `http://` hosts and disabled the trigger (ids are counter-based); the panel is centred in RTL; `site-search[hidden]` hides; stale results from a slower earlier query no longer overwrite newer ones; trigger listeners no longer stack across reconnects.
  - **slide-accept** — RTL drag, arrow keys and spring-back follow the direction and the chevron mirrors; the handle has `aria-valuetext` and an `aria-describedby` hint (`data-label-hint`); confirmation is announced from a polite status; forced-colours handle border, `Highlight` fill and double-bordered confirmed track. api.json drops the inner-handle ARIA.
  - **social-embed** — Every parsed embed rendered `state="unsupported"` because the element was defined before any provider registered; providers now register first, and `SocialEmbed.register()` re-initialises instances a late custom provider can handle. YouTube sets `video-id`/`title`/`start` on `<youtube-player>` (it set `data-*`, so nothing rendered). Bluesky and Mastodon really render (their oEmbed `<script>` was dropped by `innerHTML`). Focus moves into the embed after a button load and stays on the retry button after an error; reconnect after load keeps the embed; failed `loadScript` calls can be retried. Docs and demos use live posts.
  - **split-surface** — No keyboard trap after collapsing (arrows / Home / End expand); Enter toggles collapse and the collapsed panel is `inert`; `aria-valuetext` reads "30%" or "Collapsed" (`data-label-collapsed`); `position`, `collapsed` and `reset()` right after creation are queued instead of throwing; non-numeric `position` is ignored (no `aria-valuenow="NaN"`); the grip is centred in RTL; forced-colours divider shared with `[data-splitter]`.
  - **star-rating** — The read-only partial star fills from the inline start in RTL; forced colours show filled (`Highlight`) vs empty (`CanvasText`) stars; `required` validity anchors on the first radio.
  - **status-message** — Filled warning without `contrast-color()` falls back to dark ink; `[hidden]` is re-asserted over the author `display: flex`; forced-colours border on filled messages.
  - **status-wc** — The dot is visible in forced colours (solid, hollow for offline/stopped).
  - **stepper-wc** — The inner `role="spinbutton"` is named from `<label for>`, a wrapping label, host `aria-labelledby` or `aria-label`, and clicking the label focuses it. Form reset restores the authored `value`; removing the element mid long-press stops the timers; a disabled `<fieldset>` disables it; new `data-label-decrease` / `-increase`; forced-colours focus outline.
  - **s / samp / span / sup / strong** — `<s>` is a dashed line-through in forced colours (distinct from `<del>`). Inline `<samp>` wraps long output, and inline `<code>`/`<samp>` use `unicode-bidi: plaintext` on RTL pages. `.status` glyphs have empty alt text (no "black circle"). `sup.footnote-ref` is sized once (the extra `0.65em` made "[1]" about 6px) and keeps its underline with a padded hit area. Bold inside inline `<code>` uses `Mark`/`MarkText` in forced colours.
  - **summary** — NES and Windows 9x show one indicator (the core `::after` chevron is removed where the theme draws its own glyph) with the label at the inline start; the NES ▶ mirrors in RTL. Theme and `nav.tree` glyphs use empty alt text, so they are no longer part of the summary's name.
  - **Docs** — Pages for script, style, slot, section, source, svg, select, selectedcontent, search, summary/details, sub, sup, small, samp, strong, rating, status-wc, status-message, score-card, settings-panel, site-tools and site-legal rewritten to match the code, with `<browser-window>` demos replacing stubs and `div.example` wrappers.
- **Q+R-element review.**
  - **Reconnect sweep** — `reaction-bar`, `version-switcher`, `time-picker`, `share-wc` and `site-index` now survive being removed and reinserted. reaction-bar chip and palette clicks and `aria-expanded` went dead; version-switcher lost its open/close bridge and keyboard navigation; time-picker's clock button, text input, spinners and AM/PM toggle stopped responding; share-wc appended another button inside `selection-menu` on every reconnect and deleted slotted share links on teardown; site-index stacked a second controls bar, more "Show N more" buttons and duplicate count badges. `reconnect-idempotency.spec.js` now removes and reinserts 42 interactive components twice from the working tree and then asserts one representative interaction, not only the descendant count.
  - **analytics** — `vb:track-history*` metas are excluded from the taxonomy folded into the event envelope.
  - **ruby / rt / q** — Romanised readings (`lang="zh-Latn"`, `ja-Latn`, `ko-Latn`, `yue-Latn`, `wuu-Latn`) use the body face instead of `--font-cjk`; `yue`/`wuu` readings get `--font-cjk`. Bopomofo (`<rt lang="zh-Bopo">`) sets `ruby-position: inter-character` (Firefox and Safari; Chromium ignores it). The ruby, rt, rp and q pages match the code, the ruby demos set `lang` and show annotations again, and the q table is complete.
  - **qr-code**
    - Codes now scan (correct format and version info, Reed–Solomon block interleaving), with whole-pixel modules scaled to `devicePixelRatio` and redrawn when it changes (zoom, moving to another monitor). Forced colours: the canvas has `forced-color-adjust: none` and a `CanvasText` border.
    - Text over the level's capacity no longer draws a truncated garbage code: no code is drawn, `data-error="capacity"` is set, the caption is shown and `qr-code:error` fires.
    - Setting `value` on an element that started empty now renders; clearing `value` falls back to the original text instead of leaving the old code.
    - Docs drop the false "versions 1–10" claim and add a capacity table, `copy()`, `value` and events; demos use `<browser-window>` + `<code-block>`. Codes are round-tripped through jsQR in unit and browser tests.
  - **reaction-bar** — Opening the palette focuses its first option, and the palette group is labelled. The pressed chip stays distinct in forced colours (`Highlight`/`HighlightText`). `setCount(r, 0)` on the focused chip moves focus to a neighbour, and `setCount` keeps the roving-tabindex position. Arrow keys follow the visual order in RTL.
  - **reader-view**
    - The default chrome is no longer a `<header>`, so it no longer maps to a `banner` landmark outside a sectioning element.
    - Printing in pages mode printed nothing; it now prints one static, unclipped flow in either mode.
    - RTL paging works (direction-signed scroll offsets, mirrored arrow keys and nav arrows, progress fills from the right, the page-nav pill is centred). Page keys work while focus is on a chrome button, and smooth page turns are tracked to `scrollend` instead of being undone by a 220 ms timer.
    - Forced colours use `Highlight` for the active segment and progress and `GrayText` for disabled buttons. `static.html` is a real fallback, and api.json is rewritten from the runtime.
  - **reading-progress** — A `data-for` that points to a missing id falls back to document progress and switches to the element when it appears (the bar was dead). RTL fills from the right, forced colours paint `Highlight`, and the dead reduced-motion rule is gone (the bar is scroll-linked).
  - **recently-visited**
    - A `window` `storage` listener leaked on every move or reconnect (the cleanup lived in a `disconnect()` VBElement never calls); listeners go through `listen()` and the 60-second refresh interval is cleared in `teardown()`.
    - Focus stays on Pause, Anchors and Clear after a press, a focused link keeps focus across re-renders, and open `<details>` stay open.
    - The tracker dispatches `recently-visited:change` on `window`, so hash changes and a Pause or Clear in another instance re-render every instance on the same page.
    - Relative times use `Intl.RelativeTimeFormat` for the nearest `[lang]`, render as `<time datetime>` and refresh every minute; malformed records are dropped, so "NaNd ago" no longer appears. api.json and the docs cover the events, the `entries` property, all three storage keys and the record shape.
- **P-element review.**
  - **pager-wc / data-paged**
    - `data-style="load-more"` counts down from the engine's `visible` count instead of `page × size`; the target needs `data-paged-style="load-more"` (console warning otherwise).
    - Focus stays on the activated control after a page change instead of dropping to `<body>`. The prev-next "Page N of M" live region is one persistent node, so changes are announced; in-place controls keep focus and the live region across renders.
    - Back/Forward with `data-paged-url` re-renders the slice and every pager; a URL without the parameter shows page 1.
    - Forced colors: the current page keeps a `Highlight` fill and 2px border. Demo rebuilt with layout primitives; the `pager-wc:navigate` scope and detail are documented.
  - **page-toc**
    - Reconnecting no longer switches to manual mode on its own generated markup (which doubled `entries`, `page-toc:navigate` events and history entries); `refresh()` no longer stacks window listeners.
    - Percent-encoded hashes (`#caf%C3%A9`) match their headings. The active-link radius uses logical corners (correct in RTL).
    - api.json documents `scope`, `orientation`, `data-title`, `entries`, `refresh()` and the event detail, and drops the phantom `href`.
  - **page-tools**
    - P1: the mobile FAB popover was always displayed, pinned at (0,0) under the header with roughly 9px focusable tools. It is now hidden until opened and opens just above the FAB.
    - Reduced-motion overrides now win and cover watch-wc and the FAB press scale. api.json drops internal attributes and documents the output state, `tools` and `--page-tools-*` properties.
  - **page-tour**
    - The spotlight no longer jumps back to an earlier step's target on scroll; the auto-trigger timer is cleared on disconnect, so a removed tour no longer starts late or twice.
    - Only statically positioned targets get `position: relative` (sticky and fixed targets keep their layout). Forced colors draws the spotlight as a `Highlight` outline.
    - A missing target at either end no longer leaves a stale card. api.json matches the runtime (`change` action, methods, CSS properties, `data-label-*`).
  - **page-info**
    - Signed pages with a relative canonical link, or none, now verify: the signer (`scripts/sign-pages.js`) and the verifier both sign the raw `<link rel="canonical">` href.
    - Reconnecting no longer appends "— verification failed" to the badge `aria-label` repeatedly; in-flight verification is aborted on disconnect.
  - **page-stats** — The docs and SSR demo used a non-existent `.sr-only` class (labels showed); they use `visually-hidden`. The separator dot has empty alternative text. The `last-modified` `datetime` keeps the declared date (no UTC day shift).
  - **poll-wc**
    - Options stopped responding after the element was removed and reinserted; listeners are delegated on the option group and the built structure is reused on reconnect.
    - Results vanished in forced-colors mode; bars draw as a `Highlight` strip and the voter's choice gets a thicker border.
    - `disabled` is observed and styled. The "closed" suffix is DOM text instead of CSS `content`, and author markup inside option buttons is kept.
  - **popularity-index** — Reacts to `analytics-src`, `window`, `limit`, `data-meta-src`, `data-lens-src` and `data-heading-level` changes; in-flight requests are aborted so stale responses can't win. `limit` below 1 no longer slices from the end; the pages.json enrichment fetch runs in parallel.
  - **pop-over**
    - Without `data-position` the popover sits below its anchor (`position-area: bottom`, the documented default) instead of at the viewport's top-left. `role="tooltip"` hosts are excluded.
    - The JS fallback (no anchor positioning) measures after showing, so `top` and `-end` placements no longer use a 0×0 size; it flips and clamps into the viewport. `show()` positions synchronously. Invalid selector-style `data-anchor` values no longer throw.
    - api.json documents the methods, the `open` property, the events and `data-anchor-name`.
  - **print-page** — Raw-toggle mode registers `afterprint` before `window.print()` (Chromium fires it inside `print()`), so `data-print-raw` no longer waits for the 5s fallback. The button hides itself in `@media print`.
  - **progress**
    - Forced colours: the bar draws a `Highlight` fill on a `Canvas` track with a `CanvasText` edge; rings draw `Highlight` on `GrayText`.
    - Indeterminate: Firefox gets the shimmer; the bar shimmer and the ring spin slow down under `prefers-reduced-motion` and `:root[data-motion-reduced]`.
    - progress-ring-init stores each ring's centre label instead of querying the parent (which could overwrite a sibling's label); a ring that starts indeterminate gets its label once it has a value; `max` changes are observed.
    - Every demo and doc snippet names its bar. The ring example used a `data-state` the CSS never read; it uses the classes.
  - **progress-tracker**
    - Activating the current step no longer leaves the click-suppress flag stuck; no `progress-tracker:step` event fires on upgrade.
    - Author label markup is wrapped, not flattened; steps added later are decorated; toggling `data-clickable` takes effect.
    - The connector after an errored step uses the error colour. Forced colors: connectors in `CanvasText`, `Highlight` circles and an outline ring on the current step.
  - **pre** — Forced colours: code blocks get a `CanvasText` border and `<b>`/`<strong>` highlights use `Mark`/`MarkText`. The long-line demo is a focusable named region. Docs gain Print and RTL sections.
  - **p** — Docs no longer claim screen readers announce `<strong>`/`<em>`; added a drop-cap section and `p-drop-cap` demo, a `lang` note for `.justify` hyphenation, and a CSS reference matching the source.
  - **time-relative** — The shared utility localises `time[data-relative]` with `Intl.RelativeTimeFormat` under a non-English `[lang]`, and leaves times inside `<page-info>` alone (it localises its own).
  - **tool-tip** — Resets `position-area` to `none`, so pop-over's new default `position-area: bottom` cannot zero tool-tip's `anchor()` insets.
  - **canonical-document spec** — States the `url` rule that signer and verifier share: the raw `<link rel="canonical">` href, absolute hrefs normalised, relative hrefs kept as written, `""` with no canonical link.
  - **Trust vocabulary** — The never-set `domain-anchored` tier is removed from the vocabulary, specs and docs.
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
