/**
 * ai-chat: On-device chat via Chrome's LanguageModel API
 *
 * Composes <chat-window> + <chat-input> + <chat-thread> + <chat-bubble> for
 * the UI shell — those components own theme integration, layout, the typing
 * indicator, message rendering, and form-association. <ai-chat> owns the
 * provider resolution (local Chrome LanguageModel → endpoint → deep-link)
 * and streams responses into the typing bubble dispatched by chat-window.
 *
 * Without a `context` attribute, behaves as a general assistant. With
 * `context="<selector>"`, the targeted region's text is folded into the
 * system prompt so the model can answer questions about a surrounding
 * article without retrieval plumbing.
 *
 * Per AI page-tools v1 (admin/specs/ai-page-tools-v1.md):
 *   local Chrome LanguageModel API → endpoint → fallback-url deep-link → unavailable
 *
 * @attr {string} context        - CSS selector of a region whose text becomes part of the system prompt.
 * @attr {string} context-label  - Human-friendly name for the context region (shown in the ribbon).
 * @attr {string} system         - System-prompt prefix. May also live in <template data-role="system">.
 * @attr {string} placeholder    - Textarea placeholder. Default 'Type a message…'.
 * @attr {string} endpoint       - Inline-fallback HTTP URL.
 * @attr {string} fallback-url   - Deep-link URL template ({prompt}/{url}/{title}/{content} tokens).
 * @attr {string} fallback-label - Override Send label when in deep-link mode.
 * @attr {string} fallback-prompt - Override the default {prompt} text.
 *
 * State attributes:
 * @attr {string} data-state - One of: checking, ready, downloading, thinking, streaming, error, unavailable, deep-link
 *
 * @fires ai-chat:state            - Detail: { state, provider }
 * @fires ai-chat:message          - Detail: { role, text }
 * @fires ai-chat:error            - Detail: { error }
 * @fires ai-chat:context-overflow - Bubbled from the underlying session.
 *
 * @example
 *   <ai-chat
 *     context="#article"
 *     context-label="this article"
 *     placeholder="Ask about this page…">
 *     <template data-role="starters">
 *       Summarize the article in 3 bullets.
 *       What problem did the author identify?
 *     </template>
 *   </ai-chat>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { checkAvailability, resolveProvider } from '../../lib/ai/availability.js';
import { extractContextText } from '../../lib/ai/extract.js';
import { expandFallbackURL } from '../../lib/ai/fallback.js';
import { callEndpoint } from '../../lib/ai/endpoint.js';
import { NANO_CONTEXT_BUDGET, estimateTokens } from '../../lib/ai/budget.js';

const DEFAULT_FALLBACK_PROMPT = 'Help me explore this article: {title} ({url})';

const PARTICIPANTS = {
  user:      { name: 'You',       role: 'user'  },
  assistant: { name: 'Assistant', role: 'agent' },
};

class AIChat extends VBElement {
  /** @type {HTMLElement|null} */ #window = null;
  /** @type {HTMLElement|null} */ #stateLabel = null;
  /** @type {HTMLButtonElement|null} */ #stopBtn = null;
  /** @type {HTMLElement|null} */ #ribbon = null;
  /** @type {HTMLElement|null} */ #notice = null;
  /** @type {HTMLElement|null} */ #starters = null;
  /** @type {any} */ #session = null;
  /** @type {AbortController|null} */ #abortCtl = null;
  /** @type {'local'|'endpoint'|'deep-link'|'unavailable'} */ #provider = 'unavailable';

  static get observedAttributes() { return ['placeholder']; }

  setup() {
    this.#renderShell();
    this.#renderStarters();
    this.#wireEvents();
    this.#refreshContextRibbon();
    this.#refreshAvailability();
  }

  teardown() {
    this.#abortCtl?.abort();
    this.#session?.destroy?.();
    this.#session = null;
  }

  attributeChangedCallback(name, _old, value) {
    if (name === 'placeholder' && this.#window) {
      const ta = this.#window.querySelector('chat-input textarea');
      if (ta) /** @type {HTMLTextAreaElement} */ (ta).placeholder = value ?? '';
    }
  }

  /* ---------- public API ---------- */

  async reset() {
    this.#abortCtl?.abort();
    this.#session?.destroy?.();
    this.#session = null;
    /** @type {any} */ (this.#window)?.clearThread?.();
    this.#refreshContextRibbon();
    this.#setState('ready');
  }

  /* ---------- rendering ---------- */

  #renderShell() {
    const placeholder = this.getAttribute('placeholder') || 'Type a message…';
    // Aux elements (ribbon / notice / starters) live OUTSIDE chat-window so
    // they don't disrupt its `grid-template-rows: auto 1fr auto` layout.
    // Chat-window's expected children are: <script[data-participants]>,
    // <header>, <chat-thread>, <chat-input>.
    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <p class="ai-chat-ribbon" hidden></p>
      <p class="ai-chat-notice" hidden></p>
      <div class="ai-chat-starters" role="group" aria-label="Starter prompts" hidden></div>
      <chat-window empty-message="Send a message to start a session.">
        <script type="application/json" data-participants>${JSON.stringify(PARTICIPANTS)}</script>
        <header>
          <span class="ai-chat-state" role="status" aria-live="polite">Checking…</span>
          <button type="button" class="ai-chat-stop small" data-action="stop">Stop</button>
        </header>
        <chat-thread role="log" aria-label="Chat" aria-live="polite"></chat-thread>
        <chat-input name="message">
          <textarea data-grow rows="1" data-max-rows="8" required></textarea>
          <footer>
            <button type="submit" class="small" data-send aria-label="Send">
              <icon-wc name="send"></icon-wc>
            </button>
          </footer>
        </chat-input>
      </chat-window>
    `;
    this.appendChild(tpl.content.cloneNode(true));

    this.#window     = /** @type {HTMLElement} */       (this.querySelector(':scope > chat-window'));
    this.#stateLabel = /** @type {HTMLElement} */       (this.querySelector('.ai-chat-state'));
    this.#stopBtn    = /** @type {HTMLButtonElement} */ (this.querySelector('.ai-chat-stop'));
    this.#ribbon     = /** @type {HTMLElement} */       (this.querySelector(':scope > .ai-chat-ribbon'));
    this.#notice     = /** @type {HTMLElement} */       (this.querySelector(':scope > .ai-chat-notice'));
    this.#starters   = /** @type {HTMLElement} */       (this.querySelector(':scope > .ai-chat-starters'));

    const ta = this.querySelector('chat-input textarea');
    if (ta) /** @type {HTMLTextAreaElement} */ (ta).placeholder = placeholder;
  }

  #renderStarters() {
    if (!this.#starters) return;
    const tpl = this.querySelector(':scope > template[data-role="starters"]');
    const lines = ((tpl && /** @type {HTMLTemplateElement} */ (tpl).content?.textContent) || '')
      .split('\n').map(s => s.trim()).filter(Boolean);

    this.#starters.replaceChildren();
    if (!lines.length) {
      this.#starters.hidden = true;
      return;
    }
    this.#starters.hidden = false;
    for (const line of lines) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ai-chat-starter small';
      btn.textContent = line;
      this.listen(btn, 'click', () => this.#sendStarter(line));
      this.#starters.appendChild(btn);
    }
  }

  #wireEvents() {
    if (!this.#window) return;
    // chat-window dispatches this when no endpoint is set on it.
    this.listen(this.#window, 'chat-window:send', (/** @type {any} */ e) => {
      e.stopPropagation();
      this.#handleSend(e.detail.message, e.detail.typingElement);
    });
    if (this.#stopBtn) {
      this.listen(this.#stopBtn, 'click', () => this.#abortCtl?.abort());
    }
  }

  /** @param {string} line */
  #sendStarter(line) {
    const input = /** @type {any} */ (this.#window?.querySelector('chat-input'));
    if (!input) return;
    input.value = line;
    // chat-input.value=… emits chat-input:change but doesn't auto-send. Trigger send.
    const ta = input.querySelector('textarea');
    if (ta) ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  }

  /* ---------- context ---------- */

  #contextSelector() {
    return this.getAttribute('context')?.trim() || '';
  }

  #extractContext() {
    const sel = this.#contextSelector();
    if (!sel) return '';
    return extractContextText(sel, { stripSelectors: 'ai-chat, ai-summary, .ais-ui' });
  }

  #refreshContextRibbon() {
    if (!this.#ribbon) return;
    const sel = this.#contextSelector();
    if (!sel) {
      this.#ribbon.hidden = true;
      return;
    }
    const text = this.#extractContext();
    if (!text) {
      this.#ribbon.hidden = false;
      this.#ribbon.textContent = `Context selector "${sel}" matched no readable content.`;
      this.setAttribute('data-context-state', 'missing');
      return;
    }
    const chars = text.length;
    const tokens = estimateTokens(text);
    const warn = chars > NANO_CONTEXT_BUDGET;
    const label = this.getAttribute('context-label') || sel;
    this.#ribbon.hidden = false;
    this.#ribbon.replaceChildren();
    const lead = document.createElement('span');
    lead.className = 'ai-chat-ribbon-lead';
    lead.textContent = `Page context: ${label} · ${chars.toLocaleString()} chars (~${tokens.toLocaleString()} tokens)`;
    this.#ribbon.appendChild(lead);
    if (warn) {
      const w = document.createElement('span');
      w.className = 'ai-chat-ribbon-warn';
      w.textContent = 'large — may crowd the conversation';
      this.#ribbon.appendChild(w);
    }
    this.setAttribute('data-context-state', warn ? 'large' : 'ok');
  }

  #composeSystemPrompt() {
    const base = (
      this.getAttribute('system')?.trim()
      || /** @type {HTMLTemplateElement|null} */ (this.querySelector(':scope > template[data-role="system"]'))?.content?.textContent?.trim()
      || ''
    );
    const ctx = this.#extractContext();
    if (!ctx) return base || undefined;
    const label = this.getAttribute('context-label') || 'page';
    const block = `\n\n[PAGE CONTENT — ${label}]\n${ctx}\n[END PAGE CONTENT]`;
    return base ? base + block : `Use the following page content to answer the user.${block}`;
  }

  /* ---------- availability ---------- */

  async #refreshAvailability() {
    this.#setState('checking');
    const { state } = await checkAvailability('LanguageModel');
    this.#provider = resolveProvider({
      availability: state,
      endpoint: this.getAttribute('endpoint') || undefined,
      fallbackURL: this.getAttribute('fallback-url') || undefined,
    });

    if (this.#provider === 'unavailable') {
      this.#setState('unavailable');
      this.#showNotice('On-device AI is unavailable on this browser. Configure endpoint= or fallback-url= to enable a fallback.');
      return;
    }
    if (this.#provider === 'deep-link') {
      this.#setState('deep-link');
      this.#showNotice('On-device AI unavailable. Send opens the configured fallback in a new tab.');
      return;
    }
    this.#setState('ready');
  }

  /* ---------- session lifecycle ---------- */

  async #ensureSession() {
    if (this.#session) return this.#session;
    this.#setState('thinking');
    const systemPrompt = this.#composeSystemPrompt();
    const initialPrompts = systemPrompt ? [{ role: 'system', content: systemPrompt }] : undefined;

    // @ts-expect-error — LanguageModel is a Chrome built-in not in the TS lib.
    this.#session = await LanguageModel.create({
      initialPrompts,
      expectedInputs:  [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }],
      monitor: (m) => {
        m.addEventListener('downloadprogress', (/** @type {any} */ e) => {
          this.#setState('downloading');
          if (this.#stateLabel) {
            this.#stateLabel.textContent = `Downloading model: ${Math.round(e.loaded * 100)}%`;
          }
        });
      },
    });

    this.#session.addEventListener?.('contextoverflow', () => {
      this.dispatchEvent(new CustomEvent('ai-chat:context-overflow', { bubbles: true }));
    });
    return this.#session;
  }

  /* ---------- send ---------- */

  /**
   * Handles a chat-window:send by routing through the resolved provider.
   * @param {string} message
   * @param {HTMLElement} typingElement
   */
  async #handleSend(message, typingElement) {
    this.dispatchEvent(new CustomEvent('ai-chat:message', { detail: { role: 'user', text: message }, bubbles: true }));

    if (this.#provider === 'deep-link') {
      typingElement.remove();
      window.open(this.#composeDeepLinkURL(message), '_blank', 'noopener,noreferrer');
      return;
    }
    if (this.#provider === 'unavailable') {
      this.#populateBubble(typingElement, 'Chat is unavailable in this browser.', { error: true });
      return;
    }

    this.#setState('streaming');
    this.#abortCtl = new AbortController();

    const bubble = typingElement.querySelector('chat-bubble');
    if (!bubble) return;

    let acc = '';
    try {
      const stream = this.#provider === 'local'
        ? await this.#localStream(message)
        : callEndpoint(this.getAttribute('endpoint') || '', {
            prompt: message,
            content: this.#extractContext() || undefined,
            mode: 'chat',
            signal: this.#abortCtl.signal,
          });

      for await (const chunk of stream) {
        acc += chunk;
        bubble.textContent = acc;
      }
      this.#finishTyping(typingElement, acc || ' ');
      this.dispatchEvent(new CustomEvent('ai-chat:message', { detail: { role: 'assistant', text: acc }, bubbles: true }));
      this.#setState('ready');
    } catch (err) {
      const e = /** @type {Error} */ (err);
      if (e?.name === 'AbortError') {
        this.#finishTyping(typingElement, acc ? `${acc} (stopped)` : '(stopped)');
        this.#setState('ready');
        return;
      }
      this.#populateBubble(typingElement, e?.message || 'Generation failed', { error: true });
      this.#setState('error');
      this.dispatchEvent(new CustomEvent('ai-chat:error', { detail: { error: err }, bubbles: true }));
    } finally {
      this.#abortCtl = null;
    }
  }

  /**
   * @param {string} text
   * @returns {Promise<AsyncIterable<string>>}
   */
  async #localStream(text) {
    const session = await this.#ensureSession();
    const signal = this.#abortCtl?.signal;
    const stream = session.promptStreaming(text, { signal });
    return (async function* () {
      for await (const chunk of stream) yield chunk;
    })();
  }

  /**
   * @param {HTMLElement} typingElement
   * @param {string} text
   */
  #finishTyping(typingElement, text) {
    const bubble = typingElement.querySelector('chat-bubble');
    if (bubble) bubble.textContent = text;
    typingElement.removeAttribute('data-status');
    typingElement.removeAttribute('aria-label');
  }

  /**
   * @param {HTMLElement} typingElement
   * @param {string} text
   * @param {{ error?: boolean }} [opts]
   */
  #populateBubble(typingElement, text, opts = {}) {
    this.#finishTyping(typingElement, text);
    if (opts.error) typingElement.setAttribute('data-status', 'error');
  }

  /* ---------- helpers ---------- */

  /** @param {string} state */
  #setState(state) {
    this.setAttribute('data-state', state);
    if (this.#stateLabel) {
      const labels = {
        checking: 'Checking availability…',
        unavailable: 'Unavailable',
        downloadable: 'Ready',
        downloading: 'Downloading model…',
        ready: 'Ready',
        thinking: 'Preparing session…',
        streaming: 'Generating…',
        error: 'Error',
        'deep-link': 'Ready (deep-link)',
      };
      this.#stateLabel.textContent = labels[state] ?? state;
    }
    this.dispatchEvent(new CustomEvent('ai-chat:state', {
      detail: { state, provider: this.#provider },
      bubbles: true,
    }));
  }

  /** @param {string} text */
  #showNotice(text) {
    if (!this.#notice) return;
    this.#notice.hidden = false;
    this.#notice.textContent = text;
  }

  /**
   * @param {string} userPrompt
   * @returns {string}
   */
  #composeDeepLinkURL(userPrompt) {
    const tpl = this.getAttribute('fallback-prompt') || DEFAULT_FALLBACK_PROMPT;
    const filled = tpl
      .replace(/\{url\}/g, location.href)
      .replace(/\{title\}/g, document.title);
    const composed = userPrompt ? `${filled}\n\nUser: ${userPrompt}` : filled;
    return expandFallbackURL(this.getAttribute('fallback-url'), { prompt: composed });
  }
}

registerComponent('ai-chat', AIChat);

export { AIChat };
