import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * change-set: Interactive change tracking group
 *
 * Wraps related <ins> and <del> elements into a reviewable unit with
 * toggle controls. Users can switch between tracking view (both visible),
 * final text (only insertions), or original text (only deletions).
 *
 * The CSS handles view states via the `view` attribute (no JS needed for
 * a static view); the JS adds a caption from author/datetime and the
 * toggle controls.
 *
 * @attr {string} view     - 'final' | 'original' | omitted (tracking). Observed.
 * @attr {string} datetime - ISO date of the change set (rendered in the caption)
 * @attr {string} author   - Author of the changes (rendered in the caption)
 * @attr {string} controls - 'none' renders no toggle controls
 *
 * @fires change-set:view - When view mode changes
 *   detail: { view: 'tracking' | 'final' | 'original', source?: 'api' }
 *
 * @example
 * <change-set datetime="2026-02-20" author="tpowell">
 *   <p>
 *     Send requests to
 *     <del>/api/v1/upload</del>
 *     <ins>/api/v2/ingest</ins>
 *     with a
 *     <del>Content-Type: application/xml</del>
 *     <ins>Content-Type: application/json</ins>
 *     header.
 *   </p>
 * </change-set>
 */

const VIEWS = ['tracking', 'final', 'original'];
const LABELS = { tracking: 'Tracking', final: 'Final', original: 'Original' };

class ChangeSet extends VBElement {
  static observedAttributes = ['view', 'author', 'datetime', 'controls'];

  setup() {
    this.#render();
    this.listen(this, 'click', this.#onClick);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.hasAttribute('data-upgraded') || oldVal === newVal) return;
    if (name === 'view') this.#syncPressed();
    else this.#render();
  }

  /** (Re)build the caption and controls. Idempotent across reconnects. */
  #render() {
    this.querySelector(':scope > [data-change-caption]')?.remove();
    this.querySelector(':scope > [data-controls]')?.remove();

    const caption = this.#buildCaption();
    const nodes = [];
    if (caption) nodes.push(caption);
    if (this.getAttribute('controls') !== 'none') nodes.push(this.#buildControls(caption));
    this.prepend(...nodes);
    this.#syncPressed();
  }

  /** "Changes by <author>, <date>" — only when either is present. */
  #buildCaption() {
    const author = this.getAttribute('author');
    const datetime = this.getAttribute('datetime');
    if (!author && !datetime) return null;

    const p = document.createElement('p');
    p.setAttribute('data-change-caption', '');
    p.append(author ? `Changes by ${author}` : 'Changes');
    if (datetime) {
      p.append(author ? ', ' : ' from ');
      const time = document.createElement('time');
      time.setAttribute('datetime', datetime);
      time.textContent = this.#formatDate(datetime);
      p.append(time);
    }
    return p;
  }

  /** A labelled button group (not a landmark: there can be many per page). */
  #buildControls(caption) {
    const controls = document.createElement('div');
    controls.setAttribute('data-controls', '');
    controls.setAttribute('role', 'group');
    const context = caption ? `, ${caption.textContent}` : '';
    controls.setAttribute('aria-label', `Change view${context}`);
    for (const view of VIEWS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.action = view;
      btn.textContent = LABELS[view];
      controls.append(btn);
    }
    return controls;
  }

  #formatDate(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const lang = /** @type {HTMLElement | null} */ (this.closest('[lang]'))?.lang || undefined;
    // A bare YYYY-MM-DD parses as UTC midnight; format it in UTC so it
    // doesn't slip to the previous day west of Greenwich.
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    return new Intl.DateTimeFormat(lang, {
      dateStyle: 'medium',
      ...(dateOnly ? { timeZone: 'UTC' } : { timeStyle: 'short' }),
    }).format(d);
  }

  #syncPressed() {
    const view = this.view;
    for (const btn of this.querySelectorAll(':scope > [data-controls] > button[data-action]')) {
      btn.setAttribute('aria-pressed', String(/** @type {HTMLElement} */ (btn).dataset.action === view));
    }
  }

  /** @param {MouseEvent} e */
  #onClick = (e) => {
    const btn = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest?.('[data-action]'));
    if (!btn || btn.parentElement?.parentElement !== this || !btn.parentElement.hasAttribute('data-controls')) return;
    const action = btn.dataset.action;
    if (!action || !VIEWS.includes(action)) return;
    if (action === this.view) return;
    this.#applyView(action);
    this.dispatchEvent(new CustomEvent('change-set:view', {
      detail: { view: action },
      bubbles: true,
    }));
  };

  #applyView(value) {
    if (value === 'tracking') this.removeAttribute('view');
    else this.setAttribute('view', value);
    // attributeChangedCallback syncs aria-pressed once upgraded; do it here
    // too for calls made before then.
    this.#syncPressed();
  }

  /** @returns {'tracking' | 'final' | 'original'} */
  get view() {
    const v = this.getAttribute('view');
    return v === 'final' || v === 'original' ? v : 'tracking';
  }

  /**
   * Set the view mode. Idempotent — assigning the current view is a
   * no-op. Emits change-set:view with `source: 'api'` so reactive
   * consumers can filter their own assignments out of the event stream
   * (user-driven button clicks emit with no source field).
   */
  set view(value) {
    if (!VIEWS.includes(value) || this.view === value) return;
    this.#applyView(value);
    this.dispatchEvent(new CustomEvent('change-set:view', {
      detail: { view: value, source: 'api' },
      bubbles: true,
    }));
  }
}

registerComponent('change-set', ChangeSet);

export { ChangeSet };
