/**
 * Scramble effect — text decode animation.
 * Characters resolve left-to-right with random character fill.
 */

import { VB } from '../lib/vb.js'

const DEFAULT_CHARS = '!<>-_\\/[]{}=+*^?#'

function randomChar(chars) {
  return chars[Math.floor(Math.random() * chars.length)]
}

function runScramble(el) {
  const text = el.getAttribute('data-scramble-text')
  const params = VB.params(el)
  const duration = params.getNumber('scramble-duration', 1500)
  const chars = params.get('scramble-chars') || DEFAULT_CHARS
  const speed = params.getNumber('scramble-speed', 30)

  const length = text.length
  let frame = 0
  const totalFrames = Math.ceil(duration / speed)

  function step() {
    const progress = frame / totalFrames
    const resolved = Math.floor(progress * length)
    let output = ''

    for (let i = 0; i < length; i++) {
      if (i < resolved) {
        output += text[i]
      } else if (text[i] === ' ') {
        output += ' '
      } else {
        output += randomChar(chars)
      }
    }

    el.textContent = output
    frame++

    if (frame <= totalFrames) {
      setTimeout(step, speed)
    } else {
      el.textContent = text
    }
  }

  step()
}

VB.effect('scramble', (el) => {
  if (el.hasAttribute('data-effect-scramble-init')) return
  el.setAttribute('data-effect-scramble-init', '')

  const text = el.textContent.trim()
  el.setAttribute('data-scramble-text', text)
  el.setAttribute('aria-label', text)

  if (VB.prefersReducedMotion()) return

  const chars = VB.params(el).get('scramble-chars') || DEFAULT_CHARS
  el.textContent = text.replace(/\S/g, () => randomChar(chars))

  return {
    activate() { runScramble(el) },
    cleanup() {},
  }
})
