/**
 * lazy-guards — the single source of truth for entry-point lazy loading.
 *
 * Every JS entry point (main.js, main-core.js, main-autoload.js) used to carry
 * its own hand-written list of
 *
 *   if (document.querySelector(SEL)) import('./some-init.js');
 *
 * lines. Three copies of the same data drift, and drift here is silent: a guard
 * missing from an entry ships the enhancement DEAD on every page that loads
 * that entry, with no error anywhere. That is exactly how the page-watch button
 * shipped broken on vanilla-breeze.com (fixed 2026-07-13) — the trigger was
 * guarded in main.js and main-autoload.js but not in main-core.js, which is
 * what the production docs site loads. An audit then found ~17 more enhancers
 * in the same state.
 *
 * So the table lives here once, and every entry derives its guards from it.
 * The import specifiers stay literal inside arrow functions so esbuild can
 * still statically resolve (and defer evaluation of) each module.
 *
 * ## Tiers are two files, not a flag
 *
 * This file holds the CORE guards, which every entry runs. The extras-tier
 * guards live in lazy-guards-full.js, which only the full and autoload entries
 * import.
 *
 * That split has to be at module level. esbuild bundles these entries without
 * code splitting, so a dynamic import() is inlined into the bundle and merely
 * deferred in *evaluation* — the bytes ship either way. A single table with a
 * `tier` field checked at runtime would therefore still pull markdown editing,
 * emoji data and annotation highlights into the slim bundle (measured: +36 KB
 * gzip on vanilla-breeze-core.js) to then never run them. Two modules, one
 * importing the other, is what actually keeps them out.
 *
 * A guard belongs in the full tier when its module is heavy and only meaningful
 * next to extras-tier markup. Everything else belongs here: the cost is one
 * querySelector per guard at boot.
 *
 * ## Redundant-looking guards are deliberate
 *
 * ~20 of these modules are ALSO statically imported by web-components/core.js,
 * so their guard never does anything today. They stay in the table because the
 * table describes selector → module for the whole framework: if a barrel ever
 * drops a static import, the guard keeps the feature alive instead of silently
 * killing it. A querySelector that matches nothing is not a cost worth
 * optimising.
 *
 * ## Selector accuracy
 *
 * Where the target module registers itself with `registerInit(SELECTOR, …)`,
 * the guard selector below must be that same SELECTOR. main.js used to guard
 * `[data-floating-label]` while the module only enhances
 * `form-field[data-floating-label]`, so the module was fetched and evaluated
 * for markup it would never touch. tests/unit/bundle-parity.test.js asserts the
 * two agree.
 */

/**
 * @typedef {object} LazyGuard
 * @property {string} selector - Presence of a match triggers the import.
 * @property {() => Promise<unknown>} load - Literal dynamic import.
 */

/**
 * Guards every entry point runs, including the slim core bundle.
 *
 * @type {readonly LazyGuard[]}
 */
export const CORE_GUARDS = /** @type {const} */ ([
  // ── Interaction / behaviour libraries ──────────────────────────────────
  { selector: '[data-wizard]', load: () => import('./wizard.js') },
  { selector: '[data-gesture]', load: () => import('./vb-gestures.js') },
  { selector: '[data-keyboard-aware]', load: () => import('./vb-forms.js') },
  { selector: '[data-focus-trap]', load: () => import('../utils/focus-trap-init.js') },
  { selector: '[data-scroll-hide]', load: () => import('../utils/scroll-hide-init.js') },
  { selector: '[data-spotlight]', load: () => import('../utils/spotlight-init.js') },
  { selector: '[data-splitter]', load: () => import('../utils/splitter-init.js') },
  { selector: '[data-back-to-top]', load: () => import('../utils/back-to-top-init.js') },
  { selector: '[data-hotkey]:not(kbd)', load: () => import('../utils/hotkey-action-init.js') },

  // ── Links, navigation, page services ───────────────────────────────────
  { selector: 'a[target="_blank"]', load: () => import('../utils/links-init.js') },
  { selector: '[data-watch-page], watch-wc', load: () => import('../utils/page-watch-init.js') },
  { selector: 'img[data-responsive]', load: () => import('../utils/responsive-init.js') },

  // ── Form field enhancements ────────────────────────────────────────────
  { selector: 'form-field[data-floating-label]', load: () => import('../utils/floating-label-init.js') },
  { selector: 'button[data-loading]', load: () => import('../utils/loading-button-init.js') },
  { selector: 'input[data-mask]', load: () => import('../utils/mask-init.js') },
  { selector: 'input[data-accept]', load: () => import('../utils/accept-init.js') },
  { selector: 'input[type="file"][data-upload]', load: () => import('../utils/upload-init.js') },
  { selector: 'input[type="range"][data-range]', load: () => import('../utils/range-init.js') },
  { selector: 'input[type="number"][data-stepper]', load: () => import('../utils/number-init.js') },
  { selector: 'input[type="checkbox"][data-switch]', load: () => import('../utils/switch-init.js') },
  { selector: 'textarea[data-grow]', load: () => import('../utils/textarea-grow-init.js') },
  { selector: 'textarea[data-count]', load: () => import('../utils/textarea-count-init.js') },
  { selector: 'fieldset[data-toggle-tags][data-max]', load: () => import('../utils/toggle-tags-init.js') },
  { selector: 'form[data-autosave]', load: () => import('../utils/autosave-init.js') },
  { selector: 'form[data-vb-email-form]', load: () => import('../utils/email-form-init.js') },
  { selector: 'form[data-vb-newsletter-form]', load: () => import('../utils/newsletter-form-init.js') },

  // ── Content utilities ──────────────────────────────────────────────────
  { selector: '[data-copy], [data-copy-target], [data-paste-target]', load: () => import('../utils/copy-init.js') },
  { selector: '[data-select-all]', load: () => import('../utils/select-all-init.js') },
  { selector: '[data-show-when], [data-hide-when]', load: () => import('../utils/conditional-init.js') },
  { selector: '[data-spoiler]', load: () => import('../utils/spoiler-init.js') },
  { selector: '[data-math], code.language-math', load: () => import('../utils/math-init.js') },
  { selector: 'time[data-format-date]', load: () => import('../utils/format-date-init.js') },
  { selector: 'data[data-format-number]', load: () => import('../utils/format-number-init.js') },
  { selector: 'data[data-format-bytes]', load: () => import('../utils/format-bytes-init.js') },

  // ── Collection upscales (pagination / sorting / toggling) ──────────────
  { selector: '[data-paged]', load: () => import('../utils/data-paged-init.js') },
  { selector: '[data-sortable], [data-sort-target]', load: () => import('../utils/data-sortable-init.js') },
  { selector: '[data-toggle]', load: () => import('../utils/data-toggle-init.js') },
]);

/**
 * Fire a set of guards against the current document.
 *
 * Guards are evaluated once, at entry-point boot. Modules that also need to
 * catch markup injected later register themselves with the shared
 * MutationObserver in utils/_init-registry.js once loaded.
 *
 * @param {readonly LazyGuard[]} guards
 * @param {Document | Element} [root=document] - Scope to query.
 * @returns {void}
 */
export function runGuards(guards, root = document) {
  for (const guard of guards) {
    if (root.querySelector(guard.selector)) guard.load();
  }
}

/**
 * Run the core-tier guards. Called by src/main-core.js.
 *
 * @param {Document | Element} [root=document]
 * @returns {void}
 */
export function runCoreGuards(root = document) {
  runGuards(CORE_GUARDS, root);
}
