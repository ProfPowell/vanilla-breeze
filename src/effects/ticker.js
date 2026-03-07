/**
 * Ticker effect — animated number count-up.
 * Works on <data> elements with a value attribute.
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

function animateTicker(el) {
  const raw = el.getAttribute('value')
  if (raw == null) return

  const endValue = Number(raw)
  if (isNaN(endValue)) return

  const params = VB.params(el)
  const startValue = params.getNumber('ticker-start', 0)
  const duration = params.getNumber('ticker-duration', 1000)
  const decimals = params.get('ticker-decimals')
    ? parseInt(params.get('ticker-decimals'), 10)
    : detectDecimals(raw)

  const formatter = buildFormatter(el, decimals)
  const range = endValue - startValue
  if (range === 0) return

  let startTime = null

  function tick(timestamp) {
    if (!startTime) startTime = timestamp
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeOutExpo(progress)
    const current = startValue + range * eased

    el.textContent = formatter ? formatter.format(current) : current.toFixed(decimals)

    if (progress < 1) {
      requestAnimationFrame(tick)
    } else {
      el.textContent = formatter ? formatter.format(endValue) : endValue.toFixed(decimals)
      if (el.hasAttribute('data-format-number')) {
        el.setAttribute('data-format-number-init', '')
      }
    }
  }

  requestAnimationFrame(tick)
}

VB.effect('ticker', (el) => {
  if (el.hasAttribute('data-effect-ticker-init')) return
  el.setAttribute('data-effect-ticker-init', '')

  if (VB.prefersReducedMotion()) return

  return {
    activate() { animateTicker(el) },
    cleanup() {},
  }
})
