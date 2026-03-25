// ============================================================
// Nombres de caché versionados
// ============================================================
const CACHE_VERSION = "v3";
const STATIC_CACHE  = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// Todos los caches válidos en esta versión
const VALID_CACHES = [STATIC_CACHE, DYNAMIC_CACHE];

// ============================================================
// APP SHELL: rutas fijas que se cachean al instalar el SW
// ============================================================
const APP_SHELL = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/manifest.json",
  "/offline.html",
  // Rutas de la SPA
  "/pokemon",
];

// ============================================================
// INSTALL: cachear el App Shell
// ============================================================
self.addEventListener("install", (event) => {
  console.log(`[SW] Instalando versión ${CACHE_VERSION}`);

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Cacheando App Shell...");
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log("[SW] App Shell cacheado correctamente ✅");
        // Activar el nuevo SW inmediatamente, sin esperar a que cierren las pestañas
        return self.skipWaiting();
      })
  );
});

// ============================================================
// ACTIVATE: eliminar cachés viejos y tomar control de clientes
// ============================================================
self.addEventListener("activate", (event) => {
  console.log(`[SW] Activando versión ${CACHE_VERSION}`);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (!VALID_CACHES.includes(name)) {
              console.log(`[SW] Eliminando caché vieja: ${name}`);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => {
        console.log("[SW] Caché vieja eliminada ✅");
        // Tomar control de todos los clientes abiertos de inmediato
        return self.clients.claim();
      })
  );
});

// ============================================================
// FETCH: estrategia Cache First con fallback a red + caché dinámica
// ============================================================
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo interceptar peticiones GET
  if (request.method !== "GET") return;

  // No cachear peticiones a chrome-extension u otros esquemas no-http
  const url = new URL(request.url);
  if (!["http:", "https:"].includes(url.protocol)) return;

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);

  // ── 1. Buscar en caché (App Shell + caché dinámica) ──────────────────────
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log(`[SW] Desde caché: ${request.url}`);
    return cachedResponse;
  }

  // ── 2. Si no está en caché, ir a la red ──────────────────────────────────
  try {
    const networkResponse = await fetch(request);

    // Cachear la respuesta de red en caché dinámica
    // (solo rutas que NO forman parte del App Shell estático)
    if (networkResponse && networkResponse.status === 200) {
      const isAppShell = APP_SHELL.includes(url.pathname);
      const targetCache = isAppShell ? STATIC_CACHE : DYNAMIC_CACHE;

      const cache = await caches.open(targetCache);
      cache.put(request, networkResponse.clone());
      console.log(`[SW] Cacheado dinámicamente en [${targetCache}]: ${request.url}`);
    }

    return networkResponse;
  } catch (error) {
    // ── 3. Sin red y sin caché → respuesta offline ────────────────────────
    console.warn(`[SW] Sin red para: ${request.url}`);

    const accept = request.headers.get("accept") || "";

    // Para peticiones de página HTML → mostrar offline.html
    if (accept.includes("text/html")) {
      const offlinePage = await caches.match("/offline.html");
      return offlinePage || new Response("<h1>Sin conexión</h1>", {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Para peticiones de API (JSON) → respuesta vacía controlada
    if (accept.includes("application/json") || url.hostname.includes("pokeapi")) {
      return new Response(JSON.stringify({ error: "Sin conexión" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fallback genérico
    return new Response("", { status: 503 });
  }
}