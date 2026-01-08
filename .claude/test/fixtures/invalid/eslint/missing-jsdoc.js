// Class without JSDoc - should trigger require-jsdoc warning

class UndocumentedComponent extends HTMLElement {
    constructor() {
        super();
    }
}

customElements.define('undocumented-component', UndocumentedComponent);
