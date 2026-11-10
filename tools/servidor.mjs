// Servidor local mínimo para probar la app en el PC: node tools/servidor.mjs [puerto]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../app/', import.meta.url));
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg' };

export function arrancar(puerto = 8765) {
  const srv = createServer(async (req, res) => {
    let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (ruta.endsWith('/')) ruta += 'index.html';
    const archivo = normalize(join(raiz, ruta));
    if (!archivo.startsWith(normalize(raiz))) { res.writeHead(403); res.end(); return; }
    try {
      const datos = await readFile(archivo);
      res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(datos);
    } catch { res.writeHead(404); res.end('No encontrado'); }
  });
  return new Promise((ok) => srv.listen(puerto, '127.0.0.1', () => ok(srv)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const p = Number(process.argv[2]) || 8765;
  arrancar(p).then(() => console.log(`App en http://127.0.0.1:${p}/  (Ctrl+C para parar)`));
}
