/**
 * Highlight effect — sets --highlight-color from --vb-highlight-color.
 * Activation (scroll/hover/click) handled by trigger system.
 * CSS transitions handle the draw-in animation via [data-effect-active].
 */

import { VB } from '../lib/vb.js'

const INIT = 'data-effect-highlight-init'

VB.effect('highlight', (el) => {
  const host = /** @type {HTMLElement} */ (el)
  const color = VB.params(host).get('highlight-color')
  if (color) host.style.setProperty('--highlight-color', color)
  host.setAttribute(INIT, '')

  if (VB.prefersReducedMotion()) host.setAttribute('data-effect-active', '')

  return {
    activate() { host.setAttribute('data-effect-active', '') },
    cleanup() {
      host.removeAttribute(INIT)
      host.style.removeProperty('--highlight-color')
    },
  }
})
