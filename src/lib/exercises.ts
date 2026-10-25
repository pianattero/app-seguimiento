import { normalize } from './recipes'

/** Ejercicios de fuerza habituales por grupo muscular, para elegir rápido al registrar un entreno. */
export const exerciseGroups: { group: string; exercises: string[] }[] = [
  { group: 'Piernas', exercises: ['Sentadilla', 'Sentadilla goblet', 'Sentadilla búlgara', 'Prensa', 'Zancadas', 'Peso muerto', 'Peso muerto rumano', 'Extensión de cuádriceps', 'Curl femoral', 'Step-up', 'Elevaciones de gemelo'] },
  { group: 'Glúteos', exercises: ['Hip thrust', 'Puente de glúteo', 'Patada de glúteo en polea', 'Abducción en máquina', 'Peso muerto sumo'] },
  { group: 'Pecho', exercises: ['Press banca', 'Press banca con mancuernas', 'Press inclinado', 'Aperturas con mancuernas', 'Flexiones', 'Press en máquina'] },
  { group: 'Espalda', exercises: ['Jalón al pecho', 'Remo con mancuerna', 'Remo con barra', 'Remo en polea baja', 'Dominadas', 'Dominadas asistidas', 'Pullover'] },
  { group: 'Hombros', exercises: ['Press militar', 'Press de hombros con mancuernas', 'Elevaciones laterales', 'Elevaciones frontales', 'Face pull', 'Pájaros'] },
  { group: 'Brazos', exercises: ['Curl de bíceps', 'Curl martillo', 'Extensión de tríceps en polea', 'Fondos de tríceps', 'Press francés'] },
  { group: 'Core', exercises: ['Plancha', 'Plancha lateral', 'Crunch', 'Elevación de piernas', 'Russian twist', 'Dead bug', 'Rueda abdominal'] },
]

/**
 * Ejercicios que encajan con lo escrito (sin importar mayúsculas ni tildes), con los ya usados primero.
 * `used` son los nombres que aparecen en entrenos anteriores, incluidos los escritos a mano.
 */
export function searchExercises(query: string, used: string[]): string[] {
  const all = [...new Set([...used, ...exerciseGroups.flatMap((g) => g.exercises)])]
  const words = normalize(query).split(/\s+/).filter(Boolean)
  return all.filter((name) => words.every((w) => normalize(name).includes(w)))
}
