import Dexie, { type EntityTable } from 'dexie'
import type { Profile, Routine, Session, StrengthSet } from './types'

/** Todos los datos viven en el navegador del móvil (IndexedDB). */
export class AppDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  routines!: EntityTable<Routine, 'weekdayIndex'>
  sessions!: EntityTable<Session, 'id'>
  sets!: EntityTable<StrengthSet, 'id'>

  constructor(name = 'seguimiento') {
    super(name)
    this.version(1).stores({
      profile: 'id',
      routines: 'weekdayIndex',
      sessions: '++id, day, externalId',
      sets: '++id, sessionId, exerciseName, createdAt',
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

export const defaultRoutines: Routine[] = [
  { weekdayIndex: 0, name: 'Fuerza A', exercises: ['Sentadilla', 'Press banca', 'Remo con mancuerna', 'Hip thrust', 'Plancha'] },
  { weekdayIndex: 2, name: 'Fuerza B', exercises: ['Peso muerto rumano', 'Press militar', 'Jalón al pecho', 'Zancadas', 'Elevaciones de gemelo'] },
]

export async function seedIfNeeded(database: AppDB = db): Promise<void> {
  await database.transaction('rw', database.profile, database.routines, async () => {
    if (!(await database.profile.get('main'))) await database.profile.put(defaultProfile)
    if ((await database.routines.count()) === 0) await database.routines.bulkPut(defaultRoutines)
  })
}

export interface Backup {
  version: 1
  exportedAt: string
  profile: Profile[]
  routines: Routine[]
  sessions: Session[]
  sets: StrengthSet[]
}

export async function exportBackup(database: AppDB = db): Promise<Backup> {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: await database.profile.toArray(),
    routines: await database.routines.toArray(),
    sessions: await database.sessions.toArray(),
    sets: await database.sets.toArray(),
  }
}

/** Sustituye todos los datos por los de la copia. */
export async function importBackup(backup: Backup, database: AppDB = db): Promise<void> {
  if (backup.version !== 1) throw new Error('Copia de seguridad no reconocida')
  const tables = [database.profile, database.routines, database.sessions, database.sets]
  await database.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()))
    await database.profile.bulkPut(backup.profile)
    await database.routines.bulkPut(backup.routines)
    await database.sessions.bulkPut(backup.sessions)
    await database.sets.bulkPut(backup.sets)
  })
}
