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
 * @attr {string} format          - 'markdown'|'plain-text'. Default 'markdown'.
 * @attr {string} shared-context  - Optional shared context passed to Summarizer.create().
 * @attr {string} endpoint        - Inline-fallback HTTP URL (POST JSON, streamed text or one-shot JSON).
 * @attr {string} fallback-url    - Deep-link URL template ({prompt}/{url}/{title}/{content} tokens).
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
import { expandFallbackURL } from '../../lib/ai/fallback.js';
import { callEndpoint } from '../../lib/ai/endpoint.js';

const DEFAULT_FALLBACK_PROMPT = 'Summarize this article: {url}';

class AISummary extends VBElement {
  /** @type {HTMLButtonElement | null} */ #button = null;
  /** @type {HTMLElement       | null} */ #status = null;
  /** @type {HTMLElement       | null} */ #output = null;
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

  // ── UI ──────────────────────────────────────────────────────────

  #renderUI() {
    const ui = document.createElement('div');
    ui.className = 'ais-ui';
    ui.innerHTML = `
      <div class="ais-controls">
        <button type="button" class="ais-trigger" disabled>
          <span aria-hidden="true">✨</span>
          <span class="ais-label">Summarize</span>
        </button>
        <span class="ais-status" data-state="checking" role="status">Checking availability…</span>
      </div>
      <div class="ais-output" hidden aria-live="polite"></div>
    `;
    this.prepend(ui);

    this.#button = /** @type {HTMLButtonElement} */ (ui.querySelector('.ais-trigger'));
    this.#status = /** @type {HTMLElement}        */ (ui.querySelector('.ais-status'));
    this.#output = /** @type {HTMLElement}        */ (ui.querySelector('.ais-output'));
    this.listen(this.#button, 'click', () => this.#run());
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
    this.#button.disabled = true;
    this.#setState('streaming');
    this.#abortCtl = new AbortController();

    try {
      const text = this.#extractContent();
      let result = '';
      const stream = this.#provider === 'local'
        ? await this.#localStream(text)
        : callEndpoint(this.getAttribute('endpoint') || '', {
            prompt: this.#composePrompt(),
            content: text,
            mode: 'summarize',
            signal: this.#abortCtl.signal,
          });

      for await (const chunk of stream) {
        result += chunk;
        this.#output.textContent = result;
      }

      this.#renderMarkdown(result);
      this.#setState('complete');
      this.dispatchEvent(new CustomEvent('ai-summary:result', {
        detail: { text: result, provider: this.#provider },
        bubbles: true,
      }));
    } catch (err) {
      if (err && /** @type {Error} */ (err).name === 'AbortError') {
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
      this.#abortCtl = null;
      this.#button.disabled = false;
    }
  }

  /**
   * @param {string} text
   * @returns {Promise<AsyncIterable<string>>}
   */
  async #localStream(text) {
    // @ts-expect-error — Summarizer is a Chrome built-in not in the TS lib.
    const summarizer = await Summarizer.create({
      type:          this.getAttribute('type')           || 'key-points',
      format:        this.getAttribute('format')         || 'markdown',
      length:        this.getAttribute('length')         || 'medium',
      sharedContext: this.getAttribute('shared-context') || undefined,
      monitor: (m) => {
        m.addEventListener('downloadprogress', (/** @type {any} */ e) => {
          this.#setState('downloading');
          if (this.#status) {
            this.#status.textContent = `Downloading model: ${Math.round(e.loaded * 100)}%`;
          }
        });
      },
    });
    const signal = this.#abortCtl?.signal;
    const stream = typeof summarizer.summarizeStreaming === 'function'
      ? summarizer.summarizeStreaming(text, { signal })
      : (async function* () { yield await summarizer.summarize(text, { signal }); })();

    return (async function* () {
      try {
        for await (const chunk of stream) yield chunk;
      } finally {
        summarizer.destroy?.();
      }
    })();
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
    return expandFallbackURL(this.getAttribute('fallback-url'), {
      prompt: this.#composePrompt(),
    });
  }

  /** @param {string} markdown */
  #renderMarkdown(markdown) {
    if (!this.#output) return;
    if (!markdown) { this.#output.textContent = ''; return; }
    const viewer = document.createElement('markdown-viewer');
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
}

registerComponent('ai-summary', AISummary);

export { AISummary };
