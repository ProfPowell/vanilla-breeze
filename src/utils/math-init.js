/**
 * math-init: Enhance code elements with precompiled MathML
 *
 * Detects [data-math] and code.language-math elements, injects precompiled
 * MathML from a data-mathml attribute, and hides the original source code.
 *
 * @attr {string} data-math - Space-separated tokens: inline, numbered, copyable
 * @attr {string} data-mathml - Precompiled MathML string to inject. Sanitized to MathML elements only
 *   (no event handlers, href/src/style/id/name, xlink:/xml: attributes, mglyph/malignmark) and
 *   inserted as nodes — still treat it as author-controlled, not user input.
 * @attr {string} data-label-copy - Copy button text (copyable; default "Copy LaTeX")
 * @attr {string} data-label-copied - Announcement after copying (default "Copied to clipboard")
 * @attr {string} data-label-copy-failed - Announcement when the clipboard refuses (default "Copy failed")
 *
 * Labels are read from the element or its nearest ancestor that sets them.
 * Rendered <math> gets alttext (the LaTeX source) unless it has one, for
 * assistive tech without MathML support. In a browser without MathML the
 * source stays visible. Equation numbers follow document order and are
 * renumbered when equations are added or removed. Enhanced elements are
 * tracked in a WeakSet; a cloned source + rendered pair is adopted, not
 * rendered twice, and the copy button works through a delegated listener.
 *
 * @example Precompiled block math
 * <code data-math data-mathml="<math display='block'><mi>x</mi></math>">x</code>
 *
 * @example Inline math
 * <code data-math="inline" data-mathml="<math><mi>&pi;</mi></math>">\pi</code>
 */

import { getCdnBase } from '../lib/theme-loader.js';
import { sanitizeMathML } from '../lib/sanitize-html.js';
import { readLabel } from '../lib/announce.js';
import { copyText } from './copy-init.js';

const SELECTOR = '[data-math], code.language-math';
const FEEDBACK_DURATION = 2000;
const MATHML_SUPPORTED = typeof MathMLElement !== 'undefined';

/** @type {WeakSet<Element>} */
const enhanced = new WeakSet();

// Global equation registry (rebuilt in document order by renumber())
window.VBMath = window.VBMath || { equations: [] };

/**
 * Initialize math elements within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initMath(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceElement);
}

/**
 * Parse space-separated tokens from the data-math attribute
 * @param {Element} el
 * @returns {Set<string>}
 */
function parseTokens(el) {
  const value = el.getAttribute('data-math') || '';
  return new Set(value.split(/\s+/).filter(Boolean));
}

/**
 * The rendered wrapper that belongs to a source element (it is inserted
 * right after the element, or after its <pre>).
 * @param {Element} el
 * @returns {Element|null}
 */
function renderedFor(el) {
  const next = (el.closest('pre') || el).nextElementSibling;
  return next?.hasAttribute('data-math-rendered') ? next : null;
}

/**
 * The source element a rendered wrapper was made from.
 * @param {Element} wrapper
 * @returns {Element|null}
 */
function sourceFor(wrapper) {
  const prev = wrapper.previousElementSibling;
  if (!prev) return null;
  if (prev.matches(SELECTOR)) return prev;
  return prev.matches('pre') ? prev.querySelector(SELECTOR) : null;
}

/**
 * Number every numbered equation in document order and rebuild the
 * VBMath.equations registry, so late-inserted or removed equations never
 * leave gaps or out-of-order numbers.
 */
function renumber() {
  /** @type {Array<{ id: string, number: number, latex: string }>} */
  const equations = [];
  document.querySelectorAll('[data-math-rendered][data-math-numbered]').forEach((wrapper, i) => {
    const number = i + 1;
    if (wrapper.getAttribute('data-equation-number') !== String(number)) {
      wrapper.setAttribute('data-equation-number', String(number));
    }
    if (wrapper.id) {
      equations.push({ id: wrapper.id, number, latex: sourceFor(wrapper)?.textContent.trim() ?? '' });
    }
  });
  const registry = (window.VBMath ??= { equations: [] }).equations;
  registry.splice(0, registry.length, ...equations);
}

let renumberQueued = false;
function queueRenumber() {
  if (renumberQueued) return;
  renumberQueued = true;
  queueMicrotask(() => {
    renumberQueued = false;
    renumber();
  });
}

/**
 * Enhance a single element with MathML rendering
 * @param {Element} el - The element to enhance
 */
function enhanceElement(el) {
  if (enhanced.has(el)) return;
  enhanced.add(el);
  // State hook only (styling/tests); the WeakSet is the guard.
  el.setAttribute('data-math-init', '');

  // A clone of an enhanced element (or a second copy of this script)
  // already has its rendered wrapper next to it: adopt it.
  if (el.getAttribute('data-math-state') === 'rendered' && renderedFor(el)) {
    queueRenumber();
    return;
  }

  // Auto-map code.language-math to data-math if not already set
  if (!el.hasAttribute('data-math') && el.classList.contains('language-math')) {
    el.setAttribute('data-math', '');
  }

  const tokens = parseTokens(el);
  const mathml = el.getAttribute('data-mathml');
  const latex = el.textContent.trim();
  const isInline = tokens.has('inline');

  // No precompiled MathML, or a browser that cannot render MathML: show
  // the source as readable code.
  if (!mathml || !MATHML_SUPPORTED) {
    el.setAttribute('data-math-state', 'source');
    return;
  }

  // Inject precompiled MathML
  const wrapper = isInline
    ? document.createElement('span')
    : document.createElement('div');

  wrapper.setAttribute('data-math-rendered', '');
  // data-mathml is treated as untrusted-ish: only MathML-namespace elements
  // survive (no HTML/SVG, mglyph, on*, href, src, style, id), inserted as
  // nodes — sanitizers like DOMPurify keep data-* attributes, so this
  // attribute must not be an innerHTML gadget.
  wrapper.replaceChildren(sanitizeMathML(mathml));

  // Move source id to the rendered wrapper so hash links target visible math.
  const sourceId = el.id || null;
  if (sourceId) {
    wrapper.id = sourceId;
    el.removeAttribute('id');
  }

  const mathEl = wrapper.querySelector('math');
  if (mathEl) {
    // Ensure correct display attribute on the <math> element
    if (!isInline) mathEl.setAttribute('display', 'block');
    // Text alternative for assistive tech without MathML support.
    if (!mathEl.hasAttribute('alttext') && latex) mathEl.setAttribute('alttext', latex);
  }

  if (tokens.has('numbered')) wrapper.setAttribute('data-math-numbered', '');

  // Handle copyable: a real <button> (keyboard + focus for free); clicks
  // are handled by one delegated listener, so clones work too.
  if (tokens.has('copyable')) {
    wrapper.setAttribute('data-math-copyable', '');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-math-copy', '');
    button.textContent = readLabel(el, 'copy', 'Copy LaTeX');
    wrapper.append(button);
  }

  // Insert rendered math and hide original source
  el.setAttribute('data-math-state', 'rendered');

  // If the element is inside a <pre>, hide the <pre> too — and render after
  // the <pre>, not inside it, or the hidden <pre> would hide the math as well.
  const parentPre = el.closest('pre');
  (parentPre || el).insertAdjacentElement('afterend', wrapper);
  if (parentPre) {
    parentPre.setAttribute('data-math-state', 'rendered');
    parentPre.hidden = true;
  } else {
    /** @type {HTMLElement} */ (el).hidden = true;
  }

  // Numbers follow document order, so a late insert renumbers the rest.
  let eqNumber = null;
  if (tokens.has('numbered')) {
    renumber();
    eqNumber = Number(wrapper.getAttribute('data-equation-number'));
  }

  // Ensure math font is loaded
  ensureMathFont();

  // Dispatch rendered event
  el.dispatchEvent(new CustomEvent('math:rendered', {
    bubbles: true,
    detail: { latex, inline: isInline, number: eqNumber }
  }));
}

/**
 * Copy a rendered equation's LaTeX source; announce the outcome and show it
 * on the button for a moment.
 * @param {HTMLButtonElement} button
 */
async function copyLatex(button) {
  const wrapper = button.closest('[data-math-rendered]');
  const source = wrapper && sourceFor(wrapper);
  if (!source) return;
  const latex = source.textContent.trim();
  const label = readLabel(source, 'copy', 'Copy LaTeX');
  const copied = readLabel(source, 'copied', 'Copied to clipboard');
  const failed = readLabel(source, 'copy-failed', 'Copy failed');
  // copyText() writes (with the execCommand fallback) and announces through
  // the shared announcer: polite on success, assertive on failure.
  const ok = await copyText(latex, { announceMessage: copied, failureMessage: failed });
  const message = ok ? copied : failed;
  button.setAttribute('data-state', ok ? 'copied' : 'failed');
  button.textContent = message;
  clearTimeout(feedbackTimers.get(button));
  feedbackTimers.set(button, setTimeout(() => {
    button.removeAttribute('data-state');
    button.textContent = label;
  }, FEEDBACK_DURATION));
}

/** @type {WeakMap<Element, ReturnType<typeof setTimeout>>} */
const feedbackTimers = new WeakMap();

/**
 * Lazy-inject math font CSS when math is detected. Resolved against the VB
 * CDN base (the build ships it as cdn/fonts/math-fonts.css), so CDN and
 * subpath consumers fetch it from wherever VB itself is served.
 */
function ensureMathFont() {
  if (document.querySelector('[data-vb-math-font]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${getCdnBase()}/fonts/math-fonts.css`;
  link.setAttribute('data-vb-math-font', '');
  document.head.appendChild(link);
}

// One delegated copy listener per document (guarded in case the module is
// evaluated by more than one bundle).
const COPY_KEY = Symbol.for('vb.math.copy');
if (!(/** @type {any} */ (document))[COPY_KEY]) {
  /** @type {any} */ (document)[COPY_KEY] = true;
  document.addEventListener('click', (event) => {
    const target = /** @type {Element|null} */ (event.target instanceof Element ? event.target : null);
    const button = /** @type {HTMLButtonElement|null} */ (target?.closest('button[data-math-copy]') ?? null);
    if (button) copyLatex(button);
  });
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initMath());
} else {
  initMath();
}

// Watch for added math elements, and renumber when equations leave
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.removedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {Element} */ (node);
      if (el.matches('[data-math-numbered]') || el.querySelector('[data-math-numbered]')) queueRenumber();
    }
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const el = /** @type {Element} */ (node);
      if (el.matches(SELECTOR)) {
        enhanceElement(el);
      }

      el.querySelectorAll(SELECTOR).forEach(enhanceElement);
      if (el.matches('[data-math-numbered]') || el.querySelector('[data-math-numbered]')) queueRenumber();
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initMath };
