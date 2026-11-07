/**
 * Glitch effect — copies the text to data-glitch-text for the CSS
 * pseudo-elements that draw the two colour channels. CSS handles the
 * chromatic aberration animation; the pseudo-element content carries empty
 * alternative text (`content: attr(…) / ""`), so the accessible name is the
 * element's own text, read once.
 */

import { VB } from '../lib/vb.js'

const INIT = 'data-effect-glitch-init'

VB.effect('glitch', (el) => {
  el.setAttribute('data-glitch-text', (el.textContent || '').trim())
  el.setAttribute(INIT, '')
  return {
    cleanup() {
      el.removeAttribute(INIT)
      el.removeAttribute('data-glitch-text')
    },
  }
})
