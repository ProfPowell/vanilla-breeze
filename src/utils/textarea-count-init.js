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
 *
 * @example Character count (uses native maxlength)
 * <textarea maxlength="500" data-count></textarea>
 *
 * @example Word count
 * <textarea data-count="words" data-maxwords="200"></textarea>
 */

import { registerInit } from './_init-registry.js';

const SELECTOR = 'textarea[data-count]';
const ANNOUNCE_DELAY = 700;
let counterSeq = 0;

/**
 * Enhance a textarea with a live counter
 * @param {HTMLTextAreaElement} textarea
 */
const DEFAULT_LABELS = {
  characters: { one: '{count} character', other: '{count} characters' },
  words: { one: '{count} word', other: '{count} words' },
};

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
  const lang = textarea.closest('[lang]')?.getAttribute('lang') || navigator.language;
  let category = 'other';
  try { category = new Intl.PluralRules(lang).select(count); } catch { /* invalid lang */ }
  const template = textarea.getAttribute(`data-label-${kind}-${category}`)
    ?? textarea.getAttribute(`data-label-${kind}`)
    ?? DEFAULT_LABELS[kind][category === 'one' ? 'one' : 'other'];
  return template.replaceAll('{count}', new Intl.NumberFormat(lang).format(count));
}

function enhanceTextarea(textarea) {
  if (textarea.hasAttribute('data-count-init')) return;
  textarea.setAttribute('data-count-init', '');

  const isWordMode = textarea.dataset.count === 'words';
  const max = isWordMode
    ? parseInt(textarea.dataset.maxwords ?? '0', 10) || 0
    : textarea.maxLength > 0 ? textarea.maxLength : 0;

  // Visible counter: not a live region (an <output> is role=status, which
  // would announce every keystroke). It describes the textarea instead.
  const counter = document.createElement('output');
  counter.className = 'textarea-counter';
  counter.id = `${textarea.id || `textarea-${++counterSeq}`}-count`;
  counter.setAttribute('aria-live', 'off');

  // Announcements: only near/over the limit, after the typing pauses.
  const live = document.createElement('span');
  live.className = 'visually-hidden';
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');

  // Insert after textarea (or after form-field's existing outputs)
  const formField = textarea.closest('form-field');
  if (formField) {
    formField.append(counter, live);
  } else {
    textarea.insertAdjacentElement('afterend', counter);
    counter.insertAdjacentElement('afterend', live);
  }

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
      counter.textContent = `${current} / ${max}`;
      const ratio = current / max;
      counter.dataset.state =
        ratio >= 1 ? 'error' :
        ratio >= 0.8 ? 'warning' : '';
    } else {
      counter.textContent = countLabel(textarea, isWordMode, current);
      counter.dataset.state = '';
    }

    clearTimeout(timer);
    if (counter.dataset.state) {
      const text = counter.textContent;
      timer = setTimeout(() => { live.textContent = text; }, ANNOUNCE_DELAY);
    } else {
      live.textContent = '';
    }
  }

  textarea.addEventListener('input', update);
  update();
}

/**
 * Initialize counters within a root
 * @param {Element|Document} root
 */
function initTextareaCounts(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceTextarea);
}

registerInit(SELECTOR, enhanceTextarea);

export { initTextareaCounts };
