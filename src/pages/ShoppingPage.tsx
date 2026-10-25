import { useLiveQuery } from 'dexie-react-hooks'
import { Card, Page } from '../components/ui'
import { addDays, weekTitle } from '../lib/dates'
import { db } from '../lib/db'
import { formatNumber } from '../lib/format'
import { shoppingList } from '../lib/meals'

const unitText = { g: 'g', ml: 'ml', ud: 'ud' }

export function ShoppingPage({ weekStart, weeks }: { weekStart: string; weeks: 1 | 2 }) {
  const end = addDays(weekStart, 7 * weeks)
  const meals = useLiveQuery(() => db.meals.where('day').between(weekStart, end).toArray(), [weekStart, end]) ?? []
  const profile = useLiveQuery(() => db.profile.get('main'))
  const checks = useLiveQuery(() => db.shopping.where('key').startsWith(`${weekStart}|`).toArray(), [weekStart]) ?? []
  const list = shoppingList(meals, profile?.partnerPortionFactor ?? 1)
  const checked = new Set(checks.filter((c) => c.checked).map((c) => c.key))
  const secondWeekEmpty = weeks === 2 && !meals.some((m) => m.day >= addDays(weekStart, 7))

  const toggle = (key: string) => db.shopping.put({ key: `${weekStart}|${key}`, checked: !checked.has(`${weekStart}|${key}`) })

  return (
    <Page title="Lista de la compra" actions={<a className="text-button" href={`#/comidas?w=${weekStart}`}>Menú</a>}>
      <p className="muted subtitle">{weekTitle(weekStart)}{weeks === 2 ? ` y ${weekTitle(addDays(weekStart, 7))}` : ''} · para 2 personas</p>
      <div className="segmented" role="radiogroup" aria-label="Semanas">
        {([1, 2] as const).map((w) => (
          <a key={w} role="radio" aria-checked={weeks === w} className={`segment${weeks === w ? ' selected' : ''}`} href={`#/compra?w=${weekStart}&semanas=${w}`}>
            {w === 1 ? '1 semana' : '2 semanas'}
          </a>
        ))}
      </div>

      {secondWeekEmpty && (
        <Card>
          <a className="row row-link" href={`#/comidas?w=${addDays(weekStart, 7)}`}>La semana siguiente aún no tiene menú. Generarlo ›</a>
        </Card>
      )}
      {list.length === 0 && (
        <Card>
          <div className="row muted">No hay recetas en el menú de estas fechas.</div>
        </Card>
      )}
      {list.map(({ section, items }) => (
        <Card key={section} title={section}>
          {items.map((item) => (
            <label key={item.key} className={`row check-row${checked.has(`${weekStart}|${item.key}`) ? ' done' : ''}`}>
              <input type="checkbox" checked={checked.has(`${weekStart}|${item.key}`)} onChange={() => toggle(item.key)} />
              <span className="row-main">{item.name}</span>
              <span className="row-value">{formatNumber(item.qty)} {unitText[item.unit]}</span>
            </label>
          ))}
        </Card>
      ))}
    </Page>
  )
}
