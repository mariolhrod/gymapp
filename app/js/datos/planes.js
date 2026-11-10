// Los 3 planes de la guía de entrenamiento de Mario (series, repeticiones y descansos).
// reps: repeticiones objetivo por serie; para ejercicios de tipo 'tiempo', son segundos.

const X = (ej, series, reps) => ({ ej, series, reps });

export const PLANES = [
  {
    id: 'full_body', nombre: 'Cuerpo completo · 3 días', nivel: 'Principiante · primer mes',
    diasSemana: 3, descanso: { compuesto: 120, aislado: 90, tiempo: 60 },
    dias: [
      { nombre: 'Día A · Cuerpo completo', ejercicios: [X('press_pecho_maquina', 3, 12), X('remo_maquina', 3, 12), X('press_hombro_maquina', 3, 12), X('prensa', 3, 12), X('curl_femoral', 3, 12), X('curl_ez', 2, 12), X('pushdown_cuerda', 2, 12), X('plancha', 3, 30)] },
      { nombre: 'Día B · Cuerpo completo', ejercicios: [X('mariposa', 3, 12), X('jalon_ancho', 3, 12), X('elevacion_lateral', 3, 15), X('sentadilla_goblet', 3, 12), X('puente_gluteos', 3, 15), X('curl_martillo', 2, 12), X('extension_overhead', 2, 12), X('crunch_maquina', 3, 15)] },
    ],
  },
  {
    id: 'torso_pierna', nombre: 'Torso / pierna · 4 días', nivel: 'Intermedio · desde el mes 2',
    diasSemana: 4, descanso: { compuesto: 120, aislado: 60, tiempo: 60 },
    dias: [
      { nombre: 'Día A · Torso', ejercicios: [X('press_banca_mancuernas', 4, 10), X('remo_mancuerna', 4, 10), X('press_hombro_maquina', 3, 12), X('mariposa', 3, 12), X('jalon_ancho', 3, 12), X('elevacion_lateral', 3, 15), X('curl_ez', 3, 12), X('pushdown_cuerda', 3, 12)] },
      { nombre: 'Día B · Pierna', ejercicios: [X('sentadilla_barra', 4, 8), X('prensa', 3, 12), X('peso_muerto_rumano', 3, 10), X('extension_cuadriceps', 3, 12), X('curl_femoral', 3, 12), X('hip_thrust', 3, 12), X('elevacion_talones', 4, 15), X('plancha', 3, 45)] },
    ],
  },
  {
    id: 'ppl', nombre: 'Empuje / tirón / pierna · 6 días', nivel: 'Avanzado · 3-6 meses de experiencia',
    diasSemana: 6, descanso: { compuesto: 150, aislado: 60, tiempo: 60 },
    dias: [
      { nombre: 'Día A · Empuje', ejercicios: [X('press_banca_mancuernas', 4, 8), X('press_inclinado_mancuernas', 3, 10), X('press_militar_mancuernas', 4, 10), X('aperturas_inclinado', 3, 12), X('elevacion_lateral', 4, 15), X('pushdown_cuerda', 3, 12), X('extension_overhead', 3, 12)] },
      { nombre: 'Día B · Tirón', ejercicios: [X('dominadas_jalon', 4, 8), X('remo_barra', 4, 8), X('remo_maquina', 3, 10), X('face_pull', 3, 15), X('curl_ez', 3, 10), X('curl_martillo', 3, 12), X('curl_inclinado', 3, 12)] },
      { nombre: 'Día C · Pierna', ejercicios: [X('sentadilla_barra', 4, 6), X('prensa', 4, 10), X('peso_muerto_rumano', 4, 8), X('extension_cuadriceps', 3, 12), X('curl_femoral', 3, 12), X('hip_thrust', 3, 12), X('elevacion_talones', 4, 15), X('crunch_maquina', 3, 15)] },
    ],
  },
];

export const PLAN = Object.fromEntries(PLANES.map((p) => [p.id, p]));
export const PLAN_INICIAL = 'torso_pierna';
