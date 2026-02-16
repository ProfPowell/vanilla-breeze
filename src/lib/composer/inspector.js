/**
 * <vb-inspector> — Property panel for the selected block.
 *
 * Listens for composer:select on the parent vb-composer and
 * renders editable properties for the selected block.
 */

import { BLOCK_TAGS } from './serialize.js';

class VbInspector extends HTMLElement {
  #block = null;
  #fields = null;    // cached input references
  #placeholder = null;

  connectedCallback() {
    this.#placeholder = this.querySelector('[data-placeholder]') || this.#buildPlaceholder();
    this.closest('vb-composer')?.addEventListener('composer:select', this.#onSelect);
  }

  disconnectedCallback() {
    this.closest('vb-composer')?.removeEventListener('composer:select', this.#onSelect);
  }

  // --- Selection handler ---

  #onSelect = (e) => {
    this.#block = e.detail.block;
    this.#render();
  };

  // --- Rendering ---

  #render() {
    if (!this.#block) {
      this.#showPlaceholder();
      return;
    }

    const b = this.#block;
    const canvas = b.closest('vb-canvas');
    const cols = canvas
      ? parseInt(getComputedStyle(canvas).getPropertyValue('--cols'), 10) || 12
      : 12;
    const col   = parseInt(b.style.getPropertyValue('--col'),   10) || 1;
    const cspan = parseInt(b.style.getPropertyValue('--cspan'), 10) || 12;
    const row   = parseInt(b.style.getPropertyValue('--row'),   10) || 1;
    const rspan = parseInt(b.style.getPropertyValue('--rspan'), 10) || 2;
    const sub   = b.hasAttribute('data-subgrid');
    const isNested = canvas && b.parentElement !== canvas;
    const parentTag = isNested ? b.parentElement.localName : null;

    const tagOptions = BLOCK_TAGS.map(t =>
      `<option value="${t}"${t === b.localName ? ' selected' : ''}>${t}</option>`
    ).join('');

    const nestInfo = isNested
      ? `<p class="nest-info">Inside: <code>&lt;${parentTag}&gt;</code></p>`
      : '';
    const unnestBtn = isNested
      ? '<button type="button" data-action="unnest">Un-nest</button>'
      : '';

    this.innerHTML = `
      <h2>Inspector</h2>
      ${nestInfo}
      <form data-inspector-form>
        <label>Tag
          <select name="tag">${tagOptions}</select>
        </label>
        <label>Column
          <input type="number" name="col" value="${col}" min="1" max="${cols}" />
        </label>
        <label>Span
          <input type="number" name="cspan" value="${cspan}" min="1" max="${cols}" />
        </label>
        <label>Row
          <input type="number" name="row" value="${row}" min="1" />
        </label>
        <label>Row span
          <input type="number" name="rspan" value="${rspan}" min="1" />
        </label>
        <label class="checkbox-label">
          <input type="checkbox" name="subgrid"${sub ? ' checked' : ''} />
          Subgrid
        </label>
        ${unnestBtn}
        <button type="button" data-action="delete">Delete block</button>
      </form>
    `;

    this.#fields = {
      form:    this.querySelector('[data-inspector-form]'),
      tag:     this.querySelector('[name="tag"]'),
      col:     this.querySelector('[name="col"]'),
      cspan:   this.querySelector('[name="cspan"]'),
      row:     this.querySelector('[name="row"]'),
      rspan:   this.querySelector('[name="rspan"]'),
      subgrid: this.querySelector('[name="subgrid"]'),
      del:     this.querySelector('[data-action="delete"]'),
      unnest:  this.querySelector('[data-action="unnest"]'),
    };

    this.#fields.form.addEventListener('input', this.#onInput);
    this.#fields.tag.addEventListener('change', this.#onTagChange);
    this.#fields.del.addEventListener('click', this.#onDelete);
    this.#fields.unnest?.addEventListener('click', this.#onUnnest);
  }

  #showPlaceholder() {
    this.innerHTML = '<h2>Inspector</h2><p data-placeholder>Select a block to edit its properties.</p>';
    this.#fields = null;
  }

  #buildPlaceholder() {
    const p = document.createElement('p');
    p.setAttribute('data-placeholder', '');
    p.textContent = 'Select a block to edit its properties.';
    return p;
  }

  // --- Input handlers ---

  #onInput = () => {
    if (!this.#block || !this.#fields) return;

    const canvas = this.#block.closest('vb-canvas');
    const cols = parseInt(getComputedStyle(canvas).getPropertyValue('--cols'), 10) || 12;
    const col   = this.#clamp(+this.#fields.col.value, 1, cols);
    const cspan = this.#clamp(+this.#fields.cspan.value, 1, cols - col + 1);
    const row   = Math.max(1, +this.#fields.row.value);
    const rspan = Math.max(1, +this.#fields.rspan.value);

    this.#block.style.setProperty('--col', col);
    this.#block.style.setProperty('--cspan', cspan);
    this.#block.style.setProperty('--row', row);
    this.#block.style.setProperty('--rspan', rspan);

    if (this.#fields.subgrid.checked) {
      this.#block.setAttribute('data-subgrid', '');
    } else {
      this.#block.removeAttribute('data-subgrid');
    }
  };

  #onTagChange = () => {
    if (!this.#block || !this.#fields) return;

    const newTag = this.#fields.tag.value;
    if (newTag === this.#block.localName) return;

    const canvas = this.#block.closest('vb-canvas');
    if (!canvas) return;

    // Create new element, transfer style + attributes + children
    const newEl = document.createElement(newTag);
    for (const attr of this.#block.attributes) {
      if (attr.name === 'data-vb-label') {
        newEl.setAttribute('data-vb-label', newTag);
      } else {
        newEl.setAttribute(attr.name, attr.value);
      }
    }
    newEl.style.cssText = this.#block.style.cssText;
    while (this.#block.firstChild) {
      newEl.appendChild(this.#block.firstChild);
    }

    this.#block.replaceWith(newEl);
    this.#block = newEl;
    canvas.select(newEl);
  };

  #onUnnest = () => {
    if (!this.#block) return;
    const canvas = this.#block.closest('vb-canvas');
    if (!canvas || this.#block.parentElement === canvas) return;

    canvas.appendChild(this.#block);
    canvas.select(this.#block);
    this.#render();
  };

  #onDelete = () => {
    if (!this.#block) return;
    const canvas = this.#block.closest('vb-canvas');
    canvas?.removeBlock(this.#block);
    this.#block = null;
    this.#render();
  };

  #clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }
}

if (!customElements.get('vb-inspector')) {
  customElements.define('vb-inspector', VbInspector);
}

export { VbInspector };
