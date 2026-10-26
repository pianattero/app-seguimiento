import { useLiveQuery } from 'dexie-react-hooks'
import { Card, Page, Row } from '../components/ui'
import { db } from '../lib/db'
import { formatNumber } from '../lib/format'
import { deleteCustomRecipe } from '../lib/meals'
import { getRecipe } from '../lib/recipes'
import { useState } from 'react'

const unitText = { g: 'g', ml: 'ml', ud: '' }
const raciones = (n: number) => `${formatNumber(n, 2)} ${n === 1 ? 'ración' : 'raciones'}`

export function RecipePage({ id, portions }: { id: string; portions: number }) {
  const custom = useLiveQuery(() => db.customRecipes.get(id), [id])
  const recipe = getRecipe(id) ?? custom
  const profile = useLiveQuery(() => db.profile.get('main'))
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!recipe) return <Page title="Receta">{null}</Page>
  const factor = profile?.partnerPortionFactor ?? 1
  const total = portions * (1 + factor)

  return (
    <Page title={recipe.name} actions={<button className="text-button" onClick={() => history.back()}>Volver</button>}>
      <Card title="Por ración" aside={`${recipe.minutes} min`}>
        <Row label="Calorías" value={`${recipe.kcal} kcal`} />
        <Row label="Proteína" value={`${recipe.proteinG} g`} />
        <Row label="Hidratos" value={`${recipe.carbsG} g`} />
        <Row label="Grasa" value={`${recipe.fatG} g`} />
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
