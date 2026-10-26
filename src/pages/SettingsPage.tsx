import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { Card, NumberInput, Page, Row } from '../components/ui'
import { db, exportBackup, importBackup, type Backup } from '../lib/db'
import { formatNumber } from '../lib/format'
import { bmr, dayTarget, estimatedKcal, floorKcal, portionFactor } from '../lib/nutrition'
import type { PersonData, Profile } from '../lib/types'

export function SettingsPage() {
  const profile = useLiveQuery(() => db.profile.get('main'))
  return (
    <Page title="Ajustes">
      {profile && <ProfileForm profile={profile} />}
      {profile && <MealSettings profile={profile} />}
      {profile && <CycleSettings profile={profile} />}
      <Card title="Apple Watch">
        <a className="row row-link" href="#/atajo">Cómo enviar los entrenos con un Atajo ›</a>
      </Card>
      <BackupCard />
    </Page>
  )
}

function MealSettings({ profile }: { profile: Profile }) {
  const save = (changes: Partial<Profile>) => db.profile.update('main', changes)
  const excluded = profile.excludedFoods ?? []
  return (
    <Card
      title="Comidas"
      footer="Con «Mi plan», el menú automático y las sugeridas salen de las recetas del plan de alimentación y de tus tartas. Las demás recetas siguen en el buscador."
    >
      <label className="row">
        <span>Recetas del menú</span>
        <select value={profile.menuSource ?? 'plan'} onChange={(e) => save({ menuSource: e.target.value as Profile['menuSource'] })}>
          <option value="plan">Mi plan</option>
          <option value="todo">Todo el recetario</option>
        </select>
      </label>
      <a className="row row-link" href="#/preferencias">
        <span className="row-main">Alimentos que no quieres</span>
        <span className="row-value muted">{excluded.length ? excluded.join(', ') : 'ninguno'} ›</span>
      </a>
    </Card>
  )
}

function CycleSettings({ profile }: { profile: Profile }) {
  const save = (changes: Partial<Profile>) => db.profile.update('main', changes)
  return (
    <Card title="Ciclo" footer="En la fase lútea el déficit baja 150 kcal. Es una sugerencia: la evidencia es limitada y cada cuerpo es distinto.">
      <label className="row">
        <span>Ajustar calorías por fase</span>
        <input type="checkbox" className="switch" checked={profile.cycleAdjust !== false} onChange={(e) => save({ cycleAdjust: e.target.checked })} />
      </label>
      <label className="row">
        <span>Duración habitual del ciclo</span>
        <span className="row-value">
          <NumberInput ariaLabel="Duración del ciclo" decimals={false} value={profile.cycleLengthDays ?? 28} onChange={(v) => v && save({ cycleLengthDays: v })} />
          <span className="unit">días</span>
        </span>
      </label>
      <label className="row">
        <span>Días de regla</span>
        <span className="row-value">
          <NumberInput ariaLabel="Días de regla" decimals={false} value={profile.periodLengthDays ?? 5} onChange={(v) => v && save({ periodLengthDays: v })} />
          <span className="unit">días</span>
        </span>
      </label>
    </Card>
  )
}

function PersonFields({ person, onChange }: { person: PersonData; onChange: (p: PersonData) => void }) {
  const field = (label: string, key: 'ageYears' | 'weightKg' | 'heightCm', unit: string) => (
    <label className="row">
      <span>{label}</span>
      <span className="row-value">
        <NumberInput ariaLabel={label} decimals={key === 'weightKg'} value={person[key]} onChange={(v) => v && onChange({ ...person, [key]: v })} />
        <span className="unit">{unit}</span>
      </span>
    </label>
  )
  return (
    <>
      {field('Edad', 'ageYears', 'años')}
      {field('Peso', 'weightKg', 'kg')}
      {field('Altura', 'heightCm', 'cm')}
    </>
  )
}

function ProfileForm({ profile }: { profile: Profile }) {
  const save = (changes: Partial<Profile>) => db.profile.update('main', { ...changes, configured: true })
  const target = (kcal: number) => dayTarget(profile.person, kcal, profile.deficitKcal, profile.proteinPerKg).kcal
  const suggested = portionFactor(profile.partner, profile.person, profile.deficitKcal)
  return (
    <>
      <Card title="Tus datos">
        <PersonFields person={profile.person} onChange={(person) => save({ person })} />
      </Card>

      <Card
        title="Objetivo"
        footer={`500 kcal de déficit equivale a perder unos 0,5 kg por semana. Nunca baja de ${floorKcal(profile.person.sex)} kcal para no comprometer los entrenos.`}
      >
        <label className="row">
          <span>Déficit diario</span>
          <select value={profile.deficitKcal} onChange={(e) => save({ deficitKcal: Number(e.target.value) })}>
            {[300, 400, 500, 600].map((k) => <option key={k} value={k}>{k} kcal</option>)}
          </select>
        </label>
        <label className="row">
          <span>Proteína</span>
          <span className="row-value">
            <NumberInput ariaLabel="Proteína por kg" value={profile.proteinPerKg} onChange={(v) => v && save({ proteinPerKg: v })} />
            <span className="unit">g/kg</span>
          </span>
        </label>
        <Row label="Metabolismo basal" value={`${Math.round(bmr(profile.person))} kcal`} />
        <Row label="Día de descanso" value={`${target(0)} kcal`} />
        <Row label="Día de fuerza" value={`${target(estimatedKcal('strength'))} kcal`} />
        <Row label="Día de running" value={`${target(estimatedKcal('running'))} kcal`} />
        <Row label="Lunes (fuerza + zumba)" value={`${target(estimatedKcal('strength') + estimatedKcal('dance'))} kcal`} />
      </Card>

      <Card title="Segunda persona" footer="El menú se cocina para los dos y se reparte con este factor.">
        <label className="row">
          <span>Nombre</span>
          <input className="text-input" value={profile.partnerName} onChange={(e) => save({ partnerName: e.target.value })} />
        </label>
        <PersonFields person={profile.partner} onChange={(partner) => save({ partner })} />
        <label className="row">
          <span>Raciones por cada una tuya</span>
          <NumberInput ariaLabel="Factor de raciones" value={profile.partnerPortionFactor} onChange={(v) => v && save({ partnerPortionFactor: v })} />
        </label>
        <Row label="Sugerido según sus datos" value={formatNumber(suggested, 1)} />
      </Card>
    </>
  )
}

function BackupCard() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string>()

  async function download() {
    const backup = await exportBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seguimiento-${backup.exportedAt.slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function restore(file: File) {
    try {
      await importBackup(JSON.parse(await file.text()) as Backup)
      setMessage('Copia restaurada.')
    } catch (error) {
      setMessage(`No se pudo restaurar: ${(error as Error).message}`)
    }
  }

  return (
    <Card title="Copia de seguridad" footer={message ?? 'Los datos solo están en este navegador. Descarga una copia de vez en cuando y guárdala en iCloud Drive.'}>
      <button className="row row-button" onClick={download}>Descargar copia</button>
      <button className="row row-button" onClick={() => fileInput.current?.click()}>Restaurar desde archivo…</button>
      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
    </Card>
  )
}
