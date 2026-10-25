import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, type ReactNode } from 'react'
import { startOfWeek, today } from './lib/dates'
import { db, seedIfNeeded } from './lib/db'
import { dismissDbError, useDbStatus } from './lib/dbStatus'
import { ensureWeek } from './lib/planner'
import { setCustomRecipes, type MealSlot } from './lib/recipes'
import { useRoute } from './lib/router'
import { ImportPage } from './pages/ImportPage'
import { CycleImportPage } from './pages/CycleImportPage'
import { CyclePage } from './pages/CyclePage'
import { MealEditPage } from './pages/MealEditPage'
import { MealsPage } from './pages/MealsPage'
import { PreferencesPage } from './pages/PreferencesPage'
import { RecipeFormPage } from './pages/RecipeFormPage'
import { RecipePage } from './pages/RecipePage'
import { ShoppingPage } from './pages/ShoppingPage'
import { SessionPage } from './pages/SessionPage'
import { SettingsPage } from './pages/SettingsPage'
import { ShortcutPage } from './pages/ShortcutPage'
import { TodayPage } from './pages/TodayPage'
import { WeekPage } from './pages/WeekPage'

const tabs = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Entrenos' },
  { key: 'comidas', label: 'Comidas' },
  { key: 'ciclo', label: 'Ciclo' },
  { key: 'ajustes', label: 'Ajustes' },
]

/** Iconos de línea para la barra inferior (24×24). */
const tabIcons: Record<string, ReactNode> = {
  hoy: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  semana: (
    <>
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
    </>
  ),
  comidas: (
    <>
      <path d="M3 12h18a9 9 0 0 1-18 0Z" />
      <path d="M8 8c0-2 2-2 2-4M13 8c0-2 2-2 2-4" />
    </>
  ),
  ciclo: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  ajustes: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
}

const tabFor: Record<string, string> = { sesion: 'semana', importar: 'semana', atajo: 'ajustes', comida: 'comidas', receta: 'comidas', compra: 'comidas', 'receta-nueva': 'comidas', preferencias: 'comidas' }

export default function App() {
  const { path, params } = useRoute()
  const section = path[0] ?? 'hoy'
  const customRecipes = useLiveQuery(() => db.customRecipes.toArray())
  if (customRecipes) setCustomRecipes(customRecipes)

  useEffect(() => {
    seedIfNeeded().then(() => ensureWeek(startOfWeek(today())))
  }, [])

  let page
  switch (section) {
    case 'semana':
      page = <WeekPage weekStart={startOfWeek(params.get('w') ?? today())} />
      break
    case 'sesion':
      page = <SessionPage id={Number(path[1])} />
      break
    case 'importar':
      page = <ImportPage params={params} />
      break
    case 'comidas':
      page = <MealsPage weekStart={startOfWeek(params.get('w') ?? today())} />
      break
    case 'comida':
      page = <MealEditPage day={path[1]} slot={path[2] as MealSlot} />
      break
    case 'receta':
      page = <RecipePage id={path[1]} portions={Number(params.get('r') ?? 1) || 1} />
      break
    case 'receta-nueva':
      page = <RecipeFormPage params={params} />
      break
    case 'preferencias':
      page = <PreferencesPage />
      break
    case 'compra':
      page = <ShoppingPage weekStart={startOfWeek(params.get('w') ?? today())} weeks={params.get('semanas') === '2' ? 2 : 1} />
      break
    case 'ciclo':
      page = path[1] === 'importar' ? <CycleImportPage params={params} /> : <CyclePage month={params.get('m') ?? undefined} />
      break
    case 'ajustes':
      page = <SettingsPage />
      break
    case 'atajo':
      page = <ShortcutPage />
      break
    default:
      page = <TodayPage />
  }

  const activeTab = tabFor[section] ?? section
  return (
    <div className="app">
      <DbBanner />
      <main>{page}</main>
      <nav className="tab-bar">
        {tabs.map((t) => (
          <a key={t.key} href={`#/${t.key}`} className={activeTab === t.key ? 'active' : ''}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{tabIcons[t.key]}</svg>
            <span>{t.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}

function DbBanner() {
  const status = useDbStatus()
  if (status.state === 'ok' || status.state === 'opening') return null
  return (
    <div className="banner" role="alert">
      {status.state === 'blocked' ? (
        <p>
          No se puede guardar: seguramente hay otra pestaña de Safari con una versión anterior de la app abierta. Cierra las demás
          pestañas de la app y pulsa Recargar. Si sigue igual, cierra Safari del todo y vuelve a abrirla.
        </p>
      ) : (
        <p>No se ha podido guardar ({status.message}). Si usas Safari en modo privado o con el almacenamiento bloqueado, ábrela en una pestaña normal.</p>
      )}
      <div className="banner-actions">
        <button onClick={() => window.location.reload()}>Recargar</button>
        {status.state === 'error' && <button onClick={dismissDbError}>Cerrar</button>}
      </div>
    </div>
  )
}
