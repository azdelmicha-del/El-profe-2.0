const CACHE = 'elprofe2-v2';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});
self.addEventListener('fetch', e => {
    if (e.request.url.startsWith(self.location.origin) && e.request.method === 'GET') {
        e.respondWith(
            fetch(e.request).then(res => {
                const resClone = res.clone();
                caches.open(CACHE).then(cache => cache.put(e.request, resClone));
                return res;
            }).catch(() => caches.match(e.request))
        );
    }
});
