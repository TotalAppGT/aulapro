// Service worker minimo (PWA instalable). No cachea la app para evitar bundles viejos.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {
  // pass-through: usa la red por defecto
})
