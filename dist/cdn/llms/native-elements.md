# Vanilla Breeze 0.7.4: native elements

Native HTML elements are styled with no classes. These pages document the variants and attributes Vanilla Breeze adds to each.

## Document

- [<base>](https://vanilla-breeze.com/docs/elements/native/base/): Sets the base URL that every relative URL in the document resolves against, and a default target for links and forms.
- [<body>](https://vanilla-breeze.com/docs/elements/native/body/): The document's content: the container for every landmark on the page and the surface VB paints the page background on.
- [<head>](https://vanilla-breeze.com/docs/elements/native/head/): The configuration surface for metadata, theming, performance, and social sharing.
- [<html>](https://vanilla-breeze.com/docs/elements/native/html/): The root element of an HTML document, containing all other elements.
- [<link>](https://vanilla-breeze.com/docs/elements/native/link/): Connects the document to external resources: stylesheets, icons, preload and preconnect hints, and machine-readable relations such as canonical, author and license.
- [<meta>](https://vanilla-breeze.com/docs/elements/native/meta/): Document metadata that no other head element covers: character encoding, viewport, description, theme colour, pragma directives, and the metadata VB components read.
- [<style>](https://vanilla-breeze.com/docs/elements/native/style/): Embeds a CSS stylesheet in the document. Covers cascade-layer placement against VB's layers, media-scoped blocks, CSP nonces, render blocking, and why a style block or tokens beat style attributes.
- [<title>](https://vanilla-breeze.com/docs/elements/native/title/): Defines the document title shown in browser tabs, bookmarks, history, search results, and screen reader announcements.

## Editing

- [<del>](https://vanilla-breeze.com/docs/elements/native/del/): The del element represents text that has been deleted from a document, typically displayed with a strikethrough and red background tint for tracking edits or showing revisions.
- [<ins>](https://vanilla-breeze.com/docs/elements/native/ins/): The ins element represents text that has been inserted into a document, styled with a green bottom border and subtle green background for tracking edits or showing revisions.

## Embedded

- [<canvas>](https://vanilla-breeze.com/docs/elements/native/canvas/): The canvas element provides a drawing surface for rendering graphics, charts, games, and dynamic visual content via JavaScript.
- [<embed>](https://vanilla-breeze.com/docs/elements/native/embed/): The embed element is a void element for embedding external content. It provides no fallback mechanism -- prefer modern alternatives like iframe, video, and audio.
- [<iframe>](https://vanilla-breeze.com/docs/elements/native/iframe/): The iframe element embeds external content with responsive containers and security best practices for third-party integrations.
- [<math>](https://vanilla-breeze.com/docs/elements/native/math/): Native MathML rendering with a self-hosted math font, display and inline modes, numbered and captioned equations.
- [<object>](https://vanilla-breeze.com/docs/elements/native/object/): The object element is a legacy mechanism for embedding external resources. Modern alternatives like img, video, audio, iframe, and svg are preferred.
- [<svg>](https://vanilla-breeze.com/docs/elements/native/svg/): The SVG element embeds scalable vector graphics with size variants, color options, and built-in animations for icons and illustrations.

## Forms

- [<button>](https://vanilla-breeze.com/docs/elements/native/button/): Interactive control for form submission, dialogs, and user actions. Vanilla Breeze styles buttons with inline-flex layout, design tokens, and variant classes for visual hierarchy.
- [<datalist>](https://vanilla-breeze.com/docs/elements/native/datalist/): Provides autocomplete suggestions for input elements. The datalist creates a native dropdown of options that users can select from while still allowing free-form text entry.
- [<fieldset>](https://vanilla-breeze.com/docs/elements/native/fieldset/): Groups related form controls together with an optional caption. Essential for organizing complex forms and providing accessible groupings for screen readers.
- [<form>](https://vanilla-breeze.com/docs/elements/native/form/): Container for interactive form controls that collects and submits user data. The form element provides structure, validation, and submission handling.
- [<input>](https://vanilla-breeze.com/docs/elements/native/input/): The most versatile form element, accepting text, numbers, dates, files, and more through the type attribute. Always pair with a label for accessibility.
- [<label>](https://vanilla-breeze.com/docs/elements/native/label/): Associates a text caption with a form control. Labels are essential for accessibility, enabling screen readers to announce form fields and allowing users to click the label to focus the associated input.
- [<legend>](https://vanilla-breeze.com/docs/elements/native/legend/): Provides a caption for a fieldset element. The legend is announced by screen readers as the group's label, making it essential for accessibility.
- [<meter>](https://vanilla-breeze.com/docs/elements/native/meter/): Displays a scalar measurement within a known range, like a gauge. The meter automatically changes color based on whether the value is in the optimum, suboptimum, or poor range.
- [<optgroup>](https://vanilla-breeze.com/docs/elements/native/optgroup/): Groups related options within a select element under a visible label. Helps users scan long option lists organized into logical categories.
- [<option>](https://vanilla-breeze.com/docs/elements/native/option/): Defines an item in a select dropdown or datalist autocomplete. Each option has a value submitted to the server and display text shown to the user.
- [<output>](https://vanilla-breeze.com/docs/elements/native/output/): Displays the result of a calculation or user action. Semantically ideal for form validation messages, computed values, and dynamic results. Used extensively in the form-field custom element for validation feedback.
- [<progress>](https://vanilla-breeze.com/docs/elements/native/progress/): Displays the completion progress of a task. Use for file uploads, form steps, loading states, or any operation with a known endpoint. For scalar measurements (like disk space), use meter instead.
- [<search>](https://vanilla-breeze.com/docs/elements/native/search/): Semantic landmark element for search functionality. Wraps search forms and controls to provide accessibility and structural meaning.
- [<select>](https://vanilla-breeze.com/docs/elements/native/select/): Dropdown menu for choosing from a list of predefined options. Vanilla Breeze resets the native appearance and adds a currentColor chevron, consistent sizing, and focus styling via design tokens.
- [<selectedcontent>](https://vanilla-breeze.com/docs/elements/native/selectedcontent/): Displays a clone of the currently selected option's content inside a customizable select's button trigger. Used with appearance: base-select to show rich content (icons, images, descriptions) in the closed select state.
- [<textarea>](https://vanilla-breeze.com/docs/elements/native/textarea/): Multi-line text input for longer content like messages, comments, or descriptions. Unlike input type='text', textarea allows line breaks and resizing.

## Headings

- [<headings>](https://vanilla-breeze.com/docs/elements/native/headings/): Heading elements define the hierarchical structure of a document. Six levels from h1 (most important) to h6 (least), used for titles, sections, and content organization.

## Interactive

- [<details>](https://vanilla-breeze.com/docs/elements/native/details/): The native HTML disclosure widget for expandable content. Creates an interactive widget that users can open and close without JavaScript.
- [<dialog>](https://vanilla-breeze.com/docs/elements/native/dialog/): The native HTML modal dialog element with built-in backdrop, focus trapping, and keyboard handling.
- [<summary>](https://vanilla-breeze.com/docs/elements/native/summary/): The clickable heading for a details disclosure widget. Provides the visible label that toggles the expanded content.

## Lists

- [<dd>](https://vanilla-breeze.com/docs/elements/native/dd/): The definition description element provides the description, definition, or value associated with a term in a definition list.
- [<dl>](https://vanilla-breeze.com/docs/elements/native/dl/): The description list element represents a collection of term-description pairs, such as glossaries, metadata, or key-value data.
- [<dt>](https://vanilla-breeze.com/docs/elements/native/dt/): The definition term element represents the term, name, or key in a term-description group within a definition list.
- [<li>](https://vanilla-breeze.com/docs/elements/native/li/): The list item element represents an individual item within a list structure.
- [<menu>](https://vanilla-breeze.com/docs/elements/native/menu/): List container for toolbar buttons and context menu patterns. Groups related commands; exposed to assistive technology as a list.
- [<ol>](https://vanilla-breeze.com/docs/elements/native/ol/): The ordered list element represents a collection of items where the sequence is meaningful.
- [<ul>](https://vanilla-breeze.com/docs/elements/native/ul/): The unordered list element represents a collection of items where the sequence does not matter.

## Media

- [<area>](https://vanilla-breeze.com/docs/elements/native/area/): Defines a clickable region within a map element using pixel-based shape coordinates. Used with img and map for client-side image maps.
- [<audio>](https://vanilla-breeze.com/docs/elements/native/audio/): The audio element embeds sound content with native playback controls, styled variants, and an optional track listing for playlists.
- [<img>](https://vanilla-breeze.com/docs/elements/native/img/): The image element embeds responsive images with automatic sizing, lazy loading support, and visual variants for different use cases.
- [<map>](https://vanilla-breeze.com/docs/elements/native/map/): Defines an image map with clickable regions linked to an img element via the usemap attribute. Coordinates are pixel-based and do not scale responsively.
- [<picture>](https://vanilla-breeze.com/docs/elements/native/picture/): The picture element enables art direction and format switching by providing multiple image sources for different screen sizes and browser capabilities.
- [<source>](https://vanilla-breeze.com/docs/elements/native/source/): The source element specifies multiple media resources for picture, video, and audio elements, enabling format fallbacks and responsive media selection.
- [<track>](https://vanilla-breeze.com/docs/elements/native/track/): The track element provides timed text tracks for video and audio elements, enabling captions, subtitles, descriptions, and chapter markers.
- [<video>](https://vanilla-breeze.com/docs/elements/native/video/): The video element embeds video content with native playback controls, responsive sizing, and aspect ratio variants for different video formats.

## Scripting

- [<noscript>](https://vanilla-breeze.com/docs/elements/native/noscript/): Content that is used only when scripting is disabled. In VB, a supplement to progressive enhancement alongside data-requires-js and the (scripting: none) media query.
- [<script>](https://vanilla-breeze.com/docs/elements/native/script/): Loads or embeds JavaScript, or carries a data block such as JSON-LD or an import map. Covers classic vs module scripts, async/defer, render blocking, CSP nonces and integrity.
- [<slot>](https://vanilla-breeze.com/docs/elements/native/slot/): A placeholder inside a shadow root that shows the host's light-DOM children. Explains named and default slots, declarative shadow DOM, ::slotted, slotchange, and how VB's mostly light-DOM components use slot= as a styling hook.
- [<template>](https://vanilla-breeze.com/docs/elements/native/template/): Holds inert HTML that is parsed but not rendered. Covers cloning template.content, declarative shadow DOM with shadowrootmode, accessibility, and the VB components that read author templates.

## Sectioning

- [<address>](https://vanilla-breeze.com/docs/elements/native/address/): Contact information for the nearest article or document. Typically contains physical address, email, phone, or social links.
- [<article>](https://vanilla-breeze.com/docs/elements/native/article/): Self-contained, independently distributable content such as blog posts, news articles, forum posts, product cards, or user comments.
- [<aside>](https://vanilla-breeze.com/docs/elements/native/aside/): Content tangentially related to the surrounding content. Used for sidebars, pull quotes, and supplementary information boxes.
- [<footer>](https://vanilla-breeze.com/docs/elements/native/footer/): Footer content for its nearest sectioning ancestor. Contains information about the author, copyright, related links, or metadata about the section.
- [<header>](https://vanilla-breeze.com/docs/elements/native/header/): Introductory content for its nearest sectioning ancestor. Contains headings, logos, navigation, search forms, or other introductory elements.
- [<hgroup>](https://vanilla-breeze.com/docs/elements/native/hgroup/): Groups a heading with secondary content such as a subtitle, alternative title, or tagline. Creates a single logical heading unit.
- [<main>](https://vanilla-breeze.com/docs/elements/native/main/): The dominant content of the document body. Contains the primary content unique to the page, excluding headers, footers, navigation, and sidebars.
- [<nav>](https://vanilla-breeze.com/docs/elements/native/nav/): Navigation sections containing links to other pages or parts of the page. Used for primary navigation, table of contents, breadcrumbs, and pagination.
- [<section>](https://vanilla-breeze.com/docs/elements/native/section/): A thematic grouping of content, typically with a heading. Use for chapters, tabbed panels, numbered sections, or any content that would appear in an outline.

## Tables

- [<caption>](https://vanilla-breeze.com/docs/elements/native/caption/): Provides a title or description for a table. Vanilla Breeze styles captions with start-aligned text, muted color, and medium font weight to clearly label tabular data without competing with the data itself.
- [<col>](https://vanilla-breeze.com/docs/elements/native/col/): Defines properties for a single column or a span of columns within a colgroup. Use it to set column widths, apply background colors, or highlight specific columns in a table.
- [<colgroup>](https://vanilla-breeze.com/docs/elements/native/colgroup/): Groups one or more columns in a table for structural and styling purposes. Supports the span attribute for multi-column groups or individual col elements for per-column control.
- [<table>](https://vanilla-breeze.com/docs/elements/native/table/): Tables display tabular data with full-width layout, collapsed borders, tabular numerals, and automatic row hover states. Includes data-striped, data-bordered, data-density and minimal variants plus data attributes for density, alignment, sticky headers and columns, responsive card and scroll layouts, and row states.
- [<tbody>](https://vanilla-breeze.com/docs/elements/native/tbody/): The tbody element groups body rows of a table. Vanilla Breeze adds a hover highlight on rows and supports a striped variant for easier scanning.
- [<td>](https://vanilla-breeze.com/docs/elements/native/td/): The td element defines a data cell in a table. Vanilla Breeze styles cells with a thin bottom border and top vertical alignment. Supports data attributes for numeric alignment, custom sort/filter values, and responsive card-mode labels.
- [<tfoot>](https://vanilla-breeze.com/docs/elements/native/tfoot/): The tfoot element groups footer rows of a table. Vanilla Breeze styles it with bold text, a raised background, and a medium top border to visually distinguish summary rows from data.
- [<th>](https://vanilla-breeze.com/docs/elements/native/th/): The th element defines a header cell in a table. Vanilla Breeze styles headers with a raised background and semi-bold weight. Always use scope for accessibility. Supports sort indicators and numeric alignment via data attributes.
- [<thead>](https://vanilla-breeze.com/docs/elements/native/thead/): The thead element groups header rows in a table. Vanilla Breeze styles it with a raised background and a medium bottom border to visually separate column headers from data.
- [<tr>](https://vanilla-breeze.com/docs/elements/native/tr/): The tr element defines a row of cells in a table. Vanilla Breeze adds data attributes for row states like selection, highlighting, and expandable detail rows.

## Text Content

- [<blockquote>](https://vanilla-breeze.com/docs/elements/native/blockquote/): The blockquote element represents a section quoted from another source, with VB styling for figure-based attribution, prose refinement, and academic citation patterns.
- [<div>](https://vanilla-breeze.com/docs/elements/native/div/): Generic block-level container. In Vanilla Breeze, div usage is discouraged — prefer semantic elements and VB layout primitives.
- [<figcaption>](https://vanilla-breeze.com/docs/elements/native/figcaption/): The figcaption element provides a caption or legend for the content of its parent figure element.
- [<figure>](https://vanilla-breeze.com/docs/elements/native/figure/): The figure element represents self-contained content with an optional caption, used for images, diagrams, code snippets, and quotations.
- [<hr>](https://vanilla-breeze.com/docs/elements/native/hr/): The horizontal rule element represents a thematic break between paragraph-level content, signaling a shift in topic or scene.
- [<p>](https://vanilla-breeze.com/docs/elements/native/p/): The paragraph element represents a block of text, forming the basic building block of written content on the web.
- [<pre>](https://vanilla-breeze.com/docs/elements/native/pre/): Preformatted text preserving whitespace and line breaks. VB distinguishes code blocks (pre+code) from bare preformatted text (poetry, ASCII art) with different visual treatments.

## Text Semantics

- [<a>](https://vanilla-breeze.com/docs/elements/native/a/): The anchor element creates hyperlinks to web pages, files, email addresses, locations within the same page, or any other URL.
- [<abbr>](https://vanilla-breeze.com/docs/elements/native/abbr/): The abbreviation element represents an abbreviation or acronym, optionally with its expansion shown via the title attribute.
- [<b>](https://vanilla-breeze.com/docs/elements/native/b/): Draws attention to text without conveying extra importance. Used for keywords, product names, or lead text in article summaries.
- [<bdi>](https://vanilla-breeze.com/docs/elements/native/bdi/): Isolates text that might be formatted in a different direction from surrounding text.
- [<bdo>](https://vanilla-breeze.com/docs/elements/native/bdo/): Overrides the current text direction, forcing text to render left-to-right or right-to-left.
- [<br>](https://vanilla-breeze.com/docs/elements/native/br/): Produces a line break in text content. Use only where the line break is part of the content's meaning.
- [<cite>](https://vanilla-breeze.com/docs/elements/native/cite/): Represents the title of a creative work (book, song, film, etc.).
- [<code>](https://vanilla-breeze.com/docs/elements/native/code/): Elements for displaying code, keyboard input, sample output, and variables in technical documentation.
- [<data>](https://vanilla-breeze.com/docs/elements/native/data/): Links content with a machine-readable value. Enhanced in VB with locale-aware number formatting, byte formatting, and animated ticker effects.
- [<dfn>](https://vanilla-breeze.com/docs/elements/native/dfn/): The dfn element indicates the defining instance of a term, marking where a term is first introduced and defined in the document.
- [<em>](https://vanilla-breeze.com/docs/elements/native/em/): Marks text with stress emphasis that changes the meaning of a sentence. Rendered as italic, with synthesized italic as a fallback.
- [<i>](https://vanilla-breeze.com/docs/elements/native/i/): Represents text in an alternate voice, mood, or language — foreign words, technical terms, thoughts, ship names, or taxonomic designations.
- [<kbd>](https://vanilla-breeze.com/docs/elements/native/kbd/): The kbd element represents user keyboard input, displaying keys and key combinations in a distinctive style that resembles physical keyboard keys.
- [<mark>](https://vanilla-breeze.com/docs/elements/native/mark/): The mark element represents text highlighted for its relevance in context, with VB highlight categories (success, warning, error) that stay readable in light, dark and forced-colors modes.
- [<q>](https://vanilla-breeze.com/docs/elements/native/q/): Represents an inline quotation with locale-aware quotation marks via VB's i18n system.
- [<rp>](https://vanilla-breeze.com/docs/elements/native/rp/): Provides fallback parentheses for browsers that do not support ruby annotations.
- [<rt>](https://vanilla-breeze.com/docs/elements/native/rt/): Specifies the ruby text (annotation) in a ruby annotation, providing pronunciation or other guidance above base text.
- [<ruby>](https://vanilla-breeze.com/docs/elements/native/ruby/): Represents a ruby annotation, used for East Asian typography to show pronunciation guides above or beside base text.
- [<s>](https://vanilla-breeze.com/docs/elements/native/s/): The s element represents content that is no longer accurate or no longer relevant, displayed with a strikethrough line.
- [<samp>](https://vanilla-breeze.com/docs/elements/native/samp/): Represents sample or quoted output from a computer program. Rendered in monospace font.
- [<small>](https://vanilla-breeze.com/docs/elements/native/small/): Represents side comments, disclaimers, caveats, and fine print. Rendered at a smaller font size.
- [<span>](https://vanilla-breeze.com/docs/elements/native/span/): Generic inline container for phrasing content. Use only when no semantic element fits — for effects, status indicators, translation control, or accessibility helpers.
- [<strong>](https://vanilla-breeze.com/docs/elements/native/strong/): Indicates strong importance, seriousness, or urgency. Rendered at weight 600, with synthesised bold as a fallback for single-weight fonts.
- [<sub>](https://vanilla-breeze.com/docs/elements/native/sub/): Represents subscript text for chemical formulas, mathematical notation, and variable subscripts. Rendered smaller and below the baseline in any font.
- [<sup>](https://vanilla-breeze.com/docs/elements/native/sup/): Represents superscript text for exponents, ordinals, footnotes, and trademark symbols. Rendered smaller and raised in any font.
- [<time>](https://vanilla-breeze.com/docs/elements/native/time/): The time element represents a specific period in time, providing a machine-readable datetime value while displaying a human-readable format to users.
- [<u>](https://vanilla-breeze.com/docs/elements/native/u/): Represents an unarticulated annotation — typically spelling errors or Chinese proper names. Vanilla Breeze draws a wavy error-coloured underline, and a plain solid underline in Chinese, Japanese and Korean text.
- [<var>](https://vanilla-breeze.com/docs/elements/native/var/): Represents a variable in mathematics or programming, set in italic (upright with a dashed underline in Chinese, Japanese and Korean text).
- [<wbr>](https://vanilla-breeze.com/docs/elements/native/wbr/): Suggests a word break opportunity — the browser may break the line here if needed, but won't force a break.
