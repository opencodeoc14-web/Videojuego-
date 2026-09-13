'use strict';
const CACHE = 'chaos-twins-v3-camera-world-2026-09-13';
const ASSETS = ['./', './index.html', './styles.css', './game.js', './icon.svg', './icon-192.png', './icon-512.png', './manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('chaos-twins-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put('./index.html', copy)).catch(() => {}); }
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // Assets use network first in v3 so camera/world updates reach installed PWAs immediately.
  event.respondWith(fetch(request).then(response => {
    if (response.ok) { const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{}); }
    return response;
  }).catch(()=>caches.match(request)));
});
