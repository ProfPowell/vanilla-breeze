/**
 * <social-embed> — Privacy-first social post embed with click-to-load
 *
 * Embeds posts from Bluesky, Mastodon, X and Instagram as sandboxed iframes
 * built from the validated post URL, and YouTube videos through
 * <youtube-player>. Nothing is requested from the platform until the reader
 * presses the "Load … post" button (activate="click", the default), except
 * YouTube, whose player facade fetches its thumbnail up front.
 *
 * The provider registry is filled BEFORE the element is defined (this module
 * imports the built-in providers), so parsed markup never upgrades against an
 * empty registry. SocialEmbed.register() also re-initialises any instance that
 * was left `unsupported` before a late custom provider arrived.
 *
 * @attr {string}  url       - URL of the post / video (required)
 * @attr {string}  provider  - Explicit provider key (auto-detected if omitted)
 * @attr {string}  theme     - light | dark | auto (default: auto)
 * @attr {string}  activate  - click | visible | eager (default: click)
 * @attr {string}  data-title - Accessible name of the embedded frame
 * @attr {string}  data-label-load|loading|error|note - UI string overrides
 * @attr {string}  state     - idle | loading | loaded | error | unsupported (read-only)
 *
 * @example
 * <social-embed url="https://bsky.app/profile/bsky.app/post/3l6oveex3ii2l">
 *   <a href="https://bsky.app/profile/bsky.app/post/3l6oveex3ii2l">View post on Bluesky</a>
 * </social-embed>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { loadScript, fetchOEmbed, createEmbedFrame, frameMeta, applyFrameHeight } from './shared.js';
import { XProvider } from './providers/x.js';
import { InstagramProvider } from './providers/instagram.js';
import { BlueskyProvider } from './providers/bluesky.js';
import { YouTubeProvider } from './providers/youtube.js';
import { MastodonProvider } from './providers/mastodon.js';

/**
 * @typedef {{
 *   canHandle?: (url: string) => boolean,
 *   render: (host: HTMLElement, url: string, options: { theme: 'light' | 'dark', title: string }) => Promise<Node | void>,
 *   label?: string,
 *   noun?: string,
 *   themeable?: boolean,
 *   delegatesActivation?: boolean,
 *   frameHost?: (url: string) => string
 * }} EmbedProvider
 */

/** @type {Map<string, EmbedProvider>} */
const PROVIDERS = new Map();
// Mastodon accepts any host, so it is matched last.
PROVIDERS.set('x', XProvider);
PROVIDERS.set('instagram', InstagramProvider);
PROVIDERS.set('bluesky', BlueskyProvider);
PROVIDERS.set('youtube', YouTubeProvider);
PROVIDERS.set('mastodon', MastodonProvider);

/** Default UI strings; each is overridable with data-label-<key>. */
const LABELS = {
  load: 'Load {provider} {noun}',
  loading: 'Loading {provider} {noun}…',
  error: '{provider} {noun} failed to load.',
  note: 'Loads content from {host}',
};

/**
 * Resolve theme hint to 'light' or 'dark', preferring VB's active theme over
 * the OS preference:
 *   1. Explicit "light" / "dark"
 *   2. The host's computed CSS color-scheme (set by the active VB theme/mode)
 *   3. The document's data-mode attribute
 *   4. prefers-color-scheme
 * @param {string} hint
 * @param {Element} host
 * @returns {'light' | 'dark'}
 */
function resolveTheme(hint, host) {
  if (hint === 'light' || hint === 'dark') return hint;
  const cs = getComputedStyle(host).colorScheme || '';
  if (/\bdark\b/.test(cs) && !/\blight\b/.test(cs)) return 'dark';
  if (/\blight\b/.test(cs) && !/\bdark\b/.test(cs)) return 'light';
  const mode = document.documentElement.dataset.mode;
  if (mode === 'dark' || mode === 'light') return mode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

class SocialEmbed extends VBElement {
  /**
   * Register a provider by key. Instances already marked `unsupported`
   * re-initialise, so a provider registered after upgrade still applies.
   * @param {string} name
   * @param {EmbedProvider} provider
   */
  static register(name, provider) {
    PROVIDERS.set(name, provider);
    for (const el of document.querySelectorAll('social-embed[state="unsupported"]')) {
      if (el instanceof SocialEmbed) el._reinit();
    }
  }

  /** @type {IntersectionObserver | null} */
  #observer = null;
  /** @type {Node[] | null} Author fallback content, cloned at first setup */
  #fallback = null;
  /** @type {EmbedProvider | null} */
  #provider = null;
  /** @type {string} */
  #providerName = '';
  /** @type {ReturnType<typeof setTimeout> | null} */
  #themeTimer = null;
  /** @type {HTMLButtonElement | null} */
  #button = null;
  #wired = false;

  setup() {
    if (!this.#fallback) {
      this.#fallback = [...this.childNodes]
        .filter((n) => !(n instanceof Element && n.matches('[data-embed-live], [data-embed-facade]')))
        .map((n) => n.cloneNode(true));
    }

    const url = this.getAttribute('url');
    if (!url) {
      console.warn('social-embed: missing required url attribute');
      return false;
    }

    // Already activated (reconnect / move): keep the rendered embed, re-wire
    // listeners only. Re-running activation would rebuild the facade around it.
    const state = this.getAttribute('state');
    if (this.#provider && (state === 'loaded' || state === 'loading')) {
      this.#wire();
      return true;
    }

    const name = this.getAttribute('provider');
    let provider = name
      ? PROVIDERS.get(name)
      : [...PROVIDERS.values()].find((p) => p.canHandle?.(url));
    if (provider && name && provider.canHandle && !provider.canHandle(url)) provider = undefined;

    this.#removeFacade();
    if (!provider) {
      this.setAttribute('state', 'unsupported');
      return true;
    }
    this.#providerName = name || [...PROVIDERS].find(([, p]) => p === provider)?.[0] || '';

    if (provider.delegatesActivation) {
      this.#activate(provider, false);
      return true;
    }

    this.setAttribute('state', 'idle');
    this.#renderFacade(provider, url);

    const activate = this.getAttribute('activate') ?? 'click';
    if (activate === 'eager') {
      this.#activate(provider, false);
    } else if (activate === 'visible') {
      this.#observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.#observer?.disconnect();
          this.#observer = null;
          this.#activate(provider, false);
        }
      }, { rootMargin: '200px' });
      this.#observer.observe(this);
    }
    return true;
  }

  teardown() {
    this.#observer?.disconnect();
    this.#observer = null;
    if (this.#themeTimer) { clearTimeout(this.#themeTimer); this.#themeTimer = null; }
    // listen() handlers were released by the base class; allow re-wiring.
    this.#wired = false;
  }

  /** Window listeners for an activated embed: frame resize + theme follow. */
  #wire() {
    if (this.#wired) return;
    this.#wired = true;
    this.listen(window, 'message', (/** @type {MessageEvent} */ e) => {
      for (const frame of this.querySelectorAll('iframe[data-embed-frame]')) {
        const f = /** @type {HTMLIFrameElement} */ (frame);
        const meta = frameMeta(f);
        if (!meta?.measure || e.source !== f.contentWindow || e.origin !== meta.origin) continue;
        applyFrameHeight(f, meta.measure(e.data));
      }
    });
    this.listen(window, 'vb:theme-change', () => {
      if (!this.#provider?.themeable) return;
      if (this.#themeTimer) clearTimeout(this.#themeTimer);
      this.#themeTimer = setTimeout(() => {
        this.#themeTimer = null;
        if (this.#provider?.themeable && this.getAttribute('state') === 'loaded') {
          this.#activate(this.#provider, false);
        }
      }, 100);
    });
  }

  /**
   * @param {string} key
   * @param {EmbedProvider} provider
   * @param {Record<string, string>} [vars]
   */
  #label(key, provider, vars = {}) {
    const all = {
      provider: provider.label ?? this.#providerName,
      noun: provider.noun ?? 'post',
      ...vars,
    };
    const raw = this.getAttribute(`data-label-${key}`) ?? LABELS[/** @type {keyof typeof LABELS} */ (key)];
    return raw.replace(/\{(\w+)\}/g, (m, k) => (k in all ? all[/** @type {keyof typeof all} */ (k)] : m));
  }

  /**
   * Idle / error facade: a real button next to the author's fallback link,
   * and a note naming the host content will load from.
   * @param {EmbedProvider} provider
   * @param {string} url
   * @param {boolean} [failed]
   */
  #renderFacade(provider, url, failed = false) {
    this.#removeFacade();
    const facade = document.createElement('p');
    facade.setAttribute('data-embed-facade', '');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-embed-load', '');
    button.textContent = this.#label('load', provider);
    button.addEventListener('click', () => this.#activate(provider, true));
    const note = document.createElement('small');
    note.setAttribute('data-embed-note', '');
    let host = '';
    try { host = provider.frameHost?.(url) ?? ''; } catch { /* custom provider */ }
    note.textContent = failed
      ? this.#label('error', provider)
      : host ? this.#label('note', provider, { host }) : '';
    facade.append(button, ' ', note);
    this.append(facade);
    this.#button = button;
  }

  #removeFacade() {
    for (const el of this.querySelectorAll(':scope > [data-embed-facade]')) el.remove();
    this.#button = null;
  }

  /**
   * @param {EmbedProvider} provider
   * @param {boolean} fromUser - activation came from the button
   */
  async #activate(provider, fromUser) {
    if (this.getAttribute('state') === 'loading') return;
    const firstLoad = this.getAttribute('state') !== 'loaded';
    this.#provider = provider;
    this.#wire();
    this.#observer?.disconnect();
    this.#observer = null;

    const url = /** @type {string} */ (this.getAttribute('url'));
    const hadFocus = fromUser || this.contains(document.activeElement);
    this.setAttribute('state', 'loading');
    if (this.#button) {
      this.#button.setAttribute('aria-disabled', 'true');
      this.#button.textContent = this.#label('loading', provider);
    }
    if (firstLoad && !provider.delegatesActivation) this.#announce(this.#label('loading', provider));

    try {
      const title = this.dataset.title || `${provider.label ?? this.#providerName} ${provider.noun ?? 'post'}`;
      const theme = resolveTheme(this.getAttribute('theme') ?? 'auto', this);
      const node = await provider.render(this, url, { theme, title });
      if (node instanceof Node) {
        this.replaceChildren(...[this.querySelector(':scope > [data-embed-live]')].filter((n) => !!n), node);
      }
      this.#button = null;
      this.setAttribute('state', 'loaded');
      if (firstLoad && !provider.delegatesActivation) this.#announce('');
      if (hadFocus) {
        const target = /** @type {HTMLElement | null} */ (this.querySelector('iframe, youtube-player button'));
        if (target) target.focus();
        else { this.setAttribute('tabindex', '-1'); this.focus(); }
      }
    } catch (err) {
      console.warn('[social-embed] render failed:', err);
      this.replaceChildren(...(this.#fallback ?? []).map((n) => n.cloneNode(true)));
      this.setAttribute('state', 'error');
      this.#renderFacade(provider, url, true);
      this.#announce(this.#label('error', provider));
      if (hadFocus) this.#button?.focus();
    }
  }

  /**
   * Announce a message through a polite live region (created once).
   * @param {string} message
   */
  #announce(message) {
    let live = this.querySelector(':scope > [data-embed-live]');
    if (!live) {
      live = document.createElement('span');
      live.setAttribute('data-embed-live', '');
      live.setAttribute('role', 'status');
      this.prepend(live);
    }
    live.textContent = message;
  }
}

registerComponent('social-embed', SocialEmbed);
export { SocialEmbed, PROVIDERS, loadScript, fetchOEmbed, createEmbedFrame };
