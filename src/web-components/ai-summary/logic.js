/**
 * ai-summary: Summarise wrapped content via Chrome's Summarizer API
 *
 * Wraps a block of content (typically an `<article>`) and adds a "Summarize"
 * trigger that produces a streamed summary inline. Conforms to the AI page-
 * tools v1 contract — see admin/specs/ai-page-tools-v1.md.
 *
 * Provider resolution order (per request):
 *   local Chrome Summarizer API → endpoint → fallback-url deep-link → unavailable
 *
 * @attr {string} type            - Summarizer type ('key-points'|'tldr'|'teaser'|'headline'). Default 'key-points'.
 * @attr {string} length          - 'short'|'medium'|'long'. Default 'medium'.
 * @attr {string} format          - 'markdown'|'plain-text'. Default 'markdown'. plain-text output
 *                                  is rendered as text (no markdown-viewer).
 * @attr {string} shared-context  - Optional shared context passed to Summarizer.create().
 * @attr {string} endpoint        - Inline-fallback HTTP URL (POST JSON, streamed text or one-shot JSON).
 * @attr {string} fallback-url    - Deep-link URL template ({prompt}/{url}/{title}/{content} tokens;
 *                                  {content} is the wrapped text, length-capped).
 * @attr {string} fallback-label  - Override trigger label when in deep-link mode.
 * @attr {string} fallback-prompt - Override the default {prompt} text.
 *
 * State attributes (set by component):
 * @attr {string} data-state - One of: checking, ready, downloading, streaming, complete, error, unavailable, deep-link
 *
 * @fires ai-summary:state   - Detail: { state, provider }
 * @fires ai-summary:result  - Detail: { text, provider }
 * @fires ai-summary:error   - Detail: { error }
 *
 * @example
 *   <ai-summary
 *     fallback-url="https://claude.ai/new?q={prompt}"
 *     fallback-label="Read with Claude">
 *     <article>
 *       <h2>Headline</h2>
 *       <p>Body…</p>
 *     </article>
 *   </ai-summary>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { checkAvailability, resolveProvider } from '../../lib/ai/availability.js';
import { extractContextText } from '../../lib/ai/extract.js';
import { expandFallbackURL, usesContentToken } from '../../lib/ai/fallback.js';
import { callEndpoint } from '../../lib/ai/endpoint.js';
import { SUMMARIZER_CHAR_BUDGET, fitToQuota } from '../../lib/ai/budget.js';

const DEFAULT_FALLBACK_PROMPT = 'Summarize this article: {url}';

class AISummary extends VBElement {
  /** @type {HTMLButtonElement | null} */ #button = null;
  /** @type {HTMLElement       | null} */ #status = null;
  /** @type {HTMLElement       | null} */ #output = null;
  /** @type {HTMLButtonElement | null} */ #stop = null;
  /** @type {HTMLElement       | null} */ #notice = null;
  /** @type {AbortController   | null} */ #abortCtl = null;
  /** @type {'local'|'endpoint'|'deep-link'|'unavailable'} */ #provider = 'unavailable';

  setup() {
    this.#renderUI();
    this.#refreshAvailability();
  }

  teardown() {
    this.#abortCtl?.abort();
    this.#abortCtl = null;
  }

  /** Abort the in-flight summary, if any. Same as pressing Stop or Escape. */
  stop() {
    this.#abortCtl?.abort();
  }

  // ── UI ──────────────────────────────────────────────────────────

  #renderUI() {
    // setup() re-runs on every reconnect (VBElement lifecycle), e.g. when the
    // element is moved. Re-bind to the existing UI instead of prepending a
    // second one; listen() handlers were cleaned up on disconnect.
    const existing = this.querySelector(':scope > .ais-ui');
    if (existing) {
      this.#bindUI(/** @type {HTMLElement} */ (existing));
      return;
    }
    const ui = document.createElement('div');
    ui.className = 'ais-ui';
    ui.innerHTML = `
      <div class="ais-controls">
        <button type="button" class="ais-trigger small" disabled>
          <span class="ais-label">Summarize</span>
        </button>
        <button type="button" class="ais-stop small" hidden>Stop</button>
        <span class="ais-status" data-state="checking" role="status">Checking availability…</span>
      </div>
      <p class="ais-notice" role="status" hidden></p>
      <div class="ais-output" hidden aria-live="polite"></div>
    `;
    this.prepend(ui);
    this.#bindUI(ui);
  }

  /** @param {HTMLElement} ui */
  #bindUI(ui) {
    this.#button = /** @type {HTMLButtonElement} */ (ui.querySelector('.ais-trigger'));
    this.#status = /** @type {HTMLElement}        */ (ui.querySelector('.ais-status'));
    this.#output = /** @type {HTMLElement}        */ (ui.querySelector('.ais-output'));
    this.#stop   = /** @type {HTMLButtonElement|null} */ (ui.querySelector('.ais-stop'));
    this.#notice = /** @type {HTMLElement|null}       */ (ui.querySelector('.ais-notice'));
    this.listen(this.#button, 'click', () => this.#run());
    if (this.#stop) this.listen(this.#stop, 'click', () => this.#abortCtl?.abort());
    this.listen(this, 'keydown', (/** @type {KeyboardEvent} */ e) => {
      if (e.key === 'Escape' && this.#abortCtl) {
        e.preventDefault();
        this.#abortCtl.abort();
      }
    });
  }

  // ── Availability + provider resolution ─────────────────────────

  async #refreshAvailability() {
    this.#setState('checking');
    const { state } = await checkAvailability('Summarizer');
    this.#provider = resolveProvider({
      availability: state,
      endpoint: this.getAttribute('endpoint') || undefined,
      fallbackURL: this.getAttribute('fallback-url') || undefined,
    });
    this.#applyProvider(state);
  }

  /** @param {string} availability */
  #applyProvider(availability) {
    if (!this.#button || !this.#status) return;
    this.#setNewTabHint(this.#provider === 'deep-link');

    if (this.#provider === 'local') {
      this.#status.dataset.state = availability;
      this.#status.textContent = ({
        'available':    'Ready (on-device)',
        'downloadable': 'Model available — first run will download',
        'downloading':  'Model downloading…',
      })[availability] ?? availability;
      this.#button.disabled = false;
      this.#button.dataset.provider = 'local';
      this.#setState('ready');
      return;
    }

    if (this.#provider === 'endpoint') {
      this.#status.dataset.state = 'available';
      this.#status.textContent = 'Ready (remote)';
      this.#button.disabled = false;
      this.#button.dataset.provider = 'endpoint';
      this.#setState('ready');
      return;
    }

    if (this.#provider === 'deep-link') {
      this.#status.dataset.state = 'unavailable';
      this.#status.textContent = 'On-device AI unavailable — using deep-link';
      this.#button.disabled = false;
      this.#button.dataset.provider = 'deep-link';
      const label = this.getAttribute('fallback-label') || 'Read elsewhere';
      this.#setLabel(label);
      this.#setState('deep-link');
      return;
    }

    this.#status.dataset.state = 'unavailable';
    this.#status.textContent = 'Summarization not available on this device';
    this.#button.disabled = true;
    this.#button.dataset.provider = 'unavailable';
    this.#setState('unavailable');
  }

  // ── Run ────────────────────────────────────────────────────────

  async #run() {
    if (!this.#button || !this.#output) return;

    if (this.#provider === 'deep-link') {
      window.open(this.#composeDeepLinkURL(), '_blank', 'noopener,noreferrer');
      return;
    }
    if (this.#provider === 'unavailable') return;

    this.#output.hidden = false;
    this.#output.textContent = '';
    this.#hideNotice();
    this.#output.setAttribute('aria-busy', 'true');
    this.#setState('streaming');
    const ctl = new AbortController();
    this.#abortCtl = ctl;
    this.#setBusy(true);

    let result = '';
    try {
      const text = this.#extractContent();
      const stream = this.#provider === 'local'
        ? await this.#localStream(text, ctl.signal)
        : callEndpoint(this.getAttribute('endpoint') || '', {
            prompt: this.#composePrompt(),
            content: text,
            mode: 'summarize',
            signal: ctl.signal,
          });

      // A first local run may have passed through 'downloading'.
      if (this.getAttribute('data-state') !== 'streaming') this.#setState('streaming');

      for await (const chunk of stream) {
        result += chunk;
        this.#output.textContent = result;
      }

      this.#renderResult(result);
      this.#setState('complete');
      this.dispatchEvent(new CustomEvent('ai-summary:result', {
        detail: { text: result, provider: this.#provider },
        bubbles: true,
      }));
    } catch (err) {
      if (err && /** @type {Error} */ (err).name === 'AbortError') {
        // Keep what streamed so far, marked as stopped.
        this.#output.textContent = result ? `${result} (stopped)` : '(stopped)';
        this.#setState('ready');
        return;
      }
      this.#renderError(/** @type {Error} */ (err));
      this.#setState('error');
      this.dispatchEvent(new CustomEvent('ai-summary:error', {
        detail: { error: err },
        bubbles: true,
      }));
    } finally {
      this.#output.removeAttribute('aria-busy');
      if (this.#abortCtl === ctl) this.#abortCtl = null;
      this.#setBusy(false);
    }
  }

  /**
   * Swap the trigger for the Stop button while streaming, moving focus along
   * so keyboard users aren't dropped onto <body> by the disabled trigger.
   * @param {boolean} busy
   */
  #setBusy(busy) {
    if (!this.#button) return;
    const active = document.activeElement;
    this.#button.disabled = busy;
    if (!this.#stop) return;
    this.#stop.hidden = !busy;
    if (busy && active === this.#button) this.#stop.focus();
    else if (!busy && active === this.#stop) this.#button.focus();
  }

  /**
   * @param {string} text
   * @param {AbortSignal} signal
   * @returns {Promise<AsyncIterable<string>>}
   */
  async #localStream(text, signal) {
    // @ts-expect-error — Summarizer is a Chrome built-in not in the TS lib.
    const summarizer = await Summarizer.create({
      // Writing Assistance APIs: create() honours an AbortSignal, so Stop
      // also cancels a pending creation / model download.
      signal,
      type:           this.getAttribute('type')           || 'key-points',
      format:         this.getAttribute('format')         || 'markdown',
      length:         this.getAttribute('length')         || 'medium',
      sharedContext:  this.getAttribute('shared-context') || undefined,
      expectedInputLanguages:  ['en'],
      outputLanguage:          'en',
      monitor: (m) => {
        m.addEventListener('downloadprogress', (/** @type {any} */ e) => {
          this.#setState('downloading');
          if (this.#status) {
            this.#status.textContent = `Downloading model: ${Math.round(e.loaded * 100)}%`;
          }
        });
      },
    });
    let input = text;
    try {
      input = await this.#fitInput(summarizer, text, signal);
    } catch (err) {
      summarizer.destroy?.();
      throw err;
    }

    const stream = typeof summarizer.summarizeStreaming === 'function'
      ? summarizer.summarizeStreaming(input, { signal })
      : (async function* () { yield await summarizer.summarize(input, { signal }); })();

    return (async function* () {
      try {
        for await (const chunk of stream) yield chunk;
      } finally {
        summarizer.destroy?.();
      }
    })();
  }

  /**
   * Keep the input within the on-device model's quota. Uses the real
   * `inputQuota` / `measureInputUsage()` when the browser exposes them
   * (trimming to fit, with a notice); otherwise falls back to a character
   * budget and only warns, since the true limit is unknown.
   * @param {any} summarizer
   * @param {string} text
   * @param {AbortSignal} signal
   * @returns {Promise<string>}
   */
  async #fitInput(summarizer, text, signal) {
    const quota = summarizer?.inputQuota;
    if (typeof summarizer?.measureInputUsage === 'function' && typeof quota === 'number') {
      let usage;
      try {
        usage = await summarizer.measureInputUsage(text, { signal });
      } catch (err) {
        if (/** @type {Error} */ (err)?.name === 'AbortError') throw err;
        usage = undefined; // measurement unsupported for this input — carry on
      }
      if (typeof usage === 'number' && usage > quota) {
        const fitted = fitToQuota(text, usage, quota);
        const pct = Math.max(1, Math.round((fitted.length / text.length) * 100));
        this.#showNotice(`This content is longer than the on-device model accepts; summarizing the first ${pct}%.`);
        return fitted;
      }
      return text;
    }
    if (text.length > SUMMARIZER_CHAR_BUDGET) {
      this.#showNotice(`This content is long (${text.length.toLocaleString()} characters) and may exceed the on-device model's limit.`);
    }
    return text;
  }

  // ── Helpers ────────────────────────────────────────────────────

  #extractContent() {
    return extractContextText(this, { stripSelectors: '.ais-ui' });
  }

  #composePrompt() {
    const tpl = this.getAttribute('fallback-prompt') || DEFAULT_FALLBACK_PROMPT;
    return tpl
      .replace(/\{url\}/g, location.href)
      .replace(/\{title\}/g, document.title);
  }

  #composeDeepLinkURL() {
    const template = this.getAttribute('fallback-url');
    return expandFallbackURL(template, {
      prompt: this.#composePrompt(),
      // Wrapping content is the author's consent to read it (spec §F).
      content: usesContentToken(template) ? this.#extractContent() : '',
    });
  }

  /**
   * format="plain-text" output is shown as text; markdown goes through the
   * sanitising viewer.
   * @param {string} text
   */
  #renderResult(text) {
    if (!this.#output) return;
    if ((this.getAttribute('format') || 'markdown') === 'plain-text') {
      this.#output.textContent = text;
      return;
    }
    this.#renderMarkdown(text);
  }

  /**
   * Model / endpoint output is untrusted (prompt injection, compromised
   * endpoint), so the viewer is told to sanitise explicitly — independent of
   * markdown-viewer's default. If markdown-viewer isn't registered the <pre>
   * stays as inert text.
   * @param {string} markdown
   */
  #renderMarkdown(markdown) {
    if (!this.#output) return;
    if (!markdown) { this.#output.textContent = ''; return; }
    const viewer = document.createElement('markdown-viewer');
    viewer.setAttribute('sanitize', '');
    const pre = document.createElement('pre');
    pre.textContent = markdown;
    viewer.appendChild(pre);
    this.#output.replaceChildren(viewer);
  }

  /** @param {Error} err */
  #renderError(err) {
    if (!this.#output) return;
    const msg = document.createElement('p');
    msg.className = 'ais-error';
    msg.textContent = `Summarization failed: ${err?.message || err}`;
    this.#output.replaceChildren(msg);

    const tpl = this.getAttribute('fallback-url');
    if (tpl) {
      const link = document.createElement('p');
      link.className = 'ais-fallback';
      const a = document.createElement('a');
      a.href = this.#composeDeepLinkURL();
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = this.getAttribute('fallback-label') || 'Continue elsewhere';
      a.append(newTabHint());
      link.append('You can ', a, ' instead.');
      this.#output.appendChild(link);
    }
  }

  /** @param {string} state */
  #setState(state) {
    this.setAttribute('data-state', state);
    this.dispatchEvent(new CustomEvent('ai-summary:state', {
      detail: { state, provider: this.#provider },
      bubbles: true,
    }));
  }

  /** @param {string} label */
  #setLabel(label) {
    const el = this.#button?.querySelector('.ais-label');
    if (el) el.textContent = label;
  }

  /** @param {boolean} on */
  #setNewTabHint(on) {
    const existing = this.#button?.querySelector('.ais-newtab');
    if (on && !existing) this.#button?.append(newTabHint());
    else if (!on) existing?.remove();
  }

  /** @param {string} text */
  #showNotice(text) {
    if (!this.#notice) return;
    this.#notice.textContent = text;
    this.#notice.hidden = false;
  }

  #hideNotice() {
    if (!this.#notice) return;
    this.#notice.hidden = true;
    this.#notice.textContent = '';
  }
}

/** Visually hidden " (opens in new tab)" for controls that call window.open. */
function newTabHint() {
  const sr = document.createElement('span');
  sr.className = 'visually-hidden ais-newtab';
  sr.textContent = ' (opens in new tab)';
  return sr;
}

registerComponent('ai-summary', AISummary);

export { AISummary };
