/**
 * API Client
 * Fetch wrapper with error handling and caching
 */

const API_BASE = '{{API_BASE_URL}}';

/**
 * Custom error for API responses
 */
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Make an API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<*>} Response data
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);

    // Handle non-OK responses
    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // Response wasn't JSON
      }

      throw new ApiError(
        errorData?.message || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    // Handle empty responses
    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error
    throw new ApiError('Network error', 0, null);
  }
}

/**
 * API client object
 */
export const api = {
  /**
   * GET request
   * @param {string} endpoint
   * @returns {Promise<*>}
   */
  get(endpoint) {
    return request(endpoint, { method: 'GET' });
  },

  /**
   * POST request
   * @param {string} endpoint
   * @param {Object} data
   * @returns {Promise<*>}
   */
  post(endpoint, data) {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * PATCH request
   * @param {string} endpoint
   * @param {Object} data
   * @returns {Promise<*>}
   */
  patch(endpoint, data) {
    return request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE request
   * @param {string} endpoint
   * @returns {Promise<*>}
   */
  delete(endpoint) {
    return request(endpoint, { method: 'DELETE' });
  },
};

export { ApiError };
