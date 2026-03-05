const inertElements = [
  'layout-text',
  'layout-reel',
  'layout-canvas',
  'dl-item'
];

inertElements.forEach(name => {
  if (!customElements.get(name)) {
    customElements.define(name, class extends HTMLElement {});
  }
});
