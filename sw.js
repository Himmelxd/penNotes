toCache = ["/","sw.js","index.html","store.js","main.js","main.css","manifest.json","https://cdn.jsdelivr.net/npm/pdfjs-dist@2.13.216/build/pdf.min.js","https://cdn.jsdelivr.net/npm/pdfjs-dist@2.13.216/build/pdf.worker.min.js"];
lastUpdateEvent = '';

self.addEventListener('install', e => {
    e.waitUntil(
      caches.open('clist').then(cache => {
        return cache.addAll(toCache)
          .then(() => self.skipWaiting());
      })
    );
  });

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('message', event => {
  if (event.data == 'update') {
    lastUpdateEvent = event
    caches.open('clist').then(cache => {
      return cache.addAll(toCache)
        .then(() => {
          self.clients.matchAll({type: "window"}).then(function (clients) {
            if (clients && clients.length) {
              clients[0].postMessage({type: 'DONE'});
            }
          });
          self.skipWaiting()
        });
    })
  }

})


self.addEventListener('fetch', (e) => {

  e.respondWith((async () => {
    try {
      const preloadResponse = await e.preloadResponse;
      if (preloadResponse) {
        return preloadResponse;
      }
      const r = await caches.match(e.request);
      console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
      if (r) { return r; }
      
      const networkResponse = await fetch(e.request);
      return networkResponse;
    } catch (error) {
      console.log(error);
    }
  })());
});