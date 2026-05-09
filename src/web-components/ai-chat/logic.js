/**
 * ai-chat: On-device chat via Chrome's LanguageModel API
 *
 * A page-aware chat component. Without a `context` attribute, behaves as a
 * general assistant. With `context="<selector>"`, the targeted region's
 * text is folded into the system prompt so the model can answer questions
 * about the surrounding article.
 *
 * Provider resolution order (per session):
 *   local Chrome LanguageModel API → endpoint → fallback-url deep-link → unavailable
 *
 * @attr {string} context        - CSS selector of a region whose text becomes part of the system prompt.
 * @attr {string} context-label  - Human-friendly name for the context region (shown in the ribbon).
 * @attr {string} system         - System-prompt prefix. May also live in <template data-role="system">.
 * @attr {string} placeholder    - Textarea placeholder. Default 'Type a message…'.
 * @attr {string} endpoint       - Inline-fallback HTTP URL.
 * @attr {string} fallback-url   - Deep-link URL template ({prompt}/{url}/{title}/{content} tokens).
 * @attr {string} fallback-label - Override trigger label when in deep-link mode.
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

class AIChat extends VBElement {
  /** @type {HTMLElement|null} */ #log = null;
  /** @type {HTMLFormElement|null} */ #form = null;
  /** @type {HTMLTextAreaElement|null} */ #input = null;
  /** @type {HTMLElement|null} */ #stateLabel = null;
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
    if (name === 'placeholder' && this.#input) {
      this.#input.placeholder = value ?? '';
    }
  }

  /* ---------- public API ---------- */

  async reset() {
    this.#abortCtl?.abort();
    this.#session?.destroy?.();
    this.#session = null;
    this.#log?.querySelectorAll('.ai-chat-msg').forEach(el => el.remove());
    this.#refreshContextRibbon();
    this.#setState('ready');
  }

  /* ---------- rendering ---------- */

  #renderShell() {
    const placeholder = this.getAttribute('placeholder') || 'Type a message…';
    const shell = document.createElement('div');
    shell.className = 'ai-chat-shell';
    shell.innerHTML = `
      <header class="ai-chat-header">
        <span class="ai-chat-state" role="status">Checking…</span>
      </header>
      <p class="ai-chat-ribbon" hidden></p>
      <p class="ai-chat-notice" hidden></p>
      <div class="ai-chat-log" role="log" aria-live="polite" aria-relevant="additions">
        <p class="ai-chat-empty">Send a message to start a session.</p>
      </div>
      <div class="ai-chat-starters" role="group" aria-label="Starter prompts" hidden></div>
      <form class="ai-chat-form">
        <textarea class="ai-chat-input" name="prompt" rows="1" required></textarea>
        <div class="ai-chat-actions">
          <button class="ai-chat-btn" data-action="reset" data-variant="ghost" type="button" title="New session">↻</button>
          <button class="ai-chat-btn" data-action="stop" type="button">Stop</button>
          <button class="ai-chat-btn" data-action="send" type="submit">Send</button>
        </div>
      </form>
    `;
    this.appendChild(shell);

    this.#log        = /** @type {HTMLElement} */        (shell.querySelector('.ai-chat-log'));
    this.#form       = /** @type {HTMLFormElement} */    (shell.querySelector('.ai-chat-form'));
    this.#input      = /** @type {HTMLTextAreaElement} */(shell.querySelector('.ai-chat-input'));
    this.#stateLabel = /** @type {HTMLElement} */        (shell.querySelector('.ai-chat-state'));
    this.#ribbon     = /** @type {HTMLElement} */        (shell.querySelector('.ai-chat-ribbon'));
    this.#notice     = /** @type {HTMLElement} */        (shell.querySelector('.ai-chat-notice'));
    this.#starters   = /** @type {HTMLElement} */        (shell.querySelector('.ai-chat-starters'));

    if (this.#input) this.#input.placeholder = placeholder;
  }

  #renderStarters() {
    if (!this.#starters || !this.#input) return;
    const tpl = this.querySelector('template[data-role="starters"]');
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
      btn.className = 'ai-chat-starter';
      btn.textContent = line;
      this.listen(btn, 'click', () => {
        if (this.#input) this.#input.value = line;
        this.#send();
      });
      this.#starters.appendChild(btn);
    }
  }

  #wireEvents() {
    if (!this.#form || !this.#input) return;
    this.listen(this.#form, 'submit', (e) => {
      e.preventDefault();
      this.#send();
    });
    this.listen(this.#input, 'keydown', (/** @type {KeyboardEvent} */ e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.#send();
      }
      if (e.key === 'Escape' && this.dataset.state === 'streaming') {
        this.#abortCtl?.abort();
      }
    });
    const stop = this.#form.querySelector('[data-action="stop"]');
    const reset = this.#form.querySelector('[data-action="reset"]');
    if (stop) this.listen(stop, 'click', () => this.#abortCtl?.abort());
    if (reset) this.listen(reset, 'click', () => this.reset());
  }

  /* ---------- context ---------- */

  #contextSelector() {
    return this.getAttribute('context')?.trim() || '';
  }

  #extractContext() {
    const sel = this.#contextSelector();
    if (!sel) return '';
    return extractContextText(sel, { stripSelectors: 'ai-chat, ai-summary, .ai-chat-shell, .ais-ui' });
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
      || /** @type {HTMLTemplateElement|null} */ (this.querySelector('template[data-role="system"]'))?.content?.textContent?.trim()
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

  async #send() {
    if (!this.#input) return;
    const text = this.#input.value.trim();
    if (!text) return;

    if (this.#provider === 'deep-link') {
      window.open(this.#composeDeepLinkURL(text), '_blank', 'noopener,noreferrer');
      return;
    }
    if (this.#provider === 'unavailable') return;
    if (this.dataset.state === 'streaming') return;

    this.#input.value = '';
    this.#renderMessage('user', text);
    this.dispatchEvent(new CustomEvent('ai-chat:message', { detail: { role: 'user', text }, bubbles: true }));

    const assistantMsg = this.#renderMessage('assistant', '');
    assistantMsg.dataset.streaming = '';
    const body = /** @type {HTMLElement} */ (assistantMsg.querySelector('.ai-chat-msg-body'));

    this.#setState('streaming');
    this.#abortCtl = new AbortController();

    let acc = '';
    try {
      const stream = this.#provider === 'local'
        ? await this.#localStream(text)
        : callEndpoint(this.getAttribute('endpoint') || '', {
            prompt: text,
            content: this.#extractContext() || undefined,
            mode: 'chat',
            signal: this.#abortCtl.signal,
          });

      for await (const chunk of stream) {
        acc += chunk;
        body.textContent = acc;
        this.#scrollToBottom();
      }
      delete assistantMsg.dataset.streaming;
      this.dispatchEvent(new CustomEvent('ai-chat:message', { detail: { role: 'assistant', text: acc }, bubbles: true }));
      this.#setState('ready');
    } catch (err) {
      delete assistantMsg.dataset.streaming;
      const e = /** @type {Error} */ (err);
      if (e?.name === 'AbortError') {
        if (acc) body.textContent = acc + ' (stopped)';
        else assistantMsg.remove();
        this.#setState('ready');
        return;
      }
      body.textContent = e?.message || 'Generation failed';
      body.dataset.error = '';
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

  /* ---------- render helpers ---------- */

  /**
   * @param {'user'|'assistant'|'error'} role
   * @param {string} text
   * @returns {HTMLElement}
   */
  #renderMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = 'ai-chat-msg';
    msg.dataset.role = role;
    const r = document.createElement('div');
    r.className = 'ai-chat-msg-role';
    r.textContent = role;
    const b = document.createElement('div');
    b.className = 'ai-chat-msg-body';
    b.textContent = text;
    msg.append(r, b);
    this.#log?.appendChild(msg);
    this.#scrollToBottom();
    return msg;
  }

  #scrollToBottom() {
    if (this.#log) this.#log.scrollTop = this.#log.scrollHeight;
  }

  /** @param {string} state */
  #setState(state) {
    this.setAttribute('data-state', state);
    if (this.#stateLabel) {
      const labels = {
        checking: 'Checking availability…',
        unavailable: 'Unavailable',
        downloadable: 'Ready (model not yet downloaded)',
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
