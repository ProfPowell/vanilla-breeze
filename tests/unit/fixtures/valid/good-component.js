/**
 * @class GoodComponent
 * @augments HTMLElement
 * @description A well-structured test component demonstrating proper patterns
 * @fires good-component-update - Fired when the component state changes
 */
class GoodComponent extends HTMLElement {
    static get observedAttributes() {
        return ['lang', 'value'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    /**
     * @readonly
     * @returns {string} Current language code
     */
    get lang() {
        return this.getAttribute('lang') ||
               this.closest('[lang]')?.getAttribute('lang') ||
               document.documentElement.lang ||
               'en';
    }

    /**
     * Renders the component
     * @private
     */
    render() {
        if (!this.shadowRoot) return;
        const value = this.getAttribute('value') || '';
        this.shadowRoot.innerHTML = `<div>${value}</div>`;
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }
}

customElements.define('good-component', GoodComponent);

export { GoodComponent };
