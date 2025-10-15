self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("usdt-miner-cache").then((cache) => {
      return cache.addAll(["index.html", "manifest.json"]);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});

// 🔔 Background notification listener
self.addEventListener("push", (e) => {
  const data = e.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: "icon-192.png"
  });
});
