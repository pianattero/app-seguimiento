import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { Card, Page, Row, SessionRow } from '../components/ui'
import { addDays, dayTitle, monthGrid, parseDay, startOfWeek, today, weekTitle } from '../lib/dates'
import { db } from '../lib/db'
import { formatKm } from '../lib/format'
import { ensureWeek } from '../lib/planner'
import { navigate } from '../lib/router'
import type { Session, SessionKind } from '../lib/types'

/** Clases de un día del calendario: color por tipo de entreno y relleno según si está hecho. */
function dayClass(sessions: Session[]): string {
  const active = sessions.filter((s) => s.status !== 'skipped')
  const kinds = new Set((active.length ? active : sessions).map((s) => s.kind))
  if (kinds.size === 0) return ''
  const kind = kinds.size === 2 ? 'k-both' : kinds.has('strength') ? 'k-strength' : 'k-running'
  const status = sessions.some((s) => s.status === 'done') ? 'st-done' : active.length ? 'st-planned' : 'st-skipped'
  return `train-day ${kind} ${status}`
}

/** Entrenos del mes en forma de calendario: fuerza en amarillo y running en rosa. */
export function WeekPage({ month, selected: initial }: { month: string; selected?: string }) {
  const { days, prev, next, title } = monthGrid(month)
  const [selected, setSelected] = useState(initial)
  const first = days[0]
  const last = days[days.length - 1]

  useEffect(() => {
    // Solo se rellenan con la plantilla las semanas desde la actual: las pasadas sin datos quedan vacías.
    const current = startOfWeek(today())
    for (let w = first; w <= last; w = addDays(w, 7)) if (w >= current) ensureWeek(w)
  }, [first, last])

  const sessions = useLiveQuery(() => db.sessions.where('day').between(first, addDays(last, 1)).sortBy('day'), [first, last]) ?? []
  const sets = useLiveQuery(() => db.sets.where('sessionId').anyOf(sessions.map((s) => s.id!)).toArray(), [sessions]) ?? []
  const setCount = (id?: number) => sets.filter((x) => x.sessionId === id).length

  const weekStart = startOfWeek(selected ?? today())
  const week = sessions.filter((s) => s.day >= weekStart && s.day < addDays(weekStart, 7))
  const fixed = week.filter((s) => !s.isExtra)
  const done = week.filter((s) => s.status === 'done')
  const daySessions = selected ? sessions.filter((s) => s.day === selected) : []

  async function addExtra(kind: SessionKind, day: string) {
    const id = await db.sessions.add({ day, kind, status: 'planned', isExtra: true })
    navigate(`/sesion/${id}`)
  }

  return (
    <Page title="Entrenos">
      <div className="month-nav">
        <a className="icon-button" href={`#/semana?m=${prev}`} aria-label="Mes anterior"><Icon name="left" /></a>
        <h2>{title}</h2>
        <a className="icon-button" href={`#/semana?m=${next}`} aria-label="Mes siguiente"><Icon name="right" /></a>
      </div>
      <div className="month-grid" role="grid" aria-label={`Entrenos de ${title}`}>
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => <div key={d} className="month-head">{d}</div>)}
        {days.map((day) => {
          const cls = [
            'month-day',
            day.slice(0, 7) === month ? '' : 'out',
            dayClass(sessions.filter((s) => s.day === day)),
            day === today() ? 'is-today' : '',
            day === selected ? 'selected' : '',
          ].filter(Boolean).join(' ')
          return (
            <button key={day} className={cls} onClick={() => setSelected(day === selected ? undefined : day)} aria-label={dayTitle(day)}>
              {parseDay(day).getDate()}
            </button>
          )
        })}
      </div>
      <div className="legend">
        <span><i className="train-day k-strength st-done" />Fuerza</span>
        <span><i className="train-day k-running st-done" />Running</span>
        <span><i className="train-day k-strength st-planned" />Pendiente (color claro)</span>
      </div>

      {selected && (
        <Card title={dayTitle(selected)} aside={selected === today() ? 'Hoy' : undefined}>
          {daySessions.length === 0 && (
            <div className="row muted">
              <Icon name="rest" className="row-icon" /> Descanso
            </div>
          )}
          {daySessions.map((s) => <SessionRow key={s.id} session={s} setCount={setCount(s.id)} />)}
          <button className="row row-button" onClick={() => addExtra('running', selected)}>
            <Icon name="plus" className="row-icon" /> Añadir running extra
          </button>
          <button className="row row-button" onClick={() => addExtra('strength', selected)}>
            <Icon name="plus" className="row-icon" /> Añadir fuerza extra
          </button>
        </Card>
      )}

      <Card title={`Semana ${weekTitle(weekStart)}`}>
        <Row label="Entrenos fijos hechos" value={`${fixed.filter((s) => s.status === 'done').length} de ${fixed.length}`} />
        {done.some((s) => s.isExtra) && <Row label="Extras" value={done.filter((s) => s.isExtra).length} />}
        <Row label="Kilómetros" value={formatKm(done.reduce((t, s) => t + (s.distanceKm ?? 0), 0))} />
        <Row label="Series de fuerza" value={week.reduce((t, s) => t + setCount(s.id), 0)} />
      </Card>
    </Page>
  )
}
