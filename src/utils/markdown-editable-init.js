/**
 * markdown-editable-init: Inline markdown editing via data attribute
 *
 * Drop `data-markdown-editable` on any element to enable inline markdown editing.
 * On focus, the element shows raw markdown. On blur, it renders to formatted HTML.
 *
 * For contenteditable elements (div, p, span, li, etc.):
 *   - Sets contentEditable="true"
 *   - Stores raw markdown in dataset.markdownValue
 *   - Toggles between raw/rendered on focus/blur
 *
 * For textarea/input elements:
 *   - Creates a sibling <output> preview (or uses data-preview="id")
 *   - Preview updates on blur
 *   - .value stays as raw markdown
 *
 * @fires markdown-editable:change - On blur after content changes. Detail: { value, html }
 *
 * @example
 * <p data-markdown-editable>Type **bold** and *italic* here</p>
 * <textarea data-markdown-editable>Write **markdown** here</textarea>
 */

import { registerInit } from './_init-registry.js';
import { marked } from 'marked';
import { sanitizeHTML } from '../lib/sanitize-html.js';

const SELECTOR = '[data-markdown-editable]';

/** Parse inline markdown and sanitize the output. */
function renderInline(md) {
  if (!md.trim()) return '';
  return sanitizeHTML(marked.parseInline(md, { gfm: true }));
}

/** Emit the change event with both raw and rendered values. */
function emitChange(el, value, html) {
  el.dispatchEvent(new CustomEvent('markdown-editable:change', {
    bubbles: true,
    detail: { value, html },
  }));
}

// ── Contenteditable path ────────────────────────────────────

function enhanceContentEditable(el) {
  el.contentEditable = 'true';
  el.setAttribute('role', 'textbox');
  el.setAttribute('aria-multiline', 'false');

  // Store initial raw value and render it
  const initial = el.textContent.trim();
  el.dataset.markdownValue = initial;
  if (initial) {
    el.innerHTML = renderInline(initial);
  }

  let composing = false;

  el.addEventListener('compositionstart', () => { composing = true; });
  el.addEventListener('compositionend', () => { composing = false; });

  el.addEventListener('focus', () => {
    if (composing) return;
    // Switch to raw markdown for editing
    const raw = el.dataset.markdownValue || '';
    el.textContent = raw;
    el.setAttribute('data-md-editing', '');

    // Place cursor at end
    requestAnimationFrame(() => {
      const sel = window.getSelection();
      if (sel && el.childNodes.length) {
        sel.collapse(el.childNodes[el.childNodes.length - 1], el.textContent.length);
      }
    });
  });

  el.addEventListener('blur', () => {
    if (composing) return;
    const raw = el.textContent.trim();
    const prev = el.dataset.markdownValue;
    el.dataset.markdownValue = raw;
    el.removeAttribute('data-md-editing');

    if (raw) {
      el.innerHTML = renderInline(raw);
    } else {
      el.textContent = '';
    }

    if (raw !== prev) {
      emitChange(el, raw, el.innerHTML);
    }
  });
}

// ── Textarea path ───────────────────────────────────────────

function enhanceTextarea(el) {
  // Find existing preview or create one
  let preview = el.dataset.preview
    ? document.getElementById(el.dataset.preview)
    : null;

  if (!preview) {
    preview = document.createElement('output');
    preview.className = 'md-editable-preview';
    preview.setAttribute('aria-label', 'Markdown preview');
    el.after(preview);
  }

  function renderPreview() {
    const html = renderInline(el.value);
    preview.innerHTML = html;
    return html;
  }

  el.addEventListener('blur', () => {
    const html = renderPreview();
    emitChange(el, el.value, html);
  });

  // Initial render if content exists
  if (el.value.trim()) renderPreview();
}

// ── Enhance dispatcher ──────────────────────────────────────

function enhance(el) {
  if (el.hasAttribute('data-markdown-editable-init')) return;
  el.setAttribute('data-markdown-editable-init', '');

  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'INPUT') {
    enhanceTextarea(el);
  } else {
    enhanceContentEditable(el);
  }
}

registerInit(SELECTOR, enhance);
