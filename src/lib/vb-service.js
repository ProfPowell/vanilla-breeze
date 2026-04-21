/**
 * VBService — fetch abstraction for JSON API data.
 *
 * Components instantiate by role name and call CRUD verbs; URL resolution
 * goes through `VBService.resolve(role)` so sites can override endpoints
 * centrally. Independent of html-star (which transports HTML fragments);
 * both can be used in the same page.
 *
 * @example
 *   import { VBService, VBServiceError } from './lib/vb-service.js';
 *
 *   VBService.configure({
 *     baseUrl: '/go',
 *     headers: { 'X-App': 'vanilla-breeze' },
 *     services: { ai: 'https://api.openai.com/v1' },
 *   });
 *
 *   const notify = new VBService('notify');
 *   const messages = await notify.get('/messages', { page: 2 });
 *   await notify.post('/read', { ids: ['msg-1'] });
 *
 * Spec: admin/r-n-d/april13-plan/vb-service.md
 */

/** @type {{ baseUrl: string, headers: Record<string, string>, services: Record<string, string> }} */
let config = {
  baseUrl: '/go',
  headers: {},
  services: {},
};

/** Non-2xx responses throw a VBServiceError with a consistent shape. */
export class VBServiceError extends Error {
  /**
   * @param {number} status
   * @param {unknown} body
   * @param {string} role
   * @param {string} path
   */
  constructor(status, body, role, path) {
    super(`VBService(${role}): ${status} ${path}`);
    this.name = 'VBServiceError';
    this.status = status;
    this.body = body;
    this.role = role;
    this.path = path;
  }
}

/**
 * @param {URLSearchParams | null} search
 * @param {Record<string, string | number | boolean> | undefined} params
 */
function appendParams(search, params) {
  if (!params) return search;
  const out = search ?? new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    out.set(k, String(v));
  }
  return out;
}

/**
 * @param {Response} response
 */
async function parseResponseBody(response) {
  const ct = response.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    try { return await response.json(); } catch { return null; }
  }
  try { return await response.text(); } catch { return null; }
}

export class VBService {
  /**
   * Set global defaults. Merges over prior configuration; unspecified keys
   * keep their previous values.
   * @param {Partial<{ baseUrl: string, headers: Record<string, string>, services: Record<string, string> }>} next
   */
  static configure(next = {}) {
    config = {
      baseUrl: next.baseUrl ?? config.baseUrl,
      headers: { ...config.headers, ...(next.headers ?? {}) },
      services: { ...config.services, ...(next.services ?? {}) },
    };
  }

  /**
   * Resolve a service role to a base URL. Override > baseUrl + role > /go/role.
   * @param {string} role
   * @returns {string}
   */
  static resolve(role) {
    if (!role || typeof role !== 'string') {
      throw new TypeError('VBService: role must be a non-empty string');
    }
    if (config.services[role]) return stripTrailingSlash(config.services[role]);
    if (config.baseUrl) return `${stripTrailingSlash(config.baseUrl)}/${role}`;
    return `/go/${role}`;
  }

  /**
   * Reset to defaults. Testing helper.
   */
  static _reset() {
    config = { baseUrl: '/go', headers: {}, services: {} };
  }

  /** @param {string} role */
  constructor(role) {
    if (!role || typeof role !== 'string') {
      throw new TypeError('VBService: role must be a non-empty string');
    }
    this.role = role;
  }

  /**
   * GET request. Appends params as a query string.
   * @param {string} path
   * @param {Record<string, string | number | boolean>} [params]
   */
  async get(path, params) {
    return this.#send('GET', path, { params });
  }

  /**
   * POST JSON body.
   * @param {string} path
   * @param {unknown} [body]
   */
  async post(path, body) {
    return this.#send('POST', path, { body });
  }

  /**
   * PATCH JSON body.
   * @param {string} path
   * @param {unknown} [body]
   */
  async patch(path, body) {
    return this.#send('PATCH', path, { body });
  }

  /**
   * DELETE request.
   * @param {string} path
   */
  async delete(path) {
    return this.#send('DELETE', path, {});
  }

  /**
   * @param {string} method
   * @param {string} path
   * @param {{ params?: Record<string, string | number | boolean>, body?: unknown }} options
   */
  async #send(method, path, options) {
    const base = VBService.resolve(this.role);
    const rel = path ? (path.startsWith('/') ? path : `/${path}`) : '';
    const url = new URL(`${base}${rel}`, globalThis.location?.origin ?? 'http://localhost');
    const sp = appendParams(url.searchParams, options.params);
    if (sp) url.search = sp.toString();

    /** @type {RequestInit} */
    const init = {
      method,
      headers: { ...config.headers },
    };

    if (options.body !== undefined) {
      init.body = JSON.stringify(options.body);
      /** @type {Record<string, string>} */ (init.headers)['content-type'] = 'application/json';
    }

    const fullUrl = url.toString();
    const response = await fetch(fullUrl, init);
    const body = await parseResponseBody(response);

    if (!response.ok) {
      throw new VBServiceError(response.status, body, this.role, `${rel || '/'}`);
    }
    return body;
  }
}

/** @param {string} url */
function stripTrailingSlash(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
