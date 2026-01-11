const CACHE_NAME = 'mobil-pc-assistan-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://img.icons8.com/color/96/000000/computer.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
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
        
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // OFFLINE SAYFASI
            if (event.request.url.includes('.html')) {
              return caches.match('/index.html');
            }
            
            // OFFLINE MESAJI
            return new Response(JSON.stringify({
              error: 'İnternet bağlantısı yok',
              offline: true,
              cached: false
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// PUSH BİLDİRİMLERİ
self.addEventListener('push', event => {
  const options = {
    body: event.data?.text() || 'Yeni ikinci el ilanlar var!',
    icon: 'https://img.icons8.com/color/96/000000/computer.png',
    badge: 'https://img.icons8.com/color/96/000000/computer.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Mobil PC Asistanı', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
