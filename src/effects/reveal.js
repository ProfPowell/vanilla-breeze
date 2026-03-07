/**
 * Reveal effect — word-by-word or line-by-line text reveal.
 * Splits text into spans with staggered delays.
 * Trigger system handles scroll/hover/click activation.
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
    span.className = 'vb-reveal-chunk'
    span.textContent = word
    span.style.setProperty('--i', String(Math.floor(i / 2)))
    span.setAttribute('aria-hidden', 'true')
    el.appendChild(span)
  })
}

function splitIntoLines(el) {
  const text = el.textContent
  el.setAttribute('aria-label', text)

  const temp = document.createElement('div')
  temp.style.cssText = getComputedStyle(el).cssText
  temp.style.position = 'absolute'
  temp.style.visibility = 'hidden'
  temp.style.whiteSpace = 'normal'
  document.body.appendChild(temp)

  const words = text.split(/\s+/).filter(Boolean)
  const lines = []
  let currentLine = ''

  words.forEach((word) => {
    const test = currentLine ? currentLine + ' ' + word : word
    temp.textContent = test
    temp.style.width = getComputedStyle(el).width
    if (temp.scrollWidth > temp.clientWidth && currentLine) {
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
    span.className = 'vb-reveal-chunk'
    span.textContent = line
    span.style.setProperty('--i', String(i))
    span.setAttribute('aria-hidden', 'true')
    el.appendChild(span)
    if (i < lines.length - 1) el.appendChild(document.createTextNode(' '))
  })
}

VB.effect('reveal', (el) => {
  if (el.hasAttribute('data-effect-reveal-init')) return
  el.setAttribute('data-effect-reveal-init', '')

  if (VB.prefersReducedMotion()) return

  const mode = el.classList.contains('line') ? 'line' : 'word'
  const params = VB.params(el)
  const delay = params.get('reveal-delay') || '80ms'
  const duration = params.get('reveal-duration') || '400ms'

  el.style.setProperty('--reveal-delay', delay)
  el.style.setProperty('--reveal-duration', duration)

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
