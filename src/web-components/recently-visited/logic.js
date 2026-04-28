import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * recently-visited: Device-local reader history lens.
 *
 * Renders the reader's local visit history (stored under
 * `vb:recently-visited` in localStorage). Tracking is handled by the
 * sitewide tracker in src/utils/recently-visited-init.js, which is
 * loaded by the autoload bundle so every page gets recorded — not
 * just pages that mount this component.
 *
 * Reader sovereignty controls (Pause / Anchors / Clear) live in the
 * component header because they only matter when the lens is on screen.
 *
 * @attr {number}  limit       Max page-groups rendered (default 25)
 * @attr {string}  empty-text  Message shown when history is empty
 *
 * @example
 *   <recently-visited limit="20"></recently-visited>
 */
class RecentlyVisited extends VBElement {
  static STORAGE_KEY = 'vb:recently-visited';
  static PAUSE_KEY = 'vb:recently-visited:paused';
  static TRACK_ANCHORS_KEY = 'vb:recently-visited:track-anchors';

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
    /* Re-render when another tab updates any of our keys so the lens
       stays consistent across windows. */
    const watched = new Set([
      RecentlyVisited.STORAGE_KEY,
      RecentlyVisited.PAUSE_KEY,
      RecentlyVisited.TRACK_ANCHORS_KEY,
    ]);
    this.#storageHandler = (e) => {
      if (watched.has(e.key)) this.#render();
    };
    window.addEventListener('storage', this.#storageHandler);
  }

  #isPaused() {
    try { return localStorage.getItem(RecentlyVisited.PAUSE_KEY) === '1'; }
    catch { return false; }
  }

  #setPaused(value) {
    try {
      if (value) localStorage.setItem(RecentlyVisited.PAUSE_KEY, '1');
      else localStorage.removeItem(RecentlyVisited.PAUSE_KEY);
    } catch { /* private mode */ }
  }

  #isAnchorMode() {
    try { return localStorage.getItem(RecentlyVisited.TRACK_ANCHORS_KEY) === '1'; }
    catch { return false; }
  }

  #setAnchorMode(value) {
    try {
      if (value) localStorage.setItem(RecentlyVisited.TRACK_ANCHORS_KEY, '1');
      else localStorage.removeItem(RecentlyVisited.TRACK_ANCHORS_KEY);
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

  /**
   * Group flat entries into per-URL records. Each group carries the
   * page-level info (url, title, most-recent ts) plus an anchors array
   * of any sub-entries with non-empty hash. Sorted by group ts desc.
   */
  #groupByUrl(entries) {
    const groups = new Map();
    for (const e of entries) {
      const url = e.url;
      let g = groups.get(url);
      if (!g) {
        g = { url, title: e.title, ts: e.ts, anchors: [] };
        groups.set(url, g);
      }
      /* Use the most recent ts of any visit (page or anchor) as the
         group's sort key, and the most recent title we've seen. */
      if (e.ts > g.ts) {
        g.ts = e.ts;
        if (e.title) g.title = e.title;
      }
      if (e.hash) {
        g.anchors.push({
          hash: e.hash,
          hashTitle: e.hashTitle || e.hash.slice(1) || e.hash,
          ts: e.ts,
        });
      }
    }
    for (const g of groups.values()) {
      g.anchors.sort((a, b) => b.ts - a.ts);
    }
    return [...groups.values()].sort((a, b) => b.ts - a.ts);
  }

  #render() {
    const entries = this.#read();
    const grouped = this.#groupByUrl(entries).slice(0, this.#limit());
    const emptyText = this.getAttribute('empty-text') || 'No recently visited pages yet.';
    const paused = this.#isPaused();
    const anchorMode = this.#isAnchorMode();

    const pauseLabel = paused ? 'Resume tracking' : 'Pause tracking';
    const pauseIcon = paused ? 'play' : 'pause';
    const anchorLabel = anchorMode ? 'Hide anchor visits' : 'Track anchor visits';
    const clearDisabled = entries.length === 0;

    const parts = [];
    parts.push('<header class="recently-visited-header">');
    parts.push('<h2 class="recently-visited-heading">Recently visited</h2>');
    parts.push('<menu class="recently-visited-actions">');
    parts.push(`<li><button type="button"
        data-recently-visited-pause
        class="icon-button"
        aria-pressed="${paused}"
        aria-label="${pauseLabel}"
        title="${pauseLabel}"
      ><icon-wc name="${pauseIcon}" size="sm"></icon-wc></button></li>`);
    parts.push(`<li><button type="button"
        data-recently-visited-anchors
        class="icon-button"
        aria-pressed="${anchorMode}"
        aria-label="${anchorLabel}"
        title="${anchorLabel}"
      ><icon-wc name="hash" size="sm"></icon-wc></button></li>`);
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

    if (grouped.length === 0) {
      parts.push(`<p class="recently-visited-empty">${escapeHtml(emptyText)}</p>`);
    } else {
      parts.push('<ol class="recently-visited-list">');
      for (const g of grouped) {
        const showAnchors = anchorMode && g.anchors.length > 0;
        if (showAnchors) {
          /* Page with anchor sub-visits — render as <details>. */
          const anchorItems = g.anchors.map((a) => (
            `<li><a href="${escapeAttr(g.url)}${escapeAttr(a.hash)}">${escapeHtml(a.hashTitle)}</a><small>${relativeTime(a.ts)}</small></li>`
          )).join('');
          const countLabel = g.anchors.length === 1 ? '1 anchor' : `${g.anchors.length} anchors`;
          parts.push(`<li class="has-anchors"><details>
            <summary>
              <a href="${escapeAttr(g.url)}">${escapeHtml(g.title || g.url)}</a>
              <small>${countLabel} &middot; ${relativeTime(g.ts)}</small>
            </summary>
            <ul class="recently-visited-anchors">${anchorItems}</ul>
          </details></li>`);
        } else {
          /* Plain page entry — flat link, no expansion. */
          parts.push(`<li><a href="${escapeAttr(g.url)}">${escapeHtml(g.title || g.url)}</a><small>${relativeTime(g.ts)}</small></li>`);
        }
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
        this.#render();
        this.dispatchEvent(new CustomEvent('recently-visited:pause-toggle', {
          bubbles: true,
          detail: { paused: this.#isPaused() },
        }));
      });
    }
    const anchors = this.querySelector('[data-recently-visited-anchors]');
    if (anchors) {
      anchors.addEventListener('click', () => {
        this.#setAnchorMode(!this.#isAnchorMode());
        this.#render();
        this.dispatchEvent(new CustomEvent('recently-visited:anchors-toggle', {
          bubbles: true,
          detail: { anchorMode: this.#isAnchorMode() },
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
