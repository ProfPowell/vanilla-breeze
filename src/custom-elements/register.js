const inertElements = [
  'x-stack',
  'x-card',
  'x-grid',
  'x-cluster',
  'x-prose',
  'x-center',
  'x-sidebar'
];

inertElements.forEach(name => {
  if (!customElements.get(name)) {
    customElements.define(name, class extends HTMLElement {});
  }
});
