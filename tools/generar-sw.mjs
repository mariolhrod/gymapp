// Genera app/sw.js: la lista de todos los archivos de la app para que funcione sin internet.
// La versión es una huella de su contenido: si cambia cualquier archivo, el iPhone descarga la versión nueva.
// Uso: node tools/generar-sw.mjs
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = fileURLToPath(new URL('../app/', import.meta.url));
const archivos = [];
(function recorrer(dir) {
  for (const n of readdirSync(dir).sort()) {
    const r = join(dir, n);
    if (statSync(r).isDirectory()) recorrer(r);
    else if (n !== 'sw.js' && !n.endsWith('.md')) archivos.push(relative(app, r).split(sep).join('/'));
  }
})(app);

const huella = createHash('sha256');
for (const f of archivos) huella.update(f).update(readFileSync(join(app, f)));
const version = huella.digest('hex').slice(0, 12);

export const contenido = `// Generado por tools/generar-sw.mjs — no editar a mano.
const VERSION = 'gym-${version}';
const ARCHIVOS = ${JSON.stringify(['./', ...archivos], null, 1)};

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
});
`;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(join(app, 'sw.js'), contenido);
  console.log(`sw.js generado: ${archivos.length} archivos, versión ${version}`);
}
export { archivos, version };
