/**
 * VB Built-in Triggers
 *
 * Registers the standard data-trigger handlers: scroll, intersect, hover,
 * click, time, media, event, vt, and the JS half of view-progress /
 * scroll-progress.
 *
 * Every bundle that ships the runtime (src/lib/vb.js) imports this module —
 * tests/unit/effects-bundle-parity.test.js holds the entries to that.
 *
 * A wired trigger makes the runtime set [data-effect-armed] on the element;
 * the hidden entrance pre-state is gated on that marker, so an element whose
 * trigger never wires stays visible.
 */

import { VB } from './vb.js'

/**
 * Restart the element's effect: deactivate (emits vb:phase-change
 * {active:false}), force a reflow so CSS sees the removal, then activate.
 * @param {Element} el
 * @param {() => void} activate
 */
function replay(el, activate) {
  VB.deactivate(el)
  void (/** @type {HTMLElement} */ (el)).offsetWidth
  activate()
}

/**
 * IntersectionObserver that activates once on first entry. Under reduced
 * motion there is nothing to watch for: activate immediately.
 * @param {Element} el
 * @param {() => void} activate
 */
function onceInView(el, activate) {
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
}

/**
 * Parse a trigger delay: `2000` and `2000ms` are milliseconds, `2s` seconds.
 * @param {string | null} param
 */
function parseDelay(param) {
  const raw = (param || '0').trim()
  const n = parseFloat(raw)
  if (!Number.isFinite(n) || n < 0) return 0
  return /^[\d.]+s$/i.test(raw) ? n * 1000 : n
}

// ─── Scroll trigger ──────────────────────────────────────────────────────────
// Uses IntersectionObserver, fires once, then disconnects.

VB.trigger('scroll', (el, activate) => onceInView(el, activate))

// ─── Hover trigger ───────────────────────────────────────────────────────────
// Pointer hover OR keyboard focus (focus-within for containers) activates;
// the effect turns off only when the element is neither hovered nor holds
// focus. Each new engagement replays the effect.

VB.trigger('hover', (el, activate) => {
  let hovered = false
  let focused = false

  function engage(kind) {
    const wasEngaged = hovered || focused
    if (kind === 'hover') hovered = true
    else focused = true
    if (!wasEngaged) replay(el, activate)
  }
  function release() {
    if (!hovered && !focused) VB.deactivate(el)
  }

  const onEnter = () => engage('hover')
  const onLeave = () => { hovered = false; release() }
  const onFocusIn = () => engage('focus')
  /** @param {FocusEvent} e */
  const onFocusOut = (e) => {
    // Focus moving between descendants is still focus-within.
    if (e.relatedTarget instanceof Node && el.contains(e.relatedTarget)) return
    focused = false
    release()
  }

  el.addEventListener('pointerenter', onEnter)
  el.addEventListener('pointerleave', onLeave)
  el.addEventListener('focusin', onFocusIn)
  el.addEventListener('focusout', onFocusOut)

  return () => {
    el.removeEventListener('pointerenter', onEnter)
    el.removeEventListener('pointerleave', onLeave)
    el.removeEventListener('focusin', onFocusIn)
    el.removeEventListener('focusout', onFocusOut)
  }
})

// ─── Click trigger ───────────────────────────────────────────────────────────
// data-trigger="click"         toggles: the first click activates, the next
//                              one deactivates, and so on.
// data-trigger="click:replay"  replays the effect on every click (attention
//                              effects such as shake).
// Clicks reach the element from a keyboard only when it is (or contains) a
// button or link — put the trigger on one, or inside one.

VB.trigger('click', (el, activate, param) => {
  function onClick() {
    if (param === 'replay') replay(el, activate)
    else if (el.hasAttribute('data-effect-active')) VB.deactivate(el)
    else activate()
  }

  el.addEventListener('click', onClick)
  return () => el.removeEventListener('click', onClick)
})

// ─── Time trigger ────────────────────────────────────────────────────────────
// Activates after a delay. Syntax: data-trigger="time:2000" (ms),
// "time:2000ms" or "time:2s".

VB.trigger('time', (el, activate, param) => {
  const id = setTimeout(activate, parseDelay(param))
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
  return onceInView(el, activate)
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
// touching data-effect-active directly. Every dispatch replays the effect.

VB.trigger('event', (el, activate, param) => {
  if (!param) return
  const onEvent = () => replay(el, activate)
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
  const onVtDone = () => replay(el, activate)
  el.addEventListener('vb:vt-update-done', onVtDone)
  return () => el.removeEventListener('vb:vt-update-done', onVtDone)
})

// ─── view-progress / scroll-progress ─────────────────────────────────────────
// The animation itself is CSS (animation-timeline: view() / scroll(), in
// effects-extended.css). Registering the names here does two things:
//  - with timeline support the element is armed and the timeline drives it;
//  - without support (or under reduced motion) the element would otherwise
//    sit in its hidden pre-state forever, so it falls back to a one-shot
//    entrance when it scrolls into view, like `scroll`.

const timelineSupported = typeof CSS !== 'undefined'
  && typeof CSS.supports === 'function'
  && CSS.supports('animation-timeline: view()')

for (const name of ['view-progress', 'scroll-progress']) {
  VB.trigger(name, (el, activate) => {
    if (timelineSupported && !VB.prefersReducedMotion()) return
    return onceInView(el, activate)
  })
}
