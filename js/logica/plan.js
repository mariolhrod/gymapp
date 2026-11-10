// Qué día del plan toca y la referencia de la vez anterior de cada ejercicio.

// historial: entrenos terminados [{ fecha, planId, diaIndex, ejercicios: [{ ej, series }] }], en cualquier orden.
export function siguienteDia(plan, historial) {
  const delPlan = (historial || []).filter((e) => e.planId === plan.id && e.terminado !== false);
  if (!delPlan.length) return 0;
  const ultimo = delPlan.reduce((a, b) => (a.fecha >= b.fecha ? a : b));
  return (ultimo.diaIndex + 1) % plan.dias.length;
}

// Última vez que se hizo un ejercicio (en cualquier plan): { fecha, series } o null.
// saltarDescarga: para proponer peso se ignoran las semanas de descarga (se hicieron con la mitad a propósito).
export function ultimaVez(ejId, historial, { saltarDescarga = false } = {}) {
  let mejor = null;
  for (const e of historial || []) {
    if (e.terminado === false || (saltarDescarga && e.descarga)) continue;
    const x = (e.ejercicios || []).find((j) => j.ej === ejId && (j.series || []).some((s) => s.hecha));
    if (x && (!mejor || e.fecha > mejor.fecha)) mejor = { fecha: e.fecha, series: x.series };
  }
  return mejor;
}

// Entrenos terminados en la semana (lunes a domingo) que contiene la fecha dada.
export function entrenosDeLaSemana(historial, hoy = new Date()) {
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const lunes = new Date(d); lunes.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const siguiente = new Date(lunes); siguiente.setDate(lunes.getDate() + 7);
  const iso = (x) => fechaISO(x);
  return (historial || []).filter((e) => { const d = diaLocal(e); return e.terminado !== false && d >= iso(lunes) && d < iso(siguiente); }).length;
}

export function fechaISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Día del entreno en la hora del teléfono ('YYYY-MM-DD'). La fecha completa se guarda en UTC.
export const diaLocal = (e) => e.dia || fechaISO(new Date(e.fecha));

// Días enteros entre dos fechas 'YYYY-MM-DD' (sin efecto del cambio de hora).
const utc = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const diasEntre = (a, b) => Math.round((utc(b) - utc(a)) / 86400000);

// Mejor serie (más kilos; a igualdad, más repeticiones) de cada ejercicio en todo el historial.
export function marcasPersonales(historial) {
  const m = {};
  for (const e of historial || []) {
    if (e.terminado === false) continue;
    for (const j of e.ejercicios || []) {
      for (const s of j.series || []) {
        if (!s.hecha) continue;
        const kg = Number(s.kg), reps = Number(s.reps);
        const a = m[j.ej];
        if (!a || kg > a.kg || (kg === a.kg && reps > a.reps)) m[j.ej] = { kg, reps, fecha: e.fecha };
      }
    }
  }
  return m;
}

// Serie para gráfico: [{ fecha, kg }] con el peso máximo de cada sesión del ejercicio, en orden.
export function evolucion(ejId, historial) {
  const puntos = [];
  for (const e of historial || []) {
    if (e.terminado === false) continue;
    const j = (e.ejercicios || []).find((x) => x.ej === ejId);
    const kgs = (j?.series || []).filter((s) => s.hecha).map((s) => Number(s.kg));
    if (kgs.length) puntos.push({ fecha: e.fecha, kg: Math.max(...kgs) });
  }
  return puntos.sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
}
