/**
 * Analytics — Vanilla Breeze
 *
 * First-party, cookieless, privacy-first analytics runtime. Normalises VB
 * events and `data-vb-event` declarative tracking into a single envelope
 * and ships them via sendBeacon to a same-origin endpoint.
 *
 * See `admin/r-n-d/analytics/analytics-spec.md` (v0.4) for the full spec.
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

function isOptedOut(config) {
  try {
    if (sessionStorage.getItem('vb_optout') === '1') return true;
  } catch { /* sessionStorage unavailable — treat as opt-in */ }

  if (navigator.globalPrivacyControl === true) return true;
  if (navigator.doNotTrack === '1') return true;

  if (typeof config.consent === 'function') {
    try { return config.consent() === false; } catch { return true; }
  }
  return false;
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

function readTaxonomy() {
  const taxonomy = {};
  for (const meta of document.querySelectorAll('meta[name^="vb:"]')) {
    const key = meta.getAttribute('name').slice(3);
    const val = meta.getAttribute('content')?.trim();
    if (key && val) taxonomy[key] = val;
  }
  return taxonomy;
}

// ── URL masking ──────────────────────────────────────────────────────

function maskUrl(path, masks) {
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

const state = {
  config: null,
  queue: [],
};

function getEndpoint(kind) {
  const base = state.config?.endpoint ?? '/api/analytics';
  return `${base.replace(/\/+$/, '')}/${kind}`;
}

function buildEnvelope(name, props) {
  const cfg = state.config;
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
    // eslint-disable-next-line no-console
    console.log('%c[vb:analytics]', 'color:#0aa;font-weight:600', kind, envelope);
    return true;
  }

  return sendBeacon(getEndpoint(kind), envelope);
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

function extractDeclarativeProps(el) {
  const props = {};
  for (const [key, value] of Object.entries(el.dataset)) {
    if (key === 'vbEvent' || !key.startsWith('vbEvent')) continue;
    // `data-vb-event-plan` → dataset `vbEventPlan` → `plan`
    const propName = key.slice('vbEvent'.length).replace(/^./, c => c.toLowerCase());
    props[propName] = value;
  }
  return props;
}

function handleDocumentClick(e) {
  if (!state.config || isOptedOut(state.config)) return;
  const target = e.target.closest?.('[data-vb-event]');
  if (!target || isExcludedElement(target)) return;
  const name = target.dataset.vbEvent;
  if (!name) return;
  Analytics.track(name, extractDeclarativeProps(target));
}

// ── Outbound link instrumentation ────────────────────────────────────

function instrumentOutboundLinks() {
  const anchors = document.querySelectorAll('a[href^="http"]');
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
};

export const Analytics = {
  /**
   * Initialise the analytics runtime. Safe to call once per page load.
   * @param {Partial<typeof defaults>} config
   */
  init(config = {}) {
    if (state.config) return; // idempotent
    state.config = { ...defaults, ...config };

    if (state.config.autoDeclarative) {
      document.addEventListener('click', handleDocumentClick, { capture: true });
    }
    if (state.config.autoOutboundLinks) {
      instrumentOutboundLinks();
      // Re-scan when DOM changes (SPA, dynamically injected links)
      const mo = new MutationObserver(() => instrumentOutboundLinks());
      mo.observe(document.body, { childList: true, subtree: true });
    }
    if (state.config.autoPageView) {
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
  },

  /** Read-only view of the resolved config, for tests and docs. */
  get config() {
    return state.config ? { ...state.config } : null;
  },
};
