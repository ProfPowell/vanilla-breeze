import { modifierIndexItems } from './layoutReference.js';
import { buildNativeCategories } from './nativeAttributes.js';

// Native groups come from each page's frontmatter (nativeGroup) — see
// site/data/nativeAttributes.js and tests/unit/native-attribute-index.test.js.
const nativeAttributes = buildNativeCategories();

const dataAttributes = {
  layout: {
    label: 'Layout',
    items: [
      { name: 'data-layout', type: 'layout', href: '/docs/attributes/data-layout/', description: 'Apply stack, cluster, grid, center, sidebar, split, media, regions and the other component layouts to any element' },
      { name: 'data-page-layout', type: 'layout', href: '/docs/attributes/data-page-layout/', description: 'Whole-page templates on body (sidebar, holy-grail, dashboard, landing…) with semantic area assignment' },
      { name: 'data-layout-density', type: 'layout', href: '/docs/attributes/data-layout-density/', description: 'Compact or spacious spacing modes that cascade to descendants' },
      { name: 'data-container', type: 'layout', href: '/docs/attributes/data-container/', description: 'Make any element a query container (card, panel, media presets); the escape hatch for content-sized layout children' },
      { name: 'data-canvas', type: 'layout', href: '/docs/attributes/data-canvas/', description: 'Attribute form of layout-canvas: a centered content surface on any element (flush or elevated)' },
      { name: 'data-sticky', type: 'layout', href: '/docs/attributes/data-sticky/', description: 'Sticky header or footer on its own; on <html> it coordinates --sticky-offset so sticky headers, sidebars and TOCs line up' },
      { name: 'data-stage', type: 'layout', href: '/docs/attributes/data-stage/', description: 'Scrollytelling layout — pinned visual plus sequential semantic steps, no JS' },
    ],
  },
  'layout-modifiers': {
    label: 'Layout Modifiers',
    // Generated from the layout CSS (site/data/layoutReference.js): one entry
    // per data-layout-* modifier and layout utility, linking to its anchored
    // row in the data-layout reference. Attributes with their own page are
    // listed under Layout instead.
    items: modifierIndexItems().filter((item) => !item.href.startsWith('/docs/attributes/data-container/')),
  },
  formatting: {
    label: 'Formatting',
    items: [
      { name: 'data-format-number', type: 'formatting', href: '/docs/attributes/data-format-number/', description: 'Locale-aware number formatting via Intl.NumberFormat' },
      { name: 'data-format-date', type: 'formatting', href: '/docs/attributes/data-format-date/', description: 'Locale-aware date and relative time formatting' },
      { name: 'data-format-bytes', type: 'formatting', href: '/docs/attributes/data-format-bytes/', description: 'Human-readable file size formatting' },
    ],
  },
  math: {
    label: 'Math',
    items: [
      { name: 'data-math', type: 'behavior', href: '/docs/attributes/data-math/', description: 'Enhance code elements with precompiled MathML rendering, numbering, and copy-to-clipboard' },
    ],
  },
  clipboard: {
    label: 'Clipboard & Selection',
    items: [
      { name: 'data-copy', type: 'behavior', href: '/docs/attributes/data-copy/', description: 'Copy text (or paste) on click with announced success/failure, copy:done / paste:done events and an execCommand fallback' },
    ],
  },
  'visual-effects': {
    label: 'Visual Effects',
    items: [
      { name: 'data-effect', type: 'behavior', href: '/docs/attributes/data-effect/', description: 'Composable visual effects (40+): entrances, attention, text, decoration and exits, with an accessible text splitter and a data-paused hook' },
      { name: 'data-trigger', type: 'behavior', href: '/docs/attributes/data-trigger/', description: 'Controls when effects activate: scroll, hover or focus, click toggle, delay, media query, event, view transition, or scroll position' },
      { name: 'data-stagger', type: 'behavior', href: '/docs/attributes/data-stagger/', description: 'Cascades entrance timing across children: linear, reverse, random or grid wave, with an optional interval (40ms)' },
      { name: 'data-transition', type: 'behavior', href: '/docs/attributes/data-transition/', description: 'Declarative View Transitions: morph, direction-aware slide, fade, scale, and staggered lists for state changes' },
      { name: 'data-emoji', type: 'behavior', href: '/docs/attributes/data-emoji/', description: 'Replace :shortcode: text with Unicode emoji in text, names and live inputs (undoable); times and code are left alone', pack: 'extras' },
      { name: 'data-parallax', type: 'behavior', href: '/docs/attributes/data-parallax/', description: 'Section-local, transform-only depth motion driven by view() timeline, with subtle/medium/strong presets — CSS-only, off under reduced motion' },
    ],
  },
  interaction: {
    label: 'Interaction',
    items: [
      { name: 'data-hotkey', type: 'behavior', href: '/docs/attributes/data-hotkey/', description: 'Keyboard shortcuts: platform-aware <kbd> display and declarative action binding (aria-keyshortcuts, scoping, WCAG 2.1.4 single-key preference)' },
      { name: 'data-spoiler', type: 'behavior', href: '/docs/attributes/data-spoiler/', description: 'Content concealment with blur, solid or noise effects; keeps host semantics, focus moves to revealed content, localisable, print opt-out' },
      { name: 'data-effect="animate-image"', type: 'behavior', href: '/docs/attributes/data-animate-image/', description: 'Pause/play control for animated GIF, WebP and APNG images: real still or hidden fallback, reduced motion, <picture> support', pack: 'effects' },
      { name: 'data-splitter', type: 'behavior', href: '/docs/attributes/data-splitter/', description: 'Resizable drag divider between panels with keyboard support' },
      { name: 'data-paged', type: 'behavior', href: '/docs/attributes/data-paged/', description: 'Pagination for any list-shaped container: numbered, prev/next, load-more or infinite, with optional URL state' },
      { name: 'data-sortable', type: 'behavior', href: '/docs/attributes/data-sortable/', description: 'Client-side sorting for lists and tables via column headers or an external control; composes with data-paged' },
      { name: 'data-markdown-editable', type: 'behavior', href: '/docs/attributes/data-markdown-editable/', description: 'Inline markdown editing: raw markdown while focused, sanitised formatting on blur; textarea preview' },
    ],
  },
  responsive: {
    label: 'Responsive',
    items: [
      { name: 'data-responsive', type: 'behavior', href: '/docs/attributes/data-responsive/', description: 'Responsive images: measured sizes, srcset shorthand and a dev source badge (img)' },
      { name: 'data-visible', type: 'styling', href: '/docs/attributes/data-visible/', description: 'Show or hide elements by viewport width without custom media queries' },
    ],
  },
  'form-controls': {
    label: 'Form Controls',
    items: [
      { name: 'data-switch', type: 'behavior', href: '/docs/attributes/data-switch/', description: 'Style a checkbox as an on/off toggle switch (s, l sizes); adds role="switch"' },
      { name: 'data-range', type: 'behavior', href: '/docs/attributes/data-range/', description: 'Styled range slider: filled track, value bubble, tick markers, datalist labels, aria-valuetext with units' },
      { name: 'data-stepper', type: 'behavior', href: '/docs/attributes/data-stepper/', description: 'Native-stepping −/+ buttons for number inputs; honour disabled and readonly' },
      { name: 'data-color', type: 'behavior', href: '/docs/attributes/data-color/', description: 'Swatch and hex display for input[type=color] (not the badge colour variant)' },
      { name: 'data-mask', type: 'behavior', href: '/docs/attributes/data-mask/', description: 'Format-as-you-type masks (US presets or custom patterns); incomplete values are invalid' },
      { name: 'data-accept', type: 'behavior', href: '/docs/attributes/data-accept/', description: 'Character filter for text inputs: presets (phone, date, card, letters…) or a custom character class. Not for file types' },
      { name: 'data-upload', type: 'behavior', href: '/docs/attributes/data-upload/', description: 'Drag-and-drop zone for file inputs; drops obey accept and multiple, file list, localizable' },
      { name: 'data-toggle-tags', type: 'behavior', href: '/docs/attributes/data-toggle-tags/', description: 'Checkbox pill chips; optional data-max limit (focusable, announced)' },
      { name: 'data-strength', type: 'behavior', href: '/docs/attributes/data-strength/', description: 'Password strength meter + rules checklist inside form-field; optional data-strength-min validity' },
    ],
  },
  'form-behavior': {
    label: 'Form Behavior',
    items: [
      { name: 'data-count', type: 'behavior', href: '/docs/attributes/data-count/', description: 'Live character or word count under a textarea, with warning/error states and polite announcements' },
      { name: 'data-grow', type: 'behavior', href: '/docs/attributes/data-grow/', description: 'Auto-expanding textarea using CSS field-sizing with JS fallback' },
      { name: 'data-show-when', type: 'behavior', href: '/docs/attributes/data-show-when/', description: 'Conditionally show or hide form sections based on field values' },
      { name: 'data-autosave', type: 'behavior', href: '/docs/attributes/data-autosave/', description: 'Save form drafts to localStorage (24h); skips passwords, hidden fields, buttons, card and one-time codes' },
      { name: 'data-autosave-ignore', type: 'behavior', href: '/docs/attributes/data-autosave/#privacy', description: 'Keep a control or section out of autosave and wizard-persist drafts' },
      { name: 'data-wizard', type: 'behavior', href: '/docs/attributes/data-wizard/', description: 'Multi-step form wizard with per-step validation and progress tracking' },
      { name: 'data-select-all', type: 'behavior', href: '/docs/attributes/data-select-all/', description: 'Master checkbox for bulk selection: indeterminate state, skips disabled items, live count, re-syncs on reset and added rows' },
    ],
  },
  styling: {
    label: 'Styling',
    items: [
      { name: 'data-numbered', type: 'styling', href: '/docs/elements/native/article/#data-numbered', description: 'Auto-number article headings, captioned figures and tables with CSS counters (across sections)' },
      { name: 'data-section-numbers', type: 'styling', href: '/docs/elements/native/article/#data-section-numbers', description: 'Section-sign (§ 1, § 1a) numbering for article h2/h3' },
      { name: 'data-drop-cap', type: 'styling', href: '/docs/elements/native/article/#data-drop-cap', description: 'Large decorative first letter for article opening paragraphs' },
      { name: 'data-prose', type: 'styling', href: '/docs/elements/native/article/#data-prose', description: 'Long-form typography and floated paragraph images for markdown/CMS articles' },
      { name: 'data-ornament', type: 'styling', href: '/docs/elements/native/hr/#ornament', description: 'Custom symbol or text ornament for horizontal rules (bare: ⁂)' },
      { name: 'data-badge', type: 'styling', href: '/docs/elements/native/time/#badge', description: 'Bordered chip styling for key dates on <time> (boolean; badge shapes are <layout-badge data-shape>)' },
      { name: 'data-striped', type: 'styling', href: '/docs/elements/native/dl/#striped', description: 'Alternating row stripes on <dl> and <table> (shared --color-row-stripe)' },
      { name: 'data-striped (table)', type: 'styling', href: '/docs/elements/native/table/#variants', description: 'Alternating stripes on visible table body rows' },
      { name: 'data-bordered', type: 'styling', href: '/docs/elements/native/table/#variants', description: 'Borders on every table cell' },
      { name: 'data-accent', type: 'styling', href: '/docs/themes/#accents', description: 'Colour accent (ocean, forest, sunset, …) on <html> or any element; tints the default and personality themes' },
    ],
  },
  shapes: {
    label: 'Shapes',
    items: [
      { name: 'data-shape-start', type: 'styling', href: '/docs/attributes/data-shape-start/', description: 'Clip the top edge of a section into a wave, chevron, scallop or diagonal; combines with any data-shape-end' },
      { name: 'data-shape-end', type: 'styling', href: '/docs/attributes/data-shape-start/', description: 'Clip the bottom edge of a section into a wave, chevron, scallop or diagonal; combines with any data-shape-start' },
      { name: 'data-clip', type: 'styling', href: '/docs/attributes/data-clip/', description: 'Shape masks for images and figures (incl. picture) — hexagon, arch, swoosh, leaf, diagonal-frame, torn' },
      { name: 'data-shape (layout-badge)', type: 'styling', href: '/docs/elements/custom-elements/layout-badge/#shapes', description: 'layout-badge shape: square, ribbon, notch, flag, double-arrow, stamp' },
      { name: 'data-callout', type: 'styling', href: '/docs/attributes/data-callout/', description: 'Callout boxes: note, info, tip, warning, danger kinds with optional speech and notched shapes; markdown-viewer :::kind blocks render it' },
      { name: 'data-bubble', type: 'styling', href: '/docs/attributes/data-bubble/', description: 'Chat bubble shapes for static transcripts: incoming, outgoing, assistant, thought, typing, error, system; tails mirror in RTL' },
      { name: 'data-cutout', type: 'styling', href: '/docs/attributes/data-cutout/', description: 'Punch a hole through an element — circle, diamond, arch-window, hex, badge-corner bite' },
      { name: 'data-border-shape', type: 'styling', href: '/docs/attributes/data-border-shape/', description: 'Coloured hexagon, diamond or arch frame around an image; follows keyboard focus' },
      { name: 'data-morph', type: 'styling', href: '/docs/attributes/data-morph/', description: 'Clip-path morph animations — pulse, breathe, wave; one cycle by default' },
      { name: 'data-morph-loop', type: 'styling', href: '/docs/attributes/data-morph/', description: 'Loop a data-morph animation; pauses on hover, data-paused and focus' },
    ],
  },
  infrastructure: {
    label: 'Infrastructure',
    items: [
      { name: 'data-print', type: 'styling', href: '/docs/attributes/data-print/', description: 'Print optimization modes, visibility control, page breaks, and opt-out for printed output' },
      { name: 'hide-until-ready', type: 'styling', href: '/docs/attributes/hide-until-ready/', description: 'Hide a custom element until it is defined (never without JS; timeout reveal), or show a placeholder until then' },
      { name: 'view-transitions', type: 'behavior', href: '/docs/attributes/view-transitions/', description: 'CSS View Transitions with named groups, shared elements, and presets' },
      { name: 'data-toc-ignore', type: 'behavior', href: '/docs/attributes/data-toc-ignore/', description: 'Exclude headings or containers from page-toc and heading-links' },
    ],
  },
};

const nativeItems = Object.values(nativeAttributes).flatMap(cat => cat.items);
const dataItems = Object.values(dataAttributes).flatMap(cat => cat.items);
const allItems = [...nativeItems, ...dataItems];

export default {
  nativeCategories: nativeAttributes,
  dataCategories: dataAttributes,
  nativeCount: nativeItems.length,
  nativePageCount: nativeItems.filter(i => !i.alias).length,
  nativeGroupCount: Object.keys(nativeAttributes).length,
  layoutCount: dataItems.filter(i => i.type === 'layout').length,
  behaviorCount: dataItems.filter(i => i.type === 'behavior').length,
  formattingCount: dataItems.filter(i => i.type === 'formatting').length,
  stylingCount: dataItems.filter(i => i.type === 'styling').length,
  dataCount: dataItems.length,
  totalCount: allItems.length,
};
