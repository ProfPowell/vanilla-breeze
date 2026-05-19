/**
 * VB Built-in Triggers
 *
 * Registers standard trigger handlers: scroll, hover, click, time,
 * intersect, media, event.
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

// ─── Intersect trigger ───────────────────────────────────────────────────────
// Generalized IntersectionObserver trigger with two modes:
//
//   data-trigger="intersect"        → fires once (alias of `scroll`)
//   data-trigger="intersect:once"   → fires once (explicit)
//   data-trigger="intersect:toggle" → toggles data-effect-active on enter/leave
//
// `toggle` mode is the bridge between one-shot entrance animations and
// continuous decoration that should follow the viewport.

VB.trigger('intersect', (el, activate, param) => {
  if (VB.prefersReducedMotion()) {
    activate()
    return
  }

  const mode = param || 'once'

  if (mode === 'toggle') {
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) activate()
      else VB.deactivate(el)
    }, { threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }

  // Default: once
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      io.disconnect()
      activate()
    }
  }, { threshold: 0.1 })
  io.observe(el)
  return () => io.disconnect()
})

// ─── Media trigger ───────────────────────────────────────────────────────────
// Activates when a matchMedia query matches, deactivates on mismatch.
// Syntax: data-trigger="media:(prefers-color-scheme:dark)"
//         data-trigger="media:(min-width:60rem)"
//
// The colon inside the query is part of the param — vb.js splits on the
// FIRST colon only, so the query is preserved verbatim.

VB.trigger('media', (el, activate, param) => {
  if (!param) return
  const mq = window.matchMedia(param)
  function sync() {
    if (mq.matches) activate()
    else VB.deactivate(el)
  }
  mq.addEventListener('change', sync)
  sync() // initial state
  return () => mq.removeEventListener('change', sync)
})

// ─── Event trigger ───────────────────────────────────────────────────────────
// Activates when a custom DOM event is dispatched on the element.
// Syntax: data-trigger="event:order-confirmed"
// Pairs with VB.activate() so app code can drive effect timing without
// touching data-effect-active directly.

VB.trigger('event', (el, activate, param) => {
  if (!param) return
  function onEvent() {
    el.removeAttribute('data-effect-active')
    void el.offsetWidth // force reflow so CSS animations replay
    activate()
  }
  el.addEventListener(param, onEvent)
  return () => el.removeEventListener(param, onEvent)
})

// ─── View Transition trigger ─────────────────────────────────────────────────
// Fires after VB.swap() completes its updateCallback. Bridges the
// data-transition system to data-effect: an entrance animation written
// alongside `data-trigger="vt"` defers activation until the view
// transition has committed the new DOM (and the cross-fade is about to
// start). Pairs with the `data-transition="effect:<class>"` handler.

VB.trigger('vt', (el, activate) => {
  function onVtDone() {
    el.removeAttribute('data-effect-active')
    void el.offsetWidth
    activate()
  }
  el.addEventListener('vb:vt-update-done', onVtDone)
  return () => el.removeEventListener('vb:vt-update-done', onVtDone)
})
