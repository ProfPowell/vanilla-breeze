/**
 * Flipboard effect — split-flap departure board display.
 * Migrated from retro.effects.js to VB.effect() API.
 */

import { VB } from '../../../lib/vb.js'

const FLAP_CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:!?/-'
const FLIP_MS = 60
const DWELL_MS = 30
const STAGGER_MS = 80

function createCharCell() {
  const cell = document.createElement('span')
  cell.className = 'vb-flap-char'
  cell.innerHTML = `
    <span class="vb-flap-top"><span class="vb-flap-text">\u00A0</span></span>
    <span class="vb-flap-bottom"><span class="vb-flap-text">\u00A0</span></span>
    <span class="vb-flap-flip-top"><span class="vb-flap-text">\u00A0</span></span>
    <span class="vb-flap-flip-bottom"><span class="vb-flap-text">\u00A0</span></span>
    <span class="vb-flap-hinge"></span>
  `
  return cell
}

function setCharImmediate(cell, ch) {
  for (const el of cell.querySelectorAll('.vb-flap-text')) {
    el.textContent = ch || '\u00A0'
  }
}

function flipChar(cell, from, to) {
  return new Promise(resolve => {
    const topHalf = cell.querySelector('.vb-flap-top .vb-flap-text')
    const bottomHalf = cell.querySelector('.vb-flap-bottom .vb-flap-text')
    const flipTop = cell.querySelector('.vb-flap-flip-top')
    const flipTopText = flipTop.querySelector('.vb-flap-text')
    const flipBottom = cell.querySelector('.vb-flap-flip-bottom')
    const flipBottomText = flipBottom.querySelector('.vb-flap-text')

    topHalf.textContent = from || '\u00A0'
    bottomHalf.textContent = from || '\u00A0'
    flipTopText.textContent = from || '\u00A0'
    flipBottomText.textContent = to || '\u00A0'

    flipTop.classList.add('vb-flap-flipping')
    flipBottom.classList.add('vb-flap-flipping')

    setTimeout(() => { topHalf.textContent = to || '\u00A0' }, FLIP_MS / 2)

    setTimeout(() => {
      bottomHalf.textContent = to || '\u00A0'
      flipTop.classList.remove('vb-flap-flipping')
      flipBottom.classList.remove('vb-flap-flipping')
      resolve()
    }, FLIP_MS)
  })
}

async function cycleChar(cell, targetChar, totalFlips, generation, el) {
  let currentIdx = 0
  for (let f = 0; f < totalFlips; f++) {
    if (el._flipGeneration !== generation) return
    const isLast = f === totalFlips - 1
    const from = FLAP_CHARS[currentIdx % FLAP_CHARS.length]
    const to = isLast ? targetChar : FLAP_CHARS[(currentIdx + 1) % FLAP_CHARS.length]
    await flipChar(cell, from, to)
    currentIdx++
    if (!isLast) await new Promise(r => setTimeout(r, DWELL_MS))
  }
}

function buildBoard(el, text) {
  const generation = (el._flipGeneration || 0) + 1
  el._flipGeneration = generation

  while (el.firstChild) el.removeChild(el.firstChild)
  el.classList.add('vb-flap-board')

  const cells = []
  for (let i = 0; i < text.length; i++) {
    const cell = createCharCell()
    el.appendChild(cell)
    cells.push(cell)
  }
  el._flipboardCells = cells

  return { cells, generation }
}

async function runFlipSequence(el, text, cells, generation) {
  const promises = cells.map((cell, i) => {
    return new Promise(resolve => {
      setTimeout(() => {
        if (el._flipGeneration !== generation) { resolve(); return }
        const flips = 4 + Math.floor(Math.random() * 7)
        cycleChar(cell, text[i], flips, generation, el).then(resolve)
      }, i * STAGGER_MS)
    })
  })

  await Promise.all(promises)

  if (el._flipGeneration === generation) {
    cells.forEach((cell, i) => setCharImmediate(cell, text[i]))
  }
}

VB.effect('flipboard', (el) => {
  const text = (el.textContent || '').trim().toUpperCase()
  if (!text) return

  el._flipboardOriginal = text

  if (VB.prefersReducedMotion()) {
    const { cells } = buildBoard(el, text)
    cells.forEach((cell, i) => setCharImmediate(cell, text[i]))
    return
  }

  const { cells, generation } = buildBoard(el, text)
  runFlipSequence(el, text, cells, generation)

  return {
    cleanup() {
      el._flipGeneration = (el._flipGeneration || 0) + 1
      if (el._flipboardOriginal) {
        el.textContent = el._flipboardOriginal
        el.classList.remove('vb-flap-board')
      }
    },
  }
})

// Stamp filter injector — also migrated to VB.effect
VB.effect('stamp', (el) => {
  if (document.getElementById('vb-stamp-noise')) return

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
  svg.innerHTML = `
    <defs>
      <filter id="vb-stamp-noise" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" result="noise"/>
        <feColorMatrix type="saturate" values="0" in="noise" result="greyNoise"/>
        <feComposite in="SourceGraphic" in2="greyNoise" operator="in"/>
      </filter>
    </defs>
  `
  document.body.prepend(svg)
})

export function replayFlipboard(el) {
  if (!el._flipboardOriginal) return
  const text = el._flipboardOriginal
  const { cells, generation } = buildBoard(el, text)
  runFlipSequence(el, text, cells, generation)
}
