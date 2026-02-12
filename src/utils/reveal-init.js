/**
 * reveal-init: Word-by-word or line-by-line text reveal on scroll
 *
 * Splits text into <span> wrappers with staggered CSS custom properties.
 * IntersectionObserver adds [data-reveal-visible] to trigger CSS transitions.
 * aria-label preserves the full text for screen readers.
 *
 * @attr {string} data-reveal - "" or "word" (per word) or "line" (per line)
 * @attr {string} data-reveal-delay - Stagger ms between chunks (default "80")
 * @attr {string} data-reveal-duration - Animation ms per chunk (default "400")
 */

const SELECTOR = '[data-reveal]';

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
    span.className = 'vb-reveal-chunk';
    span.textContent = word;
    span.style.setProperty('--i', Math.floor(i / 2));
    span.setAttribute('aria-hidden', 'true');
    el.appendChild(span);
  });
}

function splitIntoLines(el) {
  const text = el.textContent;
  el.setAttribute('aria-label', text);

  // Use a temporary element to measure line breaks
  const temp = document.createElement('div');
  temp.style.cssText = window.getComputedStyle(el).cssText;
  temp.style.position = 'absolute';
  temp.style.visibility = 'hidden';
  temp.style.whiteSpace = 'normal';
  document.body.appendChild(temp);

  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const test = currentLine ? currentLine + ' ' + word : word;
    temp.textContent = test;
    const testWidth = temp.offsetWidth;

    temp.textContent = '';
    temp.style.width = window.getComputedStyle(el).width;
    temp.textContent = test;

    if (temp.scrollWidth > temp.clientWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  });
  if (currentLine) lines.push(currentLine);
  document.body.removeChild(temp);

  // Fallback: if line detection fails, treat whole text as one line
  if (lines.length === 0) lines.push(text);

  el.innerHTML = '';
  lines.forEach((line, i) => {
    const span = document.createElement('span');
    span.className = 'vb-reveal-chunk';
    span.textContent = line;
    span.style.setProperty('--i', i);
    span.setAttribute('aria-hidden', 'true');
    el.appendChild(span);
    if (i < lines.length - 1) el.appendChild(document.createTextNode(' '));
  });
}

function enhanceReveal(el) {
  if (el.hasAttribute('data-reveal-init')) return;
  el.setAttribute('data-reveal-init', '');

  if (prefersReducedMotion()) return;

  const mode = el.getAttribute('data-reveal') || 'word';
  const delay = parseInt(el.getAttribute('data-reveal-delay') || '80', 10);
  const duration = parseInt(el.getAttribute('data-reveal-duration') || '400', 10);

  el.style.setProperty('--reveal-delay', delay + 'ms');
  el.style.setProperty('--reveal-duration', duration + 'ms');

  if (mode === 'line') {
    splitIntoLines(el);
  } else {
    splitIntoWords(el);
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        io.disconnect();
        el.setAttribute('data-reveal-visible', '');
      }
    }
  }, { threshold: 0.1 });

  io.observe(el);
}

function initReveal(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceReveal);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initReveal());
} else {
  initReveal();
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceReveal(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceReveal);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initReveal };
