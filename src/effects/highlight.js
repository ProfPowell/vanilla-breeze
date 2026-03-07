/**
 * Highlight effect — sets --highlight-color from CSS custom property.
 * Activation (scroll/hover/click) handled by trigger system.
 * CSS transitions handle the draw-in animation via [data-effect-active].
 */

import { VB } from '../lib/vb.js'

VB.effect('highlight', (el) => {
  if (el.hasAttribute('data-effect-highlight-init')) return
  el.setAttribute('data-effect-highlight-init', '')

  const style = getComputedStyle(el)
  const color = style.getPropertyValue('--vb-highlight-color').trim()
  if (color) {
    el.style.setProperty('--highlight-color', color)
  }

  if (VB.prefersReducedMotion()) {
    el.setAttribute('data-effect-active', '')
  }

  return {
    activate() { el.setAttribute('data-effect-active', '') },
    cleanup() {},
  }
})
