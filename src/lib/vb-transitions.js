/**
 * VB Built-in Transitions
 *
 * Registers standard transition handlers for data-transition.
 * These auto-assign view-transition-name and view-transition-class
 * so the CSS animation presets kick in during View Transitions.
 */

import { VB } from './vb.js'

// ─── Morph transition ────────────────────────────────────────────────────────
// Element morphs between old and new state. The browser interpolates
// position, size, and appearance automatically.

VB.transition('morph', (el) => {
  const name = `morph-${VB.uid(el)}`
  el.style.viewTransitionName = name
  return () => { el.style.viewTransitionName = '' }
})

// ─── Slide transition ────────────────────────────────────────────────────────
// Page-level slide. Uses view-transition-class so CSS presets apply.

VB.transition('slide', (el) => {
  const name = `slide-${VB.uid(el)}`
  el.style.viewTransitionName = name
  el.style.viewTransitionClass = 'slide-left'
  return () => {
    el.style.viewTransitionName = ''
    el.style.viewTransitionClass = ''
  }
})

// ─── Fade transition ─────────────────────────────────────────────────────────
// Explicit crossfade without position morph.

VB.transition('fade', (el) => {
  const name = `fade-${VB.uid(el)}`
  el.style.viewTransitionName = name
  el.style.viewTransitionClass = 'fade'
  return () => {
    el.style.viewTransitionName = ''
    el.style.viewTransitionClass = ''
  }
})

// ─── Scale transition ────────────────────────────────────────────────────────
// Scale-down/scale-up swap.

VB.transition('scale', (el) => {
  const name = `scale-${VB.uid(el)}`
  el.style.viewTransitionName = name
  el.style.viewTransitionClass = 'scale'
  return () => {
    el.style.viewTransitionName = ''
    el.style.viewTransitionClass = ''
  }
})

// ─── Stagger transition ─────────────────────────────────────────────────────
// Children get individual view-transition-names with staggered delays.

VB.transition('stagger', (el) => {
  const children = el.children
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    child.style.viewTransitionName = `stagger-${VB.uid(el)}-${i}`
    child.style.viewTransitionClass = 'fade'
  }
  return () => {
    for (let i = 0; i < children.length; i++) {
      children[i].style.viewTransitionName = ''
      children[i].style.viewTransitionClass = ''
    }
  }
})

// ─── None transition ─────────────────────────────────────────────────────────
// Instant swap, no animation. Useful to opt-out a section.

VB.transition('none', (el) => {
  const name = `none-${VB.uid(el)}`
  el.style.viewTransitionName = name
  el.style.viewTransitionClass = 'none'
  return () => {
    el.style.viewTransitionName = ''
    el.style.viewTransitionClass = ''
  }
})
