/**
 * motion-specimen: Design token motion scale display
 *
 * Shows easing curves with animated preview dots, or durations as bars.
 * Use `type="easing"` (default), `type="duration"`, or `type="both"`.
 *
 * Layout styles are inline so the component works without external CSS.
 * styles.css only contains keyframes and prefers-reduced-motion overrides.
 *
 * @attr {string} type - "easing" (default), "duration", or "both"
 * @attr {string} tokens - Comma-separated token names (defaults vary by type)
 * @attr {string} prefix - CSS variable prefix (auto-set from type if omitted)
 * @attr {string} duration - Animation duration for easing previews (default "1.2s")
 * @attr {boolean} show-values - Show computed values (default: true)
 * @attr {string} label - Optional heading label
 */
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const DEFAULT_EASINGS = '1,2,3,4,5,in-1,in-2,in-3,out-1,out-2,out-3,out-4,out-5,elastic-1,elastic-2,squish-1,squish-2';
const DEFAULT_DURATIONS = 'instant,fast,normal,slow,slower';

const KEYFRAMES_ID = 'ms-keyframes';
const KEYFRAMES_CSS = `
@keyframes ms-slide { from { inset-inline-start: 0 } to { inset-inline-start: calc(100% - 1rem) } }
@keyframes ms-fill { 0% { transform: scaleX(0) } 60% { transform: scaleX(1) } 100% { transform: scaleX(1); opacity: 0.3 } }
@media (prefers-reduced-motion: reduce) {
  motion-specimen .ms-dot { animation: none !important; inset-inline-start: calc(50% - 0.5rem) !important }
  motion-specimen .ms-bar-fill { animation: none !important; transform: scaleX(0.6) !important; opacity: 0.6 !important }
}
`;

function ensureKeyframes() {
  if (typeof document === 'undefined' || document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = KEYFRAMES_CSS;
  document.head.append(style);
}

const MONO = 'var(--font-mono, monospace)';
const MUTED = 'var(--color-text-muted, #666)';
const INTERACTIVE = 'var(--color-interactive, oklch(55% 0.2 260))';
const SUNKEN = 'var(--color-surface-sunken, #f1f1f1)';

class MotionSpecimen extends VBElement {
  static observedAttributes = ['type', 'tokens', 'prefix', 'duration', 'show-values', 'label'];

  setup() {
    ensureKeyframes();
    this.#render();
  }

  attributeChangedCallback() {
    if (this.isConnected && this.hasAttribute('data-upgraded')) this.#render();
  }

  #render() {
    const type = this.getAttribute('type') || 'easing';
    const previewDuration = this.getAttribute('duration') || '1.2s';
    const showValues = this.getAttribute('show-values') !== 'false';
    const label = this.getAttribute('label') || '';

    let html = '';
    if (label) html += `<p style="font-weight:600;margin:0 0 var(--size-s,0.75rem)">${label}</p>`;

    if (type === 'easing' || type === 'both') {
      html += this.#renderEasingSection(previewDuration, showValues);
    }
    if (type === 'duration' || type === 'both') {
      if (type === 'both') html += `<div aria-hidden="true" style="block-size:var(--size-m,1rem)"></div>`;
      html += this.#renderDurationSection(showValues);
    }

    this.innerHTML = html;

    if (showValues) {
      requestAnimationFrame(() => this.#fillValues());
    }
  }

  #rowStyle() {
    return `display:grid;grid-template-columns:5rem 1fr auto;align-items:center;gap:var(--size-s,0.75rem);min-block-size:1.75rem`;
  }

  #nameStyle() {
    return `font-family:${MONO};font-size:var(--font-size-sm,0.875rem);color:${MUTED};text-align:end`;
  }

  #valueStyle() {
    return `font-family:${MONO};font-size:var(--font-size-xs,0.75rem);color:${MUTED};font-variant-numeric:tabular-nums;white-space:nowrap`;
  }

  #listStyle() {
    return `list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:var(--size-2xs,0.375rem)`;
  }

  #renderEasingSection(previewDuration, showValues) {
    const names = (this.getAttribute('tokens') || DEFAULT_EASINGS).split(',').map((s) => s.trim());
    const prefix = this.getAttribute('prefix') || '--ease-';
    const trackStyle = `position:relative;display:block;block-size:0.5rem;background:${SUNKEN};border-radius:999px`;
    const dotStyle = `position:absolute;inset-block-start:50%;inset-inline-start:0;inline-size:1rem;block-size:1rem;background:${INTERACTIVE};border-radius:50%;transform:translateY(-50%)`;

    const rows = names.map((name) => {
      const varName = `${prefix}${name}`;
      return `<li class="ms-row ms-row-ease" role="listitem" style="${this.#rowStyle()}">
        <span style="${this.#nameStyle()}">${name}</span>
        <span style="${trackStyle}" aria-hidden="true">
          <span class="ms-dot" style="${dotStyle};animation: ms-slide ${previewDuration} var(${varName}) infinite alternate"></span>
        </span>
        ${showValues ? `<span class="ms-value" data-var="${varName}" style="${this.#valueStyle()}"></span>` : ''}
      </li>`;
    }).join('');
    return `<ul class="ms-list" role="list" aria-label="Easing scale" style="${this.#listStyle()}">${rows}</ul>`;
  }

  #renderDurationSection(showValues) {
    const names = (this.getAttribute('tokens') || DEFAULT_DURATIONS).split(',').map((s) => s.trim());
    const prefix = this.getAttribute('prefix') || '--duration-';
    const barStyle = `position:relative;display:block;block-size:0.5rem;background:${SUNKEN};border-radius:999px;overflow:hidden`;
    const fillStyle = `position:absolute;inset-block:0;inset-inline-start:0;inline-size:100%;background:${INTERACTIVE};transform-origin:left center;animation-name:ms-fill;animation-iteration-count:infinite;animation-timing-function:linear`;

    const rows = names.map((name) => {
      const varName = `${prefix}${name}`;
      return `<li class="ms-row ms-row-dur" role="listitem" style="${this.#rowStyle()}">
        <span style="${this.#nameStyle()}">${name}</span>
        <span style="${barStyle}" aria-hidden="true">
          <span class="ms-bar-fill" style="${fillStyle};animation-duration: var(${varName})"></span>
        </span>
        ${showValues ? `<span class="ms-value" data-var="${varName}" style="${this.#valueStyle()}"></span>` : ''}
      </li>`;
    }).join('');
    return `<ul class="ms-list" role="list" aria-label="Duration scale" style="${this.#listStyle()}">${rows}</ul>`;
  }

  #fillValues() {
    this.querySelectorAll('.ms-value').forEach((el) => {
      const v = el.getAttribute('data-var');
      if (!v) return;
      const computed = getComputedStyle(this).getPropertyValue(v).trim();
      el.textContent = computed || '—';
    });
  }
}

registerComponent('motion-specimen', MotionSpecimen);
