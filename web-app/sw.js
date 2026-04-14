/* ================================================================
   LinkVault — Service Worker (PWA)
   File   : /web-app/sw.js
   Author : MD KAWSAR

   PURPOSE:
     Turns LinkVault into a Progressive Web App (PWA).
     Handles caching of static assets (CSS, JS, Fonts) for lightning
     fast loads, and provides offline fallback capabilities.

   IMPORTANT HOSTING REQUIREMENT:
     Because this file is inside the /web-app/ subfolder but needs
     to control the entire site (scope: '/'), your web server MUST
     send the following HTTP header when serving this sw.js file:
       
       Service-Worker-Allowed: /

     SERVER SNIPPETS FOR BUYERS:
     
     ► Apache (.htaccess in /web-app/ folder):
         <Files "sw.js">
           Header set Service-Worker-Allowed "/"
         </Files>
     
     ► Nginx (inside your server block):
         location /web-app/sw.js {
             add_header Service-Worker-Allowed "/";
         }
         
     ► Netlify (netlify.toml):
         [[headers]]
           for = "/web-app/sw.js"
           [headers.values]
             Service-Worker-Allowed = "/"
             
     ► Vercel (vercel.json):
         {
           "headers": [
             {
               "source": "/web-app/sw.js",
               "headers": [ { "key": "Service-Worker-Allowed", "value": "/" } ]
             }
           ]
         }
   ================================================================ */

'use strict';

const CACHE_NAME = 'linkvault-v1.0.0';

/* ── Core assets to pre-cache on install ── */
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/style.css',
  '/assets/js/lang.js',
  '/assets/js/ads.js',
  '/assets/js/script.js',
  '/web-app/manifest.json',
  '/assets/img/icon-192.webp',
  '/assets/img/icon-512.webp',
  // Note: Add '/offline.html' here if you create a custom offline page
];

/* ══════════════════════════════════════════════════════════
   1. INSTALL EVENT
   Fires when the browser installs the service worker.
   We pre-cache the essential static assets here.
   ══════════════════════════════════════════════════════════ */
self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[LinkVault SW] Pre-caching core assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

/* ══════════════════════════════════════════════════════════
   2. ACTIVATE EVENT
   Fires when the SW takes control.
   We use this to clean up old versions of the cache.
   ══════════════════════════════════════════════════════════ */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[LinkVault SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Take control of all pages immediately
    })
  );
});

/* ══════════════════════════════════════════════════════════
   3. FETCH EVENT
   Intercepts all network requests.
   
   STRATEGY:
   - For HTML navigations: Network-First (fallback to Cache).
     (Ensures locked pages and ads are always fresh).
   - For Static Assets (CSS/JS/Images): Cache-First (fallback to Network).
     (Ensures ultra-fast load times).
   ══════════════════════════════════════════════════════════ */
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore cross-origin requests, API calls, or non-GET requests
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // STRATEGY A: HTML / Navigation Requests -> NETWORK FIRST
  if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone the response and update the cache dynamically
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, serve from cache
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            // Optional: Return a dedicated offline.html page here if it exists
            // return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // STRATEGY B: Static Assets (CSS, JS, Images, Fonts) -> CACHE FIRST
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // Return from cache if found
      }

      // Otherwise fetch from network
      return fetch(request).then(response => {
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone and cache the new asset
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    })
  );
});
