# Add Storage Command

Generate a client-side storage wrapper module for localStorage, IndexedDB, or SQLite WASM.

## Usage

```
/add-storage [type]
```

## Arguments

- `$ARGUMENTS` - Storage type: `local` (default), `idb`, `sqlite`

## Examples

```
/add-storage
/add-storage local
/add-storage idb
/add-storage sqlite
```

## Generated Files

### local (localStorage)

Creates `src/lib/storage.js`:

```javascript
/**
 * Type-safe localStorage wrapper with JSON serialization
 */
export const storage = {
  /**
   * Get value from storage
   * @template T
   * @param {string} key - Storage key
   * @param {T} defaultValue - Default if not found
   * @returns {T}
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  /**
   * Set value in storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded');
        this.cleanup();
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
  },

  /**
   * Remove value from storage
   * @param {string} key
   */
  remove(key) {
    localStorage.removeItem(key);
  },

  /**
   * Clear all storage
   */
  clear() {
    localStorage.clear();
  },

  /**
   * Get all keys with prefix
   * @param {string} prefix
   * @returns {string[]}
   */
  keys(prefix = '') {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) keys.push(key);
    }
    return keys;
  },

  /**
   * Cleanup expired items
   */
  cleanup() {
    const now = Date.now();
    for (const key of this.keys()) {
      const item = this.get(key);
      if (item?.expiresAt && item.expiresAt < now) {
        this.remove(key);
      }
    }
  }
};
```

### idb (IndexedDB)

Creates `src/lib/idb-store.js`:

```javascript
/**
 * Simple IndexedDB wrapper
 */
export class IDBStore {
  constructor(dbName, storeName, version = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
    this.db = null;
  }

  async open() {
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
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async get(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const request = tx.objectStore(this.storeName).get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAll() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const request = tx.objectStore(this.storeName).getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async put(item) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const request = tx.objectStore(this.storeName).put(item);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const request = tx.objectStore(this.storeName).delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const request = tx.objectStore(this.storeName).clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}
```

### sqlite (SQLite WASM)

Creates `src/lib/sqlite-db.js`:

```javascript
/**
 * SQLite WASM wrapper using sql.js
 */
import initSqlJs from 'sql.js';

let SQL = null;

async function initSQL() {
  if (SQL) return;
  SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });
}

export class SQLiteDB {
  constructor(name) {
    this.name = name;
    this.db = null;
  }

  async open() {
    await initSQL();
    const stored = await this.loadFromStorage();
    this.db = stored ? new SQL.Database(stored) : new SQL.Database();
  }

  exec(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  run(sql, params = []) {
    this.db.run(sql, params);
  }

  async save() {
    const data = this.db.export();
    localStorage.setItem(`sqlite-${this.name}`, JSON.stringify(Array.from(data)));
  }

  async loadFromStorage() {
    const stored = localStorage.getItem(`sqlite-${this.name}`);
    return stored ? new Uint8Array(JSON.parse(stored)) : null;
  }

  close() {
    this.db?.close();
    this.db = null;
  }
}
```

**Also adds to package.json:**

```json
{
  "dependencies": {
    "sql.js": "^1.10.0"
  }
}
```

## Steps to Execute

### 1. Determine Output Path

Check if `src/lib/` exists, create if not.

### 2. Generate Storage Module

Based on type argument, generate the appropriate file.

### 3. Add Dependencies (sqlite only)

For sqlite type, add sql.js to package.json.

### 4. Output Summary

```
Created storage module: src/lib/[file]

Usage:
  import { storage } from './lib/storage.js';

  storage.set('user', { name: 'John' });
  const user = storage.get('user');
```

## Choosing Storage Type

| Type | Best For | Limit |
|------|----------|-------|
| `local` | Settings, small data | ~5MB |
| `idb` | Larger datasets, offline | ~50MB+ |
| `sqlite` | Complex queries, relational | ~50MB+ |

## Notes

- localStorage wrapper includes quota handling
- IndexedDB store uses simple key-value with id
- SQLite requires sql.js dependency
- All modules follow data-storage skill patterns
