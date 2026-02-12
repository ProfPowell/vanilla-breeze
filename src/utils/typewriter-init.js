/**
 * typewriter-init: Character-by-character typing animation on scroll
 *
 * Stores the element's text, clears it, then types characters via setTimeout.
 * Optional cursor blink and looping (type → pause → delete → repeat).
 * IntersectionObserver triggers the start.
 *
 * @attr {string} data-typewriter - ms per character (default "50")
 * @attr {string} data-typewriter-delay - Initial delay ms (default "0")
 * @attr {string} data-typewriter-cursor - "" (show cursor) or "none" (hide)
 * @attr {string} data-typewriter-loop - Pause ms before loop; omit = play once
 */

const SELECTOR = '[data-typewriter]';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.hasAttribute('data-motion-reduced');
}

function typeText(el, text, speed, onDone) {
  let i = 0;
  function step() {
    if (i <= text.length) {
      el.firstChild.textContent = text.slice(0, i);
      i++;
      setTimeout(step, speed);
    } else if (onDone) {
      onDone();
    }
  }
  step();
}

function deleteText(el, speed, onDone) {
  const text = el.firstChild.textContent;
  let i = text.length;
  function step() {
    if (i >= 0) {
      el.firstChild.textContent = text.slice(0, i);
      i--;
      setTimeout(step, speed / 2);
    } else if (onDone) {
      onDone();
    }
  }
  step();
}

function startTypewriter(el) {
  const text = el.getAttribute('data-typewriter-text');
  const speed = parseInt(el.getAttribute('data-typewriter') || '50', 10) || 50;
  const initialDelay = parseInt(el.getAttribute('data-typewriter-delay') || '0', 10);
  const loopPause = el.hasAttribute('data-typewriter-loop')
    ? parseInt(el.getAttribute('data-typewriter-loop') || '2000', 10)
    : null;

  // Create text node and optional cursor
  el.textContent = '';
  const textNode = document.createTextNode('');
  el.appendChild(textNode);

  const showCursor = el.getAttribute('data-typewriter-cursor') !== 'none';
  if (showCursor) {
    const cursor = document.createElement('span');
    cursor.className = 'vb-typewriter-cursor';
    cursor.textContent = '|';
    cursor.setAttribute('aria-hidden', 'true');
    el.appendChild(cursor);
  }

  function runCycle() {
    typeText(el, text, speed, () => {
      if (loopPause !== null) {
        setTimeout(() => {
          deleteText(el, speed, () => {
            setTimeout(runCycle, 400);
          });
        }, loopPause);
      }
    });
  }

  setTimeout(runCycle, initialDelay);
}

function enhanceTypewriter(el) {
  if (el.hasAttribute('data-typewriter-init')) return;
  el.setAttribute('data-typewriter-init', '');

  // Store original text before clearing
  const text = el.textContent.trim();
  el.setAttribute('data-typewriter-text', text);
  el.setAttribute('aria-label', text);

  if (prefersReducedMotion()) return;

  // Clear text — will be typed in when visible
  el.textContent = '';

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        io.disconnect();
        startTypewriter(el);
      }
    }
  }, { threshold: 0.1 });

  io.observe(el);
}

function initTypewriter(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceTypewriter);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initTypewriter());
} else {
  initTypewriter();
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceTypewriter(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceTypewriter);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initTypewriter };
