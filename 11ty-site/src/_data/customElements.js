const all = [
  { name: 'layout-center', href: '/docs/elements/custom-elements/center/', desc: 'Horizontally centers content with max-width' },
  { name: 'layout-cluster', href: '/docs/elements/custom-elements/cluster/', desc: 'Flexible inline grouping of items' },
  { name: 'layout-cover', href: '/docs/elements/custom-elements/cover/', desc: 'Vertically centers primary content' },
  { name: 'layout-grid', href: '/docs/elements/custom-elements/grid/', desc: 'Responsive auto-fit grid layout' },
  { name: 'layout-imposter', href: '/docs/elements/custom-elements/imposter/', desc: 'Overlay positioned content' },
  { name: 'layout-reel', href: '/docs/elements/custom-elements/reel/', desc: 'Horizontal scrolling container' },
  { name: 'layout-sidebar', href: '/docs/elements/custom-elements/sidebar/', desc: 'Two-column sidebar layout' },
  { name: 'layout-stack', href: '/docs/elements/custom-elements/stack/', desc: 'Vertical stacking with consistent spacing' },
  { name: 'layout-switcher', href: '/docs/elements/custom-elements/switcher/', desc: 'Responsive row/column switching' },
  { name: 'layout-text', href: '/docs/elements/custom-elements/layout-text/', desc: 'Readable text measure container' },
  { name: 'layout-badge', href: '/docs/elements/custom-elements/layout-badge/', desc: 'Badge/tag component' },
  { name: 'layout-card', href: '/docs/elements/custom-elements/layout-card/', desc: 'Card component with sections' },
  { name: 'brand-mark', href: '/docs/elements/custom-elements/brand-mark/', desc: 'Brand/logo display element' },
  { name: 'dl-item', href: '/docs/elements/custom-elements/dl-item/', desc: 'Groups a dt/dd pair within a description list' },
  { name: 'form-field', href: '/docs/elements/custom-elements/form-field/', desc: 'Form field wrapper with label and errors' },
  { name: 'loading-spinner', href: '/docs/elements/custom-elements/loading-spinner/', desc: 'CSS-only loading spinner for async operations' },
  { name: 'progress-ring', href: '/docs/elements/custom-elements/progress-ring/', desc: 'CSS-only circular progress indicator' },
  { name: 'semantic-card', href: '/docs/elements/custom-elements/semantic-card/', desc: 'Card with header/content/footer grid areas' },
  { name: 'status-message', href: '/docs/elements/custom-elements/status-message/', desc: 'Status feedback messages' },
  { name: 'text-divider', href: '/docs/elements/custom-elements/text-divider/', desc: 'Horizontal divider with centered text' },
  { name: 'user-avatar', href: '/docs/elements/custom-elements/user-avatar/', desc: 'User avatar display' },
];

export default {
  all,
  layoutPrimitives: all.filter(e => e.name.startsWith('layout-')),
  uiElements: all.filter(e => !e.name.startsWith('layout-')),
};
