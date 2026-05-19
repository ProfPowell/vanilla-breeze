/**
 * accessibility-specimen: WCAG contrast-ratio table + a11y checklist
 * for design-system docs.
 *
 * Two modes:
 *   - "contrast" (default): tabular display of foreground / background
 *     color pairs with computed WCAG 2.x contrast ratio + AA/AAA badges
 *     for normal- and large-text. Author provides pairs as direct
 *     `<button data-fg data-bg [data-label]>` children.
 *   - "checklist": author authors a `<ul>` of items with `data-status=
 *     pass|fail|warn|na` (or none → unset). Component normalizes the
 *     visual styling and adds an icon per status.
 *
 * @attr {string} type - "contrast" (default) | "checklist"
 *
 * Distinct from:
 *   - <semantic-palette> (palette colors with semantic roles, not pairs)
 *   - <token-specimen> (token-scale display, single axis)
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

// ── Color parsing + WCAG 2.x contrast ─────────────────────────────────

/**
 * Parse a CSS color string into [r, g, b] (0-255). Supports #hex, #hex8,
 * rgb()/rgba() and named colors (via a temporary canvas trick). Returns
 * null on failure so the consumer can show a "?" badge.
 * @returns {[number, number, number] | null}
 */
function parseColor(str) {
  const s = String(str || '').trim();
  if (!s) return null;
  // Hex shorthand / full
  let m = s.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    const h = m[1];
    if (h.length === 3) return [parseInt(h[0]+h[0],16), parseInt(h[1]+h[1],16), parseInt(h[2]+h[2],16)];
    if (h.length === 4) return [parseInt(h[0]+h[0],16), parseInt(h[1]+h[1],16), parseInt(h[2]+h[2],16)];
    if (h.length === 6) return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
    if (h.length === 8) return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }
  // rgb / rgba
  m = s.match(/^rgba?\s*\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)/i);
  if (m) return [Math.round(+m[1]), Math.round(+m[2]), Math.round(+m[3])];
  // Fall back to letting the browser resolve via getComputedStyle on a probe.
  // (Handles named colors, oklch(), color-mix(), etc. — but loses alpha.)
  if (typeof document !== 'undefined') {
    const probe = document.createElement('span');
    probe.style.color = s;
    probe.style.display = 'none';
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe).color;
    probe.remove();
    const rgb = cs.match(/^rgba?\s*\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)/i);
    if (rgb) return [Math.round(+rgb[1]), Math.round(+rgb[2]), Math.round(+rgb[3])];
  }
  return null;
}

/** Linearize an sRGB channel per WCAG 2.x. */
function lin(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** Relative luminance per WCAG 2.x. */
function luminance([r, g, b]) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contrast ratio per WCAG 2.x (returns 1..21, or null on parse failure). */
function contrastRatio(fg, bg) {
  const f = parseColor(fg);
  const b = parseColor(bg);
  if (!f || !b) return null;
  const l1 = luminance(f);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * @returns {{ aaNormal: boolean, aaLarge: boolean, aaaNormal: boolean, aaaLarge: boolean }}
 */
function wcagBadges(ratio) {
  if (ratio == null) return { aaNormal: false, aaLarge: false, aaaNormal: false, aaaLarge: false };
  return {
    aaNormal:  ratio >= 4.5,
    aaLarge:   ratio >= 3.0,
    aaaNormal: ratio >= 7.0,
    aaaLarge:  ratio >= 4.5,
  };
}

// ── Component ─────────────────────────────────────────────────────────

class AccessibilitySpecimen extends VBElement {
  static observedAttributes = ['type'];

  setup() {
    const type = this.getAttribute('type') || 'contrast';
    if (type === 'checklist') this.#renderChecklist();
    else this.#renderContrast();
  }

  attributeChangedCallback(_name, oldVal, newVal) {
    if (!this.isConnected || oldVal === newVal) return;
    this.setup();
  }

  // ── Contrast mode ─────────────────────────────────────────────────

  #renderContrast() {
    // Capture authored pairs (button[data-fg][data-bg]) before rebuilding.
    const pairs = /** @type {HTMLElement[]} */ ([...this.querySelectorAll(':scope > button[data-fg][data-bg]')]).map((b) => ({
      fg: b.dataset.fg,
      bg: b.dataset.bg,
      label: b.dataset.label || b.textContent.trim() || `${b.dataset.fg} on ${b.dataset.bg}`,
    }));

    const table = document.createElement('table');
    table.className = 'as-contrast-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th scope="col">Pair</th>
        <th scope="col">Sample</th>
        <th scope="col">Ratio</th>
        <th scope="col">AA</th>
        <th scope="col">AA Large</th>
        <th scope="col">AAA</th>
        <th scope="col">AAA Large</th>
      </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    if (pairs.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 7;
      td.className = 'as-empty';
      td.textContent = 'No color pairs authored. Add <button data-fg="…" data-bg="…">Label</button> children.';
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      for (const p of pairs) tbody.appendChild(this.#renderPairRow(p));
    }
    table.appendChild(tbody);

    this.replaceChildren(table);
  }

  #renderPairRow({ fg, bg, label }) {
    const ratio = contrastRatio(fg, bg);
    const badges = wcagBadges(ratio);
    const ratioText = ratio == null ? '?' : `${ratio.toFixed(2)}:1`;

    const tr = document.createElement('tr');

    const tdLabel = document.createElement('th');
    tdLabel.scope = 'row';
    tdLabel.className = 'as-pair-label';
    tdLabel.innerHTML = `<span class="as-swatch" style="background:${bg};border-color:${fg}"></span><span>${escapeText(label)}</span>`;
    tr.appendChild(tdLabel);

    const tdSample = document.createElement('td');
    tdSample.className = 'as-pair-sample';
    tdSample.style.background = bg;
    tdSample.style.color = fg;
    tdSample.textContent = 'Aa Bb 123';
    tr.appendChild(tdSample);

    const tdRatio = document.createElement('td');
    tdRatio.className = 'as-pair-ratio';
    tdRatio.textContent = ratioText;
    tr.appendChild(tdRatio);

    for (const key of ['aaNormal', 'aaLarge', 'aaaNormal', 'aaaLarge']) {
      const td = document.createElement('td');
      const ok = badges[key];
      td.className = `as-badge ${ok ? 'as-pass' : 'as-fail'}`;
      td.textContent = ok ? '✓' : '✗';
      td.setAttribute('aria-label', ok ? 'Pass' : 'Fail');
      tr.appendChild(td);
    }

    return tr;
  }

  // ── Checklist mode ────────────────────────────────────────────────

  #renderChecklist() {
    // Author provides a <ul> with <li data-status="pass|fail|warn|na"> items.
    const list = this.querySelector(':scope > ul, :scope > ol');
    if (!list) return;
    list.classList.add('as-checklist');
    for (const item of list.querySelectorAll(':scope > li')) {
      this.#decorateChecklistItem(item);
    }
  }

  #decorateChecklistItem(item) {
    if (item.dataset.decorated === '') return;
    item.dataset.decorated = '';
    const status = item.dataset.status || 'na';
    item.classList.add(`as-status-${status}`);

    const icon = document.createElement('span');
    icon.className = 'as-checklist-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = ({ pass: '✓', fail: '✗', warn: '!', na: '–' })[status] || '–';

    const label = ({ pass: 'Pass', fail: 'Fail', warn: 'Warning', na: 'Not applicable' })[status] || 'Not applicable';
    const sr = document.createElement('span');
    sr.className = 'as-sr-only';
    sr.textContent = `${label}: `;

    item.prepend(icon, sr);
  }
}

function escapeText(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

registerComponent('accessibility-specimen', AccessibilitySpecimen);

export { AccessibilitySpecimen };
