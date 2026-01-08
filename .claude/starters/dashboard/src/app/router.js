/**
 * Dashboard Router
 * Client-side routing with parameter support
 */

class Router {
  constructor() {
    /** @type {Map<string, string>} */
    this.routes = new Map();
    /** @type {string|null} */
    this.notFoundView = null;
    /** @type {HTMLElement|null} */
    this.currentView = null;
    /** @type {HTMLElement|null} */
    this.outlet = null;
    /** @type {string} */
    this.currentPath = '';
    /** @type {Object} */
    this.params = {};

    this.setupListeners();
  }

  /**
   * Set up event listeners
   */
  setupListeners() {
    window.addEventListener('popstate', () => {
      this.navigate(window.location.pathname, false);
    });

    document.addEventListener('click', (event) => {
      const link = event.target.closest('[data-link]');
      if (!link) return;

      event.preventDefault();
      const href = link.getAttribute('href');
      if (href && href !== this.currentPath) {
        this.navigate(href);
      }
    });
  }

  /**
   * Add a route
   * @param {string} path - Route path (supports :param syntax)
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
   * Set the outlet element
   * @param {HTMLElement} element - Container for views
   */
  setOutlet(element) {
    this.outlet = element;
  }

  /**
   * Match a path to a route
   * @param {string} path - Current path
   * @returns {{viewTag: string, params: Object}|null}
   */
  matchRoute(path) {
    // Exact match first
    if (this.routes.has(path)) {
      return { viewTag: this.routes.get(path), params: {} };
    }

    // Check parameterized routes
    for (const [pattern, viewTag] of this.routes) {
      const params = this.matchPattern(pattern, path);
      if (params) {
        return { viewTag, params };
      }
    }

    return null;
  }

  /**
   * Match a pattern against a path
   * @param {string} pattern - Route pattern
   * @param {string} path - Current path
   * @returns {Object|null}
   */
  matchPattern(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }

    return params;
  }

  /**
   * Navigate to a path
   * @param {string} path - Target path
   * @param {boolean} pushState - Whether to push to history
   */
  navigate(path, pushState = true) {
    if (pushState) {
      history.pushState({}, '', path);
    }

    this.currentPath = path;
    const match = this.matchRoute(path);

    if (match) {
      this.params = match.params;
      this.renderView(match.viewTag);
    } else if (this.notFoundView) {
      this.params = {};
      this.renderView(this.notFoundView);
    }
  }

  /**
   * Render a view
   * @param {string} viewTag - Custom element tag name
   */
  renderView(viewTag) {
    if (!this.outlet) return;

    // Unmount current view
    if (this.currentView && typeof this.currentView.onUnmount === 'function') {
      this.currentView.onUnmount();
    }

    // Clear outlet
    this.outlet.innerHTML = '';

    // Create and mount new view
    const view = document.createElement(viewTag);

    // Pass route params as attributes
    for (const [key, value] of Object.entries(this.params)) {
      view.setAttribute(key, value);
    }

    this.outlet.appendChild(view);
    this.currentView = view;
  }

  /**
   * Get current route parameters
   * @returns {Object}
   */
  getParams() {
    return { ...this.params };
  }
}

export const router = new Router();
