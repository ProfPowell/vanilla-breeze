/**
 * Rating effect — progressive enhancement for star rating fieldsets.
 * Adds clear/unrate, rating-change events, and screen reader announcements.
 */

import { VB } from '../lib/vb.js'

const ANNOUNCE_DURATION = 1000

function announce(message) {
  const el = document.createElement('div')
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', 'polite')
  Object.assign(el.style, {
    position: 'absolute', width: '1px', height: '1px', padding: '0',
    margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap', border: '0',
  })
  el.textContent = message
  document.body.appendChild(el)
  setTimeout(() => el.remove(), ANNOUNCE_DURATION)
}

function dispatch(fieldset, value) {
  fieldset.dispatchEvent(new CustomEvent('rating-change', {
    bubbles: true, detail: { value },
  }))
}

function getCheckedValue(fieldset) {
  const checked = fieldset.querySelector('input[type="radio"]:checked')
  return checked ? checked.value : '0'
}

VB.effect('rating', (el) => {
  if (el.hasAttribute('data-effect-rating-init')) return
  el.setAttribute('data-effect-rating-init', '')

  if (el.hasAttribute('data-rating-readonly')) return

  let lastValue = getCheckedValue(el)
  let pendingClear = false

  function onMousedown(e) {
    const label = e.target.closest('label')
    if (!label) return
    const radio = label.querySelector('input[type="radio"]')
    if (!radio) return
    pendingClear = radio.checked && radio.value === lastValue
  }

  function onClick(e) {
    if (!pendingClear) return
    pendingClear = false
    const label = e.target.closest('label')
    if (!label) return
    const radio = label.querySelector('input[type="radio"]')
    if (!radio) return
    radio.checked = false
    lastValue = '0'
    dispatch(el, 0)
    announce('Rating cleared')
  }

  function onChange(e) {
    if (e.target.type !== 'radio') return
    if (pendingClear) return
    lastValue = e.target.value
    dispatch(el, Number(e.target.value))
    announce(`Rating: ${e.target.value} ${Number(e.target.value) === 1 ? 'star' : 'stars'}`)
  }

  el.addEventListener('mousedown', onMousedown)
  el.addEventListener('click', onClick)
  el.addEventListener('change', onChange)

  return {
    cleanup() {
      el.removeEventListener('mousedown', onMousedown)
      el.removeEventListener('click', onClick)
      el.removeEventListener('change', onChange)
    },
  }
})
