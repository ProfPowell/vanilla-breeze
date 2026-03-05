/**
 * Retro Bundle — JS Effects
 * Vanilla Breeze · Retro / CRT
 */

import { registerEffect } from '../../lib/bundle-registry.js'

// ─── Split-flap departure board ─────────────────────────────────────────────
// Visual split-flap display (Solari board). Each character sits in a dark cell
// with a horizontal hinge line. Characters cycle through flap-flip animations
// before settling on the target letter.

const FLAP_CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:!?/-'
const FLIP_MS = 60       // Duration of one flip (CSS transition)
const DWELL_MS = 30      // Pause between flips
const STAGGER_MS = 80    // Delay per character position (left-to-right reveal)

/**
 * Build the DOM for a single character cell.
 * Structure:
 *   .vb-flap-char
 *     .vb-flap-top        (top half — shows current char)
 *     .vb-flap-bottom     (bottom half — shows current char)
 *     .vb-flap-flip-top   (animating flap — top half falling away)
 *     .vb-flap-flip-bottom (animating flap — bottom half revealing)
 *     .vb-flap-hinge      (decorative center line)
 */
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

    // Static halves show old char; flip panels animate the transition
    topHalf.textContent = from || '\u00A0'
    bottomHalf.textContent = from || '\u00A0'
    flipTopText.textContent = from || '\u00A0'
    flipBottomText.textContent = to || '\u00A0'

    // Trigger the flip animation
    flipTop.classList.add('vb-flap-flipping')
    flipBottom.classList.add('vb-flap-flipping')

    // Halfway: update the static top to show new char (old flap has fallen away)
    setTimeout(() => {
      topHalf.textContent = to || '\u00A0'
    }, FLIP_MS / 2)

    // End: update bottom, remove animation classes
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
    // Abort if a newer animation has started
    if (el._flipGeneration !== generation) return
    const isLast = f === totalFlips - 1
    const from = FLAP_CHARS[currentIdx % FLAP_CHARS.length]
    const to = isLast ? targetChar : FLAP_CHARS[(currentIdx + 1) % FLAP_CHARS.length]
    await flipChar(cell, from, to)
    currentIdx++
    if (!isLast) {
      await new Promise(r => setTimeout(r, DWELL_MS))
    }
  }
}

function buildBoard(el, text) {
  // Bump generation to invalidate any in-progress animation
  const generation = (el._flipGeneration || 0) + 1
  el._flipGeneration = generation

  // Clear and rebuild cell DOM
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

  // Ensure final state is correct (only if we're still the active generation)
  if (el._flipGeneration === generation) {
    cells.forEach((cell, i) => setCharImmediate(cell, text[i]))
  }
}

function initFlipboard(el) {
  const text = (el.textContent || '').trim().toUpperCase()
  if (!text) return

  el._flipboardOriginal = text
  const { cells, generation } = buildBoard(el, text)
  runFlipSequence(el, text, cells, generation)
}

function destroyFlipboard(el) {
  el._flipGeneration = (el._flipGeneration || 0) + 1
  if (el._flipboardOriginal) {
    el.textContent = el._flipboardOriginal
    el.classList.remove('vb-flap-board')
  }
}

registerEffect('flipboard', {
  selector: '[data-flipboard]',
  init: initFlipboard,
  destroy: destroyFlipboard,
  reducedMotionFallback(el) {
    const text = (el.textContent || '').trim().toUpperCase()
    if (!text) return
    el._flipboardOriginal = text
    const { cells } = buildBoard(el, text)
    cells.forEach((cell, i) => setCharImmediate(cell, text[i]))
  },
})

// ─── Stamp filter injector ───────────────────────────────────────────────────
// Auto-injects the SVG noise filter needed by the data-stamp CSS effect.

registerEffect('stamp-filter', {
  selector: '[data-stamp]',
  init() {
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
  },
})

// ─── Export replay helper for external use ───────────────────────────────────
export function replayFlipboard(el) {
  if (!el._flipboardOriginal) return
  const text = el._flipboardOriginal
  const { cells, generation } = buildBoard(el, text)
  runFlipSequence(el, text, cells, generation)
}
