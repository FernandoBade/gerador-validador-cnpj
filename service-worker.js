const CACHE_NAME = 'cnpj-bade-static-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/gerador-cnpj/',
  '/gerador-cnpj/index.html',
  '/validador-cnpj/',
  '/validador-cnpj/index.html',
  '/validador-cnpj-api/',
  '/validador-cnpj-api/index.html',
  '/artigos/como-a-validacao-de-cnpj-e-feita/',
  '/artigos/como-a-validacao-de-cnpj-e-feita/index.html',
  '/dist/css/styles.min.css',
  '/dist/src/interface/transicao.js',
  '/dist/src/interface/menu.js',
  '/dist/src/gerais/cookies.js',
  '/dist/src/gerais/mensageria.js',
  '/dist/src/cnpj/gerador-cnpj.js',
  '/dist/src/cnpj/validador-cnpj.js',
  '/dist/src/cnpj/validador-cnpj-api.js',
  '/dist/src/validador.js',
  '/src/estilos/controle-tema.css',
  '/site.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return undefined;
        })
      )
    ).then(() => self.clients.claim())
  );
});

function buildAlternativeRequests(request) {
  const alternatives = [];
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.endsWith('/')) {
      const indexPath = url.pathname === '/' ? '/index.html' : `${url.pathname}index.html`;
      alternatives.push(indexPath);
    } else {
      alternatives.push(`${url.pathname}/index.html`);
    }
  }
  return alternatives;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    (async () => {
      const possibleRequests = [event.request, ...buildAlternativeRequests(event.request)];
      for (const req of possibleRequests) {
        const cachedResponse = await caches.match(req);
        if (cachedResponse) {
          return cachedResponse;
        }
      }
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, responseClone);
        }
        return networkResponse;
      } catch (error) {
        if (event.request.mode === 'navigate') {
          return (await caches.match('/')) || (await caches.match('/index.html')) || Response.error();
        }
        throw error;
      }
    })()
  );
});
