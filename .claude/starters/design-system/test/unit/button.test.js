/**
 * Button Component Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;

// Import component after DOM is set up
import '../../src/primitives/button/button.js';

describe('{{COMPONENT_PREFIX}}-button', () => {
  let button;

  beforeEach(() => {
    button = document.createElement('{{COMPONENT_PREFIX}}-button');
    document.body.appendChild(button);
  });

  afterEach(() => {
    button.remove();
  });

  it('should be defined', () => {
    expect(customElements.get('{{COMPONENT_PREFIX}}-button')).toBeDefined();
  });

  it('should render with default variant', () => {
    const shadowButton = button.shadowRoot.querySelector('button');
    expect(shadowButton).toBeTruthy();
  });

  it('should set disabled attribute', () => {
    button.disabled = true;
    expect(button.hasAttribute('disabled')).toBe(true);

    const shadowButton = button.shadowRoot.querySelector('button');
    expect(shadowButton.disabled).toBe(true);
  });

  it('should set loading state', () => {
    button.loading = true;
    expect(button.hasAttribute('loading')).toBe(true);

    const shadowButton = button.shadowRoot.querySelector('button');
    expect(shadowButton.disabled).toBe(true);
  });

  it('should set button type', () => {
    button.setAttribute('type', 'submit');
    const shadowButton = button.shadowRoot.querySelector('button');
    expect(shadowButton.type).toBe('submit');
  });

  it('should default to type button', () => {
    const shadowButton = button.shadowRoot.querySelector('button');
    expect(shadowButton.type).toBe('button');
  });
});