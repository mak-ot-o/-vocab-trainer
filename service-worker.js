const CACHE_NAME = "vocab-trainer-v11";
const APP_SHELL = [
  "./",
  "index.html",
  "style.css",
  "data-version.js",
  "data-loader.js",
  "learner-overrides.js",
  "app.js",
  "results-import.js",
  "manifest.json",
  "data/sample.csv",
  "data/NGSL_learner_overrides.csv",
  "data/NGSL_source_conflict_resolutions_2026-09-12.csv"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
