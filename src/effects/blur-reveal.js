/**
 * Blur-reveal effect — word-by-word or line-by-line blur-to-clear reveal.
 * Similar to reveal but words start blurred and transition to clear.
 */

import { VB } from '../lib/vb.js'

function splitIntoWords(el) {
  const text = el.textContent
  el.setAttribute('aria-label', text)
  el.innerHTML = ''

  const words = text.split(/(\s+)/)
  words.forEach((word, i) => {
    if (/^\s+$/.test(word)) {
      el.appendChild(document.createTextNode(word))
      return
    }
    const span = document.createElement('span')
    span.className = 'vb-blur-chunk'
    span.textContent = word
    span.style.setProperty('--i', String(Math.floor(i / 2)))
    span.setAttribute('aria-hidden', 'true')
    el.appendChild(span)
  })
}

function splitIntoLines(el) {
  const text = el.textContent
  el.setAttribute('aria-label', text)

  const words = text.split(/\s+/).filter(Boolean)
  const lines = []
  let currentLine = ''
  const elWidth = el.offsetWidth

  const temp = document.createElement('span')
  temp.style.visibility = 'hidden'
  temp.style.position = 'absolute'
  temp.style.font = getComputedStyle(el).font
  document.body.appendChild(temp)

  words.forEach((word) => {
    const test = currentLine ? currentLine + ' ' + word : word
    temp.textContent = test
    if (temp.offsetWidth > elWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = test
    }
  })
  if (currentLine) lines.push(currentLine)
  document.body.removeChild(temp)

  if (lines.length === 0) lines.push(text)

  el.innerHTML = ''
  lines.forEach((line, i) => {
    const span = document.createElement('span')
    span.className = 'vb-blur-chunk'
    span.textContent = line
    span.style.setProperty('--i', String(i))
    span.setAttribute('aria-hidden', 'true')
    el.appendChild(span)
    if (i < lines.length - 1) el.appendChild(document.createTextNode(' '))
  })
}

VB.effect('blur-reveal', (el) => {
  if (el.hasAttribute('data-effect-blur-reveal-init')) return
  el.setAttribute('data-effect-blur-reveal-init', '')

  if (VB.prefersReducedMotion()) return

  const mode = el.classList.contains('line') ? 'line' : 'word'
  const delay = VB.params(el).get('blur-reveal-delay') || '80ms'

  el.style.setProperty('--blur-delay', delay)

  if (mode === 'line') {
    splitIntoLines(el)
  } else {
    splitIntoWords(el)
  }

  return {
    activate() { el.setAttribute('data-effect-active', '') },
    cleanup() {},
  }
})
