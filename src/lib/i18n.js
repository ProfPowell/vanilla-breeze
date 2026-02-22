/**
 * i18n.js — Locale utilities and string swap class
 *
 * Provides centralized locale resolution used by VB format utilities,
 * RTL detection, and an optional VbI18n class for application-level
 * string swapping via data-i18n attributes.
 *
 * The VbI18n class is exported but NOT auto-initialized — it is the
 * application developer's responsibility to instantiate and configure it.
 *
 * @example
 * import { getLocale, isRTL } from './lib/i18n.js';
 * console.log(getLocale());  // 'en-US'
 * console.log(isRTL('ar'));  // true
 *
 * @example
 * import { VbI18n } from './lib/i18n.js';
 * const i18n = new VbI18n({
 *   messages: {
 *     fr: { 'actions.close': 'Fermer' },
 *     en: { 'actions.close': 'Close' },
 *   }
 * });
 * i18n.apply();
 */

// BCP 47 primary subtags written right-to-left
export const RTL_LANGUAGES = new Set([
  'ar',   // Arabic
  'arc',  // Aramaic
  'dv',   // Dhivehi
  'fa',   // Persian
  'ha',   // Hausa (Arabic script)
  'he',   // Hebrew
  'khw',  // Khowar
  'ks',   // Kashmiri
  'ku',   // Kurdish (Sorani)
  'ps',   // Pashto
  'sd',   // Sindhi
  'ug',   // Uyghur
  'ur',   // Urdu
  'uz',   // Uzbek (Arabic script)
  'yi',   // Yiddish
]);

// Languages where ruby annotation is conventional
export const RUBY_LANGUAGES = new Set(['ja', 'zh', 'ko', 'yue', 'wuu']);

/**
 * Return the primary language subtag from a BCP 47 locale string.
 * @param {string} locale  e.g. 'zh-TW' → 'zh', 'en-US' → 'en'
 * @returns {string}
 */
export function primarySubtag(locale) {
  return locale.split('-')[0].toLowerCase();
}

/**
 * Determine if a locale is RTL.
 * @param {string} [locale] - defaults to getLocale()
 * @returns {boolean}
 */
export function isRTL(locale) {
  return RTL_LANGUAGES.has(primarySubtag(locale ?? getLocale()));
}

/**
 * Determine if ruby annotations should be shown for a locale.
 * @param {string} [locale] - defaults to getLocale()
 * @returns {boolean}
 */
export function usesRuby(locale) {
  return RUBY_LANGUAGES.has(primarySubtag(locale ?? getLocale()));
}

/**
 * Get the active locale, in priority order:
 *   1. <html lang> attribute
 *   2. navigator.language
 *   3. 'en' fallback
 * @returns {string}
 */
export function getLocale() {
  return (
    document.documentElement.lang ||
    navigator.language ||
    'en'
  );
}

// ============================================================
// VbI18n — String Swap Manager
// Exported for application use, not auto-initialized.
// ============================================================

export class VbI18n {
  /**
   * @param {object} config
   * @param {string} [config.locale]              Active locale (default: getLocale())
   * @param {object} [config.messages]            Map of locale → key → string
   * @param {string} [config.fallbackLocale]      Locale to use if key missing (default: 'en')
   * @param {HTMLElement|Document} [config.root]  Root element to search for data-i18n (default: document)
   */
  constructor({ locale, messages = {}, fallbackLocale = 'en', root = document } = {}) {
    this.locale = locale ?? getLocale();
    this.messages = messages;
    this.fallbackLocale = fallbackLocale;
    this.root = root;
  }

  /**
   * Look up a translation key.
   * @param {string} key
   * @param {Record<string, string>} [vars]  Variable substitution: { name: 'World' }
   * @returns {string}
   */
  t(key, vars = {}) {
    const locale = primarySubtag(this.locale);
    const map = this.messages[locale]
      ?? this.messages[this.locale]
      ?? this.messages[this.fallbackLocale]
      ?? {};

    let str = map[key] ?? this.messages[this.fallbackLocale]?.[key] ?? key;

    for (const [varKey, varVal] of Object.entries(vars)) {
      str = str.replaceAll(`{{${varKey}}}`, varVal);
    }
    return str;
  }

  /**
   * Apply translations to all [data-i18n] elements under root.
   *
   * data-i18n="key"           → sets textContent
   * data-i18n-attr="attr"     → sets the named attribute instead
   * data-i18n-vars='{"n":3}'  → JSON variable map for interpolation
   */
  apply(root = this.root) {
    const elements = root.querySelectorAll('[data-i18n]');

    for (const el of elements) {
      const key = el.dataset.i18n;
      const attr = el.dataset.i18nAttr;
      const vars = el.dataset.i18nVars ? JSON.parse(el.dataset.i18nVars) : {};
      const translated = this.t(key, vars);

      if (attr) {
        el.setAttribute(attr, translated);
      } else if (el.children.length === 0) {
        el.textContent = translated;
      } else {
        const textNode = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE);
        if (textNode) {
          textNode.textContent = translated;
        } else {
          el.prepend(document.createTextNode(translated));
        }
      }
    }
  }

  /**
   * Load messages for a locale from a URL.
   * @param {string} locale
   * @param {string} url
   * @returns {Promise<void>}
   */
  async load(locale, url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`VbI18n: failed to load messages from ${url}`);
    const data = await res.json();
    this.messages[locale] = { ...(this.messages[locale] ?? {}), ...data };
  }

  /**
   * Set the active locale, apply translations, and emit vb:locale-change.
   * @param {string} locale  BCP 47 locale string
   */
  setLocale(locale) {
    this.locale = locale;
    this.apply();
    document.dispatchEvent(new CustomEvent('vb:locale-change', {
      bubbles: true,
      detail: { locale },
    }));
  }

  /**
   * Listen for vb:locale-change events and auto-apply translations.
   * @returns {() => void} cleanup function
   */
  watch() {
    const handler = (e) => {
      this.locale = e.detail.locale;
      this.apply();
    };
    document.addEventListener('vb:locale-change', handler);
    return () => document.removeEventListener('vb:locale-change', handler);
  }
}
