import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Card, Page } from '../components/ui'
import { addDays, weekTitle } from '../lib/dates'
import { db } from '../lib/db'
import { formatNumber } from '../lib/format'
import { shoppingList } from '../lib/meals'

const unitText = { g: 'g', ml: 'ml', ud: 'ud' }

/** Mercadona no tiene API pública para llenar el carrito: se abre su buscador con el producto. */
const mercadonaUrl = (name: string) => `https://tienda.mercadona.es/search-results?query=${encodeURIComponent(name.replace(/\(.*?\)/g, '').trim())}`

export function ShoppingPage({ weekStart, weeks }: { weekStart: string; weeks: 1 | 2 }) {
  const end = addDays(weekStart, 7 * weeks)
  const meals = useLiveQuery(() => db.meals.where('day').between(weekStart, end).toArray(), [weekStart, end]) ?? []
  const profile = useLiveQuery(() => db.profile.get('main'))
  const checks = useLiveQuery(() => db.shopping.where('key').startsWith(`${weekStart}|`).toArray(), [weekStart]) ?? []
  const list = shoppingList(meals, profile?.partnerPortionFactor ?? 1)
  const checked = new Set(checks.filter((c) => c.checked).map((c) => c.key))
  const secondWeekEmpty = weeks === 2 && !meals.some((m) => m.day >= addDays(weekStart, 7))

  const [copied, setCopied] = useState(false)
  const pending = list.flatMap((s) => s.items.filter((i) => !checked.has(`${weekStart}|${i.key}`)))
  const itemCount = list.reduce((n, s) => n + s.items.length, 0)

  async function copy() {
    const text = pending.map((i) => `${i.name}: ${formatNumber(i.qty)} ${unitText[i.unit]}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

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
      {list.length > 0 && (
        <div className="shop-progress" aria-live="polite">
          <span><strong>{itemCount - pending.length}</strong> de {itemCount} en el carro</span>
          <span className="macro-track"><span className="macro-fill" style={{ width: `${((itemCount - pending.length) / itemCount) * 100}%`, background: 'var(--green)' }} /></span>
        </div>
      )}
      {list.length > 0 && (
        <Card footer="Mercadona no permite que otras webs añadan cosas a tu carrito. Toca el icono de cada producto para buscarlo en su tienda online, o copia la lista para pegarla en Notas.">
          <a className="row row-link" href="https://tienda.mercadona.es/" target="_blank" rel="noreferrer">
            <Icon name="cart" className="row-icon" /> Abrir Mercadona <Icon name="external" className="inline-icon" />
          </a>
          <button className="row row-button" onClick={copy}>
            <Icon name="book" className="row-icon" /> {copied ? 'Lista copiada' : `Copiar lo que falta (${pending.length})`}
          </button>
        </Card>
      )}
      {list.map(({ section, items }) => (
        <Card key={section} title={section}>
          {items.map((item) => (
            <label key={item.key} className={`row check-row${checked.has(`${weekStart}|${item.key}`) ? ' done' : ''}`}>
              <input type="checkbox" checked={checked.has(`${weekStart}|${item.key}`)} onChange={() => toggle(item.key)} />
              <span className="row-main">{item.name}</span>
              <span className="row-value">{formatNumber(item.qty)} {unitText[item.unit]}</span>
              <a className="icon-button" href={mercadonaUrl(item.name)} target="_blank" rel="noreferrer" aria-label={`Buscar ${item.name} en Mercadona`}>
                <Icon name="search" />
              </a>
            </label>
          ))}
        </Card>
      ))}
    </Page>
  )
}
