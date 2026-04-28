import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * recently-visited: Device-local reader history lens.
 *
 * Renders the reader's local visit history (stored under
 * `vb:recently-visited` in localStorage). Tracking is handled by the
 * sitewide tracker in src/utils/recently-visited-init.js, which is
 * loaded by the autoload bundle so every page gets recorded — not
 * just pages that mount this component. Reader sovereignty controls
 * (Pause / Clear) live here because they only matter when the lens
 * is on screen.
 *
 * @attr {number}  limit       Max entries rendered (default 25)
 * @attr {string}  empty-text  Message shown when history is empty
 *
 * @example
 *   <recently-visited limit="20"></recently-visited>
 */
class RecentlyVisited extends VBElement {
  static STORAGE_KEY = 'vb:recently-visited';
  static PAUSE_KEY = 'vb:recently-visited:paused';

  setup() {
    this.#render();
    this.#wireStorage();
  }

  disconnect() {
    if (this.#storageHandler) {
      window.removeEventListener('storage', this.#storageHandler);
      this.#storageHandler = null;
    }
  }

  #storageHandler = null;

  #wireStorage() {
    /* Re-render when another tab updates the store (clear, pause toggle,
       new visits) so the lens stays consistent across windows. */
    this.#storageHandler = (e) => {
      if (e.key === RecentlyVisited.STORAGE_KEY || e.key === RecentlyVisited.PAUSE_KEY) {
        this.#render();
      }
    };
    window.addEventListener('storage', this.#storageHandler);
  }

  #isPaused() {
    try {
      return localStorage.getItem(RecentlyVisited.PAUSE_KEY) === '1';
    } catch {
      return false;
    }
  }

  #setPaused(value) {
    try {
      if (value) localStorage.setItem(RecentlyVisited.PAUSE_KEY, '1');
      else localStorage.removeItem(RecentlyVisited.PAUSE_KEY);
    } catch { /* private mode */ }
  }

  #read() {
    try {
      const raw = localStorage.getItem(RecentlyVisited.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  #write(entries) {
    try {
      localStorage.setItem(RecentlyVisited.STORAGE_KEY, JSON.stringify(entries));
    } catch { /* quota / private mode */ }
  }

  #limit() {
    const raw = parseInt(this.getAttribute('limit') || '25', 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 25;
  }

  #render() {
    const entries = this.#read().slice(0, this.#limit());
    const emptyText = this.getAttribute('empty-text') || 'No recently visited pages yet.';
    const paused = this.#isPaused();

    /* Icon buttons (icon-wc + visually-hidden label + tooltip via title)
       follow the share-wc/print-page pattern: icon-only at the size of
       the action header, accessible to screen readers. */
    const pauseLabel = paused ? 'Resume tracking' : 'Pause tracking';
    const pauseIcon = paused ? 'play' : 'pause';
    const clearDisabled = entries.length === 0;

    const parts = [];
    parts.push('<header class="recently-visited-header">');
    parts.push(`<h2 class="recently-visited-heading">Recently visited</h2>`);
    parts.push('<menu class="recently-visited-actions">');
    parts.push(`<li><button type="button"
        data-recently-visited-pause
        class="icon-button"
        aria-pressed="${paused}"
        aria-label="${pauseLabel}"
        title="${pauseLabel}"
      ><icon-wc name="${pauseIcon}" size="sm"></icon-wc></button></li>`);
    parts.push(`<li><button type="button"
        data-recently-visited-clear
        class="icon-button"
        aria-label="Clear history"
        title="Clear history"
        ${clearDisabled ? 'disabled' : ''}
      ><icon-wc name="trash-2" size="sm"></icon-wc></button></li>`);
    parts.push('</menu>');
    parts.push('</header>');
    parts.push('<p class="recently-visited-explainer"><small>Stored on this device only. Never sent to a server.</small></p>');

    if (entries.length === 0) {
      parts.push(`<p class="recently-visited-empty">${escapeHtml(emptyText)}</p>`);
    } else {
      parts.push('<ol class="recently-visited-list">');
      for (const e of entries) {
        const when = relativeTime(e.ts);
        parts.push(`<li><a href="${escapeAttr(e.url)}">${escapeHtml(e.title || e.url)}</a><small>${when}</small></li>`);
      }
      parts.push('</ol>');
    }

    this.innerHTML = parts.join('\n');
    this.#wireControls();
  }

  #wireControls() {
    const clear = this.querySelector('[data-recently-visited-clear]');
    if (clear) {
      clear.addEventListener('click', () => {
        this.#write([]);
        this.#render();
        this.dispatchEvent(new CustomEvent('recently-visited:clear', { bubbles: true }));
      });
    }
    const pause = this.querySelector('[data-recently-visited-pause]');
    if (pause) {
      pause.addEventListener('click', () => {
        this.#setPaused(!this.#isPaused());
        this.#render(); /* re-render to flip the icon and aria-pressed */
        this.dispatchEvent(new CustomEvent('recently-visited:pause-toggle', {
          bubbles: true,
          detail: { paused: this.#isPaused() }
        }));
      });
    }
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
}
function escapeAttr(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}
function relativeTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

registerComponent('recently-visited', RecentlyVisited);

export { RecentlyVisited };
