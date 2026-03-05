/**
 * Bundle Registry — Vanilla Breeze
 *
 * Provides infrastructure for modular bundles to register effects,
 * components, and activate full bundles at runtime.
 */

// ─── Effect registry ─────────────────────────────────────────────────────────

const effects = new Map()
let observer = null
const reducedMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)')

function startObserver() {
  if (observer) return
  observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue
        matchEffects(node)
        node.querySelectorAll?.('*').forEach(matchEffects)
      }
      for (const node of mutation.removedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue
        unmatchEffects(node)
        node.querySelectorAll?.('*').forEach(unmatchEffects)
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

function matchEffects(el) {
  for (const [, def] of effects) {
    if (el.matches?.(def.selector)) {
      if (reducedMotionMq.matches && def.reducedMotionFallback) {
        def.reducedMotionFallback(el)
      } else {
        def.init(el)
      }
    }
  }
}

function unmatchEffects(el) {
  for (const [, def] of effects) {
    if (el.matches?.(def.selector) && def.destroy) {
      def.destroy(el)
    }
  }
}

/**
 * Register a DOM effect that auto-initializes on matching elements.
 *
 * @param {string} name - Unique effect name
 * @param {{ selector: string, init: (el: Element) => void, destroy?: (el: Element) => void, reducedMotionFallback?: (el: Element) => void }} def
 */
export function registerEffect(name, def) {
  effects.set(name, def)

  // Initialize on existing matching elements
  document.querySelectorAll(def.selector).forEach(el => {
    if (reducedMotionMq.matches && def.reducedMotionFallback) {
      def.reducedMotionFallback(el)
    } else {
      def.init(el)
    }
  })

  // Start shared observer lazily
  if (document.body) {
    startObserver()
  } else {
    document.addEventListener('DOMContentLoaded', startObserver, { once: true })
  }
}

// ─── Component registry ──────────────────────────────────────────────────────

const components = new Map()

/**
 * Register a custom element with priority-based conflict resolution.
 * First-wins at equal priority. Higher priority wins over lower.
 *
 * @param {string} tag - Custom element tag name
 * @param {typeof HTMLElement} impl - The element class
 * @param {{ bundle?: string, contract?: string, priority?: number }} [opts]
 */
export function registerComponent(tag, impl, opts = {}) {
  const priority = opts.priority ?? 10
  const meta = { impl, bundle: opts.bundle, contract: opts.contract, priority }

  const existing = components.get(tag)

  if (customElements.get(tag)) {
    // Already defined in the browser — cannot redefine
    if (!existing || existing.priority >= priority) {
      if (existing && existing.priority === priority && existing.impl !== impl) {
        console.warn(
          `[VB Bundle] Tag <${tag}> already registered by "${existing.bundle}" (priority ${existing.priority}). Skipping "${opts.bundle}".`
        )
      }
      return
    }
    // Higher priority but can't redefine — warn
    console.warn(
      `[VB Bundle] Tag <${tag}> defined by "${existing.bundle}" cannot be replaced (customElements.define is permanent). "${opts.bundle}" has higher priority but arrived late.`
    )
    return
  }

  if (existing && existing.priority >= priority) {
    if (existing.priority === priority) {
      console.warn(
        `[VB Bundle] Tag <${tag}> already registered by "${existing.bundle}". Skipping "${opts.bundle}" (first wins at equal priority).`
      )
    }
    return
  }

  components.set(tag, meta)
  customElements.define(tag, impl)
}

/**
 * Activate a full bundle by loading its CSS and JS from the CDN path.
 * Convention: cdn/bundles/{name}.full.css and cdn/bundles/{name}.full.js
 *
 * @param {string} bundleName
 * @param {{ basePath?: string }} [opts]
 * @returns {Promise<void>}
 */
export async function activateBundle(bundleName, opts = {}) {
  const base = opts.basePath ?? '/cdn/bundles'

  // Load CSS
  const cssHref = `${base}/${bundleName}.full.css`
  if (!document.querySelector(`link[href="${cssHref}"]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = cssHref
    await new Promise((resolve, reject) => {
      link.onload = resolve
      link.onerror = () => reject(new Error(`Failed to load bundle CSS: ${cssHref}`))
      document.head.appendChild(link)
    })
  }

  // Load JS
  const jsSrc = `${base}/${bundleName}.full.js`
  await import(jsSrc)
}
