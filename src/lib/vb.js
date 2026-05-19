/**
 * VB — Vanilla Breeze Effects API
 *
 * Single entry point for effect and trigger registration.
 * Replaces per-effect MutationObservers with one shared observer.
 *
 * @example
 * VB.effect('shimmer', (el) => ({ activate() {}, cleanup() {} }))
 * VB.trigger('scroll', (el, run) => { ... return cleanup })
 * VB.observe()
 */

const reducedMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)')

function prefersReducedMotion() {
  return reducedMotionMq.matches
    || document.documentElement.hasAttribute('data-motion-reduced')
}

let _uidCounter = 0

/**
 * Keyframe → animation slot phase. Used by the global animationend handler
 * to translate raw `event.animationName` back into the slot that owns it
 * so listeners can react to "the entrance just finished" without needing
 * to know individual keyframe names. Extend via VB.registerKeyframe().
 */
const KEYFRAME_PHASE = new Map([
  // entrance
  ['vb-fade-in', 'entrance'],
  ['vb-slide-up', 'entrance'],
  ['vb-pop', 'entrance'],
  ['vb-slide-in-ltr', 'entrance'],
  ['vb-slide-in-rtl', 'entrance'],
  ['vb-fade-slide-up', 'entrance'],
  ['vb-shadow-lift', 'entrance'],
  // exit
  ['vb-fade-out', 'exit'],
  ['vb-collapse', 'exit'],
  ['vb-slide-out-ltr', 'exit'],
  ['vb-slide-out-rtl', 'exit'],
  // attention (animationend rarely fires for infinite, but shake is finite)
  ['vb-shake', 'attention'],
  ['vb-pulse', 'attention'],
  ['vb-bounce', 'attention'],
  ['vb-blink', 'attention'],
  // decoration
  ['vb-neon-pulse', 'decoration'],
  ['vb-3d-shift', 'decoration'],
  ['vb-outline-glow-pulse', 'decoration'],
  ['vb-rainbow', 'decoration'],
  ['vb-gradient-flow', 'decoration'],
  ['vb-shimmer', 'decoration'],
  ['vb-shimmer-gradient', 'decoration'],
  ['vb-glow', 'decoration'],
  ['vb-float', 'decoration'],
])

const VB = {
  _effects: new Map(),
  _triggers: new Map(),
  _transitions: new Map(),
  _instances: new WeakMap(),    // el → Map<effectName, { activate, cleanup }>
  _triggerCleanups: new WeakMap(), // el → cleanup function
  _transitionCleanups: new WeakMap(), // el → cleanup function
  _keyframePhase: KEYFRAME_PHASE,
  /** @type {MutationObserver | null} */
  _observer: null,
  /** @type {((e: AnimationEvent) => void) | null} */
  _animationEndHandler: null,

  /**
   * Register an effect handler.
   * Handler receives (el) and returns { activate(), cleanup() } or just cleanup().
   * If it returns nothing, that's fine too (CSS-only effects).
   */
  effect(name, handler) {
    this._effects.set(name, handler)
    // Initialize on existing matching elements
    document.querySelectorAll('[data-effect]').forEach(el => {
      const names = (el.getAttribute('data-effect') || '').split(/\s+/)
      if (names.includes(name)) {
        this._initEffect(el, name)
      }
    })
  },

  /**
   * Register a trigger handler.
   * Handler receives (el, activate) and returns a cleanup function.
   */
  trigger(name, handler) {
    this._triggers.set(name, handler)
  },

  /**
   * Register a transition handler for data-transition.
   * Handler receives (el) and should set view-transition-name.
   * Returns a cleanup function.
   */
  transition(name, handler) {
    this._transitions.set(name, handler)
  },

  /**
   * Generate a stable unique ID for an element.
   * Used for view-transition-name generation.
   */
  uid(el) {
    if (el.id) return el.id
    if (!el._vbUid) {
      _uidCounter++
      el._vbUid = `vb-${_uidCounter}`
    }
    return el._vbUid
  },

  /**
   * Register a theme token set.
   * Applies CSS custom properties to the target scope.
   * @param {string} name - Theme name
   * @param {Record<string, string>} tokens - CSS custom property map
   */
  theme(name, tokens) {
    this._themes = this._themes || new Map()
    this._themes.set(name, tokens)
  },

  /**
   * Apply a registered theme to an element or root.
   * @param {string} name - Theme name
   * @param {Element} [scope=document.documentElement] - Target scope
   */
  applyTheme(name, scope = document.documentElement) {
    const tokens = this._themes?.get(name)
    if (!tokens) return
    for (const [prop, value] of Object.entries(tokens)) {
      /** @type {HTMLElement} */ (scope).style.setProperty(prop, value)
    }
  },

  /**
   * Wrap a DOM mutation in a View Transition when supported.
   * Falls back to calling update() directly.
   * @param {() => void} update - The DOM mutation function
   * @returns {ViewTransition|void}
   */
  swap(update) {
    if (!document.startViewTransition) {
      update()
      // Even without VT support, fire vb:vt-update-done so listeners
      // (like the `vt` trigger) still get a consistent lifecycle.
      queueMicrotask(() => this._dispatchVtDone(document.body))
      return
    }

    const transition = document.startViewTransition(update)

    // After the new DOM is committed (updateCallbackDone), but possibly
    // BEFORE the cross-fade animation finishes (finished), fire the
    // vb:vt-update-done event on every element with [data-trigger~="vt"]
    // so deferred entrance animations can start in sync with the fade.
    // See memory: view_transition_finished_vs_updatecallback — we use
    // updateCallbackDone (DOM done ~10ms), not finished (~3-4s).
    transition.updateCallbackDone.then(() => {
      this._dispatchVtDone(document.body)
    }).catch(() => { /* aborted VT — silently ignore */ })

    return transition
  },

  /** Dispatch vb:vt-update-done on every [data-trigger~="vt"] in the tree. */
  _dispatchVtDone(root) {
    root.querySelectorAll('[data-trigger~="vt"]').forEach((el) => {
      this.emit(el, 'vb:vt-update-done', {})
    })
  },

  /**
   * Public version of internal activation. Adds `data-effect-active` and
   * runs JS effect handlers. Use for programmatic triggering, e.g. wiring
   * `<my-component>` to drive an entrance after some async work resolves.
   */
  activate(el) {
    this._activateEffects(el)
  },

  /**
   * Remove `data-effect-active`. Entrance/exit slots un-publish, so the
   * composer falls back to the pre-activation visual state. Useful for
   * re-triggering on hover/click cycles.
   */
  deactivate(el) {
    if (!el.hasAttribute('data-effect-active')) return
    el.removeAttribute('data-effect-active')
    this.emit(el, 'vb:phase-change', { active: false })
  },

  /**
   * Subscribe to phase-end events on a specific element + phase.
   * Fires when any keyframe whose name maps to that phase finishes.
   * Returns a function that removes the listener.
   *
   * @example
   * VB.onPhaseEnd(el, 'entrance', () => startTypewriter())
   */
  onPhaseEnd(el, phase, fn) {
    const handler = (e) => {
      if (e.detail?.phase === phase) fn(e.detail)
    }
    el.addEventListener('vb:effect-phase-end', handler)
    return () => el.removeEventListener('vb:effect-phase-end', handler)
  },

  /**
   * Register a custom keyframe name → phase mapping so the global
   * animationend handler can classify it.
   */
  registerKeyframe(name, phase) {
    this._keyframePhase.set(name, phase)
  },

  /**
   * Start observing the DOM for data-effect and data-trigger changes.
   */
  observe(root = document) {
    // Process existing elements
    root.querySelectorAll('[data-effect]').forEach(el => this._processElement(el))
    root.querySelectorAll('[data-stagger]').forEach(el => this._processStagger(el))
    root.querySelectorAll('[data-transition]').forEach(el => this._processTransition(el))

    if (this._observer) return

    this._observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue
            this._processTree(node)
          }
          for (const node of mutation.removedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue
            this._cleanupTree(node)
          }
        }
        if (mutation.type === 'attributes') {
          const el = mutation.target
          if (mutation.attributeName === 'data-effect') {
            this._reconcileEffects(el)
          }
          if (mutation.attributeName === 'data-trigger') {
            this._reconcileTrigger(el)
          }
          if (mutation.attributeName === 'data-stagger') {
            this._processStagger(el)
          }
          if (mutation.attributeName === 'data-transition') {
            this._processTransition(el)
          }
        }
      }
    })

    const target = root === document ? document.body : root
    this._observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-effect', 'data-trigger', 'data-stagger', 'data-transition'],
    })

    // Single delegated animationend listener. AnimationEvents bubble, so one
    // listener at the document root catches every slot animation. Maps the
    // raw keyframe name back to its phase via KEYFRAME_PHASE and dispatches
    // `vb:effect-phase-end` on the originating element so other effects (or
    // app code via VB.onPhaseEnd) can chain after entrance/exit finishes.
    if (!this._animationEndHandler) {
      this._animationEndHandler = (e) => {
        const el = e.target
        if (!(el instanceof Element)) return
        if (!el.hasAttribute('data-effect')) return
        const phase = this._keyframePhase.get(e.animationName)
        if (!phase) return
        this.emit(el, 'vb:effect-phase-end', {
          phase,
          animationName: e.animationName,
        })
      }
      document.addEventListener('animationend', this._animationEndHandler)
    }
  },

  /**
   * Full teardown — disconnect observer and clean up all instances.
   */
  disconnect() {
    if (this._observer) {
      this._observer.disconnect()
      this._observer = null
    }
    if (this._animationEndHandler) {
      document.removeEventListener('animationend', this._animationEndHandler)
      this._animationEndHandler = null
    }
  },

  /**
   * Read CSS custom properties from an element.
   */
  params(el) {
    const style = getComputedStyle(el)
    return {
      get(name) {
        return style.getPropertyValue(`--vb-${name}`).trim()
      },
      getNumber(name, fallback = 0) {
        const val = style.getPropertyValue(`--vb-${name}`).trim()
        return val ? parseFloat(val) : fallback
      },
      // Parse a CSS <time> token (2s, 400ms, or bare number treated as ms)
      // into milliseconds. Returns fallback if the property is unset.
      getTime(name, fallback = 0) {
        const val = style.getPropertyValue(`--vb-${name}`).trim()
        if (!val) return fallback
        const n = parseFloat(val)
        if (!Number.isFinite(n)) return fallback
        return /s\s*$/.test(val) && !/ms\s*$/.test(val) ? n * 1000 : n
      },
      hasClass(name) {
        return el.classList.contains(name)
      },
    }
  },

  /**
   * Emit a CustomEvent on an element.
   */
  emit(el, name, detail = {}) {
    el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }))
  },

  /**
   * Check reduced motion preference.
   */
  prefersReducedMotion,

  // ─── Internal ──────────────────────────────────────────────────────

  _processTree(el) {
    if (el.hasAttribute?.('data-effect')) this._processElement(el)
    if (el.hasAttribute?.('data-stagger')) this._processStagger(el)
    if (el.hasAttribute?.('data-transition')) this._processTransition(el)
    el.querySelectorAll?.('[data-effect]').forEach(child => this._processElement(child))
    el.querySelectorAll?.('[data-stagger]').forEach(child => this._processStagger(child))
    el.querySelectorAll?.('[data-transition]').forEach(child => this._processTransition(child))
  },

  _cleanupTree(el) {
    if (el.hasAttribute?.('data-effect')) this._cleanupElement(el)
    if (el.hasAttribute?.('data-transition')) this._cleanupTransition(el)
    el.querySelectorAll?.('[data-effect]').forEach(child => this._cleanupElement(child))
    el.querySelectorAll?.('[data-transition]').forEach(child => this._cleanupTransition(child))
  },

  _processElement(el) {
    if (el.hasAttribute('data-effect-processed')) return
    el.setAttribute('data-effect-processed', '')

    const effectNames = el.getAttribute('data-effect')?.split(/\s+/).filter(Boolean) || []

    // Initialize each effect
    for (const name of effectNames) {
      this._initEffect(el, name)
    }

    // Wire up trigger
    this._wireTrigger(el, effectNames)
  },

  _initEffect(el, name) {
    const handler = this._effects.get(name)
    if (!handler) return // CSS-only effect or not yet registered

    // Don't re-init
    let instances = this._instances.get(el)
    if (instances?.has(name)) return

    if (prefersReducedMotion()) {
      // For JS effects with reduced motion, don't initialize animations
      // The handler can check VB.prefersReducedMotion() internally
    }

    const result = handler(el)

    if (result) {
      if (!instances) {
        instances = new Map()
        this._instances.set(el, instances)
      }
      if (typeof result === 'function') {
        instances.set(name, { cleanup: result })
      } else {
        instances.set(name, result)
      }
    }
  },

  _wireTrigger(el, effectNames) {
    const triggerAttr = el.getAttribute('data-trigger')

    if (!triggerAttr) {
      // No trigger — activate immediately for JS effects
      this._activateEffects(el)
      return
    }

    const triggerNames = triggerAttr.split(/\s+/).filter(Boolean)

    for (const trigger of triggerNames) {
      // Parse trigger name and optional parameter (e.g. "time:2000")
      const colonIdx = trigger.indexOf(':')
      const triggerName = colonIdx > -1 ? trigger.slice(0, colonIdx) : trigger
      const triggerParam = colonIdx > -1 ? trigger.slice(colonIdx + 1) : null

      const triggerHandler = this._triggers.get(triggerName)
      if (!triggerHandler) continue

      const cleanup = triggerHandler(el, () => this._activateEffects(el), triggerParam)

      if (cleanup) {
        const existing = this._triggerCleanups.get(el)
        if (existing) {
          // Chain cleanups
          const prev = existing
          this._triggerCleanups.set(el, () => { prev(); cleanup() })
        } else {
          this._triggerCleanups.set(el, cleanup)
        }
      }
    }
  },

  _activateEffects(el) {
    el.setAttribute('data-effect-active', '')
    this.emit(el, 'vb:phase-change', { active: true })

    const instances = this._instances.get(el)
    if (!instances) return

    for (const [, instance] of instances) {
      if (instance.activate) instance.activate()
    }
  },

  _cleanupElement(el) {
    const instances = this._instances.get(el)
    if (instances) {
      for (const [, instance] of instances) {
        if (instance.cleanup) instance.cleanup()
      }
      this._instances.delete(el)
    }

    const triggerCleanup = this._triggerCleanups.get(el)
    if (triggerCleanup) {
      triggerCleanup()
      this._triggerCleanups.delete(el)
    }
  },

  _reconcileEffects(el) {
    const newEffects = el.getAttribute('data-effect')?.split(/\s+/).filter(Boolean) || []
    const instances = this._instances.get(el)

    // Clean up removed effects
    if (instances) {
      for (const [name, instance] of instances) {
        if (!newEffects.includes(name)) {
          if (instance.cleanup) instance.cleanup()
          instances.delete(name)
        }
      }
    }

    // Init new effects
    for (const name of newEffects) {
      if (!instances?.has(name)) {
        this._initEffect(el, name)
      }
    }

    // Re-wire trigger if needed
    if (!el.hasAttribute('data-effect-processed')) {
      el.setAttribute('data-effect-processed', '')
      this._wireTrigger(el, newEffects)
    }
  },

  _reconcileTrigger(el) {
    // Clean up old trigger
    const cleanup = this._triggerCleanups.get(el)
    if (cleanup) {
      cleanup()
      this._triggerCleanups.delete(el)
    }

    // Re-wire
    const effectNames = el.getAttribute('data-effect')?.split(/\s+/).filter(Boolean) || []
    this._wireTrigger(el, effectNames)
  },

  _processStagger(el) {
    const mode = el.getAttribute('data-stagger') || ''
    const children = el.children
    const n = children.length

    // Compute the index array based on mode, then assign.
    let indices
    if (mode === 'reverse') {
      indices = Array.from({ length: n }, (_, i) => n - 1 - i)
    } else if (mode === 'random') {
      // Fisher-Yates shuffle seeded by element id/uid for stable replay.
      const seed = this._hashString(this.uid(el))
      indices = Array.from({ length: n }, (_, i) => i)
      let s = seed
      for (let i = n - 1; i > 0; i--) {
        // xorshift32 for a deterministic pseudo-random index.
        s ^= s << 13; s ^= s >>> 17; s ^= s << 5
        const j = Math.abs(s) % (i + 1)
        ;[indices[i], indices[j]] = [indices[j], indices[i]]
      }
    } else if (mode === 'grid') {
      // Manhattan distance from top-left corner using each child's
      // computed grid-row / grid-column. Children outside a CSS grid
      // fall back to their DOM order.
      const positions = []
      for (let i = 0; i < n; i++) {
        const cs = getComputedStyle(children[i])
        const r = parseInt(cs.gridRowStart, 10)
        const c = parseInt(cs.gridColumnStart, 10)
        positions.push({
          i,
          dist: Number.isFinite(r) && Number.isFinite(c)
            ? (r - 1) + (c - 1)
            : i,
        })
      }
      positions.sort((a, b) => a.dist - b.dist)
      indices = new Array(n)
      positions.forEach((p, rank) => { indices[p.i] = rank })
    } else {
      // Default: linear DOM order.
      indices = Array.from({ length: n }, (_, i) => i)
    }

    for (let i = 0; i < n; i++) {
      children[i].style.setProperty('--vb-stagger-index', String(indices[i]))
    }
  },

  /** Simple 32-bit string hash used to seed the random stagger mode. */
  _hashString(s) {
    let h = 5381
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i)
    return h | 0
  },

  _processTransition(el) {
    if (el.hasAttribute('data-transition-processed')) return
    el.setAttribute('data-transition-processed', '')

    const transitionAttr = el.getAttribute('data-transition')
    if (!transitionAttr) return

    // Mirror the trigger parser: split on first colon for parametric
    // transitions like `effect:fade` or `slide:left`.
    const colonIdx = transitionAttr.indexOf(':')
    const transitionName = colonIdx > -1 ? transitionAttr.slice(0, colonIdx) : transitionAttr
    const transitionParam = colonIdx > -1 ? transitionAttr.slice(colonIdx + 1) : null

    const handler = this._transitions.get(transitionName)
    if (handler) {
      const cleanup = handler(el, transitionParam)
      if (cleanup) this._transitionCleanups.set(el, cleanup)
    } else {
      // Default behavior: auto-assign view-transition-name from the
      // whole attribute (so legacy `data-transition="foo"` still works).
      el.style.viewTransitionName = `${transitionAttr}-${this.uid(el)}`
    }
  },

  _cleanupTransition(el) {
    const cleanup = this._transitionCleanups.get(el)
    if (cleanup) {
      cleanup()
      this._transitionCleanups.delete(el)
    }
    el.style.viewTransitionName = ''
  },
}

// Expose globally for non-module scripts and DevTools console
if (typeof window !== 'undefined') window.VB = VB

export { VB }
