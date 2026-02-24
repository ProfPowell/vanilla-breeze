/**
 * vb-ruby.js
 * Vanilla Breeze — Ruby Annotation System
 *
 * Provides:
 *   <vb-ruby-annotate> — web component for programmatic ruby annotation
 *
 * The visibility system lives in vb-i18n.css (data-ruby on <html>).
 * This module handles *adding* ruby markup where none exists.
 *
 * Usage — declarative (markup already present):
 *   <!-- Just use HTML ruby elements; visibility is CSS-controlled -->
 *   <ruby>漢字<rt>かんじ</rt></ruby>
 *
 * Usage — programmatic annotation via component:
 *   <vb-ruby-annotate lang="ja" api="openai" target="#article">
 *   </vb-ruby-annotate>
 *
 *   Or via JS:
 *   const annotator = document.querySelector('vb-ruby-annotate');
 *   await annotator.annotate('#article');
 *
 * Usage — manual JS API:
 *   import { annotateElement } from './vb-ruby.js';
 *   await annotateElement(document.getElementById('article'), {
 *     lang: 'ja',
 *     provider: myFetchProvider,
 *   });
 */

// ============================================================
// Built-in API Providers
// Each provider is an async function:
//   (text: string, lang: string) => Promise<RubyToken[]>
//
// A RubyToken is: { base: string, reading: string | null }
// Tokens with null reading render as plain text.
// ============================================================

/**
 * Provider: Kuroshiro-compatible custom endpoint.
 * Expects POST { text, lang } → { tokens: [{base, reading}] }
 * @param {string} endpoint
 * @returns {Provider}
 */
export function customEndpointProvider(endpoint) {
	return async (text, lang) => {
		const res = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text, lang }),
		});
		if (!res.ok) throw new Error(`vb-ruby: endpoint ${endpoint} returned ${res.status}`);
		const data = await res.json();
		return data.tokens;
	};
}

/**
 * Provider: Jisho API (Japanese dictionary, free, no key required).
 * Simplified: tokenizes by word lookup. Good enough for known vocabulary.
 * Note: Jisho is for Japanese only.
 * @returns {Provider}
 */
export function jishoProvider() {
	return async (text) => {
		// Jisho does not have a tokenization endpoint — this uses their
		// search endpoint as a word-level lookup fallback.
		// For production use, pair with a proper tokenizer.
		const params = new URLSearchParams({ keyword: text });
		const res = await fetch(`https://jisho.org/api/v1/search/words?${params}`);
		if (!res.ok) return [{ base: text, reading: null }];
		const data = await res.json();
		const first = data.data?.[0];
		if (!first) return [{ base: text, reading: null }];
		const reading = first.japanese?.[0]?.reading ?? null;
		return [{ base: text, reading }];
	};
}

// ============================================================
// Core Annotation Engine
// ============================================================

/**
 * Convert a flat array of RubyTokens to an HTML string.
 * @param {Array<{base: string, reading: string|null}>} tokens
 * @returns {string}
 */
export function tokensToHTML(tokens) {
	return tokens.map(({ base, reading }) => {
		if (!reading || reading === base) return escapeHTML(base);
		return `<ruby>${escapeHTML(base)}<rp>(</rp><rt>${escapeHTML(reading)}</rt><rp>)</rp></ruby>`;
	}).join('');
}

/**
 * Minimal HTML escaper for text going into ruby elements.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Walk text nodes inside an element and annotate CJK runs.
 * Skips nodes already inside <ruby>, <code>, <pre>, <script>, <style>.
 * @param {HTMLElement} element
 * @param {object} options
 * @param {string} [options.lang]          Language code (default: element lang or html lang)
 * @param {Function} options.provider      Async (text, lang) → RubyToken[]
 * @param {string} [options.selector]      CSS selector to limit scope
 * @returns {Promise<number>}              Number of text nodes annotated
 */
export async function annotateElement(element, { lang, provider, selector } = {}) {
	if (!provider) throw new Error('vb-ruby: a provider function is required');

	const root = selector ? element.querySelector(selector) : element;
	if (!root) return 0;

	const activeLang = lang
		?? root.closest('[lang]')?.lang
		?? document.documentElement.lang
		?? 'ja';

	// Collect text nodes that contain CJK characters
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT,
		{
			acceptNode(node) {
				const parent = node.parentElement;
				// Skip inside elements where annotation is inappropriate
				if (parent.closest('ruby, code, pre, script, style, [translate="no"]')) {
					return NodeFilter.FILTER_REJECT;
				}
				// Only process nodes with CJK content
				return /[\u3000-\u9FFF\uF900-\uFAFF\u3400-\u4DBF]/.test(node.textContent)
					? NodeFilter.FILTER_ACCEPT
					: NodeFilter.FILTER_SKIP;
			}
		}
	);

	const textNodes = [];
	let node;
	while ((node = walker.nextNode())) textNodes.push(node);

	let count = 0;
	for (const textNode of textNodes) {
		try {
			const tokens = await provider(textNode.textContent.trim(), activeLang);
			const html = tokensToHTML(tokens);
			const span = document.createElement('span');
			span.innerHTML = html;
			// Mark as annotated so we don't process again
			span.dataset.vbRubyAnnotated = '';
			textNode.replaceWith(span);
			count++;
		} catch (err) {
			console.warn('vb-ruby: annotation failed for node', err);
		}
	}

	return count;
}

// ============================================================
// <vb-ruby-annotate> Web Component
// ============================================================

/**
 * Headless web component for programmatic ruby annotation.
 *
 * Attributes:
 *   target     CSS selector of element(s) to annotate (default: next sibling)
 *   lang       Language code override (default: inferred from DOM)
 *   api        Built-in provider name: 'jisho' | 'custom' (default: 'custom')
 *   endpoint   URL for custom API provider
 *   auto       If present, annotates on connection
 *   throttle   Debounce ms for MutationObserver (default: 500)
 *
 * Events emitted:
 *   vb:ruby-annotated   { target, count }  — after annotation completes
 *   vb:ruby-error       { error }          — if annotation fails
 *
 * Example:
 *   <vb-ruby-annotate target="#article" lang="ja" api="jisho" auto>
 *   </vb-ruby-annotate>
 */
class VbRubyAnnotate extends HTMLElement {

	static get observedAttributes() {
		return ['target', 'lang', 'api', 'endpoint', 'auto'];
	}

	connectedCallback() {
		if (this.hasAttribute('auto')) {
			// Wait one microtask to allow target to render
			Promise.resolve().then(() => this.annotate());
		}
	}

	disconnectedCallback() {
		this._observer?.disconnect();
	}

	attributeChangedCallback(name, oldVal, newVal) {
		if (oldVal === newVal) return;
		if (this.hasAttribute('auto') && name === 'target') {
			this.annotate();
		}
	}

	/**
	 * Perform annotation. Can be called manually.
	 * @param {string|HTMLElement} [targetOverride]
	 * @returns {Promise<void>}
	 */
	async annotate(targetOverride) {
		const targetSelector = targetOverride
			?? this.getAttribute('target');

		const targetEl = typeof targetSelector === 'string'
			? document.querySelector(targetSelector)
			: (targetSelector ?? this.nextElementSibling);

		if (!targetEl) {
			console.warn('vb-ruby-annotate: no target element found');
			return;
		}

		const provider = this._resolveProvider();
		const lang = this.getAttribute('lang') ?? undefined;

		try {
			const count = await annotateElement(targetEl, { lang, provider });
			this.dispatchEvent(new CustomEvent('vb:ruby-annotated', {
				bubbles: true,
				detail: { target: targetEl, count },
			}));
		} catch (error) {
			this.dispatchEvent(new CustomEvent('vb:ruby-error', {
				bubbles: true,
				detail: { error },
			}));
		}
	}

	/**
	 * Watch a target element and re-annotate on DOM changes.
	 * @param {string|HTMLElement} [targetOverride]
	 */
	watch(targetOverride) {
		const targetSelector = targetOverride ?? this.getAttribute('target');
		const targetEl = typeof targetSelector === 'string'
			? document.querySelector(targetSelector)
			: (targetSelector ?? this.nextElementSibling);

		if (!targetEl) return;

		const throttleMs = Number(this.getAttribute('throttle') ?? 500);
		let timer;

		this._observer = new MutationObserver(() => {
			clearTimeout(timer);
			timer = setTimeout(() => this.annotate(targetEl), throttleMs);
		});

		this._observer.observe(targetEl, { childList: true, subtree: true });
	}

	_resolveProvider() {
		const api = this.getAttribute('api') ?? 'custom';
		switch (api) {
			case 'jisho':
				return jishoProvider();
			case 'custom': {
				const endpoint = this.getAttribute('endpoint');
				if (!endpoint) throw new Error('vb-ruby-annotate: endpoint attribute required for api="custom"');
				return customEndpointProvider(endpoint);
			}
			default:
				throw new Error(`vb-ruby-annotate: unknown api "${api}"`);
		}
	}
}

customElements.define('vb-ruby-annotate', VbRubyAnnotate);

export { VbRubyAnnotate };