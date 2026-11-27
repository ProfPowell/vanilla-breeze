# Vanilla Breeze 0.7.4: attributes

Attributes that work on any element (or on the native elements named in each page). Component-specific attributes are in each component file. Each link is the full documentation page.

## Analytics

- [data-vb-event](https://vanilla-breeze.com/docs/attributes/data-vb-event/): Declarative analytics — fire a normalised analytics event on click without writing JavaScript. Properties via data-vb-event-* siblings.
- [data-vb-no-track](https://vanilla-breeze.com/docs/attributes/data-vb-no-track/): Exclude an element (and everything inside it) from Vanilla Breeze analytics. No beacons fire from any descendant, regardless of data-vb-event or auto-wired VB events.

## Clipboard

- [data-copy](https://vanilla-breeze.com/docs/attributes/data-copy/): Clipboard copy and paste via data attributes. Add data-copy, data-copy-target, or data-paste-target to any button for clipboard functionality with visible, screen-reader and failure feedback.
- [data-highlights](https://vanilla-breeze.com/docs/attributes/data-highlights/): The text-highlighting engine: renders and persists highlights on any element with the CSS Custom Highlight API. No built-in UI; pair it with highlight-wc and selection-menu for interactive highlighting.

## Content

- [data-provenance](https://vanilla-breeze.com/docs/attributes/data-provenance/): Declare how content was made — human, AI-assisted, AI-generated, translated, synthesized, or migrated. CSS-only indicators for authorship provenance.
- [data-review](https://vanilla-breeze.com/docs/attributes/data-review/): Declare what review the content has received. Orthogonal to data-provenance and data-status.
- [data-status](https://vanilla-breeze.com/docs/attributes/data-status/): Declare content publication state — draft, published, archived. Orthogonal to data-provenance and data-review.
- [data-trust](https://vanilla-breeze.com/docs/attributes/data-trust/): Verification tier indicator on page-info badges. Runtime-computed state showing whether page content matches its cryptographic signature.
- [data-watch-page](https://vanilla-breeze.com/docs/attributes/data-watch-page/): Mark a button as the watch toggle for the current page. Stores a content hash; on revisit, fires a watch notification when content has changed.

## Data

- [data-sortable](https://vanilla-breeze.com/docs/attributes/data-sortable/): Client-side list/table sorting upscale on any container — native ul/ol/table or VB collections. Two API shapes (clickable column headers OR external select/button); composes with data-paged.

## Focus

- [data-focus-trap](https://vanilla-breeze.com/docs/attributes/data-focus-trap/): Constrain keyboard focus within a container. Tab/Shift+Tab cycle inside the boundary, focus auto-moves in on activation, and restores on deactivation.

## Form-behavior

- [data-autosave](https://vanilla-breeze.com/docs/attributes/data-autosave/): Save form drafts to localStorage as the user types and restore them on the next visit. Skips passwords, hidden inputs, buttons and card or one-time codes. Clears on submit or reset; drafts expire after 24 hours.
- [data-count](https://vanilla-breeze.com/docs/attributes/data-count/): Live character or word count under a textarea, with warning and error states near and over the limit and polite screen-reader announcements.
- [data-grow](https://vanilla-breeze.com/docs/attributes/data-grow/): Auto-expand a textarea as the user types, from its rows up to an optional data-max-rows cap. CSS field-sizing where supported, a JavaScript measuring fallback elsewhere.
- [data-select-all](https://vanilla-breeze.com/docs/attributes/data-select-all/): Master checkbox for bulk selection. Add data-select-all to a checkbox to control a group of related checkboxes, with indeterminate state, disabled items skipped and a live count.
- [data-show-when](https://vanilla-breeze.com/docs/attributes/data-show-when/): Show or hide a form section based on other fields' values. Hidden sections get hidden + inert and their controls are disabled, so hidden required fields never block submit and hidden values are not sent.
- [data-wizard](https://vanilla-breeze.com/docs/attributes/data-wizard/): Split a form into steps: per-step validation, conditional steps whose fields are disabled while skipped, Enter-to-advance, focus management, localisable labels, optional persistence and URL history. Add data-wizard to a form of fieldsets.

## Form-controls

- [data-accept](https://vanilla-breeze.com/docs/attributes/data-accept/): Character filter for text inputs: block characters outside a preset or custom character class while the user formats freely. Presets for phone, date, card numbers, letters and more.
- [data-color](https://vanilla-breeze.com/docs/attributes/data-color/): Show a native colour input as a round swatch with its hex code. The native input stays the only control; the swatch and text are decoration.
- [data-floating-label](https://vanilla-breeze.com/docs/attributes/data-floating-label/): Animated floating label that starts inside the input and moves above on focus or when filled. Material Design pattern that keeps the label always visible.
- [data-loading](https://vanilla-breeze.com/docs/attributes/data-loading/): Button loading state with spinner, aria-busy, double-submit prevention, and auto-revert for async actions.
- [data-mask](https://vanilla-breeze.com/docs/attributes/data-mask/): Format a text input as the user types, from a preset (US phone, card, US date, SSN, ZIP) or your own pattern. Incomplete values are invalid, so required works.
- [data-range](https://vanilla-breeze.com/docs/attributes/data-range/): Styled range slider with a filled track, an optional value bubble, prefix/suffix and locale formatting, tick markers and datalist labels. Covers data-range, data-bubble, data-prefix, data-suffix and data-markers.
- [data-segmented](https://vanilla-breeze.com/docs/attributes/data-segmented/): Group radio inputs into a compact segmented control with sunken track and raised active segment. CSS-only pattern over native radios with vertical and compact variants.
- [data-stepper](https://vanilla-breeze.com/docs/attributes/data-stepper/): Visible − and + buttons for a native number input. Steps exactly like the arrow keys, follows disabled and readonly, and re-syncs after a form reset.
- [data-strength](https://vanilla-breeze.com/docs/attributes/data-strength/): Password strength meter and rules checklist for a password input inside form-field. Advisory by default; data-strength-min makes weak passwords invalid.
- [data-switch](https://vanilla-breeze.com/docs/attributes/data-switch/): Style a native checkbox as an on/off toggle switch, in three sizes. The look is pure CSS; a small script adds role='switch'.
- [data-toggle-tags](https://vanilla-breeze.com/docs/attributes/data-toggle-tags/): Style a fieldset of checkboxes as selectable pill chips. Pure CSS; data-max adds a small script that caps the selection and announces the limit.
- [data-upload](https://vanilla-breeze.com/docs/attributes/data-upload/): Turn a native file input into a drag-and-drop zone with a file list. Dropped files follow the input's accept and multiple rules; rejected files are announced.
- [data-vb-email-form](https://vanilla-breeze.com/docs/attributes/data-vb-email-form/): Submit any HTML form through VBService('email') using a named template. Progressive enhancement on top of native form action.
- [data-vb-newsletter-form](https://vanilla-breeze.com/docs/attributes/data-vb-newsletter-form/): Newsletter signup, unsubscribe, and preferences forms wired through VBService('newsletter'). Progressive enhancement on top of native form action.

## Formatting

- [data-format-bytes](https://vanilla-breeze.com/docs/attributes/data-format-bytes/): Human-readable file size formatting. Add data-format-bytes to any &lt;data&gt; element for automatic byte formatting.
- [data-format-date](https://vanilla-breeze.com/docs/attributes/data-format-date/): Locale-aware date and relative time formatting via data attributes.
- [data-format-number](https://vanilla-breeze.com/docs/attributes/data-format-number/): Locale-aware number formatting using Intl.NumberFormat. Add data-format-number to any &lt;data&gt; element for automatic formatting.
- [data-math](https://vanilla-breeze.com/docs/attributes/data-math/): Enhance code elements with precompiled MathML rendering. Add data-math to any code element for automatic MathML injection with numbering, copy, and Markdown integration.
- [data-ticker](https://vanilla-breeze.com/docs/attributes/data-ticker/): Removed. Animated count-up is now data-effect='ticker' — see the data-effect page.

## Infrastructure

- [data-print](https://vanilla-breeze.com/docs/attributes/data-print/): Print optimization attributes for controlling how pages look when printed — page modes, element visibility, page breaks, and opt-out.
- [data-toc-ignore](https://vanilla-breeze.com/docs/attributes/data-toc-ignore/): Leave a heading, or every heading in a container, out of the page-toc table of contents and the heading-links anchor links.
- [hide-until-ready](https://vanilla-breeze.com/docs/attributes/hide-until-ready/): CSS-only FOUC guards for custom elements: hide an element until its definition loads (with a no-JS and timeout escape), or show placeholder content until then.
- [view-transitions](https://vanilla-breeze.com/docs/attributes/view-transitions/): Cross-page (MPA) view transitions: an opt-in stylesheet, named groups, shared element morphing, animation presets, and a declarative init script.

## Interaction

- [data-effect="animate-image"](https://vanilla-breeze.com/docs/attributes/data-animate-image/): Play/pause control for animated images. Add data-effect='animate-image' to any GIF, WebP or APNG for a pause button that really stops the animation, reduced-motion support and picture/srcset support.
- [data-audio-playlist](https://vanilla-breeze.com/docs/attributes/data-audio-playlist/): Turns a native audio element and a list of track links into a playlist: click a track to play it, finished tracks are marked, and playback moves to the next track.
- [data-hotkey](https://vanilla-breeze.com/docs/attributes/data-hotkey/): Platform-aware keyboard shortcut display and declarative action binding. On &lt;kbd&gt; elements renders platform symbols; on other elements binds keyboard shortcuts to actions, honouring the user's single-key shortcut preference (WCAG 2.1.4).
- [data-markdown-editable](https://vanilla-breeze.com/docs/attributes/data-markdown-editable/): Inline markdown editing on any text element: raw markdown while focused, sanitised formatting after blur. On a textarea or input it renders a preview instead.
- [data-splitter](https://vanilla-breeze.com/docs/attributes/data-splitter/): Add a resizable drag divider between panels with keyboard support. The lightweight attribute alternative to the full split-surface web component.
- [data-spoiler](https://vanilla-breeze.com/docs/attributes/data-spoiler/): Hide content behind blur, solid, or noise overlays until the reader chooses to reveal it. Works on any element, keeps its semantics, and supports keyboard, screen readers, localisation and print.
- [data-toggle](https://vanilla-breeze.com/docs/attributes/data-toggle/): Click-to-flip-attribute upscale. Toggles a boolean attribute, ARIA two-state value, custom on/off value, or CSS class on a target — the catch-all for the recurring 'change state' pattern that doesn't have a native primitive.

## Layout

- [data-canvas](https://vanilla-breeze.com/docs/attributes/data-canvas/): Turn any semantic element into an elevated surface: background, 1px edge, radius, shadow, padding and a centred max width. The attribute form of &lt;layout-canvas&gt;.
- [data-container](https://vanilla-breeze.com/docs/attributes/data-container/): Make any element a CSS size-query container (container-type: inline-size), optionally named card, panel or media, and keep sectioning children of content-sized layouts as containers on purpose.
- [data-layout-density](https://vanilla-breeze.com/docs/attributes/data-layout-density/): Region-wide density variant. Set on &lt;html&gt;, &lt;body&gt; or any container to swap the VB spacing scale (--size-3xs through --size-3xl) for a tighter or looser one, without touching individual layouts. Compact for dashboards and admin UIs, spacious for marketing pages.
- [data-layout](https://vanilla-breeze.com/docs/attributes/data-layout/): Component-level layout primitive. Drop on any element to apply a named layout (stack, cluster, grid, center, cover, sidebar, columns…) without wrapping in a custom element. Same surface as the layout-* custom elements; better semantics.
- [data-page-layout](https://vanilla-breeze.com/docs/attributes/data-page-layout/): VB's page-template system. Put it on &lt;body&gt; and the semantic children (header, nav, main, aside, footer) auto-assign to named grid areas: no classes, no wrappers. Eight templates, sidebar width and gap modifiers, mobile collapse and an accessible dashboard drawer.
- [data-paged](https://vanilla-breeze.com/docs/attributes/data-paged/): Pagination upscale for any list-shaped container — native ul/ol/table or VB collections like card-list, data-table, layout-grid. Numbered, prev/next, load-more, and infinite styles. Optional URL state.
- [data-stage](https://vanilla-breeze.com/docs/attributes/data-stage/): Scrollytelling layout pattern: pinned visual on one side, sequential semantic steps on the other. Pure CSS, no scroll listeners.
- [data-sticky](https://vanilla-breeze.com/docs/attributes/data-sticky/): Sticky page chrome. On &lt;header&gt; or &lt;footer&gt; it pins the element on its own; on &lt;html&gt; it switches on the coordination system, which measures the sticky header into --sticky-offset so sticky sidebars, the TOC and anchor jumps all line up below it.

## Media

- [data-responsive](https://vanilla-breeze.com/docs/attributes/data-responsive/): Responsive image helper: measures an image's rendered width into sizes, generates srcset from a widths shorthand, and shows an optional dev badge naming the selected source.

## Native

- [accept](https://vanilla-breeze.com/docs/attributes/accept/): Tells a file input which file types to offer, by extension or MIME type. It filters the picker but is only a hint; Vanilla Breeze's data-upload applies the same rules to dropped files.
- [accesskey](https://vanilla-breeze.com/docs/attributes/accesskey/): Assigns a browser keyboard shortcut (modifier plus one key) that focuses or activates an element. Hard to discover and prone to clashes; VB's data-hotkey is usually the better choice.
- [allow](https://vanilla-breeze.com/docs/attributes/allow/): Sets an iframe's Permissions Policy: which powerful features (camera, microphone, fullscreen, payment, geolocation) the embedded document may use.
- [ARIA states](https://vanilla-breeze.com/docs/attributes/aria-states/): The ARIA state attributes Vanilla Breeze styles or sets: aria-current, aria-pressed, aria-expanded, aria-disabled, aria-busy, aria-invalid, aria-sort, aria-selected and aria-keyshortcuts.
- [async / defer](https://vanilla-breeze.com/docs/attributes/async-defer/): Control when external scripts download and run relative to HTML parsing: blocking, async, defer, and type=module, which is deferred by default.
- [autocapitalize](https://vanilla-breeze.com/docs/attributes/autocapitalize/): Hints how virtual keyboards and voice input capitalize typed text: none, sentences, words or characters. Set it on a field or on its form.
- [autocomplete](https://vanilla-breeze.com/docs/attributes/autocomplete/): Tells the browser and password managers what a field holds, so saved names, addresses, cards, passwords and one-time codes can be filled in one step.
- [autocorrect](https://vanilla-breeze.com/docs/attributes/autocorrect/): Turns the browser's or operating system's automatic spelling and punctuation correction on or off for editable text. Baseline 2026; inherited from the form.
- [autofocus](https://vanilla-breeze.com/docs/attributes/autofocus/): Focuses an element when the page loads, or when its dialog or popover opens. The first focusable autofocus element in each scope wins.
- [blocking](https://vanilla-breeze.com/docs/attributes/blocking/): Marks a resource that would not block on its own (a module, async or script-inserted resource) as render-blocking, so the browser does not paint until it loads.
- [cite](https://vanilla-breeze.com/docs/attributes/cite/): A machine-readable source URL for quotations and edits on blockquote, q, del and ins. Browsers never show it, so pair it with visible attribution.
- [class](https://vanilla-breeze.com/docs/attributes/class/): VB uses classes for named, element-scoped variants (button.secondary, nav.pills, header.site). State and configuration live in data-* attributes instead.
- [commandfor](https://vanilla-breeze.com/docs/attributes/commandfor/): Declarative invoker buttons: commandfor names a target and command says what to do to it, opening dialogs and popovers or firing your own commands without click handlers.
- [contenteditable](https://vanilla-breeze.com/docs/attributes/contenteditable/): Let users edit an element's content in place, as rich text or plain text only. Covers the roles and labels you must add, sanitising saved HTML, and VB's markdown-editable enhancement.
- [controls](https://vanilla-breeze.com/docs/attributes/controls/): Show the browser's built-in play, seek and volume controls on audio and video, or hand the job to VB's video-player and audio-player components.
- [crossorigin](https://vanilla-breeze.com/docs/attributes/crossorigin/): Fetches a script, stylesheet, image or media file in CORS mode, which SRI, font preloads, canvas pixel access and full script error details all depend on.
- [datetime](https://vanilla-breeze.com/docs/attributes/datetime/): A machine-readable date, time or duration on time, del and ins, while the visible text stays human-friendly. VB's data-format-date formats it for you.
- [dir](https://vanilla-breeze.com/docs/attributes/dir/): Sets the base text direction (ltr, rtl or auto). Needed for Arabic, Hebrew, Persian and Urdu; VB mirrors direction-specific UI through :dir(rtl).
- [dirname](https://vanilla-breeze.com/docs/attributes/dirname/): Submits the text direction of a field (ltr or rtl) as an extra form value, so the server can display user-written text in the direction it was typed.
- [disabled](https://vanilla-breeze.com/docs/attributes/disabled/): Turns a form control off: it can't be focused, edited or activated, it is skipped by validation, and its value is not submitted. On a fieldset it disables every control inside.
- [download](https://vanilla-breeze.com/docs/attributes/download/): Makes a link save its target as a file instead of navigating to it, optionally suggesting a file name. Works for same-origin, blob: and data: URLs.
- [draggable](https://vanilla-breeze.com/docs/attributes/draggable/): Make an element draggable with the HTML Drag and Drop API. Covers the default auto state, the event lifecycle, VB's drag state styling hooks, and the keyboard and single-pointer alternatives every drag needs.
- [enterkeyhint](https://vanilla-breeze.com/docs/attributes/enterkeyhint/): Sets the label or icon on the Enter key of a touch keyboard (Next, Done, Go, Search, Send). It only changes the label; what Enter does is still up to the form or your script.
- [form](https://vanilla-breeze.com/docs/attributes/form/): Associates a form control with a form by id, so the control can sit anywhere in the document and still be validated, reset and submitted with that form.
- [formaction](https://vanilla-breeze.com/docs/attributes/formaction/): Per-button submission overrides: formaction, formmethod, formenctype, formtarget and formnovalidate let one form send to different URLs, in different ways, depending on the button pressed.
- [hidden](https://vanilla-breeze.com/docs/attributes/hidden/): Mark content as not relevant right now so it is not rendered, focusable or announced, or use hidden='until-found' to collapse it while find-in-page can still reveal it.
- [inert](https://vanilla-breeze.com/docs/attributes/inert/): Make a subtree unusable: no focus, no clicks, no text selection and hidden from screen readers, while it stays on screen. Covers what inert does not do, and how it differs from hidden and disabled.
- [inputmode](https://vanilla-breeze.com/docs/attributes/inputmode/): Chooses which on-screen keyboard a touch device shows for a field (numeric, decimal, tel, email, url, search or none) without changing the field's type or validation.
- [integrity](https://vanilla-breeze.com/docs/attributes/integrity/): Subresource Integrity: give a script or stylesheet the hash of the exact file you expect, and the browser refuses to use anything else.
- [interestfor](https://vanilla-breeze.com/docs/attributes/interestfor/): Open a popover when the user hovers or focuses a button or link. Covers popover='hint' tooltips, delays, events, and the polyfill Vanilla Breeze ships for browsers without it.
- [is](https://vanilla-breeze.com/docs/attributes/is/): Upgrades a native element into a customized built-in element that keeps its native semantics. Not supported in Safari; VB gets the same result with data-* enhancers.
- [lang](https://vanilla-breeze.com/docs/attributes/lang/): Declares the language of content with a BCP 47 tag. Drives screen-reader pronunciation, and in VB also quotation marks, script typography, hyphenation and number and date formatting.
- [list](https://vanilla-breeze.com/docs/attributes/list/): Connects an input to a datalist of suggested values. The user can pick a suggestion or type anything else; on range, colour and date inputs the options become marks and swatches.
- [loading](https://vanilla-breeze.com/docs/attributes/loading/): Lazy loading, fetch priority and image decoding hints: three attributes that decide when and how urgently the browser fetches images, iframes and scripts.
- [min / max / step](https://vanilla-breeze.com/docs/attributes/min-max-step/): Range and increment constraints for number, range, date and time inputs. Covers step bases, step='any', the range defaults and Vanilla Breeze's stepper and slider enhancements.
- [minlength / maxlength](https://vanilla-breeze.com/docs/attributes/minlength-maxlength/): Length limits for text fields and textareas: maxlength stops typing at the limit, minlength makes a too-short value invalid. Vanilla Breeze adds a live counter and custom messages.
- [multiple](https://vanilla-breeze.com/docs/attributes/multiple/): Lets a select, an email input or a file input hold more than one value. Covers select size, the email list format and how each control submits its values.
- [nonce](https://vanilla-breeze.com/docs/attributes/nonce/): A one-time token that marks a script or style as trusted under Content Security Policy. Put it on every script you serve, inline or external, and pair it with 'strict-dynamic'.
- [novalidate](https://vanilla-breeze.com/docs/attributes/novalidate/): Turns off the browser's submit-time validation for a whole form (novalidate) or for one submit button (formnovalidate). Constraints still apply; only the blocking and the bubbles stop.
- [open](https://vanilla-breeze.com/docs/attributes/open/): The boolean state attribute of details and dialog: whether a disclosure is expanded or a dialog is showing. Covers exclusive accordions, modal versus non-modal dialogs, closedby, and VB's open and close animation.
- [pattern](https://vanilla-breeze.com/docs/attributes/pattern/): Validates a text input's value against a regular expression. The whole value must match, the pattern is compiled with the v flag, and an empty optional field is always valid.
- [ping](https://vanilla-breeze.com/docs/attributes/ping/): Hyperlink auditing: when a link is followed, the browser POSTs a small notification to each listed URL while it navigates. Firefox ignores it by default.
- [placeholder](https://vanilla-breeze.com/docs/attributes/placeholder/): Shows a short hint inside an empty field, such as an example of the expected format. It is not a label and it disappears as soon as the user types.
- [popover](https://vanilla-breeze.com/docs/attributes/popover/): Turn any element into a top-layer popover with light dismiss. Covers auto, manual and hint popovers, how to open them, and what Vanilla Breeze does and does not style.
- [poster](https://vanilla-breeze.com/docs/attributes/poster/): The image a video shows before playback starts. Pairs with preload=none for bandwidth savings; VB players and data-mock set it for you.
- [preload](https://vanilla-breeze.com/docs/attributes/preload/): Hint how much of an audio or video file to download before play: none, metadata or auto. Trades bandwidth against how fast playback starts.
- [readonly](https://vanilla-breeze.com/docs/attributes/readonly/): Makes a text-like field non-editable while keeping it focusable, selectable and submitted. Vanilla Breeze gives read-only fields a sunken fill and a dashed border.
- [referrerpolicy](https://vanilla-breeze.com/docs/attributes/referrerpolicy/): Sets how much of the current page's URL is sent as the Referer when an element fetches a resource or follows a link.
- [rel](https://vanilla-breeze.com/docs/attributes/rel/): Says how a linked resource relates to the page: stylesheets and resource hints on link, opener and referrer control on links and forms, and meaning that VB styles.
- [required](https://vanilla-breeze.com/docs/attributes/required/): Marks a form control that must have a value before its form can be submitted. Works without JavaScript; Vanilla Breeze adds the asterisk, the error styling and custom messages.
- [reversed](https://vanilla-breeze.com/docs/attributes/reversed/): Ordered-list numbering: reversed counts down, start sets the first number, li value jumps the count, and type picks the marker. VB widens the indent for long markers.
- [sandbox](https://vanilla-breeze.com/docs/attributes/sandbox/): Locks down an iframe: scripts, forms, popups, top-level navigation and the frame's real origin are all withheld until you add tokens to grant them back.
- [spellcheck](https://vanilla-breeze.com/docs/attributes/spellcheck/): Turns the browser's spell-checker on or off for editable text. Inherits from ancestors; turn it off for code, identifiers and sensitive fields.
- [srcdoc](https://vanilla-breeze.com/docs/attributes/srcdoc/): Gives an iframe an inline HTML document instead of a URL. Without sandbox the document runs with your page's origin, so untrusted HTML always needs sandbox.
- [srcset](https://vanilla-breeze.com/docs/attributes/srcset/): Offer several image files so the browser picks the right one for the layout width and pixel density. Covers sizes, sizes=auto, picture and VB's data-responsive.
- [tabindex](https://vanilla-breeze.com/docs/attributes/tabindex/): Makes an element focusable and sets its place in the Tab order. Use 0 for a focus stop, -1 for script-only focus, and never a positive number.
- [target](https://vanilla-breeze.com/docs/attributes/target/): Chooses where a link or form result opens: the same tab, a new tab, a parent or top-level frame, or a named window or iframe.
- [title](https://vanilla-breeze.com/docs/attributes/title/): Advisory text shown as a mouse-hover tooltip and used as an accessible name or description. Good for abbr and iframe; never the only place for important text.
- [translate](https://vanilla-breeze.com/docs/attributes/translate/): Marks text and translatable attribute values that machine translation must leave alone: code, brand names, identifiers. Inherited; empty means yes.
- [wrap](https://vanilla-breeze.com/docs/attributes/wrap/): Controls whether a textarea's submitted value gets line breaks where the text wraps on screen (hard) or only where the user pressed Enter (soft, the default).

## Prototyping

- [data-lorem](https://vanilla-breeze.com/docs/attributes/data-lorem/): Placeholder text via data attributes. Fill any element with lorem ipsum, specify word counts, sentence counts, or list items. Auto-detects language for Japanese, Chinese, Korean, Arabic, Hebrew and Cyrillic corpuses.
- [data-mock](https://vanilla-breeze.com/docs/attributes/data-mock/): Placeholder media via data attributes. Add data-mock to img, video, iframe, or canvas for instant placeholder boxes with X-pattern, presets, and photo service integration.
- [data-wireframe](https://vanilla-breeze.com/docs/attributes/data-wireframe/): Wireframe mode for rapid HTML prototyping. Apply sketch-like rendering with four fidelity levels, dark mode support, and element labeling via a single data attribute.

## Responsive

- [data-visible](https://vanilla-breeze.com/docs/attributes/data-visible/): Responsive visibility utility. Show or hide elements by viewport width or by the width of their container, without writing custom media or container queries.

## Shapes

- [data-border-shape](https://vanilla-breeze.com/docs/attributes/data-border-shape/): A coloured hexagon, diamond or arch frame around an image: a clipped background layer plus the image clipped to the same shape, inset by --shape-border.
- [data-bubble](https://vanilla-breeze.com/docs/attributes/data-bubble/): Chat bubble shapes for messaging UIs: incoming, outgoing, assistant, thought, typing, error and system variants with CSS shape() tails that mirror in right-to-left text.
- [data-callout](https://vanilla-breeze.com/docs/attributes/data-callout/): VB's one callout primitive: note, info, tip, warning and danger boxes, with optional speech and notched shapes. markdown-viewer renders :::kind blocks with the same markup.
- [data-clip](https://vanilla-breeze.com/docs/attributes/data-clip/): Responsive shape masks for images and figures using CSS shape(): hexagon, arch, swoosh, leaf, diagonal-frame, torn.
- [data-cutout](https://vanilla-breeze.com/docs/attributes/data-cutout/): Punch a circle, diamond, arch window or hexagon hole through an element, or bite its top corner, with an evenodd CSS shape().
- [data-morph](https://vanilla-breeze.com/docs/attributes/data-morph/): Animate an element's clip-path between matching shapes: pulse, breathe, wave. One cycle by default; data-morph-loop loops with pause on hover, focus, data-paused and reduced motion.
- [data-shape-start](https://vanilla-breeze.com/docs/attributes/data-shape-start/): Section edges: clip the top or bottom edge of a section into a wave, chevron, scallop or diagonal with CSS shape(). Any start shape combines with any end shape.

## Text-effects

- [data-effect](https://vanilla-breeze.com/docs/attributes/data-effect/): Declarative visual effects: entrances, attention seekers, decorations, exits and text effects through one attribute. Composable animation slots, triggers, reduced-motion and pause support.
- [data-emoji](https://vanilla-breeze.com/docs/attributes/data-emoji/): Replace :shortcode: text with Unicode emoji in containers, accessible-name attributes and live in inputs. Without JavaScript, shortcodes stay as readable text.

## Visual-effects

- [data-parallax](https://vanilla-breeze.com/docs/attributes/data-parallax/): Section-local, transform-only depth motion driven by a CSS view-progress timeline. CSS-only, clipped by its group, and off under either reduced-motion switch.
- [data-stagger](https://vanilla-breeze.com/docs/attributes/data-stagger/): Cascades entrance timing across a container's children: linear, reverse, random or a grid wave, with an optional interval such as 40ms.
- [data-transition](https://vanilla-breeze.com/docs/attributes/data-transition/): Declarative View Transitions for same-document changes: morph, slide (writing-direction aware), fade, scale, a staggered list and none, animated by VB.swap() or any component transition.
- [data-trigger](https://vanilla-breeze.com/docs/attributes/data-trigger/): Controls when a data-effect activates: on scroll, hover or focus, click, after a delay, on a media query, an event, a view transition, or continuously with scroll position.
