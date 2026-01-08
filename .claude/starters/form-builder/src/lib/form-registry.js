/**
 * Form Registry
 * Manages form schema discovery and loading
 * @module lib/form-registry
 */

// Import form schemas statically (Vite will handle this)
// In production, you could load these dynamically

const formModules = import.meta.glob('../forms/*.json', { eager: true });

/**
 * Form Registry class
 */
export class FormRegistry {
  static forms = new Map();
  static initialized = false;

  /**
   * Initialize the registry by loading all form schemas
   */
  static async init() {
    if (this.initialized) return;

    // Load forms from the glob import
    for (const [path, module] of Object.entries(formModules)) {
      const schema = module.default || module;
      if (schema && schema.id) {
        this.forms.set(schema.id, schema);
      }
    }

    this.initialized = true;
  }

  /**
   * Get all registered forms
   * @returns {Promise<Array>}
   */
  static async getAll() {
    await this.init();
    return Array.from(this.forms.values());
  }

  /**
   * Get a form by ID
   * @param {string} id - Form ID
   * @returns {Promise<Object|null>}
   */
  static async get(id) {
    await this.init();
    return this.forms.get(id) || null;
  }

  /**
   * Register a form schema
   * @param {Object} schema - Form schema
   */
  static register(schema) {
    if (!schema.id) {
      throw new Error('Form schema must have an id');
    }
    this.forms.set(schema.id, schema);
  }

  /**
   * Unregister a form
   * @param {string} id - Form ID
   */
  static unregister(id) {
    this.forms.delete(id);
  }

  /**
   * Check if a form exists
   * @param {string} id - Form ID
   * @returns {boolean}
   */
  static has(id) {
    return this.forms.has(id);
  }
}