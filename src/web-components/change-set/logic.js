import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * change-set: Interactive change tracking group
 *
 * Wraps related <ins> and <del> elements into a reviewable unit with
 * toggle controls. Users can switch between tracking view (both visible),
 * final text (only insertions), or original text (only deletions).
 *
 * The CSS handles view states via data-view attribute; the JS adds
 * interactive toggle controls.
 *
 * @attr {string} view     - 'final' | 'original' | omitted (tracking)
 * @attr {string} datetime - ISO date of the change set
 * @attr {string} author   - Author of the changes
 *
 * @fires change-set:view - When view mode changes
 *   detail: { view: 'tracking' | 'final' | 'original' }
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
class ChangeSet extends VBElement {
  setup() {
    if (!this.querySelector('[data-controls]')) {
      this.#addControls();
    }
  }

  #addControls() {
    const controls = document.createElement('nav');
    controls.setAttribute('data-controls', '');
    controls.setAttribute('aria-label', 'Change view controls');
    controls.innerHTML = `
      <button type="button" data-action="tracking" aria-pressed="true">
        Tracking
      </button>
      <button type="button" data-action="final" aria-pressed="false">
        Final
      </button>
      <button type="button" data-action="original" aria-pressed="false">
        Original
      </button>
    `;
    this.prepend(controls);

    controls.addEventListener('click', (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      const action = /** @type {HTMLElement | null} */ (target.closest('[data-action]'))?.dataset.action;
      if (!action) return;

      if (action === 'tracking') {
        this.removeAttribute('view');
      } else {
        this.setAttribute('view', action);
      }

      for (const btn of controls.querySelectorAll('button')) {
        btn.setAttribute('aria-pressed', String(btn.dataset.action === action));
      }

      this.dispatchEvent(new CustomEvent('change-set:view', {
        detail: { view: action },
        bubbles: true
      }));
    });
  }

  get view() {
    return this.getAttribute('view') ?? 'tracking';
  }

  /**
   * Set the view mode. Idempotent — assigning the current view is a
   * no-op. Emits change-set:view with `source: 'api'` so reactive
   * consumers can filter their own assignments out of the event stream
   * (user-driven button clicks emit with no source field, behavior
   * preserved).
   */
  set view(value) {
    const current = this.view;
    if (current === value) return;
    if (value === 'tracking') {
      this.removeAttribute('view');
    } else {
      this.setAttribute('view', value);
    }
    // Sync button pressed state so JS-first changes show in the UI.
    const controls = this.querySelector('[data-controls]');
    if (controls) {
      for (const btn of controls.querySelectorAll('button')) {
        btn.setAttribute('aria-pressed', String(btn.dataset.action === value));
      }
    }
    this.dispatchEvent(new CustomEvent('change-set:view', {
      detail: { view: value, source: 'api' },
      bubbles: true,
    }));
  }
}

registerComponent('change-set', ChangeSet);

export { ChangeSet };
