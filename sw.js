const CACHE_NAME = 'marginnote-shell-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) { return cache.addAll(APP_SHELL); }).catch(function() {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// 앱 셸(같은 출처의 GET 요청)만 캐싱합니다. Firebase 등 외부 요청은 그대로 통과시켜
// Firestore 자체 오프라인 캐시 로직과 겹치지 않게 합니다.
self.addEventListener('fetch', function(event) {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(function(cached) {
      const networkFetch = fetch(req).then(function(res) {
        if(res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(req, resClone); });
        }
        return res;
      }).catch(function() { return cached; });
      return cached || networkFetch;
    })
  );
});
