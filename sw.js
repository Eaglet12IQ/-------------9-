const CACHE_NAME = 'notes-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кэширование ресурсов');
        return cache.addAll(ASSETS);
      })
      .catch(err => {
        console.log('Ошибка при кэшировании:', err);
      })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.startsWith('ws:')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {
            const responseToCache = response.clone();
            
            if (response.status === 200 && event.request.method === 'GET') {
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache));
            }
            
            return response;
          })
          .catch(() => {
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
          });
      })
  );
});