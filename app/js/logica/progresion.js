// Sobrecarga progresiva (guía de Mario): si completas todas las series con todas las repeticiones,
// la próxima vez sube 2,5 kg en ejercicios compuestos y 1 kg en aislados; si no, repite el peso.
// Cada 8 semanas, semana de descarga: mitad del peso, mismas repeticiones.

export const SUBIDA = { compuesto: 2.5, aislado: 1 };
export const SEMANAS_CICLO = 8;

const redondear = (kg, paso) => Math.round(kg / paso) * paso;

// Convierte lo que escribe la persona ("62,5", "62.5") en número. Devuelve null si no es válido.
export function leerNumero(texto, { max = 1000, decimales = true } = {}) {
  if (texto === null || texto === undefined) return null;
  const s = String(texto).trim().replace(',', '.');
  if (s === '' || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  if (!decimales && !Number.isInteger(n)) return null;
  return n;
}

// sesion: { series: [{ kg, reps, hecha }] } — la última vez que se hizo el ejercicio.
export function completoTodo(sesion, objetivo) {
  const s = sesion?.series || [];
  if (s.length < objetivo.series) return false;
  return s.slice(0, objetivo.series).every((x) => x.hecha && Number(x.reps) >= objetivo.reps);
}

export function pesoUsado(sesion) {
  const kgs = (sesion?.series || []).filter((x) => x.hecha && Number(x.kg) >= 0).map((x) => Number(x.kg));
  return kgs.length ? Math.max(...kgs) : null;
}

// Devuelve { kg, motivo } o null si no hay referencia (primera vez) o el ejercicio se mide en tiempo.
export function propuesta(tipo, sesionAnterior, objetivo, { descarga = false } = {}) {
  if (tipo === 'tiempo') return null;
  const kg = pesoUsado(sesionAnterior);
  if (kg === null) return null;
  if (descarga) return { kg: redondear(kg / 2, 0.5), motivo: 'descarga' };
  if (completoTodo(sesionAnterior, objetivo)) return { kg: kg + (SUBIDA[tipo] ?? 1), motivo: 'subir' };
  return { kg, motivo: 'repetir' };
}

// Semana del plan (1, 2, …) contando desde el día en que se empezó.
export function semanaDelPlan(inicioISO, hoy = new Date()) {
  const ini = new Date(inicioISO + 'T00:00:00');
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dias = Math.floor((d - ini) / 86400000);
  return dias < 0 ? 1 : Math.floor(dias / 7) + 1;
}

export const esSemanaDescarga = (semana) => semana > 0 && semana % SEMANAS_CICLO === 0;

export const formatoKg = (kg) => (kg === null || kg === undefined ? '—' : String(kg).replace('.', ','));
