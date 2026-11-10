// Objetivos diarios y totales de comida. Reglas de la guía: mantenimiento ≈ peso × 30 (estimación rápida para
// hombres), proteína 2 g/kg, grasas 1 g/kg (la guía da 0,8–1,2) y el resto en carbohidratos.

export const AJUSTE_META = { perder: -400, mantener: 0, ganar: 300 };
export const COMIDAS = ['desayuno', 'almuerzo', 'cena', 'snacks'];
export const NOMBRE_COMIDA = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', cena: 'Cena', snacks: 'Snacks' };

export function objetivos(perfil) {
  if (perfil?.objetivosManual) {
    const m = perfil.objetivosManual;
    return { kcal: Math.round(m.kcal), p: Math.round(m.p), c: Math.round(m.c), g: Math.round(m.g) };
  }
  const peso = Number(perfil?.peso);
  if (!(peso > 0)) return null;
  const kcal = Math.round(peso * 30 + (AJUSTE_META[perfil.meta] ?? 0));
  const p = Math.round(peso * 2);
  const g = Math.round(peso * 1);
  const c = Math.max(0, Math.round((kcal - p * 4 - g * 9) / 4));
  return { kcal, p, c, g };
}

// entradas: [{ alimentoId, gramos }]; catalogo: { id: { kcal, p, c, g } por 100 g }
export function totales(entradas, catalogo) {
  const t = { kcal: 0, p: 0, c: 0, g: 0 };
  for (const e of entradas || []) {
    const a = catalogo[e.alimentoId];
    const gr = Number(e.gramos);
    if (!a || !(gr > 0)) continue;
    for (const k of ['kcal', 'p', 'c', 'g']) t[k] += (a[k] * gr) / 100;
  }
  return { kcal: Math.round(t.kcal), p: Math.round(t.p), c: Math.round(t.c), g: Math.round(t.g) };
}

export function totalesDelDia(dia, catalogo) {
  return totales(COMIDAS.flatMap((m) => dia?.[m] || []), catalogo);
}
