import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Card, Page } from '../components/ui'
import { db } from '../lib/db'
import { allRecipes, isAllowed } from '../lib/recipes'

const quickOptions = ['Curry', 'Picante', 'Cerdo', 'Carne roja', 'Pescado', 'Marisco', 'Atún', 'Champiñones', 'Lácteos', 'Frutos secos', 'Huevo', 'Gluten', 'Tofu', 'Coco', 'Garbanzos', 'Lentejas']

/** Alimentos que no se deben sugerir nunca. */
export function PreferencesPage() {
  const profile = useLiveQuery(() => db.profile.get('main'))
  const [term, setTerm] = useState('')
  const excluded = profile?.excludedFoods ?? []
  const hidden = allRecipes().filter((r) => !isAllowed(r, excluded)).length

  const save = (list: string[]) => db.profile.update('main', { excludedFoods: list })
  const add = (value: string) => {
    const v = value.trim()
    if (v && !excluded.some((e) => e.toLowerCase() === v.toLowerCase())) save([...excluded, v])
  }

  return (
    <Page title="No me gusta" actions={<button className="text-button" onClick={() => history.back()}>Volver</button>}>
      <Card
        title="Alimentos que no quieres"
        footer={`Las recetas que los llevan (en el nombre o en los ingredientes) no se sugieren ni entran en el menú automático. Ahora mismo ${hidden === 1 ? "se oculta 1 receta" : `se ocultan ${hidden} recetas`}.`}
      >
        {excluded.length === 0 && <div className="row muted">Ninguno todavía.</div>}
        {excluded.map((e) => (
          <div className="row" key={e}>
            <span className="row-main">{e}</span>
            <button className="icon-button danger" aria-label={`Quitar ${e}`} onClick={() => save(excluded.filter((x) => x !== e))}>×</button>
          </div>
        ))}
        <form
          className="row"
          onSubmit={(ev) => {
            ev.preventDefault()
            add(term)
            setTerm('')
          }}
        >
          <input className="text-input grow" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Escribe un alimento" aria-label="Alimento a excluir" />
          <button type="submit">Añadir</button>
        </form>
      </Card>

      <Card title="Añadir rápido">
        <div className="row chips">
          {quickOptions.filter((o) => !excluded.some((e) => e.toLowerCase() === o.toLowerCase())).map((o) => (
            <button key={o} className="chip" onClick={() => add(o)}>+ {o}</button>
          ))}
        </div>
      </Card>
    </Page>
  )
}
