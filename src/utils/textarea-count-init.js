/**
 * textarea-count-init: Character/word counter for textareas
 *
 * Shows a count below the textarea. Uses maxlength for character mode,
 * data-maxwords for word mode. Color shifts at 80% (warning) and 100% (error).
 * The counter is linked to the textarea with aria-describedby; screen
 * readers only hear it announced near/over the limit, once typing pauses.
 *
 * @attr {string} data-count - Enable counter. "words" for word mode, empty for character mode.
 * @attr {number} data-maxwords - Max word count (word mode only)
 * @attr {string} data-label-characters - Count text template for unlimited character counters, {count} replaced; plural variants data-label-characters-one|-other|… (Intl.PluralRules)
 * @attr {string} data-label-words - Same for word mode
 * @attr {string} data-label-limit - Count text template when a limit applies, {count} and {max} replaced (default "{count} of {max} characters" / "{count} of {max} words"); plural variants data-label-limit-one|-other|… select on {max}
 *
 * Refreshes on input and after the owning form resets. Script that sets
 * `.value` should dispatch an input event afterwards
 * (`ta.dispatchEvent(new Event('input', { bubbles: true }))`).
 * Word mode splits on whitespace, so unspaced scripts (Chinese, Japanese,
 * Thai) count a whole run as one word; the word limit is advisory only
 * (no validity state) — use maxlength for a hard limit.
 *
 * @example Character count (uses native maxlength)
 * <textarea maxlength="500" data-count></textarea>
 *
 * @example Word count
 * <textarea data-count="words" data-maxwords="200"></textarea>
 */

import { registerInit, onFormReset } from './_init-registry.js';

const SELECTOR = 'textarea[data-count]';
const ANNOUNCE_DELAY = 700;
let counterSeq = 0;

const DEFAULT_LABELS = {
  characters: { one: '{count} character', other: '{count} characters' },
  words: { one: '{count} word', other: '{count} words' },
};

const DEFAULT_LIMIT_LABELS = {
  characters: { one: '{count} of {max} character', other: '{count} of {max} characters' },
  words: { one: '{count} of {max} word', other: '{count} of {max} words' },
};

/** @param {Element} el */
function langOf(el) {
  return el.closest('[lang]')?.getAttribute('lang') || navigator.language;
}

/**
 * @param {string} lang
 * @param {number} n
 */
function pluralCategory(lang, n) {
  try { return new Intl.PluralRules(lang).select(n); } catch { return 'other'; }
}

/**
 * @param {string} lang
 * @param {number} n
 */
function formatNumber(lang, n) {
  try { return new Intl.NumberFormat(lang).format(n); } catch { return String(n); }
}

/**
 * Count text for limited counters: "{count} of {max} characters". The noun
 * agrees with {max}. Override with data-label-limit-<category> /
 * data-label-limit.
 * @param {HTMLTextAreaElement} textarea
 * @param {boolean} words
 * @param {number} count
 * @param {number} max
 */
function limitLabel(textarea, words, count, max) {
  const kind = words ? 'words' : 'characters';
  const lang = langOf(textarea);
  const category = pluralCategory(lang, max);
  const template = textarea.getAttribute(`data-label-limit-${category}`)
    ?? textarea.getAttribute('data-label-limit')
    ?? DEFAULT_LIMIT_LABELS[kind][category === 'one' ? 'one' : 'other'];
  return template
    .replaceAll('{count}', formatNumber(lang, count))
    .replaceAll('{max}', formatNumber(lang, max));
}

/**
 * Localizable count text for unlimited counters. Override per textarea with
 * data-label-characters-<plural category> / data-label-words-<category>
 * (categories from Intl.PluralRules for the nearest lang: zero, one, two,
 * few, many, other), falling back to data-label-characters /
 * data-label-words, then English. {count} is replaced.
 * @param {HTMLTextAreaElement} textarea
 * @param {boolean} words
 * @param {number} count
 */
function countLabel(textarea, words, count) {
  const kind = words ? 'words' : 'characters';
  const lang = langOf(textarea);
  const category = pluralCategory(lang, count);
  const template = textarea.getAttribute(`data-label-${kind}-${category}`)
    ?? textarea.getAttribute(`data-label-${kind}`)
    ?? DEFAULT_LABELS[kind][category === 'one' ? 'one' : 'other'];
  return template.replaceAll('{count}', formatNumber(lang, count));
}

/**
 * Enhance a textarea with a live counter
 * @param {HTMLTextAreaElement} textarea
 */
function enhanceTextarea(textarea) {
  // The attribute flag is cloned with the element, so the WeakMap is the
  // real guard: a clone (cloneNode, template, innerHTML round-trip) carries
  // data-count-init but is not wired yet.
  if (updaters.has(textarea)) return;
  const stale = textarea.hasAttribute('data-count-init');
  textarea.setAttribute('data-count-init', '');

  const isWordMode = textarea.dataset.count === 'words';
  const max = isWordMode
    ? parseInt(textarea.dataset.maxwords ?? '0', 10) || 0
    : textarea.maxLength > 0 ? textarea.maxLength : 0;

  const formField = textarea.closest('form-field');

  // A clone may have brought its source's counter along: adopt it rather
  // than adding a second one, and drop the copied id from aria-describedby.
  /** @type {HTMLOutputElement | null} */
  let counter = null;
  /** @type {HTMLElement | null} */
  let live = null;
  if (stale) {
    const candidate = formField
      ? formField.querySelector(':scope > output.textarea-counter')
      : textarea.nextElementSibling;
    if (candidate?.matches('output.textarea-counter') && !owners.has(candidate)) {
      counter = /** @type {HTMLOutputElement} */ (candidate);
      const next = counter.nextElementSibling;
      if (next?.matches('span.visually-hidden[aria-live="polite"]')) live = /** @type {HTMLElement} */ (next);
      const oldId = counter.id;
      const ids = (textarea.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((id) => id && id !== oldId);
      if (ids.length) textarea.setAttribute('aria-describedby', ids.join(' '));
      else textarea.removeAttribute('aria-describedby');
    }
  }

  // Visible counter: not a live region (an <output> is role=status, which
  // would announce every keystroke). It describes the textarea instead.
  if (!counter) {
    counter = document.createElement('output');
    counter.className = 'textarea-counter';
    counter.setAttribute('aria-live', 'off');
    // Insert after textarea (or after form-field's existing outputs)
    if (formField) formField.append(counter);
    else textarea.insertAdjacentElement('afterend', counter);
  }
  counter.id = `${textarea.id || `textarea-${++counterSeq}`}-count`;
  if (document.getElementById(counter.id) !== counter) counter.id = `textarea-${++counterSeq}-count`;
  owners.add(counter);

  // Announcements: only near/over the limit, after the typing pauses.
  if (!live) {
    live = document.createElement('span');
    live.className = 'visually-hidden';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    counter.insertAdjacentElement('afterend', live);
  }
  const liveRegion = live;
  const out = counter;

  const describedBy = (textarea.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  if (!describedBy.includes(counter.id)) {
    textarea.setAttribute('aria-describedby', [...describedBy, counter.id].join(' '));
  }

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  function update() {
    const value = textarea.value;
    const current = isWordMode
      ? (value.trim() ? value.trim().split(/\s+/).length : 0)
      : value.length;

    if (max > 0) {
      out.textContent = limitLabel(textarea, isWordMode, current, max);
      const ratio = current / max;
      out.dataset.state =
        ratio >= 1 ? 'error' :
        ratio >= 0.8 ? 'warning' : '';
    } else {
      out.textContent = countLabel(textarea, isWordMode, current);
      out.dataset.state = '';
    }

    clearTimeout(timer);
    if (out.dataset.state) {
      const text = out.textContent;
      timer = setTimeout(() => { liveRegion.textContent = text; }, ANNOUNCE_DELAY);
    } else {
      liveRegion.textContent = '';
    }
  }

  updaters.set(textarea, update);
  textarea.addEventListener('input', update);
  // Form reset restores the default value without an input event.
  onFormReset(textarea, update);
  update();
}

/** @type {WeakMap<HTMLTextAreaElement, () => void>} */
const updaters = new WeakMap();

/** Counters wired to a textarea (lets a clone tell its copied counter apart). */
/** @type {WeakSet<Element>} */
const owners = new WeakSet();

/**
 * Initialize counters within a root
 * @param {Element|Document} root
 */
function initTextareaCounts(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceTextarea);
}

registerInit(SELECTOR, enhanceTextarea);

export { initTextareaCounts };
