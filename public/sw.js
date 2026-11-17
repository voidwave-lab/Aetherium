// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Voidwave Lab
// Offline-first Service Worker for Aetherium Pocket (PWA / Mobile Web)

const CACHE_NAME = 'aetherium-pocket-v2';
const PRECACHE_URLS = [
  './pocket.html',
  './manifest.json',
  './app-icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

/**
 * Discovers Vite's content-hashed JS and CSS bundle URLs referenced inside `pocket.html`
 * during the Service Worker install phase so Aetherium Pocket boots 100% offline even
 * immediately after the very first visit (without requiring a second online reload).
 */
async function precacheAppShellAndAssets(cache) {
  await cache.addAll(PRECACHE_URLS);

  try {
    const htmlRes = await fetch('./pocket.html', { cache: 'no-cache' });
    if (!htmlRes || !htmlRes.ok) return;

    await cache.put('./pocket.html', htmlRes.clone());
    const htmlText = await htmlRes.text();
    const assetUrls = new Set();
    const attrRegex = /(?:src|href)=["']([^"']+)["']/gi;
    let match;
    while ((match = attrRegex.exec(htmlText)) !== null) {
      const ref = match[1];
      if (
        ref &&
        !ref.startsWith('http:') &&
        !ref.startsWith('https:') &&
        !ref.startsWith('data:') &&
        (ref.endsWith('.js') || ref.endsWith('.css') || ref.includes('/assets/'))
      ) {
        assetUrls.add(ref);
      }
    }

    if (assetUrls.size > 0) {
      await Promise.all(
        Array.from(assetUrls).map((url) =>
          cache.add(url).catch(() => {
            // Ignore dev-server virtual module paths (e.g. /src/main-pocket.ts during `npm run dev`)
          })
        )
      );
    }
  } catch {
    // Ignore offline install fallback errors
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => precacheAppShellAndAssets(cache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      const networkFetch = fetch(req)
        .then((response) => {
          if (
            response &&
            response.status === 200 &&
            (response.type === 'basic' || response.type === 'cors')
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, clone);
            });
          }
          return response;
        })
        .catch(() => cached || (req.mode === 'navigate' ? caches.match('./pocket.html') : undefined));

      return cached || networkFetch;
    })
  );
});
