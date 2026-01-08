/**
 * API Client
 * HTTP client with authentication and error handling
 */

const BASE_URL = '{{API_BASE_URL}}';

/**
 * @typedef {Object} ApiError
 * @property {string} code
 * @property {string} message
 * @property {Object} [details]
 */

class ApiClient {
  constructor(baseUrl) {
    /** @type {string} */
    this.baseUrl = baseUrl;
    /** @type {string|null} */
    this.authToken = null;
  }

  /**
   * Set authentication token
   * @param {string|null} token
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Build headers for request
   * @returns {Headers}
   */
  buildHeaders() {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (this.authToken) {
      headers.set('Authorization', `Bearer ${this.authToken}`);
    }

    return headers;
  }

  /**
   * Handle response
   * @param {Response} response
   * @returns {Promise<*>}
   */
  async handleResponse(response) {
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error?.message || 'Request failed');
      error.code = data.error?.code || 'UNKNOWN';
      error.status = response.status;
      error.details = data.error?.details;
      throw error;
    }

    return data;
  }

  /**
   * Make a request
   * @param {string} method
   * @param {string} path
   * @param {Object} [body]
   * @returns {Promise<*>}
   */
  async request(method, path, body) {
    const url = `${this.baseUrl}${path}`;
    const options = {
      method,
      headers: this.buildHeaders(),
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      return await this.handleResponse(response);
    } catch (error) {
      if (error.status === 401) {
        document.dispatchEvent(new CustomEvent('auth:logout'));
      }
      throw error;
    }
  }

  /**
   * GET request
   * @param {string} path
   * @returns {Promise<*>}
   */
  get(path) {
    return this.request('GET', path);
  }

  /**
   * POST request
   * @param {string} path
   * @param {Object} body
   * @returns {Promise<*>}
   */
  post(path, body) {
    return this.request('POST', path, body);
  }

  /**
   * PUT request
   * @param {string} path
   * @param {Object} body
   * @returns {Promise<*>}
   */
  put(path, body) {
    return this.request('PUT', path, body);
  }

  /**
   * PATCH request
   * @param {string} path
   * @param {Object} body
   * @returns {Promise<*>}
   */
  patch(path, body) {
    return this.request('PATCH', path, body);
  }

  /**
   * DELETE request
   * @param {string} path
   * @returns {Promise<*>}
   */
  delete(path) {
    return this.request('DELETE', path);
  }
}

export const api = new ApiClient(BASE_URL);
