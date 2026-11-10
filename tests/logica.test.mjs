import { test } from 'node:test';
import assert from 'node:assert/strict';
import { objetivos, totales, totalesDelDia } from '../app/js/logica/nutricion.js';
import { propuesta, leerNumero, semanaDelPlan, esSemanaDescarga, completoTodo } from '../app/js/logica/progresion.js';
import { siguienteDia, ultimaVez, entrenosDeLaSemana, marcasPersonales, evolucion } from '../app/js/logica/plan.js';
import { estadoVacio, validar, exportar, importar, crearAlmacen } from '../app/js/logica/almacen.js';
import { PLAN } from '../app/js/datos/planes.js';
import { ALIMENTO } from '../app/js/datos/alimentos.js';

// --- Nutrición (criterios 1 y 2 de la spec)
test('75 kg mantener: 2.250 kcal y 150 g de proteína', () => {
  const o = objetivos({ peso: 75, meta: 'mantener' });
  assert.equal(o.kcal, 2250); assert.equal(o.p, 150); assert.equal(o.g, 75);
  assert.equal(o.c, Math.round((2250 - 600 - 675) / 4));
});
test('ganar +300, perder −400', () => {
  assert.equal(objetivos({ peso: 75, meta: 'ganar' }).kcal, 2550);
  assert.equal(objetivos({ peso: 75, meta: 'perder' }).kcal, 1850);
});
test('objetivos manuales mandan; sin peso no hay objetivos', () => {
  assert.deepEqual(objetivos({ peso: 75, meta: 'ganar', objetivosManual: { kcal: 2000, p: 160, c: 200, g: 60 } }), { kcal: 2000, p: 160, c: 200, g: 60 });
  assert.equal(objetivos({ meta: 'ganar' }), null);
  assert.equal(objetivos(null), null);
});
test('totales por gramos y comidas del día', () => {
  assert.deepEqual(totales([{ alimentoId: 'pechuga_pollo', gramos: 200 }], ALIMENTO), { kcal: 330, p: 62, c: 0, g: 7 });
  assert.deepEqual(totales([{ alimentoId: 'no_existe', gramos: 100 }, { alimentoId: 'avena', gramos: -5 }], ALIMENTO), { kcal: 0, p: 0, c: 0, g: 0 });
  const dia = { desayuno: [{ alimentoId: 'avena', gramos: 100 }], cena: [{ alimentoId: 'arroz_blanco', gramos: 100 }] };
  assert.equal(totalesDelDia(dia, ALIMENTO).kcal, 389 + 130);
});

// --- Progresión (criterios 4 y 5)
const obj = { series: 4, reps: 10 };
const s = (kg, ...reps) => ({ series: reps.map((r) => ({ kg, reps: r, hecha: true })) });
test('completó 4×10 a 30 kg en compuesto: propone 32,5', () => {
  assert.deepEqual(propuesta('compuesto', s(30, 10, 10, 10, 10), obj), { kg: 32.5, motivo: 'subir' });
});
test('aislado sube 1 kg', () => {
  assert.equal(propuesta('aislado', s(12, 10, 10, 10, 10), obj).kg, 13);
});
test('no completó: repite el peso', () => {
  assert.deepEqual(propuesta('compuesto', s(30, 10, 10, 9, 8), obj), { kg: 30, motivo: 'repetir' });
  const faltaSerie = { series: [{ kg: 30, reps: 10, hecha: true }, { kg: 30, reps: 10, hecha: true }] };
  assert.equal(propuesta('compuesto', faltaSerie, obj).motivo, 'repetir');
  const sinMarcar = { series: [...s(30, 10, 10, 10).series, { kg: 30, reps: 10, hecha: false }] };
  assert.equal(completoTodo(sinMarcar, obj), false);
});
test('primera vez o ejercicio de tiempo: sin propuesta; descarga: mitad', () => {
  assert.equal(propuesta('compuesto', null, obj), null);
  assert.equal(propuesta('tiempo', s(0, 30, 30, 30), { series: 3, reps: 30 }), null);
  assert.deepEqual(propuesta('compuesto', s(62.5, 10, 10, 10, 10), obj, { descarga: true }), { kg: 31.5, motivo: 'descarga' });
});
test('leer números escritos a mano', () => {
  assert.equal(leerNumero('62,5'), 62.5); assert.equal(leerNumero(' 40 '), 40);
  for (const malo of ['-5', 'abc', '', '1e3', '5000', null]) assert.equal(leerNumero(malo), null, malo);
  assert.equal(leerNumero('8.5', { decimales: false }), null);
});
test('semana del plan y descarga cada 8 semanas', () => {
  assert.equal(semanaDelPlan('2026-11-02', new Date(2026, 10, 2)), 1);
  assert.equal(semanaDelPlan('2026-11-02', new Date(2026, 10, 9)), 2);
  assert.equal(semanaDelPlan('2026-11-02', new Date(2026, 11, 21)), 8);
  assert.equal(esSemanaDescarga(8), true); assert.equal(esSemanaDescarga(7), false); assert.equal(esSemanaDescarga(16), true);
});

// --- Plan (criterio 3)
const tp = PLAN.torso_pierna;
test('torso/pierna: tras el día A toca el B, y tras el B el A', () => {
  assert.equal(siguienteDia(tp, []), 0);
  assert.equal(siguienteDia(tp, [{ planId: 'torso_pierna', diaIndex: 0, fecha: '2026-11-09T10:00:00Z' }]), 1);
  assert.equal(siguienteDia(tp, [{ planId: 'torso_pierna', diaIndex: 0, fecha: '2026-11-08T10:00:00Z' }, { planId: 'torso_pierna', diaIndex: 1, fecha: '2026-11-09T10:00:00Z' }]), 0);
  assert.equal(siguienteDia(PLAN.ppl, [{ planId: 'ppl', diaIndex: 2, fecha: '2026-11-09' }, { planId: 'torso_pierna', diaIndex: 0, fecha: '2026-11-10' }]), 0);
});
test('última vez, marcas, evolución y entrenos de la semana', () => {
  const h = [
    { planId: 'torso_pierna', diaIndex: 0, fecha: '2026-11-03T10:00:00Z', ejercicios: [{ ej: 'remo_mancuerna', series: s(28, 10, 10, 10, 10).series }] },
    { planId: 'torso_pierna', diaIndex: 0, fecha: '2026-11-10T10:00:00Z', ejercicios: [{ ej: 'remo_mancuerna', series: s(30, 10, 10, 10, 10).series }] },
  ];
  assert.equal(ultimaVez('remo_mancuerna', h).series[0].kg, 30);
  assert.equal(ultimaVez('prensa', h), null);
  assert.deepEqual(marcasPersonales(h).remo_mancuerna, { kg: 30, reps: 10, fecha: '2026-11-10T10:00:00Z' });
  assert.deepEqual(evolucion('remo_mancuerna', h).map((x) => x.kg), [28, 30]);
  assert.equal(entrenosDeLaSemana(h, new Date(2026, 10, 12)), 1);
});

// --- Almacén y copia de seguridad (criterio 9)
const memoria = () => { const m = {}; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = v; } }; };
test('guardar, cargar y copia de seguridad ida y vuelta', () => {
  const st = crearAlmacen(memoria());
  const d = estadoVacio();
  d.perfil = { nombre: 'Mario', peso: 78, meta: 'ganar', objetivosManual: null };
  d.entrenos.push({ id: 'e1', fecha: '2026-11-09T10:00:00Z', planId: 'torso_pierna', diaIndex: 0, terminado: true, ejercicios: [{ ej: 'prensa', series: [{ kg: 100, reps: 12, hecha: true }] }] });
  d.comidas['2026-11-09'] = { desayuno: [{ alimentoId: 'avena', gramos: 80 }] };
  d.pesos.push({ fecha: '2026-11-09', kg: 78 });
  st.guardar(d);
  assert.deepEqual(st.cargar(), d);
  const r = importar(exportar(d));
  assert.equal(r.ok, true); assert.deepEqual(r.datos, d);
});
test('una copia dañada no se acepta', () => {
  assert.equal(importar('{no es json').ok, false);
  assert.equal(importar(JSON.stringify({ version: 99 })).ok, false);
  const d = estadoVacio(); d.pesos.push({ fecha: '2026-11-09', kg: -3 });
  assert.equal(importar(JSON.stringify(d)).ok, false);
  const e = estadoVacio(); e.entrenos.push({ fecha: 'x', ejercicios: [{ ej: 'prensa', series: [{ kg: -1, reps: 5 }] }] });
  assert.ok(validar(e).length > 0);
});
test('guardar se niega con datos no válidos y no pisa lo anterior', () => {
  const m = memoria(); const st = crearAlmacen(m);
  const bueno = estadoVacio(); st.guardar(bueno);
  const malo = estadoVacio(); malo.pesos.push({ fecha: 'h', kg: -1 });
  assert.throws(() => st.guardar(malo));
  assert.deepEqual(st.cargar(), bueno);
});
test('sin datos guardados, estado vacío', () => {
  assert.deepEqual(crearAlmacen(memoria()).cargar(), estadoVacio());
});
