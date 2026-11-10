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
    entrenos: [],            // [{ id, fecha (ISO UTC), dia ('YYYY-MM-DD' local), planId, diaIndex, terminado, descarga, ejercicios: [{ ej, series: [{kg, reps, hecha}] }] }]
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
  const texto = (x) => typeof x === 'string' && x.length > 0 && x.length <= 80;
  for (const a of Array.isArray(d.alimentosPropios) ? d.alimentosPropios : []) {
    if (!esObj(a) || !texto(a.id) || !texto(a.nombre) || !['kcal', 'p', 'c', 'g', 'porcion'].every((k) => noNeg(a[k]))) { p.push('un alimento propio no es válido'); break; }
  }
  if (esObj(d.comidas)) {
    const malo = Object.entries(d.comidas).some(([f, dia]) => !/^\d{4}-\d{2}-\d{2}$/.test(f) || !esObj(dia) || (dia.agua !== undefined && !noNeg(dia.agua)) ||
      Object.entries(dia).some(([k, v]) => k !== 'agua' && (!Array.isArray(v) || v.some((x) => !esObj(x) || !texto(x.alimentoId) || !noNeg(x.gramos)))));
    if (malo) p.push('una comida no es válida');
  }
  const numONulo = (x) => x === null || x === undefined || noNeg(x);
  if (d.enCurso !== null && d.enCurso !== undefined) {
    const e = d.enCurso;
    const ok = esObj(e) && typeof e.fecha === 'string' && Array.isArray(e.ejercicios) && e.ejercicios.length > 0 && e.ejercicios.every((j) => esObj(j) && texto(j.ej) &&
      esObj(j.objetivo) && noNeg(j.objetivo.series) && noNeg(j.objetivo.reps) && Array.isArray(j.series) && j.series.every((s) => esObj(s) && numONulo(s.kg) && numONulo(s.reps)));
    if (!ok) p.push('el entreno empezado no es válido');
  }
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
    problemaAlCargar: null,
    // Si lo guardado no se puede leer, se aparta una copia intacta antes de empezar de cero (nunca se pierde).
    cargar(ahora = Date.now()) {
      const t = storage.getItem(CLAVE);
      if (!t) return estadoVacio();
      const r = importar(t);
      if (r.ok) return r.datos;
      const clave = `${CLAVE}.ilegible-${ahora}`;
      try { storage.setItem(clave, t); } catch { /* sin espacio: se avisa igualmente */ }
      this.problemaAlCargar = { clave, error: r.error };
      return estadoVacio();
    },
    // Antes de restaurar una copia, se guardan los datos actuales aparte.
    respaldar(d) { storage.setItem(`${CLAVE}.antes-de-restaurar`, JSON.stringify(d)); },
    guardar(d) {
      const problemas = validar(d);
      if (problemas.length) throw new Error('Datos no válidos: ' + problemas.join('; '));
      storage.setItem(CLAVE, JSON.stringify(d));
    },
    hayDatos: () => !!storage.getItem(CLAVE),
  };
}
