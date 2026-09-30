// service-worker.js — mantém o app instalável como PWA, sem guardar cache de conteúdo
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

// Sem "fetch" aqui de propósito: o navegador sempre busca direto da rede,
// então nunca mais vai servir uma versão antiga guardada.
