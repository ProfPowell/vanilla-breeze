/**
 * <requirement-card> — Display atom for ONE NFR ility row.
 *
 * Display-only. The prioritization decision lives in <nfr-compass>;
 * this component just renders one row's worth of state — name +
 * category badge + priority pill + rationale + (optional) conflict flag —
 * for use on status dashboards, ADR appendices, or anywhere a project
 * wants to surface a single ility outside the compass.
 *
 * Slots:
 *   name           — ility label (e.g. "Performance")
 *   badge          — category / version / source tag
 *   priority-pill  — author-supplied custom pill (otherwise the default
 *                    pill renders from data-priority)
 *   rationale      — why this priority was chosen (visible especially
 *                    for Critical rows)
 *   conflicts      — short conflict / drift note
 *
 * Attributes:
 *   data-priority  — critical | important | acceptable | not-relevant
 *   data-conflict  — boolean (presence flag)
 *
 * Emits:
 *   requirement-card:click — bubbles a structured detail when the card
 *                            is activated (mouse, keyboard, or touch);
 *                            parent components can wire navigation.
 *
 * Pattern reference: matches the shadow-DOM + slot conventions from
 * <score-card> (also a single-row dashboard atom).
 */

import { styles } from './styles.js';
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

const PRIORITIES = Object.freeze(['critical', 'important', 'acceptable', 'not-relevant']);
const PRIORITY_LABELS = Object.freeze({
  'critical':     'Critical',
  'important':    'Important',
  'acceptable':   'Acceptable',
  'not-relevant': 'Not relevant',
});
const OPTIONAL_SLOTS = ['badge', 'priority-pill', 'rationale', 'conflicts'];

const TEMPLATE = `
  <style>${styles}</style>
  <article class="card" part="card">
    <header class="head" part="head">
      <span class="name" part="name"><slot name="name"></slot></span>
      <span class="badge" part="badge"><slot name="badge"></slot></span>
    </header>
    <span class="pill" part="pill">
      <slot name="priority-pill"><span class="priority-default" part="priority-default" data-priority-default></span></slot>
    </span>
    <p class="rationale" part="rationale"><slot name="rationale"></slot></p>
    <p class="conflicts" part="conflicts"><slot name="conflicts"></slot></p>
  </article>
`;

class RequirementCard extends VBElement {
  static get observedAttributes() {
    return ['data-priority', 'data-conflict', 'tabindex'];
  }

  setup() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = TEMPLATE;
      for (const name of OPTIONAL_SLOTS) {
        const slot = root.querySelector(`slot[name="${name}"]`);
        slot?.addEventListener('slotchange', () => this.#syncSlot(name, slot));
        this.#syncSlot(name, slot);
      }
    } else {
      for (const name of OPTIONAL_SLOTS) {
        const slot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
        this.#syncSlot(name, slot);
      }
    }
    this.#syncPriority();
    this.#syncDefaultPill();
    this.#syncInteractive();

    this.listen(this, 'click', (e) => this.#onActivate(e));
    this.listen(this, 'keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && this.#interactive) {
        e.preventDefault();
        this.#onActivate(e);
      }
    });
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'data-priority') {
      this.#syncPriority();
      this.#syncDefaultPill();
    } else if (name === 'data-conflict') {
      // Border + shadow are CSS-driven via [data-conflict]; no JS needed.
    } else if (name === 'tabindex') {
      this.#syncInteractive();
    }
  }

  // ── Public API ────────────────────────────────────────────────────

  get priority() { return (this.dataset.priority || '').toLowerCase(); }
  set priority(v) {
    const next = String(v || '').toLowerCase();
    if (PRIORITIES.includes(next)) this.dataset.priority = next;
    else delete this.dataset.priority;
  }

  get hasConflict() { return this.hasAttribute('data-conflict'); }
  set hasConflict(v) {
    if (v) this.setAttribute('data-conflict', '');
    else this.removeAttribute('data-conflict');
  }

  // ── Internal ──────────────────────────────────────────────────────

  get #interactive() {
    return this.hasAttribute('tabindex') || this.closest('a[href], button');
  }

  #syncSlot(name, slot) {
    const hasContent = !!slot && slot.assignedNodes({ flatten: true }).some(n =>
      n.nodeType === Node.ELEMENT_NODE ||
      (n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0)
    );
    this.setState(`has-${name}`, hasContent);
  }

  #syncPriority() {
    const value = (this.dataset.priority || '').toLowerCase();
    for (const p of PRIORITIES) this.setState(`priority-${p}`, p === value);
  }

  #syncDefaultPill() {
    const value = (this.dataset.priority || '').toLowerCase();
    const el = this.shadowRoot?.querySelector('[data-priority-default]');
    if (!el) return;
    el.textContent = PRIORITY_LABELS[value] || '';
  }

  #syncInteractive() {
    this.setState('interactive', !!this.#interactive);
  }

  #onActivate(event) {
    if (!this.#interactive) return;
    this.dispatchEvent(new CustomEvent('requirement-card:click', {
      bubbles: true, composed: true,
      detail: {
        priority: this.priority || null,
        hasConflict: this.hasConflict,
        originalEvent: event,
      },
    }));
  }
}

registerComponent('requirement-card', RequirementCard);

export { RequirementCard };
