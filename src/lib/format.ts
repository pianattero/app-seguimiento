const decimal = (digits: number) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits, minimumFractionDigits: 0 })

export const formatKm = (km: number) => `${decimal(2).format(km)} km`
export const formatKg = (kg: number) => `${decimal(1).format(kg)} kg`
export const formatNumber = (n: number, digits = 0) => decimal(digits).format(n)

/** "32:10" o "1:05:00" a partir de minutos. */
export function formatDuration(minutes: number): string {
  const total = Math.round(minutes * 60)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0')
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

/** Ritmo "6:05 /km". */
export function formatPace(durationMin: number, distanceKm: number): string {
  const secPerKm = Math.round((durationMin * 60) / distanceKm)
  return `${Math.floor(secPerKm / 60)}:${String(secPerKm % 60).padStart(2, '0')} /km`
}
