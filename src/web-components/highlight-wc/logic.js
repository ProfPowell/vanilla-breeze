/**
 * highlight-wc — Text highlighting for articles
 *
 * Primary usage: a child of <selection-menu>. It renders a highlighter
 * button in the selection toolbar; the button opens a colour palette and
 * picking a swatch highlights the current selection in whichever of the
 * menu's targets it falls in (each target gets its own engine controller).
 *
 * Standalone (<highlight-wc><article>…</article></highlight-wc> or
 * for="id") it renders NO UI: it enables persistence + rendering on the
 * target and exposes the JS API (highlightSelection(), getHighlights(), …)
 * and the engine's highlights:* events for a custom UI.
 *
 * @attr {string} for         - ID of element to annotate (standalone mode)
 * @attr {string} colors      - Comma-separated color names
 * @attr {boolean} readonly   - Render stored highlights, disable new ones
 * @attr {string} storage-key - Custom storage key suffix
 * @attr {string} data-label-button     - Highlighter button name ("Highlight selection")
 * @attr {string} data-label-palette    - Palette group name ("Highlight color")
 * @attr {string} data-label-annotation - Margin label ("You highlighted")
 * @attr {string} data-label-added      - Announcement ("Highlight added")
 * @attr {string} data-label-removed    - Announcement ("Highlight removed")
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { initHighlights } from '../../utils/highlights-init.js';

const DEFAULT_COLORS = ['yellow', 'green', 'blue', 'pink'];
const COLOR_NAME = /^[a-z0-9_-]+$/i;
const FORWARDED_LABELS = ['annotation', 'added', 'removed'];

let paletteSeq = 0;

/** @typedef {ReturnType<typeof initHighlights>} Controller */

class HighlightWC extends VBElement {
  /** Controller this element owns (standalone mode) — destroyed on teardown. @type {Controller | null} */
  #controller = null;
  /** Most recently highlighted target (selection-menu mode). @type {HTMLElement | null} */
  #lastTarget = null;
  #lastColor = 'yellow';
  /** @type {Element | null} */
  #menu = null;
  /** @type {HTMLButtonElement | null} */
  #button = null;
  #ownsButton = false;
  /** @type {HTMLElement | null} */
  #palette = null;

  setup() {
    this.#menu = this.closest('selection-menu');
    const colors = this.#getColors();
    if (!colors.includes(this.#lastColor)) this.#lastColor = colors[0] ?? 'yellow';
    if (this.#menu) {
      this.#setupAsAction();
    } else {
      this.#setupStandalone();
    }
  }

  teardown() {
    this.#controller?.destroy();
    this.#controller = null;
    this.#palette?.remove();
    this.#palette = null;
    if (this.#ownsButton) this.#button?.remove();
    else this.#button?.removeAttribute('aria-expanded');
    this.#button = null;
    this.#ownsButton = false;
    this.#menu = null;
  }

  // --- Selection menu child mode ---

  #setupAsAction() {
    const readonly = this.hasAttribute('readonly');

    // Paint stored highlights on the menu's targets straight away rather
    // than on the first new highlight. Target controllers belong to the
    // page, not this element, so teardown leaves them running.
    for (const target of this.#menuTargets()) this.#prepareTarget(target);

    if (readonly) return;

    const colors = this.#getColors();

    // Highlighter button — reuse an authored or surviving one (setup
    // reruns whenever selection-menu reparents or the page moves us).
    let btn = /** @type {HTMLButtonElement | null} */ (this.querySelector(':scope > button'));
    this.#ownsButton = !btn;
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', this.dataset.labelButton || 'Highlight selection');
      const icon = document.createElement('icon-wc');
      icon.setAttribute('name', 'highlighter');
      icon.setAttribute('size', 'sm');
      icon.setAttribute('aria-hidden', 'true');
      btn.appendChild(icon);
      this.appendChild(btn);
    }
    this.#button = btn;

    // Colour palette — drops below the toolbar
    const palette = document.createElement('div');
    palette.className = 'highlight-color-dropdown';
    palette.id = `highlight-palette-${++paletteSeq}`;
    palette.setAttribute('role', 'group');
    palette.setAttribute('aria-label', this.dataset.labelPalette || 'Highlight color');
    palette.hidden = true;
    for (const color of colors) {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'highlight-color-swatch';
      swatch.dataset.color = color;
      swatch.title = color;
      swatch.setAttribute('aria-label', color);
      swatch.setAttribute('aria-pressed', String(color === this.#lastColor));
      swatch.style.setProperty('--_swatch', `var(--highlight-${color})`);
      palette.appendChild(swatch);
    }
    this.appendChild(palette);
    this.#palette = palette;

    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', palette.id);

    this.listen(btn, 'click', (e) => {
      e.stopPropagation();
      this.#setPaletteOpen(palette.hidden);
    });
    this.listen(palette, 'click', (e) => {
      const swatch = /** @type {HTMLElement} */ (e.target).closest?.('.highlight-color-swatch');
      if (!swatch) return;
      e.stopPropagation();
      this.#selectColor(/** @type {HTMLElement} */ (swatch).dataset.color ?? this.#lastColor);
      this.#setPaletteOpen(false);
      this.#applyFromMenu(this.#lastColor);
    });
    // Escape closes the palette first (and keeps the toolbar open).
    this.listen(this, 'keydown', (e) => {
      const ke = /** @type {KeyboardEvent} */ (e);
      if (ke.key !== 'Escape' || palette.hidden) return;
      ke.stopPropagation();
      this.#setPaletteOpen(false);
      btn.focus();
    });
    this.listen(document, 'pointerdown', (e) => {
      if (!palette.hidden && !this.contains(/** @type {Node} */ (e.target))) this.#setPaletteOpen(false);
    });
    this.listen(/** @type {Element} */ (this.#menu), 'selection-menu:dismiss', () => this.#setPaletteOpen(false));
  }

  /** @param {boolean} open */
  #setPaletteOpen(open) {
    if (!this.#palette || !this.#button) return;
    this.#palette.hidden = !open;
    this.#button.setAttribute('aria-expanded', String(open));
    if (open) {
      this.#keepPaletteInView();
      const current = /** @type {HTMLElement | null} */ (
        this.#palette.querySelector('[aria-pressed="true"]') ?? this.#palette.firstElementChild);
      current?.focus({ preventScroll: true });
    }
  }

  /** Nudge the palette horizontally so no swatch falls off-screen. */
  #keepPaletteInView() {
    const palette = this.#palette;
    if (!palette) return;
    palette.style.removeProperty('--_hn-shift');
    const { left, right } = palette.getBoundingClientRect();
    const pad = 8;
    const shift = left < pad ? pad - left
      : right > window.innerWidth - pad ? (window.innerWidth - pad) - right : 0;
    if (shift) palette.style.setProperty('--_hn-shift', `${shift}px`);
  }

  /** @param {string} color */
  #selectColor(color) {
    this.#lastColor = color;
    this.#palette?.querySelectorAll('.highlight-color-swatch').forEach((s) =>
      s.setAttribute('aria-pressed', String(/** @type {HTMLElement} */ (s).dataset.color === color)));
  }

  /** @param {string} color */
  #applyFromMenu(color) {
    const menu = /** @type {any} */ (this.#menu);
    const sel = menu?.getSelection?.();
    if (!sel?.target) return;
    const ctrl = this.#prepareTarget(sel.target);
    if (!ctrl) return;
    // Clicking toolbar buttons can collapse the live selection; restore
    // the range selection-menu captured.
    const live = window.getSelection();
    if (live && (live.isCollapsed || !live.rangeCount) && sel.range) {
      live.removeAllRanges();
      live.addRange(sel.range);
    }
    ctrl._createFromSelection(color);
    this.#lastTarget = sel.target;
    menu.dismiss?.();
  }

  /** Elements the parent selection-menu watches (for= and data-selection-menu="id"). */
  #menuTargets() {
    const menu = this.#menu;
    if (!menu) return [];
    /** @type {Set<HTMLElement>} */
    const out = new Set();
    const forId = menu.getAttribute('for');
    const byId = forId && document.getElementById(forId);
    if (byId) out.add(byId);
    if (menu.id) {
      document.querySelectorAll(`[data-selection-menu="${CSS.escape(menu.id)}"]`)
        .forEach((el) => out.add(/** @type {HTMLElement} */ (el)));
    }
    return [...out];
  }

  // --- Shared target wiring ---

  /**
   * Configure a target from this element's attributes and return its live
   * controller. initHighlights() is idempotent, so every target — not just
   * the first — gets its own controller.
   * @param {HTMLElement} target
   */
  #prepareTarget(target) {
    if (!target.hasAttribute('data-highlights-init')) {
      target.setAttribute('data-highlights', this.getAttribute('storage-key') || '');
      if (this.hasAttribute('colors')) {
        target.setAttribute('data-highlights-colors', this.getAttribute('colors') ?? '');
      }
    }
    for (const key of FORWARDED_LABELS) {
      const value = this.getAttribute(`data-label-${key}`);
      if (value) target.setAttribute(`data-highlights-label-${key}`, value);
    }
    let ctrl = initHighlights(target);
    if (this.hasAttribute('readonly') && !target.hasAttribute('data-highlights-readonly')) {
      // Readonly is read at construction: rebuild an interactive controller.
      target.setAttribute('data-highlights-readonly', '');
      ctrl.destroy();
      ctrl = initHighlights(target);
    }
    return ctrl;
  }

  // --- Standalone mode (programmatic / API-only, no UI) ---

  #setupStandalone() {
    const target = this.#resolveTarget();
    if (!target) return;
    this.#controller = this.#prepareTarget(target);
  }

  /** @returns {HTMLElement | null} */
  #resolveTarget() {
    const forId = this.getAttribute('for');
    if (forId) return document.getElementById(forId);
    return /** @type {HTMLElement | null} */ (this.firstElementChild);
  }

  #getColors() {
    const attr = this.getAttribute('colors');
    const list = attr ? attr.split(',').map(c => c.trim()).filter(c => COLOR_NAME.test(c)) : [];
    return list.length ? [...new Set(list)] : [...DEFAULT_COLORS];
  }

  /** Standalone controller, else the last highlighted (or first) menu target's. */
  #api() {
    if (this.#controller && !this.#controller.destroyed) return this.#controller;
    const target = this.#lastTarget?.isConnected ? this.#lastTarget : this.#menuTargets()[0];
    return target ? this.#prepareTarget(target) : null;
  }

  // --- Public API ---

  /**
   * Highlight the current selection. Defaults to the last-used colour.
   * @param {string} [color]
   */
  highlightSelection(color = this.#lastColor) {
    if (this.hasAttribute('readonly') || !this.#getColors().includes(color)) return;
    this.#selectColor(color);
    if (this.#menu) this.#applyFromMenu(color);
    else this.#controller?._createFromSelection(color);
  }
  getHighlights() { return this.#api()?.getHighlights() ?? []; }
  /** @param {string} id */
  removeHighlight(id) { this.#api()?.removeHighlight(id); }
  clearAll() { this.#api()?.clearAll(); }
  exportHighlights() { return this.#api()?.exportHighlights() ?? '{"version":1,"highlights":[]}'; }
  /** @param {string | object} json */
  importHighlights(json) { return this.#api()?.importHighlights(json) ?? { imported: 0, rejected: 0 }; }
}

registerComponent('highlight-wc', HighlightWC);
