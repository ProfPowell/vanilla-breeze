/**
 * VBRecord — Mixin for "single record" components (work-item, user-story,
 * date-picker config, chart-wc config, etc.).
 *
 * Subclass declares `static dataSchema`:
 *
 *   static dataSchema = {
 *     title:    { attr: 'title',    type: 'string' },
 *     priority: { attr: 'priority', type: 'string' },
 *     estimate: { attr: 'estimate', type: 'number' },
 *     done:     { attr: 'done',     type: 'boolean' },
 *   };
 *
 * Provides:
 *   .data  getter/setter — assignment is idempotent and reflects to attributes.
 *   <element>:data-changed event with { data, source: 'property' | 'attribute' }.
 *   observedAttributes derived from the schema (merged with any base list).
 *
 * Attribute is the *out* mirror of the property; the property is canonical.
 * Setting `.data = {...}` updates attributes for CSS / DevTools / SSR diff.
 * Direct attribute mutation flows back into `.data` and emits 'attribute' source.
 *
 * Field reflection mode (per schema entry):
 *   reflect: 'always' (default) — always reflect to attribute on .data set.
 *   reflect: 'whenSet'           — only reflect when value is non-null/undefined.
 *   reflect: 'never'             — property only; never touches the attribute.
 */

const COERCERS = {
  string: (v) => v == null ? v : String(v),
  number: (v) => v == null ? v : Number(v),
  boolean: (v) => {
    if (v == null) return v;
    if (typeof v === 'boolean') return v;
    return v !== 'false' && v !== '0' && v !== '';
  },
};

function shallowEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (a[k] !== b[k]) return false;
  return true;
}

/**
 * @template {new (...args: any[]) => HTMLElement} TBase
 * @param {TBase} Base
 */
export function VBRecord(Base) {
  const BaseAny = /** @type {any} */ (Base);
  return class extends BaseAny {
    static get observedAttributes() {
      const self = /** @type {any} */ (this);
      const schema = self.dataSchema || {};
      const fromSchema = Object.values(schema).map(f => /** @type {any} */ (f).attr).filter(Boolean);
      const fromBase = /** @type {any} */ (Base).observedAttributes || [];
      return [...new Set([...fromBase, ...fromSchema])];
    }

    /** @type {Record<string, unknown> | null} */
    #data = null;
    #suppressReflect = false;

    /** @returns {Record<string, unknown>} */
    get data() {
      return this.#data ?? this.#dataFromAttributes();
    }

    set data(value) {
      const next = value || {};
      if (shallowEqual(this.#data, next)) return;
      this.#data = { ...next };
      this.#reflectToAttributes(this.#data);
      this.#emitDataChanged('property');
    }

    /**
     * @param {string} name
     * @param {string|null} oldVal
     * @param {string|null} newVal
     */
    attributeChangedCallback(name, oldVal, newVal) {
      if (this.#suppressReflect) {
        if (super.attributeChangedCallback) super.attributeChangedCallback(name, oldVal, newVal);
        return;
      }
      if (oldVal === newVal) {
        if (super.attributeChangedCallback) super.attributeChangedCallback(name, oldVal, newVal);
        return;
      }

      const schema = /** @type {any} */ (this.constructor).dataSchema || {};
      for (const [key, field] of Object.entries(schema)) {
        const f = /** @type {any} */ (field);
        if (f.attr !== name) continue;
        const coerce = COERCERS[/** @type {keyof typeof COERCERS} */ (f.type)] || COERCERS.string;
        if (this.#data == null) this.#data = {};
        if (newVal == null) {
          delete this.#data[key];
        } else {
          this.#data[key] = coerce(newVal);
        }
        this.#emitDataChanged('attribute');
        break;
      }

      if (super.attributeChangedCallback) super.attributeChangedCallback(name, oldVal, newVal);
    }

    /** @param {Record<string, unknown>} data */
    #reflectToAttributes(data) {
      this.#suppressReflect = true;
      try {
        const schema = /** @type {any} */ (this.constructor).dataSchema || {};
        for (const [key, field] of Object.entries(schema)) {
          const f = /** @type {any} */ (field);
          if (f.reflect === 'never') continue;
          const value = data?.[key];
          if (value == null) {
            this.removeAttribute(f.attr);
          } else if (f.type === 'boolean') {
            if (value) this.setAttribute(f.attr, '');
            else this.removeAttribute(f.attr);
          } else {
            this.setAttribute(f.attr, String(value));
          }
        }
      } finally {
        this.#suppressReflect = false;
      }
    }

    #dataFromAttributes() {
      const schema = /** @type {any} */ (this.constructor).dataSchema || {};
      /** @type {Record<string, unknown>} */
      const obj = {};
      for (const [key, field] of Object.entries(schema)) {
        const f = /** @type {any} */ (field);
        if (!this.hasAttribute(f.attr)) continue;
        const coerce = COERCERS[/** @type {keyof typeof COERCERS} */ (f.type)] || COERCERS.string;
        obj[key] = f.type === 'boolean' ? true : coerce(this.getAttribute(f.attr));
      }
      return obj;
    }

    /** @param {string} source */
    #emitDataChanged(source) {
      this.dispatchEvent(new CustomEvent(`${this.localName}:data-changed`, {
        detail: { data: this.data, source },
        bubbles: true,
      }));
    }
  };
}
