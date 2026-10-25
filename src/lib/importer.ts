import { toDayString } from './dates'
import type { ImportedWorkout, SessionKind } from './types'

/**
 * Convierte los parámetros de la URL que abre el Atajo del iPhone en un entreno.
 * Ejemplo: #/importar?tipo=running&inicio=2026-10-27T19:05:00&duracion=32 min&distancia=5,2 km&kcal=380&pulso=152&pulso_max=171
 */
export type ImportResult = { ok: true; workout: ImportedWorkout } | { ok: false; error: string }

/** Número de un texto como "5,2 km" o "1.234,5": devuelve el valor y la unidad escrita detrás. */
export function parseQuantity(text: string | null | undefined): { value: number; unit: string } | undefined {
  if (!text) return undefined
  const match = text.trim().match(/^(-?[\d.,]+)\s*([^\d\s].*)?$/)
  if (!match) return undefined
  let digits = match[1]
  if (digits.includes(',') && digits.includes('.')) {
    // El separador que va último es el decimal.
    digits = digits.lastIndexOf(',') > digits.lastIndexOf('.') ? digits.replace(/\./g, '').replace(',', '.') : digits.replace(/,/g, '')
  } else {
    digits = digits.replace(',', '.')
  }
  const value = Number(digits)
  if (!Number.isFinite(value)) return undefined
  return { value, unit: (match[2] ?? '').trim().toLowerCase() }
}

export function parseKind(text: string | null): SessionKind | undefined {
  const t = (text ?? '').toLowerCase()
  if (/run|corr|carrera|trot/.test(t)) return 'running'
  if (/fuerza|strength|pesa|tradicional|funcional|gym|gimnasio/.test(t)) return 'strength'
  return undefined
}

/** Minutos a partir de "32", "32 min", "1920 s", "1 h", "0:32:10" o "32:10". */
export function parseDurationMin(text: string | null): number | undefined {
  if (!text) return undefined
  const clock = text.trim().match(/^(\d+):(\d{2})(?::(\d{2}))?$/)
  if (clock) {
    const [a, b, c] = [Number(clock[1]), Number(clock[2]), clock[3] === undefined ? undefined : Number(clock[3])]
    return c === undefined ? a + b / 60 : a * 60 + b + c / 60
  }
  const q = parseQuantity(text)
  if (!q) return undefined
  if (/^(s|seg|sec)/.test(q.unit)) return q.value / 60
  if (/^(h|hr|hora)/.test(q.unit)) return q.value * 60
  return q.value
}

/** Kilómetros a partir de "5,2", "5,2 km" o "5200 m". Un número sin unidad mayor que 100 se toma como metros. */
export function parseDistanceKm(text: string | null): number | undefined {
  const q = parseQuantity(text)
  if (!q) return undefined
  if (q.unit === 'm' || q.unit.startsWith('metro')) return q.value / 1000
  if (q.unit === '' && q.value > 100) return q.value / 1000
  return q.value
}

/** Fecha en ISO ("2026-10-27T19:05:00", "2026-10-27") o española ("27/10/2026 19:05"). */
export function parseDate(text: string | null): Date | undefined {
  if (!text) return undefined
  const t = text.trim()
  const es = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ ,]+(\d{1,2}):(\d{2}))?/)
  if (es) {
    return new Date(Number(es[3]), Number(es[2]) - 1, Number(es[1]), Number(es[4] ?? 12), Number(es[5] ?? 0))
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const [y, m, d] = t.split('-').map(Number)
    return new Date(y, m - 1, d, 12)
  }
  const date = new Date(t)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const round = (n: number | undefined, digits: number) =>
  n === undefined ? undefined : Math.round(n * 10 ** digits) / 10 ** digits

export function parseWorkoutParams(params: URLSearchParams): ImportResult {
  const kind = parseKind(params.get('tipo'))
  if (!kind) return { ok: false, error: 'Falta el tipo de entreno (running o fuerza).' }
  const start = parseDate(params.get('inicio') ?? params.get('fecha'))
  if (!start) return { ok: false, error: 'Falta la fecha del entreno o no se entiende.' }
  const startedAt = start.toISOString()
  return {
    ok: true,
    workout: {
      externalId: params.get('id') || `${kind}-${startedAt}`,
      kind,
      startedAt,
      day: toDayString(start),
      durationMin: round(parseDurationMin(params.get('duracion')), 1),
      distanceKm: kind === 'running' ? round(parseDistanceKm(params.get('distancia')), 2) : undefined,
      activeKcal: round(parseQuantity(params.get('kcal'))?.value, 0),
      avgHeartRate: round(parseQuantity(params.get('pulso'))?.value, 0),
      maxHeartRate: round(parseQuantity(params.get('pulso_max'))?.value, 0),
    },
  }
}
