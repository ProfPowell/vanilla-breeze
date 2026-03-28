/**
 * component-sampler: Themed UI element preview grid
 *
 * Renders a grid of native HTML elements (buttons, inputs, selects, etc.)
 * styled by VB's cascade. Theme changes propagate automatically via CSS
 * custom properties — no re-render needed.
 *
 * @attr {string} components - Comma-separated types to render
 *   (default: "button,input,select,checkbox,radio,badge,progress")
 * @attr {string} label - Optional heading
 * @attr {boolean} compact - Reduced spacing
 *
 * @example
 * <component-sampler></component-sampler>
 * <component-sampler components="button,badge,progress" label="Key Components"></component-sampler>
 */
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const COMPONENT_RENDERERS = {
  button: () => `
    <layout-cluster data-layout-gap="s">
      <button>Primary</button>
      <button class="secondary">Secondary</button>
      <button disabled>Disabled</button>
    </layout-cluster>`,

  input: () => `
    <layout-stack data-layout-gap="xs">
      <input type="text" placeholder="Text input" aria-label="Sample text input"/>
      <input type="email" placeholder="email@example.com" aria-label="Sample email"/>
      <input type="text" value="Read only" readonly aria-label="Read-only input"/>
    </layout-stack>`,

  select: () => `
    <select aria-label="Sample select">
      <option>Choose an option</option>
      <option>Option A</option>
      <option>Option B</option>
      <option>Option C</option>
    </select>`,

  checkbox: () => `
    <layout-stack data-layout-gap="xs">
      <label><input type="checkbox" checked="checked"/> Checked option</label>
      <label><input type="checkbox"/> Unchecked option</label>
      <label><input type="checkbox" disabled/> Disabled option</label>
    </layout-stack>`,

  radio: () => `
    <layout-stack data-layout-gap="xs">
      <label><input type="radio" name="sampler-radio" checked="checked"/> Selected</label>
      <label><input type="radio" name="sampler-radio"/> Unselected</label>
      <label><input type="radio" name="sampler-radio" disabled/> Disabled</label>
    </layout-stack>`,

  badge: () => `
    <layout-cluster data-layout-gap="xs">
      <layout-badge>Default</layout-badge>
      <layout-badge data-color="success">Success</layout-badge>
      <layout-badge data-color="warning">Warning</layout-badge>
      <layout-badge data-color="danger">Danger</layout-badge>
      <layout-badge data-color="info">Info</layout-badge>
    </layout-cluster>`,

  progress: () => `
    <layout-stack data-layout-gap="xs">
      <progress value="33" max="100">33%</progress>
      <progress value="66" max="100">66%</progress>
      <progress value="100" max="100">100%</progress>
    </layout-stack>`,

  range: () => `
    <input type="range" min="0" max="100" value="50" aria-label="Sample range"/>`,

  textarea: () => `
    <textarea rows="3" placeholder="Textarea sample" aria-label="Sample textarea" style="width:100%"></textarea>`,
};

class ComponentSampler extends VBElement {
  static observedAttributes = ['components', 'label', 'compact'];

  setup() { this.#render(); }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  #render() {
    const componentsAttr = this.getAttribute('components')
      || 'button,input,select,checkbox,radio,badge,progress';
    const label = this.getAttribute('label') || '';
    const compact = this.hasAttribute('compact');
    const components = componentsAttr.split(',').map(c => c.trim());

    const gap = compact ? '0.75rem' : '1.25rem';
    let html = '';

    if (label) {
      html += `<p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted,#666);margin-block-end:0.75rem;font-family:var(--font-sans,system-ui)">${label}</p>`;
    }

    html += `<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:${gap}">`;

    for (const name of components) {
      const renderer = COMPONENT_RENDERERS[name];
      if (!renderer) continue;

      html += `<article style="border:1px solid var(--color-border,#ddd);border-radius:var(--radius-m,0.5rem);padding:var(--size-m,1rem);background:var(--color-surface,#fff)">
        <p style="font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted,#999);margin-block-end:var(--size-s,0.5rem);font-family:var(--font-sans,system-ui)">${name}</p>
        ${renderer()}
      </article>`;
    }

    html += '</section>';
    this.innerHTML = html;
  }
}

registerComponent('component-sampler', ComponentSampler);
