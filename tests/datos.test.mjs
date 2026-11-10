import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { EJERCICIOS, EJERCICIO, fotosDe } from '../app/js/datos/ejercicios.js';
import { PLANES } from '../app/js/datos/planes.js';
import { ALIMENTOS } from '../app/js/datos/alimentos.js';

const app = fileURLToPath(new URL('../app/', import.meta.url));

test('cada ejercicio de cada plan existe en el catálogo', () => {
  for (const p of PLANES) for (const d of p.dias) for (const x of d.ejercicios) {
    assert.ok(EJERCICIO[x.ej], `${p.id}: ${x.ej}`);
    assert.ok(x.series > 0 && x.reps > 0, `${p.id}: ${x.ej}`);
  }
});
test('cada ejercicio tiene sus 2 fotos, pasos en español y error común', () => {
  const ids = new Set();
  for (const e of EJERCICIOS) {
    assert.ok(!ids.has(e.id), 'repetido ' + e.id); ids.add(e.id);
    assert.ok(['compuesto', 'aislado', 'tiempo'].includes(e.tipo), e.id);
    assert.ok(e.pasos.length >= 3 && e.error && e.musculos.length, e.id);
    for (const f of fotosDe(e.id)) {
      const ruta = app + f;
      assert.ok(existsSync(ruta), 'falta ' + f);
      assert.ok(statSync(ruta).size > 5000, 'foto vacía ' + f);
    }
  }
});
test('alimentos con valores coherentes', () => {
  for (const a of ALIMENTOS) {
    for (const k of ['kcal', 'p', 'c', 'g', 'porcion']) assert.ok(a[k] >= 0, `${a.id}.${k}`);
    const calculadas = a.p * 4 + a.c * 4 + a.g * 9;
    assert.ok(Math.abs(calculadas - a.kcal) <= Math.max(40, a.kcal * 0.15), `${a.id}: ${calculadas} frente a ${a.kcal}`);
  }
});
