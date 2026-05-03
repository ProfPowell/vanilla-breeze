/**
 * <social-embed> — Privacy-first social content embed with click-to-activate
 *
 * Embeds social posts from Bluesky, Mastodon, X, Instagram, and YouTube
 * using a provider registry pattern. Click-to-activate by default — no
 * network requests until the user interacts.
 *
 * @attr {string}  url       - URL of content to embed (required)
 * @attr {string}  provider  - Explicit provider key (auto-detected if omitted)
 * @attr {string}  theme     - Theme hint: light | dark | auto (default: auto)
 * @attr {string}  activate  - Activation trigger: click | visible | eager (default: click)
 * @attr {string}  state     - Lifecycle state (read-only, set by component)
 *
 * @example
 * <social-embed url="https://bsky.app/profile/user/post/3abc">
 *   <a href="https://bsky.app/profile/user/post/3abc">View post on Bluesky</a>
 * </social-embed>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

// ─── Provider registry ──────────────────────────────────────────────────────

/** @type {Map<string, EmbedProvider>} */
const PROVIDERS = new Map();

/**
 * @typedef {{
 *   canHandle?: (url: string) => boolean,
 *   render: (host: HTMLElement, url: string, options: { theme: 'light' | 'dark' }) => Promise<void>,
 *   delegatesActivation?: boolean
 * }} EmbedProvider
 */

// ─── Shared utilities ────────────────────────────────────────────────────────

/** @type {Map<string, Promise<void>>} */
const scriptCache = new Map();

/**
 * Load a third-party script idempotently. Safe to call multiple times —
 * returns the same cached promise for a given URL.
 * @param {string} src
 * @returns {Promise<void>}
 */
export function loadScript(src) {
  if (scriptCache.has(src)) return /** @type {Promise<void>} */ (scriptCache.get(src));
  const p = new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(el);
  });
  scriptCache.set(src, p);
  return p;
}

/**
 * Fetch oEmbed JSON from an endpoint.
 * @param {string} endpoint - oEmbed API base URL
 * @param {string} url - Content URL to embed
 * @param {Record<string, string>} [params] - Additional query params
 * @returns {Promise<{ html: string, [key: string]: unknown }>}
 */
export async function fetchOEmbed(endpoint, url, params = {}) {
  const query = new URLSearchParams({ url, format: 'json', ...params });
  const res = await fetch(`${endpoint}?${query}`);
  if (!res.ok) throw new Error(`oEmbed error ${res.status}`);
  return res.json();
}

/**
 * Resolve theme hint to 'light' or 'dark', preferring VB's active theme over
 * the OS preference. Order of precedence:
 *   1. Explicit "light" / "dark" hint passed by the author
 *   2. The host element's resolved CSS color-scheme
 *      (driven by VB tokens via the active data-theme / data-mode)
 *   3. The document's data-mode attribute (set by VB's theme-manager)
 *   4. window.matchMedia('(prefers-color-scheme: dark)') as a last resort
 *
 * Without this priority, embeds got the OS preference even when the page
 * was on a light VB theme like swiss/default — producing a dark Twitter
 * inside a light page.
 *
 * @param {string} hint
 * @param {Element} [host] - the social-embed element, used to resolve the
 *   color-scheme in its computed style scope. Falls back to documentElement.
 * @returns {'light' | 'dark'}
 */
function resolveTheme(hint, host) {
  if (hint === 'light') return 'light';
  if (hint === 'dark') return 'dark';

  // 2. CSS color-scheme on the host. Modern themes set color-scheme: dark
  // (or "light dark") so getComputedStyle returns the resolved scheme.
  const el = host || document.documentElement;
  const cs = getComputedStyle(el).colorScheme || '';
  if (/\bdark\b/.test(cs) && !/\blight\b/.test(cs)) return 'dark';
  if (/\blight\b/.test(cs) && !/\bdark\b/.test(cs)) return 'light';

  // 3. VB's theme-manager attribute. light/dark take priority; "auto"
  // falls through.
  const mode = document.documentElement.dataset.mode;
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';

  // 4. OS preference fallback.
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// SR-only inline styles for live region
const SR_ONLY_STYLE = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';

// ─── Component ───────────────────────────────────────────────────────────────

class SocialEmbed extends VBElement {
  /**
   * Register a provider by key.
   * @param {string} name
   * @param {EmbedProvider} provider
   */
  static register(name, provider) {
    PROVIDERS.set(name, provider);
  }

  /** @type {IntersectionObserver | null} */
  #observer = null;
  /** @type {string} */
  #fallback = '';
  /** @type {((e: MouseEvent) => void) | null} */
  #clickHandler = null;

  /** @type {object|null} Provider resolved during setup, kept for theme re-render */
  #provider = null;
  /** @type {number|null} */
  #themeRerenderTimer = null;

  setup() {
    // Capture fallback once, before any live region or other DOM is prepended.
    // On reconnect #fallback is already set — don't recapture.
    if (!this.#fallback) {
      this.#fallback = this.innerHTML;
    }

    // Re-render the embed with a fresh theme when VB's theme changes.
    // Debounced because rapid switches would re-initialize the third-party
    // iframe excessively. Only fires when an embed is actually loaded —
    // idle / unsupported / error states are unaffected.
    this.listen(window, 'vb:theme-change', () => {
      if (this.#themeRerenderTimer) clearTimeout(this.#themeRerenderTimer);
      this.#themeRerenderTimer = setTimeout(() => {
        if (this.#provider && this.getAttribute('state') === 'loaded') {
          this.#init(this.#provider);
        }
      }, 100);
    });

    const url = this.getAttribute('url');
    if (!url) {
      console.warn('social-embed: missing required url attribute');
      return false;
    }

    // Resolve provider
    const name = this.getAttribute('provider');
    const provider = name
      ? PROVIDERS.get(name)
      : [...PROVIDERS.values()].find(p => p.canHandle?.(url));

    if (!provider) {
      this.setAttribute('state', 'unsupported');
      return;
    }

    // Providers with delegatesActivation skip the click gate
    if (provider.delegatesActivation) {
      this.#init(provider);
      return;
    }

    // Set idle state
    this.setAttribute('state', 'idle');

    const activate = this.getAttribute('activate') ?? 'click';

    if (activate === 'eager') {
      this.#init(provider);
    } else if (activate === 'visible') {
      this.#observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          this.#observer?.disconnect();
          this.#init(provider);
        }
      }, { rootMargin: '200px' });
      this.#observer.observe(this);
    } else {
      // click (default) — preventDefault stops the fallback <a> from navigating
      this.#clickHandler = (e) => {
        e.preventDefault();
        this.#init(provider);
      };
      this.addEventListener('click', this.#clickHandler, { once: true });
      this.addEventListener('keydown', this.#handleKey);
      this.setAttribute('tabindex', '0');
      this.setAttribute('role', 'button');
      this.setAttribute('aria-label', 'Load embed');
    }
  }

  teardown() {
    this.#observer?.disconnect();
    if (this.#themeRerenderTimer) { clearTimeout(this.#themeRerenderTimer); this.#themeRerenderTimer = null; }
    this.#provider = null;
    if (this.#clickHandler) {
      this.removeEventListener('click', this.#clickHandler);
      this.#clickHandler = null;
    }
    this.removeEventListener('keydown', this.#handleKey);
  }

  /** @param {KeyboardEvent} e */
  #handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.click();
    }
  };

  /**
   * @param {EmbedProvider} provider
   */
  async #init(provider) {
    // Remember the provider so the vb:theme-change listener can re-init.
    this.#provider = provider;

    // Clean up click-gate a11y attrs and listener
    this.removeAttribute('tabindex');
    this.removeAttribute('role');
    this.removeAttribute('aria-label');
    if (this.#clickHandler) {
      this.removeEventListener('click', this.#clickHandler);
      this.#clickHandler = null;
    }
    this.removeEventListener('keydown', this.#handleKey);

    const url = /** @type {string} */ (this.getAttribute('url'));
    this.setAttribute('state', 'loading');
    this.#announce('Loading embed\u2026');

    try {
      const theme = resolveTheme(this.getAttribute('theme') ?? 'auto', this);
      await provider.render(this, url, { theme });
      this.setAttribute('state', 'loaded');
    } catch (err) {
      console.warn('[social-embed] render failed:', err);
      this.innerHTML = this.#fallback;
      this.setAttribute('state', 'error');
      this.#announce('Embed failed to load.');
    }
  }

  /**
   * Announce a message to screen readers via a live region.
   * @param {string} message
   */
  #announce(message) {
    let live = this.querySelector('[data-embed-live]');
    if (!live) {
      live = document.createElement('span');
      live.setAttribute('data-embed-live', '');
      live.setAttribute('role', 'status');
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('style', SR_ONLY_STYLE);
      this.prepend(live);
    }
    live.textContent = message;
  }
}

registerComponent('social-embed', SocialEmbed);
export { SocialEmbed, PROVIDERS };
