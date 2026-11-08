/**
 * spoiler-init: Content concealment via data attributes
 *
 * Enhances elements with data-spoiler to hide their content behind
 * a blur, solid, or noise overlay. Click or keyboard to reveal.
 * Works on any HTML element — block or inline.
 *
 * Structure: the host's children move into a generated
 * [data-spoiler-content] wrapper (a <span> unless the host accepts flow
 * content, so <p>, headings and inline hosts stay valid), followed by a
 * <button data-spoiler-trigger> overlay. Revealing replaces the trigger
 * with a <button data-spoiler-hide> and moves focus to the revealed
 * content. Clicks are handled by one delegated listener, so cloned or
 * saved-and-restored spoilers keep working.
 *
 * The host keeps its own semantics: role="group" + a label are added only
 * to a generic host (<div>/<span>) that has no role or label of its own.
 *
 * @attr {string} data-spoiler - Effect type: "" | "blur" | "solid" | "noise" (default: blur)
 * @attr {string} data-spoiler-label - Reveal button text for this spoiler (default: "Reveal spoiler")
 * @attr {boolean} data-spoiler-persist - One-way reveal, no re-hide
 * @attr {string} data-spoiler-group - Mutual exclusion group name
 * @attr {string} data-spoiler-print - "hidden" keeps the spoiler concealed when printed (default: printed revealed)
 * @attr {string} data-label-spoiler-reveal - Reveal text for every spoiler inside (element or ancestor)
 * @attr {string} data-label-spoiler-hide - Hide button text (default "Hide spoiler")
 * @attr {string} data-label-spoiler - Group name on generic hosts (default "Spoiler")
 * @attr {string} data-label-spoiler-revealed - Announcement on reveal (default "Spoiler revealed")
 *
 * @fires spoiler:toggle - detail { visible }
 *
 * @example Block spoiler
 * <section data-spoiler>Darth Vader is Luke's father.</section>
 *
 * @example Inline spoiler
 * <p>The movie ends when <span data-spoiler>the hero dies</span>.</p>
 */

import { registerInit } from './_init-registry.js';
import { announce, readLabel } from '../lib/announce.js';

const SELECTOR = '[data-spoiler]';
const ENHANCED = new WeakSet();

/** Hosts whose content model accepts flow content: the wrapper is a <div>. */
const FLOW_HOSTS = new Set([
  'DIV', 'SECTION', 'ARTICLE', 'ASIDE', 'MAIN', 'HEADER', 'FOOTER', 'NAV',
  'LI', 'DD', 'TD', 'TH', 'BLOCKQUOTE', 'FIGURE', 'FIGCAPTION', 'DETAILS',
  'DIALOG', 'FORM', 'FIELDSET', 'ADDRESS',
]);

/** @param {Element} el */
function acceptsFlow(el) {
  return FLOW_HOSTS.has(el.tagName) || el.localName.includes('-');
}

/**
 * Initialize spoiler elements within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initSpoilers(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceSpoiler);
}

/** @param {Element} el */
function revealText(el) {
  return el.getAttribute('data-spoiler-label') || readLabel(el, 'spoiler-reveal', 'Reveal spoiler');
}

/**
 * Enhance a single element with spoiler behavior
 * @param {Element} el - The element to enhance
 */
function enhanceSpoiler(el) {
  if (ENHANCED.has(el)) return;
  ENHANCED.add(el);

  if (!el.getAttribute('data-spoiler')) el.setAttribute('data-spoiler', 'blur');

  // A clone or saved snapshot already carries the generated structure:
  // the delegated listeners serve it, nothing to rebuild.
  if (el.querySelector(':scope > [data-spoiler-content]')) {
    el.setAttribute('data-spoiler-init', '');
    return;
  }

  // Name the host only when it is a generic container without semantics.
  if ((el.tagName === 'DIV' || el.tagName === 'SPAN')
    && !el.hasAttribute('role') && !el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby')) {
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', readLabel(el, 'spoiler', 'Spoiler'));
  }

  const content = document.createElement(acceptsFlow(el) ? 'div' : 'span');
  content.setAttribute('data-spoiler-content', '');
  content.setAttribute('inert', '');
  content.tabIndex = -1;
  while (el.firstChild) content.appendChild(el.firstChild);
  el.appendChild(content);

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.setAttribute('data-spoiler-trigger', '');
  trigger.setAttribute('aria-expanded', 'false');
  const labelSpan = document.createElement('span');
  labelSpan.setAttribute('data-spoiler-label', '');
  labelSpan.textContent = revealText(el);
  trigger.appendChild(labelSpan);
  el.appendChild(trigger);

  // Set last: the CSS hook, applied once the structure exists.
  el.setAttribute('data-spoiler-init', '');
}

/**
 * Reveal a spoiler element
 * @param {Element} el - The spoiler host element
 */
function reveal(el) {
  if (el.hasAttribute('data-spoiler-visible')) return;
  const group = el.getAttribute('data-spoiler-group');
  if (group) {
    document.querySelectorAll(`[data-spoiler-group="${CSS.escape(group)}"][data-spoiler-visible]`).forEach((other) => {
      if (other !== el) conceal(other, { restoreFocus: false });
    });
  }

  const content = /** @type {HTMLElement | null} */ (el.querySelector(':scope > [data-spoiler-content]'));
  const trigger = /** @type {HTMLElement | null} */ (el.querySelector(':scope > [data-spoiler-trigger]'));
  const hadFocus = !!trigger && (document.activeElement === trigger || trigger.contains(document.activeElement));

  if (content) content.removeAttribute('inert');
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'true');
    trigger.hidden = true;
  }
  el.setAttribute('data-spoiler-visible', '');

  if (!el.hasAttribute('data-spoiler-persist') && !el.querySelector(':scope > [data-spoiler-hide]')) {
    const hideBtn = document.createElement('button');
    hideBtn.type = 'button';
    hideBtn.setAttribute('data-spoiler-hide', '');
    hideBtn.textContent = readLabel(el, 'spoiler-hide', 'Hide spoiler');
    el.appendChild(hideBtn);
  }

  // The trigger just disappeared: keep keyboard users where they were by
  // moving focus to the revealed content (read next by screen readers).
  if (hadFocus && content) content.focus({ preventScroll: true });

  announce(readLabel(el, 'spoiler-revealed', 'Spoiler revealed'));

  el.dispatchEvent(new CustomEvent('spoiler:toggle', {
    bubbles: true,
    detail: { visible: true }
  }));
}

/**
 * Conceal a spoiler element
 * @param {Element} el - The spoiler host element
 * @param {{ restoreFocus?: boolean }} [options]
 */
function conceal(el, { restoreFocus = true } = {}) {
  if (el.hasAttribute('data-spoiler-persist')) return;
  if (!el.hasAttribute('data-spoiler-visible')) return;

  const content = el.querySelector(':scope > [data-spoiler-content]');
  const trigger = /** @type {HTMLElement | null} */ (el.querySelector(':scope > [data-spoiler-trigger]'));
  const hideBtn = el.querySelector(':scope > [data-spoiler-hide]');
  const hadFocus = el.contains(document.activeElement);

  if (content) content.setAttribute('inert', '');
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'false');
    trigger.hidden = false;
    if (restoreFocus && hadFocus) trigger.focus();
  }
  if (hideBtn) hideBtn.remove();
  el.removeAttribute('data-spoiler-visible');

  el.dispatchEvent(new CustomEvent('spoiler:toggle', {
    bubbles: true,
    detail: { visible: false }
  }));
}

/** @param {MouseEvent} event */
function onClick(event) {
  const target = /** @type {Element} */ (event.target);
  const control = target?.closest?.('[data-spoiler-trigger], [data-spoiler-hide]');
  if (!control) return;
  const host = control.parentElement;
  if (!host?.matches(SELECTOR)) return;
  enhanceSpoiler(host);
  if (control.hasAttribute('data-spoiler-trigger')) reveal(host);
  else conceal(host);
}

/** @param {KeyboardEvent} event */
function onKeydown(event) {
  if (event.key !== 'Escape') return;
  const host = /** @type {Element} */ (event.target)?.closest?.('[data-spoiler][data-spoiler-visible]');
  if (!host || host.hasAttribute('data-spoiler-persist')) return;
  event.stopPropagation();
  conceal(host);
}

if (typeof document !== 'undefined' && !(/** @type {any} */ (document).__vbSpoilerDelegated)) {
  /** @type {any} */ (document).__vbSpoilerDelegated = true;
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeydown);
}

registerInit(SELECTOR, enhanceSpoiler);

export { initSpoilers, reveal as revealSpoiler, conceal as concealSpoiler };
