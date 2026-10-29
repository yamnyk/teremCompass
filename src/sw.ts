/// <reference lib="webworker" />
// network-first: свіжий деплой завжди перемагає, кеш тільки для офлайну
export {};
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

const C = "teremky-v5";
const FILES = [...new Set(["./", ...self.__WB_MANIFEST.map((e) => e.url)])];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(C).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((ks) =>
        Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copy = r.clone();
        caches.open(C).then((c) => c.put(e.request, copy));
        return r;
      })
      .catch(() => caches.match(e.request) as Promise<Response>),
  );
});
