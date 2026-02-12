/**
 * interest-polyfill: Polyfill for the interestfor attribute
 *
 * Ported from mfreed7/interestfor (BSD license) to vanilla-breeze conventions:
 * - ES module with named export
 * - WeakMap state (no monkey-patched DOM properties)
 * - CustomEvent with detail.source
 * - MutationObserver for dynamic elements
 * - DOMContentLoaded auto-init (not window.load)
 * - No console output
 *
 * When interestfor is natively supported, this module is a no-op.
 *
 * @see https://open-ui.org/components/interest-invokers.explainer/
 */

const ATTR = 'interestfor';

// Feature detection — exit early if native
const nativeSupported = 'interestForElement' in HTMLButtonElement.prototype;

// State management via WeakMaps
const invokerData = new WeakMap();
const targetData = new WeakMap();
const activeInvokers = new Set();
let touchInProgress = false;

// ---- Timing ----

function parseTime(val) {
  const s = String(val).trim();
  const mS = s.match(/^([\d.]+)s$/);
  if (mS) return parseFloat(mS[1]) * 1000;
  const mMs = s.match(/^([\d.]+)ms$/);
  if (mMs) return parseFloat(mMs[1]);
  return parseFloat(s) || 0;
}

function getDelay(el, prop) {
  const style = getComputedStyle(el);
  const longhand = style.getPropertyValue(prop).trim();

  if (longhand.toLowerCase() !== 'normal') {
    return parseTime(longhand);
  }

  const shorthand = style.getPropertyValue('--interest-delay').trim();
  if (shorthand && shorthand.toLowerCase() !== 'normal') {
    const parts = shorthand.split(/\s+/).filter(s => s.length > 0);
    if (parts.length > 0) {
      const value = prop === '--interest-delay-start' ? parts[0] : (parts[1] || parts[0]);
      if (value.toLowerCase() !== 'normal') return parseTime(value);
    }
  }

  // Defaults: 500ms start, 250ms end
  return prop === '--interest-delay-start' ? 500 : 250;
}

// ---- Accessibility ----

const focusableSelector = [
  'a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', 'button:not([disabled])', 'iframe', 'object',
  'embed', '[contenteditable]', '[tabindex]:not([tabindex="-1"])'
].join(',');

const structuralSelector =
  'h1,h2,h3,h4,h5,h6,ul,ol,li,table,nav,header,footer,main,aside,article,section,form,blockquote,details,summary,dialog';

function isPlainHint(target) {
  if (target.getAttribute('popover')?.toLowerCase() !== 'hint') return false;
  if (target.querySelector(focusableSelector)) return false;
  if (target.querySelector(structuralSelector)) return false;
  for (const el of target.querySelectorAll('[role]')) {
    const role = el.getAttribute('role').toLowerCase();
    if (!['presentation', 'none', 'generic', 'image'].includes(role)) return false;
  }
  return true;
}

function setupAccessibility(invoker, target) {
  if (isPlainHint(target)) {
    invoker.setAttribute('aria-describedby', target.id);
  } else {
    invoker.setAttribute('aria-details', target.id);
    invoker.setAttribute('aria-expanded', 'false');
    if (!target.hasAttribute('role')) target.setAttribute('role', 'tooltip');
  }
}

// ---- State helpers ----

function getTarget(invoker) {
  const id = invoker.getAttribute(ATTR);
  return id ? document.getElementById(id) : null;
}

function getInvoker(target) {
  const data = targetData.get(target);
  if (!data?.invoker) return null;
  const iData = invokerData.get(data.invoker);
  return iData?.state === 'full' ? data.invoker : null;
}

function ensureData(el) {
  if (invokerData.has(el)) return invokerData.get(el);
  const data = { state: 'none', gainedTimer: null, lostTimer: null, longPressTimer: null };
  invokerData.set(el, data);
  const target = getTarget(el);
  if (target) setupAccessibility(el, target);
  return data;
}

// ---- State transitions ----

function gainInterest(invoker, target) {
  if (!invoker || !target || !invoker.isConnected || getTarget(invoker) !== target) return false;

  // Handle existing invoker on this target
  const existing = getInvoker(target);
  if (existing) {
    if (existing === invoker) {
      clearTimeout(invokerData.get(existing).lostTimer);
      return false;
    }
    if (!loseInterest(existing, target)) return false;
    if (!invoker.isConnected || getTarget(invoker) !== target) return false;
  }

  const data = ensureData(invoker);
  if (data.state !== 'none') return false;

  // Dispatch interest event
  const event = new CustomEvent('interest', {
    bubbles: false,
    cancelable: true,
    detail: { source: invoker }
  });
  target.dispatchEvent(event);

  // Show popover if applicable
  if (target.hasAttribute('popover')) {
    try { target.showPopover(); } catch {}
  }

  data.state = 'full';
  if (!targetData.has(target)) targetData.set(target, {});
  const tData = targetData.get(target);
  tData.invoker = invoker;

  // Listen for external close (light dismiss)
  if (target.hasAttribute('popover')) {
    const onToggle = (e) => {
      if (e.newState === 'closed') loseInterest(invoker, target);
    };
    tData.toggleListener = onToggle;
    target.addEventListener('toggle', onToggle);
  }

  activeInvokers.add(invoker);
  invoker.classList.add('interest-source');
  target.classList.add('interest-target');
  if (!isPlainHint(target)) invoker.setAttribute('aria-expanded', 'true');

  return true;
}

function loseInterest(invoker, target) {
  if (!invoker || !target) return false;
  if (getTarget(invoker) !== target) return false;
  if (getInvoker(target) !== invoker) return false;

  const data = invokerData.get(invoker);
  if (!data || data.state === 'none') return false;

  clearTimeout(data.gainedTimer);
  clearTimeout(data.lostTimer);

  // Dispatch loseinterest event
  target.dispatchEvent(new CustomEvent('loseinterest', {
    bubbles: false,
    detail: { source: invoker }
  }));

  if (target.hasAttribute('popover')) {
    try { target.hidePopover(); } catch {}
  }

  const tData = targetData.get(target);
  if (tData?.toggleListener) {
    target.removeEventListener('toggle', tData.toggleListener);
  }
  targetData.delete(target);
  activeInvokers.delete(invoker);
  invoker.classList.remove('interest-source');
  target.classList.remove('interest-target');
  if (!isPlainHint(target)) invoker.setAttribute('aria-expanded', 'false');

  data.state = 'none';
  return true;
}

// ---- Scheduling ----

function scheduleGain(invoker) {
  const data = ensureData(invoker);
  clearTimeout(data.gainedTimer);
  const delay = getDelay(invoker, '--interest-delay-start');
  data.gainedTimer = setTimeout(() => {
    const target = getTarget(invoker);
    if (target) gainInterest(invoker, target);
  }, delay);
}

function scheduleLose(invoker) {
  const data = invokerData.get(invoker);
  if (!data) return;
  clearTimeout(data.lostTimer);
  const delay = getDelay(invoker, '--interest-delay-end');
  data.lostTimer = setTimeout(() => {
    const target = getTarget(invoker);
    if (target) loseInterest(invoker, target);
  }, delay);
}

// ---- Event handling ----

function handleHoverOrFocus(el, gaining) {
  if (touchInProgress) return;
  if (!el.isConnected) return;

  const target = getTarget(el);
  if (!target) {
    // Maybe we're inside a target — keep interest alive
    const containingTarget = el.closest('.interest-target');
    if (containingTarget) {
      const upstream = getInvoker(containingTarget);
      if (upstream) {
        if (gaining) {
          clearTimeout(invokerData.get(upstream)?.lostTimer);
        } else {
          scheduleLose(upstream);
        }
      }
    }
    return;
  }

  const data = ensureData(el);
  const upstream = getInvoker(el);

  if (gaining) {
    clearTimeout(data.lostTimer);
    if (upstream) clearTimeout(invokerData.get(upstream)?.lostTimer);
    scheduleGain(el);
  } else {
    clearTimeout(data.gainedTimer);
    if (data.state !== 'none') scheduleLose(el);
    if (upstream) {
      const uData = invokerData.get(upstream);
      if (uData) clearTimeout(uData.gainedTimer);
      scheduleLose(upstream);
    }
  }
}

function addEventHandlers() {
  const walkUp = (e, gaining) => {
    for (let el = e.target; el; el = el.parentElement) {
      handleHoverOrFocus(el, gaining);
    }
  };

  document.body.addEventListener('mouseover', (e) => walkUp(e, true));
  document.body.addEventListener('mouseout', (e) => walkUp(e, false));
  document.body.addEventListener('focusin', (e) => walkUp(e, true));
  document.body.addEventListener('focusout', (e) => walkUp(e, false));

  document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      for (const invoker of activeInvokers) {
        const target = getTarget(invoker);
        if (target) loseInterest(invoker, target);
      }
    }
  });

  // Touch: long-press on buttons only (not links)
  const longPressTime = 500;
  document.body.addEventListener('touchstart', (e) => {
    touchInProgress = true;
    const invoker = e.target.closest(`button[${ATTR}]`);
    if (!invoker) return;
    const data = ensureData(invoker);
    data.longPressTimer = setTimeout(() => {
      const target = getTarget(invoker);
      if (target) gainInterest(invoker, target);
      data.longPressTimer = null;
    }, longPressTime);
  });
  const cancelLongPress = (e) => {
    const invoker = e.target.closest(`button[${ATTR}]`);
    if (!invoker) return;
    const data = invokerData.get(invoker);
    if (data?.longPressTimer) {
      clearTimeout(data.longPressTimer);
      data.longPressTimer = null;
    }
  };
  document.body.addEventListener('touchend', (e) => {
    cancelLongPress(e);
    touchInProgress = false;
  });
  document.body.addEventListener('touchmove', cancelLongPress);
}

// ---- CSS custom property registration ----

function registerCustomProperties() {
  const style = document.createElement('style');
  style.textContent = [
    '@property --interest-delay-start { syntax: "normal | <time>"; inherits: false; initial-value: normal; }',
    '@property --interest-delay-end { syntax: "normal | <time>"; inherits: false; initial-value: normal; }',
    '@property --interest-delay { syntax: "[ normal | <time> ]{1,2}"; inherits: false; initial-value: normal; }'
  ].join('\n');
  document.head.appendChild(style);
}

// ---- MutationObserver ----

function setupInvoker(el) {
  ensureData(el);
}

function cleanupInvoker(el) {
  const data = invokerData.get(el);
  if (!data) return;
  clearTimeout(data.gainedTimer);
  clearTimeout(data.lostTimer);
  clearTimeout(data.longPressTimer);
  if (data.state !== 'none') {
    const target = getTarget(el);
    if (target) loseInterest(el, target);
  }
  el.classList.remove('interest-source');
  invokerData.delete(el);
  activeInvokers.delete(el);
}

function scanAll(root = document) {
  root.querySelectorAll(`[${ATTR}]`).forEach(setupInvoker);
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.hasAttribute?.(ATTR)) setupInvoker(node);
      node.querySelectorAll?.(`[${ATTR}]`).forEach(setupInvoker);
    }
    for (const node of mutation.removedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (invokerData.has(node)) cleanupInvoker(node);
      node.querySelectorAll?.(`[${ATTR}]`).forEach(el => {
        if (invokerData.has(el)) cleanupInvoker(el);
      });
    }
    if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
      const el = mutation.target;
      if (el.hasAttribute(ATTR)) {
        if (!invokerData.has(el)) setupInvoker(el);
      } else {
        if (invokerData.has(el)) cleanupInvoker(el);
      }
    }
  }
});

// ---- Initialization ----

function initInterest() {
  if (nativeSupported) return; // no-op when native
  scanAll();
}

if (!nativeSupported) {
  registerCustomProperties();
  addEventHandlers();

  // Mark polyfill presence for detection
  document.documentElement.setAttribute('data-interest-polyfill', '');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scanAll();
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [ATTR]
      });
    });
  } else {
    scanAll();
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [ATTR]
    });
  }
}

export { initInterest };
