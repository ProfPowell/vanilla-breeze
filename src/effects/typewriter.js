/**
 * Typewriter effect — character-by-character typing animation.
 * Optional cursor (class="no-cursor" removes it) and looping (class="loop").
 *
 * The text is split into grapheme clusters with the shared accessible
 * splitter, so inline markup survives, emoji and combining marks type as
 * one character, and assistive technology reads the full text once (the
 * typed copy is aria-hidden). Typing reveals the grapheme spans in order.
 *
 * Pause (WCAG 2.2.2): while the host or an ancestor has data-paused, the
 * loop holds its place and resumes when the attribute goes away.
 *
 * Custom properties: --vb-typewriter-speed (per character, default 50ms),
 * --vb-typewriter-delay (before typing starts, default 0).
 */

import { VB } from '../lib/vb.js'
import { splitText, unsplit } from '../lib/split-text.js'

const INIT = 'data-effect-typewriter-init'
const LOOP_PAUSE = 2000
const LOOP_GAP = 400
const PAUSE_POLL = 200

VB.effect('typewriter', (el) => {
  const host = /** @type {HTMLElement} */ (el)
  unsplit(host)
  host.querySelectorAll(':scope > .vb-typewriter-cursor').forEach((c) => c.remove())
  host.removeAttribute(INIT)

  if (VB.prefersReducedMotion()) return { cleanup() {} }

  const chars = splitText(host, { unit: 'grapheme', className: 'vb-typewriter-char' })
  host.setAttribute(INIT, '')

  let timer = 0
  /** @type {HTMLSpanElement | null} */
  let cursor = null

  const stop = () => { clearTimeout(timer); timer = 0 }
  const paused = () => !!host.closest('[data-paused]')
  /** Schedule fn after ms, holding while paused. */
  const later = (fn, ms) => {
    timer = window.setTimeout(function tick() {
      if (paused()) { timer = window.setTimeout(tick, PAUSE_POLL); return }
      fn()
    }, ms)
  }
  const show = (n) => chars.forEach((c, i) => { c.hidden = i >= n })
  /** Next count to show: skip over runs of whitespace in one step. */
  const step = (n, dir) => {
    let next = n + dir
    while (next > 0 && next < chars.length && chars[next - 1].hasAttribute('data-space')) next += dir
    return next
  }

  function start() {
    stop()
    const params = VB.params(host)
    const speed = params.getTime('typewriter-speed', 50)
    const delay = params.getTime('typewriter-delay', 0)
    const loop = host.classList.contains('loop')

    if (!cursor && !host.classList.contains('no-cursor')) {
      cursor = document.createElement('span')
      cursor.className = 'vb-typewriter-cursor'
      cursor.textContent = '|'
      cursor.setAttribute('aria-hidden', 'true')
      host.append(cursor)
    }

    let n = 0
    show(0)
    const type = () => {
      if (n < chars.length) {
        n = step(n, 1)
        show(n)
        later(type, speed)
      } else if (loop) {
        later(erase, LOOP_PAUSE)
      }
    }
    const erase = () => {
      if (n > 0) {
        n = Math.max(0, step(n, -1))
        show(n)
        later(erase, speed / 2)
      } else {
        later(type, LOOP_GAP)
      }
    }
    later(type, delay)
  }

  return {
    // Re-activation (hover, click, event, vt) restarts the one loop.
    activate() { start() },
    cleanup() {
      stop()
      cursor?.remove()
      cursor = null
      unsplit(host)
      host.removeAttribute(INIT)
    },
  }
})
