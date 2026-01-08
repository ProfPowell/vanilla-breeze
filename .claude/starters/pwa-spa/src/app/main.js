/**
 * Application Entry Point
 * Initializes the SPA with routing and components
 */

import { router } from './router.js';
import { store } from './store.js';
import '../components/app-shell.js';
import '../components/nav-bar.js';
import '../views/home-view.js';
import '../views/about-view.js';
import '../views/settings-view.js';
import '../views/not-found-view.js';

/**
 * Initialize the application
 */
async function init() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered');
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
  }

  // Set up routes
  router.addRoute('/', 'home-view');
  router.addRoute('/about', 'about-view');
  router.addRoute('/settings', 'settings-view');
  router.setNotFound('not-found-view');

  // Render app shell
  const app = document.getElementById('app');
  app.innerHTML = '<app-shell></app-shell>';

  // Initial navigation
  router.navigate(window.location.pathname, false);

  // Listen for navigation events
  window.addEventListener('popstate', () => {
    router.navigate(window.location.pathname, false);
  });
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { router, store };
