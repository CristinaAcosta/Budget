var appCache = window.applicationCache;
console.log(appCache)

const filesStored = [
    'index.html',
    'styles.css',
    'index.js',
    'images/icons/icon-192x192.png',
    'images/icons/icon-512x512.png',
];

const storeName = "cache-v1";
const time = "time";

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(storeName)
            .then((cache) => cache.addAll(filesStored))
            .then(self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    const currentCaches = [storeName, time];
    event.waitUntil(
        caches
            .keys()
            .then((storeName) => {
                return names.filter((storeName) => !currentCaches.includes(storeName));
            })
            .then((toDelete) => {
                return Promise.all(
                    cachesToDelete.map((toDelete) => {
                        return caches.delete(toDelete);
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});


self.addEventListener("fetch", event => {
    // non GET requests are not cached and requests to other origins are not cached
    if (
        event.request.method !== "GET" ||
        !event.request.url.startsWith(self.location.origin)
    ) {
        event.respondWith(fetch(event.request));
        return;
    }


    // use cache first for all other requests for performance
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (storeResponse) {
                return storeRresponse;
            }

            // request is not in cache. make network request and cache the response
            return caches.open(RUNTIME).then(cache => {
                return fetch(event.request).then(response => {
                    return cache.put(event.request, response.clone()).then(() => {
                        return response;
                    });
                });
            });
        })
    );
});