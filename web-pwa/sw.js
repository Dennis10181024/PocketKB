const CACHE_NAME = "pocketkb-pwa-v23-earthquake-fire-draft";
const CORE_ASSETS = [
  "./", "./index.html", "./styles.css", "./app.js", "./drill-language.js", "./drill-events.js", "./scenario-engine-v3.js",
  "./scenarios/v3/fire-dorm.json", "./manifest.webmanifest", "./icon.svg", "./choice-pack.js", "./choice-runtime.js", "./choice-view.js",
  "./scenarios/choice/schema-v1.json", "./scenarios/choice/manifest.json", "./scenarios/choice/fire-dorm.json",
  "./scenarios/choice/earthquake-school.json"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(async cache => {
    await cache.addAll(CORE_ASSETS);
    const {packs}=await (await cache.match("./scenarios/choice/manifest.json")).json();
    await cache.addAll(packs.filter(pack=>pack.status==="draft"&&/^[a-z0-9-]+\.json$/.test(pack.file))
      .map(pack=>"./scenarios/choice/"+pack.file));
  }));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith("pocketkb-pwa-") && key !== CACHE_NAME).map(key => caches.delete(key))
  )));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  const pathname = new URL(event.request.url).pathname;
  if (pathname.startsWith('/api/') || ['/online.html','/online-coach.js','/setup.html','/setup.js'].some(suffix=>pathname.endsWith(suffix))) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
