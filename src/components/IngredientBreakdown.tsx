import { formatNumber } from '../lib/format'
import type { nutritionFromText } from '../lib/foods'
import { Icon } from './Icon'

/** Kcal de cada ingrediente escrito y el total; marca los que no se reconocen para que se puedan corregir. */
export function IngredientBreakdown({ result }: { result: ReturnType<typeof nutritionFromText> }) {
  if (result.lines.length === 0) return null
  const unknown = result.lines.filter((l) => !l.food || l.grams === undefined).length
  return (
    <div className="breakdown" aria-live="polite">
      {result.lines.map((l, i) => (
        <div className={`breakdown-line${l.food && l.grams !== undefined ? '' : ' unknown'}`} key={i}>
          <span className="breakdown-name">
            {l.ingredient.name}
            {l.food && l.grams !== undefined && <small className="muted"> · {formatNumber(l.grams)} g de {l.food.name.toLowerCase()}</small>}
            {!l.food && <small> · no lo reconozco</small>}
            {l.food && l.grams === undefined && <small> · pon la cantidad en g</small>}
          </span>
          <span className="breakdown-kcal">{l.food && l.grams !== undefined ? `${formatNumber(l.kcal)} kcal` : <Icon name="ban" />}</span>
        </div>
      ))}
      <div className="breakdown-total">
        <span>
          Total
          <small className="muted"> · P {result.proteinG} g · H {result.carbsG} g · G {result.fatG} g</small>
        </span>
        <strong>{formatNumber(result.kcal)} kcal</strong>
      </div>
      {unknown > 0 && <p className="breakdown-note muted">Los marcados no suman. Prueba con otro nombre (por ejemplo «pollo» o «arroz») o escribe la cantidad en gramos.</p>}
    </div>
  )
}
