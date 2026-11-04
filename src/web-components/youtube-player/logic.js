/**
 * <youtube-player> — Lightweight YouTube embed with facade pattern
 *
 * Renders a thumbnail + play button on load, replacing it with an iframe
 * only when the user presses play. The embed loads from youtube-nocookie.com.
 * The thumbnail comes from i.ytimg.com unless a local `poster` is given, in
 * which case nothing is requested from Google until the user presses play.
 *
 * The inner <button> is the only control: the host carries no role/tabindex.
 * Reconnect (move/reinsert) re-renders the facade: a moved iframe reloads
 * anyway and would restart playback.
 *
 * @attr {string}  video-id   - YouTube video ID (required)
 * @attr {string}  title      - Video title: iframe title and play-button name (default "YouTube video")
 * @attr {number}  start      - Start playback at N seconds (non-negative integer)
 * @attr {number}  end        - Stop playback at N seconds (non-negative integer)
 * @attr {string}  list       - YouTube playlist ID
 * @attr {string}  params     - Raw query string appended to embed URL
 * @attr {boolean} autoplay   - Load the iframe on connect (no facade); ignored under reduced motion
 * @attr {string}  thumbnail  - Thumbnail resolution: hq | mq | sd | maxres (falls back to hq)
 * @attr {string}  poster     - Local image URL for the facade; skips the i.ytimg.com request
 * @attr {string}  data-label-play - Play-button label template (default "Play {title}")
 * @attr {string}  state      - Read-only: "ready" (facade) or "active" (iframe)
 *
 * @fires youtube-player:activate - detail { videoId, fromUser } when the iframe is inserted
 *
 * @example
 * <youtube-player video-id="dQw4w9WgXcQ" title="Never Gonna Give You Up"></youtube-player>
 */

import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

const PLAY_SVG = `<svg viewBox="0 0 68 48" width="68" height="48" aria-hidden="true" focusable="false"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.64 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="var(--color-error, #f00)"/><path d="M45 24 27 14v20z" fill="#fff"/></svg>`;

const THUMB_MAP = { hq: 'hqdefault', mq: 'mqdefault', sd: 'sddefault', maxres: 'maxresdefault' };
const DEFAULT_TITLE = 'YouTube video';
const DEFAULT_PLAY_LABEL = 'Play {title}';
const SECONDS = /^\d+$/;

/** Escape a string for use inside a double-quoted HTML attribute. */
function escapeAttr(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.hasAttribute('data-motion-reduced');
}

class YouTubePlayer extends VBElement {
  /** @type {string} */
  #id = '';
  /** @type {string} */
  #title = DEFAULT_TITLE;

  setup() {
    const id = this.getAttribute('video-id');
    this.#title = this.getAttribute('title') || DEFAULT_TITLE;

    if (!id) {
      console.warn('youtube-player: missing required video-id attribute');
      return false;
    }
    // YouTube ids are [A-Za-z0-9_-]; anything else would be interpolated into
    // markup and URLs, so refuse it.
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) {
      console.warn(`youtube-player: invalid video-id ${JSON.stringify(id)}`);
      return false;
    }
    this.#id = id;

    // `autoplay` skips the facade, but never under reduced motion, and it
    // never takes focus: the page did not ask to move the reader.
    if (this.hasAttribute('autoplay') && !prefersReducedMotion()) {
      this.#activate(false);
    } else {
      this.#renderFacade();
    }
    return true;
  }

  /** @param {string} name */
  #seconds(name) {
    const value = this.getAttribute(name);
    if (value === null || value === '') return null;
    if (SECONDS.test(value.trim())) return value.trim();
    console.warn(`youtube-player: ${name} must be whole seconds, got ${JSON.stringify(value)}`);
    return null;
  }

  #buildEmbedURL() {
    const params = new URLSearchParams({ autoplay: '1' });

    const start = this.#seconds('start');
    if (start) params.set('start', start);

    const end = this.#seconds('end');
    if (end) params.set('end', end);

    const list = this.getAttribute('list');
    if (list) params.set('list', list);

    const extra = this.getAttribute('params');
    if (extra) {
      new URLSearchParams(extra).forEach((v, k) => params.set(k, v));
    }

    return `https://www.youtube-nocookie.com/embed/${this.#id}?${params}`;
  }

  /** @param {string} res */
  #thumbnailURL(res) {
    return `https://i.ytimg.com/vi/${this.#id}/${THUMB_MAP[/** @type {keyof typeof THUMB_MAP} */ (res)] ?? 'hqdefault'}.jpg`;
  }

  #playLabel() {
    const template = this.getAttribute('data-label-play') || DEFAULT_PLAY_LABEL;
    return template.replace(/\{title\}/g, this.#title);
  }

  #renderFacade() {
    this.setAttribute('state', 'ready');

    const img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    const poster = this.getAttribute('poster');
    if (poster) {
      img.src = poster;
    } else {
      const res = this.getAttribute('thumbnail') ?? 'hq';
      img.referrerPolicy = 'no-referrer';
      img.src = this.#thumbnailURL(res);
      if (res === 'sd' || res === 'maxres') {
        // Many videos have no sd/maxres image: i.ytimg.com answers 404 (or a
        // 120×90 grey placeholder). Fall back to hqdefault, which always exists.
        const fallback = () => { img.src = this.#thumbnailURL('hq'); };
        img.addEventListener('error', fallback, { once: true });
        img.addEventListener('load', () => { if (img.naturalWidth <= 120) fallback(); }, { once: true });
      }
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', this.#playLabel());
    button.innerHTML = PLAY_SVG;
    button.addEventListener('click', () => this.#activate(true), { once: true });

    this.replaceChildren(img, button);
  }

  /** @param {boolean} fromUser - activation came from the play button */
  #activate(fromUser) {
    this.setAttribute('state', 'active');

    this.innerHTML = `<iframe src="${escapeAttr(this.#buildEmbedURL())}" title="${escapeAttr(this.#title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>`;

    if (fromUser) this.querySelector('iframe')?.focus();
    this.dispatchEvent(new CustomEvent('youtube-player:activate', {
      bubbles: true,
      detail: { videoId: this.#id, fromUser },
    }));
  }
}

registerComponent('youtube-player', YouTubePlayer);
export { YouTubePlayer };
