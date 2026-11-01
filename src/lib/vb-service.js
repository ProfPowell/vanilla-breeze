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
 * Spec: admin/plans/april13-plan/vb-service.md
 */

/** @typedef {{ baseUrl: string, headers: Record<string, string>, services: Record<string, string> }} ServiceConfig */

/**
 * Configuration lives on globalThis, not in module scope: autoloaded
 * component chunks each bundle their own copy of this module, and a site's
 * VB.service.configure() call must reach all of them.
 */
const CONFIG_KEY = '__vbServiceConfig';
/** @type {any} */
const g = globalThis;
/** @returns {ServiceConfig} */
const defaults = () => ({ baseUrl: '/go', headers: {}, services: {} });
if (!g[CONFIG_KEY]) g[CONFIG_KEY] = defaults();
/** @returns {ServiceConfig} */
const getConfig = () => g[CONFIG_KEY];

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
    const config = getConfig();
    g[CONFIG_KEY] = {
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
    const config = getConfig();
    if (config.services[role]) return stripTrailingSlash(config.services[role]);
    if (config.baseUrl) return `${stripTrailingSlash(config.baseUrl)}/${role}`;
    return `/go/${role}`;
  }

  /**
   * Reset to defaults. Testing helper.
   */
  static _reset() {
    g[CONFIG_KEY] = defaults();
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
   * @returns {Promise<any>} Parsed response body (JSON, text, or null).
   */
  async get(path, params) {
    return this.#send('GET', path, { params });
  }

  /**
   * POST JSON body.
   * @param {string} path
   * @param {unknown} [body]
   * @returns {Promise<any>} Parsed response body (JSON, text, or null).
   */
  async post(path, body) {
    return this.#send('POST', path, { body });
  }

  /**
   * PATCH JSON body.
   * @param {string} path
   * @param {unknown} [body]
   * @returns {Promise<any>} Parsed response body (JSON, text, or null).
   */
  async patch(path, body) {
    return this.#send('PATCH', path, { body });
  }

  /**
   * DELETE request.
   * @param {string} path
   * @returns {Promise<any>} Parsed response body (JSON, text, or null).
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
      headers: { ...getConfig().headers },
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

// Public entry point for sites: window.VB.service (vb.js keeps these when it
// installs the effects runtime on window.VB).
if (typeof window !== 'undefined') {
  const ns = /** @type {any} */ (window).VB ?? (/** @type {any} */ (window).VB = {});
  ns.service ??= VBService;
  ns.ServiceError ??= VBServiceError;
}
