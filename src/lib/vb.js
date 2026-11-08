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

/**
 * One VB per document. Two bundles that both include this module (extras.js
 * and the effects pack share five effects; a page can legitimately load
 * both) used to create two VB objects with two registries and two observers,
 * so an element could be activated twice or, if its effect was registered in
 * the copy whose observer never ran, not at all. The first copy to evaluate
 * owns the instance; later copies register into it (6xxy).
 */
const VB_SINGLETON_KEY = '__vbEffectsRuntime'
/** @type {any} */
const g = globalThis

const VB = g[VB_SINGLETON_KEY] ?? {
  _effects: new Map(),
  _triggers: new Map(),
  _transitions: new Map(),
  _instances: new WeakMap(),    // el → Map<effectName, { activate, cleanup }>
  _triggerCleanups: new WeakMap(), // el → cleanup function
  _wiredTriggers: new WeakMap(),   // el → Set<triggerName> already wired
  _transitionCleanups: new WeakMap(), // el → cleanup function
  _transitionFallback: new WeakSet(), // els named before their handler registered
  // Processed state lives in WeakSets, never in DOM attributes: an attribute
  // is copied by cloneNode() and survives a remove + reinsert, which left
  // clones with no trigger and clones of [data-transition] elements with a
  // duplicate view-transition-name (that aborts every view transition).
  _processed: new WeakSet(),           // [data-effect] els already wired
  _transitionProcessed: new WeakSet(), // [data-transition] els already named
  _staggerTime: new WeakSet(),         // [data-stagger] els whose --vb-stagger we set
  /** @type {Set<Element>} els with a data-trigger value that has no handler (yet) */
  _unresolved: new Set(),
  /** @type {Set<string>} unknown trigger names already warned about */
  _warnedTriggers: new Set(),
  /** @type {any} */
  _unresolvedTimer: null,
  _keyframePhase: KEYFRAME_PHASE,
  /** @type {MutationObserver | null} */
  _observer: null,
  /** @type {((e: AnimationEvent) => void) | null} */
  _animationEndHandler: null,
  /** Set once the module has scheduled observe() for this document. */
  _autoBooted: false,

  /**
   * Register an effect handler.
   * Handler receives (el) and returns { activate(), cleanup() } or just cleanup().
   * If it returns nothing, that's fine too (CSS-only effects).
   */
  effect(name, handler) {
    this._effects.set(name, handler)
    // Initialize on existing matching elements. The observer self-boots when
    // this module evaluates, so elements are usually processed before the
    // effect modules register: an element that already activated (no
    // trigger) gets its activate() now, otherwise the JS half never runs.
    document.querySelectorAll('[data-effect]').forEach(el => {
      const names = (el.getAttribute('data-effect') || '').split(/\s+/)
      if (!names.includes(name)) return
      const fresh = !this._instances.get(el)?.has(name)
      this._initEffect(el, name)
      if (fresh && el.hasAttribute('data-effect-active')) {
        this._instances.get(el)?.get(name)?.activate?.()
      }
    })
  },

  /**
   * Register a trigger handler.
   * Handler receives (el, activate) and returns a cleanup function.
   *
   * Same late-registration rule as effect(): elements processed before this
   * trigger existed (the self-booted observer runs before vb-triggers.js
   * evaluates) are wired now. Without this, every data-trigger="scroll"
   * element on a built page sat at opacity 0 forever.
   */
  trigger(name, handler) {
    this._triggers.set(name, handler)
    document.querySelectorAll('[data-effect][data-trigger]').forEach(el => {
      if (!this._processed.has(el)) return
      const effectNames = el.getAttribute('data-effect')?.split(/\s+/).filter(Boolean) || []
      this._wireTrigger(el, effectNames)
    })
  },

  /**
   * Register a transition handler for data-transition.
   * Handler receives (el, param) and should set view-transition-name.
   * Returns a cleanup function.
   *
   * Same late-registration rule as effect() and trigger(): the self-booted
   * runtime processes [data-transition] before vb-transitions.js registers
   * the presets, so those elements took the unnamed fallback and never got
   * their view-transition-class (vanilla-breeze-4rgo). Re-run them now.
   */
  transition(name, handler) {
    this._transitions.set(name, handler)
    document.querySelectorAll('[data-transition]').forEach(el => {
      if (!this._transitionProcessed.has(el) || !this._transitionFallback.has(el)) return
      const attr = el.getAttribute('data-transition') || ''
      const colonIdx = attr.indexOf(':')
      if ((colonIdx > -1 ? attr.slice(0, colonIdx) : attr) !== name) return
      this._transitionFallback.delete(el)
      const target = /** @type {HTMLElement} */ (el)
      target.style.viewTransitionName = ''
      const cleanup = handler(el, colonIdx > -1 ? attr.slice(colonIdx + 1) : null)
      if (cleanup) this._transitionCleanups.set(el, cleanup)
    })
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
      // Containers whose children changed: re-index [data-stagger] once per
      // batch, after the per-node work (children added later got no index).
      // (data-transition="stagger" watches its own children in its handler.)
      const restagger = new Set()
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const parent = /** @type {Element} */ (mutation.target)
          if (parent.hasAttribute?.('data-stagger')) restagger.add(parent)
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue
            this._processTree(node)
          }
          for (const node of mutation.removedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue
            // A node removed and re-inserted in the same batch (an effect
            // wrapping its own element, a list reorder) is a move, not a
            // removal: the callback runs after both, so it is connected
            // again here. Cleaning it up would undo the effect's own DOM.
            if (node.isConnected) continue
            this._cleanupTree(node)
          }
        }
        if (mutation.type === 'attributes') {
          const el = /** @type {Element} */ (mutation.target)
          if (mutation.attributeName === 'data-effect') {
            this._reconcileEffects(el)
          }
          if (mutation.attributeName === 'data-trigger') {
            this._reconcileTrigger(el)
          }
          if (mutation.attributeName === 'data-stagger') {
            if (el.hasAttribute('data-stagger')) restagger.add(el)
            else this._cleanupStagger(el)
          }
          if (mutation.attributeName === 'data-transition') {
            this._reconcileTransition(el)
          }
        }
      }
      for (const el of restagger) if (el.isConnected) this._processStagger(el)
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
   * Stop observing: disconnects the MutationObserver and the delegated
   * animationend listener. Effect instances and trigger wiring on elements
   * already in the page are left as they are (they are cleaned up when their
   * element is removed while the observer runs).
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
    if (this._processed.has(el)) return
    this._processed.add(el)
    // Stale copies from cloneNode() (or markup saved from a live page): the
    // legacy processed flag, and an armed pre-state that this element's own
    // trigger has not earned yet. _wireTrigger re-arms it in the same task.
    el.removeAttribute('data-effect-processed')
    el.removeAttribute('data-effect-armed')

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

    // Reduced motion is the handler's call (VB.prefersReducedMotion()); the
    // CSS reduced-motion rule already snaps every slot animation to its end.
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

  /**
   * Split a trigger token at its FIRST colon: `time:2000` → ['time', '2000'],
   * `media:(min-width:60rem)` keeps the query's own colon.
   * @param {string} token
   * @returns {[string, string | null]}
   */
  _parseTrigger(token) {
    const i = token.indexOf(':')
    return i > -1 ? [token.slice(0, i), token.slice(i + 1)] : [token, null]
  },

  _wireTrigger(el, effectNames) {
    const triggerAttr = el.getAttribute('data-trigger')

    if (!triggerAttr || !triggerAttr.trim()) {
      // No trigger — activate immediately for JS effects
      el.removeAttribute('data-effect-armed')
      this._activateEffects(el)
      return
    }

    const triggerNames = triggerAttr.split(/\s+/).filter(Boolean)
    this._wiredTriggers ??= new WeakMap()
    let wired = this._wiredTriggers.get(el)
    if (!wired) {
      wired = new Set()
      this._wiredTriggers.set(el, wired)
    }

    let missing = false
    for (const trigger of triggerNames) {
      if (wired.has(trigger)) continue
      // Parse trigger name and optional parameter (e.g. "time:2000")
      const [triggerName, triggerParam] = this._parseTrigger(trigger)

      const triggerHandler = this._triggers.get(triggerName)
      if (!triggerHandler) { missing = true; continue } // trigger() wires it later
      wired.add(trigger)

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

    // The hidden entrance pre-state is gated on this marker, so content is
    // only hidden once something is actually going to reveal it. No JS, an
    // unknown or not-yet-loaded trigger, or an unprocessed clone all leave
    // the element visible.
    if (wired.size) el.setAttribute('data-effect-armed', '')

    if (missing) {
      this._unresolved.add(el)
      this._scheduleUnresolvedCheck()
    } else {
      this._unresolved.delete(el)
    }
  },

  /**
   * After the page has loaded (every module, pack and author script has had
   * its chance to call VB.trigger()), warn once per unknown trigger name and
   * activate elements none of whose triggers could be wired, so JS effects
   * that hide their own content until activation (reveal, typewriter…) still
   * show it.
   */
  _scheduleUnresolvedCheck() {
    if (this._unresolvedTimer) return
    const run = () => {
      this._unresolvedTimer = null
      this._resolveUnknownTriggers()
    }
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return
    if (document.readyState === 'complete') {
      this._unresolvedTimer = setTimeout(run, 0)
    } else {
      this._unresolvedTimer = true
      window.addEventListener('load', () => setTimeout(run, 0), { once: true })
    }
  },

  _resolveUnknownTriggers() {
    for (const el of [...this._unresolved]) {
      this._unresolved.delete(el)
      if (!el.isConnected || !this._processed.has(el)) continue
      const tokens = (el.getAttribute('data-trigger') || '').split(/\s+/).filter(Boolean)
      const missing = tokens.filter(t => !this._triggers.has(this._parseTrigger(t)[0]))
      if (!missing.length) continue
      for (const token of missing) {
        const name = this._parseTrigger(token)[0]
        if (this._warnedTriggers.has(name)) continue
        this._warnedTriggers.add(name)
        console.warn(`[VB] data-trigger="${token}": no trigger named "${name}" is registered. The effect runs immediately instead. Register it with VB.trigger('${name}', …) or check the spelling.`, el)
      }
      if (!el.hasAttribute('data-effect-armed') && !el.hasAttribute('data-effect-active')) {
        this._activateEffects(el)
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
    this._wiredTriggers?.delete(el)
    this._unresolved.delete(el)
    el.removeAttribute('data-effect-armed')
    // The instances are gone, so let _processElement initialise the element
    // again if it is reinserted (otherwise every effect stays inert after a
    // real remove + reinsert).
    this._processed.delete(el)
  },

  _reconcileEffects(el) {
    if (!el.hasAttribute('data-effect')) {
      // Attribute removed: undo everything the runtime did to the element.
      this._cleanupElement(el)
      el.removeAttribute('data-effect-active')
      return
    }
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

    // First time this element has an effect: wire its trigger
    if (!this._processed.has(el)) this._processElement(el)
  },

  _reconcileTrigger(el) {
    if (!el.hasAttribute('data-effect')) return
    // Clean up old trigger
    const cleanup = this._triggerCleanups.get(el)
    if (cleanup) {
      cleanup()
      this._triggerCleanups.delete(el)
    }
    this._wiredTriggers?.delete(el)
    this._unresolved.delete(el)
    el.removeAttribute('data-effect-armed')

    if (!this._processed.has(el)) { this._processElement(el); return }
    // Re-wire
    const effectNames = el.getAttribute('data-effect')?.split(/\s+/).filter(Boolean) || []
    this._wireTrigger(el, effectNames)
  },

  /**
   * data-stagger="[reverse|random|grid] [<time>]" — tokens in any order.
   * A CSS time (80ms, 0.1s) sets --vb-stagger on the container.
   */
  _parseStagger(value) {
    const tokens = (value || '').trim().split(/\s+/).filter(Boolean)
    const time = tokens.find(t => /^(\d+(\.\d+)?|\.\d+)(ms|s)$/i.test(t)) || null
    const mode = tokens.find(t => t === 'reverse' || t === 'random' || t === 'grid') || ''
    return { mode, time }
  },

  _processStagger(el) {
    const { mode, time } = this._parseStagger(el.getAttribute('data-stagger'))
    if (time) {
      el.style.setProperty('--vb-stagger', time)
      this._staggerTime.add(el)
    } else if (this._staggerTime.has(el)) {
      el.style.removeProperty('--vb-stagger')
      this._staggerTime.delete(el)
    }

    const children = Array.from(el.children)
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
      indices = this._gridStaggerIndices(el, children)
    } else {
      // Default: linear DOM order.
      indices = Array.from({ length: n }, (_, i) => i)
    }

    for (let i = 0; i < n; i++) {
      children[i].style.setProperty('--vb-stagger-index', String(indices[i]))
    }
  },

  /**
   * Grid mode: Manhattan distance (row + column) from the inline-start / top
   * cell, so every cell on the same diagonal shares a delay. Explicit
   * grid-row-start / grid-column-start are used when every child has them;
   * auto-placed items (computed `auto`) are located from their layout boxes
   * instead. Without layout (display:none, no DOM) it falls back to DOM order.
   */
  _gridStaggerIndices(el, children) {
    const n = children.length
    const domOrder = () => Array.from({ length: n }, (_, i) => i)
    if (!n) return []

    const explicit = children.map(child => {
      const cs = getComputedStyle(child)
      return [parseInt(cs.gridRowStart, 10), parseInt(cs.gridColumnStart, 10)]
    })
    if (explicit.every(([r, c]) => Number.isFinite(r) && Number.isFinite(c))) {
      const minR = Math.min(...explicit.map(([r]) => r))
      const minC = Math.min(...explicit.map(([, c]) => c))
      return explicit.map(([r, c]) => (r - minR) + (c - minC))
    }

    const rects = children.map(child => child.getBoundingClientRect?.())
    if (!rects.every(Boolean) || rects.every(r => r.width === 0 && r.height === 0)) return domOrder()
    const rtl = getComputedStyle(el).direction === 'rtl'
    const rows = this._trackRanks(rects.map(r => [r.top, r.bottom]))
    const cols = this._trackRanks(rects.map(r => (rtl ? [-r.right, -r.left] : [r.left, r.right])))
    return rows.map((row, i) => row + cols[i])
  },

  /**
   * Assign each box to a track (row or column) by overlap along one axis.
   * Boxes in one track overlap; the next track starts at or after the
   * shortest box of the current one. Margins (e.g. `li + li` flow spacing)
   * shift a box's start without moving it out of its track.
   * @param {Array<[number, number]>} spans [start, end] per box
   */
  _trackRanks(spans) {
    const order = spans.map((_, i) => i).sort((a, b) => spans[a][0] - spans[b][0])
    const ranks = new Array(spans.length)
    let track = -1
    let trackEnd = -Infinity
    for (const i of order) {
      const [start, end] = spans[i]
      if (start >= trackEnd - 0.5) {
        track++
        trackEnd = end
      } else {
        trackEnd = Math.min(trackEnd, end)
      }
      ranks[i] = track
    }
    return ranks
  },

  _cleanupStagger(el) {
    if (this._staggerTime.has(el)) {
      el.style.removeProperty('--vb-stagger')
      this._staggerTime.delete(el)
    }
    for (const child of Array.from(el.children)) child.style?.removeProperty('--vb-stagger-index')
  },

  /** Simple 32-bit string hash used to seed the random stagger mode. */
  _hashString(s) {
    let h = 5381
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i)
    return h | 0
  },

  /**
   * A valid CSS <custom-ident> for view-transition-name. Characters outside
   * the ident set (colon, space, dot…) become `-`; a leading digit or `--`
   * gets a `vb-` prefix.
   * @param {string} raw
   */
  _vtIdent(raw) {
    let out = String(raw).replace(/[^A-Za-z0-9_ -￿-]/g, '-')
    if (!out || /^(-?\d|--)/.test(out)) out = `vb-${out}`
    return out
  },

  _processTransition(el) {
    if (this._transitionProcessed.has(el)) return
    // On a content-swap host data-transition names the swap effect, which
    // <content-swap> / [data-swap] animate themselves (view-transition-class:
    // content-swap). A preset's inline class would override theirs.
    if (el.matches?.('[data-swap], content-swap')) return

    const transitionAttr = (el.getAttribute('data-transition') || '').trim()
    if (!transitionAttr) return
    this._transitionProcessed.add(el)
    el.removeAttribute('data-transition-processed') // legacy flag on old clones

    // Mirror the trigger parser: split on first colon for parametric
    // transitions like `effect:fade` or `slide:left`.
    const [transitionName, transitionParam] = this._parseTrigger(transitionAttr)

    const handler = this._transitions.get(transitionName)
    if (handler) {
      const cleanup = handler(el, transitionParam)
      if (cleanup) this._transitionCleanups.set(el, cleanup)
    } else {
      // Default behavior: auto-assign a view-transition-name from the NAME
      // (never the param: `effect:fade-vb-4` is not a valid ident and the
      // browser drops it silently). VB.transition() re-runs it with the real
      // handler if that registers later.
      el.style.viewTransitionName = this._vtIdent(`${transitionName}-${this.uid(el)}`)
      this._transitionFallback.add(el)
    }
  },

  _cleanupTransition(el) {
    if (!this._transitionProcessed.has(el)) return
    const cleanup = this._transitionCleanups.get(el)
    if (cleanup) {
      cleanup()
      this._transitionCleanups.delete(el)
    }
    // Only the fallback name is ours to clear; a handler cleanup removes
    // exactly what its handler set (an author inline name survives).
    if (this._transitionFallback.has(el)) {
      this._transitionFallback.delete(el)
      el.style.viewTransitionName = ''
    }
    // Forget it, so a reinserted element (separate task) is named again.
    this._transitionProcessed.delete(el)
  },

  /** data-transition value changed or removed: undo, then apply the new one. */
  _reconcileTransition(el) {
    this._cleanupTransition(el)
    if (el.hasAttribute('data-transition')) this._processTransition(el)
  },
}

g[VB_SINGLETON_KEY] = VB

// Expose globally for non-module scripts and DevTools console. Keep anything
// another module already hung on window.VB (VB.store, VB.service).
if (typeof window !== 'undefined') {
  const prior = /** @type {any} */ (window).VB
  if (prior && prior !== VB) {
    for (const key of Object.keys(prior)) if (!(key in VB)) VB[key] = prior[key]
  }
  window.VB = VB
}

// Self-boot the observer once per document. main.js and main-autoload.js call
// VB.observe() explicitly, but main-core.js never did, so on a core-only page
// (the production docs) an element inserted after load never activated —
// VB.effect() only scans at registration. observe() is idempotent, so the
// explicit calls stay harmless. The observer targets document.body, hence the
// DOMContentLoaded wait when this module evaluates in <head>.
if (typeof document !== 'undefined' && !VB._autoBooted) {
  VB._autoBooted = true
  if (document.body) VB.observe()
  else document.addEventListener('DOMContentLoaded', () => VB.observe(), { once: true })
}

export { VB }
