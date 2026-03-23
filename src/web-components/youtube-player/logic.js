/**
 * <youtube-player> — Lightweight YouTube embed with facade pattern
 *
 * Renders a thumbnail + play button on load, replacing with an iframe
 * only when the user clicks. Privacy-first: uses youtube-nocookie.com.
 *
 * @attr {string}  video-id   - YouTube video ID (required)
 * @attr {string}  title      - Accessible title for iframe + play button
 * @attr {number}  start      - Start playback at N seconds
 * @attr {string}  list       - YouTube playlist ID
 * @attr {string}  params     - Raw query string appended to embed URL
 * @attr {boolean} autoplay   - Auto-initialise iframe on load (no facade)
 * @attr {string}  thumbnail  - Thumbnail resolution: hq | mq | sd | maxres
 * @attr {string}  state      - Component-managed: "ready" (facade) or "active" (iframe)
 *
 * @example
 * <youtube-player video-id="dQw4w9WgXcQ" title="Never Gonna Give You Up"></youtube-player>
 */

import { registerComponent } from '../../lib/bundle-registry.js';

const PLAY_SVG = `<svg viewBox="0 0 68 48" width="68" height="48" aria-hidden="true" focusable="false"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.64 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="var(--color-danger, #f00)"/><path d="M45 24 27 14v20z" fill="#fff"/></svg>`;

const THUMB_MAP = { hq: 'hqdefault', mq: 'mqdefault', sd: 'sddefault', maxres: 'maxresdefault' };

class YouTubePlayer extends HTMLElement {
  #id;
  #title;

  connectedCallback() {
    this.#id = this.getAttribute('video-id');
    this.#title = this.getAttribute('title') ?? 'Play video';

    if (!this.#id) {
      console.warn('youtube-player: missing required video-id attribute');
      return;
    }

    if (this.hasAttribute('autoplay')) {
      this.#activate();
    } else {
      this.#renderFacade();
    }
  }

  #buildEmbedURL() {
    const params = new URLSearchParams({ autoplay: '1' });

    const start = this.getAttribute('start');
    if (start) params.set('start', start);

    const list = this.getAttribute('list');
    if (list) params.set('list', list);

    if (this.getAttribute('params')) {
      new URLSearchParams(this.getAttribute('params')).forEach((v, k) => params.set(k, v));
    }

    return `https://www.youtube-nocookie.com/embed/${this.#id}?${params}`;
  }

  #thumbnailURL() {
    const res = this.getAttribute('thumbnail') ?? 'hq';
    return `https://i.ytimg.com/vi/${this.#id}/${THUMB_MAP[res] ?? 'hqdefault'}.jpg`;
  }

  #renderFacade() {
    this.setAttribute('state', 'ready');
    this.setAttribute('tabindex', '0');
    this.setAttribute('role', 'button');
    this.setAttribute('aria-label', `Play ${this.#title}`);

    this.innerHTML = `<img src="${this.#thumbnailURL()}" alt="" loading="lazy" decoding="async"><button type="button" aria-label="Play ${this.#title}">${PLAY_SVG}</button>`;

    this.addEventListener('click', this.#handleActivate, { once: true });
    this.addEventListener('keydown', this.#handleKey);
  }

  #handleActivate = () => {
    this.removeEventListener('keydown', this.#handleKey);
    this.#activate();
  };

  #handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.removeEventListener('click', this.#handleActivate);
      this.#activate();
    }
  };

  #activate() {
    this.setAttribute('state', 'active');
    this.removeAttribute('tabindex');
    this.removeAttribute('role');
    this.removeAttribute('aria-label');

    this.innerHTML = `<iframe src="${this.#buildEmbedURL()}" title="${this.#title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`;

    this.querySelector('iframe')?.focus();
  }
}

registerComponent('youtube-player', YouTubePlayer);
export { YouTubePlayer };
