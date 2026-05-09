/**
 * risk-register: Composing preset for the table + quadrant pattern
 *
 * Reads risk rows from a <template> child (or src URL) and renders both
 * a sortable <data-table> with a computed Severity column AND a
 * <quadrant-grid> mapping each risk to a labelled dot at
 * (likelihood, impact). The two views stay in sync from one source.
 *
 * The pairing recurs as a single tool, justifying a wrapper instead of
 * a recipe. Most of the code is glue; both children do the work.
 *
 * Row shape (from <template>'s <tr> cells, in order):
 *   1. Title           — short risk identifier
 *   2. Likelihood      — integer 1..5
 *   3. Impact          — integer 1..5
 *   4. Owner           — optional, free text
 *   5. Mitigation      — optional, free text
 *   <tr data-id="..."> on the row provides a stable id; falls back to
 *   the title.
 *
 * @attr {string} src   - URL to JSON: [{ id, title, likelihood, impact, owner, mitigation }]
 * @attr {string} label - Optional heading shown above the table
 *
 * @fires risk-register:ready  - { count } after first render
 * @fires risk-register:change - { row, field, value } on inline edit
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const SCALE = 5;

class RiskRegister extends VBElement {
  setup() {
    const tmpl = this.querySelector(':scope > template');
    let rows = tmpl ? RiskRegister.#parseTemplate(tmpl) : [];

    if (this.hasAttribute('src')) {
      this.#loadFromSrc(this.getAttribute('src'));
      return;
    }
    this.#render(rows);
  }

  async #loadFromSrc(url) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      this.#render(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('risk-register: failed to load src', url, e);
      this.#render([]);
    }
  }

  static #parseTemplate(tmpl) {
    const rows = [];
    const trs = tmpl.content.querySelectorAll('tr');
    for (const tr of trs) {
      const cells = [...tr.children];
      const title = cells[0]?.textContent?.trim() || '';
      const id = tr.getAttribute('data-id') || title.toLowerCase().replace(/\s+/g, '-') || `risk-${rows.length}`;
      rows.push({
        id,
        title,
        likelihood: parseInt(cells[1]?.textContent ?? '', 10) || 0,
        impact:     parseInt(cells[2]?.textContent ?? '', 10) || 0,
        owner:      cells[3]?.textContent?.trim() || '',
        mitigation: cells[4]?.textContent?.trim() || '',
      });
    }
    return rows;
  }

  #render(rows) {
    this.#rows = rows;

    // Wipe prior children except the source <template> so re-renders work.
    [...this.children].forEach((c) => { if (c.tagName !== 'TEMPLATE') c.remove(); });

    const label = this.getAttribute('label');
    if (label) {
      const h = document.createElement('header');
      h.className = 'rr-label';
      h.textContent = label;
      this.appendChild(h);
    }

    const layout = document.createElement('div');
    layout.className = 'rr-layout';
    layout.appendChild(this.#buildTable(rows));
    layout.appendChild(this.#buildGrid(rows));
    this.appendChild(layout);

    queueMicrotask(() => {
      this.dispatchEvent(new CustomEvent('risk-register:ready', {
        bubbles: true,
        detail: { count: rows.length },
      }));
    });
  }

  #buildTable(rows) {
    const wrapper = document.createElement('data-table');
    const table = document.createElement('table');

    table.innerHTML = `
      <thead>
        <tr>
          <th data-sort="string">Title</th>
          <th data-sort="number">Likelihood</th>
          <th data-sort="number">Impact</th>
          <th data-sort="number" data-rollup="product" data-heatmap="low-good">Severity</th>
          <th data-sort="string">Owner</th>
          <th data-sort="string">Mitigation</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r) => `
          <tr data-id="${RiskRegister.#escape(r.id)}">
            <td>${RiskRegister.#escape(r.title)}</td>
            <td>${r.likelihood || ''}</td>
            <td>${r.impact || ''}</td>
            <td></td>
            <td>${RiskRegister.#escape(r.owner)}</td>
            <td>${RiskRegister.#escape(r.mitigation)}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    wrapper.appendChild(table);
    return wrapper;
  }

  #buildGrid(rows) {
    const grid = document.createElement('quadrant-grid');
    grid.setAttribute('x-label', 'Likelihood');
    grid.setAttribute('y-label', 'Impact');
    grid.setAttribute('x-low', 'Rare');
    grid.setAttribute('x-high', 'Likely');
    grid.setAttribute('y-low', 'Minor');
    grid.setAttribute('y-high', 'Severe');
    grid.setAttribute('q1-label', 'Avoid');
    grid.setAttribute('q2-label', 'Plan');
    grid.setAttribute('q3-label', 'Accept');
    grid.setAttribute('q4-label', 'Mitigate');

    for (const r of rows) {
      if (!r.likelihood || !r.impact) continue;
      const dot = document.createElement('span');
      const x = Math.min(1, Math.max(0, r.likelihood / SCALE));
      const y = Math.min(1, Math.max(0, r.impact / SCALE));
      dot.setAttribute('data-x', x.toFixed(3));
      dot.setAttribute('data-y', y.toFixed(3));
      dot.setAttribute('data-id', r.id);
      dot.setAttribute('title', `${r.title} — likelihood ${r.likelihood}, impact ${r.impact}`);
      dot.textContent = r.title;
      grid.appendChild(dot);
    }
    return grid;
  }

  static #escape(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /** @type {Array<{id:string,title:string,likelihood:number,impact:number,owner:string,mitigation:string}>} */
  #rows = [];

  get rows() { return [...this.#rows]; }

  set rows(value) {
    this.#render(Array.isArray(value) ? value : []);
  }
}

registerComponent('risk-register', RiskRegister);

export { RiskRegister };
