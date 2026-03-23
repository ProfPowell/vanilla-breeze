/**
 * Icons Bundle — Attractor Effects (JS)
 * Vanilla Breeze · Material Symbols
 *
 * Event-driven attract triggers, declarative data-vb-attract-on API,
 * and opt-in whimsy mode.
 */

const ATTRACT_TYPES = ['pulse', 'beat', 'bounce', 'wiggle', 'breathe']
const WEIGHTS = [35, 30, 20, 5, 10]

/**
 * Trigger an attractor animation on an icon element.
 * Cleans up after animation ends so it can retrigger.
 * @param {Element} iconEl
 * @param {'pulse'|'beat'|'bounce'|'wiggle'|'breathe'} [type='pulse']
 */
export function attract(iconEl, type = 'pulse') {
  if (!iconEl || !ATTRACT_TYPES.includes(type)) return
  // Remove existing to allow retrigger
  delete iconEl.dataset.vbAttract
  // Force reflow so re-adding triggers animation
  void iconEl.offsetWidth
  iconEl.dataset.vbAttract = type

  iconEl.addEventListener('animationend', () => {
    // Don't remove breathe — it's continuous
    if (type !== 'breathe') {
      delete iconEl.dataset.vbAttract
    }
  }, { once: true })
}

/**
 * Trigger a weighted-random attractor animation.
 * Pulse and beat are most common; wiggle is rare.
 * @param {Element} iconEl
 */
export function attractRandom(iconEl) {
  const type = weightedRandom(ATTRACT_TYPES, WEIGHTS)
  attract(iconEl, type)
}

/**
 * Enable idle whimsy mode. After idleMs of no interaction,
 * a random visible .vb-icon gets a gentle nudge.
 * Opt-in via JS or declaratively with data-vb-whimsy on <body>.
 * @param {number} [idleMs=45000]
 * @returns {{ stop: () => void }} Cleanup handle
 */
export function enableWhimsy(idleMs = 45000) {
  let timer

  const reset = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      const icons = [...document.querySelectorAll('.vb-icon:not([data-vb-attract])')]
      if (icons.length) {
        const target = icons[Math.floor(Math.random() * icons.length)]
        attractRandom(target)
      }
    }, idleMs)
  }

  const events = ['mousemove', 'keydown', 'scroll', 'touchstart']
  events.forEach(e => document.addEventListener(e, reset, { passive: true }))
  reset()

  return {
    stop() {
      clearTimeout(timer)
      events.forEach(e => document.removeEventListener(e, reset))
    },
  }
}

/**
 * Observe data-vb-attract-on declarative triggers.
 * - "visible": animate when element enters viewport
 * - "hover": animate on mouseenter
 * - "error": animate when closest [aria-invalid="true"] appears
 */
function initAttractOnObservers() {
  // Visibility-triggered attractors
  const visibleEls = document.querySelectorAll('[data-vb-attract-on="visible"]')
  if (visibleEls.length) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const type = entry.target.dataset.vbAttract || 'pulse'
          attract(entry.target, type)
          io.unobserve(entry.target)
        }
      }
    }, { threshold: 0.5 })
    visibleEls.forEach(el => io.observe(el))
  }

  // Hover-triggered attractors
  document.querySelectorAll('[data-vb-attract-on="hover"]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      const type = el.dataset.vbAttract || 'pulse'
      attract(el, type)
    })
  })

  // Error-triggered attractors (watch for aria-invalid changes)
  const errorEls = document.querySelectorAll('[data-vb-attract-on="error"]')
  if (errorEls.length) {
    const mo = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        if (mut.attributeName === 'aria-invalid' && mut.target.getAttribute('aria-invalid') === 'true') {
          // Find sibling .vb-icon with data-vb-attract-on="error"
          const icon = mut.target.parentElement?.querySelector('[data-vb-attract-on="error"]')
          if (icon) attract(icon, icon.dataset.vbAttract || 'wiggle')
        }
      }
    })
    errorEls.forEach(el => {
      const field = el.closest('label, fieldset, [data-field]')?.querySelector('input, select, textarea')
      if (field) mo.observe(field, { attributes: true, attributeFilter: ['aria-invalid'] })
    })
  }
}

// --- Internal helpers ---

function weightedRandom(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

// --- Auto-init ---

// Declarative whimsy: <body data-vb-whimsy>
if (document.body?.hasAttribute('data-vb-whimsy')) {
  enableWhimsy()
}

// Init data-vb-attract-on observers when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAttractOnObservers)
} else {
  initAttractOnObservers()
}
