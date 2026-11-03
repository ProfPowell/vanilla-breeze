/**
 * Auto-hiding header: hides on scroll-down, reveals on scroll-up.
 * Pair with header[data-scroll-hide] CSS.
 *
 * A passive scroll listener tracks direction. Reveal uses hysteresis on the
 * upward distance accumulated since the last direction change, so a slow
 * scroll (many small deltas, e.g. trackpad or keyboard) still reveals the
 * header once it adds up to SHOW_THRESHOLD.
 *
 * Keyboard users: focus moving into a hidden header reveals it (the CSS
 * :focus-within rule covers the same case without JS).
 */
export {};

const HIDE_THRESHOLD = 80;  // px scrolled from the top before hiding is allowed
const SHOW_THRESHOLD = 40;  // px of continuous upward scroll before showing

document.querySelectorAll('header[data-scroll-hide]').forEach(header => {
  const scrollTarget = header.closest('main') ?? window;
  const getScrollTop = () =>
    scrollTarget === window ? window.scrollY : /** @type {HTMLElement} */ (scrollTarget).scrollTop;

  let lastY = getScrollTop();
  let upDistance = 0;   // upward movement since the last downward scroll
  let hidden = header.hasAttribute('data-hidden');

  const show = () => {
    header.removeAttribute('data-hidden');
    hidden = false;
  };

  const update = () => {
    const currentY = getScrollTop();
    const delta = currentY - lastY;
    lastY = currentY;
    if (delta === 0) return;

    if (delta > 0) {
      // Scrolling down — reset the upward run, hide past the threshold
      upDistance = 0;
      if (!hidden && currentY > HIDE_THRESHOLD && !header.matches(':focus-within')) {
        header.setAttribute('data-hidden', '');
        hidden = true;
      }
      return;
    }

    // Scrolling up — accumulate, reveal once the run passes the hysteresis
    // (or when back near the top)
    upDistance -= delta;
    if (hidden && (upDistance >= SHOW_THRESHOLD || currentY <= HIDE_THRESHOLD)) show();
  };

  scrollTarget.addEventListener('scroll', update, { passive: true });
  header.addEventListener('focusin', () => { if (hidden) show(); });
});
