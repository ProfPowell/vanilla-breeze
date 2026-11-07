/**
 * Scramble effect — text decode animation.
 * Characters resolve left-to-right with random character fill.
 *
 * Grapheme-safe and accessible: the text is split with the shared splitter
 * (inline markup kept, Intl.Segmenter graphemes), the scrambling copy is
 * aria-hidden and assistive technology reads the real text once.
 *
 * Custom properties: --vb-scramble-duration (default 1500ms),
 * --vb-scramble-speed (frame interval, default 30ms), --vb-scramble-chars
 * (fill characters; quotes around the value are optional).
 */

import { VB } from '../lib/vb.js'
import { splitText, unsplit, graphemes } from '../lib/split-text.js'

const INIT = 'data-effect-scramble-init'
const DEFAULT_CHARS = '!<>-_\\/[]{}=+*^?#'

/** Fill characters from --vb-scramble-chars, without CSS string quotes. */
function charset(host) {
  let raw = VB.params(host).get('scramble-chars')
  const quoted = /^(['"])(.*)\1$/.exec(raw)
  if (quoted) raw = quoted[2]
  const list = graphemes(raw)
  return list.length ? list : graphemes(DEFAULT_CHARS)
}

const pick = (list) => list[Math.floor(Math.random() * list.length)]

VB.effect('scramble', (el) => {
  const host = /** @type {HTMLElement} */ (el)
  unsplit(host)
  host.removeAttribute(INIT)

  if (VB.prefersReducedMotion()) return { cleanup() {} }

  const chars = splitText(host, { unit: 'grapheme', className: 'vb-scramble-char' })
  const targets = chars.map((c) => c.textContent || '')
  /** Indices of the non-space graphemes, in reading order. */
  const letters = chars.flatMap((c, i) => (c.hasAttribute('data-space') ? [] : [i]))
  host.setAttribute(INIT, '')

  let timer = 0
  const stop = () => { clearTimeout(timer); timer = 0 }
  const settle = () => chars.forEach((c, i) => { c.textContent = targets[i] })

  function run() {
    stop()
    const params = VB.params(host)
    const duration = params.getTime('scramble-duration', 1500)
    const speed = Math.max(1, params.getTime('scramble-speed', 30))
    const fill = charset(host)
    const total = Math.max(1, Math.ceil(duration / speed))
    let frame = 0

    const tick = () => {
      const resolved = Math.floor((frame / total) * letters.length)
      letters.forEach((idx, i) => {
        chars[idx].textContent = i < resolved ? targets[idx] : pick(fill)
      })
      frame++
      if (frame <= total) timer = window.setTimeout(tick, speed)
      else settle()
    }
    tick()
  }

  return {
    // Re-activation restarts the one decode instead of running two.
    activate() { run() },
    cleanup() {
      stop()
      unsplit(host)
      host.removeAttribute(INIT)
    },
  }
})
