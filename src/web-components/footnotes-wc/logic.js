/**
 * footnotes-wc: Progressive enhancement for footnotes
 *
 * Two elements work together:
 * - <foot-note>: Inline reference that degrades to parenthetical text
 * - <footnotes-wc>: Container that collects and displays footnotes
 *
 * Usage:
 *   <p>Some text<foot-note>This is a footnote</foot-note> continues.</p>
 *   <footnotes-wc></footnotes-wc>
 *
 * Without JS: footnotes appear inline in parentheses
 * With JS: footnotes become superscript links, collected at footnotes-wc
 */

class FootnotesWc extends HTMLElement {
  static #instanceCount = 0;
  #instanceId;
  #refs = [];
  #backLabel = 'Back to content';

  connectedCallback() {
    // Generate unique instance ID for scoped element IDs
    this.#instanceId = ++FootnotesWc.#instanceCount;

    // Allow customization via attribute
    if (this.hasAttribute('data-back-label')) {
      this.#backLabel = this.getAttribute('data-back-label');
    }

    // Find all foot-note elements in the document before this element
    this.#collectRefs();

    if (this.getAttribute('data-mode') === 'sidenotes') {
      this.#renderSidenotes();
    } else {
      this.#render();
    }
  }

  #collectRefs() {
    // Get all foot-note elements that:
    // 1. Haven't been enhanced by another footnotes-wc instance
    // 2. Come before this element in document order
    const allRefs = [...document.querySelectorAll('foot-note:not([data-enhanced])')];

    this.#refs = allRefs.filter(ref => {
      return this.compareDocumentPosition(ref) & Node.DOCUMENT_POSITION_PRECEDING;
    });
  }

  #render() {
    if (this.#refs.length === 0) return;

    const ol = document.createElement('ol');

    this.#refs.forEach((ref, index) => {
      const num = index + 1;
      // Scope IDs by instance to avoid conflicts with multiple footnotes-wc
      const refId = `fnref-${this.#instanceId}-${num}`;
      const noteId = `fn-${this.#instanceId}-${num}`;

      // Enhance the foot-note element
      this.#enhanceRef(ref, num, refId, noteId);

      // Create the footnote list item
      const li = this.#createFootnoteItem(ref, num, refId, noteId);
      ol.appendChild(li);
    });

    this.appendChild(ol);
  }

  #enhanceRef(ref, num, refId, noteId) {
    ref.setAttribute('data-enhanced', '');
    ref.id = refId;

    // Wrap existing content in a span (for hiding via CSS)
    const content = ref.innerHTML;
    const contentSpan = document.createElement('span');
    contentSpan.innerHTML = content;

    // Create the superscript link
    const link = document.createElement('a');
    link.href = `#${noteId}`;
    link.setAttribute('aria-describedby', noteId);
    link.textContent = `[${num}]`;

    ref.innerHTML = '';
    ref.appendChild(contentSpan);
    ref.appendChild(link);
  }

  #renderSidenotes() {
    if (this.#refs.length === 0) return;

    const footnoteRefs = [];

    this.#refs.forEach((ref, index) => {
      const num = index + 1;
      const refId = `fnref-${this.#instanceId}-${num}`;
      const noteId = `fn-${this.#instanceId}-${num}`;

      if (ref.getAttribute('data-side') === 'false') {
        // Opt-out: enhance as standard footnote, collect for list
        this.#enhanceRef(ref, num, refId, noteId);
        footnoteRefs.push({ ref, num, refId, noteId });
      } else {
        // Sidenote: create margin aside at the reference point
        this.#enhanceSidenoteRef(ref, num, refId, noteId);
      }
    });

    if (footnoteRefs.length > 0) {
      // Render collected footnote list for opt-out notes
      const ol = document.createElement('ol');
      for (const { ref, num, refId, noteId } of footnoteRefs) {
        ol.appendChild(this.#createFootnoteItem(ref, num, refId, noteId));
      }
      this.appendChild(ol);
    } else {
      this.hidden = true;
    }
  }

  #enhanceSidenoteRef(ref, num, refId, noteId) {
    const content = ref.innerHTML;

    ref.setAttribute('data-enhanced', '');
    ref.setAttribute('data-side', '');
    ref.id = refId;

    // Superscript link
    const link = document.createElement('a');
    link.href = `#${noteId}`;
    link.setAttribute('aria-describedby', noteId);
    link.textContent = `[${num}]`;

    // Sidenote aside
    const aside = document.createElement('aside');
    aside.className = 'sidenote';
    aside.id = noteId;
    aside.setAttribute('role', 'note');
    aside.innerHTML = `<span class="sidenote-number">${num}.</span> ${content}`;

    ref.innerHTML = '';
    ref.appendChild(link);
    ref.appendChild(aside);
  }

  #createFootnoteItem(ref, num, refId, noteId) {
    const li = document.createElement('li');
    li.id = noteId;

    // Get the footnote content from the original foot-note
    const contentSpan = ref.querySelector('span');
    const content = contentSpan ? contentSpan.innerHTML : '';

    // Create back-reference link
    const backLink = document.createElement('a');
    backLink.href = `#${refId}`;
    backLink.setAttribute('data-backref', '');
    backLink.setAttribute('aria-label', this.#backLabel);
    backLink.textContent = '↩';

    li.innerHTML = content + ' ';
    li.appendChild(backLink);

    return li;
  }
}

class FootNote extends HTMLElement {
  // No-op class - enhanced by FootnotesWc
  // Degrades gracefully to show content in parentheses via CSS
}

customElements.define('footnotes-wc', FootnotesWc);
customElements.define('foot-note', FootNote);

export { FootnotesWc, FootNote };
