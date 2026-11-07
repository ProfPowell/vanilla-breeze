/**
 * VB Built-in Transitions
 *
 * Registers the standard handlers for data-transition. Each one sets an
 * inline view-transition-name (and, for the presets, a view-transition-class)
 * so the CSS presets in utils/vt-keyframes.css apply during any view
 * transition on the page. Every handler returns a cleanup that removes
 * exactly what it set.
 *
 * Values:
 *   morph                 shared-element morph (browser default group animation)
 *   slide[:forward|back|left|right]
 *                         slide; forward (default) follows the element's
 *                         writing direction, so it mirrors under dir="rtl"
 *   fade | scale | none   preset classes
 *   stagger               per-child names + fade + a delay ladder for the
 *                         first 12 children (vt-stagger-0 … vt-stagger-11)
 *   effect[:class]        cross-fade bridge for data-trigger="vt"
 */

import { VB } from './vb.js'

/** Children past this index share the last rung of the delay ladder. */
export const STAGGER_STEPS = 12

/**
 * A view-transition-name for `el`, safe as a CSS custom-ident even when the
 * element's id contains characters such as `.` or `:`.
 * @param {string} prefix
 * @param {Element} el
 * @param {string|number} [suffix]
 */
function vtName(prefix, el, suffix) {
  const uid = VB.uid(el)
  const raw = suffix === undefined ? `${prefix}-${uid}` : `${prefix}-${uid}-${suffix}`
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(raw) : raw.replace(/[^\w-]/g, '_')
}

/**
 * Set a name (and optional class) and return the matching cleanup.
 * @param {HTMLElement} el
 * @param {string} name
 * @param {string} [cls]
 */
function assign(el, name, cls) {
  el.style.viewTransitionName = name
  if (cls) el.style.viewTransitionClass = cls
  return () => {
    el.style.viewTransitionName = ''
    if (cls) el.style.viewTransitionClass = ''
  }
}

// ─── Morph ───────────────────────────────────────────────────────────────────
// The element morphs between its old and new state. With an id the name is
// predictable (`morph-<id>`), so a second element can take the same name in
// the new state (see the doc page's shared-element pattern / data-vt-name).

VB.transition('morph', (el) => assign(el, vtName('morph', el)))

// ─── Slide ───────────────────────────────────────────────────────────────────
// `slide` / `slide:forward` moves content toward the start of the line:
// left in LTR, right in RTL. `slide:back` reverses it. `slide:left` and
// `slide:right` are physical and ignore direction. The direction is read
// from the element's computed `direction` when it is processed.

/**
 * @param {Element} el
 * @param {string|null} param
 * @returns {'slide-left'|'slide-right'}
 */
export function slideClass(el, param) {
  const p = (param || 'forward').trim().toLowerCase()
  if (p === 'left') return 'slide-left'
  if (p === 'right') return 'slide-right'
  const rtl = getComputedStyle(el).direction === 'rtl'
  const forwardIsLeft = !rtl
  const goLeft = p === 'back' ? !forwardIsLeft : forwardIsLeft
  return goLeft ? 'slide-left' : 'slide-right'
}

VB.transition('slide', (el, param) => assign(el, vtName('slide', el), slideClass(el, param)))

// ─── Fade / Scale / None ─────────────────────────────────────────────────────

VB.transition('fade', (el) => assign(el, vtName('fade', el), 'fade'))
VB.transition('scale', (el) => assign(el, vtName('scale', el), 'scale'))
VB.transition('none', (el) => assign(el, vtName('none', el), 'none'))

// ─── Stagger ─────────────────────────────────────────────────────────────────
// Each child gets its own name (keyed to the child, so a reordered child
// glides to its new place), the `fade` class and a `vt-stagger-N` class for
// its current position, whose ::view-transition-* rules carry
// animation-delay N × the --view-transition-stagger step (vt-keyframes.css).
// Children added, removed or moved later are re-laddered; cleanup clears
// only the children it named.

/**
 * @param {HTMLElement} el
 */
function applyStagger(el) {
  /** @type {Set<HTMLElement>} */
  const named = new Set()

  const rename = () => {
    const kids = /** @type {HTMLElement[]} */ (Array.from(el.children))
    for (const old of named) {
      if (old.parentElement !== el) {
        old.style.viewTransitionName = ''
        old.style.viewTransitionClass = ''
        named.delete(old)
      }
    }
    kids.forEach((child, i) => {
      if (!(child instanceof HTMLElement)) return
      const step = Math.min(i, STAGGER_STEPS - 1)
      child.style.viewTransitionName = vtName('stagger', el, VB.uid(child))
      child.style.viewTransitionClass = `fade vt-stagger-${step}`
      named.add(child)
    })
  }

  rename()
  const observer = new MutationObserver(rename)
  observer.observe(el, { childList: true })

  return () => {
    observer.disconnect()
    for (const child of named) {
      child.style.viewTransitionName = ''
      child.style.viewTransitionClass = ''
    }
    named.clear()
  }
}

VB.transition('stagger', (el) => applyStagger(el))

// ─── Effect bridge ───────────────────────────────────────────────────────────
// Cross-fades the element via View Transitions while descendants with
// `data-trigger="vt"` defer their entrance animation until the swap commits.
// Syntax: data-transition="effect:fade"  (`fade` is a view-transition-class)
// Defaults to `fade` when no class is given.

VB.transition('effect', (el, param) => {
  const cls = (param || 'fade').trim()
  return assign(el, vtName('effect', el), /^-?[_a-zA-Z][\w-]*$/.test(cls) ? cls : 'fade')
})
