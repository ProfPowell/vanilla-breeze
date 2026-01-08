/**
 * Shopping Cart State Management
 *
 * Lightweight reactive store for cart state with localStorage persistence.
 * Uses a pub/sub pattern for reactive updates across components.
 */

const STORAGE_KEY = '{{PROJECT_NAME}}-cart';

/**
 * @typedef {Object} CartItem
 * @property {string} id - Product ID
 * @property {string} name - Product name
 * @property {number} price - Unit price
 * @property {number} quantity - Quantity in cart
 * @property {string} [image] - Product image URL
 * @property {string} [variant] - Selected variant (size, color, etc.)
 */

/**
 * @typedef {Object} CartState
 * @property {CartItem[]} items - Items in cart
 * @property {boolean} isOpen - Cart drawer open state
 */

/** @type {Set<Function>} */
const subscribers = new Set();

/** @type {CartState} */
let state = loadState();

/**
 * Load cart state from localStorage
 * @returns {CartState}
 */
function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        isOpen: false,
      };
    }
  } catch {
    // Invalid stored data, start fresh
  }
  return { items: [], isOpen: false };
}

/**
 * Save cart state to localStorage
 */
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      items: state.items,
    }));
  } catch {
    // Storage unavailable (private browsing, quota exceeded)
  }
}

/**
 * Notify all subscribers of state change
 */
function notify() {
  subscribers.forEach(fn => fn(state));
}

/**
 * Subscribe to cart state changes
 * @param {Function} fn - Callback receiving new state
 * @returns {Function} Unsubscribe function
 */
export function subscribe(fn) {
  subscribers.add(fn);
  fn(state); // Initial call with current state
  return () => subscribers.delete(fn);
}

/**
 * Get current cart state
 * @returns {CartState}
 */
export function getState() {
  return state;
}

/**
 * Add item to cart
 * @param {Omit<CartItem, 'quantity'>} item - Product to add
 * @param {number} [quantity=1] - Quantity to add
 */
export function addItem(item, quantity = 1) {
  const existing = state.items.find(i =>
    i.id === item.id && i.variant === item.variant
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    state.items.push({ ...item, quantity });
  }

  saveState();
  notify();
}

/**
 * Remove item from cart
 * @param {string} id - Product ID
 * @param {string} [variant] - Variant to remove
 */
export function removeItem(id, variant) {
  state.items = state.items.filter(i =>
    !(i.id === id && i.variant === variant)
  );
  saveState();
  notify();
}

/**
 * Update item quantity
 * @param {string} id - Product ID
 * @param {number} quantity - New quantity
 * @param {string} [variant] - Variant to update
 */
export function updateQuantity(id, quantity, variant) {
  const item = state.items.find(i =>
    i.id === id && i.variant === variant
  );

  if (item) {
    if (quantity <= 0) {
      removeItem(id, variant);
    } else {
      item.quantity = quantity;
      saveState();
      notify();
    }
  }
}

/**
 * Clear all items from cart
 */
export function clearCart() {
  state.items = [];
  saveState();
  notify();
}

/**
 * Toggle cart drawer open/closed
 */
export function toggleCart() {
  state.isOpen = !state.isOpen;
  notify();
}

/**
 * Set cart drawer state
 * @param {boolean} isOpen
 */
export function setCartOpen(isOpen) {
  state.isOpen = isOpen;
  notify();
}

/**
 * Get cart item count
 * @returns {number}
 */
export function getItemCount() {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Get cart subtotal
 * @returns {number}
 */
export function getSubtotal() {
  return state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * Format price for display
 * @param {number} amount - Amount in cents or smallest currency unit
 * @returns {string}
 */
export function formatPrice(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: '{{CURRENCY}}',
  }).format(amount / 100);
}