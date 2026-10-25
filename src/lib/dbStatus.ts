import { useSyncExternalStore } from 'react'
import type { AppDB } from './db'

/**
 * Estado de la base de datos del navegador, para avisar en pantalla en vez de fallar en silencio.
 * - blocked: otra pestaña con una versión anterior de la app tiene la base abierta y no deja actualizarla.
 * - error: el navegador no deja guardar datos (p. ej. almacenamiento bloqueado) o una escritura falló.
 */
export type DbStatus = { state: 'ok' } | { state: 'opening' } | { state: 'blocked' } | { state: 'error'; message: string }

let status: DbStatus = { state: 'opening' }
const listeners = new Set<() => void>()

function set(next: DbStatus) {
  status = next
  listeners.forEach((l) => l())
}

export function useDbStatus(): DbStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => status,
  )
}

export function watchDb(db: AppDB): void {
  db.on('blocked', () => set({ state: 'blocked' }))
  // Si una versión nueva de la app abre la base en otra pestaña, esta se recarga para no bloquearla.
  db.on('versionchange', () => {
    db.close()
    window.location.reload()
    return false
  })
  // Safari a veces deja la apertura colgada sin avisar: si tarda, se muestra el mismo aviso.
  setTimeout(() => {
    if (status.state === 'opening') set({ state: 'blocked' })
  }, 5000)
  db.open().then(
    () => set({ state: 'ok' }),
    (e: unknown) => set({ state: 'error', message: describe(e) }),
  )
  window.addEventListener('unhandledrejection', (e) => set({ state: 'error', message: describe(e.reason) }))
}

export function dismissDbError(): void {
  if (status.state === 'error') set({ state: 'ok' })
}

function describe(e: unknown): string {
  if (e instanceof Error) return e.name && e.name !== 'Error' ? `${e.name}: ${e.message}` : e.message
  return String(e)
}
