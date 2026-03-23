import { registerComponent } from '../../lib/bundle-registry.js';

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
class ChangeSet extends HTMLElement {
  connectedCallback() {
    if (!this.querySelector('[data-controls]')) {
      this.#addControls();
    }
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    this.removeAttribute('data-upgraded');
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
      const action = target.closest('[data-action]')?.dataset.action;
      if (!action) return;

      if (action === 'tracking') {
        this.removeAttribute('view');
      } else {
        this.setAttribute('view', action);
      }

      for (const btn of controls.querySelectorAll('button')) {
        btn.setAttribute('aria-pressed', btn.dataset.action === action);
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

  set view(value) {
    if (value === 'tracking') {
      this.removeAttribute('view');
    } else {
      this.setAttribute('view', value);
    }
  }
}

registerComponent('change-set', ChangeSet);

export { ChangeSet };
