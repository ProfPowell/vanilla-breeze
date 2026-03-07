/**
 * Glitch effect — copies textContent to data-glitch-text for CSS pseudo-elements.
 * CSS handles the chromatic aberration animation.
 */

import { VB } from '../lib/vb.js'

VB.effect('glitch', (el) => {
  if (el.hasAttribute('data-effect-glitch-init')) return
  el.setAttribute('data-effect-glitch-init', '')
  el.setAttribute('data-glitch-text', el.textContent)
})
