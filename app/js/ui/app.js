// Pantallas de la app. Navegación por la parte de la dirección tras «#» (#/hoy, #/entreno, …).
import { EJERCICIOS, EJERCICIO, fotosDe } from '../datos/ejercicios.js';
import { PLANES, PLAN, PLAN_INICIAL } from '../datos/planes.js';
import { ALIMENTOS, ALIMENTO } from '../datos/alimentos.js';
import { objetivos, totales, totalesDelDia, COMIDAS, NOMBRE_COMIDA } from '../logica/nutricion.js';
import { propuesta, leerNumero, semanaDelPlan, esSemanaDescarga, formatoKg } from '../logica/progresion.js';
import { siguienteDia, ultimaVez, entrenosDeLaSemana, fechaISO, marcasPersonales, evolucion } from '../logica/plan.js';
import { crearAlmacen, exportar, importar } from '../logica/almacen.js';

const almacen = crearAlmacen(window.localStorage);
let datos = almacen.cargar();
const ui = { anadir: null, filtro: '', armadoTerminar: false, ejProgreso: null, crearAlimento: false };
const $app = document.getElementById('app');

// ---------- utilidades
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const num = (n) => Number(n).toLocaleString('es-ES');
const catalogo = () => ({ ...ALIMENTO, ...Object.fromEntries((datos.alimentosPropios || []).map((a) => [a.id, a])) });
const plan = () => PLAN[datos.planId] || PLAN[PLAN_INICIAL];
const terminados = () => datos.entrenos.filter((e) => e.terminado !== false);
function guardar() {
  try { almacen.guardar(datos); } catch (e) { aviso('No se pudo guardar: ' + e.message); }
}
let tAviso;
function aviso(texto) {
  document.querySelector('.mensaje')?.remove();
  const d = document.createElement('div'); d.className = 'mensaje'; d.setAttribute('role', 'status'); d.textContent = texto;
  document.body.appendChild(d); clearTimeout(tAviso); tAviso = setTimeout(() => d.remove(), 3000);
}
const ir = (ruta) => { if (location.hash === ruta) render(); else location.hash = ruta; };
const fechaLarga = (d = new Date()) => { const t = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }); return t.charAt(0).toUpperCase() + t.slice(1); };
const diasDesde = (iso) => Math.max(0, Math.round((new Date(fechaISO()) - new Date(iso.slice(0, 10))) / 86400000));
const haceTexto = (iso) => { const d = diasDesde(iso); return d === 0 ? 'hoy' : d === 1 ? 'ayer' : `hace ${d} días`; };

const ICONO = {
  hoy: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  rutinas: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',
  comida: '<path d="M7 3v8a3 3 0 0 0 3 3v7M7 3v5M10 3v5M17 3c-2 2-2 6 0 8v10"/>',
  progreso: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  ajustes: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
};
const svg = (n, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" ${extra}>${ICONO[n]}</svg>`;

function tabs(sel) {
  const t = (id, txt) => `<a href="#/${id}" class="${sel === id ? 'sel ' + id : ''}" ${sel === id ? 'aria-current="page"' : ''}>${svg(id)}${txt}</a>`;
  return `<nav class="tabs" aria-label="Secciones">${t('hoy', 'Hoy')}${t('rutinas', 'Rutinas')}${t('comida', 'Comida')}${t('progreso', 'Progreso')}</nav>`;
}

// ---------- primer uso
function vInicio() {
  const opciones = PLANES.map((p) => `<option value="${p.id}" ${p.id === PLAN_INICIAL ? 'selected' : ''}>${esc(p.nombre)} — ${esc(p.nivel)}</option>`).join('');
  return `<main class="pantalla">
    <h1 class="titulo">Bienvenido</h1>
    <p class="sub">Tres datos para empezar. Todo se guarda solo en este teléfono y lo puedes cambiar en Ajustes.</p>
    <form id="f-inicio" class="tarjeta" novalidate>
      <label class="campo">Tu nombre<input type="text" name="nombre" autocomplete="given-name" value="Mario"></label>
      <label class="campo">Tu peso (kg)<input type="text" name="peso" inputmode="decimal" placeholder="Por ejemplo 78,5"></label>
      <label class="campo">Tu meta<select name="meta"><option value="ganar">Ganar músculo</option><option value="mantener">Mantener</option><option value="perder">Perder grasa</option></select></label>
      <label class="campo">Tu plan de entreno<select name="plan">${opciones}</select></label>
      <p class="error" id="err-inicio" role="alert"></p>
      <button class="btn" type="submit">Empezar</button>
    </form>
  </main>`;
}

// ---------- Hoy
function vHoy() {
  const p = plan(); const idx = siguienteDia(p, terminados()); const dia = p.dias[idx];
  const semana = semanaDelPlan(datos.planInicio || fechaISO()); const descarga = esSemanaDescarga(semana);
  const anterior = terminados().filter((e) => e.planId === p.id && e.diaIndex === idx).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
  const hechos = entrenosDeLaSemana(terminados());
  const o = objetivos(datos.perfil); const t = totalesDelDia(datos.comidas[fechaISO()], catalogo());
  let consejo = '';
  for (const x of dia.ejercicios) {
    const e = EJERCICIO[x.ej]; const pr = propuesta(e.tipo, ultimaVez(x.ej, terminados()), x, { descarga });
    if (pr?.motivo === 'subir') { consejo = `${esc(e.nombre)}: hoy toca subir a <b>${formatoKg(pr.kg)} kg</b>. La última vez completaste todas las series.`; break; }
  }
  const boton = datos.enCurso ? `<a class="btn" href="#/entreno">Seguir el entreno empezado</a>` : `<button class="btn" data-a="empezar">Empezar entreno</button>`;
  return `<main class="pantalla">
    <div class="cabecera"><div><div class="sub">${esc(fechaLarga())}</div><h1 class="titulo">Hola, ${esc(datos.perfil?.nombre || '')}</h1></div>
      <a class="btn sec redondo" href="#/ajustes" aria-label="Ajustes">${svg('ajustes', 'width="22" height="22"')}</a></div>
    ${descarga ? `<div class="tarjeta aviso"><b>Semana de descarga.</b> Tu guía la pide cada 8 semanas: la mitad del peso y las mismas repeticiones, para recuperarte.</div>` : ''}
    <section class="hero" aria-label="Entreno de hoy">
      <span class="mini">Entreno de hoy · día ${idx + 1} de ${p.dias.length}</span>
      <span class="nombre">${esc(dia.nombre)}</span>
      <span>${dia.ejercicios.length} ejercicios · ${anterior ? 'la última vez: ' + haceTexto(anterior.fecha) : 'primera vez'}</span>
      ${boton}
    </section>
    <div class="rejilla2">
      <div class="tarjeta"><span class="sub">Esta semana</span><span class="grande">${hechos} de ${p.diasSemana}</span><span class="sub">entrenos hechos</span></div>
      <div class="tarjeta"><span class="sub">Tu plan</span><span class="grande">Semana ${semana}</span><span class="sub">${descarga ? 'de descarga' : 'de 8 del ciclo'}</span></div>
    </div>
    <a class="tarjeta enlace-tarjeta" href="#/comida">
      <div class="fila"><b>Alimentación de hoy</b><span class="sub" style="color:var(--naranja)">${o ? `${num(t.kcal)} de ${num(o.kcal)} kcal` : 'añade tu peso en Ajustes'}</span></div>
      ${o ? `<div class="barra"><div style="width:${Math.min(100, (t.kcal / o.kcal) * 100)}%;background:var(--naranja)"></div></div>
      <div class="fila sub"><span>Proteína ${t.p} / ${o.p} g</span><span>Carbos ${t.c} / ${o.c} g</span><span>Grasa ${t.g} / ${o.g} g</span></div>` : ''}
    </a>
    ${consejo ? `<div class="tarjeta"><span>${consejo}</span></div>` : ''}
  </main>${tabs('hoy')}`;
}

// ---------- Rutinas
function vRutinas() {
  const p = plan(); const idx = siguienteDia(p, terminados());
  const dias = p.dias.map((d, i) => `<details class="tarjeta ${i === idx ? 'activa' : ''}" ${i === idx ? 'open' : ''}>
      <summary class="fila" style="cursor:pointer"><span><b>${esc(d.nombre)}</b><br><span class="sub">${d.ejercicios.length} ejercicios</span></span>${i === idx ? '<span class="marca">Hoy</span>' : ''}</summary>
      <div class="lista">${d.ejercicios.map((x) => `<a class="enlace-tarjeta" href="#/ficha/${x.ej}"><span>${esc(EJERCICIO[x.ej].nombre)}</span><span class="sub">${x.series} × ${x.reps}${EJERCICIO[x.ej].tipo === 'tiempo' ? ' s' : ''} ›</span></a>`).join('')}</div>
    </details>`).join('');
  const otros = PLANES.map((q) => `<button class="tarjeta item-boton ${q.id === p.id ? 'activa' : ''}" data-a="plan" data-id="${q.id}">
      <b>${esc(q.nombre)}</b><span class="sub">${esc(q.nivel)}</span>${q.id === p.id ? '<span class="marca" style="align-self:flex-start">Plan activo</span>' : ''}</button>`).join('');
  return `<main class="pantalla">
    <h1 class="titulo">Rutinas</h1>
    <div class="tarjeta"><span class="sub" style="color:var(--lima);font-weight:700">PLAN ACTIVO</span><b style="font-size:20px">${esc(p.nombre)}</b>
      <span class="sub">Semana ${semanaDelPlan(datos.planInicio || fechaISO())} · basado en tu guía · descanso ${p.descanso.compuesto / 60} min en ejercicios grandes y ${p.descanso.aislado} s en pequeños</span></div>
    <span class="etiqueta">Días del plan</span>${dias}
    <span class="etiqueta">Biblioteca de ejercicios</span>
    <div class="tarjeta lista">${EJERCICIOS.map((e) => `<a class="enlace-tarjeta" href="#/ficha/${e.id}"><span>${esc(e.nombre)}</span><span class="sub">${esc(e.musculos[0])} ›</span></a>`).join('')}</div>
    <span class="etiqueta">Cambiar de plan</span>${otros}
    <p class="sub">Al cambiar de plan tu historial se conserva.</p>
  </main>${tabs('rutinas')}`;
}

// ---------- Ficha de ejercicio
function vFicha(id) {
  const e = EJERCICIO[id];
  if (!e) return `<main class="pantalla"><p>Ejercicio no encontrado.</p><a href="#/rutinas">Volver</a></main>${tabs('rutinas')}`;
  const [f0, f1] = fotosDe(id); const u = ultimaVez(id, terminados()); const pr = marcasPersonales(terminados())[id];
  return `<main class="pantalla">
    <button class="volver" data-a="atras">‹ Volver</button>
    <h1 class="titulo" style="font-size:26px">${esc(e.nombre)}</h1>
    <div class="chips">${e.musculos.map((m) => `<span class="chip">${esc(m)}</span>`).join('')}</div>
    <div class="fotos"><img src="${f0}" alt="${esc(e.nombre)}: posición inicial"><img class="final" src="${f1}" alt="${esc(e.nombre)}: posición final"></div>
    <span class="sub" style="text-align:center">Alterna la posición inicial y la final · fotos de dominio público (free-exercise-db)</span>
    <div class="tarjeta"><b>Cómo se hace</b><ol class="pasos">${e.pasos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol></div>
    <div class="tarjeta aviso">Error común: ${esc(e.error)}</div>
    ${u ? `<div class="tarjeta"><b>Tu historial</b><span class="sub">La última vez (${haceTexto(u.fecha)}): ${u.series.filter((s) => s.hecha).map((s) => `${formatoKg(s.kg)} × ${s.reps}`).join(', ')}</span>${pr ? `<span class="sub">Tu mejor serie: ${formatoKg(pr.kg)} kg × ${pr.reps}</span>` : ''}</div>` : ''}
  </main>${tabs('rutinas')}`;
}

// ---------- Entreno
function crearEntreno() {
  const p = plan(); const idx = siguienteDia(p, terminados());
  const descarga = esSemanaDescarga(semanaDelPlan(datos.planInicio || fechaISO()));
  datos.enCurso = {
    id: nuevoId(), fecha: new Date().toISOString(), planId: p.id, diaIndex: idx, terminado: false, actual: 0, descansoHasta: null,
    ejercicios: p.dias[idx].ejercicios.map((x) => {
      const pr = propuesta(EJERCICIO[x.ej].tipo, ultimaVez(x.ej, terminados()), x, { descarga });
      return { ej: x.ej, objetivo: { series: x.series, reps: x.reps }, propuesta: pr, series: Array.from({ length: x.series }, () => ({ kg: pr ? pr.kg : null, reps: null, hecha: false })) };
    }),
  };
  guardar();
}

function vEntreno() {
  const en = datos.enCurso;
  if (!en) return `<main class="pantalla"><h1 class="titulo">Entreno</h1><p class="sub">No hay ningún entreno empezado.</p><button class="btn" data-a="empezar">Empezar el entreno de hoy</button></main>${tabs('hoy')}`;
  const i = Math.min(en.actual || 0, en.ejercicios.length - 1); const x = en.ejercicios[i]; const e = EJERCICIO[x.ej];
  const p = PLAN[en.planId]; const u = ultimaVez(x.ej, terminados()); const esTiempo = e.tipo === 'tiempo';
  const antTxt = (n) => { const s = u?.series?.[n]; return s && s.hecha ? (esTiempo ? `${s.reps} s` : `${formatoKg(s.kg)} × ${s.reps}`) : '—'; };
  const filas = x.series.map((s, n) => `<div class="serie ${s.hecha ? 'hecha' : ''}">
      <span class="n">${n + 1}</span><span class="ant">${antTxt(n)}</span>
      ${esTiempo ? '<span class="sub" style="text-align:center">—</span>' : `<label><span class="oculto">Kilos de la serie ${n + 1}</span><input type="text" inputmode="decimal" data-e="${i}" data-s="${n}" data-k="kg" value="${s.kg ?? ''}" placeholder="${x.propuesta ? formatoKg(x.propuesta.kg) : 'kg'}"></label>`}
      <label><span class="oculto">${esTiempo ? 'Segundos' : 'Repeticiones'} de la serie ${n + 1}</span><input type="text" inputmode="numeric" data-e="${i}" data-s="${n}" data-k="reps" value="${s.reps ?? ''}" placeholder="${x.objetivo.reps}"></label>
      <button class="check ${s.hecha ? 'si' : ''}" data-a="hecha" data-e="${i}" data-s="${n}" aria-label="${s.hecha ? 'Desmarcar' : 'Marcar hecha'} la serie ${n + 1}" aria-pressed="${s.hecha}">${s.hecha ? '✓' : ''}</button>
    </div>`).join('');
  const pr = x.propuesta;
  const consejo = pr ? (pr.motivo === 'subir' ? `La última vez completaste todo: hoy prueba con ${formatoKg(pr.kg)} kg.` : pr.motivo === 'descarga' ? `Semana de descarga: mitad de peso (${formatoKg(pr.kg)} kg).` : `Repite ${formatoKg(pr.kg)} kg hasta completar todas las series.`) : (esTiempo ? 'Aguanta los segundos marcados.' : 'Primera vez: elige un peso con el que hagas las repeticiones con buena técnica.');
  const opciones = EJERCICIOS.filter((z) => z.id !== x.ej).map((z) => `<option value="${z.id}">${esc(z.nombre)}</option>`).join('');
  const puntos = en.ejercicios.map((z, k) => `<button class="punto ${z.series.every((s) => s.hecha) ? 'hecho' : ''} ${k === i ? 'actual' : ''}" data-a="ir" data-e="${k}" aria-label="Ir al ejercicio ${k + 1}" style="border:0;padding:0;cursor:pointer"></button>`).join('');
  return `<main class="pantalla">
    <div class="cabecera"><button class="volver" data-a="salir">‹ Salir</button><span class="grande" id="duracion"></span>
      <button class="btn peq" data-a="terminar">${ui.armadoTerminar ? '¿Seguro? Toca otra vez' : 'Terminar'}</button></div>
    <div class="fila"><span class="sub">${esc(p?.dias[en.diaIndex]?.nombre || '')} · ejercicio ${i + 1} de ${en.ejercicios.length}</span><div class="puntos">${puntos}</div></div>
    <section class="tarjeta">
      <div class="fila"><h1 style="margin:0;font-size:22px">${esc(e.nombre)}</h1><a class="btn sec redondo" href="#/ficha/${x.ej}" aria-label="Cómo se hace">?</a></div>
      <span class="sub">Objetivo: ${x.objetivo.series} series de ${x.objetivo.reps}${esTiempo ? ' segundos' : ''}. ${esc(consejo)}</span>
      <div class="series"><div class="serie cab"><span>Serie</span><span>Anterior</span><span>${esTiempo ? '' : 'Kg'}</span><span>${esTiempo ? 'Seg' : 'Reps'}</span><span></span></div>${filas}</div>
      <p class="error" id="err-serie" role="alert"></p>
      <div class="fila"><button class="btn sec peq" data-a="mas-serie" data-e="${i}">+ Serie</button>
        <label style="flex:1"><span class="oculto">Cambiar este ejercicio por otro</span><select data-cambiar="${i}"><option value="">Cambiar por otro…</option>${opciones}</select></label></div>
    </section>
    <section class="tarjeta" id="descanso" ${en.descansoHasta ? '' : 'hidden'} style="border-color:var(--lima)">
      <div class="fila"><div><span class="sub">Descanso</span><div class="reloj" id="reloj" aria-live="polite">0:00</div></div>
        <div style="display:flex;gap:8px"><button class="btn sec peq" data-a="desc" data-d="-15">−15 s</button><button class="btn sec peq" data-a="desc" data-d="15">+15 s</button><button class="btn sec peq" data-a="desc" data-d="0">Saltar</button></div></div>
    </section>
    <div class="fila"><button class="btn sec" data-a="ir" data-e="${i - 1}" ${i === 0 ? 'disabled' : ''}>‹ Anterior</button>
      <button class="btn ${i === en.ejercicios.length - 1 ? 'sec' : ''}" data-a="ir" data-e="${i + 1}" ${i === en.ejercicios.length - 1 ? 'disabled' : ''}>Siguiente ›</button></div>
    ${i < en.ejercicios.length - 1 ? `<span class="sub">Siguiente: ${esc(EJERCICIO[en.ejercicios[i + 1].ej].nombre)} · ${en.ejercicios[i + 1].objetivo.series} × ${en.ejercicios[i + 1].objetivo.reps}</span>` : '<span class="sub">Es el último ejercicio. Cuando acabes, pulsa «Terminar».</span>'}
  </main>`;
}

function terminarEntreno() {
  const en = datos.enCurso; if (!en) return;
  const hechas = en.ejercicios.reduce((n, x) => n + x.series.filter((s) => s.hecha).length, 0);
  if (hechas === 0) { datos.enCurso = null; guardar(); aviso('Entreno descartado: no marcaste ninguna serie.'); ir('#/hoy'); return; }
  datos.entrenos.push({ id: en.id, fecha: new Date().toISOString(), inicio: en.fecha, planId: en.planId, diaIndex: en.diaIndex, terminado: true,
    ejercicios: en.ejercicios.map((x) => ({ ej: x.ej, objetivo: x.objetivo, series: x.series.map((s) => ({ kg: s.kg ?? 0, reps: s.reps ?? 0, hecha: !!s.hecha })) })) });
  datos.enCurso = null; guardar(); aviso(`Entreno guardado: ${hechas} series. ¡Buen trabajo!`); ir('#/hoy');
}

// ---------- Comida
function vComida(fecha) {
  const f = fecha || fechaISO(); const cat = catalogo(); const dia = datos.comidas[f] || {};
  const o = objetivos(datos.perfil); const t = totalesDelDia(dia, cat);
  const quedan = o ? o.kcal - t.kcal : 0; const frac = o ? Math.min(1, t.kcal / o.kcal) : 0; const L = 2 * Math.PI * 44;
  const macro = (nom, v, obj, color) => `<div><div class="fila sub"><span style="color:var(--texto)">${nom}</span><span>${v} / ${obj ?? '—'} g</span></div><div class="barra" style="height:6px"><div style="width:${obj ? Math.min(100, (v / obj) * 100) : 0}%;background:${color}"></div></div></div>`;
  const comidas = COMIDAS.map((m) => {
    const ent = dia[m] || []; const tm = totales(ent, cat);
    const abierto = ui.anadir?.comida === m;
    return `<section class="tarjeta ${ent.length ? '' : 'punteada'}">
      <div class="fila"><b>${NOMBRE_COMIDA[m]}</b><span class="sub">${ent.length ? num(tm.kcal) + ' kcal' : ''}</span>
        <button class="btn naranja peq" data-a="abrir-anadir" data-m="${m}" aria-expanded="${abierto}">${abierto ? 'Cerrar' : '+ Añadir'}</button></div>
      ${ent.length ? `<div class="lista">${ent.map((x, k) => `<div><span>${esc(cat[x.alimentoId]?.nombre || 'Alimento borrado')} <span class="sub">· ${num(x.gramos)} g · ${num(Math.round((cat[x.alimentoId]?.kcal || 0) * x.gramos / 100))} kcal</span></span><button class="quitar" data-a="quitar" data-m="${m}" data-i="${k}" aria-label="Quitar">×</button></div>`).join('')}</div>` : ''}
      ${abierto ? vAnadir(m, cat) : ''}
    </section>`;
  }).join('');
  const agua = dia.agua || 0;
  const ayer = new Date(f + 'T12:00:00'); ayer.setDate(ayer.getDate() - 1); const man = new Date(f + 'T12:00:00'); man.setDate(man.getDate() + 1);
  return `<main class="pantalla">
    <div class="cabecera"><h1 class="titulo">Alimentación</h1></div>
    <div class="fila"><a class="btn sec peq" href="#/comida/${fechaISO(ayer)}" aria-label="Día anterior">‹</a><b>${f === fechaISO() ? 'Hoy' : esc(fechaLarga(new Date(f + 'T12:00:00')))}</b>
      <a class="btn sec peq" href="#/comida/${fechaISO(man)}" aria-label="Día siguiente" ${f >= fechaISO() ? 'style="visibility:hidden"' : ''}>›</a></div>
    ${o ? `<section class="tarjeta" style="flex-direction:row;align-items:center;gap:16px">
      <svg width="104" height="104" viewBox="0 0 104 104" role="img" aria-label="Llevas ${t.kcal} de ${o.kcal} kilocalorías">
        <circle cx="52" cy="52" r="44" fill="none" stroke="#262a33" stroke-width="10"/>
        <circle cx="52" cy="52" r="44" fill="none" stroke="${quedan < 0 ? '#ff8a8a' : '#ffa45c'}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(frac * L).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 52 52)"/>
        <text x="52" y="50" text-anchor="middle" fill="#f2f4f7" font-size="20" font-weight="700">${num(Math.abs(quedan))}</text>
        <text x="52" y="68" text-anchor="middle" fill="#9aa1ad" font-size="11">${quedan < 0 ? 'kcal de más' : 'kcal quedan'}</text></svg>
      <div style="flex:1;display:flex;flex-direction:column;gap:10px">${macro('Proteína', t.p, o.p, 'var(--lima)')}${macro('Carbohidratos', t.c, o.c, 'var(--naranja)')}${macro('Grasas', t.g, o.g, 'var(--azul)')}</div>
    </section>` : `<div class="tarjeta">Añade tu peso en <a href="#/ajustes">Ajustes</a> para calcular tus objetivos.</div>`}
    ${comidas}
    <section class="tarjeta"><div class="fila"><b>Agua</b><span class="sub">${agua} de 8 vasos</span>
      <span style="display:flex;gap:8px"><button class="btn sec peq" data-a="agua" data-d="-1" aria-label="Quitar un vaso" ${agua ? '' : 'disabled'}>−</button><button class="btn sec peq" data-a="agua" data-d="1" aria-label="Añadir un vaso">+</button></span></div></section>
  </main>${tabs('comida')}`;
}

function vAnadir(m, cat) {
  const a = ui.anadir;
  if (a.alimentoId) {
    const al = cat[a.alimentoId];
    return `<form id="f-gramos" class="tarjeta" style="background:#20242c" novalidate>
      <b>${esc(al.nombre)}</b><span class="sub">${al.kcal} kcal · P ${al.p} g · C ${al.c} g · G ${al.g} g por 100 g</span>
      <label class="campo">Cantidad (gramos)<input type="text" inputmode="decimal" name="gramos" value="${al.porcion}" autofocus></label>
      <p class="error" id="err-gramos" role="alert"></p>
      <div class="fila"><button type="button" class="btn sec peq" data-a="volver-lista">‹ Otro alimento</button><button class="btn naranja" type="submit">Añadir</button></div>
    </form>`;
  }
  if (ui.crearAlimento) {
    return `<form id="f-crear" class="tarjeta" style="background:#20242c" novalidate>
      <b>Crear alimento (valores por 100 g)</b>
      <label class="campo">Nombre<input type="text" name="nombre" maxlength="60"></label>
      <div class="rejilla2"><label class="campo">Kcal<input type="text" inputmode="decimal" name="kcal"></label><label class="campo">Proteína (g)<input type="text" inputmode="decimal" name="p"></label>
      <label class="campo">Carbos (g)<input type="text" inputmode="decimal" name="c"></label><label class="campo">Grasas (g)<input type="text" inputmode="decimal" name="g"></label></div>
      <label class="campo">Porción habitual (g)<input type="text" inputmode="decimal" name="porcion" value="100"></label>
      <p class="error" id="err-crear" role="alert"></p>
      <div class="fila"><button type="button" class="btn sec peq" data-a="volver-lista">‹ Volver</button><button class="btn naranja" type="submit">Guardar alimento</button></div>
    </form>`;
  }
  return `<div class="tarjeta" style="background:#20242c">
    <label><span class="oculto">Buscar alimento</span><input type="search" id="busca" placeholder="Buscar alimento…" value="${esc(ui.filtro)}" autocomplete="off"></label>
    <div class="lista" id="resultados">${listaAlimentos(cat)}</div>
    <button class="btn sec peq" data-a="crear-alimento">+ Crear un alimento nuevo</button>
  </div>`;
}

const sinAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function listaAlimentos(cat) {
  const q = sinAcentos(ui.filtro.trim());
  const todos = Object.values(cat).filter((a) => !q || sinAcentos(a.nombre).includes(q)).slice(0, 40);
  if (!todos.length) return '<span class="sub">Ninguno coincide. Puedes crearlo.</span>';
  return todos.map((a) => `<button class="item-boton" data-a="elegir" data-id="${esc(a.id)}"><span>${esc(a.nombre)}</span><span class="sub">${a.kcal} kcal/100 g ›</span></button>`).join('');
}

// ---------- Progreso
function vProgreso() {
  const h = terminados(); const marcas = marcasPersonales(h);
  const conHistorial = Object.keys(marcas).filter((id) => EJERCICIO[id] && EJERCICIO[id].tipo !== 'tiempo');
  const sel = conHistorial.includes(ui.ejProgreso) ? ui.ejProgreso : conHistorial[0];
  const pts = sel ? evolucion(sel, h) : [];
  let grafico = '<span class="sub">Cuando termines entrenos, aquí verás cómo sube tu peso en cada ejercicio.</span>';
  if (pts.length) {
    const kgs = pts.map((p) => p.kg); const min = Math.min(...kgs), max = Math.max(...kgs); const r = max - min || 1;
    const xy = pts.map((p, k) => [pts.length === 1 ? 160 : 6 + (k * 308) / (pts.length - 1), 106 - ((p.kg - min) / r) * 90]);
    const dif = kgs[kgs.length - 1] - kgs[0];
    grafico = `<div class="fila"><span class="sub">${pts.length} sesiones</span><span style="color:var(--lima);font-size:13px">${dif > 0 ? '+' : ''}${formatoKg(dif)} kg</span></div>
      <svg viewBox="0 0 320 116" width="100%" role="img" aria-label="Evolución del peso en ${esc(EJERCICIO[sel].nombre)}: de ${formatoKg(kgs[0])} a ${formatoKg(kgs[kgs.length - 1])} kilos">
        <line x1="0" y1="110" x2="320" y2="110" stroke="#262a33"/><polyline fill="none" stroke="#c8f169" stroke-width="3" stroke-linejoin="round" points="${xy.map((p) => p.join(',')).join(' ')}"/>
        ${xy.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#c8f169"/>`).join('')}</svg>
      <div class="fila sub"><span>${formatoKg(kgs[0])} kg</span><span>Ahora · ${formatoKg(kgs[kgs.length - 1])} kg</span></div>`;
  }
  const pesos = [...datos.pesos].sort((a, b) => (a.fecha < b.fecha ? -1 : 1)); const ultimo = pesos[pesos.length - 1];
  const hace30 = pesos.filter((p) => diasDesde(p.fecha) <= 31)[0];
  const histo = [...h].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 10).map((e) => {
    const series = e.ejercicios.reduce((n, x) => n + x.series.filter((s) => s.hecha).length, 0);
    return `<div><span>${esc(PLAN[e.planId]?.dias[e.diaIndex]?.nombre || 'Entreno')}<br><span class="sub">${esc(fechaLarga(new Date(e.fecha)))}</span></span><span class="sub">${series} series</span></div>`;
  }).join('');
  return `<main class="pantalla">
    <h1 class="titulo">Progreso</h1>
    <section class="tarjeta">${conHistorial.length ? `<label><span class="oculto">Ejercicio</span><select data-progreso>${conHistorial.map((id) => `<option value="${id}" ${id === sel ? 'selected' : ''}>${esc(EJERCICIO[id].nombre)}</option>`).join('')}</select></label>` : ''}${grafico}</section>
    <div class="rejilla2">
      <div class="tarjeta"><span class="sub">Peso corporal</span><span class="grande">${ultimo ? formatoKg(ultimo.kg) + ' kg' : '—'}</span>
        <span class="sub">${ultimo && hace30 && hace30 !== ultimo ? `${ultimo.kg - hace30.kg > 0 ? '+' : ''}${formatoKg(Math.round((ultimo.kg - hace30.kg) * 10) / 10)} kg este mes` : 'anota tu peso abajo'}</span></div>
      <div class="tarjeta"><span class="sub">Entrenos</span><span class="grande">${h.length}</span><span class="sub">en total</span></div>
    </div>
    <form id="f-peso" class="tarjeta" novalidate><div class="fila"><label class="campo" style="flex:1">Anotar el peso de hoy (kg)<input type="text" inputmode="decimal" name="kg" placeholder="${ultimo ? formatoKg(ultimo.kg) : '78,5'}"></label>
      <button class="btn peq" type="submit" style="align-self:flex-end">Guardar</button></div><p class="error" id="err-peso" role="alert"></p></form>
    <span class="etiqueta">Marcas personales</span>
    <div class="tarjeta lista">${Object.keys(marcas).length ? Object.entries(marcas).filter(([id]) => EJERCICIO[id]).map(([id, m]) => `<div><span>${esc(EJERCICIO[id].nombre)}</span><b>${EJERCICIO[id].tipo === 'tiempo' ? m.reps + ' s' : formatoKg(m.kg) + ' kg × ' + m.reps}</b></div>`).join('') : '<span class="sub">Aún no hay marcas.</span>'}</div>
    <span class="etiqueta">Últimos entrenos</span>
    <div class="tarjeta lista">${histo || '<span class="sub">Aún no hay entrenos terminados.</span>'}</div>
  </main>${tabs('progreso')}`;
}

// ---------- Ajustes
function vAjustes() {
  const p = datos.perfil || {}; const m = p.objetivosManual; const o = objetivos(p);
  return `<main class="pantalla">
    <button class="volver" data-a="atras">‹ Volver</button>
    <h1 class="titulo">Ajustes</h1>
    <form id="f-perfil" class="tarjeta" novalidate>
      <b>Tu perfil</b>
      <label class="campo">Nombre<input type="text" name="nombre" value="${esc(p.nombre || '')}" maxlength="40"></label>
      <label class="campo">Peso (kg)<input type="text" inputmode="decimal" name="peso" value="${p.peso ? formatoKg(p.peso) : ''}"></label>
      <label class="campo">Meta<select name="meta">${[['ganar', 'Ganar músculo'], ['mantener', 'Mantener'], ['perder', 'Perder grasa']].map(([v, t]) => `<option value="${v}" ${p.meta === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="fila" style="font-size:15px"><span>Poner mis propios objetivos de comida</span><input type="checkbox" name="manual" ${m ? 'checked' : ''} style="width:24px;height:24px"></label>
      <div class="rejilla2" ${m ? '' : 'hidden'} id="manuales">
        <label class="campo">Kcal<input type="text" inputmode="decimal" name="kcal" value="${m?.kcal ?? o?.kcal ?? ''}"></label><label class="campo">Proteína (g)<input type="text" inputmode="decimal" name="p" value="${m?.p ?? o?.p ?? ''}"></label>
        <label class="campo">Carbos (g)<input type="text" inputmode="decimal" name="c" value="${m?.c ?? o?.c ?? ''}"></label><label class="campo">Grasas (g)<input type="text" inputmode="decimal" name="g" value="${m?.g ?? o?.g ?? ''}"></label>
      </div>
      <span class="sub">${o ? `Objetivo actual: ${num(o.kcal)} kcal · proteína ${o.p} g · carbos ${o.c} g · grasas ${o.g} g.` : ''} Se calcula con tu guía: peso × 30 (+300 para ganar músculo, −400 para perder grasa), proteína 2 g por kilo y grasas 1 g por kilo.</span>
      <p class="error" id="err-perfil" role="alert"></p>
      <button class="btn" type="submit">Guardar perfil</button>
    </form>
    <section class="tarjeta"><b>Copia de seguridad</b>
      <span class="sub">Tus datos solo están en este teléfono. Guarda una copia de vez en cuando (por ejemplo en Archivos o iCloud).</span>
      <button class="btn sec" data-a="exportar">Guardar una copia</button>
      <label class="btn sec" style="cursor:pointer">Restaurar una copia<input type="file" accept="application/json,.json" id="importar" class="oculto"></label>
    </section>
    <section class="tarjeta aviso">Esta app es una ayuda personal para seguir tu plan. No es consejo médico ni nutricional. Si tienes dolor o una lesión, consulta a un profesional.</section>
    <p class="sub">Fotos de ejercicios: free-exercise-db (dominio público). Rutinas y reglas: tu guía de entrenamiento.</p>
  </main>${tabs('hoy')}`;
}

// ---------- descanso entre series
let tReloj;
function relojTick() {
  const en = datos.enCurso; const caja = document.getElementById('descanso'); const reloj = document.getElementById('reloj');
  const dur = document.getElementById('duracion');
  if (dur && en) { const s = Math.floor((Date.now() - new Date(en.fecha)) / 1000); dur.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
  if (!caja || !reloj || !en) return;
  if (!en.descansoHasta) { caja.hidden = true; return; }
  const rest = Math.ceil((en.descansoHasta - Date.now()) / 1000);
  caja.hidden = false;
  reloj.textContent = rest > 0 ? `${Math.floor(rest / 60)}:${String(rest % 60).padStart(2, '0')}` : '¡A por la siguiente!';
}

// ---------- render y rutas
function render() {
  if (!datos.perfil) { $app.innerHTML = vInicio(); return; }
  const [, ruta = 'hoy', arg] = (location.hash || '#/hoy').split('/');
  ui.armadoTerminar = ruta === 'entreno' ? ui.armadoTerminar : false;
  const vistas = { hoy: vHoy, rutinas: vRutinas, ficha: () => vFicha(arg), entreno: vEntreno, comida: () => vComida(/^\d{4}-\d{2}-\d{2}$/.test(arg || '') ? arg : null), progreso: vProgreso, ajustes: vAjustes };
  $app.innerHTML = (vistas[ruta] || vHoy)();
  relojTick();
}
window.addEventListener('hashchange', () => { ui.anadir = null; ui.crearAlimento = false; ui.filtro = ''; render(); window.scrollTo(0, 0); });
clearInterval(tReloj); tReloj = setInterval(relojTick, 500);

// ---------- acciones (un único escuchador para toda la app)
const fechaComida = () => { const a = (location.hash.split('/')[2] || ''); return /^\d{4}-\d{2}-\d{2}$/.test(a) ? a : fechaISO(); };
$app.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return;
  const a = b.dataset.a; const en = datos.enCurso;
  if (a === 'atras') { history.length > 1 ? history.back() : ir('#/hoy'); }
  else if (a === 'empezar') { if (!datos.enCurso) crearEntreno(); ir('#/entreno'); }
  else if (a === 'plan') { const id = b.dataset.id; if (id !== datos.planId) { datos.planId = id; datos.planInicio = fechaISO(); guardar(); aviso('Plan cambiado. Tu historial se conserva.'); } render(); }
  else if (a === 'salir') { ir('#/hoy'); }
  else if (a === 'terminar') { if (ui.armadoTerminar) { ui.armadoTerminar = false; terminarEntreno(); } else { ui.armadoTerminar = true; render(); setTimeout(() => { if (ui.armadoTerminar) { ui.armadoTerminar = false; if (location.hash === '#/entreno') render(); } }, 4000); } }
  else if (a === 'ir' && en) { const k = Number(b.dataset.e); if (k >= 0 && k < en.ejercicios.length) { en.actual = k; guardar(); render(); window.scrollTo(0, 0); } }
  else if (a === 'mas-serie' && en) { const x = en.ejercicios[Number(b.dataset.e)]; const ult = x.series[x.series.length - 1]; x.series.push({ kg: ult?.kg ?? null, reps: null, hecha: false }); guardar(); render(); }
  else if (a === 'hecha' && en) {
    const x = en.ejercicios[Number(b.dataset.e)]; const s = x.series[Number(b.dataset.s)]; const e = EJERCICIO[x.ej];
    if (s.hecha) { s.hecha = false; guardar(); render(); return; }
    if (s.reps === null || s.reps === undefined) s.reps = x.objetivo.reps;
    if (e.tipo === 'tiempo') s.kg = 0; else if (s.kg === null || s.kg === undefined) {
      if (x.propuesta) s.kg = x.propuesta.kg; else { document.getElementById('err-serie').textContent = 'Escribe los kilos de la serie antes de marcarla.'; return; }
    }
    s.hecha = true; en.descansoHasta = Date.now() + (PLAN[en.planId]?.descanso[e.tipo] ?? 90) * 1000;
    guardar(); render();
  }
  else if (a === 'desc' && en) { const d = Number(b.dataset.d); en.descansoHasta = d === 0 ? null : Math.max(Date.now(), (en.descansoHasta || Date.now()) + d * 1000); guardar(); relojTick(); }
  else if (a === 'abrir-anadir') { const m = b.dataset.m; ui.anadir = ui.anadir?.comida === m ? null : { comida: m, alimentoId: null }; ui.filtro = ''; ui.crearAlimento = false; render(); document.getElementById('busca')?.focus(); }
  else if (a === 'elegir') { ui.anadir.alimentoId = b.dataset.id; render(); }
  else if (a === 'volver-lista') { ui.anadir.alimentoId = null; ui.crearAlimento = false; render(); }
  else if (a === 'crear-alimento') { ui.crearAlimento = true; render(); }
  else if (a === 'quitar') { const f = fechaComida(); datos.comidas[f][b.dataset.m].splice(Number(b.dataset.i), 1); guardar(); render(); }
  else if (a === 'agua') { const f = fechaComida(); const d = (datos.comidas[f] ||= {}); d.agua = Math.max(0, (d.agua || 0) + Number(b.dataset.d)); guardar(); render(); }
  else if (a === 'exportar') { exportarCopia(); }
});

$app.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.dataset.k && datos.enCurso) {
    const x = datos.enCurso.ejercicios[Number(t.dataset.e)]; const s = x.series[Number(t.dataset.s)];
    const err = document.getElementById('err-serie');
    if (t.value.trim() === '') { s[t.dataset.k] = null; t.classList.remove('mal'); guardar(); return; }
    const n = leerNumero(t.value, t.dataset.k === 'reps' ? { max: 1000, decimales: false } : { max: 500 });
    if (n === null) { t.classList.add('mal'); err.textContent = t.dataset.k === 'reps' ? 'Las repeticiones deben ser un número entero (por ejemplo 10).' : 'Los kilos deben ser un número entre 0 y 500 (por ejemplo 62,5).'; return; }
    t.classList.remove('mal'); err.textContent = ''; s[t.dataset.k] = n; guardar();
  } else if (t.dataset.cambiar !== undefined && t.value && datos.enCurso) {
    const x = datos.enCurso.ejercicios[Number(t.dataset.cambiar)]; const e = EJERCICIO[t.value];
    const pr = propuesta(e.tipo, ultimaVez(t.value, terminados()), x.objetivo);
    x.ej = t.value; x.propuesta = pr; x.series = x.series.map(() => ({ kg: pr ? pr.kg : null, reps: null, hecha: false }));
    guardar(); render(); aviso('Ejercicio cambiado por ' + e.nombre + '.');
  } else if (t.dataset.progreso !== undefined) { ui.ejProgreso = t.value; render(); }
  else if (t.id === 'importar' && t.files?.[0]) {
    t.files[0].text().then((texto) => {
      const r = importar(texto);
      if (!r.ok) { aviso(r.error + ' Tus datos actuales no se han tocado.'); return; }
      datos = r.datos; guardar(); aviso('Copia restaurada.'); ir('#/hoy');
    });
  } else if (t.name === 'manual') { document.getElementById('manuales').hidden = !t.checked; }
});

$app.addEventListener('input', (ev) => {
  if (ev.target.id === 'busca') { ui.filtro = ev.target.value; document.getElementById('resultados').innerHTML = listaAlimentos(catalogo()); }
});

$app.addEventListener('submit', (ev) => {
  ev.preventDefault(); const f = ev.target; const v = (n) => f.elements[n]?.value ?? '';
  if (f.id === 'f-inicio') {
    const peso = leerNumero(v('peso'), { max: 400 });
    if (!peso || peso < 30) { document.getElementById('err-inicio').textContent = 'Escribe tu peso en kilos, por ejemplo 78,5.'; return; }
    datos.perfil = { nombre: v('nombre').trim().slice(0, 40), peso, meta: v('meta'), objetivosManual: null };
    datos.planId = v('plan'); datos.planInicio = fechaISO(); datos.pesos.push({ fecha: fechaISO(), kg: peso });
    guardar(); location.hash = '#/hoy'; render();
  } else if (f.id === 'f-gramos') {
    const g = leerNumero(v('gramos'), { max: 5000 });
    if (!g) { document.getElementById('err-gramos').textContent = 'Escribe los gramos, por ejemplo 150.'; return; }
    const fe = fechaComida(); const d = (datos.comidas[fe] ||= {}); (d[ui.anadir.comida] ||= []).push({ alimentoId: ui.anadir.alimentoId, gramos: g });
    ui.anadir = null; guardar(); render();
  } else if (f.id === 'f-crear') {
    const n = v('nombre').trim().slice(0, 60); const vals = ['kcal', 'p', 'c', 'g', 'porcion'].map((k) => leerNumero(v(k), { max: 1000 }));
    if (!n || vals.some((x) => x === null)) { document.getElementById('err-crear').textContent = 'Rellena el nombre y todos los números (0 si no tiene).'; return; }
    const [kcal, p, c, g, porcion] = vals; const id = 'propio_' + nuevoId();
    datos.alimentosPropios.push({ id, nombre: n, kcal, p, c, g, porcion: porcion || 100 });
    ui.crearAlimento = false; ui.anadir.alimentoId = id; guardar(); render();
  } else if (f.id === 'f-peso') {
    const kg = leerNumero(v('kg'), { max: 400 });
    if (!kg || kg < 30) { document.getElementById('err-peso').textContent = 'Escribe tu peso en kilos, por ejemplo 78,5.'; return; }
    datos.pesos = datos.pesos.filter((p) => p.fecha !== fechaISO()); datos.pesos.push({ fecha: fechaISO(), kg });
    if (datos.perfil) datos.perfil.peso = kg;
    guardar(); aviso('Peso guardado.'); render();
  } else if (f.id === 'f-perfil') {
    const peso = leerNumero(v('peso'), { max: 400 }); const err = document.getElementById('err-perfil');
    if (!peso || peso < 30) { err.textContent = 'Escribe tu peso en kilos, por ejemplo 78,5.'; return; }
    let manual = null;
    if (f.elements.manual.checked) {
      const [kcal, p, c, g] = ['kcal', 'p', 'c', 'g'].map((k) => leerNumero(v(k), { max: 10000 }));
      if ([kcal, p, c, g].some((x) => x === null) || !kcal) { err.textContent = 'Rellena las calorías y los tres macros con números.'; return; }
      manual = { kcal, p, c, g };
    }
    datos.perfil = { ...datos.perfil, nombre: v('nombre').trim().slice(0, 40), peso, meta: v('meta'), objetivosManual: manual };
    guardar(); aviso('Perfil guardado.'); render();
  }
});

async function exportarCopia() {
  const texto = exportar(datos); const nombre = `gym-copia-${fechaISO()}.json`;
  const archivo = new File([texto], nombre, { type: 'application/json' });
  try {
    if (navigator.canShare?.({ files: [archivo] })) { await navigator.share({ files: [archivo], title: 'Copia de Gym' }); return; }
  } catch (e) { if (e?.name === 'AbortError') return; }
  const url = URL.createObjectURL(archivo); const a = document.createElement('a'); a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  aviso('Copia guardada en Descargas.');
}

// ---------- arranque
render();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
