/**
 * spoiler-init: Content concealment via data attributes
 *
 * Enhances elements with data-spoiler to hide their content behind
 * a blur, solid, or noise overlay. Click or keyboard to reveal.
 * Works on any HTML element — block or inline.
 *
 * @attr {string} data-spoiler - Effect type: "" | "blur" | "solid" | "noise" (default: blur)
 * @attr {string} data-spoiler-label - Custom reveal button text (default: "Reveal spoiler")
 * @attr {boolean} data-spoiler-persist - One-way reveal, no re-hide
 * @attr {string} data-spoiler-group - Mutual exclusion group name
 *
 * @example Block spoiler
 * <div data-spoiler>Darth Vader is Luke's father.</div>
 *
 * @example Inline spoiler
 * <p>The movie ends when <span data-spoiler>the hero dies</span>.</p>
 */

const SELECTOR = '[data-spoiler]';
const ANNOUNCE_DURATION = 1000;
const INLINE_ELEMENTS = new Set([
  'SPAN', 'EM', 'STRONG', 'CODE', 'A', 'B', 'I', 'S', 'U',
  'SMALL', 'SUB', 'SUP', 'MARK', 'ABBR', 'Q', 'CITE', 'DFN',
  'SAMP', 'VAR', 'KBD', 'BDI', 'BDO', 'DATA', 'TIME', 'WBR'
]);

/**
 * Initialize spoiler elements within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initSpoilers(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceSpoiler);
}

/**
 * Enhance a single element with spoiler behavior
 * @param {Element} el - The element to enhance
 */
function enhanceSpoiler(el) {
  if (el.hasAttribute('data-spoiler-init')) return;
  el.setAttribute('data-spoiler-init', '');

  // Normalize effect value
  const effect = el.getAttribute('data-spoiler') || 'blur';
  if (!el.getAttribute('data-spoiler')) {
    el.setAttribute('data-spoiler', 'blur');
  }

  // Detect inline vs block
  const isInline = INLINE_ELEMENTS.has(el.tagName);
  const wrapTag = isInline ? 'span' : 'div';

  // Set host role and label
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', 'Spoiler');

  // Wrap children in content wrapper
  const content = document.createElement(wrapTag);
  content.setAttribute('data-spoiler-content', '');
  content.setAttribute('inert', '');
  while (el.firstChild) {
    content.appendChild(el.firstChild);
  }
  el.appendChild(content);

  // Create trigger
  const label = el.getAttribute('data-spoiler-label') || 'Reveal spoiler';
  let trigger;

  if (isInline) {
    trigger = document.createElement('span');
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('tabindex', '0');
  } else {
    trigger = document.createElement('button');
    trigger.setAttribute('type', 'button');
  }

  trigger.setAttribute('data-spoiler-trigger', '');
  trigger.setAttribute('aria-expanded', 'false');

  const labelSpan = document.createElement('span');
  labelSpan.setAttribute('data-spoiler-label', '');
  labelSpan.textContent = label;
  trigger.appendChild(labelSpan);

  el.appendChild(trigger);

  // Bind events
  trigger.addEventListener('click', () => reveal(el));

  if (isInline) {
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        reveal(el);
      }
    });
  }

  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && el.hasAttribute('data-spoiler-visible')) {
      e.stopPropagation();
      conceal(el);
    }
  });
}

/**
 * Reveal a spoiler element
 * @param {Element} el - The spoiler host element
 */
function reveal(el) {
  // Handle group mutual exclusion
  const group = el.getAttribute('data-spoiler-group');
  if (group) {
    document.querySelectorAll(`[data-spoiler-group="${group}"][data-spoiler-visible]`).forEach((other) => {
      if (other !== el) conceal(other);
    });
  }

  const content = el.querySelector('[data-spoiler-content]');
  const trigger = el.querySelector('[data-spoiler-trigger]');

  if (content) content.removeAttribute('inert');
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'true');
    trigger.hidden = true;
  }
  el.setAttribute('data-spoiler-visible', '');

  // Inject re-hide button (unless persist)
  if (!el.hasAttribute('data-spoiler-persist')) {
    const isInline = INLINE_ELEMENTS.has(el.tagName);
    let hideBtn;

    if (isInline) {
      hideBtn = document.createElement('span');
      hideBtn.setAttribute('role', 'button');
      hideBtn.setAttribute('tabindex', '0');
      hideBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          conceal(el);
        }
      });
    } else {
      hideBtn = document.createElement('button');
      hideBtn.setAttribute('type', 'button');
    }

    hideBtn.setAttribute('data-spoiler-hide', '');
    hideBtn.textContent = 'Hide';
    hideBtn.addEventListener('click', () => conceal(el));
    el.appendChild(hideBtn);
  }

  announce('Spoiler revealed');

  el.dispatchEvent(new CustomEvent('spoiler-toggle', {
    bubbles: true,
    detail: { visible: true }
  }));
}

/**
 * Conceal a spoiler element
 * @param {Element} el - The spoiler host element
 */
function conceal(el) {
  if (el.hasAttribute('data-spoiler-persist')) return;

  const content = el.querySelector('[data-spoiler-content]');
  const trigger = el.querySelector('[data-spoiler-trigger]');
  const hideBtn = el.querySelector('[data-spoiler-hide]');

  if (content) content.setAttribute('inert', '');
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'false');
    trigger.hidden = false;
    trigger.focus();
  }
  if (hideBtn) hideBtn.remove();
  el.removeAttribute('data-spoiler-visible');

  el.dispatchEvent(new CustomEvent('spoiler-toggle', {
    bubbles: true,
    detail: { visible: false }
  }));
}

/**
 * Announce a message to screen readers via a shared live region
 * on document.body — never inside the spoiler, to avoid layout shifts.
 * @param {string} message
 */
function announce(message) {
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  Object.assign(el.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: '0'
  });
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ANNOUNCE_DURATION);
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initSpoilers());
} else {
  initSpoilers();
}

// Watch for dynamically added spoiler elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      if (node.matches?.(SELECTOR)) {
        enhanceSpoiler(node);
      }

      node.querySelectorAll?.(SELECTOR).forEach(enhanceSpoiler);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initSpoilers };
