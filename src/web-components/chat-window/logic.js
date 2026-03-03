/**
 * chat-window: Light DOM orchestrator for chat UI
 *
 * Wires chat-thread, chat-input, participant data, and an optional model
 * selector into a composed shell. Handles the send → typing → response cycle.
 *
 * @attr {string} data-endpoint - API endpoint for chat requests
 * @attr {string} data-model - Active model; synced with [data-model-select]
 * @attr {string} data-empty-message - Empty thread placeholder text
 *
 * @example
 * <chat-window data-endpoint="/api/ai">
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

class ChatWindow extends HTMLElement {
  #thread;
  #chatInput;
  #modelSelect;
  #participants = new Map();
  #emptyEl;

  connectedCallback() {
    this.#discoverChildren();
    this.#loadParticipants();
    this.#syncModel();
    this.#resolveExistingLabels();
    this.#updateEmptyState();
    this.#bindEvents();
  }

  disconnectedCallback() {
    this.removeEventListener('chat-input:send', this.#handleSend);
    if (this.#modelSelect) {
      this.#modelSelect.removeEventListener('change', this.#handleModelChange);
    }
  }

  // --- Child discovery ---

  #discoverChildren() {
    this.#thread = this.querySelector(':scope > chat-thread');
    this.#chatInput = this.querySelector(':scope > chat-input');
    this.#modelSelect = this.querySelector(':scope > header select[data-model-select]');
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

    const attrModel = this.dataset.model;
    if (attrModel) {
      this.#modelSelect.value = attrModel;
    } else if (this.#modelSelect.value) {
      this.dataset.model = this.#modelSelect.value;
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
    if (this.#chatInput) this.#chatInput.disabled = true;

    // 4. Fetch response (if endpoint configured)
    const endpoint = this.dataset.endpoint;
    if (endpoint) {
      try {
        const response = await this.#fetchResponse(endpoint, message);
        this.#populateTypingMessage(typingMsg, response);
      } catch (err) {
        this.#populateTypingMessage(typingMsg, '<p>Sorry, something went wrong.</p>');
        typingMsg.setAttribute('data-status', 'error');
        this.dispatchEvent(new CustomEvent('chat-input:error', {
          bubbles: true,
          detail: { error: err.message, status: err.status ?? 0 },
        }));
      }
    }
    // If no endpoint, leave typing message for consumer JS to handle

    // 5. Re-enable input and focus
    if (this.#chatInput) {
      this.#chatInput.disabled = false;
      this.#chatInput.focus();
    }

    this.#scrollToBottom();
  };

  #handleModelChange = () => {
    const model = this.#modelSelect.value;
    this.dataset.model = model;

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
      bubble.innerHTML = html;
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
    const model = this.dataset.model;
    if (model) msg.setAttribute('data-model', model);

    const bubble = document.createElement('chat-bubble');
    msg.appendChild(bubble);

    return msg;
  }

  #populateTypingMessage(msgEl, html) {
    const bubble = msgEl.querySelector('chat-bubble');
    if (bubble) {
      bubble.innerHTML = html;
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
        this.#emptyEl.textContent = this.dataset.emptyMessage || 'Send a message to start.';
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
      model: this.dataset.model || undefined,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = new Error(`Chat request failed: ${res.status}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    return data.html ?? data.message ?? data.content ?? '';
  }

  // --- Public API ---

  get model() {
    return this.dataset.model ?? '';
  }

  set model(val) {
    this.dataset.model = val;
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

customElements.define('chat-window', ChatWindow);

export { ChatWindow };
