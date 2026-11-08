/**
 * Ticker effect — animated number count-up.
 * Works on <data> elements with a value attribute.
 *
 * Custom properties: --vb-ticker-duration, --vb-ticker-start, --vb-ticker-decimals
 * (effect parameters are custom properties, like every VB effect).
 * Formatting follows data-format-number / data-currency / data-locale and the
 * nearest [lang]; the last frame equals the static data-format-number output.
 * The count is capped at 5 s and the element is aria-busy while it runs.
 */

import { VB } from '../lib/vb.js'
import { numberFormatter } from '../lib/number-format.js'

/** Longest count, in ms: auto-starting motion over 5 s needs a pause control (WCAG 2.2.2). */
const MAX_DURATION = 5000

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function detectDecimals(value) {
  const n = value.trim()
  const dot = n.indexOf('.')
  return dot === -1 || /e/i.test(n) ? 0 : n.length - dot - 1
}

function parseDecimals(value) {
  if (value == null || value.trim() === '') return null
  const n = parseInt(value, 10)
  return Number.isInteger(n) && n >= 0 && n <= 20 ? n : null
}

/**
 * The count's formatter and the precision frames round to.
 * - --vb-ticker-decimals set: every frame, the last included, shows exactly
 *   that many decimals (an explicit format choice).
 * - data-format-number present: the same Intl options as the static
 *   formatter, so the last frame is exactly what data-format-number shows
 *   (and what reduced-motion users see). Frames round to the value's own
 *   precision so the count does not flicker through stray decimals.
 * - neither: plain decimal with the value's own precision.
 * @returns {{ formatter: Intl.NumberFormat|null, step: number }}
 */
function buildFormatter(el, raw, explicitDecimals) {
  const precision = explicitDecimals ?? detectDecimals(raw)
  const fixed = explicitDecimals != null || !el.hasAttribute('data-format-number')
  const formatter = numberFormatter(el, fixed
    ? { minimumFractionDigits: precision, maximumFractionDigits: precision }
    : {})
  return { formatter, step: precision }
}

/** Round to `digits` decimals (frames only; the final value is exact). */
function roundTo(value, digits) {
  const p = Math.pow(10, Math.min(digits, 15))
  return Math.round(value * p) / p
}

/**
 * Count up to the value. Returns a cancel function (or null when there is
 * nothing to animate) so cleanup and re-activation stop the rAF loop.
 * While counting the element is aria-busy, so a live region around it
 * announces only the settled number.
 * @returns {(() => void) | null}
 */
function animateTicker(el) {
  const raw = el.getAttribute('value')
  if (raw == null || raw.trim() === '') return null

  const endValue = Number(raw)
  if (isNaN(endValue)) return null

  const params = VB.params(el)
  const startValue = params.getNumber('ticker-start', 0)
  const duration = Math.min(Math.max(params.getTime('ticker-duration', 1000), 0), MAX_DURATION)
  const explicitDecimals = parseDecimals(params.get('ticker-decimals'))

  const { formatter, step } = buildFormatter(el, raw, explicitDecimals)
  const range = endValue - startValue
  if (range === 0) return null

  let startTime = null
  let frame = 0

  function settle() {
    el.removeAttribute('aria-busy')
  }

  function tick(timestamp) {
    if (!startTime) startTime = timestamp
    const elapsed = timestamp - startTime
    const progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1)

    if (progress < 1) {
      const current = roundTo(startValue + range * easeOutExpo(progress), step)
      el.textContent = formatter ? formatter.format(current) : current.toFixed(step)
      frame = requestAnimationFrame(tick)
    } else {
      el.textContent = formatter ? formatter.format(endValue) : endValue.toFixed(step)
      settle()
    }
  }

  el.setAttribute('aria-busy', 'true')
  frame = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(frame)
    settle()
  }
}

VB.effect('ticker', (el) => {
  if (VB.prefersReducedMotion()) return { cleanup() {} }

  /** @type {(() => void) | null} */
  let cancel = null
  const original = el.textContent

  return {
    // Re-activation restarts the count instead of running two loops.
    activate() {
      cancel?.()
      cancel = animateTicker(el)
    },
    cleanup() {
      cancel?.()
      cancel = null
      // A count stopped mid-way would leave a wrong number behind.
      if (el.textContent !== original) el.textContent = original
    },
  }
})
