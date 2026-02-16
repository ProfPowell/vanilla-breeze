const attributes = {
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

const allItems = Object.values(attributes).flatMap(cat => cat.items);

export default {
  categories: attributes,
  layoutCount: allItems.filter(i => i.type === 'layout').length,
  behaviorCount: allItems.filter(i => i.type === 'behavior').length,
  formattingCount: allItems.filter(i => i.type === 'formatting').length,
  totalCount: allItems.length,
};
