const CACHE_NAME = 'fiyattakip-v2';
// GitHub Pages alt dizinleri için relative cache listesi
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './firebase.js',
  './typeahead.js',
  './fps-engine.js',
  './pc-builder.js',
  './manifest.json',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
