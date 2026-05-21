/**
 * VBStore — unified client-side storage for Vanilla Breeze components.
 *
 * Static async API over a pluggable backend. Default backend is localStorage.
 * Keys are namespaced (`vb:{namespace}:{key}`); values are wrapped in an
 * envelope `{ data, timestamp }` so `get()` can enforce expiry via maxAge.
 *
 * Async (await) even though localStorage is synchronous — this lets the
 * backend swap to IndexedDB or a network store later without touching
 * component code.
 *
 * @example
 *   import { VBStore } from './lib/vb-store.js';
 *
 *   await VBStore.set('notifications', 'dismissed-v3', { by: 'user' });
 *   const val = await VBStore.get('notifications', 'dismissed-v3');
 *   const fresh = await VBStore.get('consent', 'banner', { maxAge: 365 * 86400_000 });
 *   await VBStore.clear('notifications');
 *   await VBStore.clearAll();
 *
 * Spec: admin/plans/april13-plan/vb-store.md
 */

const PREFIX = 'vb:';

/** @typedef {{ data: unknown, timestamp: number }} Envelope */

/**
 * @typedef {object} Backend
 * @property {(key: string) => Promise<string | null>} getRaw
 * @property {(key: string, value: string) => Promise<void>} setRaw
 * @property {(key: string) => Promise<void>} removeRaw
 * @property {(prefix: string) => Promise<string[]>} keys
 */

/** @returns {Backend} */
function createLocalStorageBackend() {
  const storage = globalThis.localStorage;
  if (!storage) {
    throw new Error('VBStore: localStorage is not available in this environment');
  }
  return {
    async getRaw(key) {
      return storage.getItem(key);
    },
    async setRaw(key, value) {
      storage.setItem(key, value);
    },
    async removeRaw(key) {
      storage.removeItem(key);
    },
    async keys(prefix) {
      const out = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith(prefix)) out.push(k);
      }
      return out;
    },
  };
}

/** @type {Backend | null} */
let backend = null;

function getBackend() {
  if (!backend) backend = createLocalStorageBackend();
  return backend;
}

function fullKey(namespace, key) {
  if (typeof namespace !== 'string' || !namespace) {
    throw new TypeError('VBStore: namespace must be a non-empty string');
  }
  if (typeof key !== 'string' || !key) {
    throw new TypeError('VBStore: key must be a non-empty string');
  }
  return `${PREFIX}${namespace}:${key}`;
}

function namespacePrefix(namespace) {
  if (typeof namespace !== 'string' || !namespace) {
    throw new TypeError('VBStore: namespace must be a non-empty string');
  }
  return `${PREFIX}${namespace}:`;
}

/**
 * @param {string} raw
 * @returns {Envelope | null}
 */
function parseEnvelope(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed.timestamp === 'number') {
      return /** @type {Envelope} */ (parsed);
    }
  } catch {
    /* fall through to null */
  }
  return null;
}

export const VBStore = {
  /**
   * Swap the backend. Testing helper; not intended for normal use.
   * Pass `null` to reset to the default localStorage backend.
   * @param {{ backend?: Backend | null }} [config]
   */
  configure(config = {}) {
    backend = config.backend ?? null;
  },

  /**
   * Persist a value under `namespace:key`. Always stamps a timestamp.
   * @param {string} namespace
   * @param {string} key
   * @param {unknown} value
   */
  async set(namespace, key, value) {
    /** @type {Envelope} */
    const envelope = { data: value, timestamp: Date.now() };
    await getBackend().setRaw(fullKey(namespace, key), JSON.stringify(envelope));
  },

  /**
   * Read a value under `namespace:key`. Returns `null` if missing, unparseable,
   * or older than `options.maxAge` milliseconds.
   * @param {string} namespace
   * @param {string} key
   * @param {{ maxAge?: number }} [options]
   * @returns {Promise<unknown | null>}
   */
  async get(namespace, key, options) {
    const raw = await getBackend().getRaw(fullKey(namespace, key));
    if (raw == null) return null;
    const envelope = parseEnvelope(raw);
    if (!envelope) return null;
    if (options?.maxAge != null && Date.now() - envelope.timestamp > options.maxAge) {
      return null;
    }
    return envelope.data;
  },

  /**
   * Delete a single key.
   * @param {string} namespace
   * @param {string} key
   */
  async remove(namespace, key) {
    await getBackend().removeRaw(fullKey(namespace, key));
  },

  /**
   * List every `{ key, data, timestamp }` entry in a namespace.
   * Unparseable entries are skipped silently.
   * @param {string} namespace
   * @returns {Promise<Array<{ key: string, data: unknown, timestamp: number }>>}
   */
  async list(namespace) {
    const prefix = namespacePrefix(namespace);
    const keys = await getBackend().keys(prefix);
    const out = [];
    for (const full of keys) {
      const raw = await getBackend().getRaw(full);
      if (raw == null) continue;
      const env = parseEnvelope(raw);
      if (!env) continue;
      out.push({ key: full.slice(prefix.length), data: env.data, timestamp: env.timestamp });
    }
    return out;
  },

  /**
   * Remove every key under a namespace.
   * @param {string} namespace
   */
  async clear(namespace) {
    const prefix = namespacePrefix(namespace);
    const keys = await getBackend().keys(prefix);
    for (const k of keys) await getBackend().removeRaw(k);
  },

  /** Remove every `vb:*` key. Leaves unrelated storage alone. */
  async clearAll() {
    const keys = await getBackend().keys(PREFIX);
    for (const k of keys) await getBackend().removeRaw(k);
  },

  /**
   * Persist many entries under the same namespace.
   * @param {string} namespace
   * @param {Array<[string, unknown]>} entries
   */
  async setMany(namespace, entries) {
    for (const [key, value] of entries) {
      await VBStore.set(namespace, key, value);
    }
  },
};
