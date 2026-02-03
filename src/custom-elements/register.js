const inertElements = [
  'layout-text',
  'layout-reel',
  'dl-item'
];

inertElements.forEach(name => {
  if (!customElements.get(name)) {
    customElements.define(name, class extends HTMLElement {});
  }
});
