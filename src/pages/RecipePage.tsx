import { useLiveQuery } from 'dexie-react-hooks'
import { Card, Page, Row } from '../components/ui'
import { db } from '../lib/db'
import { formatNumber } from '../lib/format'
import { deleteCustomRecipe } from '../lib/meals'
import { getRecipe } from '../lib/recipes'
import { useState } from 'react'

const unitText = { g: 'g', ml: 'ml', ud: '' }
const raciones = (n: number) => `${formatNumber(n, 2)} ${n === 1 ? 'ración' : 'raciones'}`

export function RecipePage({ id, sideId, portions }: { id: string; sideId?: string; portions: number }) {
  const custom = useLiveQuery(() => db.customRecipes.get(id), [id])
  const recipe = getRecipe(id) ?? custom
  const side = sideId ? getRecipe(sideId) : undefined
  const profile = useLiveQuery(() => db.profile.get('main'))
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!recipe) return <Page title="Receta">{null}</Page>
  const factor = profile?.partnerPortionFactor ?? 1
  const total = portions * (1 + factor)

  return (
    <Page title={recipe.name} actions={<button className="text-button" onClick={() => history.back()}>Volver</button>}>
      <Card title={side ? 'Por ración, con la guarnición' : 'Por ración'} aside={`${recipe.minutes} min`}>
        <Row label="Calorías" value={`${recipe.kcal + (side?.kcal ?? 0)} kcal`} />
        <Row label="Proteína" value={`${recipe.proteinG + (side?.proteinG ?? 0)} g`} />
        <Row label="Hidratos" value={`${recipe.carbsG + (side?.carbsG ?? 0)} g`} />
        <Row label="Grasa" value={`${recipe.fatG + (side?.fatG ?? 0)} g`} />
        {side && <Row label={`Solo ${recipe.name.toLowerCase()}`} value={`${recipe.kcal} kcal`} />}
      </Card>

      <Card
        title="Ingredientes para los dos"
        footer={`${raciones(portions)} para ti y ${raciones(portions * factor)} para ${profile?.partnerName || 'la otra persona'}. Sal y especias al gusto.`}
      >
        {recipe.ingredients.map((ing) => (
          <Row
            key={ing.name}
            label={ing.name}
            value={`${formatNumber(ing.unit === 'ud' ? Math.round(ing.qty * total * 2) / 2 : Math.round(ing.qty * total / 5) * 5, 1)} ${unitText[ing.unit]}`.trim()}
          />
        ))}
      </Card>

      {recipe.thermomix && (
        <Card title="Thermomix">
          <ol className="steps">{recipe.thermomix.map((s) => <li key={s}>{s}</li>)}</ol>
        </Card>
      )}

      {recipe.steps.length > 0 && (
        <Card title={recipe.thermomix ? 'Sin Thermomix' : 'Preparación'}>
          <ol className="steps">{recipe.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        </Card>
      )}

      {side && (
        <>
          <Card title={`Guarnición: ${side.name.toLowerCase()}`}>
            {side.ingredients.map((ing) => (
              <Row
                key={ing.name}
                label={ing.name}
                value={`${formatNumber(ing.unit === 'ud' ? Math.round(ing.qty * total * 2) / 2 : Math.round(ing.qty * total / 5) * 5, 1)} ${unitText[ing.unit]}`.trim()}
              />
            ))}
          </Card>
          {side.steps.length > 0 && (
            <Card title="Preparación de la guarnición">
              <ol className="steps">{side.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </Card>
          )}
        </>
      )}

      {custom && (
        <button
          className="danger wide"
          onClick={async () => {
            if (!confirmDelete) return setConfirmDelete(true)
            await deleteCustomRecipe(id)
            history.back()
          }}
        >
          {confirmDelete ? 'Pulsa otra vez para borrar la receta' : 'Borrar esta receta propia'}
        </button>
      )}
    </Page>
  )
}
