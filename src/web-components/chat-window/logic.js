/**
 * chat-window: Light DOM orchestrator for chat UI
 *
 * Wires chat-thread, chat-input, participant data, and an optional model
 * selector into a composed shell. Handles the send → typing → response cycle.
 *
 * Transport: when `endpoint` is set, uses built-in fetch(). When omitted,
 * dispatches `chat-window:send` so consumers can provide their own transport.
 * In both cases, the typing indicator is shown while awaiting a response.
 * Custom transports finish it with `resolveTyping(typingElement, html)`.
 * The built-in transport POSTs `{ message, model }` — the latest message
 * only, no history — and reads `html`, `message` or `content` from the JSON
 * reply. An in-flight request is aborted when the element disconnects.
 *
 * Content trust: user-typed text is always inserted as text (never parsed
 * as HTML). Agent/system content and endpoint replies are HTML, passed
 * through sanitizeToFragment() (nodes inserted, never re-parsed).
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
 *   Consumer handles transport and calls resolveTyping(typingElement, html).
 *   detail: { message, typingElement }
 * @fires chat-window:error - Dispatched when built-in fetch fails.
 *   detail: { error, status }
 * @fires chat-window:model-change - Dispatched when model selector changes.
 *   detail: { model }
 * @fires chat-window:messages-changed - Dispatched after the messages setter runs.
 *   detail: { messages, source: 'property' }
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
 *     <textarea data-grow rows="1" aria-label="Message" placeholder="Ask anything..."></textarea>
 *     <footer>
 *       <button type="submit" class="small" data-send aria-label="Send">
 *         <icon-wc name="send"></icon-wc>
 *       </button>
 *     </footer>
 *   </chat-input>
 * </chat-window>
 */

import { sanitizeToFragment } from '../../lib/sanitize-html.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { diffByKey } from '../../lib/diff-by-key.js';

class ChatWindow extends VBElement {
  /** @type {HTMLElement} */
  #thread = /** @type {*} */ (null);
  /** @type {HTMLElement} */
  #chatInput = /** @type {*} */ (null);
  /** @type {HTMLSelectElement} */
  #modelSelect = /** @type {*} */ (null);
  #participants = new Map();
  /** @type {HTMLElement | null} */
  #emptyEl = null;
  /** @type {Map<unknown, Element>} For .messages keyed-diff. */
  #messageNodes = new Map();
  /** @type {Set<AbortController>} In-flight endpoint requests. */
  #requests = new Set();

  setup() {
    this.#discoverChildren();
    this.#loadParticipants();
    this.#syncModel();
    this.#resolveExistingLabels();
    this.#updateEmptyState();
    this.#bindEvents();
  }

  teardown() {
    for (const ctrl of this.#requests) ctrl.abort();
    this.#requests.clear();
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
    this.listen(this, 'chat-input:send', this.#handleSend);

    if (this.#modelSelect) {
      this.listen(this.#modelSelect, 'change', this.#handleModelChange);
    }
  }

  #handleSend = async (e) => {
    e.stopPropagation();
    const { message } = e.detail;
    if (!message || !this.#thread) return;

    // 1. Build and append user message (always text, never HTML)
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
      const ctrl = new AbortController();
      this.#requests.add(ctrl);
      try {
        const response = await this.#fetchResponse(endpoint, message, ctrl.signal);
        this.resolveTyping(typingMsg, response);
      } catch (err) {
        if (ctrl.signal.aborted) {
          // Disconnected mid-request: drop the placeholder, no error UI.
          typingMsg.remove();
        } else {
          this.resolveTyping(typingMsg, '<p>Sorry, something went wrong.</p>', { error: true });
          this.dispatchEvent(new CustomEvent('chat-window:error', {
            bubbles: true,
            detail: { error: err.message, status: /** @type {any} */ (err).status ?? 0 },
          }));
        }
      } finally {
        this.#requests.delete(ctrl);
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
      if (this.isConnected) this.#chatInput.focus();
    }

    this.#scrollToBottom();
    this.#updateEmptyState();
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

  /**
   * @param {string} role
   * @param {string} content - Text for role "user", sanitized HTML otherwise.
   * @param {string} [fromId]
   */
  #buildMessage(role, content, fromId) {
    const msg = document.createElement('chat-message');
    msg.setAttribute('data-role', role);

    if (fromId) {
      msg.setAttribute('data-from', fromId);
      this.#resolveLabel(msg);
    }

    const bubble = document.createElement('chat-bubble');
    this.#fillBubble(bubble, content, { asText: role === 'user' });
    msg.appendChild(bubble);

    return msg;
  }

  /**
   * Put content into a bubble. User text is never parsed as HTML; other
   * content is wrapped in <p> when it has no markup, else sanitized.
   * @param {Element} bubble
   * @param {string} content
   * @param {{ asText?: boolean }} [opts]
   */
  #fillBubble(bubble, content, { asText = false } = {}) {
    const str = content == null ? '' : String(content);
    if (asText || !str.includes('<')) {
      const p = document.createElement('p');
      p.textContent = str;
      bubble.replaceChildren(p);
    } else {
      bubble.replaceChildren(sanitizeToFragment(str));
    }
  }

  #buildTypingMessage(fromId) {
    const msg = document.createElement('chat-message');
    msg.setAttribute('data-role', 'agent');
    msg.setAttribute('data-status', 'typing');

    let name = 'Agent';
    if (fromId) {
      msg.setAttribute('data-from', fromId);
      this.#resolveLabel(msg);
      name = this.#participants.get(fromId)?.name ?? fromId;
    }

    // Add model attribution if set
    const model = this.getAttribute('model');
    if (model) msg.setAttribute('data-model', model);

    // Announce via real text inside the live log — an aria-label on a
    // generic element is not read. chat-bubble keeps drawing the dots while
    // this hidden label is its only child.
    const bubble = document.createElement('chat-bubble');
    const label = document.createElement('span');
    label.className = 'visually-hidden';
    label.setAttribute('data-chat-typing', '');
    label.textContent = `${name} is typing`;
    bubble.appendChild(label);
    msg.appendChild(bubble);

    return msg;
  }

  #getAgentId() {
    for (const [id, p] of this.#participants) {
      if (p.role === 'agent') return id;
    }
    return null;
  }

  // --- Empty state ---

  /**
   * The placeholder lives inside the thread, which always stays rendered:
   * hiding an empty role="log" would keep it out of the accessibility tree
   * until after the first message, so that message would not be announced.
   */
  #updateEmptyState() {
    if (!this.#thread) return;
    const hasMessages = this.#thread.querySelector(':scope > chat-message') !== null;

    if (hasMessages) {
      this.#emptyEl?.remove();
      this.#emptyEl = null;
      return;
    }

    if (!this.#emptyEl) {
      this.#emptyEl = this.#thread.querySelector(':scope > [data-chat-empty]');
    }
    if (!this.#emptyEl) {
      this.#emptyEl = document.createElement('p');
      this.#emptyEl.setAttribute('data-chat-empty', '');
      this.#emptyEl.textContent = this.getAttribute('empty-message') || 'Send a message to start.';
    }
    if (this.#emptyEl.parentNode !== this.#thread) this.#thread.prepend(this.#emptyEl);
  }

  // --- Scroll ---

  #scrollToBottom() {
    if (!this.#thread) return;
    requestAnimationFrame(() => {
      this.#thread.scrollTop = this.#thread.scrollHeight;
    });
  }

  /**
   * Scroll the thread to the bottom. Public so consumers driving their own
   * transport (e.g. ai-chat streaming chunks into a bubble) can keep the
   * newest content in view without reaching into private state.
   */
  scrollToBottom() {
    this.#scrollToBottom();
  }

  // --- Fetch ---

  /**
   * @param {string} endpoint
   * @param {string} message
   * @param {AbortSignal} signal
   */
  async #fetchResponse(endpoint, message, signal) {
    const body = {
      message,
      model: this.getAttribute('model') || undefined,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
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

  /**
   * Append a message. Content for role "user" is inserted as text; any other
   * role is treated as HTML and sanitized.
   * @param {string} role
   * @param {string} content
   * @param {string} [from]
   * @returns {HTMLElement | undefined} The new chat-message.
   */
  appendMessage(role, content, from) {
    if (!this.#thread) return;
    const msg = this.#buildMessage(role, content, from);
    this.#thread.appendChild(msg);
    this.#scrollToBottom();
    this.#updateEmptyState();
    return msg;
  }

  /**
   * Finish a typing placeholder (the `typingElement` from chat-window:send)
   * in place: fill its bubble with sanitized HTML (plain text is wrapped in
   * <p>), clear data-status and the hidden typing label, and scroll to the
   * newest content. Pass `{ error: true }` to mark it data-status="error".
   * @param {Element} messageEl
   * @param {string} content
   * @param {{ error?: boolean }} [opts]
   */
  resolveTyping(messageEl, content, { error = false } = {}) {
    if (!messageEl) return;
    let bubble = messageEl.querySelector(':scope > chat-bubble');
    if (!bubble) {
      bubble = document.createElement('chat-bubble');
      messageEl.appendChild(bubble);
    }
    this.#fillBubble(bubble, content);
    messageEl.removeAttribute('aria-label');
    if (error) messageEl.setAttribute('data-status', 'error');
    else messageEl.removeAttribute('data-status');
    this.#scrollToBottom();
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * The current message list as a plain data array. Each entry:
   * `{ id, role, content, from? }`. Reflects the <chat-message> children
   * of the thread (typing placeholders excluded). `content` is text for
   * role "user" and the bubble's HTML for every other role, so the array
   * round-trips through the setter.
   *
   * @returns {Array<{ id?: string, role: string, content: string, from?: string }>} Message records.
   */
  get messages() {
    if (!this.#thread) return [];
    return [...this.#thread.querySelectorAll(':scope > chat-message:not([data-status="typing"])')]
      .map(m => {
        const role = m.getAttribute('data-role') || 'user';
        const bubble = m.querySelector('chat-bubble');
        return {
          id: m.id || m.getAttribute('data-id') || undefined,
          role,
          content: (role === 'user' ? bubble?.textContent?.trim() : bubble?.innerHTML) || '',
          from: m.getAttribute('data-from') || undefined,
        };
      });
  }

  /**
   * Replace the chat thread with a new message list. Each entry needs
   * `id` (the diff key), `role` ('user' | 'agent' | ...), and `content`
   * (text for role "user", sanitized HTML otherwise). Optional `from` tags
   * the message with a participant id.
   *
   * Replaces everything in the thread: server-rendered messages, messages
   * added by sending or appendMessage(), and typing placeholders. Runs a
   * keyed diff: a <chat-message> whose id persists across assignments —
   * including a server-rendered one with a matching `id` — is preserved
   * (mid-animation messages, focused inputs inside a message, sticky
   * scroll state survive). New ids render fresh; everything else goes.
   *
   * Emits chat-window:messages-changed { messages, source: 'property' }.
   */
  set messages(value) {
    if (!this.#thread) return;
    const next = Array.isArray(value) ? value : [];

    // Forget managed nodes that left the thread (clearThread, manual removal).
    for (const [key, el] of this.#messageNodes) {
      if (el.parentNode !== this.#thread) this.#messageNodes.delete(key);
    }
    // Adopt id'd server-rendered messages so a matching id is preserved;
    // remove every other unmanaged child so the thread is truly replaced.
    const managed = new Set(this.#messageNodes.values());
    for (const child of [...this.#thread.children]) {
      if (managed.has(child)) continue;
      if (child.localName === 'chat-message' && child.id
          && !child.matches('[data-status="typing"]')
          && !this.#messageNodes.has(child.id)) {
        this.#messageNodes.set(child.id, child);
        continue;
      }
      if (child === this.#emptyEl) this.#emptyEl = null;
      child.remove();
    }

    diffByKey({
      newItems: next,
      nodes: this.#messageNodes,
      keyOf: (m) => m.id ?? m.role + ':' + m.content,
      renderItem: (m) => {
        const node = this.#buildMessage(m.role || 'user', m.content || '', m.from);
        if (m.id) node.id = m.id;
        return node;
      },
      containerFor: () => this.#thread,
    });

    this.#updateEmptyState();
    this.#scrollToBottom();

    this.dispatchEvent(new CustomEvent('chat-window:messages-changed', {
      detail: { messages: next, source: 'property' },
      bubbles: true,
    }));
  }
}

registerComponent('chat-window', ChatWindow);

export { ChatWindow };
