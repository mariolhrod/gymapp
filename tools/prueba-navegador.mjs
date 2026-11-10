// Prueba de punta a punta en Edge sin ventana, con tamaño de iPhone (390 × 844), sin instalar nada:
// controla el navegador por su protocolo de depuración. Guarda capturas en docs/evidencia/.
// Uso: node tools/prueba-navegador.mjs
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { arrancar } from './servidor.mjs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PUERTO = 8765, DEPURA = 9333, URL_APP = `http://127.0.0.1:${PUERTO}/`;
const evid = fileURLToPath(new URL('../docs/evidencia/', import.meta.url)); mkdirSync(evid, { recursive: true });
const perfil = join(tmpdir(), 'gymapp-edge-' + Date.now());
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = []; let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => { resultados.push({ nombre, ok: !!ok, detalle }); if (!ok) fallos++; console.log(`${ok ? 'OK   ' : 'FALLO'} ${nombre}${detalle ? ' — ' + detalle : ''}`); };

const srv = await arrancar(PUERTO);
const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${DEPURA}`, `--user-data-dir=${perfil}`, '--no-first-run', '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
let ws;
try {
  let lista;
  for (let k = 0; k < 40 && !lista; k++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${DEPURA}/json/list`)).json(); } catch {} }
  const pagina = lista.find((t) => t.type === 'page');
  ws = new WebSocket(pagina.webSocketDebuggerUrl);
  await new Promise((ok) => ws.addEventListener('open', ok));
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
  const cdp = (method, params = {}) => new Promise((ok) => { const i = ++id; pend.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  const js = async (expr) => { const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails)); return r.result?.result?.value; };
  const foto = async (nombre) => { await espera(400); const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); writeFileSync(join(evid, nombre + '.png'), Buffer.from(r.result.data, 'base64')); };
  const ir = async (ruta) => { await js(`location.hash = '${ruta}'`); await espera(300); };
  const clic = (sel) => js(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true; })()`);
  const escribir = (sel, valor, evento = 'change') => js(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) throw new Error('no encuentro ' + ${JSON.stringify(sel)} + ' en ' + location.hash + ': ' + document.body.innerText.slice(0, 200)); e.value = ${JSON.stringify(valor)}; e.dispatchEvent(new Event('${evento}', { bubbles: true })); return true; })()`);
  // El estilo pone algunos títulos en mayúsculas: se compara sin distinguir mayúsculas.
  const texto = async () => { const s = await js('document.body.innerText'); return Object.assign(new String(s), { includes: (q) => s.toLowerCase().includes(q.toLowerCase()) }); };

  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cdp('Page.navigate', { url: URL_APP }); await espera(1500);

  // 1. Primer uso
  comprobar('primer uso: pide los datos', (await texto()).includes('Bienvenido'));
  await foto('01-bienvenida');
  await escribir('[name=peso]', 'abc'); await js(`document.getElementById('f-inicio').requestSubmit()`); await espera(200);
  comprobar('primer uso: rechaza un peso no válido', (await texto()).includes('Escribe tu peso'));
  await escribir('[name=peso]', '75'); await escribir('[name=meta]', 'mantener'); await escribir('[name=plan]', 'torso_pierna');
  await js(`document.getElementById('f-inicio').requestSubmit()`); await espera(500);
  let t = await texto();
  comprobar('Hoy: muestra el día A de torso/pierna', t.includes('Día A · Torso'), t.slice(0, 120).replace(/\n/g, ' | '));
  comprobar('Hoy: objetivo 2.250 kcal para 75 kg y mantener', t.includes('2250') || t.includes('2.250'));
  await foto('02-hoy');

  // 2. Entreno completo del día A
  await clic('[data-a=empezar]'); await espera(400);
  comprobar('Entreno: abre el primer ejercicio', (await texto()).includes('Press de banca con mancuernas'));
  const nEj = await js('JSON.parse(localStorage.getItem("gymapp.datos")).enCurso.ejercicios.length');
  for (let e = 0; e < nEj; e++) {
    const nS = await js(`JSON.parse(localStorage.getItem("gymapp.datos")).enCurso.ejercicios[${e}].series.length`);
    for (let s = 0; s < nS; s++) {
      await escribir(`input[data-e="${e}"][data-s="${s}"][data-k=kg]`, e === 1 ? '30' : '20');
      await escribir(`input[data-e="${e}"][data-s="${s}"][data-k=reps]`, '12');
      await clic(`button[data-a=hecha][data-e="${e}"][data-s="${s}"]`); await espera(60);
    }
    if (e === 0) { await espera(1200); comprobar('Entreno: arranca el reloj de descanso tras marcar la serie', await js(`!document.getElementById('descanso').hidden && /\\d:\\d\\d/.test(document.getElementById('reloj').textContent)`)); await foto('03-entreno'); }
    if (e < nEj - 1) await clic(`button[data-a=ir][data-e="${e + 1}"]`);
  }
  await escribir(`input[data-e="${nEj - 1}"][data-s="0"][data-k=kg]`, '-5');
  comprobar('Entreno: rechaza kilos negativos', (await texto()).includes('Los kilos deben ser'));
  await js('location.reload()'); await espera(1500); await ir('#/entreno');
  comprobar('Entreno: al volver a abrir la app sigue donde lo dejó', (await texto()).includes('ejercicio 8 de 8'));
  await clic('[data-a=terminar]'); await espera(200); await clic('[data-a=terminar]'); await espera(600);
  const d1 = await js('JSON.parse(localStorage.getItem("gymapp.datos"))');
  comprobar('Terminar: guarda el entreno con todas las series', d1.entrenos.length === 1 && d1.entrenos[0].ejercicios[1].series.every((s) => s.hecha && s.kg === 30), `entrenos=${d1.entrenos.length}`);
  t = await texto();
  comprobar('Hoy: tras el día A propone el día B', t.includes('Día B · Pierna'));

  // 3. Propuesta de peso: remo 4×10 a 30 kg completado -> 32,5
  await js(`(() => { const d = JSON.parse(localStorage.getItem('gymapp.datos')); d.entrenos.push({ id: 'b', fecha: new Date().toISOString(), planId: 'torso_pierna', diaIndex: 1, terminado: true, ejercicios: [] }); localStorage.setItem('gymapp.datos', JSON.stringify(d)); location.reload(); })()`);
  await espera(1500);
  await clic('[data-a=empezar]'); await espera(400); await clic('button[data-a=ir][data-e="1"]'); await espera(300);
  t = await texto();
  comprobar('Progresión: propone 32,5 kg en el remo tras completar 4×10 a 30', t.includes('prueba con 32,5 kg'), t.match(/Objetivo:[^\n]*/)?.[0]);
  comprobar('Progresión: muestra lo que hizo la vez anterior', t.includes('30 × 12'));
  await clic('[data-a=terminar]'); await espera(200); await clic('[data-a=terminar]'); await espera(400);

  // 4. Ficha con fotos
  await ir('#/ficha/remo_mancuerna'); await espera(800);
  comprobar('Ficha: las 2 fotos cargan', await js(`[...document.querySelectorAll('.fotos img')].every((i) => i.complete && i.naturalWidth > 0)`));
  comprobar('Ficha: pasos en español y error común', (await texto()).includes('Cómo se hace') && (await texto()).includes('Error común'));
  await foto('04-ficha');

  // 5. Comida
  await ir('#/comida'); await clic('[data-a=abrir-anadir][data-m=almuerzo]'); await espera(200);
  await escribir('#busca', 'pollo', 'input'); await espera(100);
  await clic('[data-a=elegir][data-id=pechuga_pollo]'); await espera(200);
  await escribir('[name=gramos]', '200'); await js(`document.getElementById('f-gramos').requestSubmit()`); await espera(400);
  t = await texto();
  comprobar('Comida: añade 200 g de pollo (330 kcal) y descuenta del objetivo', t.includes('330 kcal') && (t.includes('1920') || t.includes('1.920')));
  await clic('[data-a=agua][data-d="1"]'); await espera(200);
  comprobar('Comida: cuenta los vasos de agua', (await texto()).includes('1 de 8 vasos'));
  await foto('05-comida');

  // 6. Progreso
  await ir('#/progreso'); await escribir('[name=kg]', '74,6'); await js(`document.getElementById('f-peso').requestSubmit()`); await espera(400);
  t = await texto();
  comprobar('Progreso: guarda el peso corporal', t.includes('74,6 kg'));
  comprobar('Progreso: muestra marcas personales', t.includes('Marcas personales') && t.includes('Remo con mancuerna'));
  await foto('06-progreso');
  await ir('#/rutinas'); await foto('07-rutinas');
  await ir('#/ajustes'); await foto('08-ajustes');

  // 7. Sin internet
  await ir('#/hoy');
  const listo = await js(`navigator.serviceWorker.ready.then(() => caches.keys()).then(async (ks) => { const c = await caches.open(ks[0]); return (await c.keys()).length; })`);
  comprobar('Sin internet: la app y las fotos quedan guardadas en el teléfono', listo >= 70, `${listo} archivos guardados`);
  srv.close();
  await cdp('Network.enable'); await cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await cdp('Page.reload', { ignoreCache: false }); await espera(2000);
  t = await texto();
  comprobar('Sin internet: la app abre y muestra Hoy', t.includes('Entreno de hoy'));
  await ir('#/ficha/sentadilla_barra'); await espera(800);
  comprobar('Sin internet: las fotos de los ejercicios se ven', await js(`[...document.querySelectorAll('.fotos img')].every((i) => i.complete && i.naturalWidth > 0)`));
  await foto('09-sin-internet');
} catch (e) {
  comprobar('la prueba terminó sin errores', false, e.message);
} finally {
  writeFileSync(join(evid, 'resultado.json'), JSON.stringify({ fecha: new Date().toISOString(), fallos, resultados }, null, 1));
  try { ws?.close(); } catch {}
  edge.kill(); srv.close?.(); await espera(800);
  try { rmSync(perfil, { recursive: true, force: true }); } catch {}
  console.log(`\n${resultados.length - fallos} de ${resultados.length} comprobaciones superadas.`);
  process.exit(fallos ? 1 : 0);
}
