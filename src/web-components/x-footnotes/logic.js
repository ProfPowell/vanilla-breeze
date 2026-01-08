/**
 * x-footnotes: Progressive enhancement for footnotes
 *
 * Usage:
 *   <p>Some text<x-fnref>This is a footnote</x-fnref> continues.</p>
 *   <x-footnotes></x-footnotes>
 *
 * Without JS: footnotes appear inline in parentheses
 * With JS: footnotes become superscript links, collected at x-footnotes
 */

class XFootnotes extends HTMLElement {
  #refs = [];
  #backLabel = 'Back to content';

  connectedCallback() {
    // Allow customization via attribute
    if (this.hasAttribute('data-back-label')) {
      this.#backLabel = this.getAttribute('data-back-label');
    }

    // Find all x-fnref elements in the document before this element
    this.#collectRefs();
    this.#render();
  }

  #collectRefs() {
    // Get all x-fnref elements that come before this x-footnotes
    const allRefs = [...document.querySelectorAll('x-fnref')];

    // Filter to only those that come before this element in document order
    this.#refs = allRefs.filter(ref => {
      return this.compareDocumentPosition(ref) & Node.DOCUMENT_POSITION_PRECEDING;
    });
  }

  #render() {
    if (this.#refs.length === 0) return;

    const ol = document.createElement('ol');

    this.#refs.forEach((ref, index) => {
      const num = index + 1;
      const refId = `fnref-${num}`;
      const noteId = `fn-${num}`;

      // Enhance the x-fnref element
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

  #createFootnoteItem(ref, num, refId, noteId) {
    const li = document.createElement('li');
    li.id = noteId;

    // Get the footnote content from the original x-fnref
    const contentSpan = ref.querySelector('span');
    const content = contentSpan ? contentSpan.innerHTML : '';

    // Create back-reference link
    const backLink = document.createElement('a');
    backLink.href = `#${refId}`;
    backLink.className = 'fn-backref';
    backLink.setAttribute('aria-label', this.#backLabel);
    backLink.textContent = '↩';

    li.innerHTML = content + ' ';
    li.appendChild(backLink);

    return li;
  }
}

class XFnref extends HTMLElement {
  // No-op, enhanced by XFootnotes
}

customElements.define('x-footnotes', XFootnotes);
customElements.define('x-fnref', XFnref);

export { XFootnotes, XFnref };
