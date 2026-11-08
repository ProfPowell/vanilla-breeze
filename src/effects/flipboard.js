/**
 * Flipboard effect — split-flap departure board display.
 *
 * Accessible: the board's cells are aria-hidden and the original text is
 * kept once in a visually hidden copy (shared splitter), so a screen reader
 * reads "Gate 42", not every flap four times. Cells are grapheme clusters
 * (Intl.Segmenter), so emoji and accented letters never split.
 *
 * Lifecycle: per-element state lives in a WeakMap. cleanup() cancels the
 * running flips and restores the original text (original case), so a
 * removed + re-inserted or cloned board rebuilds from the real text.
 *
 * Custom property: --vb-flip-ms — one flip, a number of milliseconds or a
 * CSS time (default 60). JS timing and the CSS flip animation both follow it.
 */

import { VB } from '../lib/vb.js'
import { replaceWithVisual, unsplit, plainText, graphemes } from '../lib/split-text.js'

const INIT = 'data-effect-flipboard-init'
const FLAP_CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:!?/-'
const DEFAULT_FLIP_MS = 60
const DWELL_MS = 30
const STAGGER_MS = 80
const NBSP = ' '

/**
 * @typedef {object} Board
 * @property {string} original  authored text (restored on cleanup)
 * @property {string[]} chars   upper-cased graphemes, one per cell
 * @property {number} generation  bumped to cancel a running sequence
 * @property {Set<number>} timers
 */

/** @type {WeakMap<Element, Board>} */
const boards = new WeakMap()

function createCharCell() {
  const cell = document.createElement('span')
  cell.className = 'vb-flap-char'
  for (const part of ['top', 'bottom', 'flip-top', 'flip-bottom']) {
    const half = document.createElement('span')
    half.className = `vb-flap-${part}`
    const text = document.createElement('span')
    text.className = 'vb-flap-text'
    text.textContent = NBSP
    half.append(text)
    cell.append(half)
  }
  const hinge = document.createElement('span')
  hinge.className = 'vb-flap-hinge'
  cell.append(hinge)
  return cell
}

function setCharImmediate(cell, ch) {
  for (const el of cell.querySelectorAll('.vb-flap-text')) el.textContent = ch || NBSP
}

/** setTimeout tracked on the board so cleanup can cancel it. */
function wait(board, ms) {
  return new Promise((resolve) => {
    const id = window.setTimeout(() => { board.timers.delete(id); resolve(undefined) }, ms)
    board.timers.add(id)
  })
}

async function flipChar(board, cell, from, to, flipMs) {
  const topHalf = cell.querySelector('.vb-flap-top .vb-flap-text')
  const bottomHalf = cell.querySelector('.vb-flap-bottom .vb-flap-text')
  const flipTop = cell.querySelector('.vb-flap-flip-top')
  const flipBottom = cell.querySelector('.vb-flap-flip-bottom')

  topHalf.textContent = from || NBSP
  bottomHalf.textContent = from || NBSP
  flipTop.querySelector('.vb-flap-text').textContent = from || NBSP
  flipBottom.querySelector('.vb-flap-text').textContent = to || NBSP
  flipTop.classList.add('vb-flap-flipping')
  flipBottom.classList.add('vb-flap-flipping')

  await wait(board, flipMs / 2)
  topHalf.textContent = to || NBSP
  await wait(board, flipMs / 2)
  bottomHalf.textContent = to || NBSP
  flipTop.classList.remove('vb-flap-flipping')
  flipBottom.classList.remove('vb-flap-flipping')
}

async function cycleChar(board, cell, target, flips, generation, flipMs) {
  for (let f = 0; f < flips; f++) {
    if (board.generation !== generation) return
    const last = f === flips - 1
    const from = FLAP_CHARS[f % FLAP_CHARS.length]
    const to = last ? target : FLAP_CHARS[(f + 1) % FLAP_CHARS.length]
    await flipChar(board, cell, from, to, flipMs)
    if (!last) await wait(board, DWELL_MS)
  }
}

function cancel(board) {
  board.generation++
  for (const id of board.timers) clearTimeout(id)
  board.timers.clear()
}

/** Build the cells (aria-hidden) beside a visually hidden copy of the text. */
function buildBoard(el, board) {
  const visual = replaceWithVisual(el, board.original)
  el.classList.add('vb-flap-board')
  return board.chars.map(() => visual.appendChild(createCharCell()))
}

function run(el, board) {
  cancel(board)
  const host = /** @type {HTMLElement} */ (el)
  const flipMs = VB.params(host).getTime('flip-ms', DEFAULT_FLIP_MS)
  host.style.setProperty('--_vb-flip-duration', `${flipMs}ms`)
  const cells = buildBoard(el, board)
  const generation = board.generation

  if (VB.prefersReducedMotion()) {
    cells.forEach((cell, i) => setCharImmediate(cell, board.chars[i]))
    return
  }

  Promise.all(cells.map(async (cell, i) => {
    await wait(board, i * STAGGER_MS)
    if (board.generation !== generation) return
    const flips = 4 + Math.floor(Math.random() * 7)
    await cycleChar(board, cell, board.chars[i], flips, generation, flipMs)
  })).then(() => {
    if (board.generation === generation) cells.forEach((cell, i) => setCharImmediate(cell, board.chars[i]))
  })
}

VB.effect('flipboard', (el) => {
  // A clone (or a board left over from another runtime copy) holds cells:
  // read the authored text back from the hidden copy, then start clean.
  const original = plainText(el).trim()
  unsplit(el)
  el.classList.remove('vb-flap-board')
  if (!original) return { cleanup() {} }

  /** @type {Board} */
  const board = {
    original,
    chars: graphemes(original.toLocaleUpperCase(el.closest('[lang]')?.getAttribute('lang') || undefined)),
    generation: 0,
    timers: new Set(),
  }
  boards.set(el, board)
  el.setAttribute(INIT, '')
  run(el, board)

  return {
    cleanup() {
      cancel(board)
      boards.delete(el)
      el.textContent = board.original
      el.classList.remove('vb-flap-board')
      el.removeAttribute(INIT)
      const host = /** @type {HTMLElement} */ (el)
      host.style.removeProperty('--_vb-flip-duration')
    },
  }
})

/** Replay the flip sequence on an enhanced board. */
export function replayFlipboard(el) {
  const board = boards.get(el)
  if (board) run(el, board)
}
