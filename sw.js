/**
 * J.A.R.V.I.S. PWA SERVICE WORKER
 * Caches core HUD assets for fast loading across phones, tablets, and desktops
 */

const CACHE_NAME = 'jarvis-hud-v2';
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './manifest.json',
    './js/sound.js',
    './js/visualizer.js',
    './js/speech.js',
    './js/device.js',
    './js/workflow.js',
    './js/app.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.warn('SW pre-cache warning:', err);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests and skip external non-cacheable API requests
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);

    // Bypass caching for live external APIs (Groq, Open-Meteo, GeoJS)
    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request).then(cached => {
                if (cached) return cached;
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
