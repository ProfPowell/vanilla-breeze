/**
 * Inert definitions for VB's CSS-only custom elements.
 *
 * These tags have styles but no behaviour. Defining them (with an empty
 * class) makes them match :defined, so they behave like every other element
 * for rules that key off definition:
 *   - [hide-until-ready]:not(:defined) would otherwise hide them forever
 *   - reset.css suppresses transitions/animations on :not(:defined)
 *
 * One entry per directory in src/custom-elements/ that has no JS definition.
 * form-field (src/web-components/form-field/) and mobile-menu
 * (custom-elements/mobile-menu/logic.js) define themselves and must not be
 * listed — an inert definition would block the real one.
 * tests/unit/inert-custom-elements.test.js keeps this list in sync.
 */
export const INERT_ELEMENTS = [
  'calendar-event',
  'chat-bubble',
  'chat-message',
  'chat-thread',
  'dl-item',
  'fab-stack',
  'hour-view',
  'layout-badge',
  'layout-canvas',
  'layout-card',
  'layout-center',
  'layout-cluster',
  'layout-columns',
  'layout-cover',
  'layout-grid',
  'layout-imposter',
  'layout-reel',
  'layout-sidebar',
  'layout-stack',
  'layout-switcher',
  'layout-text',
  'loading-spinner',
  'semantic-card',
  'site-legal',
  'site-tools',
  'status-message',
  'text-divider',
  'token-swatch',
  'user-avatar',
];

for (const name of INERT_ELEMENTS) {
  if (!customElements.get(name)) {
    customElements.define(name, class extends HTMLElement {});
  }
}
