/**
 * registerSW.js — Service Worker registration script
 * Placed in public/ so it is always served as a real static file.
 * This prevents the "Unexpected token '<'" SyntaxError caused by the SPA
 * fallback returning index.html when the file is missing.
 *
 * vite-plugin-pwa normally generates this file, but the plugin has a
 * Rolldown-compatibility bug (Vite 8) that prevents auto-injection.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(function (registration) {
        console.log('[SW] Registered, scope:', registration.scope);

        // Auto-update: when a new SW is found, skip waiting and reload
        registration.addEventListener('updatefound', function () {
          var newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(function (err) {
        console.error('[SW] Registration failed:', err);
      });

    // Reload the page after the new SW takes control
    var refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}
