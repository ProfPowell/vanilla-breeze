/**
 * Dashboard Main Entry Point
 * Initializes authentication, routing, and components
 */

import { auth } from './auth.js';
import { router } from './router.js';

// Import components
import '../components/dashboard-layout.js';
import '../components/sidebar-nav.js';
import '../components/data-table.js';
import '../components/stat-card.js';
{{#IF_ENABLE_CHARTS}}
import '../components/chart-wrapper.js';
{{/IF_ENABLE_CHARTS}}

// Import views
import '../views/dashboard-view.js';
import '../views/settings-view.js';
import '../views/list-view.js';
import '../views/detail-view.js';

/**
 * Initialize the application
 */
async function init() {
  // Check authentication
  if (!auth.isAuthenticated()) {
    window.location.replace('/login.html');
    return;
  }

  // Configure routes
  router.addRoute('/', 'dashboard-view');
  router.addRoute('/dashboard', 'dashboard-view');
  router.addRoute('/settings', 'settings-view');
  router.addRoute('/list', 'list-view');
  router.addRoute('/list/:id', 'detail-view');
  router.setNotFound('dashboard-view');

  // Set outlet for rendering views
  router.setOutlet(document.getElementById('app'));

  // Handle initial route
  router.navigate(window.location.pathname, false);

  // Listen for logout events
  document.addEventListener('auth:logout', () => {
    window.location.replace('/login.html');
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
