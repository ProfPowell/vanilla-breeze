/**
 * math-init: Enhance code elements with precompiled MathML
 *
 * Detects [data-math] and code.language-math elements, injects precompiled
 * MathML from a data-mathml attribute, and hides the original source code.
 *
 * @attr {string} data-math - Space-separated tokens: inline, numbered, copyable
 * @attr {string} data-mathml - Precompiled MathML string to inject
 *
 * @example Precompiled block math
 * <code data-math data-mathml="<math display='block'><mi>x</mi></math>">x</code>
 *
 * @example Inline math
 * <code data-math="inline" data-mathml="<math><mi>&pi;</mi></math>">\pi</code>
 */

const SELECTOR = '[data-math], code.language-math';
const ANNOUNCE_DURATION = 1000;

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
  wrapper.innerHTML = mathml;

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

  // Handle copyable
  if (tokens.has('copyable')) {
    wrapper.setAttribute('data-math-copyable', '');
    wrapper.style.cursor = 'copy';
    wrapper.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(latex);
        announce('Copied to clipboard', wrapper);
      } catch {
        // Clipboard API unavailable
      }
    });
  }

  // Insert rendered math and hide original source
  el.setAttribute('data-math-state', 'rendered');
  el.insertAdjacentElement('afterend', wrapper);

  // If the element is inside a <pre>, hide the <pre> too
  const parentPre = el.closest('pre');
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
 * Lazy-inject math font CSS when math is detected
 */
function ensureMathFont() {
  if (document.querySelector('[data-vb-math-font]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/fonts/math-fonts.css';
  link.setAttribute('data-vb-math-font', '');
  document.head.appendChild(link);
}

/**
 * Announce a message to screen readers
 * @param {string} message
 * @param {Element} context
 */
function announce(message, context) {
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.className = 'sr-only';
  el.textContent = message;
  context.appendChild(el);
  setTimeout(() => el.remove(), ANNOUNCE_DURATION);
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
