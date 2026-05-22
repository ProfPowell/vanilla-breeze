/**
 * semantic-palette: Preview a palette in use as VB semantic roles.
 *
 * Reads colors from a descendant <color-palette> or <palette-generator>
 * (or its own `colors` attribute) and renders one preview card per role —
 * button/link/badge for brand roles, alert/badge/inline for status roles —
 * each with a per-pairing WCAG chip. Editing happens upstream in the palette;
 * this component is a live preview that also exports a theme CSS block.
 *
 * @attr {string} colors - Comma-separated hex palette (fallback when no child source).
 * @attr {string} roles - Comma-separated roles in assignment order. Default: "primary,secondary,accent".
 *                        Valid: primary, secondary, accent, success, warning, error, info.
 * @attr {boolean} show-export - Show Copy Theme CSS / Copy JSON toolbar.
 * @attr {string} label - Optional heading label above the previews.
 *
 * @fires semantic-palette:change - On initial render and every palette update.
 *   detail: { mapping: Record<role,hex>, tokens: string, source }
 */
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { copyText } from '../../utils/copy-init.js';
import {
  hexToOklch,
  oklchToHex,
  formatOklch,
  contrastRatio,
  wcagLevel,
  pickContrastingHex,
  resolveToHex,
} from './_color-math.js';
import { generatePalette } from '../palette-generator/_palette-utils.js';

const BRAND_ROLES = ['primary', 'secondary', 'accent'];
const STATUS_ROLES = ['success', 'warning', 'error', 'info'];
const ALL_ROLES = [...BRAND_ROLES, ...STATUS_ROLES];

const ROLE_LABELS = {
  primary: 'Primary', secondary: 'Secondary', accent: 'Accent',
  success: 'Success', warning: 'Warning', error: 'Error', info: 'Info',
};

const LEVEL_COLORS = {
  aaa:  { bg: 'oklch(92% 0.08 145)', fg: 'oklch(30% 0.12 145)' },
  aa:   { bg: 'oklch(94% 0.08 90)',  fg: 'oklch(35% 0.12 70)' },
  fail: { bg: 'oklch(92% 0.08 25)',  fg: 'oklch(35% 0.15 25)' },
};

const MONO = 'var(--font-mono, monospace)';
const MUTED = 'var(--color-text-muted, #666)';
const BORDER = 'var(--color-border, #ddd)';
const SURFACE = 'var(--color-surface, #fff)';
const TEXT = 'var(--color-text, #222)';
const RADIUS_S = 'var(--radius-s, 0.25rem)';
const RADIUS_M = 'var(--radius-m, 0.5rem)';

class SemanticPalette extends VBElement {
  static observedAttributes = ['colors', 'roles', 'show-export', 'label'];

  /** @type {string[]} */ #colors = [];
  /** @type {string[]} */ #roles = [];
  /** @type {HTMLElement|null} */ #source = null;
  /** @type {HTMLElement|null} */ #previews = null;
  /** @type {HTMLElement|null} */ #probe = null;

  setup() {
    this.#probe = document.createElement('span');
    this.#probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
    this.append(this.#probe);

    this.#source = this.querySelector('color-palette, palette-generator');
    this.#resolveRoles();
    this.#readColors();
    this.#renderShell();
    this.#renderPreviews('init');
    this.#wireSource();
    this.#wireExport();
    this.#emitChange('init');
  }

  attributeChangedCallback(name) {
    if (!this.isConnected || !this.hasAttribute('data-upgraded')) return;
    if (name === 'roles') this.#resolveRoles();
    if (name === 'colors') this.#readColors();
    // Shell (label/export toolbar) can safely re-render; it doesn't contain any picker
    this.#renderShell();
    this.#renderPreviews('attribute');
    this.#wireExport();
    this.#emitChange('attribute');
  }

  teardown() {
    this.#probe?.remove();
    this.#probe = null;
  }

  // ── Source + state ─────────────────────────────────────────────────

  #readColors() {
    // 1. color-palette child
    const cp = this.querySelector('color-palette');
    if (cp) {
      if (typeof /** @type {any} */ (cp).colors !== 'undefined' && /** @type {any} */ (cp).colors.length) {
        this.#colors = /** @type {any} */ (cp).colors.slice();
        return;
      }
      const raw = cp.getAttribute('colors') || '';
      const parsed = raw.split(',').map((s) => s.trim()).filter(Boolean);
      if (parsed.length) { this.#colors = parsed; return; }
    }
    // 2. palette-generator child (derive from seed + harmony)
    const pg = this.querySelector('palette-generator');
    if (pg) {
      const seed = pg.getAttribute('seed')
        || /** @type {HTMLInputElement | null} */ (pg.querySelector('input[type="color"]'))?.value
        || '';
      const harmony = pg.getAttribute('harmony') || 'complementary';
      if (seed) {
        try {
          const { colors } = generatePalette(seed, harmony);
          this.#colors = colors.slice();
          return;
        } catch { /* fall through */ }
      }
    }
    // 3. colors attribute
    const raw = this.getAttribute('colors') || '';
    this.#colors = raw.split(',').map((s) => s.trim()).filter(Boolean);
  }

  #resolveRoles() {
    const raw = this.getAttribute('roles') || BRAND_ROLES.join(',');
    const roles = raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((r) => ALL_ROLES.includes(r));
    this.#roles = roles.length ? roles : [...BRAND_ROLES];
  }

  #mapping() {
    const map = {};
    for (let i = 0; i < this.#roles.length; i++) {
      map[this.#roles[i]] = this.#colors[i] || this.#colors[this.#colors.length - 1] || '#888888';
    }
    return map;
  }

  // ── Render ─────────────────────────────────────────────────────────

  #renderShell() {
    const existing = this.querySelector(':scope > .sp-shell');
    if (existing) existing.remove();

    const label = this.getAttribute('label');
    const showExport = this.hasAttribute('show-export');

    const shell = document.createElement('div');
    shell.className = 'sp-shell';
    shell.style.cssText = 'display:flex;flex-direction:column;gap:var(--size-m,1rem);margin-block-start:var(--size-s,0.75rem)';

    if (label) {
      const p = document.createElement('p');
      p.style.cssText = 'font-weight:600;margin:0';
      p.textContent = label;
      shell.append(p);
    }

    const previews = document.createElement('section');
    previews.className = 'sp-previews';
    previews.setAttribute('aria-label', 'Role previews');
    previews.style.cssText = `display:grid;grid-template-columns:repeat(auto-fill,minmax(min(22rem,100%),1fr));gap:var(--size-m,1rem)`;
    shell.append(previews);
    this.#previews = previews;

    if (showExport) {
      shell.insertAdjacentHTML('beforeend', this.#renderExport());
    }

    this.append(shell);
  }

  #renderPreviews(_source) {
    if (!this.#previews) return;
    const map = this.#mapping();
    this.#previews.innerHTML = this.#roles.map((role) => this.#renderCard(role, map[role])).join('');
  }

  #renderCard(role, hex) {
    const roleLabel = ROLE_LABELS[role] || role;
    const isStatus = STATUS_ROLES.includes(role);
    const samples = isStatus ? this.#renderStatusSamples(role, hex) : this.#renderBrandSamples(role, hex);
    const cardStyle = `display:flex;flex-direction:column;gap:var(--size-s,0.75rem);padding:var(--size-m,1rem);border:1px solid ${BORDER};border-radius:${RADIUS_M};background:${SURFACE};min-inline-size:0`;

    return `<article class="sp-card" data-role="${role}" aria-label="${roleLabel} role preview" style="${cardStyle}">
      <header style="display:flex;align-items:center;justify-content:space-between;gap:var(--size-s,0.75rem)">
        <div>
          <code style="font-family:${MONO};font-size:var(--font-size-sm,0.875rem);font-weight:600">${role}</code>
          <span style="display:block;font-size:var(--font-size-xs,0.75rem);color:${MUTED}">${roleLabel}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span class="sp-swatch" style="display:inline-block;inline-size:1.75rem;block-size:1.75rem;border-radius:${RADIUS_S};border:1px solid oklch(0% 0 0 / 0.15);background:${hex}"></span>
          <code style="font-family:${MONO};font-size:var(--font-size-xs,0.75rem);color:${MUTED}">${hex}</code>
        </div>
      </header>
      <div class="sp-samples" style="display:flex;flex-wrap:wrap;gap:var(--size-s,0.75rem);align-items:flex-start">${samples}</div>
    </article>`;
  }

  #renderBrandSamples(role, hex) {
    const textOnRole = this.#resolveTextOnRole(role, hex);
    const surface = this.#resolveSurface();
    const subtleBg = this.#resolveSubtle(role, hex);
    const subtleFg = this.#darken(hex);

    return [
      this.#sample({
        render: `<button type="button" tabindex="-1" style="all:unset;display:inline-block;padding:0.375rem 0.875rem;border-radius:${RADIUS_S};background:${hex};color:${textOnRole};font-family:inherit;font-size:var(--font-size-sm,0.875rem);font-weight:600;cursor:default">Button</button>`,
        fg: textOnRole, bg: hex, caption: 'On role',
      }),
      this.#sample({
        render: `<span style="color:${hex};background:${surface};padding:0.25rem 0.5rem;border-radius:${RADIUS_S};font-size:var(--font-size-sm,0.875rem);font-weight:500;text-decoration:underline">Linked text</span>`,
        fg: hex, bg: surface || '#ffffff', caption: 'On surface',
      }),
      this.#sample({
        render: `<span style="display:inline-block;padding:0.125rem 0.5rem;border-radius:999px;background:${subtleBg};color:${subtleFg};font-size:var(--font-size-xs,0.75rem);font-weight:600;letter-spacing:0.04em;text-transform:uppercase">Badge</span>`,
        fg: subtleFg, bg: subtleBg, caption: 'Subtle',
      }),
    ].join('');
  }

  #renderStatusSamples(role, hex) {
    const surface = this.#resolveSurface();
    const subtleBg = this.#resolveStatusSubtle(role, hex);
    const statusText = this.#resolveStatusText(role, hex);
    const onRole = pickContrastingHex(hex);

    return [
      this.#sample({
        render: `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;border-radius:${RADIUS_S};background:${subtleBg};color:${statusText};border:1px solid ${hex};font-size:var(--font-size-sm,0.875rem);max-inline-size:100%">
          <span style="display:inline-block;inline-size:0.5rem;block-size:0.5rem;border-radius:50%;background:${hex};flex-shrink:0"></span>
          <span><strong>${ROLE_LABELS[role] || role}</strong> — message text</span>
        </div>`,
        fg: statusText, bg: subtleBg, caption: 'Alert',
      }),
      this.#sample({
        render: `<span style="display:inline-block;padding:0.125rem 0.5rem;border-radius:999px;background:${hex};color:${onRole};font-size:var(--font-size-xs,0.75rem);font-weight:700;letter-spacing:0.04em;text-transform:uppercase">${role}</span>`,
        fg: onRole, bg: hex, caption: 'Badge',
      }),
      this.#sample({
        render: `<span style="color:${hex};background:${surface};padding:0.25rem 0.5rem;border-radius:${RADIUS_S};font-size:var(--font-size-sm,0.875rem);font-weight:600">Inline status</span>`,
        fg: hex, bg: surface || '#ffffff', caption: 'On surface',
      }),
    ].join('');
  }

  #sample({ render, fg, bg, caption }) {
    const fgHex = resolveToHex(fg, this.#probe || undefined) || '#000000';
    const bgHex = resolveToHex(bg, this.#probe || undefined) || '#ffffff';
    const ratio = contrastRatio(fgHex, bgHex);
    const level = wcagLevel(ratio).toLowerCase();
    const lc = LEVEL_COLORS[level];
    const chipStyle = `display:inline-flex;align-items:center;gap:0.25rem;padding:0.125rem 0.375rem;border-radius:${RADIUS_S};font-family:${MONO};font-size:var(--font-size-xs,0.75rem);background:${lc.bg};color:${lc.fg}`;
    return `<div style="display:flex;flex-direction:column;gap:0.25rem;align-items:flex-start;min-inline-size:0;max-inline-size:100%">
      <div style="max-inline-size:100%">${render}</div>
      <div style="display:flex;align-items:center;gap:0.375rem;font-size:var(--font-size-xs,0.75rem);color:${MUTED}">
        <span style="${chipStyle}" title="${caption}: ${ratio.toFixed(2)}:1">${ratio.toFixed(2)} <small>${level.toUpperCase()}</small></span>
        <span>${caption}</span>
      </div>
    </div>`;
  }

  #renderExport() {
    const toolbar = `display:flex;gap:var(--size-2xs,0.375rem);padding-block-start:var(--size-xs,0.5rem);border-block-start:1px solid ${BORDER}`;
    const btn = `padding:0.375rem 0.875rem;border:1px solid ${BORDER};border-radius:${RADIUS_S};background:${SURFACE};color:${TEXT};cursor:pointer;font:inherit;font-size:var(--font-size-sm,0.875rem)`;
    return `<div class="sp-export" role="toolbar" aria-label="Export semantic palette" style="${toolbar}">
      <button type="button" class="sp-copy-css" style="${btn}">Copy Theme CSS</button>
      <button type="button" class="sp-copy-json" style="${btn}">Copy JSON</button>
    </div>`;
  }

  // ── Wiring ─────────────────────────────────────────────────────────

  #wireSource() {
    // color-palette edit events
    const cp = this.querySelector('color-palette');
    if (cp) {
      this.listen(cp, 'color-palette:change', () => {
        this.#readColors();
        this.#renderPreviews('palette');
        this.#emitChange('palette');
      });
    }
    // palette-generator (legacy path — still supported)
    const pg = this.querySelector('palette-generator');
    if (pg) {
      this.listen(pg, 'palette-generator:generate', () => {
        this.#readColors();
        this.#renderPreviews('palette');
        this.#emitChange('palette');
      });
    }
  }

  #wireExport() {
    const cssBtn = this.querySelector('.sp-copy-css');
    const jsonBtn = this.querySelector('.sp-copy-json');
    if (cssBtn) {
      this.listen(cssBtn, 'click', () => {
        copyText(this.#buildCSS(), {
          button: /** @type {HTMLElement} */ (cssBtn),
          announceMessage: 'Theme CSS copied',
        });
      });
    }
    if (jsonBtn) {
      this.listen(jsonBtn, 'click', () => {
        copyText(JSON.stringify(this.#mapping(), null, 2), {
          button: /** @type {HTMLElement} */ (jsonBtn),
          announceMessage: 'JSON copied',
        });
      });
    }
  }

  // ── Token resolution ───────────────────────────────────────────────

  #cs() { return getComputedStyle(this); }

  #resolveSurface() {
    return this.#cs().getPropertyValue('--color-surface').trim() || '#ffffff';
  }

  #resolveTextOnRole(role, fallbackHex) {
    const explicit = this.#cs().getPropertyValue(`--color-text-on-${role}`).trim();
    return explicit || pickContrastingHex(fallbackHex);
  }

  #resolveSubtle(role, fallbackHex) {
    const explicit = this.#cs().getPropertyValue(`--color-${role}-subtle`).trim();
    if (explicit) return explicit;
    const { h } = hexToOklch(fallbackHex);
    return oklchToHex(0.95, 0.03, h);
  }

  #resolveStatusSubtle(role, fallbackHex) {
    const explicit = this.#cs().getPropertyValue(`--color-${role}-subtle`).trim();
    if (explicit) return explicit;
    const { h } = hexToOklch(fallbackHex);
    return oklchToHex(0.94, 0.05, h);
  }

  #resolveStatusText(role, fallbackHex) {
    const explicit = this.#cs().getPropertyValue(`--color-${role}-text`).trim();
    if (explicit) return explicit;
    const { h } = hexToOklch(fallbackHex);
    return oklchToHex(0.3, 0.14, h);
  }

  #darken(hex) {
    const { l, c, h } = hexToOklch(hex);
    return oklchToHex(Math.max(0.2, l - 0.25), c, h);
  }

  // ── Export + emit ──────────────────────────────────────────────────

  #buildCSS() {
    const map = this.#mapping();
    const brand = [];
    const status = [];
    for (const role of this.#roles) {
      const hex = map[role];
      if (!hex) continue;
      const { l, c, h } = hexToOklch(hex);
      if (BRAND_ROLES.includes(role)) {
        brand.push(
          `  --hue-${role}: ${h.toFixed(1)};`,
          `  --lightness-${role}: ${(l * 100).toFixed(1)}%;`,
          `  --chroma-${role}: ${c.toFixed(3)};`,
        );
      } else {
        status.push(`  --color-${role}: ${formatOklch({ l, c, h })};`);
      }
    }
    const parts = [];
    if (brand.length) parts.push('  /* Brand seeds */', ...brand);
    if (status.length) {
      if (brand.length) parts.push('');
      parts.push('  /* Status colors */', ...status);
    }
    return `:root {\n${parts.join('\n')}\n}\n`;
  }

  #emitChange(source) {
    this.dispatchEvent(new CustomEvent('semantic-palette:change', {
      bubbles: true,
      detail: { mapping: this.#mapping(), tokens: this.#buildCSS(), source },
    }));
  }
}

registerComponent('semantic-palette', SemanticPalette);
