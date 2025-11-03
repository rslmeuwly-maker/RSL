const CACHE_NAME = 'ou-rider-v1';
const URLS_TO_CACHE = [
  'ou_rider.html',
  'feed.html',
  'ajouter.html',
  'recherche.html',
  'profil_ou_rider.html',
  'spot.html',
  'manifest.json',
  'images/logo_rsl.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
