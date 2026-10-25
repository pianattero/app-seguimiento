import { describe, expect, it } from 'vitest'
import { parseDistanceKm, parseDurationMin, parseKind, parseQuantity, parseWorkoutParams } from '../importer'

describe('importación desde el Atajo', () => {
  it('entiende números con coma y unidades', () => {
    expect(parseQuantity('5,2 km')).toEqual({ value: 5.2, unit: 'km' })
    expect(parseQuantity('1.234,5')).toEqual({ value: 1234.5, unit: '' })
    expect(parseQuantity('abc')).toBeUndefined()
  })

  it('entiende el tipo de entreno en español o como lo nombra Salud', () => {
    expect(parseKind('Correr')).toBe('running')
    expect(parseKind('Running')).toBe('running')
    expect(parseKind('Baile')).toBe('dance')
    expect(parseKind('Dance')).toBe('dance')
    expect(parseKind('Entrenamiento de fuerza tradicional')).toBe('strength')
    expect(parseKind('Yoga')).toBeUndefined()
  })

  it('convierte duraciones a minutos', () => {
    expect(parseDurationMin('32 min')).toBe(32)
    expect(parseDurationMin('1920 s')).toBe(32)
    expect(parseDurationMin('0:32:30')).toBe(32.5)
    expect(parseDurationMin('32:30')).toBe(32.5)
  })

  it('convierte distancias a km', () => {
    expect(parseDistanceKm('5,2 km')).toBe(5.2)
    expect(parseDistanceKm('5200 m')).toBe(5.2)
    expect(parseDistanceKm('5200')).toBe(5.2)
  })

  it('lee un entreno completo', () => {
    const r = parseWorkoutParams(new URLSearchParams('tipo=Correr&inicio=27/10/2026 19:05&duracion=32 min&distancia=5,2 km&kcal=380,4&pulso=152&pulso_max=171'))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.workout).toMatchObject({ kind: 'running', day: '2026-10-27', durationMin: 32, distanceKm: 5.2, activeKcal: 380, avgHeartRate: 152, maxHeartRate: 171 })
  })

  it('avisa si falta el tipo o la fecha', () => {
    expect(parseWorkoutParams(new URLSearchParams('inicio=2026-10-27'))).toMatchObject({ ok: false })
    expect(parseWorkoutParams(new URLSearchParams('tipo=running'))).toMatchObject({ ok: false })
  })
})
