/**
 * Rating effect — progressive enhancement for star rating fieldsets.
 *
 * Opt in with `data-effect="rating"` on a `fieldset[data-rating]`. Adds:
 *   - clear/unrate: activate the already-checked star again (click, Space)
 *     or press Delete / Backspace on it
 *   - `rating:change` events ({ detail: { value } }) on every change and clear
 *   - a persistent polite live region that announces the clear (the checked
 *     radio already announces its own "N stars, checked" state, so selection
 *     is not announced twice)
 *
 * @attr {string} data-label-cleared - Clear announcement (default "Rating cleared")
 *
 * No init-marker attribute: VB's per-element instance map dedupes, and
 * cleanup() removes everything init added; the runtime tracks processed
 * state in a WeakSet, so a removed + re-inserted (or cloned) fieldset is
 * wired again from scratch.
 */

import { VB } from '../lib/vb.js'

const DEFAULT_CLEARED = 'Rating cleared'

function dispatch(fieldset, value) {
  fieldset.dispatchEvent(new CustomEvent('rating:change', {
    bubbles: true, detail: { value },
  }))
}

/** @param {EventTarget | null} t */
function asRadio(t) {
  return t instanceof HTMLInputElement && t.type === 'radio' ? t : null
}

VB.effect('rating', (el) => {
  if (el.hasAttribute('data-rating-readonly')) return

  // One persistent live region per fieldset: a region inserted with its
  // text already set is often not announced, so it must exist up front.
  const live = document.createElement('span')
  live.setAttribute('data-rating-live', '')
  live.setAttribute('role', 'status')
  el.appendChild(live)

  let clearTimer = 0
  function announce(message) {
    // Reset first so the same message twice in a row is announced again.
    live.textContent = ''
    clearTimeout(clearTimer)
    clearTimer = window.setTimeout(() => { live.textContent = message }, 50)
  }

  function clear(radio) {
    radio.checked = false
    dispatch(el, 0)
    announce(el.getAttribute('data-label-cleared') || DEFAULT_CLEARED)
  }

  // Click on the radio (direct, via its label, Space, or arrow keys). The
  // radio is already checked when click listeners run, so the pre-click
  // state is unknown here; `change` follows the click synchronously only
  // when the selection really changed. Decide after the activation settles:
  // no change event means the star was already checked, so clear it. This
  // also stays correct after programmatic value changes and form resets.
  let changedSinceClick = false
  let clickTimer = 0
  function onClick(e) {
    const radio = asRadio(e.target)
    if (!radio || !radio.checked) return
    changedSinceClick = false
    clearTimeout(clickTimer)
    clickTimer = window.setTimeout(() => {
      if (!changedSinceClick && radio.checked) clear(radio)
    }, 0)
  }

  function onKeydown(e) {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return
    const radio = asRadio(e.target)
    if (!radio || !radio.checked) return
    e.preventDefault()
    clear(radio)
  }

  function onChange(e) {
    const radio = asRadio(e.target)
    // Only a newly checked radio is a selection; ignore anything else.
    if (!radio || !radio.checked) return
    changedSinceClick = true
    dispatch(el, Number(radio.value))
  }

  el.addEventListener('click', onClick)
  el.addEventListener('keydown', onKeydown)
  el.addEventListener('change', onChange)

  return {
    cleanup() {
      clearTimeout(clearTimer)
      clearTimeout(clickTimer)
      el.removeEventListener('click', onClick)
      el.removeEventListener('keydown', onKeydown)
      el.removeEventListener('change', onChange)
      live.remove()
    },
  }
})
