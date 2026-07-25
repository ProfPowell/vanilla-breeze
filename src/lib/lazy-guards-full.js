/**
 * lazy-guards-full — extras-tier half of the entry-point guard table.
 *
 * See lazy-guards.js for what the table is and why it exists. The short
 * version: the core tier lives there, this file adds the guards that only the
 * full and autoload entries should ship, and FULL_GUARDS is the union.
 *
 * The split is a module boundary rather than a runtime flag because esbuild
 * builds these entries without code splitting: every dynamic import() reachable
 * from a bundle is inlined into it, deferred in evaluation but not in download.
 * Keeping the heavy guards in a separate module is the only thing that keeps
 * them out of vanilla-breeze-core.js (worth ~24 KB gzip).
 *
 * A guard belongs here when its module is heavy AND only meaningful next to
 * extras-tier markup — the markdown stack, emoji data, annotation highlights,
 * the command bus, and the prototyping fillers. A core-only page has no
 * <markdown-editor> and no <emoji-picker>, so those guards would only ever cost
 * it bytes.
 */

import { CORE_GUARDS, runGuards } from './lazy-guards.js';

/** @typedef {import('./lazy-guards.js').LazyGuard} LazyGuard */

/**
 * Guards the full and autoload entries add on top of the core tier.
 *
 * @type {readonly LazyGuard[]}
 */
export const EXTRAS_GUARDS = /** @type {const} */ ([
  { selector: '[data-emoji]', load: () => import('../utils/emoji-init.js') },
  { selector: '[data-highlights]', load: () => import('../utils/highlights-init.js') },
  { selector: '[data-command], [commandfor]', load: () => import('../utils/command-init.js') },
  { selector: '[data-markdown-editable]', load: () => import('../utils/markdown-editable-init.js') },
  {
    selector: 'markdown-viewer[data-auto-mermaid], markdown-editor[data-auto-mermaid]',
    load: () => import('./markdown-mermaid-bridge.js'),
  },
  { selector: ':is(img, video, iframe, canvas)[data-mock]', load: () => import('../utils/mock-init.js') },
  { selector: '[data-lorem]', load: () => import('../utils/lorem-init.js') },
]);

/**
 * Every guard, in tier order.
 *
 * @type {readonly LazyGuard[]}
 */
export const FULL_GUARDS = [...CORE_GUARDS, ...EXTRAS_GUARDS];

/**
 * Run the full guard set. Called by src/main.js and src/main-autoload.js.
 *
 * @param {Document | Element} [root=document]
 * @returns {void}
 */
export function runFullGuards(root = document) {
  runGuards(FULL_GUARDS, root);
}
