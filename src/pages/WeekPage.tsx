import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState, type CSSProperties } from 'react'
import { Icon } from '../components/Icon'
import { Card, Page, Row, SessionRow } from '../components/ui'
import { addDays, dayTitle, monthGrid, parseDay, startOfWeek, today, weekTitle } from '../lib/dates'
import { db } from '../lib/db'
import { formatKm } from '../lib/format'
import { ensureWeek } from '../lib/planner'
import { navigate } from '../lib/router'
import type { Session, SessionKind } from '../lib/types'

const kindColor: Record<SessionKind, string> = { strength: 'var(--yellow)', running: 'var(--pink)', dance: 'var(--green)' }
const kindOrder: SessionKind[] = ['strength', 'running', 'dance']

/** Aspecto de un día del calendario: un color por tipo de entreno; relleno si está hecho, claro si está pendiente. */
function dayLook(sessions: Session[]): { className: string; style?: CSSProperties } {
  const active = sessions.filter((s) => s.status !== 'skipped')
  const kinds = kindOrder.filter((k) => (active.length ? active : sessions).some((s) => s.kind === k))
  if (kinds.length === 0) return { className: '' }
  const status = sessions.some((s) => s.status === 'done') ? 'st-done' : active.length ? 'st-planned' : 'st-skipped'
  const colors = kinds.map((k) => (status === 'st-done' ? kindColor[k] : `color-mix(in srgb, ${kindColor[k]} 35%, transparent)`))
  const step = 100 / colors.length
  const background = `linear-gradient(135deg, ${colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(', ')})`
  return {
    className: `train-day ${status}`,
    style: status === 'st-skipped' ? undefined : { background, ...(status === 'st-planned' ? { boxShadow: `inset 0 0 0 2px ${kindColor[kinds[0]]}` } : {}) },
  }
}

/** Entrenos del mes en forma de calendario: fuerza en amarillo, running en rosa y zumba en verde. */
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
          const look = dayLook(sessions.filter((s) => s.day === day))
          const cls = [
            'month-day',
            day.slice(0, 7) === month ? '' : 'out',
            look.className,
            day === today() ? 'is-today' : '',
            day === selected ? 'selected' : '',
          ].filter(Boolean).join(' ')
          return (
            <button key={day} className={cls} style={look.style} onClick={() => setSelected(day === selected ? undefined : day)} aria-label={dayTitle(day)}>
              {parseDay(day).getDate()}
            </button>
          )
        })}
      </div>
      <div className="legend">
        <span><i style={{ background: kindColor.strength }} />Fuerza</span>
        <span><i style={{ background: kindColor.running }} />Running</span>
        <span><i style={{ background: kindColor.dance }} />Zumba</span>
        <span><i className="legend-planned" />Pendiente (color claro)</span>
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
          <button className="row row-button" onClick={() => addExtra('dance', selected)}>
            <Icon name="plus" className="row-icon" /> Añadir zumba extra
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
