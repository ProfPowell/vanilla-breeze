/**
 * vb-i18n.js
 * Vanilla Breeze — i18n Runtime Module
 *
 * Provides:
 *   - data-i18n string swap system
 *   - Locale utilities used by VB components
 *   - RTL language detection
 *   - VbI18n class for message map management
 *
 * No dependencies. Works with <vb-settings> but does not require it.
 *
 * Usage:
 *   import { VbI18n } from './vb-i18n.js';
 *
 *   const i18n = new VbI18n({
 *     locale: 'fr',
 *     messages: {
 *       fr: { 'actions.close': 'Fermer', 'nav.home': 'Accueil' },
 *       en: { 'actions.close': 'Close',  'nav.home': 'Home' },
 *     }
 *   });
 *
 *   i18n.apply();   // swap all [data-i18n] in document
 *   i18n.watch();   // listen for vb:locale-change events
 */

// ============================================================
// RTL Language Registry
// BCP 47 primary subtags that are written right-to-left.
// ============================================================

export const RTL_LANGUAGES = new Set([
	'ar',   // Arabic
	'arc',  // Aramaic
	'dv',   // Dhivehi / Maldivian
	'fa',   // Persian / Farsi
	'ha',   // Hausa (when in Arabic script)
	'he',   // Hebrew
	'khw',  // Khowar
	'ks',   // Kashmiri (Arabic script)
	'ku',   // Kurdish (Sorani)
	'ps',   // Pashto
	'sd',   // Sindhi
	'ug',   // Uyghur
	'ur',   // Urdu
	'uz',   // Uzbek (Arabic script variant)
	'yi',   // Yiddish
]);

// Languages where ruby annotation is conventional
export const RUBY_LANGUAGES = new Set(['ja', 'zh', 'ko', 'yue', 'wuu']);

/**
 * Return the primary language subtag from a BCP 47 locale string.
 * 'zh-TW' → 'zh', 'en-US' → 'en'
 * @param {string} locale
 * @returns {string}
 */
export function primarySubtag(locale) {
	return locale.split('-')[0].toLowerCase();
}

/**
 * Determine if a locale is RTL.
 * @param {string} locale
 * @returns {boolean}
 */
export function isRTL(locale) {
	return RTL_LANGUAGES.has(primarySubtag(locale));
}

/**
 * Determine if ruby annotations should be shown for a locale.
 * @param {string} locale
 * @returns {boolean}
 */
export function usesRuby(locale) {
	return RUBY_LANGUAGES.has(primarySubtag(locale));
}

/**
 * Get the closest <vb-settings> element in the document.
 * @returns {HTMLElement|null}
 */
export function getSettings() {
	return document.querySelector('vb-settings');
}

/**
 * Get the active locale, in priority order:
 *   1. <vb-settings> locale attribute
 *   2. <html lang> attribute
 *   3. navigator.language
 *   4. 'en' fallback
 * @returns {string}
 */
export function getLocale() {
	return (
		getSettings()?.getAttribute('locale') ||
		document.documentElement.lang ||
		navigator.language ||
		'en'
	);
}

// ============================================================
// Intl Utilities
// Thin wrappers that always resolve a locale and use Intl APIs.
// ============================================================

/**
 * Format a number according to locale conventions.
 * @param {number} value
 * @param {Intl.NumberFormatOptions} [options]
 * @param {string} [locale]
 * @returns {string}
 */
export function formatNumber(value, options = {}, locale = getLocale()) {
	return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format a date according to locale conventions.
 * @param {Date|number|string} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @param {string} [locale]
 * @returns {string}
 */
export function formatDate(value, options = {}, locale = getLocale()) {
	return new Intl.DateTimeFormat(locale, options).format(new Date(value));
}

/**
 * Format a currency amount.
 * @param {number} value
 * @param {string} currency  ISO 4217 code, e.g. 'USD', 'JPY', 'EUR'
 * @param {string} [locale]
 * @returns {string}
 */
export function formatCurrency(value, currency, locale = getLocale()) {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
	}).format(value);
}

/**
 * Format a relative time string ('3 days ago', 'in 2 hours').
 * @param {number} value    Signed number (negative = past)
 * @param {Intl.RelativeTimeFormatUnit} unit
 * @param {string} [locale]
 * @returns {string}
 */
export function formatRelativeTime(value, unit, locale = getLocale()) {
	return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
}

// ============================================================
// VbI18n — String Swap Manager
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
		this._abortController = null;
	}

	/**
	 * Look up a translation key.
	 * @param {string} key
	 * @param {Record<string, string>} [vars]  Variable substitution map: { name: 'World' }
	 * @returns {string}
	 */
	t(key, vars = {}) {
		const locale = primarySubtag(this.locale);
		const map = this.messages[locale]
			?? this.messages[this.locale]
			?? this.messages[this.fallbackLocale]
			?? {};

		let str = map[key] ?? this.messages[this.fallbackLocale]?.[key] ?? key;

		// Simple {{var}} substitution
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
			} else {
				// Preserve child elements — only update text nodes
				// If element has no children, safe to set textContent directly
				if (el.children.length === 0) {
					el.textContent = translated;
				} else {
					// Find or create a leading text node
					const textNode = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE);
					if (textNode) {
						textNode.textContent = translated;
					} else {
						el.prepend(document.createTextNode(translated));
					}
				}
			}
		}
	}

	/**
	 * Load messages for a locale from a URL.
	 * Expected format: { "key": "value", ... }
	 * @param {string} locale
	 * @param {string} url
	 * @returns {Promise<void>}
	 */
	async load(locale, url) {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`vb-i18n: failed to load messages from ${url}`);
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
	 * Returns a cleanup function.
	 * @returns {() => void}
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

// ============================================================
// Locale Mixin for VB Web Components
// Mix into a component class to get locale resolution for free.
// ============================================================

/**
 * @mixin
 * Adds locale-aware behavior to a web component.
 *
 * Usage:
 *   class VbStat extends LocaleMixin(HTMLElement) { ... }
 */
export const LocaleMixin = (Base) => class extends Base {
	/**
	 * Resolved locale: own attribute > vb-settings > html[lang] > navigator
	 */
	get resolvedLocale() {
		return (
			this.getAttribute('locale') ||
			document.querySelector('vb-settings')?.getAttribute('locale') ||
			document.documentElement.lang ||
			navigator.language ||
			'en'
		);
	}

	connectedCallback() {
		super.connectedCallback?.();
		document.addEventListener('vb:locale-change', this._onLocaleChange);
	}

	disconnectedCallback() {
		super.disconnectedCallback?.();
		document.removeEventListener('vb:locale-change', this._onLocaleChange);
	}

	_onLocaleChange = () => {
		this.render?.();
	};
};