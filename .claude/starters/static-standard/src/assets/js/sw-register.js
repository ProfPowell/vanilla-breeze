/**
 * Service Worker Registration
 * Registers the service worker with update handling
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker();
  });
}

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('[SW] Registered with scope:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[SW] Update found');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content available, notify user
          showUpdateNotification();
        }
      });
    });

  } catch (error) {
    console.error('[SW] Registration failed:', error);
  }
}

/**
 * Show update notification to user
 * Override this function to customize the notification UI
 */
function showUpdateNotification() {
  console.log('[SW] New content available, refresh to update');

  // Simple notification - can be enhanced with a toast/banner UI
  if (confirm('New content available! Click OK to refresh.')) {
    window.location.reload();
  }
}