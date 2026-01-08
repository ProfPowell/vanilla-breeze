/**
 * Client-Side Router
 * Vanilla JavaScript router using History API
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.notFoundView = null;
    this.currentView = null;
    this.outlet = null;
  }

  /**
   * Add a route
   * @param {string} path - URL path
   * @param {string} viewTag - Custom element tag name
   */
  addRoute(path, viewTag) {
    this.routes.set(path, viewTag);
  }

  /**
   * Set the 404 view
   * @param {string} viewTag - Custom element tag name
   */
  setNotFound(viewTag) {
    this.notFoundView = viewTag;
  }

  /**
   * Set the router outlet element
   * @param {HTMLElement} element - Container for views
   */
  setOutlet(element) {
    this.outlet = element;
  }

  /**
   * Navigate to a path
   * @param {string} path - URL path
   * @param {boolean} pushState - Whether to push to history
   */
  navigate(path, pushState = true) {
    if (pushState) {
      history.pushState({}, '', path);
    }

    const viewTag = this.routes.get(path) || this.notFoundView;

    if (!viewTag) {
      console.error(`No view found for path: ${path}`);
      return;
    }

    this.renderView(viewTag);
  }

  /**
   * Render a view in the outlet
   * @param {string} viewTag - Custom element tag name
   */
  renderView(viewTag) {
    if (!this.outlet) {
      console.warn('Router outlet not set');
      return;
    }

    // Clean up current view
    if (this.currentView) {
      this.currentView.remove();
    }

    // Create and insert new view
    const view = document.createElement(viewTag);
    this.outlet.innerHTML = '';
    this.outlet.appendChild(view);
    this.currentView = view;

    // Focus management for accessibility
    view.setAttribute('tabindex', '-1');
    view.focus({ preventScroll: true });
  }

  /**
   * Get current path
   * @returns {string}
   */
  get currentPath() {
    return window.location.pathname;
  }
}

// Singleton instance
export const router = new Router();

// Handle link clicks
document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-link]');
  if (!link) return;

  event.preventDefault();
  const href = link.getAttribute('href');
  if (href && href !== router.currentPath) {
    router.navigate(href);
  }
});
