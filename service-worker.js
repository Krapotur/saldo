const CACHE_NAME = "saldo-shell-v7";
const APP_FILES = [
  "./",
  "./index.html",
  "./register.html",
  "./styles.css",
  "./auth.css",
  "./app.js",
  "./register.js",
  "./firebase-bootstrap.js",
  "./firebase-client.js",
  "./manifest.webmanifest",
  "./pwa.js",
  "./icons/saldo.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith("saldo-shell-") && name !== CACHE_NAME).map((name) => caches.delete(name))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isAppFile = url.origin === self.location.origin;
  const isFirebaseModule = url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/");
  if (!isAppFile && !isFirebaseModule) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response.ok && (isAppFile || request.destination === "script")) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      if (cached) return cached;
      throw error;
    }
  })());
});
