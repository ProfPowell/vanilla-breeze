/**
 * upload-init: File upload drop zone
 *
 * Wraps a native file input in a drag-and-drop zone with a file list.
 * Without JS the native file input renders as normal.
 *
 * The native input stays the single control: it is stretched transparently
 * over the zone, so clicking anywhere opens the picker and the input keeps
 * the one tab stop (the zone shows its focus ring). Dropped files go through
 * the same `accept` and `multiple` rules as the picker; rejected files are
 * announced in a polite status line. `accept` is only a hint — the server
 * must still validate type and size.
 *
 * Text is localizable with data-label-* on the input: prompt ("Drag a file
 * here or" / "Drag files here or" with `multiple`), browse ("browse"),
 * files ("Selected files"), rejected ("Not accepted: {files}"),
 * single ("Only one file allowed. Kept {file}."). Sizes use Intl with the
 * closest [lang].
 *
 * @attr {string} data-upload - Enable drop zone enhancement
 *
 * @example
 * <input type="file" data-upload accept=".pdf,.doc" multiple>
 */

import { registerInit, onFormReset } from './_init-registry.js';
import { getLocale } from '../lib/i18n.js';

const SELECTOR = 'input[type="file"][data-upload]';

const UPLOAD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;

/** Inputs whose listeners are wired (a clone copies markup, not this). */
const wired = new WeakSet();
let seq = 0;

/**
 * @param {HTMLInputElement} input
 * @param {string} key
 * @param {string} fallback
 */
function labelFor(input, key, fallback) {
  return input.getAttribute(`data-label-${key}`) ?? fallback;
}

/**
 * Format a byte count with Intl unit formatting (decimal units: 1 kB =
 * 1000 B, the meaning Intl's "kilobyte" unit carries).
 * @param {number} bytes
 * @param {string} locale
 * @returns {string}
 */
export function formatBytes(bytes, locale = 'en') {
  const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'];
  let i = 0;
  let n = bytes;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  try {
    return new Intl.NumberFormat(locale, {
      style: 'unit', unit: units[i], unitDisplay: 'short',
      maximumFractionDigits: i > 0 ? 1 : 0,
    }).format(n);
  } catch {
    return `${n.toFixed(i > 0 ? 1 : 0)} ${['B', 'kB', 'MB', 'GB'][i]}`;
  }
}

/**
 * Parse an accept attribute into lower-cased tokens.
 * @param {string} accept
 * @returns {string[]}
 */
function acceptTokens(accept) {
  return accept.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
}

/**
 * Does a file match the input's accept tokens? Same rules the picker uses:
 * `.ext` matches the file-name suffix, `type/*` the MIME family, anything
 * else the exact MIME type. No tokens accepts everything.
 * @param {{name: string, type: string}} file
 * @param {string[]} tokens
 * @returns {boolean}
 */
export function matchesAccept(file, tokens) {
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

/**
 * Human-readable list of accept tokens: ".pdf,.doc" -> "PDF, DOC".
 * @param {string} accept
 */
function acceptHint(accept) {
  return acceptTokens(accept)
    .map(t => (t.startsWith('.') ? t.slice(1) : t).toUpperCase())
    .join(', ');
}

/**
 * Enhance a file input with a drop zone.
 * @param {HTMLInputElement} input
 */
function enhanceUpload(input) {
  if (wired.has(input) || !input.parentNode) return;
  wired.add(input);

  // A cloned zone arrives with its markup but no listeners: reuse it.
  let zone = /** @type {HTMLElement|null} */ (input.parentElement?.classList.contains('upload-zone') ? input.parentElement : null);
  let prompt = zone?.querySelector(':scope > .upload-prompt');
  let fileList = /** @type {HTMLUListElement|null} */ (zone?.querySelector(':scope > .upload-file-list'));
  let status = zone?.querySelector(':scope > .upload-status');

  if (!zone || !prompt || !fileList || !status) {
    zone?.querySelectorAll(':scope > :not(input)').forEach(n => n.remove());
    if (!zone) {
      zone = document.createElement('div');
      zone.className = 'upload-zone';
      input.parentNode.insertBefore(zone, input);
      zone.appendChild(input);
    }

    const id = `upload-${++seq}`;
    prompt = document.createElement('p');
    prompt.className = 'upload-prompt';
    prompt.id = `${id}-prompt`;
    prompt.insertAdjacentHTML('afterbegin', UPLOAD_ICON);

    const text = document.createElement('span');
    const defaultPrompt = input.multiple ? 'Drag files here or' : 'Drag a file here or';
    text.append(`${labelFor(input, 'prompt', defaultPrompt)} `);
    // Visual cue only: the transparent input over the zone is what is
    // clicked and focused, so this is not a second control.
    const browse = document.createElement('span');
    browse.className = 'upload-browse';
    browse.textContent = labelFor(input, 'browse', 'browse');
    text.append(browse);
    prompt.append(text);

    const accept = input.getAttribute('accept') || '';
    if (accept) {
      const small = document.createElement('small');
      small.textContent = acceptHint(accept);
      prompt.append(small);
    }

    fileList = document.createElement('ul');
    fileList.className = 'upload-file-list';
    fileList.hidden = true;
    fileList.setAttribute('aria-label', labelFor(input, 'files', 'Selected files'));

    status = document.createElement('p');
    status.className = 'upload-status';
    status.setAttribute('role', 'status');

    zone.append(prompt, fileList, status);

    // The prompt (and the accepted types) describe the input.
    const described = new Set((input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
    described.add(prompt.id);
    input.setAttribute('aria-describedby', [...described].join(' '));
  }

  const list = /** @type {HTMLUListElement} */ (fileList);
  const statusEl = /** @type {HTMLElement} */ (status);
  const zoneEl = /** @type {HTMLElement} */ (zone);

  function render() {
    list.replaceChildren();
    const files = Array.from(input.files ?? []);
    list.hidden = files.length === 0;
    const locale = getLocale(input);
    for (const file of files) {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.className = 'upload-file-name';
      name.textContent = file.name;
      const size = document.createElement('span');
      size.className = 'upload-file-size';
      size.textContent = formatBytes(file.size, locale);
      li.append(name, size);
      list.append(li);
    }
  }

  // Drag and drop
  let dragCounter = 0;

  zoneEl.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    zoneEl.dataset.dragover = '';
  });

  zoneEl.addEventListener('dragleave', () => {
    dragCounter = Math.max(0, dragCounter - 1);
    if (dragCounter === 0) delete zoneEl.dataset.dragover;
  });

  zoneEl.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  zoneEl.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    delete zoneEl.dataset.dragover;
    if (input.disabled) return;

    const dropped = Array.from(e.dataTransfer?.files ?? []);
    if (!dropped.length) return;

    const tokens = acceptTokens(input.getAttribute('accept') || '');
    const accepted = dropped.filter(f => matchesAccept(f, tokens));
    const rejected = dropped.filter(f => !accepted.includes(f));
    const messages = [];

    if (rejected.length) {
      messages.push(labelFor(input, 'rejected', 'Not accepted: {files}')
        .replace('{files}', rejected.map(f => f.name).join(', ')));
    }
    if (!input.multiple && accepted.length > 1) {
      accepted.length = 1;
      messages.push(labelFor(input, 'single', 'Only one file allowed. Kept {file}.')
        .replace('{file}', accepted[0].name));
    }
    statusEl.textContent = messages.join(' ');

    // Nothing usable: keep the current selection.
    if (!accepted.length) return;

    const dt = new DataTransfer();
    accepted.forEach(f => dt.items.add(f));
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // A picker choice starts fresh; a drop sets its own status before change.
  input.addEventListener('click', () => { statusEl.textContent = ''; });
  input.addEventListener('change', render);

  onFormReset(input, () => {
    statusEl.textContent = '';
    render();
  });

  render();
}

/**
 * Initialize upload zones within a root
 * @param {Element|Document} root
 */
function initUploadZones(root = document) {
  root.querySelectorAll(SELECTOR).forEach(el => enhanceUpload(/** @type {HTMLInputElement} */ (el)));
}

registerInit(SELECTOR, enhanceUpload);

export { initUploadZones };
