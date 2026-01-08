const inertElements = [
  'layout-text',
  'media-frame',
  'layout-reel'
];

inertElements.forEach(name => {
  if (!customElements.get(name)) {
    customElements.define(name, class extends HTMLElement {});
  }
});
