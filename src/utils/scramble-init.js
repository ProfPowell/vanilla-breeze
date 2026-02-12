/**
 * scramble-init: Text scramble/decode effect on scroll
 *
 * Characters resolve left-to-right over a duration. Unresolved positions
 * show random characters from a configurable set. IntersectionObserver
 * triggers the animation.
 *
 * @attr {string} data-scramble - Duration ms (default "1500")
 * @attr {string} data-scramble-chars - Character set for random chars
 * @attr {string} data-scramble-speed - Frame interval ms (default "30")
 */

const SELECTOR = '[data-scramble]';
const DEFAULT_CHARS = '!<>-_\\/[]{}=+*^?#';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.hasAttribute('data-motion-reduced');
}

function randomChar(chars) {
  return chars[Math.floor(Math.random() * chars.length)];
}

function runScramble(el) {
  const text = el.getAttribute('data-scramble-text');
  const duration = parseInt(el.getAttribute('data-scramble') || '1500', 10) || 1500;
  const chars = el.getAttribute('data-scramble-chars') || DEFAULT_CHARS;
  const speed = parseInt(el.getAttribute('data-scramble-speed') || '30', 10) || 30;

  const length = text.length;
  let frame = 0;
  const totalFrames = Math.ceil(duration / speed);

  function step() {
    const progress = frame / totalFrames;
    const resolved = Math.floor(progress * length);
    let output = '';

    for (let i = 0; i < length; i++) {
      if (i < resolved) {
        output += text[i];
      } else if (text[i] === ' ') {
        output += ' ';
      } else {
        output += randomChar(chars);
      }
    }

    el.textContent = output;
    frame++;

    if (frame <= totalFrames) {
      setTimeout(step, speed);
    } else {
      el.textContent = text;
    }
  }

  step();
}

function enhanceScramble(el) {
  if (el.hasAttribute('data-scramble-init')) return;
  el.setAttribute('data-scramble-init', '');

  const text = el.textContent.trim();
  el.setAttribute('data-scramble-text', text);
  el.setAttribute('aria-label', text);

  if (prefersReducedMotion()) return;

  // Show scrambled initial state
  const chars = el.getAttribute('data-scramble-chars') || DEFAULT_CHARS;
  el.textContent = text.replace(/\S/g, () => randomChar(chars));

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        io.disconnect();
        runScramble(el);
      }
    }
  }, { threshold: 0.1 });

  io.observe(el);
}

function initScramble(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceScramble);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initScramble());
} else {
  initScramble();
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceScramble(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceScramble);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initScramble };
