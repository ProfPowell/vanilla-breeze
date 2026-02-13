/**
 * animate-image-init: Play/pause control for animated images (GIF, WebP, APNG)
 *
 * Adds a play/pause toggle button to animated images for motion control.
 * Accessibility win: respects prefers-reduced-motion by auto-pausing.
 *
 * @attr {boolean} data-animate-image - Marks an image for animation control
 * @attr {string} data-animate-image-paused - Auto-added when paused; can be set initially to start paused
 *
 * @example
 * <img src="animation.gif" data-animate-image alt="Animated demo">
 */

const SELECTOR = 'img[data-animate-image]';

/**
 * Initialize animated image controls within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initAnimateImage(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhance);
}

/**
 * Enhance a single animated image with play/pause control
 * @param {HTMLImageElement} img - The image element
 */
function enhance(img) {
  if (img.hasAttribute('data-animate-image-init')) return;
  img.setAttribute('data-animate-image-init', '');

  // Wrap in a container for positioning
  const wrapper = document.createElement('div');
  wrapper.className = 'animate-image-wrapper';
  img.parentNode.insertBefore(wrapper, img);
  wrapper.appendChild(img);

  // Create toggle button
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'animate-image-toggle';
  btn.setAttribute('aria-label', 'Pause animation');
  wrapper.appendChild(btn);

  // Store the original animated src
  const animatedSrc = img.src;
  let staticSrc = null;
  let isPaused = false;

  // Create a static frame by drawing the image to a canvas
  function captureFrame() {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    try {
      staticSrc = canvas.toDataURL('image/png');
    } catch {
      // Cross-origin or tainted canvas — fall back to hiding
      staticSrc = null;
    }
  }

  function pause() {
    if (isPaused) return;
    isPaused = true;
    img.setAttribute('data-animate-image-paused', '');
    btn.setAttribute('aria-label', 'Play animation');
    btn.classList.add('paused');
    if (staticSrc) {
      img.src = staticSrc;
    }
  }

  function play() {
    if (!isPaused) return;
    isPaused = false;
    img.removeAttribute('data-animate-image-paused');
    btn.setAttribute('aria-label', 'Pause animation');
    btn.classList.remove('paused');
    img.src = animatedSrc;
  }

  function toggle() {
    if (isPaused) play();
    else pause();
  }

  btn.addEventListener('click', toggle);

  // Capture frame once loaded
  if (img.complete && img.naturalWidth) {
    captureFrame();
  } else {
    img.addEventListener('load', captureFrame, { once: true });
  }

  // Respect prefers-reduced-motion
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches || document.documentElement.dataset.motionReduced !== undefined) {
    // Wait for frame capture, then pause
    if (img.complete) {
      captureFrame();
      pause();
    } else {
      img.addEventListener('load', () => {
        captureFrame();
        pause();
      }, { once: true });
    }
  }

  // Also respect runtime changes to motion preference
  mq.addEventListener('change', (e) => {
    if (e.matches) pause();
  });

  // Start paused if attribute is set
  if (img.hasAttribute('data-animate-image-paused')) {
    if (img.complete) {
      captureFrame();
      isPaused = false; // reset so pause() actually runs
      pause();
    } else {
      img.addEventListener('load', () => {
        captureFrame();
        isPaused = false;
        pause();
      }, { once: true });
    }
  }
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initAnimateImage());
} else {
  initAnimateImage();
}

// Watch for dynamically added images
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhance(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhance);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initAnimateImage };
