/**
 * share-wc: Social share component with native Web Share API and platform fallbacks
 *
 * Three-tier progressive enhancement:
 * - Tier 1 (native): Single "Share" button using navigator.share()
 * - Tier 2 (platforms): Individual platform buttons with share URLs
 * - Tier 3 (no JS): Static <a> links in light DOM work as-is
 *
 * @attr {string} data-url        - URL to share (default: location.href)
 * @attr {string} data-title      - Share title (default: document.title)
 * @attr {string} data-text       - Share description (default: meta description)
 * @attr {string} data-platforms  - Comma-separated platform list (default: "x,linkedin,bluesky,mastodon,whatsapp,email,copy")
 * @attr {string} data-variant    - Visual variant: "icon", "label", "icon-label" (default: "icon-label")
 * @attr {string} data-size       - Button size: "s", "m", "l" (default: "m")
 * @attr {string} data-label      - Label for native share button (default: "Share")
 * @attr {boolean} data-color     - Present = use platform brand colours
 * @attr {string} data-mastodon-instance - Mastodon instance (default: "mastodon.social")
 * @attr {string} data-tier      - Force tier: "native", "platforms" (overrides auto-detection)
 *
 * @example
 * <share-wc></share-wc>
 *
 * @example Force platform buttons even on devices with Web Share API
 * <share-wc data-tier="platforms" data-platforms="x,linkedin,copy"></share-wc>
 */

import { PLATFORMS, DEFAULT_PLATFORMS } from './platforms.js';

class ShareWc extends HTMLElement {
  #url;
  #title;
  #text;
  #tier;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #copyTimer = null;
  #nav;

  get url() {
    return this.#url;
  }

  set url(val) {
    this.#url = val;
  }

  get title() {
    return this.#title;
  }

  set title(val) {
    this.#title = val;
  }

  get text() {
    return this.#text;
  }

  set text(val) {
    this.#text = val;
  }

  connectedCallback() {
    this.#resolveMeta();
    this.#detectTier();

    if (this.#tier === 'native') {
      this.#renderNative();
    } else if (this.#tier === 'hidden') {
      this.style.display = 'none';
    } else if (this.children.length > 0) {
      this.#enhanceSlotted();
    } else {
      this.#renderPlatforms();
    }

    this.dataset.tier = this.#tier;
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    this.removeAttribute('data-upgraded');
    if (this.#copyTimer) {
      clearTimeout(this.#copyTimer);
      this.#copyTimer = null;
    }
    if (this.#nav) {
      this.#nav.removeEventListener('click', this.#handlePlatformClick);
    }
  }

  /** Programmatically trigger share (native or first platform) */
  async share() {
    if (this.#tier === 'native') {
      await this.#doNativeShare();
    }
  }

  #resolveMeta() {
    // URL: attribute → canonical → location
    this.#url = this.dataset.url
      || document.querySelector('link[rel="canonical"]')?.getAttribute('href')
      || location.href;

    // Title: attribute → og:title → document.title
    this.#title = this.dataset.title
      || document.querySelector('meta[property="og:title"]')?.getAttribute('content')
      || document.title;

    // Text: attribute → meta description → og:description → empty
    this.#text = this.dataset.text
      || document.querySelector('meta[name="description"]')?.getAttribute('content')
      || document.querySelector('meta[property="og:description"]')?.getAttribute('content')
      || '';
  }

  #detectTier() {
    // Explicit override: data-tier="platforms" forces Tier 2
    const override = this.dataset.tier;
    if (override === 'platforms' || override === 'native') {
      if (override === 'native' && !navigator.share) {
        this.#tier = 'hidden';
      } else {
        this.#tier = override;
      }
      return;
    }

    const platforms = this.dataset.platforms || DEFAULT_PLATFORMS;

    if (platforms === 'native-only') {
      this.#tier = navigator.share ? 'native' : 'hidden';
      return;
    }

    this.#tier = navigator.share ? 'native' : 'platforms';
  }

  #renderNative() {
    const label = this.dataset.label || 'Share';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'share-trigger';
    btn.setAttribute('aria-label', `Share this page`);
    btn.innerHTML = `<icon-wc name="share-2" size="sm" aria-hidden="true"></icon-wc><span class="share-label">${label}</span>`;
    btn.addEventListener('click', this.#handleNativeShare);
    this.appendChild(btn);
  }

  #renderPlatforms() {
    const platformList = (this.dataset.platforms || DEFAULT_PLATFORMS)
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    this.#nav = document.createElement('nav');
    this.#nav.setAttribute('aria-label', 'Share this page');

    for (const id of platformList) {
      const platform = PLATFORMS.get(id);
      if (!platform) continue;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.platform = id;
      btn.setAttribute('aria-label', id === 'copy' ? 'Copy link' : `Share on ${platform.label}`);

      const iconSet = platform.iconSet ? ` set="${platform.iconSet}"` : '';
      btn.innerHTML =
        `<icon-wc name="${platform.iconName}" size="sm"${iconSet} aria-hidden="true"></icon-wc>` +
        `<span class="share-label">${platform.label}</span>`;

      this.#nav.appendChild(btn);
    }

    this.#nav.addEventListener('click', this.#handlePlatformClick);
    this.appendChild(this.#nav);
  }

  #enhanceSlotted() {
    // Wrap in nav if not already wrapped
    if (!this.querySelector('nav')) {
      const nav = document.createElement('nav');
      nav.setAttribute('aria-label', 'Share this page');
      while (this.firstChild) {
        nav.appendChild(this.firstChild);
      }
      this.appendChild(nav);
      this.#nav = nav;
    } else {
      this.#nav = this.querySelector('nav');
    }

    // Substitute URL tokens in href attributes
    const links = this.querySelectorAll('a[data-platform]');
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      link.setAttribute('href',
        href
          .replace(/\{url\}/g, encodeURIComponent(this.#url))
          .replace(/\{title\}/g, encodeURIComponent(this.#title))
          .replace(/\{text\}/g, encodeURIComponent(this.#text))
      );
    }

    // Add click handlers for copy buttons
    const copyBtns = this.querySelectorAll('[data-platform="copy"]');
    for (const btn of copyBtns) {
      btn.addEventListener('click', this.#handleCopy);
    }

    this.#nav.addEventListener('click', this.#handlePlatformClick);
  }

  #handleNativeShare = async () => {
    await this.#doNativeShare();
  };

  async #doNativeShare() {
    const payload = { url: this.#url, title: this.#title, text: this.#text };

    this.dispatchEvent(new CustomEvent('share-wc:open', {
      detail: { platform: 'native' },
      bubbles: true,
    }));

    try {
      if (navigator.canShare && !navigator.canShare(payload)) {
        throw new Error('Payload not shareable');
      }
      await navigator.share(payload);
      this.dispatchEvent(new CustomEvent('share-wc:success', {
        detail: { platform: 'native' },
        bubbles: true,
      }));
    } catch (err) {
      if (err.name !== 'AbortError') {
        this.dispatchEvent(new CustomEvent('share-wc:error', {
          detail: { platform: 'native', error: err },
          bubbles: true,
        }));
      }
    }
  }

  #handlePlatformClick = (e) => {
    const btn = /** @type {HTMLElement} */ (e.target).closest('[data-platform]');
    if (!btn) return;

    const id = btn.dataset.platform;

    if (id === 'copy') {
      this.#handleCopy(e, btn);
      return;
    }

    // For slotted <a> elements, let the default action happen
    if (btn.tagName === 'A') return;

    const platform = PLATFORMS.get(id);
    if (!platform) return;

    this.dispatchEvent(new CustomEvent('share-wc:open', {
      detail: { platform: id },
      bubbles: true,
    }));

    const opts = { url: this.#url, title: this.#title, text: this.#text };

    if (id === 'email') {
      location.href = platform.buildUrl(opts);
    } else if (id === 'mastodon') {
      const instance = this.dataset.mastodonInstance || 'mastodon.social';
      const url = platform.buildUrl(opts, instance);
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.open(platform.buildUrl(opts), '_blank', 'noopener,noreferrer');
    }

    this.dispatchEvent(new CustomEvent('share-wc:success', {
      detail: { platform: id },
      bubbles: true,
    }));
  };

  /** @param {Event} _e @param {HTMLElement} [target] */
  #handleCopy = async (_e, target) => {
    const btn = target || /** @type {HTMLElement} */ (_e?.target)?.closest('[data-platform="copy"]');
    if (!btn) return;

    try {
      await navigator.clipboard.writeText(this.#url);
      btn.dataset.state = 'copied';

      // Update label text
      const label = btn.querySelector('.share-label');
      const originalText = label?.textContent;
      if (label) label.textContent = 'Copied!';

      // Announce for screen readers
      const live = btn.querySelector('[aria-live]') || btn;
      if (!btn.querySelector('[aria-live]')) {
        btn.setAttribute('aria-live', 'polite');
      }

      this.dispatchEvent(new CustomEvent('share-wc:success', {
        detail: { platform: 'copy' },
        bubbles: true,
      }));

      if (this.#copyTimer) clearTimeout(this.#copyTimer);
      this.#copyTimer = setTimeout(() => {
        delete btn.dataset.state;
        if (label && originalText) label.textContent = originalText;
        btn.removeAttribute('aria-live');
        this.#copyTimer = null;
      }, 2000);
    } catch (err) {
      this.dispatchEvent(new CustomEvent('share-wc:error', {
        detail: { platform: 'copy', error: err },
        bubbles: true,
      }));
    }
  };
}

customElements.define('share-wc', ShareWc);

export { ShareWc };
