const nativeAttributes = {
  global: {
    label: 'Global',
    items: [
      { name: 'class', type: 'native', href: '/docs/attributes/class/', description: 'CSS class variants for buttons, navigation, forms, tables, and more' },
      { name: 'tabindex', type: 'native', href: '/docs/attributes/tabindex/', description: 'Control keyboard focus order and programmatic focusability' },
      { name: 'autofocus', type: 'native', href: '/docs/attributes/autofocus/', description: 'Automatically focus an element on page load or dialog open' },
      { name: 'spellcheck', type: 'native', href: '/docs/attributes/spellcheck/', description: 'Enable or disable browser spell-checking on editable content' },
      { name: 'autocapitalize', type: 'native', href: '/docs/attributes/autocapitalize/', description: 'Control automatic capitalization on mobile virtual keyboards' },
      { name: 'title', type: 'native', href: '/docs/attributes/title/', description: 'Advisory tooltip text with accessibility caveats and alternatives' },
      { name: 'accesskey', type: 'native', href: '/docs/attributes/accesskey/', description: 'Keyboard shortcut to activate or focus an element' },
      { name: 'autocorrect', type: 'native', href: '/docs/attributes/autocorrect/', description: 'Control automatic text correction on mobile devices' },
    ],
  },
  performance: {
    label: 'Performance',
    items: [
      { name: 'loading', type: 'native', href: '/docs/attributes/loading/', description: 'Lazy loading, fetch priority, and image decoding hints for performance' },
      { name: 'async-defer', type: 'native', href: '/docs/attributes/async-defer/', description: 'Script loading strategies — async, defer, and module execution order' },
      { name: 'blocking', type: 'native', href: '/docs/attributes/blocking/', description: 'Explicit render-blocking control for scripts, styles, and links' },
    ],
  },
  forms: {
    label: 'Forms',
    items: [
      { name: 'autocomplete', type: 'native', href: '/docs/attributes/autocomplete/', description: 'Browser autofill hints for one-tap form completion on mobile' },
      { name: 'inputmode', type: 'native', href: '/docs/attributes/inputmode/', description: 'Control which virtual keyboard appears on mobile devices' },
      { name: 'enterkeyhint', type: 'native', href: '/docs/attributes/enterkeyhint/', description: 'Customize the Enter key label on mobile virtual keyboards' },
      { name: 'pattern', type: 'native', href: '/docs/attributes/pattern/', description: 'Regex validation, numeric constraints, and character limits for form inputs' },
      { name: 'disabled', type: 'native', href: '/docs/attributes/disabled/', description: 'Disable form controls — fieldset cascade, submission exclusion, and styling' },
      { name: 'readonly', type: 'native', href: '/docs/attributes/readonly/', description: 'Make inputs non-editable while still submitting their values' },
      { name: 'required', type: 'native', href: '/docs/attributes/required/', description: 'Mark form fields as mandatory with constraint validation and CSS pseudo-classes' },
      { name: 'placeholder', type: 'native', href: '/docs/attributes/placeholder/', description: 'Input hint text — when it helps, when it hurts, and accessible alternatives' },
      { name: 'novalidate', type: 'native', href: '/docs/attributes/novalidate/', description: 'Bypass native form validation for custom validation or draft saving' },
      { name: 'multiple', type: 'native', href: '/docs/attributes/multiple/', description: 'Allow multiple selections in select, email, and file inputs' },
      { name: 'list', type: 'native', href: '/docs/attributes/list/', description: 'Connect inputs to datalist for autocomplete suggestions' },
      { name: 'form', type: 'native', href: '/docs/attributes/form/', description: 'Associate form controls with a form outside their DOM ancestor' },
    ],
  },
  interactivity: {
    label: 'Interactivity',
    items: [
      { name: 'popover', type: 'native', href: '/docs/attributes/popover/', description: 'Zero-JS popovers, menus, and tooltips via the Popover API' },
      { name: 'contenteditable', type: 'native', href: '/docs/attributes/contenteditable/', description: 'Make any element editable with optional plaintext-only mode' },
      { name: 'hidden', type: 'native', href: '/docs/attributes/hidden/', description: 'Hide elements, collapse searchable content, or disable interaction with inert' },
      { name: 'draggable', type: 'native', href: '/docs/attributes/draggable/', description: 'Enable native drag-and-drop on any element with the HTML Drag and Drop API' },
    ],
  },
  'links-security': {
    label: 'Links & Security',
    items: [
      { name: 'rel', type: 'native', href: '/docs/attributes/rel/', description: 'Link relationships for security, performance, SEO, and resource hints' },
      { name: 'referrerpolicy', type: 'native', href: '/docs/attributes/referrerpolicy/', description: 'Control how much referrer information is sent with requests' },
      { name: 'integrity', type: 'native', href: '/docs/attributes/integrity/', description: 'Subresource integrity — verify CDN files have not been tampered with' },
      { name: 'crossorigin', type: 'native', href: '/docs/attributes/crossorigin/', description: 'CORS mode for scripts, images, fonts, and media — anonymous or credentialed' },
      { name: 'sandbox', type: 'native', href: '/docs/attributes/sandbox/', description: 'Iframe security sandbox with granular permission tokens' },
      { name: 'download', type: 'native', href: '/docs/attributes/download/', description: 'Trigger file download instead of navigation with optional filename override' },
      { name: 'target', type: 'native', href: '/docs/attributes/target/', description: 'Control where links open — new tabs, named targets, and frame navigation' },
      { name: 'nonce', type: 'native', href: '/docs/attributes/nonce/', description: 'CSP inline script and style allowlisting with one-time tokens' },
    ],
  },
  accessibility: {
    label: 'Accessibility',
    items: [
      { name: 'lang', type: 'native', href: '/docs/attributes/lang/', description: 'Declare content language for screen readers, hyphenation, and spell-checking' },
      { name: 'dir', type: 'native', href: '/docs/attributes/dir/', description: 'Set text direction for right-to-left languages and bidirectional content' },
      { name: 'translate', type: 'native', href: '/docs/attributes/translate/', description: 'Mark content as translatable or non-translatable for translation tools' },
    ],
  },
  media: {
    label: 'Media',
    items: [
      { name: 'srcset', type: 'native', href: '/docs/attributes/srcset/', description: 'Responsive images with resolution switching, art direction, and sizes' },
      { name: 'poster', type: 'native', href: '/docs/attributes/poster/', description: 'Video placeholder image displayed before playback starts' },
      { name: 'preload', type: 'native', href: '/docs/attributes/preload/', description: 'Media loading strategy — none, metadata, or auto for bandwidth vs UX' },
      { name: 'controls', type: 'native', href: '/docs/attributes/controls/', description: 'Native media controls with controlslist for selective button removal' },
      { name: 'allow', type: 'native', href: '/docs/attributes/allow/', description: 'Iframe permissions policy for camera, microphone, fullscreen, and more' },
    ],
  },
  structure: {
    label: 'Structure',
    items: [
      { name: 'open', type: 'native', href: '/docs/attributes/open/', description: 'Toggle visibility of details and dialog elements with JS and CSS hooks' },
      { name: 'datetime', type: 'native', href: '/docs/attributes/datetime/', description: 'Machine-readable dates on time, del, and ins elements' },
      { name: 'cite', type: 'native', href: '/docs/attributes/cite/', description: 'Source URL for blockquote, del, and ins — semantic but invisible' },
      { name: 'reversed', type: 'native', href: '/docs/attributes/reversed/', description: 'Reversed and custom-start ordered lists for countdowns and rankings' },
      { name: 'wrap', type: 'native', href: '/docs/attributes/wrap/', description: 'Textarea line-wrapping behavior — soft vs hard and its effect on submission' },
      { name: 'dirname', type: 'native', href: '/docs/attributes/dirname/', description: 'Submit text directionality alongside form values' },
      { name: 'is', type: 'native', href: '/docs/attributes/is/', description: 'Customized built-in elements — extend native HTML with custom behavior' },
      { name: 'ping', type: 'native', href: '/docs/attributes/ping/', description: 'Send tracking pings on link clicks with privacy considerations' },
      { name: 'srcdoc', type: 'native', href: '/docs/attributes/srcdoc/', description: 'Inline HTML content for iframes without a separate document' },
    ],
  },
};

const dataAttributes = {
  layout: {
    label: 'Layout',
    items: [
      { name: 'data-layout', type: 'layout', href: '/docs/attributes/data-layout/', description: 'Apply stack, cluster, grid, center, sidebar, split, cover, and other layouts to any element' },
      { name: 'data-page-layout', type: 'layout', href: '/docs/attributes/data-page-layout/', description: 'Full-page grid layouts with semantic area assignment' },
      { name: 'data-layout-density', type: 'layout', href: '/docs/attributes/data-layout-density/', description: 'Compact or spacious spacing modes that cascade to descendants' },
    ],
  },
  formatting: {
    label: 'Formatting',
    items: [
      { name: 'data-format-number', type: 'formatting', href: '/docs/attributes/data-format-number/', description: 'Locale-aware number formatting via Intl.NumberFormat' },
      { name: 'data-format-date', type: 'formatting', href: '/docs/attributes/data-format-date/', description: 'Locale-aware date and relative time formatting' },
      { name: 'data-format-bytes', type: 'formatting', href: '/docs/attributes/data-format-bytes/', description: 'Human-readable file size formatting' },
      { name: 'data-ticker', type: 'behavior', href: '/docs/attributes/data-ticker/', description: 'Animated number count-up on scroll' },
    ],
  },
  clipboard: {
    label: 'Clipboard & Selection',
    items: [
      { name: 'data-copy', type: 'behavior', href: '/docs/attributes/data-copy/', description: 'Copy text to clipboard on click with visual feedback' },
      { name: 'data-select-all', type: 'behavior', href: '/docs/attributes/data-select-all/', description: 'Master checkbox for bulk selection' },
    ],
  },
  'text-effects': {
    label: 'Text Effects',
    items: [
      { name: 'data-text-effects', type: 'behavior', href: '/docs/attributes/data-text-effects/', description: 'Gradient, shimmer, glitch, reveal, highlight, typewriter, and scramble effects' },
    ],
  },
  interaction: {
    label: 'Interaction',
    items: [
      { name: 'data-hotkey', type: 'behavior', href: '/docs/attributes/data-hotkey/', description: 'Platform-aware keyboard shortcut display' },
      { name: 'data-spoiler', type: 'behavior', href: '/docs/attributes/data-spoiler/', description: 'Content concealment with blur, solid, or noise effects' },
      { name: 'data-animate-image', type: 'behavior', href: '/docs/attributes/data-animate-image/', description: 'Play/pause control for animated GIF, WebP, and APNG images' },
      { name: 'data-splitter', type: 'behavior', href: '/docs/attributes/data-splitter/', description: 'Resizable drag divider between panels with keyboard support' },
    ],
  },
  'form-controls': {
    label: 'Form Controls',
    items: [
      { name: 'data-switch', type: 'behavior', href: '/docs/attributes/data-switch/', description: 'Transform a checkbox into a sliding toggle switch with size variants' },
      { name: 'data-range', type: 'behavior', href: '/docs/attributes/data-range/', description: 'Cross-browser styled range slider with value bubble and tick markers' },
      { name: 'data-stepper', type: 'behavior', href: '/docs/attributes/data-stepper/', description: 'Custom increment and decrement buttons for number inputs' },
      { name: 'data-color', type: 'behavior', href: '/docs/attributes/data-color/', description: 'Styled color swatch with hex display for color inputs' },
      { name: 'data-mask', type: 'behavior', href: '/docs/attributes/data-mask/', description: 'Input masking for phone, credit card, date, and custom patterns' },
      { name: 'data-upload', type: 'behavior', href: '/docs/attributes/data-upload/', description: 'Drag-and-drop file upload zone with file list display' },
      { name: 'data-toggle-tags', type: 'behavior', href: '/docs/attributes/data-toggle-tags/', description: 'Checkbox pill chips for tag-based multi-select filtering' },
      { name: 'data-strength', type: 'behavior', href: '/docs/attributes/data-strength/', description: 'Real-time password strength meter with configurable rules' },
    ],
  },
  'form-behavior': {
    label: 'Form Behavior',
    items: [
      { name: 'data-count', type: 'behavior', href: '/docs/attributes/data-count/', description: 'Live character or word count for textareas with threshold warnings' },
      { name: 'data-grow', type: 'behavior', href: '/docs/attributes/data-grow/', description: 'Auto-expanding textarea using CSS field-sizing with JS fallback' },
      { name: 'data-show-when', type: 'behavior', href: '/docs/attributes/data-show-when/', description: 'Conditionally show or hide form sections based on field values' },
      { name: 'data-autosave', type: 'behavior', href: '/docs/attributes/data-autosave/', description: 'Persist form drafts to localStorage with auto-restore on reload' },
      { name: 'data-wizard', type: 'behavior', href: '/docs/attributes/data-wizard/', description: 'Multi-step form wizard with per-step validation and progress tracking' },
    ],
  },
  infrastructure: {
    label: 'Infrastructure',
    items: [
      { name: 'hide-until-ready', type: 'layout', href: '/docs/attributes/hide-until-ready/', description: 'Prevent FOUC by hiding elements until custom elements are defined' },
      { name: 'view-transitions', type: 'layout', href: '/docs/attributes/view-transitions/', description: 'CSS View Transitions with named groups, shared elements, and presets' },
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
  layoutCount: dataItems.filter(i => i.type === 'layout').length,
  behaviorCount: dataItems.filter(i => i.type === 'behavior').length,
  formattingCount: dataItems.filter(i => i.type === 'formatting').length,
  dataCount: dataItems.length,
  totalCount: allItems.length,
};
