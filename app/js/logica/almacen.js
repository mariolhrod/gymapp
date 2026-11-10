// Datos de la app: un único objeto versionado, guardado en el propio dispositivo.
// La copia de seguridad es ese mismo objeto en un archivo .json; al importar se valida antes de sustituir nada.

export const VERSION = 1;
export const CLAVE = 'gymapp.datos';

export function estadoVacio() {
  return {
    version: VERSION,
    perfil: null,            // { nombre, peso, meta: 'perder'|'mantener'|'ganar', objetivosManual: null|{kcal,p,c,g} }
    planId: null,
    planInicio: null,        // 'YYYY-MM-DD'
    entrenos: [],            // [{ id, fecha (ISO), planId, diaIndex, terminado, ejercicios: [{ ej, series: [{kg, reps, hecha}] }] }]
    enCurso: null,           // entreno a medias, mismo formato
    comidas: {},             // { 'YYYY-MM-DD': { desayuno: [{ alimentoId, gramos }], almuerzo, cena, snacks, agua } }
    pesos: [],               // [{ fecha: 'YYYY-MM-DD', kg }]
    alimentosPropios: [],    // [{ id, nombre, kcal, p, c, g, porcion }]
  };
}

const esObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const noNeg = (x) => typeof x === 'number' && Number.isFinite(x) && x >= 0;

// Devuelve una lista de problemas; vacía si el objeto es válido.
export function validar(d) {
  const p = [];
  if (!esObj(d)) return ['no es un objeto de datos'];
  if (d.version !== VERSION) p.push(`versión ${d.version} no reconocida`);
  for (const k of ['entrenos', 'pesos', 'alimentosPropios']) if (!Array.isArray(d[k])) p.push(`falta la lista «${k}»`);
  if (!esObj(d.comidas)) p.push('faltan las comidas');
  if (d.perfil !== null && !esObj(d.perfil)) p.push('perfil no válido');
  if (esObj(d.perfil) && d.perfil.peso !== undefined && !noNeg(d.perfil.peso)) p.push('peso del perfil no válido');
  for (const e of Array.isArray(d.entrenos) ? d.entrenos : []) {
    if (!esObj(e) || typeof e.fecha !== 'string' || !Array.isArray(e.ejercicios)) { p.push('un entreno no es válido'); break; }
    const malas = e.ejercicios.some((j) => !Array.isArray(j?.series) || j.series.some((s) => !esObj(s) || (s.kg !== null && s.kg !== undefined && !noNeg(s.kg)) || (s.reps !== null && s.reps !== undefined && !noNeg(s.reps))));
    if (malas) { p.push('una serie tiene números no válidos'); break; }
  }
  for (const w of Array.isArray(d.pesos) ? d.pesos : []) if (!esObj(w) || !noNeg(w.kg) || typeof w.fecha !== 'string') { p.push('un peso corporal no es válido'); break; }
  return p;
}

export function exportar(d) {
  return JSON.stringify({ ...d, exportado: new Date().toISOString() }, null, 1);
}

// Devuelve { ok: true, datos } o { ok: false, error }. Nunca modifica nada por sí misma.
export function importar(texto) {
  let d;
  try { d = JSON.parse(texto); } catch { return { ok: false, error: 'El archivo no es una copia de esta app (no se puede leer).' }; }
  const problemas = validar(d);
  if (problemas.length) return { ok: false, error: 'La copia no es válida: ' + problemas.join('; ') + '.' };
  const { exportado, ...datos } = d;
  return { ok: true, datos: { ...estadoVacio(), ...datos } };
}

// storage: objeto con getItem/setItem (localStorage en el navegador, un sustituto en las pruebas).
export function crearAlmacen(storage) {
  return {
    cargar() {
      const t = storage.getItem(CLAVE);
      if (!t) return estadoVacio();
      const r = importar(t);
      return r.ok ? r.datos : estadoVacio();
    },
    guardar(d) {
      const problemas = validar(d);
      if (problemas.length) throw new Error('Datos no válidos: ' + problemas.join('; '));
      storage.setItem(CLAVE, JSON.stringify(d));
    },
    hayDatos: () => !!storage.getItem(CLAVE),
  };
}
