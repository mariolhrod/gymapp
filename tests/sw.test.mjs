import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { archivos, contenido } from '../tools/generar-sw.mjs';

const sw = readFileSync(fileURLToPath(new URL('../app/sw.js', import.meta.url)), 'utf8');

test('sw.js está al día con los archivos de la app (si falla: node tools/generar-sw.mjs)', () => {
  assert.equal(sw, contenido);
});
test('la lista para usar sin internet incluye pantallas, código, iconos y las 60 fotos', () => {
  for (const f of ['index.html', 'css/app.css', 'js/ui/app.js', 'manifest.webmanifest', 'img/icono-180.png']) assert.ok(archivos.includes(f), f);
  assert.equal(archivos.filter((f) => f.startsWith('img/ejercicios/') && f.endsWith('.jpg')).length, 60);
});
