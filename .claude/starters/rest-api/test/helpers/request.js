/**
 * Test HTTP Request Helpers
 * Simplified HTTP client for API tests
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

/**
 * Make an HTTP request
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {Object} options - Request options
 * @returns {Promise<{status: number, headers: Headers, body: Object}>}
 */
async function request(method, path, { body = null, token = null, headers = {} } = {}) {
  const url = `${BASE_URL}${path}`;

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers: requestHeaders
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  let responseBody = null;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    responseBody = await response.json();
  }

  return {
    status: response.status,
    headers: response.headers,
    body: responseBody
  };
}

/**
 * GET request
 */
export function get(path, options = {}) {
  return request('GET', path, options);
}

/**
 * POST request
 */
export function post(path, body, options = {}) {
  return request('POST', path, { ...options, body });
}

/**
 * PATCH request
 */
export function patch(path, body, options = {}) {
  return request('PATCH', path, { ...options, body });
}

/**
 * PUT request
 */
export function put(path, body, options = {}) {
  return request('PUT', path, { ...options, body });
}

/**
 * DELETE request
 */
export function del(path, options = {}) {
  return request('DELETE', path, options);
}

/**
 * Login and get token
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} Access token
 */
export async function loginAs(email, password) {
  const { body } = await post('/api/v1/auth/login', { email, password });
  return body.accessToken;
}
