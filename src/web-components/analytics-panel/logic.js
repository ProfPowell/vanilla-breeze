/**
 * analytics-panel: Visitor-facing view of what Vanilla Breeze analytics is
 * doing on this page — whether it is running, why it is off, and which
 * fields an event actually carries.
 *
 * Everything shown comes from the live runtime via `Analytics.getStatus()`;
 * nothing is hardcoded. Pause / Resume goes through `Analytics.setConsent()`,
 * the same session opt-out the runtime's gate checks. When Global Privacy
 * Control, Do Not Track or the site's consent callback keep analytics off,
 * Resume is unavailable and the panel says why.
 *
 * Renders its DOM once; later updates change text and attributes in place,
 * so the activated button keeps focus and the single role="status" region
 * announces each change.
 *
 * @attr {string} title - Override the heading text (default: "Analytics on this page")
 * @attr {boolean} compact - Tighter layout for embedding alongside other UI
 * @attr {string} data-state - Reflected, read-only: active | debug | paused | off
 * @attr {string} data-reason - Reflected, read-only: why analytics is off
 *   (user | gpc | dnt | consent | disabled | iframe | uninitialized)
 *
 * @fires analytics-panel:optout - User paused analytics for this tab
 * @fires analytics-panel:optin  - User resumed analytics for this tab
 *
 * @example
 * <analytics-panel></analytics-panel>
 *
 * @example
 * <analytics-panel title="Your data" compact></analytics-panel>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { getAnalyticsRuntime, ANALYTICS_STATUS_EVENT } from '../../lib/analytics.js';

const DEFAULT_TITLE = 'Analytics on this page';

const SIGNAL_LABELS = {
  gpc: 'your browser sends a Global Privacy Control signal',
  dnt: 'your browser sends Do Not Track',
  consent: 'this site has not been given consent to collect analytics',
};

/**
 * Pure: derive the panel's view model from a runtime status snapshot.
 * @param {ReturnType<typeof import('../../lib/analytics.js').Analytics.getStatus> | null} s
 * @returns {{ state: 'active'|'debug'|'paused'|'off', reason: string | null, text: string }}
 */
export function describeStatus(s) {
  if (!s || !s.initialized) {
    return { state: 'off', reason: 'uninitialized',
             text: 'Off. The analytics runtime is not running on this page, so nothing is sent.' };
  }
  if (s.inIframe) {
    return { state: 'off', reason: 'iframe',
             text: 'Off. Analytics does not run inside embedded frames, so nothing is sent.' };
  }
  if (s.reason === 'user') {
    return { state: 'paused', reason: 'user',
             text: 'Paused for this tab. Nothing is being sent.' };
  }
  if (s.reason) {
    const why = SIGNAL_LABELS[s.reason];
    return { state: 'off', reason: s.reason,
             text: `Off because ${why}. Nothing is sent.` };
  }
  if (s.transport === 'disabled') {
    return { state: 'off', reason: 'disabled',
             text: 'Off. This site has analytics switched off, so nothing is sent.' };
  }
  if (s.transport === 'console') {
    return { state: 'debug', reason: null,
             text: 'Debug mode. Events are written to this browser’s console, not sent anywhere.' };
  }
  const sampled = typeof s.sampleRate === 'number' && s.sampleRate < 1
    ? ` (a ${Math.round(s.sampleRate * 100)}% sample)` : '';
  return { state: 'active', reason: null,
           text: `Active. Events from this page are sent to ${s.endpoint}${sampled}.` };
}

/** Names of the opt-out signals Resume cannot override. */
function forcedSignals(s) {
  if (!s?.signals) return [];
  return ['gpc', 'dnt', 'consent'].filter(k => s.signals[k]);
}

class AnalyticsPanel extends VBElement {
  static get observedAttributes() { return ['title']; }

  /** @type {Record<string, HTMLElement>} */
  #parts = {};

  setup() {
    if (!this.#parts.status || !this.contains(this.#parts.status)) {
      this.#build();
    }
    this.listen(this, 'click', this.#handleClick);
    this.listen(document, ANALYTICS_STATUS_EVENT, () => this.refresh());
    this.refresh();
  }

  attributeChangedCallback(name) {
    if (name === 'title' && this.#parts.title) {
      this.#parts.title.textContent = this.getAttribute('title') || DEFAULT_TITLE;
    }
  }

  /** Current runtime status snapshot (null if the runtime has no getStatus). */
  get status() {
    const rt = getAnalyticsRuntime();
    return typeof rt?.getStatus === 'function' ? rt.getStatus() : null;
  }

  // ── Imperative shell ─────────────────────────────────────────────

  #handleClick = (e) => {
    const target = e.target?.closest?.('[data-analytics-action]');
    if (!target || !this.contains(target)) return;
    if (target.getAttribute('aria-disabled') === 'true') return;
    const action = target.dataset.analyticsAction;
    if (action === 'toggle')  this.#toggle();
    if (action === 'refresh') this.refresh();
  };

  #toggle() {
    const pausing = !this.status?.signals?.user;
    getAnalyticsRuntime().setConsent(!pausing);
    this.dispatchEvent(new CustomEvent(
      pausing ? 'analytics-panel:optout' : 'analytics-panel:optin',
      { bubbles: true, composed: true },
    ));
    this.refresh();
  }

  // ── DOM ──────────────────────────────────────────────────────────

  #build() {
    const uid = `analytics-panel-${Math.random().toString(36).slice(2, 8)}`;
    this.innerHTML = `
      <header class="analytics-panel__header">
        <h3 data-part="title"></h3>
        <p class="analytics-panel__status" role="status">
          <span class="analytics-panel__dot" aria-hidden="true"></span>
          <span data-part="status"></span>
        </p>
      </header>

      <section class="analytics-panel__body" aria-labelledby="${uid}-fields">
        <h4 id="${uid}-fields">What an event from this page contains</h4>
        <dl class="analytics-panel__data" data-part="data"></dl>
        <p class="analytics-panel__empty" data-part="empty" hidden></p>
      </section>

      <footer class="analytics-panel__actions">
        <button type="button" data-analytics-action="toggle" data-part="toggle"
                class="analytics-panel__action analytics-panel__action--toggle"></button>
        <button type="button" data-analytics-action="refresh" class="analytics-panel__action">Refresh</button>
        <p class="analytics-panel__hint" id="${uid}-hint" data-part="hint" hidden></p>
      </footer>

      <p class="analytics-panel__note">
        No cookies and no visitor ID. The only thing stored on this device is
        the pause setting, kept in this tab&rsquo;s session storage until you
        close it. Events already sent are stored on the server without an
        identifier, so they cannot be looked up or deleted from here. The
        server records your country from the request; your IP address is not
        stored.
      </p>
    `;
    for (const el of /** @type {NodeListOf<HTMLElement>} */ (this.querySelectorAll('[data-part]'))) {
      this.#parts[el.dataset.part ?? ''] = el;
    }
    this.#parts.title.textContent = this.getAttribute('title') || DEFAULT_TITLE;
  }

  /** Re-read the runtime and update the panel in place. */
  refresh() {
    if (!this.#parts.status) return;
    const s = this.status;
    const view = describeStatus(s);
    const p = this.#parts;

    this.setAttribute('data-state', view.state);
    if (view.reason) this.setAttribute('data-reason', view.reason);
    else this.removeAttribute('data-reason');

    // Only touch the live region when the message changes, so it announces
    // real changes and stays quiet on a no-op Refresh.
    if (p.status.textContent !== view.text) p.status.textContent = view.text;

    this.#renderData(s);

    // Toggle: reflects the session opt-out flag the button controls.
    const userPaused = Boolean(s?.signals?.user);
    const forced = forcedSignals(s);
    const label = userPaused ? 'Resume analytics' : 'Pause analytics';
    if (p.toggle.textContent !== label) p.toggle.textContent = label;
    p.toggle.setAttribute('aria-pressed', String(userPaused));

    // Resume cannot override GPC / DNT / consent. Use aria-disabled (not
    // `disabled`) so the button keeps focus after Pause flips its label.
    const resumeBlocked = userPaused && forced.length > 0;
    if (resumeBlocked) p.toggle.setAttribute('aria-disabled', 'true');
    else p.toggle.removeAttribute('aria-disabled');

    if (forced.length) {
      const why = forced.map(k => SIGNAL_LABELS[k]).join(' and ');
      p.hint.textContent = userPaused
        ? `Resume is unavailable because ${why}.`
        : `Analytics stays off because ${why}; pausing as well changes nothing.`;
      p.hint.hidden = false;
      p.toggle.setAttribute('aria-describedby', p.hint.id);
    } else {
      p.hint.textContent = '';
      p.hint.hidden = true;
      p.toggle.removeAttribute('aria-describedby');
    }
  }

  #renderData(s) {
    const { data, empty } = this.#parts;
    if (!s?.initialized || !s.preview) {
      data.hidden = true;
      data.replaceChildren();
      empty.hidden = false;
      empty.textContent = 'Nothing to show: the analytics runtime has not started on this page.';
      return;
    }
    empty.hidden = true;
    data.hidden = false;

    /** @type {Array<[string, string]>} */
    const rows = [
      ['Fields', s.collects.join(', ')],
      ['Page path', s.preview.path],
      ['Referrer', s.preview.referrer || '(none)'],
      ['Page context', s.contextKeys.length ? s.contextKeys.join(', ') : '(none)'],
    ];
    if (s.transport === 'beacon') {
      rows.push(['Sent to', s.endpoint]);
      rows.push(['Sent from this page', String(s.sent)]);
    } else if (s.transport === 'console') {
      rows.push(['Logged on this page', String(s.logged)]);
    }
    if (s.queued > 0) rows.push(['Waiting to send', String(s.queued)]);
    if (s.outboundLinks) rows.push(['Outbound link clicks', 'Reported (site, page path, destination)']);

    const frag = document.createDocumentFragment();
    for (const [term, value] of rows) {
      const dt = document.createElement('dt');
      dt.textContent = term;
      const dd = document.createElement('dd');
      dd.textContent = value;
      frag.append(dt, dd);
    }
    data.replaceChildren(frag);
  }
}

registerComponent('analytics-panel', AnalyticsPanel);
