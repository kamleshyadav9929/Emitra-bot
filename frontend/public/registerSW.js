/**
 * registerSW.js — Service Worker unregistration script
 * Cleans up and unregisters any active service workers to prevent
 * network interference, Clerk blockage, and caching issues.
 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    var unregisteredAny = false;
    var promises = registrations.map(function (registration) {
      console.log('[SW] Uninstalling active service worker to prevent network conflicts...');
      return registration.unregister().then(function (success) {
        if (success) {
          unregisteredAny = true;
        }
      });
    });

    Promise.all(promises).then(function () {
      if (unregisteredAny) {
        console.log('[SW] Cleanup finished. Reloading page...');
        window.location.reload();
      }
    });
  }).catch(function (err) {
    console.error('[SW] Cleanup failed:', err);
  });
}
