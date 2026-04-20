/**
 * analytics-panel: Self-serve view of analytics data stored on the device
 *
 * Shows the user exactly what Vanilla Breeze analytics has captured about
 * their current browsing session — no hand-waving about "anonymous data".
 * Provides Pause / Resume toggle and Clear actions.
 *
 * Standalone by design. The original spec placed this inside
 * <settings-panel>, but <settings-panel> doesn't expose a slot API yet.
 * This component works wherever it's placed — the /stats/ page, a
 * dedicated /privacy/ page, or eventually slotted into <settings-panel>.
 *
 * @attr {string} title - Override the heading text (default: "Analytics data")
 * @attr {boolean} compact - Tighter layout for embedding alongside other UI
 *
 * @fires analytics-panel:cleared - After session data is cleared
 * @fires analytics-panel:optout  - User paused analytics this session
 * @fires analytics-panel:optin   - User resumed analytics this session
 *
 * @example
 * <analytics-panel></analytics-panel>
 *
 * @example
 * <analytics-panel title="Your data" compact></analytics-panel>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const SESSION_KEYS = {
  optout:       'vb_optout',
  sessionCount: 'vb_sc',
  eventQueue:   'vb_q',
};

function escape(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function formatMs(ms) {
  if (typeof ms !== 'number' || ms <= 0) return '—';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

class AnalyticsPanel extends VBElement {
  setup() {
    this.#render();
    this.listen(this, 'click', this.#handleClick);
  }

  // ── Functional reads ─────────────────────────────────────────────

  get isOptedOut() {
    try { return sessionStorage.getItem(SESSION_KEYS.optout) === '1'; }
    catch { return false; }
  }

  get sessionCounter() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEYS.sessionCount);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  get queuedEvents() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEYS.eventQueue);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  get hasSessionData() {
    return this.sessionCounter != null || this.queuedEvents.length > 0;
  }

  // ── Imperative shell ─────────────────────────────────────────────

  #handleClick = (e) => {
    const target = e.target?.closest?.('[data-analytics-action]');
    if (!target || !this.contains(target)) return;
    const action = target.dataset.analyticsAction;
    if (action === 'clear')   this.#clearData();
    if (action === 'optout')  this.#toggleOptOut();
    if (action === 'refresh') this.#render();
  };

  #clearData() {
    try {
      sessionStorage.removeItem(SESSION_KEYS.sessionCount);
      sessionStorage.removeItem(SESSION_KEYS.eventQueue);
    } catch { /* ignore */ }
    this.dispatchEvent(new CustomEvent('analytics-panel:cleared', {
      bubbles: true, composed: true,
    }));
    this.#render();
  }

  #toggleOptOut() {
    const optingOut = !this.isOptedOut;
    try {
      if (optingOut) sessionStorage.setItem(SESSION_KEYS.optout, '1');
      else sessionStorage.removeItem(SESSION_KEYS.optout);
    } catch { /* ignore */ }

    this.dispatchEvent(new CustomEvent(
      optingOut ? 'analytics-panel:optout' : 'analytics-panel:optin',
      { bubbles: true, composed: true },
    ));

    if (optingOut) this.#clearData(); // also wipes + re-renders
    else this.#render();
  }

  // ── Render ───────────────────────────────────────────────────────

  #render() {
    const title = this.getAttribute('title') || 'Analytics data';
    const optout = this.isOptedOut;
    const hasData = this.hasSessionData;

    this.innerHTML = `
      <header class="analytics-panel__header">
        <h3>${escape(title)}</h3>
        <p class="analytics-panel__status" role="status">
          <span class="analytics-panel__dot analytics-panel__dot--${optout ? 'paused' : 'active'}" aria-hidden="true"></span>
          ${optout
            ? 'Analytics paused for this tab. No data is being collected.'
            : 'Analytics active. Only aggregate, device-scoped data is collected.'}
        </p>
      </header>

      <section class="analytics-panel__body">
        <h4>Stored on this device (this session only)</h4>
        ${this.#renderData()}
      </section>

      <footer class="analytics-panel__actions">
        ${hasData ? `
          <button type="button" data-analytics-action="clear" class="analytics-panel__action analytics-panel__action--danger">
            Clear my data
          </button>
        ` : ''}
        <button type="button" data-analytics-action="optout" class="analytics-panel__action analytics-panel__action--toggle">
          ${optout ? 'Resume analytics' : 'Pause analytics'}
        </button>
        <button type="button" data-analytics-action="refresh" class="analytics-panel__action">
          Refresh
        </button>
      </footer>

      <p class="analytics-panel__note">
        No cookies, no cross-site identifiers, no IP address stored.
        Data is cleared automatically when you close this tab.
      </p>
    `;
  }

  #renderData() {
    if (!this.hasSessionData) {
      return `<p class="analytics-panel__empty">No data stored on this device in this session.</p>`;
    }

    const sc = this.sessionCounter;
    const q  = this.queuedEvents;
    const scrollEv    = q.find(e => e?.id === '__scroll');
    const attentionEv = q.find(e => e?.id === '__attention');
    const customCount = q.filter(e => !e?.id?.startsWith?.('__')).length;

    const rows = [];
    if (sc?.v != null) {
      rows.push(`<dt>Pages this session</dt><dd>${sc.v}</dd>`);
    }
    if (scrollEv) {
      rows.push(`<dt>Max scroll depth</dt><dd>${scrollEv.params?.depth ?? '?'}%</dd>`);
    }
    if (attentionEv) {
      rows.push(`<dt>Active reading time</dt><dd>${formatMs(attentionEv.params?.ms)}</dd>`);
    }
    if (customCount > 0) {
      rows.push(`<dt>Queued events</dt><dd>${customCount}</dd>`);
    }

    return `<dl class="analytics-panel__data">${rows.join('')}</dl>`;
  }
}

registerComponent('analytics-panel', AnalyticsPanel);
