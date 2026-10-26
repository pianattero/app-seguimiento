import { describe, expect, it } from 'vitest'
import { AppDB, exportBackup, importBackup, seedIfNeeded, type Backup } from '../db'

describe('copia de seguridad', () => {
  it('exporta y restaura los datos', async () => {
    const db = new AppDB('copia-ida-vuelta')
    await seedIfNeeded(db)
    await db.weights.put({ day: '2026-10-25', kg: 80 })
    const backup = await exportBackup(db)
    await db.weights.clear()
    await importBackup(backup, db)
    expect(await db.weights.count()).toBe(1)
  })

  it('un archivo dañado no borra los datos', async () => {
    const db = new AppDB('copia-danada')
    await seedIfNeeded(db)
    await db.weights.put({ day: '2026-10-25', kg: 80 })
    await expect(importBackup({ version: 3 } as unknown as Backup, db)).rejects.toThrow()
    await expect(importBackup(null as unknown as Backup, db)).rejects.toThrow()
    expect(await db.weights.count()).toBe(1)
    expect(await db.profile.get('main')).toBeDefined()
  })

  it('si la copia no trae perfil, se crea uno por defecto', async () => {
    const db = new AppDB('copia-sin-perfil')
    await importBackup({ version: 1, exportedAt: '', profile: [], sessions: [], sets: [] }, db)
    expect(await db.profile.get('main')).toBeDefined()
  })
})
