/**
 * blur-reveal-init: Word-by-word or line-by-line blur-to-clear reveal on scroll
 *
 * Similar to data-reveal but words start blurred (filter: blur) and transition
 * to clear. Splits text into <span> wrappers with staggered CSS custom
 * properties. IntersectionObserver triggers the animation.
 *
 * @attr {string} data-blur-reveal - "" or "word" (per word) or "line" (per line)
 * @attr {string} data-blur-reveal-delay - Stagger ms between chunks (default "80")
 */

const SELECTOR = '[data-blur-reveal]';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.hasAttribute('data-motion-reduced');
}

function splitIntoWords(el) {
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.innerHTML = '';

  const words = text.split(/(\s+)/);
  words.forEach((word, i) => {
    if (/^\s+$/.test(word)) {
      el.appendChild(document.createTextNode(word));
      return;
    }
    const span = document.createElement('span');
    span.className = 'vb-blur-chunk';
    span.textContent = word;
    span.style.setProperty('--i', Math.floor(i / 2));
    span.setAttribute('aria-hidden', 'true');
    el.appendChild(span);
  });
}

function splitIntoLines(el) {
  const text = el.textContent;
  el.setAttribute('aria-label', text);

  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = '';
  const elWidth = el.offsetWidth;

  // Simple line splitting using a range measurement
  const temp = document.createElement('span');
  temp.style.visibility = 'hidden';
  temp.style.position = 'absolute';
  temp.style.font = window.getComputedStyle(el).font;
  document.body.appendChild(temp);

  words.forEach((word) => {
    const test = currentLine ? currentLine + ' ' + word : word;
    temp.textContent = test;
    if (temp.offsetWidth > elWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  });
  if (currentLine) lines.push(currentLine);
  document.body.removeChild(temp);

  if (lines.length === 0) lines.push(text);

  el.innerHTML = '';
  lines.forEach((line, i) => {
    const span = document.createElement('span');
    span.className = 'vb-blur-chunk';
    span.textContent = line;
    span.style.setProperty('--i', i);
    span.setAttribute('aria-hidden', 'true');
    el.appendChild(span);
    if (i < lines.length - 1) el.appendChild(document.createTextNode(' '));
  });
}

function enhanceBlurReveal(el) {
  if (el.hasAttribute('data-blur-reveal-init')) return;
  el.setAttribute('data-blur-reveal-init', '');

  if (prefersReducedMotion()) return;

  const mode = el.getAttribute('data-blur-reveal') || 'word';
  const delay = parseInt(el.getAttribute('data-blur-reveal-delay') || '80', 10);

  el.style.setProperty('--blur-delay', delay + 'ms');

  if (mode === 'line') {
    splitIntoLines(el);
  } else {
    splitIntoWords(el);
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        io.disconnect();
        el.setAttribute('data-blur-reveal-visible', '');
      }
    }
  }, { threshold: 0.1 });

  io.observe(el);
}

function initBlurReveal(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceBlurReveal);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initBlurReveal());
} else {
  initBlurReveal();
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceBlurReveal(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceBlurReveal);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initBlurReveal };
