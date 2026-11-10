---
type: plan
slug: app-gym
spec: ../specs/app-gym.md
status: approved (piloto automático)
timestamp: 2026-11-09T22:30:00Z
---

# Plan — App de gimnasio

## Arquitectura
- **App web instalable (PWA)**, sin servidor propio y sin paso de compilación: HTML, CSS y JavaScript con módulos
  nativos. Se abre en Safari del iPhone y se añade a la pantalla de inicio («Añadir a inicio»).
- **Sin internet:** un service worker guarda la app y las fotos la primera vez; después funciona sin conexión.
- **Datos:** en el propio iPhone (`localStorage`), en un único objeto versionado. Copia de seguridad: exportar e
  importar un archivo `.json`.
- **Sin dependencias externas:** nada que instalar; fuentes del sistema (SF Pro en el iPhone).

## Módulos (carpeta `app/`)
| Módulo | Qué hace | Probado con |
|---|---|---|
| `js/datos/ejercicios.js` | Catálogo: nombre en español, músculos, tipo (compuesto/aislado), descanso, pasos, error común, fotos | prueba de integridad |
| `js/datos/planes.js` | Los 3 planes de la guía: días, ejercicios, series × repeticiones | prueba de integridad |
| `js/datos/alimentos.js` | ~60 alimentos comunes con kcal y macros por 100 g (tablas USDA) | prueba de integridad |
| `js/logica/nutricion.js` | Objetivos: peso × 30 ± meta, proteína 2 g/kg, grasa 1 g/kg, resto carbohidratos; totales del día | `node --test` |
| `js/logica/progresion.js` | Propuesta de peso (+2,5 kg compuesto / +1 kg aislado si completó todo) y descarga cada 8 semanas | `node --test` |
| `js/logica/plan.js` | Qué día toca según el último entreno; semana del plan | `node --test` |
| `js/logica/almacen.js` | Leer, guardar, migrar, exportar e importar (validando) | `node --test` |
| `js/ui/*.js` | Pantallas Hoy, Rutinas, Entreno, Ficha, Comida, Progreso, Ajustes, primer uso | navegador |
| `sw.js`, `manifest.webmanifest` | Funcionar sin internet e icono de inicio | navegador |

## Fotos
- De free-exercise-db (Unlicense): 2 JPEG por ejercicio (~60 KB c/u), unos 33 ejercicios → ~4 MB. Se copian dentro
  de `app/img/ejercicios/` con un archivo `LICENCIA-FOTOS.md`.
- Pasos y errores: escritos en español con palabras propias (no de las guías).

## Pruebas y evidencia
- Lógica: `node --test tests/` (Node 24, sin instalar nada).
- Pantallas: Edge sin ventana (`--headless --screenshot`) a 390 × 844, capturas en `docs/evidencia/`.
- Revisión independiente del código (subagente) antes de cerrar.

## Riesgos
- **Safari y los datos:** las apps añadidas a la pantalla de inicio conservan sus datos; aun así, la copia de seguridad
  manual protege ante borrados.
- **Alojamiento:** hace falta https para instalarla. Pregunta abierta para Mario (spec); hasta entonces se prueba en el PC.

## Tareas
| # | Tarea | Criterio que cubre | Riesgo | Comprobación |
|---|---|---|---|---|
| T1 | Estructura, manifest, service worker, estilos base | sin internet | 1 | se abre en Edge sin errores en consola |
| T2 | Catálogo de ejercicios, planes y alimentos + pruebas de integridad | ficha, día B | 1 | `node --test` verde |
| T3 | Lógica: nutrición, progresión, plan, almacén + pruebas | 75 kg → 2.250/150; +2,5 kg; día B; copia | 1 | `node --test` verde |
| T4 | Fotos de ejercicios (con permiso de Mario para descargarlas) | ficha con 2 fotos | 1 | todas las fichas con sus 2 fotos |
| T5 | Pantallas Hoy, Rutinas, Ficha | diseño aprobado | 1 | capturas |
| T6 | Pantalla Entreno: series, reloj, retomar a medias | criterios de entreno | 2 | captura + prueba |
| T7 | Comida, Progreso, Ajustes (perfil, copia, aviso de salud), primer uso | criterios de comida y copia | 1 | capturas |
| T8 | Revisión independiente + arreglos | todos | — | informe aprobado |
| T9 | Publicar (con permiso) y prueba de Mario en el iPhone | instalación sin internet | — | Mario confirma |
