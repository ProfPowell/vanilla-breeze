/**
 * Analytics — Vanilla Breeze
 *
 * First-party, cookieless, privacy-first analytics runtime. Normalises VB
 * events and `data-vb-event` declarative tracking into a single envelope
 * and ships them via sendBeacon to a same-origin endpoint.
 *
 * See `admin/plans/analytics/analytics-spec.md` (v0.4) for the full spec.
 *
 * @example
 * import { Analytics } from './lib/analytics.js';
 *
 * Analytics.init({
 *   endpoint: '/api/analytics',
 *   siteId: 'vb-docs',
 *   transport: 'beacon',            // 'beacon' | 'console' | 'disabled'
 *   sampleRate: 1,
 *   consent: () => true,            // app consent gate
 *   context: () => ({ build: '1.2.0' }),
 *   urlMasks: [{ pattern: /^\/users\/[^/]+/, replace: '/users/*' }],
 * });
 *
 * Analytics.track('docs.anchor_navigate', { id: 'api-reference' });
 */

// ── Opt-out ──────────────────────────────────────────────────────────
// Priority: sessionStorage opt-out > GPC > DNT > app consent function.

/**
 * Every opt-out signal, evaluated independently. `isOptedOut` and
 * `getStatus()` both derive from this so the panel can never disagree with
 * the gate that actually drops events.
 * @param {{ consent?: (() => boolean) | null } | null} config
 * @returns {{ user: boolean, gpc: boolean, dnt: boolean, consent: boolean }}
 */
function readOptOutSignals(config) {
  let user = false;
  try {
    user = sessionStorage.getItem('vb_optout') === '1';
  } catch { /* sessionStorage unavailable — treat as opt-in */ }

  let consent = false;
  if (typeof config?.consent === 'function') {
    try { consent = config.consent() === false; } catch { consent = true; }
  }

  return {
    user,
    gpc: navigator.globalPrivacyControl === true,
    dnt: navigator.doNotTrack === '1',
    consent,
  };
}

/**
 * First opt-out signal that applies, in gate priority order.
 * @param {{ consent?: (() => boolean) | null } | null} config
 * @returns {'user'|'gpc'|'dnt'|'consent'|null}
 */
function optOutReason(config) {
  const s = readOptOutSignals(config);
  if (s.user) return 'user';
  if (s.gpc) return 'gpc';
  if (s.dnt) return 'dnt';
  if (s.consent) return 'consent';
  return null;
}

function isOptedOut(config) {
  return optOutReason(config) !== null;
}

function isExcludedElement(el) {
  return el?.closest?.('[data-vb-no-track]') != null;
}

// ── Context ──────────────────────────────────────────────────────────

function readHtmlDataset() {
  const { dataset } = document.documentElement;
  const context = {};
  for (const key of Object.keys(dataset)) {
    const value = dataset[key];
    if (value != null && value !== '') context[key] = value;
  }
  return context;
}

/** vb:* metas that configure runtime behaviour and must not ride on events. */
const NON_TAXONOMY_META = new Set(['track-history', 'track-history-params', 'no-track-history']);

function readTaxonomy() {
  /** @type {Record<string, string | string[]>} */
  const taxonomy = {};
  for (const meta of document.querySelectorAll('meta[name^="vb:"]')) {
    const key = meta.getAttribute('name')?.slice(3);
    const val = meta.getAttribute('content')?.trim();
    // Runtime switches (history tracking) are configuration, not taxonomy.
    if (key && NON_TAXONOMY_META.has(key)) continue;
    if (key && val) taxonomy[key] = val;
  }
  /* meta-tag-contract v1.1: SKOS concept ids ride alongside the vb:*
     namespace as repeated <meta name="concept"> tags. Collect into an
     array so a single page tagged with multiple concepts ships every
     id with its event envelope. */
  const concepts = [];
  for (const meta of document.querySelectorAll('meta[name="concept"]')) {
    const val = meta.getAttribute('content')?.trim();
    if (val) concepts.push(val);
  }
  if (concepts.length) taxonomy.concepts = concepts;
  return taxonomy;
}

// ── URL masking ──────────────────────────────────────────────────────

/**
 * Rewrite sensitive path segments (user IDs, draft hashes, query strings)
 * before the beacon is sent. Applied client-side so the server never sees
 * the original URL. The first matching mask wins — order patterns from
 * most specific to least specific.
 *
 * @param {string} path - `location.pathname + location.search`
 * @param {Array<{pattern: RegExp, replace: string}>|null} [masks]
 * @returns {string} Rewritten path (or original if nothing matched).
 */
export function maskUrl(path, masks) {
  if (!masks?.length) return path;
  for (const { pattern, replace } of masks) {
    if (pattern.test(path)) return path.replace(pattern, replace);
  }
  return path;
}

// ── Transport ────────────────────────────────────────────────────────

function sendBeacon(url, payload) {
  const body = JSON.stringify(payload);
  if (typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon(url, blob)) return true;
  }
  // keepalive fallback so the request survives page unload
  try {
    fetch(url, { method: 'POST', body, keepalive: true,
                 headers: { 'content-type': 'application/json' } });
    return true;
  } catch { return false; }
}

// ── Internal state ───────────────────────────────────────────────────

/**
 * @typedef {object} AnalyticsConfig
 * @property {string} endpoint
 * @property {string} siteId
 * @property {'beacon'|'console'|'disabled'} transport
 * @property {number} sampleRate
 * @property {(() => boolean)|null} consent
 * @property {(() => Record<string, unknown> | null | undefined)|null} context
 * @property {Array<{pattern: RegExp, replace: string}>|null} urlMasks
 * @property {boolean} autoPageView
 * @property {boolean} autoOutboundLinks
 * @property {boolean} autoDeclarative
 * @property {boolean} allowInIframe
 */

/** @type {{ config: AnalyticsConfig | null, queue: Array<{ kind: string, envelope: object }> }} */
const state = {
  config: null,
  queue: [],
};

/** Read-only counters for `getStatus()`. Per page load (module state). */
const stats = {
  /** Requests handed to sendBeacon/fetch by the 'beacon' transport. */
  sent: 0,
  /** Envelopes written to the console by the 'console' transport. */
  logged: 0,
  /** True when init() switched the runtime off because it is in an iframe. */
  iframeDisabled: false,
};

/* Per-component CDN chunks each bundle their own copy of this module, so a
   standalone <analytics-panel> chunk would otherwise see an uninitialised
   runtime. The instance that init()s publishes itself here; readers use
   getAnalyticsRuntime(). */
const RUNTIME_KEY = Symbol.for('vanilla-breeze.analytics');

/** Event fired on `document` when status-relevant state changes. */
export const ANALYTICS_STATUS_EVENT = 'vb:analytics-status';

function notifyStatus() {
  try {
    document.dispatchEvent(new CustomEvent(ANALYTICS_STATUS_EVENT));
  } catch { /* no document (SSR/tests) */ }
}

function getEndpoint(kind) {
  const base = state.config?.endpoint ?? '/api/analytics';
  return `${base.replace(/\/+$/, '')}/${kind}`;
}

function buildEnvelope(name, props) {
  const cfg = state.config;
  if (!cfg) throw new Error('analytics: buildEnvelope called before init');
  const path = maskUrl(location.pathname + location.search, cfg.urlMasks);
  const extra = typeof cfg.context === 'function' ? (cfg.context() ?? {}) : {};
  return {
    name,
    ts: Date.now(),
    site: cfg.siteId,
    path,
    referrer: document.referrer || '',
    context: { ...readHtmlDataset(), ...readTaxonomy(), ...extra },
    props: props ?? {},
  };
}

function dispatch(kind, envelope) {
  const cfg = state.config;
  if (!cfg) return false;

  if (cfg.transport === 'disabled') return false;

  if (cfg.transport === 'console') {
    // Dev visibility — clearly namespaced so it's easy to spot/filter.
    // Use console.log so events show under the default console filter
    // (console.debug is hidden unless "Verbose" is enabled in Chrome).
    console.log('%c[vb:analytics]', 'color:#0aa;font-weight:600', kind, envelope);
    stats.logged++;
    notifyStatus();
    return true;
  }

  const ok = sendBeacon(getEndpoint(kind), envelope);
  if (ok) { stats.sent++; notifyStatus(); }
  return ok;
}

function shouldSample() {
  const rate = state.config?.sampleRate ?? 1;
  return rate >= 1 ? true : Math.random() < rate;
}

// ── Page view ────────────────────────────────────────────────────────

let lastPath = null;

function trackPageView() {
  if (!state.config) return;
  if (isOptedOut(state.config)) return;
  if (document.documentElement.hasAttribute('data-vb-no-track')) return;
  if (!shouldSample()) return;

  const path = location.pathname + location.search;
  if (path === lastPath) return; // SPA debounce guard
  lastPath = path;

  dispatch('hit', buildEnvelope('page.view', {}));
}

// SPA navigation: wrap pushState + listen to popstate with a short debounce.
function watchNavigation() {
  let debounceId;
  const schedule = () => {
    clearTimeout(debounceId);
    debounceId = setTimeout(trackPageView, 100); // Rybbit pattern
  };
  const origPush = history.pushState.bind(history);
  history.pushState = function (...args) { origPush(...args); schedule(); };
  const origReplace = history.replaceState.bind(history);
  history.replaceState = function (...args) { origReplace(...args); schedule(); };
  window.addEventListener('popstate', schedule);
}

// ── Declarative events (data-vb-event) ───────────────────────────────

/**
 * @param {HTMLElement} el
 * @returns {Record<string, unknown>}
 */
function extractDeclarativeProps(el) {
  /** @type {Record<string, unknown>} */
  const props = {};
  for (const [key, value] of Object.entries(el.dataset)) {
    if (key === 'vbEvent' || !key.startsWith('vbEvent')) continue;
    // `data-vb-event-plan` → dataset `vbEventPlan` → `plan`
    const propName = key.slice('vbEvent'.length).replace(/^./, c => c.toLowerCase());
    props[propName] = value;
  }
  return props;
}

/** @param {Event} e */
function handleDocumentClick(e) {
  if (!state.config || isOptedOut(state.config)) return;
  const eventTarget = /** @type {Element | null} */ (e.target);
  const target = /** @type {HTMLElement | null} */ (eventTarget?.closest?.('[data-vb-event]'));
  if (!target || isExcludedElement(target)) return;
  const name = target.dataset.vbEvent;
  if (!name) return;
  Analytics.track(name, extractDeclarativeProps(target));
}

// ── Outbound link instrumentation ────────────────────────────────────

function instrumentOutboundLinks() {
  const anchors = /** @type {NodeListOf<HTMLAnchorElement>} */ (document.querySelectorAll('a[href^="http"]'));
  for (const link of anchors) {
    if (link.hostname === location.hostname) continue;
    if (isExcludedElement(link)) continue;
    if (link.hasAttribute('data-vb-analytics-wired')) continue;

    const siteId = encodeURIComponent(state.config?.siteId ?? 'default');
    const pingUrl = `${getEndpoint('click')}?site=${siteId}&from=${encodeURIComponent(location.pathname)}`;
    if (!link.hasAttribute('ping')) link.setAttribute('ping', pingUrl);

    link.addEventListener('click', () => {
      if (isOptedOut(state.config)) return;
      // sendBeacon fallback — ping is disabled in Firefox/Brave by default.
      const ua = navigator.userAgent;
      if (/Firefox|Brave/.test(ua)) {
        dispatch('click', buildEnvelope('link.outbound', {
          to: link.hostname,
          href: link.href,
        }));
      }
    });

    link.setAttribute('data-vb-analytics-wired', '');
  }
}

// ── Lifecycle flush ──────────────────────────────────────────────────

function flush() {
  if (!state.queue.length) return;
  const batch = state.queue.splice(0);
  dispatch('events', { site: state.config?.siteId, events: batch });
}

function onHidden() {
  if (document.visibilityState === 'hidden') flush();
}

// ── Public API ───────────────────────────────────────────────────────

const defaults = {
  endpoint: '/api/analytics',
  siteId: 'default',
  transport: 'disabled',
  sampleRate: 1,
  consent: null,
  context: null,
  urlMasks: null,
  autoPageView: true,
  autoOutboundLinks: true,
  autoDeclarative: true,
  /** Allow analytics inside iframes. Default false so sandboxed demos
   *  embedded via <browser-window> / <iframe> don't spam events. */
  allowInIframe: false,
};

function isInIframe() {
  try { return window.top !== window.self; } catch { return true; }
}

export const Analytics = {
  /**
   * Initialise the analytics runtime. Safe to call once per page load.
   * @param {Partial<typeof defaults>} config
   */
  init(config = {}) {
    if (state.config) return; // idempotent
    const cfg = /** @type {AnalyticsConfig} */ ({ ...defaults, ...config });
    state.config = cfg;
    if (!globalThis[RUNTIME_KEY]) globalThis[RUNTIME_KEY] = Analytics;
    queueMicrotask(notifyStatus);

    // Sandboxed demos embedded via iframe should not report analytics —
    // every page-view beacon would be a demo load, not a real visit.
    // Callers that *do* want analytics inside an iframe set allowInIframe.
    if (isInIframe() && !cfg.allowInIframe) {
      stats.iframeDisabled = true;
      cfg.transport = 'disabled';
      cfg.autoPageView = false;
      cfg.autoOutboundLinks = false;
      cfg.autoDeclarative = false;
      return;
    }

    // Transport 'disabled' means no backend — skip the outbound link
    // ping wiring so external clicks don't POST to a 404 endpoint.
    if (cfg.transport === 'disabled') {
      cfg.autoOutboundLinks = false;
    }

    if (cfg.autoDeclarative) {
      document.addEventListener('click', handleDocumentClick, { capture: true });
    }
    if (cfg.autoOutboundLinks) {
      instrumentOutboundLinks();
      // Re-scan when DOM changes (SPA, dynamically injected links)
      const mo = new MutationObserver(() => instrumentOutboundLinks());
      mo.observe(document.body, { childList: true, subtree: true });
    }
    if (cfg.autoPageView) {
      trackPageView();
      watchNavigation();
    }

    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', flush);
  },

  /**
   * Record a normalised analytics event.
   * @param {string} name e.g. 'form.submit_valid'
   * @param {Record<string, unknown>} [props]
   */
  track(name, props = {}) {
    if (!state.config) return;
    if (isOptedOut(state.config)) return;
    if (!shouldSample()) return;
    dispatch('hit', buildEnvelope(name, props));
  },

  /** Force-flush any buffered events. */
  flush,

  /**
   * Toggle opt-out for this session. `false` writes `vb_optout=1` to
   * sessionStorage; `true` removes it. Other consent signals (GPC/DNT/app)
   * are not affected.
   */
  setConsent(granted) {
    try {
      if (granted) sessionStorage.removeItem('vb_optout');
      else sessionStorage.setItem('vb_optout', '1');
    } catch { /* sessionStorage unavailable — no-op */ }
    notifyStatus();
  },

  /**
   * Read-only snapshot of what the runtime is doing right now — for
   * visitor-facing transparency UI such as `<analytics-panel>`. Never
   * changes state and never sends anything.
   *
   * - `active`: events can leave this page (initialised, transport is
   *   'beacon' or 'console', no opt-out signal).
   * - `reason`: the first opt-out signal in gate order; `signals` has them
   *   all, so UI can tell when lifting the user opt-out would not be enough.
   * - `sent` / `logged` / `queued`: counts for this page load only. Outbound
   *   link `ping` requests are sent by the browser and are not counted.
   * - `collects` / `preview`: the envelope the runtime would build for an
   *   event on this page right now (after URL masking), so UI can list the
   *   actual fields and values rather than a hardcoded description.
   *   `null` when not initialised.
   */
  getStatus() {
    const cfg = state.config;
    const signals = readOptOutSignals(cfg);
    const reason = optOutReason(cfg);
    let preview = null;
    if (cfg) {
      try { preview = buildEnvelope('page.view', {}); } catch { preview = null; }
    }
    const transport = cfg?.transport ?? null;
    return {
      initialized: cfg != null,
      active: cfg != null && transport !== 'disabled' && reason === null,
      optedOut: reason !== null,
      reason,
      signals,
      transport,
      inIframe: stats.iframeDisabled,
      endpoint: cfg ? getEndpoint('hit') : null,
      siteId: cfg?.siteId ?? null,
      sampleRate: cfg?.sampleRate ?? null,
      outboundLinks: cfg?.autoOutboundLinks ?? false,
      queued: state.queue.length,
      sent: stats.sent,
      logged: stats.logged,
      collects: preview ? Object.keys(preview) : [],
      contextKeys: preview ? Object.keys(preview.context) : [],
      preview,
    };
  },

  /** Read-only view of the resolved config, for tests and docs. */
  get config() {
    return state.config ? { ...state.config } : null;
  },
};

/**
 * The runtime instance that was actually initialised on this page, falling
 * back to this module's own copy. Use from code that may be bundled
 * separately from the entry that called `Analytics.init()`.
 * @returns {typeof Analytics}
 */
export function getAnalyticsRuntime() {
  return globalThis[RUNTIME_KEY] ?? Analytics;
}
