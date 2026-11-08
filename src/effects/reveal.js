/**
 * Reveal effect — word-by-word or line-by-line text reveal.
 *
 * Splits the text nodes into word chunks (inline markup such as links is
 * kept) with the shared accessible splitter: the full text stays readable
 * to assistive technology once, the animated chunks are aria-hidden.
 * class="line" staggers by rendered line instead of by word; the lines are
 * re-measured when the element's width changes.
 *
 * Custom properties: --vb-reveal-delay (stagger step, default 80ms),
 * --vb-reveal-duration (per-chunk transition, default 400ms).
 */

import { VB } from '../lib/vb.js'
import { splitText, unsplit, assignLines } from '../lib/split-text.js'

const INIT = 'data-effect-reveal-init'

VB.effect('reveal', (el) => {
  const host = /** @type {HTMLElement} */ (el)
  // A clone of a split element carries the old split and init marker.
  unsplit(host)
  host.removeAttribute(INIT)

  if (VB.prefersReducedMotion()) return { cleanup() {} }

  const params = VB.params(host)
  host.style.setProperty('--reveal-delay', params.get('reveal-delay') || '80ms')
  host.style.setProperty('--reveal-duration', params.get('reveal-duration') || '400ms')

  const chunks = splitText(host, { className: 'vb-reveal-chunk' })
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
      host.style.removeProperty('--reveal-delay')
      host.style.removeProperty('--reveal-duration')
    },
  }
})
