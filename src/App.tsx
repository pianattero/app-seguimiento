import { ErrorBoundary } from './components/ErrorBoundary'
import { Icon, type IconName } from './components/Icon'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { startOfWeek, today } from './lib/dates'
import { db, seedIfNeeded } from './lib/db'
import { dismissDbError, useDbStatus } from './lib/dbStatus'
import { ensureWeek } from './lib/planner'
import { setCustomRecipes, type MealSlot } from './lib/recipes'
import { useRoute } from './lib/router'
import { ImportPage } from './pages/ImportPage'
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
import { WeightPage } from './pages/WeightPage'

const tabs = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Entrenos' },
  { key: 'comidas', label: 'Comidas' },
  { key: 'ciclo', label: 'Ciclo' },
  { key: 'peso', label: 'Peso' },
  { key: 'ajustes', label: 'Ajustes' },
]

const tabIcons: Record<string, IconName> = { hoy: 'sun', semana: 'dumbbell', comidas: 'bowl', ciclo: 'moon', peso: 'scale', ajustes: 'sliders' }

const tabFor: Record<string, string> = { sesion: 'semana', importar: 'semana', atajo: 'ajustes', comida: 'comidas', receta: 'comidas', compra: 'comidas', 'receta-nueva': 'comidas', preferencias: 'ajustes' }

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
      {
        // "?d=" abre un día concreto; "?w=" (enlaces antiguos) abre el lunes de esa semana.
        const day = params.get('d') ?? params.get('w') ?? undefined
        const month = params.get('m') ?? (day ?? today()).slice(0, 7)
        page = <WeekPage key={params.toString()} month={month} selected={day ?? (params.get('m') ? undefined : today())} />
      }
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
      page = <RecipePage id={path[1]} sideId={params.get('g') ?? undefined} portions={Number(params.get('r') ?? 1) || 1} />
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
      page = <CyclePage month={params.get('m') ?? undefined} />
      break
    case 'peso':
      page = <WeightPage />
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
      <main>
        <ErrorBoundary resetKey={`${path.join('/')}?${params}`}>{page}</ErrorBoundary>
      </main>
      <nav className="tab-bar">
        {tabs.map((t) => (
          <a key={t.key} href={`#/${t.key}`} className={activeTab === t.key ? 'active' : ''}>
            <Icon name={tabIcons[t.key]} />
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
