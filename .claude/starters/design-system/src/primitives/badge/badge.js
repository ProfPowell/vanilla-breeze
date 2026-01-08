/**
 * Badge Component
 * A small label for status, counts, or categories
 *
 * @element {{COMPONENT_PREFIX}}-badge
 * @attr {string} variant - Visual style: default, primary, success, warning, error, info
 * @attr {string} size - Badge size: sm, md, lg
 * @attr {boolean} pill - Rounded pill shape
 * @attr {boolean} dot - Shows as a dot indicator only
 *
 * @slot - Badge content
 *
 * @csspart badge - The badge element
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
    }

    :host([hidden]) {
      display: none;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--{{COMPONENT_PREFIX}}-space-1);
      font-family: var(--{{COMPONENT_PREFIX}}-font-sans);
      font-weight: var(--{{COMPONENT_PREFIX}}-font-weight-medium);
      line-height: 1;
      white-space: nowrap;
      border-radius: var(--{{COMPONENT_PREFIX}}-radius-md);
    }

    /* Sizes */
    :host([size="sm"]) .badge {
      padding: var(--{{COMPONENT_PREFIX}}-space-1) var(--{{COMPONENT_PREFIX}}-space-2);
      font-size: var(--{{COMPONENT_PREFIX}}-font-size-xs);
    }

    .badge,
    :host([size="md"]) .badge {
      padding: var(--{{COMPONENT_PREFIX}}-space-1) var(--{{COMPONENT_PREFIX}}-space-3);
      font-size: var(--{{COMPONENT_PREFIX}}-font-size-sm);
    }

    :host([size="lg"]) .badge {
      padding: var(--{{COMPONENT_PREFIX}}-space-2) var(--{{COMPONENT_PREFIX}}-space-4);
      font-size: var(--{{COMPONENT_PREFIX}}-font-size-base);
    }

    /* Pill shape */
    :host([pill]) .badge {
      border-radius: var(--{{COMPONENT_PREFIX}}-radius-full);
    }

    /* Variants */
    .badge,
    :host([variant="default"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-gray-100);
      color: var(--{{COMPONENT_PREFIX}}-color-text);
    }

    :host([variant="primary"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-primary-lighter);
      color: var(--{{COMPONENT_PREFIX}}-color-primary-dark);
    }

    :host([variant="success"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-success-light);
      color: var(--{{COMPONENT_PREFIX}}-color-success);
    }

    :host([variant="warning"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-warning-light);
      color: color-mix(in oklch, var(--{{COMPONENT_PREFIX}}-color-warning) 70%, black);
    }

    :host([variant="error"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-error-light);
      color: var(--{{COMPONENT_PREFIX}}-color-error);
    }

    :host([variant="info"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-info-light);
      color: var(--{{COMPONENT_PREFIX}}-color-info);
    }

    /* Solid variants */
    :host([solid][variant="primary"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-primary);
      color: var(--{{COMPONENT_PREFIX}}-color-text-inverse);
    }

    :host([solid][variant="success"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-success);
      color: var(--{{COMPONENT_PREFIX}}-color-text-inverse);
    }

    :host([solid][variant="warning"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-warning);
      color: var(--{{COMPONENT_PREFIX}}-color-gray-900);
    }

    :host([solid][variant="error"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-error);
      color: var(--{{COMPONENT_PREFIX}}-color-text-inverse);
    }

    :host([solid][variant="info"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-info);
      color: var(--{{COMPONENT_PREFIX}}-color-text-inverse);
    }

    /* Dot mode */
    :host([dot]) .badge {
      width: 0.5rem;
      height: 0.5rem;
      padding: 0;
      border-radius: var(--{{COMPONENT_PREFIX}}-radius-full);
    }

    :host([dot]) ::slotted(*) {
      display: none;
    }

    :host([dot][size="sm"]) .badge {
      width: 0.375rem;
      height: 0.375rem;
    }

    :host([dot][size="lg"]) .badge {
      width: 0.75rem;
      height: 0.75rem;
    }

    :host([dot][variant="default"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-gray-400);
    }

    :host([dot][variant="primary"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-primary);
    }

    :host([dot][variant="success"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-success);
    }

    :host([dot][variant="warning"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-warning);
    }

    :host([dot][variant="error"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-error);
    }

    :host([dot][variant="info"]) .badge {
      background-color: var(--{{COMPONENT_PREFIX}}-color-info);
    }
  </style>

  <span class="badge" part="badge">
    <slot></slot>
  </span>
`;

class DsBadge extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define('{{COMPONENT_PREFIX}}-badge', DsBadge);

export { DsBadge };