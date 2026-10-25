import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { startOfWeek, today } from './lib/dates'
import { db, seedIfNeeded } from './lib/db'
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
  { key: 'hoy', label: 'Hoy', icon: '☀️' },
  { key: 'semana', label: 'Entrenos', icon: '🏃‍♀️' },
  { key: 'comidas', label: 'Comidas', icon: '🥗' },
  { key: 'ciclo', label: 'Ciclo', icon: '🌙' },
  { key: 'ajustes', label: 'Ajustes', icon: '⚙️' },
]

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
      <main>{page}</main>
      <nav className="tab-bar">
        {tabs.map((t) => (
          <a key={t.key} href={`#/${t.key}`} className={activeTab === t.key ? 'active' : ''}>
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
