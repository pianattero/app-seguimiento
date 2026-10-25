/** Fechas como texto 'AAAA-MM-DD' en hora local; las semanas van de lunes a domingo. */

export type DayString = string

const pad = (n: number) => String(n).padStart(2, '0')

export function toDayString(date: Date): DayString {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseDay(day: DayString): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function today(): DayString {
  return toDayString(new Date())
}

export function addDays(day: DayString, days: number): DayString {
  const date = parseDay(day)
  date.setDate(date.getDate() + days)
  return toDayString(date)
}

/** 0 = lunes ... 6 = domingo. */
export function weekdayIndex(day: DayString): number {
  return (parseDay(day).getDay() + 6) % 7
}

export function startOfWeek(day: DayString): DayString {
  return addDays(day, -weekdayIndex(day))
}

export function daysOfWeek(weekStart: DayString): DayString[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export const weekdayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const longFormat = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
const shortFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })

export function dayTitle(day: DayString): string {
  const text = longFormat.format(parseDay(day))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function weekTitle(weekStart: DayString): string {
  return `${shortFormat.format(parseDay(weekStart))} – ${shortFormat.format(parseDay(addDays(weekStart, 6)))}`
}

/** Días de `from` a `to` (negativo si `to` es anterior). */
export function daysBetween(from: DayString, to: DayString): number {
  const utc = (d: DayString) => {
    const [y, m, day] = d.split('-').map(Number)
    return Date.UTC(y, m - 1, day)
  }
  return Math.round((utc(to) - utc(from)) / 86_400_000)
}
