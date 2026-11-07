/**
 * Ticker effect — animated number count-up.
 * Works on <data> elements with a value attribute.
 *
 * Custom properties: --vb-ticker-duration, --vb-ticker-start, --vb-ticker-decimals
 * (effect parameters are custom properties, like every VB effect).
 */

import { VB } from '../lib/vb.js'
import { getLocale } from '../lib/i18n.js'

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function detectDecimals(value) {
  const dot = value.indexOf('.')
  return dot === -1 ? 0 : value.length - dot - 1
}

function parseDecimals(value) {
  if (value == null || value.trim() === '') return null
  const n = parseInt(value, 10)
  return Number.isInteger(n) && n >= 0 && n <= 20 ? n : null
}

function buildFormatter(el, decimals) {
  const locale = el.getAttribute('data-locale') || getLocale()
  const formatStyle = el.getAttribute('data-format-number')

  if (formatStyle != null) {
    const opts = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }
    switch (formatStyle) {
      case 'currency':
        opts.style = 'currency'
        opts.currency = el.getAttribute('data-currency') || 'USD'
        break
      case 'percent':
        opts.style = 'percent'
        break
      case 'compact':
        opts.notation = 'compact'
        break
    }
    try { return new Intl.NumberFormat(locale, opts) } catch { return null }
  }

  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  } catch { return null }
}

/**
 * Count up to the value. Returns a cancel function (or null when there is
 * nothing to animate) so cleanup and re-activation stop the rAF loop.
 * @returns {(() => void) | null}
 */
function animateTicker(el) {
  const raw = el.getAttribute('value')
  if (raw == null || raw.trim() === '') return null

  const endValue = Number(raw)
  if (isNaN(endValue)) return null

  const params = VB.params(el)
  const startValue = params.getNumber('ticker-start', 0)
  const duration = params.getTime('ticker-duration', 1000)
  // Decimal places: --vb-ticker-decimals, then the value's own precision.
  const decimals = parseDecimals(params.get('ticker-decimals')) ?? detectDecimals(raw)

  const formatter = buildFormatter(el, decimals)
  const range = endValue - startValue
  if (range === 0) return null

  let startTime = null
  let frame = 0

  function tick(timestamp) {
    if (!startTime) startTime = timestamp
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeOutExpo(progress)
    const current = startValue + range * eased

    el.textContent = formatter ? formatter.format(current) : current.toFixed(decimals)

    if (progress < 1) {
      frame = requestAnimationFrame(tick)
    } else {
      el.textContent = formatter ? formatter.format(endValue) : endValue.toFixed(decimals)
      if (el.hasAttribute('data-format-number')) {
        el.setAttribute('data-format-number-init', '')
      }
    }
  }

  frame = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(frame)
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
