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
 *
 * @example Precompiled block math
 * <code data-math data-mathml="<math display='block'><mi>x</mi></math>">x</code>
 *
 * @example Inline math
 * <code data-math="inline" data-mathml="<math><mi>&pi;</mi></math>">\pi</code>
 */

import { getCdnBase } from '../lib/theme-loader.js';
import { sanitizeMathML } from '../lib/sanitize-html.js';

const SELECTOR = '[data-math], code.language-math';
const ANNOUNCE_DURATION = 3000;

let equationCounter = 0;

// Global equation registry
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
 * Enhance a single element with MathML rendering
 * @param {Element} el - The element to enhance
 */
function enhanceElement(el) {
  if (el.hasAttribute('data-math-init')) return;
  el.setAttribute('data-math-init', '');

  // Auto-map code.language-math to data-math if not already set
  if (!el.hasAttribute('data-math') && el.classList.contains('language-math')) {
    el.setAttribute('data-math', '');
  }

  const tokens = parseTokens(el);
  const mathml = el.getAttribute('data-mathml');
  const latex = el.textContent.trim();
  const isInline = tokens.has('inline');

  // No precompiled MathML — show source as readable code
  if (!mathml) {
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

  // Ensure correct display attribute on the <math> element
  const mathEl = wrapper.querySelector('math');
  if (mathEl && !isInline) {
    mathEl.setAttribute('display', 'block');
  }

  // Handle numbered equations
  let eqNumber = null;
  if (tokens.has('numbered')) {
    equationCounter++;
    eqNumber = equationCounter;
    wrapper.setAttribute('data-math-numbered', '');
    wrapper.setAttribute('data-equation-number', String(eqNumber));

    if (sourceId) {
      window.VBMath?.equations.push({ id: sourceId, number: eqNumber, latex });
    }
  }

  // Handle copyable: a real <button> (keyboard + focus for free). Labels are
  // overridable per element: data-label-copy (button text) and
  // data-label-copied (the polite status announcement).
  if (tokens.has('copyable')) {
    wrapper.setAttribute('data-math-copyable', '');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-math-copy', '');
    button.textContent = el.getAttribute('data-label-copy') || 'Copy LaTeX';
    const copied = el.getAttribute('data-label-copied') || 'Copied to clipboard';
    // Live region exists before the message is written so it is announced.
    const status = document.createElement('span');
    status.setAttribute('role', 'status');
    status.className = 'visually-hidden';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(latex);
        announce(copied, status);
      } catch {
        // Clipboard API unavailable
      }
    });
    wrapper.append(button, status);
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

  // Ensure math font is loaded
  ensureMathFont();

  // Dispatch rendered event
  el.dispatchEvent(new CustomEvent('math:rendered', {
    bubbles: true,
    detail: { latex, inline: isInline, number: eqNumber }
  }));
}

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

/**
 * Write a message into a persistent status region, then clear it
 * @param {string} message
 * @param {Element} status - role="status" element already in the DOM
 */
function announce(message, status) {
  status.textContent = message;
  setTimeout(() => { status.textContent = ''; }, ANNOUNCE_DURATION);
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initMath());
} else {
  initMath();
}

// Watch for dynamically added math elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const el = /** @type {Element} */ (node);
      if (el.matches(SELECTOR)) {
        enhanceElement(el);
      }

      el.querySelectorAll(SELECTOR).forEach(enhanceElement);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initMath };
