/**
 * Form Storage Library
 * Handles data persistence for form responses
 * @module lib/storage
 */

/**
 * Storage adapter interface
 */
class StorageAdapter {
  async save(formId, data) { throw new Error('Not implemented'); }
  async get(formId, responseId) { throw new Error('Not implemented'); }
  async getAll(formId) { throw new Error('Not implemented'); }
  async delete(formId, responseId) { throw new Error('Not implemented'); }
  async query(formId, options) { throw new Error('Not implemented'); }
}

/**
 * localStorage Storage Adapter
 */
class LocalStorageAdapter extends StorageAdapter {
  constructor() {
    super();
    this.prefix = 'form-builder-';
  }

  getKey(formId) {
    return `${this.prefix}${formId}`;
  }

  async save(formId, data) {
    const responses = await this.getAll(formId);
    const response = {
      id: crypto.randomUUID(),
      data,
      createdAt: new Date().toISOString()
    };
    responses.push(response);
    localStorage.setItem(this.getKey(formId), JSON.stringify(responses));
    return response;
  }

  async get(formId, responseId) {
    const responses = await this.getAll(formId);
    return responses.find(r => r.id === responseId) || null;
  }

  async getAll(formId) {
    const data = localStorage.getItem(this.getKey(formId));
    return data ? JSON.parse(data) : [];
  }

  async delete(formId, responseId) {
    const responses = await this.getAll(formId);
    const filtered = responses.filter(r => r.id !== responseId);
    localStorage.setItem(this.getKey(formId), JSON.stringify(filtered));
    return true;
  }

  async query(formId, options = {}) {
    let responses = await this.getAll(formId);

    // Filter
    if (options.where) {
      responses = responses.filter(r => {
        return Object.entries(options.where).every(([key, value]) => {
          const fieldValue = key.includes('.')
            ? key.split('.').reduce((obj, k) => obj?.[k], r)
            : r.data[key];
          return fieldValue === value;
        });
      });
    }

    // Date range
    if (options.from) {
      responses = responses.filter(r => new Date(r.createdAt) >= new Date(options.from));
    }
    if (options.to) {
      responses = responses.filter(r => new Date(r.createdAt) <= new Date(options.to));
    }

    // Sort
    if (options.orderBy) {
      const desc = options.orderBy.startsWith('-');
      const field = desc ? options.orderBy.slice(1) : options.orderBy;
      responses.sort((a, b) => {
        const aVal = field === 'createdAt' ? a.createdAt : a.data[field];
        const bVal = field === 'createdAt' ? b.createdAt : b.data[field];
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return desc ? -cmp : cmp;
      });
    }

    // Pagination
    if (options.limit) {
      const offset = options.offset || 0;
      responses = responses.slice(offset, offset + options.limit);
    }

    return responses;
  }
}

/**
 * IndexedDB Storage Adapter
 */
class IndexedDBAdapter extends StorageAdapter {
  constructor() {
    super();
    this.dbName = 'form-builder';
    this.version = 1;
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('responses')) {
          const store = db.createObjectStore('responses', { keyPath: 'id' });
          store.createIndex('formId', 'formId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async save(formId, data) {
    await this.init();

    const response = {
      id: crypto.randomUUID(),
      formId,
      data,
      createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['responses'], 'readwrite');
      const store = tx.objectStore('responses');
      const request = store.add(response);

      request.onsuccess = () => resolve(response);
      request.onerror = () => reject(request.error);
    });
  }

  async get(formId, responseId) {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['responses'], 'readonly');
      const store = tx.objectStore('responses');
      const request = store.get(responseId);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result && result.formId === formId ? result : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(formId) {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['responses'], 'readonly');
      const store = tx.objectStore('responses');
      const index = store.index('formId');
      const request = index.getAll(formId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(formId, responseId) {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['responses'], 'readwrite');
      const store = tx.objectStore('responses');
      const request = store.delete(responseId);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async query(formId, options = {}) {
    // Get all and filter in memory (for simplicity)
    // Production apps should use cursor-based filtering
    let responses = await this.getAll(formId);

    if (options.where) {
      responses = responses.filter(r => {
        return Object.entries(options.where).every(([key, value]) => {
          return r.data[key] === value;
        });
      });
    }

    if (options.from) {
      responses = responses.filter(r => new Date(r.createdAt) >= new Date(options.from));
    }
    if (options.to) {
      responses = responses.filter(r => new Date(r.createdAt) <= new Date(options.to));
    }

    if (options.orderBy) {
      const desc = options.orderBy.startsWith('-');
      const field = desc ? options.orderBy.slice(1) : options.orderBy;
      responses.sort((a, b) => {
        const aVal = a[field] || a.data[field];
        const bVal = b[field] || b.data[field];
        return desc ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
      });
    }

    if (options.limit) {
      responses = responses.slice(options.offset || 0, (options.offset || 0) + options.limit);
    }

    return responses;
  }
}

/**
 * API Storage Adapter
 */
class APIAdapter extends StorageAdapter {
  constructor(baseUrl) {
    super();
    this.baseUrl = baseUrl || '/api/forms';
  }

  async save(formId, data) {
    const response = await fetch(`${this.baseUrl}/${formId}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to save: ${response.status}`);
    }

    return response.json();
  }

  async get(formId, responseId) {
    const response = await fetch(`${this.baseUrl}/${formId}/responses/${responseId}`);
    if (!response.ok) return null;
    return response.json();
  }

  async getAll(formId) {
    const response = await fetch(`${this.baseUrl}/${formId}/responses`);
    if (!response.ok) return [];
    return response.json();
  }

  async delete(formId, responseId) {
    const response = await fetch(`${this.baseUrl}/${formId}/responses/${responseId}`, {
      method: 'DELETE'
    });
    return response.ok;
  }

  async query(formId, options = {}) {
    const params = new URLSearchParams();
    if (options.where) params.set('where', JSON.stringify(options.where));
    if (options.from) params.set('from', options.from);
    if (options.to) params.set('to', options.to);
    if (options.orderBy) params.set('orderBy', options.orderBy);
    if (options.limit) params.set('limit', options.limit);
    if (options.offset) params.set('offset', options.offset);

    const response = await fetch(`${this.baseUrl}/${formId}/responses?${params}`);
    if (!response.ok) return [];
    return response.json();
  }
}

/**
 * Form Storage Factory
 */
export class FormStorage {
  /**
   * @param {string} type - Storage type: localStorage, indexeddb, api
   * @param {Object} options - Storage options
   */
  constructor(type = 'localStorage', options = {}) {
    switch (type) {
      case 'indexeddb':
        this.adapter = new IndexedDBAdapter();
        break;
      case 'api':
        this.adapter = new APIAdapter(options.baseUrl);
        break;
      case 'localStorage':
      default:
        this.adapter = new LocalStorageAdapter();
    }
  }

  save(formId, data) {
    return this.adapter.save(formId, data);
  }

  get(formId, responseId) {
    return this.adapter.get(formId, responseId);
  }

  getAll(formId) {
    return this.adapter.getAll(formId);
  }

  delete(formId, responseId) {
    return this.adapter.delete(formId, responseId);
  }

  query(formId, options) {
    return this.adapter.query(formId, options);
  }
}