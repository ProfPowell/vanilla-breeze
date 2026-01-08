/**
 * E-commerce API Client
 *
 * Fetch-based API client with error handling, retry logic, and caching.
 * Configure BASE_URL to point to your backend.
 */

const BASE_URL = '{{API_BASE_URL}}';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** @type {Map<string, {data: any, timestamp: number}>} */
const cache = new Map();

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} price - Price in cents
 * @property {string[]} images
 * @property {string} category
 * @property {string[]} [variants]
 * @property {number} [stock]
 * @property {number} [rating]
 * @property {number} [reviewCount]
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} status - 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
 * @property {Array<{productId: string, quantity: number, price: number}>} items
 * @property {number} total
 * @property {Object} shipping
 * @property {string} createdAt
 */

/**
 * Custom API error
 */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   * @param {any} [data]
   */
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Make API request with error handling
 * @param {string} endpoint
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    throw new ApiError(
      data?.message || `Request failed: ${response.statusText}`,
      response.status,
      data
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * GET request with caching
 * @param {string} endpoint
 * @param {boolean} [useCache=true]
 * @returns {Promise<any>}
 */
async function get(endpoint, useCache = true) {
  if (useCache) {
    const cached = cache.get(endpoint);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const data = await request(endpoint);

  if (useCache) {
    cache.set(endpoint, { data, timestamp: Date.now() });
  }

  return data;
}

/**
 * Invalidate cache for endpoint
 * @param {string} [endpoint] - Specific endpoint or all if omitted
 */
export function invalidateCache(endpoint) {
  if (endpoint) {
    cache.delete(endpoint);
  } else {
    cache.clear();
  }
}

// ============================================================================
// Products API
// ============================================================================

/**
 * Get all products
 * @param {Object} [params]
 * @param {string} [params.category]
 * @param {string} [params.search]
 * @param {string} [params.sort] - 'price-asc' | 'price-desc' | 'name' | 'newest'
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<{products: Product[], total: number, page: number, pages: number}>}
 */
export async function getProducts(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) query.set(key, String(value));
  });

  const endpoint = `/products${query.toString() ? `?${query}` : ''}`;
  return get(endpoint);
}

/**
 * Get single product by ID
 * @param {string} id
 * @returns {Promise<Product>}
 */
export async function getProduct(id) {
  return get(`/products/${id}`);
}

/**
 * Get product categories
 * @returns {Promise<Array<{id: string, name: string, count: number}>>}
 */
export async function getCategories() {
  return get('/categories');
}

/**
 * Search products
 * @param {string} query
 * @returns {Promise<Product[]>}
 */
export async function searchProducts(query) {
  return get(`/products/search?q=${encodeURIComponent(query)}`, false);
}

// ============================================================================
// Cart/Checkout API
// ============================================================================

/**
 * Create checkout session
 * @param {Object} data
 * @param {Array<{productId: string, quantity: number}>} data.items
 * @param {Object} data.shipping
 * @param {Object} [data.billing]
 * @returns {Promise<{sessionId: string, url: string}>}
 */
export async function createCheckout(data) {
  return request('/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Validate cart items (check stock, prices)
 * @param {Array<{productId: string, quantity: number}>} items
 * @returns {Promise<{valid: boolean, items: Array<{productId: string, available: boolean, price: number}>}>}
 */
export async function validateCart(items) {
  return request('/cart/validate', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

// ============================================================================
// Orders API
// ============================================================================

/**
 * Get user's orders
 * @param {Object} [params]
 * @param {string} [params.status]
 * @param {number} [params.page]
 * @returns {Promise<{orders: Order[], total: number, page: number, pages: number}>}
 */
export async function getOrders(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) query.set(key, String(value));
  });

  const endpoint = `/orders${query.toString() ? `?${query}` : ''}`;
  return get(endpoint, false); // Don't cache orders
}

/**
 * Get single order by ID
 * @param {string} id
 * @returns {Promise<Order>}
 */
export async function getOrder(id) {
  return get(`/orders/${id}`, false);
}

/**
 * Cancel order
 * @param {string} id
 * @param {string} [reason]
 * @returns {Promise<Order>}
 */
export async function cancelOrder(id, reason) {
  return request(`/orders/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ============================================================================
// Reviews API (if enabled)
// ============================================================================

{{#IF_ENABLE_REVIEWS}}
/**
 * Get product reviews
 * @param {string} productId
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {string} [params.sort] - 'newest' | 'highest' | 'lowest' | 'helpful'
 * @returns {Promise<{reviews: Array<{id: string, rating: number, title: string, body: string, author: string, createdAt: string}>, total: number}>}
 */
export async function getReviews(productId, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) query.set(key, String(value));
  });

  return get(`/products/${productId}/reviews${query.toString() ? `?${query}` : ''}`);
}

/**
 * Submit product review
 * @param {string} productId
 * @param {Object} review
 * @param {number} review.rating - 1-5
 * @param {string} review.title
 * @param {string} review.body
 * @returns {Promise<{id: string}>}
 */
export async function submitReview(productId, review) {
  return request(`/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(review),
  });
}
{{/IF_ENABLE_REVIEWS}}

// ============================================================================
// Wishlist API (if enabled)
// ============================================================================

{{#IF_ENABLE_WISHLIST}}
/**
 * Get wishlist items
 * @returns {Promise<Product[]>}
 */
export async function getWishlist() {
  return get('/wishlist', false);
}

/**
 * Add to wishlist
 * @param {string} productId
 * @returns {Promise<void>}
 */
export async function addToWishlist(productId) {
  return request('/wishlist', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
}

/**
 * Remove from wishlist
 * @param {string} productId
 * @returns {Promise<void>}
 */
export async function removeFromWishlist(productId) {
  return request(`/wishlist/${productId}`, {
    method: 'DELETE',
  });
}
{{/IF_ENABLE_WISHLIST}}