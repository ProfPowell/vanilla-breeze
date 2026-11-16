/**
 * social-links: a row of profile links
 *
 * Cook writes a plain <ul> of links inside this element at build time, so it
 * does not render or fetch anything. The element exists so the styles,
 * variants and manifest entry have a home; the CSS draws the icons.
 *
 * @attr {string} services - Comma-separated service ids to show (default: all visible accounts; read by Cook at build time)
 * @attr {string} variant  - Visual variant: "icon", "label", "icon-label" (default: "icon-label")
 * @attr {boolean} color   - Present = brand colours on the icons only
 *
 * @example
 * <social-links variant="icon-label"><ul><li><a href="https://bsky.app/profile/example.bsky.social"><span class="social-icon" data-service="bluesky" aria-hidden="true"></span><span>Bluesky</span></a></li></ul></social-links>
 */

import { registerComponent } from '../../lib/bundle-registry.js';

class SocialLinks extends HTMLElement {
  static observedAttributes = ['services', 'variant', 'color'];
}

registerComponent('social-links', /** @type {typeof HTMLElement} */ (/** @type {unknown} */ (SocialLinks)));

export { SocialLinks };
