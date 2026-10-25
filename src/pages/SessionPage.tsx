import { Icon } from '../components/Icon'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Card, NumberInput, Page, Row } from '../components/ui'
import { dayTitle } from '../lib/dates'
import { db } from '../lib/db'
import { exerciseGroups, searchExercises } from '../lib/exercises'
import { formatDuration, formatKg, formatPace } from '../lib/format'
import { addSet, deleteSession } from '../lib/planner'
import { normalize } from '../lib/recipes'
import { navigate } from '../lib/router'
import { sessionTitle, statusLabel, type Session, type SessionStatus, type StrengthSet } from '../lib/types'

export function SessionPage({ id }: { id: number }) {
  const session = useLiveQuery(() => db.sessions.get(id), [id])
  if (session === undefined) return <Page title="Entreno">{null}</Page>

  const update = (changes: Partial<Session>) => db.sessions.update(id, changes)

  return (
    <Page
      title={sessionTitle(session)}
      actions={<a className="text-button" href={`#/semana?d=${session.day}`}>Entrenos</a>}
    >
      <p className="muted subtitle">{dayTitle(session.day)}</p>

      <div className="segmented" role="radiogroup" aria-label="Estado">
        {(['planned', 'done', 'skipped'] as SessionStatus[]).map((status) => (
          <button
            key={status}
            role="radio"
            aria-checked={session.status === status}
            className={session.status === status ? 'selected' : ''}
            onClick={() => update({ status })}
          >
            {statusLabel[status]}
          </button>
        ))}
      </div>

      {session.kind === 'strength' ? <StrengthLog session={session} /> : <RunDetails session={session} update={update} />}

      {session.isExtra && <DeleteButton onDelete={async () => {
        await deleteSession(id)
        navigate(`/semana?d=${session.day}`)
      }} />}
    </Page>
  )
}

function WatchSummary({ session }: { session: Session }) {
  if (!session.externalId) return null
  return (
    <Card title="Apple Watch">
      {session.durationMin !== undefined && <Row label="Tiempo" value={formatDuration(session.durationMin)} />}
      {session.activeKcal !== undefined && <Row label="Calorías activas" value={`${session.activeKcal} kcal`} />}
      {session.avgHeartRate !== undefined && <Row label="Pulso medio" value={`${session.avgHeartRate} ppm`} />}
      {session.maxHeartRate !== undefined && <Row label="Pulso máximo" value={`${session.maxHeartRate} ppm`} />}
    </Card>
  )
}

function RunDetails({ session, update }: { session: Session; update: (c: Partial<Session>) => void }) {
  const field = (label: string, key: keyof Session, unit: string, decimals = true) => (
    <label className="row">
      <span>{label}</span>
      <span className="row-value">
        <NumberInput
          ariaLabel={label}
          decimals={decimals}
          value={session[key] as number | undefined}
          onChange={(v) => update({ [key]: v, ...(v !== undefined && session.status === 'planned' ? { status: 'done' } : {}) })}
        />
        <span className="unit">{unit}</span>
      </span>
    </label>
  )
  return (
    <>
      <Card
        title={session.externalId ? 'Datos del Apple Watch' : 'Datos del entreno'}
        footer={session.externalId ? undefined : 'Llegan solos con el Atajo del iPhone, o puedes copiarlos de la app Fitness.'}
      >
        {session.kind === 'running' && field('Distancia', 'distanceKm', 'km')}
        {field('Tiempo', 'durationMin', 'min')}
        {session.kind === 'running' && session.durationMin && session.distanceKm ? (
          <Row label="Ritmo medio" value={formatPace(session.durationMin, session.distanceKm)} />
        ) : null}
        {field('Pulso medio', 'avgHeartRate', 'ppm', false)}
        {field('Pulso máximo', 'maxHeartRate', 'ppm', false)}
        {field('Calorías activas', 'activeKcal', 'kcal', false)}
      </Card>
    </>
  )
}

function StrengthLog({ session }: { session: Session }) {
  const id = session.id!
  const sets = useLiveQuery(() => db.sets.where('sessionId').equals(id).sortBy('order'), [id]) ?? []
  const names: string[] = []
  for (const s of sets) if (!names.includes(s.exerciseName)) names.push(s.exerciseName)

  return (
    <>
      <WatchSummary session={session} />
      {names.map((name) => (
        <ExerciseCard key={name} sessionId={id} name={name} sets={sets.filter((s) => s.exerciseName === name)} />
      ))}
      <ExercisePicker inSession={names} onPick={(name) => addSet(id, name)} />
      {session.status !== 'done' && names.length > 0 && (
        <button className="primary wide" onClick={() => db.sessions.update(id, { status: 'done' })}>Terminar entreno</button>
      )}
    </>
  )
}

/** Selector de ejercicios: recientes, por grupo muscular o buscando; lo que no está se puede escribir a mano. */
function ExercisePicker({ inSession, onPick }: { inSession: string[]; onPick: (name: string) => void }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState(exerciseGroups[0].group)
  // Nombres usados en entrenos anteriores, del más reciente al más antiguo.
  const used = useLiveQuery(async () => [...new Set((await db.sets.orderBy('createdAt').reverse().toArray()).map((s) => s.exerciseName))]) ?? []
  const available = (list: string[]) => list.filter((n) => !inSession.includes(n))
  const pick = (name: string) => {
    onPick(name)
    setQuery('')
  }
  const typed = query.trim()
  const matches = typed ? available(searchExercises(typed, used)).slice(0, 8) : []
  const exact = [...used, ...exerciseGroups.flatMap((g) => g.exercises)].some((n) => normalize(n) === normalize(typed))
  const recent = available(used).slice(0, 8)

  return (
    <Card title={inSession.length ? 'Añadir otro ejercicio' : 'Elige el primer ejercicio'}>
      <form
        className="search-box inset"
        onSubmit={(e) => {
          e.preventDefault()
          if (matches[0] && normalize(matches[0]) === normalize(typed)) pick(matches[0])
          else if (typed) pick(typed.charAt(0).toUpperCase() + typed.slice(1))
        }}
      >
        <Icon name="search" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Busca o escribe un ejercicio" aria-label="Buscar ejercicio" />
      </form>
      {typed ? (
        <>
          {matches.map((name) => (
            <button key={name} className="row row-button" onClick={() => pick(name)}>{name}</button>
          ))}
          {!exact && (
            <button className="row row-button" onClick={() => pick(typed.charAt(0).toUpperCase() + typed.slice(1))}>
              <Icon name="plus" className="row-icon" /> Añadir «{typed}»
            </button>
          )}
        </>
      ) : (
        <>
          {recent.length > 0 && (
            <>
              <div className="picker-label">Recientes</div>
              <div className="chips">
                {recent.map((name) => <button key={name} className="chip" onClick={() => pick(name)}>{name}</button>)}
              </div>
            </>
          )}
          <div className="picker-label">Por grupo</div>
          <div className="chips group-tabs" role="tablist">
            {exerciseGroups.map((g) => (
              <button key={g.group} role="tab" aria-selected={g.group === group} className={`chip${g.group === group ? ' selected' : ''}`} onClick={() => setGroup(g.group)}>
                {g.group}
              </button>
            ))}
          </div>
          <div className="chips">
            {available(exerciseGroups.find((g) => g.group === group)!.exercises).map((name) => (
              <button key={name} className="chip chip-soft" onClick={() => pick(name)}>
                <Icon name="plus" className="inline-icon" /> {name}
              </button>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

function ExerciseCard({ sessionId, name, sets }: { sessionId: number; name: string; sets: StrengthSet[] }) {
  const best = useLiveQuery(async () => {
    const all = await db.sets.where('exerciseName').equals(name).toArray()
    return all.length ? Math.max(...all.map((s) => s.weightKg)) : undefined
  }, [name])
  return (
    <Card title={name} aside={best ? `Récord ${formatKg(best)}` : undefined}>
      {sets.map((set, i) => (
        <div className="row set-row" key={set.id}>
          <span className="set-number">{i + 1}</span>
          <NumberInput className="num-input small" ariaLabel={`Repeticiones serie ${i + 1}`} decimals={false} value={set.reps} onChange={(v) => db.sets.update(set.id!, { reps: v ?? 0 })} />
          <span className="unit">reps</span>
          <NumberInput className="num-input small" ariaLabel={`Kilos serie ${i + 1}`} value={set.weightKg} onChange={(v) => db.sets.update(set.id!, { weightKg: v ?? 0 })} />
          <span className="unit">kg</span>
          <button className="icon-button danger" aria-label={`Borrar serie ${i + 1}`} onClick={() => db.sets.delete(set.id!)}><Icon name="close" /></button>
        </div>
      ))}
      <button className="row row-button" onClick={() => addSet(sessionId, name)}><Icon name="plus" className="row-icon" /> Añadir serie</button>
    </Card>
  )
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [armed, setArmed] = useState(false)
  return (
    <button className="danger wide" onClick={() => (armed ? onDelete() : setArmed(true))}>
      {armed ? 'Pulsa otra vez para borrar' : 'Borrar este entreno extra'}
    </button>
  )
}
