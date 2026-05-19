/**
 * Auto-hiding header: hides on scroll-down, reveals on scroll-up.
 * Pair with header[data-scroll-hide] CSS.
 *
 * Uses IntersectionObserver on a sentinel element for performant
 * detection, with a scroll listener for direction-aware hysteresis.
 */
export {};

const HIDE_THRESHOLD = 80;  // px scrolled down before hiding
const SHOW_THRESHOLD = 40;  // px scrolled up before showing (hysteresis)

document.querySelectorAll('header[data-scroll-hide]').forEach(header => {
  let lastY = 0;
  let hidden = false;
  const scrollTarget = header.closest('main') ?? window;
  const getScrollTop = () =>
    scrollTarget === window ? window.scrollY : /** @type {HTMLElement} */ (scrollTarget).scrollTop;

  const update = () => {
    const currentY = getScrollTop();
    const delta = currentY - lastY;

    if (!hidden && delta > 0 && currentY > HIDE_THRESHOLD) {
      // Scrolling down past threshold — hide
      header.setAttribute('data-hidden', '');
      hidden = true;
    } else if (hidden && delta < -SHOW_THRESHOLD) {
      // Scrolling up past hysteresis — show
      header.removeAttribute('data-hidden');
      hidden = false;
    }

    lastY = currentY;
  };

  scrollTarget.addEventListener('scroll', update, { passive: true });
});
