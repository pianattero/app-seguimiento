import { useEffect } from 'react'
import { startOfWeek, today } from './lib/dates'
import { seedIfNeeded } from './lib/db'
import { ensureWeek } from './lib/planner'
import { useRoute } from './lib/router'
import { ImportPage } from './pages/ImportPage'
import { ProgressPage } from './pages/ProgressPage'
import { SessionPage } from './pages/SessionPage'
import { SettingsPage } from './pages/SettingsPage'
import { ShortcutPage } from './pages/ShortcutPage'
import { TodayPage } from './pages/TodayPage'
import { WeekPage } from './pages/WeekPage'

const tabs = [
  { key: 'hoy', label: 'Hoy', icon: '☀️' },
  { key: 'semana', label: 'Entrenos', icon: '🏃‍♀️' },
  { key: 'progreso', label: 'Progreso', icon: '📈' },
  { key: 'ajustes', label: 'Ajustes', icon: '⚙️' },
]

const tabFor: Record<string, string> = { sesion: 'semana', importar: 'semana', atajo: 'ajustes' }

export default function App() {
  const { path, params } = useRoute()
  const section = path[0] ?? 'hoy'

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
    case 'progreso':
      page = <ProgressPage />
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
