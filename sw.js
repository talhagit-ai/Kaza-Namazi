// Kaza Namazı Takibi - service worker (network-first, offline fallback)
const CACHE = 'kaza-v2';

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(['./', './index.html']).catch(function () {}); }).catch(function () {}));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
      .catch(function () {})
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req).then(function (res) {
      try {
        if (res && res.ok && new URL(req.url).origin === self.location.origin) {
          var cp = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, cp); }).catch(function () {});
        }
      } catch (_) {}
      return res;
    }).catch(function () {
      return caches.match(req).then(function (m) { return m || caches.match('./index.html'); });
    })
  );
});
