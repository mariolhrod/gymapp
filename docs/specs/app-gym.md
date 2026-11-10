---
type: spec
title: Spec — App de gimnasio (rutinas y alimentación)
description: QUÉ y POR QUÉ de la app personal de gimnasio de Mario para iPhone.
tags: [sdd, spec, gym]
timestamp: 2026-11-09T22:00:00Z
topic: sdd
slug: app-gym
status: draft (aprobada en piloto automático, no punto por punto)
---

# Spec — App de gimnasio (rutinas y alimentación)

> Slug: `app-gym` · Estado: borrador · Creada: 2026-11-09
> Proyecto nuevo, sin constitución propia todavía: las reglas que heredaría van en «Puntos a aclarar».

## Problem & why
Mario entrena en el gimnasio y tiene cinco guías en PDF de «Músculo Lab»: entrenamiento, alimentación, postura,
estiramientos y suplementos. Son buenas, pero en el gimnasio no son cómodas: no dicen qué toca hoy, no recuerdan
cuánto peso levantó la última vez y no llevan la cuenta de lo que come. Quiere una app en su iPhone que le diga qué
entrenar, le deje anotar series y comidas, y le enseñe su progreso.

## Cost of not building it
Poco dinero, pero constancia: sin un registro, Mario no sabe cuándo subir peso (la regla de la guía exige saber si
completó todas las series) y el progreso se estanca o se pierde. Hoy lo resolvería con papel o de memoria.

## The cheapest alternative
Apps gratuitas como Hevy o Strong (entrenos) y MyFitnessPal (comida), cargando a mano la rutina de la guía. Cubren
casi todo, pero son dos apps, en inglés en parte, con funciones de pago y sin las reglas de su guía (progresión,
descarga, calorías por peso). Mario eligió hacer la suya, para él primero y quizá compartirla después.

## Goals
- Ver al abrir la app qué entrenamiento toca hoy según su plan.
- Anotar cada serie (kilos y repeticiones) en el gimnasio con una mano y en pocos toques, y ver lo que hizo la vez anterior.
- Que la app le diga cuándo subir peso, según la regla de su guía.
- Ver cómo se hace cada ejercicio, con 2 fotos alternadas de dominio público y pasos en español.
- Llevar las calorías y los macros del día frente a un objetivo calculado con su peso y su meta.
- Ver su progreso: peso por ejercicio, marcas personales, peso corporal y entrenos hechos.
- Que funcione sin internet en el gimnasio y que sus datos no se pierdan.

## Non-goals / out of scope
- Publicarla en la App Store o cobrar por ella.
- Cuentas de usuario, nube o compartir con otras personas (quizá más adelante).
- Una base de datos enorme de alimentos o leer códigos de barras.
- Copiar textos o imágenes de las guías de Músculo Lab dentro de la app.
- Vídeos, entrenador por voz, relojes inteligentes, Apple Salud.
- Suplementos, postura y lesiones como secciones propias (quizá más adelante).
- Notificaciones o recordatorios.

## Users & context
Solo Mario, con su iPhone, de pie en el gimnasio entre series, a veces sin cobertura. También en casa, para anotar
comidas y revisar su progreso. Persona no técnica: todo en español, con palabras sencillas.

## Qué podrá hacer el usuario
- **Elegir su plan** de los tres de su guía: cuerpo completo 3 días (principiante), torso/pierna 4 días (intermedio)
  o empuje/tirón/pierna 6 días (avanzado). Cambiarlo cuando quiera, sin perder su historial.
- **Empezar el entreno de hoy**, anotar kilos y repeticiones de cada serie, marcarla hecha, usar el reloj de descanso,
  cambiar o saltar un ejercicio y terminar el entreno.
- **Abrir la ficha de cualquier ejercicio:** fotos alternadas, músculos, pasos y error común.
- **Configurar su perfil:** peso, meta (perder grasa, mantener, ganar músculo) y, si quiere, sus propios objetivos de comida.
- **Anotar comidas** en desayuno, almuerzo, cena y snacks, eligiendo de una lista de alimentos comunes o creando los
  suyos; anotar vasos de agua.
- **Anotar su peso corporal** y ver su progreso.
- **Guardar una copia** de todos sus datos en un archivo y restaurarla.

## Qué resultado obtiene
- Las pantallas siguen el diseño aprobado por Mario el 2026-11-09:
  https://claude.ai/artifact/5ocThwbwtZbxZuazJZi4FE (pantallas 1 a 5, y las fichas 8 y 9 con fotos alternadas).
- La app abre en el iPhone desde un icono en la pantalla de inicio, a pantalla completa, y funciona sin internet.

## Qué debe respetar
- **Derechos de autor:** de las guías se usan solo datos y reglas (qué ejercicios, series, repeticiones, descansos,
  progresión y fórmulas), escritos con palabras propias. Ningún texto ni imagen de las guías dentro de la app.
- **Fotos de ejercicios:** solo de una fuente con licencia libre comprobada (free-exercise-db, «Unlicense»).
- **Privacidad:** los datos de Mario se quedan en su iPhone. Nada se envía a ningún sitio.
- **Salud:** la app no da consejo médico ni nutricional personalizado; lo dice en Ajustes.
- **Forma de trabajar de Mario:** español sencillo, nada se publica fuera de su PC sin su permiso, commits a su nombre.

## Cómo lo demuestra
- Pruebas automáticas de las reglas: cálculo de calorías y macros, regla para subir peso, día que toca, copia y restauración.
- Prueba de la app en un navegador con tamaño de iPhone: recorrer las 5 pantallas, un entreno completo y una comida,
  con capturas guardadas en el proyecto.
- Revisión independiente del código antes de darlo por terminado.
- Prueba final de Mario en su iPhone: instalarla en la pantalla de inicio y usarla sin internet.

## Behaviour
- Main path: Mario abre la app → «Hoy» le muestra el entreno que toca → lo empieza → anota cada serie con la referencia
  de la vez anterior → descansa con el reloj → termina → la app guarda el entreno y, si completó todas las series del
  ejercicio, le propone subir peso la próxima vez (2,5 kg en ejercicios compuestos y 1 kg en aislados).
- Comida: Mario añade alimentos a una comida → el círculo de calorías y las barras de macros se actualizan.
- Edge cases: primer uso sin datos (le pide elegir plan y su peso); entreno a medias si cierra la app (al volver lo
  retoma); cambiar de plan con historial (el historial se conserva); semana de descarga (la guía la pide cada 8
  semanas: la app la propone con la mitad de peso).
- Error paths: sin internet todo sigue funcionando; un dato imposible (kilos negativos, texto en lugar de número) no
  se guarda y se explica por qué; una copia de seguridad dañada no borra los datos actuales.

## Acceptance criteria
- Given un perfil de 75 kg con meta «mantener», When abre «Alimentación», Then el objetivo es 2.250 kcal y la proteína 150 g.
- Given la meta «ganar músculo» o «perder grasa», When se calcula el objetivo, Then las calorías son el mantenimiento + 300 o − 400 respectivamente.
- Given el plan torso/pierna y el último entreno fue el día A, When abre «Hoy», Then le propone el día B.
- Given en el remo con mancuerna completó 4×10 a 30 kg, When vuelve a ese ejercicio, Then ve «la última vez 30 × 10, 10, 10, 10» y la propuesta de 32,5 kg.
- Given no completó todas las repeticiones, When vuelve al ejercicio, Then la propuesta es repetir el mismo peso.
- Given una serie marcada hecha, When pasa al descanso, Then arranca el reloj con el descanso del ejercicio (60–90 s aislados, 2 min compuestos).
- Given el iPhone sin conexión, When abre la app instalada, Then carga y permite anotar.
- Given cualquier ejercicio del plan, When abre su ficha, Then ve 2 fotos alternándose, músculos, pasos y error común en español.
- Given datos anotados, When guarda una copia y la restaura en una app vacía, Then aparecen los mismos entrenos, comidas y pesos.
- Given un entreno a medias, When cierra la app y la vuelve a abrir, Then sigue donde lo dejó.

## Points to clarify
- **pregunta abierta** — ¿Dónde se aloja la app para instalarla en el iPhone? Para funcionar sin internet necesita una
  dirección web segura (https). Opción recomendada: GitHub Pages, gratis, con el código público (no lleva datos de
  Mario ni contenido de las guías). Se pregunta a Mario antes de publicar nada.
- **suposición tomada** — calorías de mantenimiento = peso × 30 (fórmula rápida de la guía, para hombres); proteína 2
  g/kg, grasas 1 g/kg y el resto en carbohidratos. *Base:* guía de entrenamiento, capítulo 12. *Riesgo:* si Mario
  prefiere otro cálculo, cambia el primer criterio de aceptación; los objetivos son editables a mano.
- **suposición tomada** — ganar músculo = +300 kcal; perder grasa = −400 kcal. *Base:* la guía habla de superávit y
  déficit sin cifra en las páginas leídas. *Riesgo:* se ajustan en Ajustes.
- **suposición tomada** — plan inicial torso/pierna 4 días (el de las pantallas aprobadas). *Base:* diseño aprobado.
  *Riesgo:* ninguno: se cambia en «Rutinas».
- **suposición tomada** — lista de alimentos comunes con valores nutricionales de tablas públicas (USDA). *Base:* son
  datos públicos. *Riesgo:* pocos alimentos al principio; Mario puede crear los suyos.
- **suposición tomada** (revisión, 2026-11-09) — tras una semana de descarga, la propuesta de peso parte del último
  entreno normal, no del de descarga. *Base:* la guía presenta la descarga como recuperación para volver «más fuerte».
  *Riesgo:* ninguno conocido.
- **suposición tomada** (revisión, 2026-11-09) — cambiar de plan reinicia la cuenta de 8 semanas para la descarga.
  *Base:* es un plan nuevo. *Riesgo:* si Mario prefiere contar desde el inicio, se cambia.
- **decisión diferida** — compartir la app con otras personas: exigiría revisar si las rutinas de la guía se pueden
  repartir y añadir avisos de salud. Fuera de este ciclo.
- **decisión diferida** — secciones de suplementos, postura y estiramientos. Fuera de este ciclo.
- **área no formulable** — cómo encaja la «Planilla de seguimiento» que acompaña a la guía; no la he leído.
