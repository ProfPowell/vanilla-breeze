/**
 * Blur-reveal effect — word-by-word or line-by-line blur-to-clear reveal.
 * Same splitting as reveal (shared accessible splitter, inline markup kept,
 * class="line" re-measured on resize); chunks start blurred instead of
 * offset.
 *
 * Custom property: --vb-blur-reveal-delay (stagger step, default 80ms).
 */

import { VB } from '../lib/vb.js'
import { splitText, unsplit, assignLines } from '../lib/split-text.js'

const INIT = 'data-effect-blur-reveal-init'

VB.effect('blur-reveal', (el) => {
  const host = /** @type {HTMLElement} */ (el)
  unsplit(host)
  host.removeAttribute(INIT)

  if (VB.prefersReducedMotion()) return { cleanup() {} }

  host.style.setProperty('--blur-delay', VB.params(host).get('blur-reveal-delay') || '80ms')

  const chunks = splitText(host, { className: 'vb-blur-chunk' })
  chunks.forEach((c, i) => c.style.setProperty('--i', String(i)))
  host.setAttribute(INIT, '')

  /** @type {ResizeObserver | null} */
  let ro = null
  if (host.classList.contains('line')) {
    assignLines(chunks)
    let width = host.clientWidth
    ro = new ResizeObserver(() => {
      if (host.clientWidth === width) return
      width = host.clientWidth
      assignLines(chunks)
    })
    ro.observe(host)
  }

  return {
    activate() { host.setAttribute('data-effect-active', '') },
    cleanup() {
      ro?.disconnect()
      unsplit(host)
      host.removeAttribute(INIT)
      host.style.removeProperty('--blur-delay')
    },
  }
})
