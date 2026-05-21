/**
 * Analytics event auto-wire — Vanilla Breeze
 *
 * Subscribes to the Tier 1 / Tier 2 custom events VB components emit and
 * forwards them through Analytics.track() with normalised names and minimal
 * payloads. Event names here are verified against the live components.
 *
 * See `admin/plans/analytics/analytics-spec.md` Tier 1/2 tables.
 */

import { Analytics } from '../lib/analytics.js';

// Pull a safe prop off a CustomEvent.detail without reaching into raw user
// input. For `filter`, strip the value and send length + has-value instead.

// State-broadcast events (theme/extensions/a11y) are fired by multiple
// components (theme-picker + settings-panel) from their #applyExtensions()
// methods when restoring stored prefs on mount. That produces duplicate
// events with identical payloads. Dedup by serialised detail so only
// genuine state transitions are forwarded.
const STATE_DEDUP_WINDOW_MS = 1000;
const lastSeen = new Map();

function dedupByDetail(eventName, handler) {
  return (e) => {
    const key = JSON.stringify(e.detail ?? null);
    const prev = lastSeen.get(eventName);
    const now = Date.now();
    if (prev && prev.key === key && now - prev.at < STATE_DEDUP_WINDOW_MS) return;
    lastSeen.set(eventName, { key, at: now });
    handler(e);
  };
}

const TIER_1 = {
  'vb:submit':              (e) => Analytics.track('form.submit_valid', { formId: e.detail?.formId }),
  'wizard:step-change':     (e) => Analytics.track('form.wizard_step',   { from: e.detail?.from, to: e.detail?.to, direction: e.detail?.direction }),
  'wizard:complete':        (e) => Analytics.track('form.wizard_complete', { steps: e.detail?.steps }),
  'wizard:reset':           ( ) => Analytics.track('form.wizard_reset'),
  'data-table:sort':        (e) => Analytics.track('table.sort',         { column: e.detail?.column, direction: e.detail?.direction, columnName: e.detail?.columnName }),
  'data-table:filter':      (e) => Analytics.track('table.filter',       { column: e.detail?.column, hasValue: !!e.detail?.value, length: e.detail?.value?.length ?? 0 }),
  'data-table:page':        (e) => Analytics.track('table.paginate',     { page: e.detail?.page }),
  'vb:theme-change':        dedupByDetail('vb:theme-change',       (e) => Analytics.track('ui.theme_change',    { theme: e.detail?.brand ?? e.detail?.theme, mode: e.detail?.mode })),
  'vb:a11y-themes-change':  dedupByDetail('vb:a11y-themes-change', (e) => Analytics.track('ui.a11y_theme',      { themes: e.detail })),
  'vb:extensions-change':   dedupByDetail('vb:extensions-change',  (e) => Analytics.track('ui.extension_toggle',{ extensions: e.detail })),
  'heading-links:navigate': (e) => Analytics.track('docs.anchor_navigate',{ id: e.detail?.id }),
  'page-toc:navigate':      (e) => Analytics.track('docs.toc_navigate',  { id: e.detail?.id }),
  'site-search:open':       ( ) => Analytics.track('search.open'),
  'site-search:close':      (e) => Analytics.track('search.close',       { hasQuery: e.detail?.hasQuery }),
  'theme-composer:change':  (e) => Analytics.track('theme.compose',      { dimension: e.detail?.dimension, source: e.detail?.source, token: e.detail?.token }),
};

const TIER_2 = {
  'accordion-wc:toggle':    (e) => Analytics.track('ui.accordion_toggle',{ open: e.detail?.open, index: e.detail?.index }),
  'tab-set:change':         (e) => Analytics.track('ui.tab_change',      { tab: e.detail?.tab }),
  'carousel-wc:change':     (e) => Analytics.track('ui.carousel_slide',  { index: e.detail?.index }),
  'carousel-wc:play':       ( ) => Analytics.track('ui.carousel_play'),
  'carousel-wc:pause':      ( ) => Analytics.track('ui.carousel_pause'),
  'data-table:expand':      (e) => Analytics.track('table.row_expand',   { row: e.detail?.row }),
  'data-table:selection':   (e) => Analytics.track('table.row_select',   { count: e.detail?.count ?? e.detail?.rows?.length ?? 0 }),
  'theme-picker:open':      ( ) => Analytics.track('ui.theme_picker_open'),
  'theme-picker:close':     ( ) => Analytics.track('ui.theme_picker_close'),
  // Design-system tooling events
  'color-palette:select':   (e) => Analytics.track('palette.color_select',  { name: e.detail?.name, index: e.detail?.index }),
  'color-palette:change':   (e) => Analytics.track('palette.color_edit',    { name: e.detail?.name, index: e.detail?.index }),
  'semantic-palette:change':(e) => Analytics.track('palette.semantic_change',{ role: e.detail?.role }),
  'token-specimen:change':  (e) => Analytics.track('tokens.edit',           { token: e.detail?.token }),
  'spacing-specimen:change':(e) => Analytics.track('tokens.spacing_edit',   { token: e.detail?.token }),
  'type-specimen:change':   (e) => Analytics.track('tokens.type_edit',      { token: e.detail?.token }),
  'theme-export:change':    (e) => Analytics.track('theme.export_format',   { format: e.detail?.format }),
};

function subscribe(map) {
  for (const [eventName, handler] of Object.entries(map)) {
    // window for events bubbling off document.documentElement (theme manager),
    // document for everything else — components bubble to document by default.
    const target = eventName.startsWith('vb:theme-change')
      || eventName === 'vb:a11y-themes-change'
      || eventName === 'vb:extensions-change'
      ? window
      : document;
    target.addEventListener(eventName, handler);
  }
}

/** Wire the Tier 1 + Tier 2 event catalog. Call once after Analytics.init(). */
export function wireAnalyticsEvents({ tiers = ['tier1', 'tier2'] } = {}) {
  if (tiers.includes('tier1')) subscribe(TIER_1);
  if (tiers.includes('tier2')) subscribe(TIER_2);
}
