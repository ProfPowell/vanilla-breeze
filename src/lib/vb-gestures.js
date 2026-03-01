/**
 * vb-gestures: Touch gesture library
 *
 * Standalone module providing swipe detection, swipe-to-dismiss,
 * pull-to-refresh, long-press, and haptic feedback. Uses PointerEvent
 * for cross-platform touch/mouse/pen support.
 *
 * Lazy-loaded when [data-gesture] elements are present on the page.
 * Each function returns a cleanup function for teardown.
 *
 * @module vb-gestures
 */

/**
 * Haptic feedback via Vibration API (Android-only, no-ops elsewhere)
 */
export const haptic = {
  /** Selection, toggle — 8ms */
  tap:     () => navigator.vibrate?.(8),
  /** Confirmation — double pulse */
  confirm: () => navigator.vibrate?.([8, 40, 8]),
  /** Validation failure — heavy double pulse */
  error:   () => navigator.vibrate?.([30, 60, 30]),
  /** Destructive action — 15ms */
  dismiss: () => navigator.vibrate?.(15),
};

/**
 * Detect swipe gestures on an element
 *
 * Listens for pointerdown → pointerup and computes swipe direction.
 * Dispatches swipe-left, swipe-right, swipe-up, swipe-down events.
 *
 * @param {HTMLElement} element   - Element to listen on
 * @param {object}      [options] - Configuration
 * @param {number}      [options.threshold=50]  - Min distance in px
 * @param {number}      [options.restraint=100]  - Max perpendicular distance
 * @param {number}      [options.timeout=300]    - Max duration in ms
 * @returns {Function} cleanup
 */
export function addSwipeListener(element, options = {}) {
  const threshold = options.threshold ?? 50;
  const restraint = options.restraint ?? 100;
  const timeout = options.timeout ?? 300;

  let startX, startY, startTime;

  function onDown(e) {
    if (!e.isPrimary) return;
    startX = e.clientX;
    startY = e.clientY;
    startTime = Date.now();
  }

  function onUp(e) {
    if (!e.isPrimary) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const elapsed = Date.now() - startTime;

    if (elapsed > timeout) return;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let direction;
    if (absDx >= threshold && absDy <= restraint) {
      direction = dx < 0 ? 'left' : 'right';
    } else if (absDy >= threshold && absDx <= restraint) {
      direction = dy < 0 ? 'up' : 'down';
    }

    if (direction) {
      const distance = direction === 'left' || direction === 'right' ? absDx : absDy;
      element.dispatchEvent(new CustomEvent(`swipe-${direction}`, {
        bubbles: true,
        detail: { distance, duration: elapsed },
      }));
    }
  }

  element.addEventListener('pointerdown', onDown, { passive: true });
  element.addEventListener('pointerup', onUp, { passive: true });

  return () => {
    element.removeEventListener('pointerdown', onDown);
    element.removeEventListener('pointerup', onUp);
  };
}

/**
 * Make an element swipeable (drag to dismiss)
 *
 * Full drag tracking with pointer capture, visual translation,
 * and snap-back or removal on release.
 *
 * @param {HTMLElement} element   - Element to make swipeable
 * @param {object}      [options] - Configuration
 * @param {number}      [options.threshold=100]        - Distance to trigger dismiss
 * @param {string}      [options.direction='horizontal'] - 'horizontal' or 'vertical'
 * @param {boolean}     [options.removeOnDismiss=true]  - Remove element from DOM on dismiss
 * @returns {Function} cleanup
 */
export function makeSwipeable(element, options = {}) {
  const threshold = options.threshold ?? 100;
  const direction = options.direction ?? 'horizontal';
  const removeOnDismiss = options.removeOnDismiss ?? true;
  const isHoriz = direction === 'horizontal';

  let startPos = 0;
  let currentDelta = 0;
  let dragging = false;

  function onDown(e) {
    if (!e.isPrimary || element.hasAttribute('data-dismissed')) return;
    e.preventDefault();
    dragging = true;
    startPos = isHoriz ? e.clientX : e.clientY;
    currentDelta = 0;
    element.setPointerCapture(e.pointerId);
    element.setAttribute('data-swiping', '');
  }

  function onMove(e) {
    if (!dragging || !e.isPrimary) return;
    currentDelta = (isHoriz ? e.clientX : e.clientY) - startPos;
    const progress = Math.min(Math.abs(currentDelta) / threshold, 1);
    const opacity = 1 - progress * 0.5;

    if (isHoriz) {
      element.style.transform = `translateX(${currentDelta}px)`;
    } else {
      element.style.transform = `translateY(${currentDelta}px)`;
    }
    element.style.opacity = String(opacity);
  }

  function onUp(e) {
    if (!dragging || !e.isPrimary) return;
    dragging = false;
    element.releasePointerCapture(e.pointerId);
    element.removeAttribute('data-swiping');

    if (Math.abs(currentDelta) >= threshold) {
      dismiss(currentDelta > 0 ? 'right' : 'left');
    } else {
      snapBack();
    }
  }

  function onCancel(e) {
    if (!dragging || !e.isPrimary) return;
    dragging = false;
    element.releasePointerCapture(e.pointerId);
    element.removeAttribute('data-swiping');
    snapBack();
  }

  function dismiss(dir) {
    const exitX = dir === 'right' ? '100%' : '-100%';
    element.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
    element.style.transform = isHoriz ? `translateX(${exitX})` : `translateY(${exitX})`;
    element.style.opacity = '0';
    element.setAttribute('data-dismissed', '');
    haptic.dismiss();

    element.dispatchEvent(new CustomEvent('swipe-dismiss', {
      bubbles: true,
      detail: { direction: dir, distance: Math.abs(currentDelta) },
    }));

    if (removeOnDismiss) {
      element.addEventListener('transitionend', () => element.remove(), { once: true });
    }
  }

  function snapBack() {
    element.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
    element.style.transform = '';
    element.style.opacity = '';
    element.addEventListener('transitionend', () => {
      element.style.transition = '';
    }, { once: true });
  }

  element.addEventListener('pointerdown', onDown);
  element.addEventListener('pointermove', onMove);
  element.addEventListener('pointerup', onUp);
  element.addEventListener('pointercancel', onCancel);

  return () => {
    element.removeEventListener('pointerdown', onDown);
    element.removeEventListener('pointermove', onMove);
    element.removeEventListener('pointerup', onUp);
    element.removeEventListener('pointercancel', onCancel);
  };
}

/**
 * Add pull-to-refresh to a scroll container
 *
 * Creates a spinner indicator and triggers onRefresh when pulled
 * past threshold. onRefresh should return a Promise.
 *
 * @param {HTMLElement} scrollContainer - Scrollable element
 * @param {Function}    onRefresh       - Async callback, spinner shows until resolved
 * @param {object}      [options]       - Configuration
 * @param {number}      [options.threshold=70]  - Pull distance to trigger refresh
 * @param {number}      [options.maxPull=120]   - Maximum pull distance
 * @returns {Function} cleanup
 */
export function addPullToRefresh(scrollContainer, onRefresh, options = {}) {
  const threshold = options.threshold ?? 70;
  const maxPull = options.maxPull ?? 120;

  // Create indicator
  const indicator = document.createElement('div');
  indicator.setAttribute('data-pull-indicator', '');
  indicator.setAttribute('aria-hidden', 'true');
  const spinner = document.createElement('div');
  spinner.setAttribute('data-pull-spinner', '');
  indicator.appendChild(spinner);
  scrollContainer.prepend(indicator);

  let startY = 0;
  let pulling = false;
  let loading = false;

  function onDown(e) {
    if (!e.isPrimary || loading) return;
    if (scrollContainer.scrollTop <= 0) {
      startY = e.clientY;
      pulling = true;
    }
  }

  function onMove(e) {
    if (!pulling || !e.isPrimary || loading) return;
    const dy = e.clientY - startY;
    if (dy <= 0) {
      indicator.style.transform = '';
      indicator.style.opacity = '';
      return;
    }

    const pull = Math.min(dy, maxPull);
    const progress = pull / threshold;
    indicator.style.transform = `translateY(${pull}px)`;
    indicator.style.opacity = String(Math.min(progress, 1));

    if (progress >= 1) {
      indicator.setAttribute('data-pull-ready', '');
    } else {
      indicator.removeAttribute('data-pull-ready');
    }
  }

  function onUp(e) {
    if (!pulling || !e.isPrimary) return;
    pulling = false;

    if (indicator.hasAttribute('data-pull-ready') && !loading) {
      triggerRefresh();
    } else {
      resetIndicator();
    }
  }

  function onCancel(e) {
    if (!pulling || !e.isPrimary) return;
    pulling = false;
    resetIndicator();
  }

  async function triggerRefresh() {
    loading = true;
    indicator.removeAttribute('data-pull-ready');
    indicator.setAttribute('data-pull-loading', '');
    indicator.style.transform = `translateY(${threshold}px)`;
    indicator.style.opacity = '1';

    try {
      await onRefresh();
    } finally {
      loading = false;
      indicator.removeAttribute('data-pull-loading');
      resetIndicator();
    }
  }

  function resetIndicator() {
    indicator.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    indicator.style.transform = '';
    indicator.style.opacity = '';
    indicator.removeAttribute('data-pull-ready');
    indicator.addEventListener('transitionend', () => {
      indicator.style.transition = '';
    }, { once: true });
  }

  scrollContainer.addEventListener('pointerdown', onDown, { passive: true });
  scrollContainer.addEventListener('pointermove', onMove, { passive: true });
  scrollContainer.addEventListener('pointerup', onUp, { passive: true });
  scrollContainer.addEventListener('pointercancel', onCancel, { passive: true });

  return () => {
    scrollContainer.removeEventListener('pointerdown', onDown);
    scrollContainer.removeEventListener('pointermove', onMove);
    scrollContainer.removeEventListener('pointerup', onUp);
    scrollContainer.removeEventListener('pointercancel', onCancel);
    indicator.remove();
  };
}

/**
 * Add long-press detection to an element
 *
 * Fires callback after holding for duration ms. Cancels on move/up/cancel.
 *
 * @param {HTMLElement} element    - Element to listen on
 * @param {Function}    callback   - Called on long press
 * @param {object}      [options]  - Configuration
 * @param {number}      [options.duration=500]        - Hold time in ms
 * @param {boolean}     [options.hapticFeedback=true]  - Vibrate on trigger
 * @param {boolean}     [options.blockContextMenu=true] - Prevent native context menu
 * @returns {Function} cleanup
 */
export function addLongPress(element, callback, options = {}) {
  const duration = options.duration ?? 500;
  const hapticFeedback = options.hapticFeedback ?? true;
  const blockContextMenu = options.blockContextMenu ?? true;

  let timer = null;

  function onDown(e) {
    if (!e.isPrimary) return;
    timer = setTimeout(() => {
      if (hapticFeedback) haptic.tap();
      callback(e);
      timer = null;
    }, duration);
  }

  function cancel() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function onContext(e) {
    if (blockContextMenu) e.preventDefault();
  }

  element.addEventListener('pointerdown', onDown, { passive: true });
  element.addEventListener('pointermove', cancel, { passive: true });
  element.addEventListener('pointerup', cancel, { passive: true });
  element.addEventListener('pointercancel', cancel, { passive: true });
  element.addEventListener('contextmenu', onContext);

  return () => {
    cancel();
    element.removeEventListener('pointerdown', onDown);
    element.removeEventListener('pointermove', cancel);
    element.removeEventListener('pointerup', cancel);
    element.removeEventListener('pointercancel', cancel);
    element.removeEventListener('contextmenu', onContext);
  };
}

/**
 * Auto-initialize gestures from data-gesture attributes
 *
 * @param {HTMLElement|Document} [root=document] - Root element to scan
 * @returns {Function} cleanup - Removes all initialized gestures
 */
export function initGestures(root = document) {
  const cleanups = [];

  // data-gesture="swipe"
  for (const el of root.querySelectorAll('[data-gesture="swipe"]')) {
    cleanups.push(addSwipeListener(/** @type {HTMLElement} */ (el)));
  }

  // data-gesture="dismiss"
  for (const el of root.querySelectorAll('[data-gesture="dismiss"]')) {
    cleanups.push(makeSwipeable(/** @type {HTMLElement} */ (el)));
  }

  // data-gesture="long-press"
  for (const el of root.querySelectorAll('[data-gesture="long-press"]')) {
    cleanups.push(addLongPress(/** @type {HTMLElement} */ (el), () => {
      el.dispatchEvent(new CustomEvent('long-press', { bubbles: true }));
    }));
  }

  return () => cleanups.forEach(fn => fn());
}

// Auto-init on load (triggered by lazy-load guard in main.js)
initGestures();
