import type { Ingredient } from './recipes'

/** Minúsculas y sin tildes, para comparar textos. */
export function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const unitWords: Record<string, { unit: Ingredient['unit']; factor: number }> = {
  g: { unit: 'g', factor: 1 }, gr: { unit: 'g', factor: 1 }, gramos: { unit: 'g', factor: 1 }, kg: { unit: 'g', factor: 1000 },
  ml: { unit: 'ml', factor: 1 }, l: { unit: 'ml', factor: 1000 }, litro: { unit: 'ml', factor: 1000 }, litros: { unit: 'ml', factor: 1000 },
  ud: { unit: 'ud', factor: 1 }, uds: { unit: 'ud', factor: 1 }, unidad: { unit: 'ud', factor: 1 }, unidades: { unit: 'ud', factor: 1 },
}

/** Ingredientes escritos a mano, uno por línea: "200 g pollo", "2 huevos", "1 l leche". */
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export function parseIngredientLines(text: string): Ingredient[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(\d+(?:[.,]\d+)?)\s*([a-záéíóú]+)?\.?\s+(?:de\s+)?(.+)$/i)
      if (!m) return { name: capitalize(line), qty: 1, unit: 'ud' as const, section: 'Otros' as const }
      const qty = Number(m[1].replace(',', '.'))
      const unit = m[2] ? unitWords[m[2].toLowerCase()] : undefined
      // "2 huevos": la palabra no es una unidad, forma parte del nombre.
      const name = unit || !m[2] ? m[3] : `${m[2]} ${m[3]}`
      return { name: capitalize(name), qty: qty * (unit?.factor ?? 1), unit: unit?.unit ?? 'ud', section: 'Otros' as const }
    })
}

export const fv = (name: string, qty: number, unit: Ingredient['unit'] = 'g'): Ingredient => ({ name, qty, unit, section: 'Fruta y verdura' })
export const cp = (name: string, qty: number, unit: Ingredient['unit'] = 'g'): Ingredient => ({ name, qty, unit, section: 'Carne y pescado' })
export const lh = (name: string, qty: number, unit: Ingredient['unit'] = 'g'): Ingredient => ({ name, qty, unit, section: 'Lácteos y huevos' })
export const pan = (name: string, qty: number, unit: Ingredient['unit'] = 'g'): Ingredient => ({ name, qty, unit, section: 'Panadería' })
export const de = (name: string, qty: number, unit: Ingredient['unit'] = 'g'): Ingredient => ({ name, qty, unit, section: 'Despensa' })

