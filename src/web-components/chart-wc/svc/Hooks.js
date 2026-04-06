/**
 * Lightweight hook/plugin system for SVC chart lifecycle.
 * All hooks are synchronous to support SSR (toString/toFile).
 *
 * Hooks (in lifecycle order):
 *   configResolved - after config defaults applied, before render
 *   beforeRender   - after stats calculated, before DOM construction
 *   afterRender    - after parse + components, before compile
 *   onInteraction  - tooltip/legend event (client-only, skipped in SSR)
 *   onClick        - data point clicked (client-only, skipped in SSR)
 *   onResize       - container resize (client-only, skipped in SSR)
 *   beforeDestroy  - before cleanup
 *
 * @example
 * const plugin = {
 *   name: 'my-plugin',
 *   hooks: {
 *     configResolved({config}) { config.palette = ['red', 'blue']; },
 *     afterRender({structure}) { // modify vDOM },
 *   },
 * };
 * new LineChart({ data, config: { plugins: [plugin] } });
 */

const CLIENT_ONLY_HOOKS = new Set(['onInteraction', 'onResize', 'onClick']);

class Hooks {
  #registry = new Map();

  /**
   * Register a callback for a named hook.
   * @param {string} hookName
   * @param {Function} fn
   */
  register(hookName, fn) {
    if (!this.#registry.has(hookName)) {
      this.#registry.set(hookName, new Set());
    }
    this.#registry.get(hookName).add(fn);
  }

  /**
   * Remove a previously registered callback.
   * @param {string} hookName
   * @param {Function} fn
   */
  unregister(hookName, fn) {
    const hooks = this.#registry.get(hookName);
    if (hooks) hooks.delete(fn);
  }

  /**
   * Run all registered callbacks for a hook synchronously.
   * Client-only hooks are skipped when no DOM is available.
   * @param {string} hookName
   * @param {Object} context - data passed to each callback
   */
  run(hookName, context) {
    if (CLIENT_ONLY_HOOKS.has(hookName) && typeof document === 'undefined') {
      return;
    }
    const hooks = this.#registry.get(hookName);
    if (!hooks) return;
    for (const fn of hooks) {
      fn(context);
    }
  }

  /**
   * Register a plugin object. A plugin has a name and a hooks map.
   * @param {Object} plugin
   * @param {string} plugin.name
   * @param {Object.<string, Function>} plugin.hooks
   */
  registerPlugin(plugin) {
    if (!plugin || !plugin.hooks) return;
    for (const [hookName, fn] of Object.entries(plugin.hooks)) {
      this.register(hookName, fn);
    }
  }

  /**
   * Clear all registrations.
   */
  destroy() {
    this.#registry.clear();
  }
}

export default Hooks;
