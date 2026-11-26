'use strict';

const prefix = 'pocketkb-choice-play-';
const cacheName = prefix + 'v7';
const packDirectory = './scenarios/choice/';
const manifestUrl = packDirectory + 'manifest.json';
const appFiles = [
  './play.html', './play.js', './play.webmanifest', './play-icon-192.png',
  './play-icon-512.png', './styles.css', './vendor/sha256.min.js',
  './choice-pack.js', './choice-runtime.js', './choice-view.js', './play-study-log.js', packDirectory + 'schema-v1.json'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetch(manifestUrl, { cache: 'reload' });
    if (!response.ok) throw new Error('Choice catalog unavailable');
    const manifest = await response.clone().json();
    const packs = manifest.packs.map(entry => {
      if (!/^[a-z0-9-]+\.json$/.test(entry.file)) throw new Error('Invalid choice path');
      return packDirectory + entry.file;
    });
    const cache = await caches.open(cacheName);
    await cache.addAll([...appFiles, ...packs].map(url => new Request(url, { cache: 'reload' })));
    await cache.put(manifestUrl, response);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(prefix) && key !== cacheName) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    return (await cache.match(event.request, { ignoreSearch: true })) ?? fetch(event.request);
  })());
});
