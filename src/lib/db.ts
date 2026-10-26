import Dexie, { type EntityTable } from 'dexie'
import type { Recipe } from './recipes'
import type { Meal, PeriodStart, Profile, Session, ShoppingCheck, StrengthSet, WeightEntry } from './types'

/** Todos los datos viven en el navegador del móvil (IndexedDB). */
export class AppDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  sessions!: EntityTable<Session, 'id'>
  sets!: EntityTable<StrengthSet, 'id'>
  meals!: EntityTable<Meal, 'id'>
  periods!: EntityTable<PeriodStart, 'start'>
  weights!: EntityTable<WeightEntry, 'day'>
  shopping!: EntityTable<ShoppingCheck, 'key'>
  customRecipes!: EntityTable<Recipe, 'id'>

  constructor(name = 'seguimiento') {
    super(name)
    this.version(1).stores({
      profile: 'id',
      routines: 'weekdayIndex',
      sessions: '++id, day, externalId',
      sets: '++id, sessionId, exerciseName, createdAt',
    })
    this.version(2).stores({
      meals: '++id, day',
      periods: 'start',
      shopping: 'key',
    })
    this.version(3).stores({
      customRecipes: 'id',
    })
    // Las rutinas fijas por día se quitaron: los ejercicios se eligen en cada entreno.
    this.version(4).stores({
      routines: null,
    })
    this.version(5).stores({
      weights: 'day',
    })
  }
}

export const db = new AppDB()

/** Valores genéricos: los datos reales se escriben en Ajustes (el repositorio es público). */
export const defaultProfile: Profile = {
  id: 'main',
  name: '',
  person: { sex: 'female', ageYears: 30, weightKg: 70, heightCm: 165 },
  deficitKcal: 500,
  proteinPerKg: 1.5,
  partnerName: 'Acompañante',
  partner: { sex: 'male', ageYears: 30, weightKg: 80, heightCm: 175 },
  partnerPortionFactor: 1.2,
}

export async function seedIfNeeded(database: AppDB = db): Promise<void> {
  if (!(await database.profile.get('main'))) await database.profile.put(defaultProfile)
}

export interface Backup {
  version: 1 | 2 | 3
  exportedAt: string
  profile: Profile[]
  sessions: Session[]
  sets: StrengthSet[]
  meals?: Meal[]
  periods?: PeriodStart[]
  weights?: WeightEntry[]
  customRecipes?: Recipe[]
}

export async function exportBackup(database: AppDB = db): Promise<Backup> {
  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    profile: await database.profile.toArray(),
    sessions: await database.sessions.toArray(),
    sets: await database.sets.toArray(),
    meals: await database.meals.toArray(),
    periods: await database.periods.toArray(),
    weights: await database.weights.toArray(),
    customRecipes: await database.customRecipes.toArray(),
  }
}

/** Sustituye todos los datos por los de la copia. Si el archivo no es una copia válida, no se toca nada. */
export async function importBackup(backup: Backup, database: AppDB = db): Promise<void> {
  if (!backup || typeof backup !== 'object' || ![1, 2, 3].includes(backup.version)) throw new Error('Copia de seguridad no reconocida')
  const lists = [backup.profile, backup.sessions, backup.sets, backup.meals, backup.periods, backup.weights, backup.customRecipes]
  if (!Array.isArray(backup.profile) || !Array.isArray(backup.sessions) || !Array.isArray(backup.sets) || lists.some((l) => l !== undefined && !Array.isArray(l))) {
    throw new Error('El archivo está incompleto o dañado')
  }
  const tables = [database.profile, database.sessions, database.sets, database.meals, database.periods, database.weights, database.customRecipes]
  await database.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()))
    await database.profile.bulkPut(backup.profile)
    await database.sessions.bulkPut(backup.sessions)
    await database.sets.bulkPut(backup.sets)
    await database.meals.bulkPut(backup.meals ?? [])
    await database.periods.bulkPut(backup.periods ?? [])
    await database.weights.bulkPut(backup.weights ?? [])
    await database.customRecipes.bulkPut(backup.customRecipes ?? [])
  })
  await seedIfNeeded(database)
}

/**
 * Pide al navegador que no borre los datos por falta de espacio o de uso.
 * Safari borra los datos de una web que no se abre en 7 días, salvo si está añadida a la pantalla de inicio.
 */
export async function requestPersistentStorage(): Promise<boolean | undefined> {
  if (!navigator.storage?.persist) return undefined
  try {
    return (await navigator.storage.persisted()) || (await navigator.storage.persist())
  } catch {
    return undefined
  }
}
