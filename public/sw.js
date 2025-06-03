/**
 * Kana Pop! Service Worker
 * Uses Workbox v7 for precaching and runtime caching strategies
 */

// Basic Workbox setup with importScripts
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

if (workbox) {
  console.log('Workbox is loaded');
  
  // Custom precache manifest will be injected by Workbox during build
  // For development, we'll define some critical files manually
  workbox.precaching.precacheAndRoute([
    { url: './index.html', revision: '1' },
    { url: './styles/root.css', revision: '1' },
    { url: './styles/base.css', revision: '1' },
    { url: './styles/layout.css', revision: '1' },
    { url: './styles/components.css', revision: '1' },
    { url: './src/main.js', revision: '1' },
    { url: './manifest.webmanifest', revision: '1' }
  ]);
  
  // Cache the Google Fonts stylesheets with a stale-while-revalidate strategy
  workbox.routing.registerRoute(
    /^https:\/\/fonts\.googleapis\.com/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'google-fonts-stylesheets',
    })
  );
  
  // Cache the Google Fonts webfont files
  workbox.routing.registerRoute(
    /^https:\/\/fonts\.gstatic\.com/,
    new workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-webfonts',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          maxEntries: 30,
        }),
      ],
    })
  );
  
  // JavaScript files - network first with fallback to cache
  workbox.routing.registerRoute(
    /\.js$/,
    new workbox.strategies.NetworkFirst({
      cacheName: 'js-cache',
    })
  );
  
  // CSS files - network first with fallback to cache
  workbox.routing.registerRoute(
    /\.css$/,
    new workbox.strategies.NetworkFirst({
      cacheName: 'css-cache',
    })
  );
  
  // Audio files - stale while revalidate with cache expiration
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'audio',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'kana-audio',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 120,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        }),
      ],
    })
  );
  
  // Images - cache first with fallback to network
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'image-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        }),
      ],
    })
  );
  
  // Fallback to network for everything else
  workbox.routing.setDefaultHandler(
    new workbox.strategies.NetworkOnly()
  );
  
  // Offline fallback - show custom offline page when offline and page not in cache
  workbox.routing.setCatchHandler(({event}) => {
    if (event.request.destination === 'document') {
      return caches.match('./index.html');
    }
    return Response.error();
  });
  
} else {
  console.log('Workbox could not be loaded. No offline support.');
}
