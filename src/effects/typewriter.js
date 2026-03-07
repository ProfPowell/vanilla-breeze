/**
 * Typewriter effect — character-by-character typing animation.
 * Optional cursor blink and looping.
 */

import { VB } from '../lib/vb.js'

function typeText(el, text, speed, onDone) {
  let i = 0
  function step() {
    if (i <= text.length) {
      el.firstChild.textContent = text.slice(0, i)
      i++
      setTimeout(step, speed)
    } else if (onDone) {
      onDone()
    }
  }
  step()
}

function deleteText(el, speed, onDone) {
  const text = el.firstChild.textContent
  let i = text.length
  function step() {
    if (i >= 0) {
      el.firstChild.textContent = text.slice(0, i)
      i--
      setTimeout(step, speed / 2)
    } else if (onDone) {
      onDone()
    }
  }
  step()
}

function startTypewriter(el) {
  const text = el.getAttribute('data-typewriter-text')
  const params = VB.params(el)
  const speed = params.getNumber('typewriter-speed', 50)
  const initialDelay = params.getNumber('typewriter-delay', 0)
  const isLooping = el.classList.contains('loop')
  const loopPause = isLooping ? 2000 : null

  el.textContent = ''
  const textNode = document.createTextNode('')
  el.appendChild(textNode)

  const showCursor = !el.classList.contains('no-cursor')
  if (showCursor) {
    const cursor = document.createElement('span')
    cursor.className = 'vb-typewriter-cursor'
    cursor.textContent = '|'
    cursor.setAttribute('aria-hidden', 'true')
    el.appendChild(cursor)
  }

  function runCycle() {
    typeText(el, text, speed, () => {
      if (loopPause !== null) {
        setTimeout(() => {
          deleteText(el, speed, () => {
            setTimeout(runCycle, 400)
          })
        }, loopPause)
      }
    })
  }

  setTimeout(runCycle, initialDelay)
}

VB.effect('typewriter', (el) => {
  if (el.hasAttribute('data-effect-typewriter-init')) return
  el.setAttribute('data-effect-typewriter-init', '')

  const text = el.textContent.trim()
  el.setAttribute('data-typewriter-text', text)
  el.setAttribute('aria-label', text)

  if (VB.prefersReducedMotion()) return

  el.textContent = ''

  return {
    activate() { startTypewriter(el) },
    cleanup() {},
  }
})
