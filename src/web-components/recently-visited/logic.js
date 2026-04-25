import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * recently-visited: Device-local reader history lens.
 *
 * Tracks pages the reader has visited *on this device only*. Stored in
 * localStorage under `vb:recently-visited`. Never sent to a backend, never
 * aggregated, never crosses devices. Reader sovereignty: there's a Clear
 * History control and a Pause toggle.
 *
 * Pages list is most-recent-first, deduplicated by URL, capped by `limit`.
 *
 * @attr {number} limit       Max entries to keep (default 25)
 * @attr {boolean} no-track   Don't append the current page on connect
 * @attr {string}  empty-text Message shown when history is empty
 *
 * @example
 *   <recently-visited limit="20"></recently-visited>
 */
class RecentlyVisited extends VBElement {
  static STORAGE_KEY = 'vb:recently-visited';
  static PAUSE_KEY = 'vb:recently-visited:paused';

  setup() {
    if (!this.hasAttribute('no-track') && !this.#isPaused()) {
      this.#trackCurrent();
    }
    this.#render();
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
    } catch { /* quota / private mode — silently drop */ }
  }

  #limit() {
    const raw = parseInt(this.getAttribute('limit') || '25', 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 25;
  }

  #trackCurrent() {
    const url = location.pathname + location.search;
    const title = document.title;
    const ts = Date.now();
    const entries = this.#read().filter((e) => e.url !== url);
    entries.unshift({ url, title, ts });
    this.#write(entries.slice(0, this.#limit()));
  }

  #render() {
    const entries = this.#read().slice(0, this.#limit());
    const emptyText = this.getAttribute('empty-text') || 'No recently visited pages yet.';
    const paused = this.#isPaused();

    const parts = [];
    parts.push('<header class="recently-visited-header">');
    parts.push(`<h2 class="recently-visited-heading">Recently visited</h2>`);
    parts.push('<menu class="recently-visited-actions">');
    parts.push(`<li><label class="recently-visited-pause"><input type="checkbox" data-recently-visited-pause${paused ? ' checked' : ''}> <span>Pause</span></label></li>`);
    parts.push(`<li><button type="button" data-recently-visited-clear class="ghost">Clear</button></li>`);
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
    this.#wire();
  }

  #wire() {
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
      pause.addEventListener('change', () => {
        this.#setPaused(pause.checked);
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
