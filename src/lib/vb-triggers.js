/**
 * VB Built-in Triggers
 *
 * Registers standard trigger handlers: scroll, hover, click, time.
 * Hover is CSS-only (no JS registration needed), but we register it
 * as a no-op so VB doesn't warn about unknown triggers.
 */

import { VB } from './vb.js'

// ─── Scroll trigger ──────────────────────────────────────────────────────────
// Uses IntersectionObserver, fires once, then disconnects.

VB.trigger('scroll', (el, activate) => {
  if (VB.prefersReducedMotion()) {
    activate()
    return
  }

  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      io.disconnect()
      activate()
    }
  }, { threshold: 0.1 })

  io.observe(el)
  return () => io.disconnect()
})

// ─── Hover trigger ───────────────────────────────────────────────────────────
// CSS handles :hover — this JS trigger adds/removes data-effect-active for
// effects that need JS activation on hover.

VB.trigger('hover', (el, activate) => {
  function onEnter() {
    el.removeAttribute('data-effect-active')
    void el.offsetWidth
    activate()
  }
  function onLeave() { el.removeAttribute('data-effect-active') }

  el.addEventListener('pointerenter', onEnter)
  el.addEventListener('pointerleave', onLeave)

  return () => {
    el.removeEventListener('pointerenter', onEnter)
    el.removeEventListener('pointerleave', onLeave)
  }
})

// ─── Click trigger ───────────────────────────────────────────────────────────
// Re-triggers effect on every click by removing and re-adding data-effect-active.
// This forces CSS animations to replay.

VB.trigger('click', (el, activate) => {
  function onClick() {
    // Remove then re-add to restart CSS animations
    el.removeAttribute('data-effect-active')
    // Force reflow so the browser sees the removal before re-add
    void el.offsetWidth
    activate()
  }

  el.addEventListener('click', onClick)
  return () => el.removeEventListener('click', onClick)
})

// ─── Time trigger ────────────────────────────────────────────────────────────
// Activates after a delay. Syntax: data-trigger="time:2000"

VB.trigger('time', (el, activate, param) => {
  const delay = parseInt(param || '0', 10)
  const id = setTimeout(activate, delay)
  return () => clearTimeout(id)
})
