/**
 * foot-notes: Progressive enhancement for footnotes
 *
 * Two elements work together:
 * - <foot-note>: Inline note that degrades to parenthetical text
 * - <foot-notes>: Container that collects and displays the notes
 *
 * Usage:
 *   <p>Some text<foot-note id="n-web">This is a footnote</foot-note> continues.</p>
 *   <p>Cited again<foot-note data-ref="n-web"></foot-note>.</p>
 *   <foot-notes></foot-notes>
 *
 * Without JS: notes appear inline in parentheses.
 * With JS: each <foot-note> becomes a superscript doc-noteref link named
 * "Footnote N"; its content NODES are moved (not copied) into an <li> inside a
 * labelled doc-endnotes section, with doc-backlink links back to every
 * reference (a, b, … when one note is cited several times). Hovering or
 * keyboard-focusing a reference shows a non-interactive preview popover.
 *
 * Teardown restores the authored markup, so a reconnect (or a data-label-*
 * / data-mode change) re-renders from document order and new <foot-note>s
 * inserted meanwhile are numbered in place.
 *
 * @attr {string} data-mode - "sidenotes" places notes in the margin
 * @attr {string} data-label-back - backlink accessible name (default "Back to content")
 * @attr {string} data-label-ref - reference accessible name, {n} = number (default "Footnote {n}")
 * @attr {string} data-label-heading - visually hidden list heading (default "Notes")
 * @attr {string} data-preview - "false" disables the hover/focus preview
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { fragmentClick } from '../_shared/fragment-link.js';

const DEFAULT_BACK = 'Back to content';
const DEFAULT_REF = 'Footnote {n}';
const DEFAULT_HEADING = 'Notes';
/** ↩ forced to text presentation (U+FE0E) so it never renders as an emoji. */
const BACK_GLYPH = '↩︎';
const SHOW_DELAY = 120;
const HIDE_DELAY = 150;

/**
 * @typedef {object} Note
 * @property {HTMLElement} source - the <foot-note> whose content is the note
 * @property {number} num
 * @property {string} noteId
 * @property {HTMLElement[]} refs - every <foot-note> citing this note (source first in doc order)
 * @property {Node[]} content - the moved content nodes
 * @property {boolean} side - rendered as a sidenote aside
 */

/** @param {number} i */
const letter = (i) => String.fromCharCode(97 + (i % 26)) + (i >= 26 ? String(Math.floor(i / 26)) : '');

class FootNotes extends VBElement {
  static observedAttributes = ['data-mode', 'data-label-back', 'data-label-ref', 'data-label-heading', 'data-preview'];
  static #instanceCount = 0;
  #instanceId = 0;
  /** @type {{ ref: HTMLElement, original: Node[] }[]} */
  #records = [];
  /** @type {Element[]} */
  #generated = [];
  /** @type {{ el: Element, id: string } | null} */
  #headingId = null;
  #hidSelf = false;
  /** @type {HTMLElement | null} */
  #preview = null;
  /** @type {HTMLAnchorElement | null} */
  #previewLink = null;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #showTimer;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #hideTimer;

  attributeChangedCallback(_name, oldValue, newValue) {
    if (oldValue === newValue || !this.hasAttribute('data-upgraded')) return;
    this._reinit();
  }

  setup() {
    // Stable across reconnects so generated ids (fn-1-1) do not drift.
    if (!this.#instanceId) this.#instanceId = ++FootNotes.#instanceCount;

    // Backlinks are relative "#id" hrefs — keep them on-page under <base href>.
    this.listen(this, 'click', fragmentClick);
    this.listen(document, 'keydown', (e) => {
      if (/** @type {KeyboardEvent} */ (e).key === 'Escape' && this.#preview?.matches(':popover-open')) {
        this.#hidePreview();
      }
    });

    const notes = this.#groupNotes(this.#collectRefs());
    if (notes.length === 0) return;

    const sidenotes = this.getAttribute('data-mode') === 'sidenotes';
    for (const note of notes) {
      note.side = sidenotes && note.source.getAttribute('data-side') !== 'false';
      this.#detach(note);
    }

    const listed = notes.filter((n) => !n.side);
    for (const note of notes) {
      if (note.side) this.#renderSidenote(note);
      note.refs.forEach((ref, i) => this.#enhanceRef(ref, note, i));
    }

    if (listed.length) {
      this.#renderList(listed);
    } else if (!this.hidden) {
      this.hidden = true;
      this.#hidSelf = true;
    }
  }

  teardown() {
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
    this.#hidePreview();
    // Put the authored content back (moved nodes keep their listeners).
    for (const { ref, original } of this.#records) {
      ref.replaceChildren(...original);
      ref.removeAttribute('data-enhanced');
    }
    this.#records = [];
    for (const el of this.#generated) el.remove();
    this.#generated = [];
    this.#preview = null;
    this.#previewLink = null;
    if (this.#headingId) {
      this.#headingId.el.removeAttribute('id');
      this.#headingId = null;
    }
    if (this.#hidSelf) {
      this.hidden = false;
      this.#hidSelf = false;
    }
  }

  // ── Collection ────────────────────────────────────────

  /** <foot-note>s before this element not claimed by another <foot-notes>. */
  #collectRefs() {
    return /** @type {HTMLElement[]} */ ([...document.querySelectorAll('foot-note:not([data-enhanced])')])
      .filter((ref) => this.compareDocumentPosition(ref) & Node.DOCUMENT_POSITION_PRECEDING);
  }

  /**
   * Group references into notes. `<foot-note data-ref="id">` cites the
   * <foot-note id="id"> collected by this container; notes are numbered by
   * their first citation in document order.
   * @param {HTMLElement[]} refs
   * @returns {Note[]}
   */
  #groupNotes(refs) {
    const pool = new Set(refs);
    /** @type {Map<HTMLElement, Note>} */
    const bySource = new Map();
    /** @type {Note[]} */
    const notes = [];
    for (const ref of refs) {
      let source = ref;
      const key = ref.getAttribute('data-ref');
      if (key) {
        const target = /** @type {HTMLElement | null} */ (document.getElementById(key));
        if (target && pool.has(target) && !target.hasAttribute('data-ref')) {
          source = target;
        } else {
          console.warn(`[foot-notes] data-ref="${key}" does not name a <foot-note> collected by this <foot-notes>; rendering it as its own note.`);
        }
      }
      let note = bySource.get(source);
      if (!note) {
        const num = notes.length + 1;
        note = { source, num, noteId: `fn-${this.#instanceId}-${num}`, refs: [], content: [], side: false };
        bySource.set(source, note);
        notes.push(note);
      }
      note.refs.push(ref);
    }
    return notes;
  }

  /** Lift the authored children out of every reference of a note. */
  #detach(/** @type {Note} */ note) {
    const sources = new Set([note.source, ...note.refs]);
    for (const ref of sources) {
      const original = [...ref.childNodes];
      this.#records.push({ ref, original });
      if (ref === note.source) note.content = original;
      ref.replaceChildren();
    }
  }

  // ── Rendering ─────────────────────────────────────────

  #label(/** @type {string} */ name, /** @type {string} */ fallback) {
    return this.getAttribute(name) || fallback;
  }

  /**
   * @param {HTMLElement} ref
   * @param {Note} note
   * @param {number} index - citation index within the note (0 = first)
   */
  #enhanceRef(ref, note, index) {
    const link = document.createElement('a');
    link.id = this.#refId(note, index);
    link.href = `#${note.noteId}`;
    link.setAttribute('role', 'doc-noteref');
    link.setAttribute('aria-label', this.#label('data-label-ref', DEFAULT_REF).replaceAll('{n}', String(note.num)));
    link.textContent = String(note.num);

    ref.setAttribute('data-enhanced', '');
    if (note.side && ref === note.source) {
      // Sidenote aside follows its first reference.
      ref.prepend(link);
    } else {
      ref.append(link);
    }

    this.listen(link, 'click', (e) => {
      this.#hidePreview();
      fragmentClick(e);
    });
    if (!note.side && this.getAttribute('data-preview') !== 'false') this.#wirePreview(link, note);
  }

  /**
   * @param {Note} note
   * @param {number} index
   */
  #refId(note, index) {
    const base = `fnref-${this.#instanceId}-${note.num}`;
    return index === 0 ? base : `${base}-${letter(index)}`;
  }

  #renderSidenote(/** @type {Note} */ note) {
    const aside = document.createElement('aside');
    aside.className = 'sidenote';
    aside.id = note.noteId;
    aside.setAttribute('role', 'note');
    const number = document.createElement('span');
    number.className = 'sidenote-number';
    number.textContent = `${note.num}.`;
    aside.append(number, ' ', ...note.content);
    note.source.append(aside);
  }

  #renderList(/** @type {Note[]} */ notes) {
    const section = document.createElement('section');
    section.setAttribute('role', 'doc-endnotes');

    // An authored heading child labels the list; otherwise generate a
    // visually hidden one.
    const authored = this.querySelector(':scope > :is(h1, h2, h3, h4, h5, h6)');
    if (authored) {
      if (!authored.id) {
        authored.id = `fnh-${this.#instanceId}`;
        this.#headingId = { el: authored, id: authored.id };
      }
      section.setAttribute('aria-labelledby', authored.id);
    } else {
      const h = document.createElement('h2');
      h.id = `fnh-${this.#instanceId}`;
      h.className = 'visually-hidden';
      h.textContent = this.#label('data-label-heading', DEFAULT_HEADING);
      section.setAttribute('aria-labelledby', h.id);
      section.append(h);
    }

    const ol = document.createElement('ol');
    for (const note of notes) ol.append(this.#createItem(note));
    section.append(ol);
    this.append(section);
    this.#generated.push(section);
  }

  #createItem(/** @type {Note} */ note) {
    const li = document.createElement('li');
    li.id = note.noteId;
    li.append(...note.content, ' ');

    const back = this.#label('data-label-back', DEFAULT_BACK);
    const multi = note.refs.length > 1;
    note.refs.forEach((_ref, i) => {
      const a = document.createElement('a');
      a.href = `#${this.#refId(note, i)}`;
      a.setAttribute('data-backref', '');
      a.setAttribute('role', 'doc-backlink');
      if (multi) {
        a.setAttribute('aria-label', `${back} (${letter(i)})`);
        a.textContent = `${BACK_GLYPH}${letter(i)}`;
      } else {
        a.setAttribute('aria-label', back);
        a.textContent = BACK_GLYPH;
      }
      if (i > 0) li.append(' ');
      li.append(a);
    });
    return li;
  }

  // ── Preview popover ───────────────────────────────────

  /**
   * @param {HTMLAnchorElement} link
   * @param {Note} note
   */
  #wirePreview(link, note) {
    if (typeof HTMLElement.prototype.showPopover !== 'function') return;
    this.listen(link, 'pointerenter', (e) => {
      if (/** @type {PointerEvent} */ (e).pointerType === 'touch') return;
      clearTimeout(this.#hideTimer);
      clearTimeout(this.#showTimer);
      this.#showTimer = setTimeout(() => this.#showPreview(link, note), SHOW_DELAY);
    });
    this.listen(link, 'pointerleave', () => {
      clearTimeout(this.#showTimer);
      if (link === document.activeElement && link.matches(':focus-visible')) return;
      this.#hideTimer = setTimeout(() => this.#hidePreview(), HIDE_DELAY);
    });
    this.listen(link, 'focus', () => {
      if (link.matches(':focus-visible')) this.#showPreview(link, note);
    });
    this.listen(link, 'blur', () => this.#hidePreview());
  }

  #ensurePreview() {
    if (this.#preview) return this.#preview;
    // Purely visual duplicate of the note (reachable via the link), so it is
    // hidden from AT and inert — no extra reading, no hidden tab stops.
    const p = document.createElement('aside');
    p.className = 'fn-preview';
    p.setAttribute('popover', 'manual');
    p.setAttribute('aria-hidden', 'true');
    p.inert = true;
    this.append(p);
    this.#generated.push(p);
    this.#preview = p;
    return p;
  }

  /**
   * @param {HTMLAnchorElement} link
   * @param {Note} note
   */
  #showPreview(link, note) {
    clearTimeout(this.#hideTimer);
    if (!link.isConnected || this.hidden) return;
    const p = this.#ensurePreview();
    const number = document.createElement('span');
    number.className = 'fn-preview-number';
    number.textContent = `${note.num}.`;
    const clones = note.content.map((n) => n.cloneNode(true));
    p.replaceChildren(number, ' ', ...clones);
    for (const el of p.querySelectorAll('[id]')) el.removeAttribute('id');

    this.#previewLink?.removeAttribute('data-preview-anchor');
    link.setAttribute('data-preview-anchor', '');
    this.#previewLink = link;
    if (!p.matches(':popover-open')) p.showPopover();
    this.#position(p, link);
  }

  #hidePreview() {
    clearTimeout(this.#showTimer);
    const p = this.#preview;
    if (p?.matches(':popover-open')) p.hidePopover();
    this.#previewLink?.removeAttribute('data-preview-anchor');
    this.#previewLink = null;
  }

  /** Fallback placement where CSS anchor positioning is unsupported. */
  #position(/** @type {HTMLElement} */ p, /** @type {HTMLElement} */ link) {
    if (typeof CSS !== 'undefined' && CSS.supports?.('position-area: top')) return;
    const r = link.getBoundingClientRect();
    const gap = 6;
    const w = p.offsetWidth;
    const h = p.offsetHeight;
    let top = r.top - h - gap;
    if (top < gap) top = r.bottom + gap;
    const left = Math.max(gap, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - gap));
    // Physical coordinates: computed from the physical client rect.
    p.style.inset = 'auto';
    p.style.top = `${top}px`;
    p.style.left = `${left}px`;
  }
}

class FootNote extends HTMLElement {
  // No-op class - enhanced by FootNotes
  // Degrades gracefully to show content in parentheses via CSS
}

registerComponent('foot-notes', FootNotes);
registerComponent('foot-note', FootNote);

export { FootNotes, FootNote };
