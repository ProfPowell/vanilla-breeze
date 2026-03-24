/**
 * chat-window: Light DOM orchestrator for chat UI
 *
 * Wires chat-thread, chat-input, participant data, and an optional model
 * selector into a composed shell. Handles the send → typing → response cycle.
 *
 * Transport: when `endpoint` is set, uses built-in fetch(). When omitted,
 * dispatches `chat-window:send` so consumers can provide their own transport.
 * In both cases, the typing indicator is shown while awaiting a response.
 * Use `appendMessage()` or the typing element's `chat-bubble` to populate.
 *
 * Participants: the `data-participants` JSON map uses arbitrary string IDs.
 * The local user's messages are always created with `data-from="user"`.
 * The agent is resolved as the first participant with `role: "agent"`.
 * Override these defaults by choosing matching keys in your participant map.
 *
 * Model: `model` is a property + attribute. Setting the property updates the
 * `<select data-model-select>` if present. The attribute is set at connect
 * time and updated when the select changes. There is no `observedAttributes`
 * — post-connect attribute mutations are not observed; use the property setter.
 *
 * @attr {string} endpoint - API endpoint for chat requests (omit for custom transport)
 * @attr {string} model - Active model; synced with [data-model-select] (property-driven after connect)
 * @attr {string} empty-message - Empty thread placeholder text
 *
 * @fires chat-window:send - Dispatched when user sends a message and no endpoint is set.
 *   Consumer should handle transport and call appendMessage() or populate the typing bubble.
 *   detail: { message, typingElement }
 * @fires chat-window:error - Dispatched when built-in fetch fails.
 *   detail: { error, status }
 * @fires chat-window:model-change - Dispatched when model selector changes.
 *   detail: { model }
 *
 * @example
 * <chat-window endpoint="/api/ai">
 *   <script type="application/json" data-participants>
 *   { "user": { "name": "You", "role": "user" },
 *     "assistant": { "name": "Assistant", "role": "agent" } }
 *   </script>
 *   <header><h3>AI Chat</h3></header>
 *   <chat-thread role="log" aria-label="Chat" aria-live="polite"></chat-thread>
 *   <chat-input name="message">
 *     <textarea data-grow rows="1" placeholder="Ask anything..."></textarea>
 *     <footer>
 *       <button type="submit" class="small" data-send aria-label="Send">
 *         <icon-wc name="send"></icon-wc>
 *       </button>
 *     </footer>
 *   </chat-input>
 * </chat-window>
 */

import { sanitizeHTML } from '../../lib/sanitize-html.js';
import { registerComponent } from '../../lib/bundle-registry.js';

class ChatWindow extends HTMLElement {
  /** @type {HTMLElement} */
  #thread = /** @type {*} */ (null);
  /** @type {HTMLElement} */
  #chatInput = /** @type {*} */ (null);
  /** @type {HTMLSelectElement} */
  #modelSelect = /** @type {*} */ (null);
  #participants = new Map();
  /** @type {HTMLElement | null} */
  #emptyEl = null;

  connectedCallback() {
    this.#discoverChildren();
    this.#loadParticipants();
    this.#syncModel();
    this.#resolveExistingLabels();
    this.#updateEmptyState();
    this.#bindEvents();
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    this.removeAttribute('data-upgraded');
    this.removeEventListener('chat-input:send', this.#handleSend);
    if (this.#modelSelect) {
      this.#modelSelect.removeEventListener('change', this.#handleModelChange);
    }
  }

  // --- Child discovery ---

  #discoverChildren() {
    this.#thread = /** @type {HTMLElement} */ (this.querySelector(':scope > chat-thread'));
    this.#chatInput = /** @type {HTMLElement} */ (this.querySelector(':scope > chat-input'));
    this.#modelSelect = /** @type {HTMLSelectElement} */ (this.querySelector(':scope > header select[data-model-select]'));
  }

  // --- Participant data ---

  #loadParticipants() {
    const script = this.querySelector(':scope > script[data-participants]');
    if (!script) return;

    try {
      const data = JSON.parse(script.textContent);
      this.#participants = new Map(Object.entries(data));
    } catch {
      console.warn('[chat-window] Invalid participant JSON');
    }
  }

  /** Resolve data-from-label for any SSR messages already in the thread */
  #resolveExistingLabels() {
    if (!this.#thread) return;
    for (const msg of this.#thread.querySelectorAll('chat-message[data-from]')) {
      this.#resolveLabel(msg);
    }
  }

  #resolveLabel(messageEl) {
    const fromId = messageEl.getAttribute('data-from');
    if (!fromId) return;

    const participant = this.#participants.get(fromId);
    if (participant?.name) {
      messageEl.setAttribute('data-from-label', participant.name);
    } else if (!messageEl.hasAttribute('data-from-label')) {
      messageEl.setAttribute('data-from-label', fromId);
    }
  }

  // --- Model selector ---

  #syncModel() {
    if (!this.#modelSelect) return;

    const attrModel = this.getAttribute('model');
    if (attrModel) {
      this.#modelSelect.value = attrModel;
    } else if (this.#modelSelect.value) {
      this.setAttribute('model', this.#modelSelect.value);
    }
  }

  // --- Events ---

  #bindEvents() {
    this.addEventListener('chat-input:send', this.#handleSend);

    if (this.#modelSelect) {
      this.#modelSelect.addEventListener('change', this.#handleModelChange);
    }
  }

  #handleSend = async (e) => {
    e.stopPropagation();
    const { message } = e.detail;
    if (!message || !this.#thread) return;

    // 1. Build and append user message
    const userMsg = this.#buildMessage('user', message, 'user');
    this.#thread.appendChild(userMsg);
    this.#scrollToBottom();
    this.#updateEmptyState();

    // 2. Build typing indicator
    const agentId = this.#getAgentId();
    const typingMsg = this.#buildTypingMessage(agentId);
    this.#thread.appendChild(typingMsg);
    this.#scrollToBottom();

    // 3. Disable input
    if (this.#chatInput) /** @type {any} */ (this.#chatInput).disabled = true;

    // 4. Fetch response (if endpoint configured)
    const endpoint = this.getAttribute('endpoint');
    if (endpoint) {
      try {
        const response = await this.#fetchResponse(endpoint, message);
        this.#populateTypingMessage(typingMsg, response);
      } catch (err) {
        this.#populateTypingMessage(typingMsg, '<p>Sorry, something went wrong.</p>');
        typingMsg.setAttribute('data-status', 'error');
        this.dispatchEvent(new CustomEvent('chat-window:error', {
          bubbles: true,
          detail: { error: err.message, status: /** @type {any} */ (err).status ?? 0 },
        }));
      }
    } else {
      // No endpoint — dispatch event for consumer-driven transport
      this.dispatchEvent(new CustomEvent('chat-window:send', {
        bubbles: true,
        detail: { message, typingElement: typingMsg },
      }));
    }

    // 5. Re-enable input and focus
    if (this.#chatInput) {
      /** @type {any} */ (this.#chatInput).disabled = false;
      this.#chatInput.focus();
    }

    this.#scrollToBottom();
  };

  #handleModelChange = () => {
    const model = this.#modelSelect.value;
    this.setAttribute('model', model);

    this.dispatchEvent(new CustomEvent('chat-window:model-change', {
      bubbles: true,
      detail: { model },
    }));
  };

  // --- Message building ---

  #buildMessage(role, html, fromId) {
    const msg = document.createElement('chat-message');
    msg.setAttribute('data-role', role);

    if (fromId) {
      msg.setAttribute('data-from', fromId);
      this.#resolveLabel(msg);
    }

    const bubble = document.createElement('chat-bubble');
    // Wrap plain text in <p> if it doesn't look like HTML
    if (!html.includes('<')) {
      const p = document.createElement('p');
      p.textContent = html;
      bubble.appendChild(p);
    } else {
      bubble.innerHTML = sanitizeHTML(html);
    }
    msg.appendChild(bubble);

    return msg;
  }

  #buildTypingMessage(fromId) {
    const msg = document.createElement('chat-message');
    msg.setAttribute('data-role', 'agent');
    msg.setAttribute('data-status', 'typing');

    if (fromId) {
      msg.setAttribute('data-from', fromId);
      this.#resolveLabel(msg);
      const participant = this.#participants.get(fromId);
      const name = participant?.name ?? fromId;
      msg.setAttribute('aria-label', `${name} is typing`);
    } else {
      msg.setAttribute('aria-label', 'Agent is typing');
    }

    // Add model attribution if set
    const model = this.getAttribute('model');
    if (model) msg.setAttribute('data-model', model);

    const bubble = document.createElement('chat-bubble');
    msg.appendChild(bubble);

    return msg;
  }

  #populateTypingMessage(msgEl, html) {
    const bubble = msgEl.querySelector('chat-bubble');
    if (bubble) {
      bubble.innerHTML = sanitizeHTML(html);
    }
    msgEl.removeAttribute('data-status');
    msgEl.removeAttribute('aria-label');
  }

  #getAgentId() {
    for (const [id, p] of this.#participants) {
      if (p.role === 'agent') return id;
    }
    return null;
  }

  // --- Empty state ---

  #updateEmptyState() {
    if (!this.#thread) return;
    const hasMessages = this.#thread.querySelector('chat-message') !== null;

    if (hasMessages) {
      if (this.#emptyEl) {
        this.#emptyEl.remove();
        this.#emptyEl = null;
      }
      this.#thread.hidden = false;
    } else {
      this.#thread.hidden = true;
      if (!this.#emptyEl) {
        this.#emptyEl = document.createElement('p');
        this.#emptyEl.setAttribute('data-chat-empty', '');
        this.#emptyEl.textContent = this.getAttribute('empty-message') || 'Send a message to start.';
        this.#thread.insertAdjacentElement('afterend', this.#emptyEl);
      }
    }
  }

  // --- Scroll ---

  #scrollToBottom() {
    if (!this.#thread) return;
    requestAnimationFrame(() => {
      this.#thread.scrollTop = this.#thread.scrollHeight;
    });
  }

  // --- Fetch ---

  async #fetchResponse(endpoint, message) {
    const body = {
      message,
      model: this.getAttribute('model') || undefined,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = new Error(`Chat request failed: ${res.status}`);
      /** @type {any} */ (err).status = res.status;
      throw err;
    }

    const data = await res.json();
    return data.html ?? data.message ?? data.content ?? '';
  }

  // --- Public API ---

  get model() {
    return this.getAttribute('model') ?? '';
  }

  set model(val) {
    this.setAttribute('model', val);
    if (this.#modelSelect) this.#modelSelect.value = val;
  }

  get participants() {
    return this.#participants;
  }

  set participants(map) {
    this.#participants = map instanceof Map ? map : new Map(Object.entries(map));
    this.#resolveExistingLabels();
  }

  clearThread() {
    if (!this.#thread) return;
    while (this.#thread.firstChild) {
      this.#thread.removeChild(this.#thread.firstChild);
    }
    this.#updateEmptyState();
  }

  appendMessage(role, html, from) {
    if (!this.#thread) return;
    const msg = this.#buildMessage(role, html, from);
    this.#thread.appendChild(msg);
    this.#scrollToBottom();
    this.#updateEmptyState();
  }
}

registerComponent('chat-window', ChatWindow);

export { ChatWindow };
