import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { Card, Page, Row, SessionRow } from '../components/ui'
import { addDays, dayTitle, daysOfWeek, startOfWeek, today, weekTitle } from '../lib/dates'
import { db } from '../lib/db'
import { formatKm } from '../lib/format'
import { ensureWeek, sessionsInWeek } from '../lib/planner'
import { navigate } from '../lib/router'
import type { SessionKind } from '../lib/types'

export function WeekPage({ weekStart }: { weekStart: string }) {
  useEffect(() => {
    ensureWeek(weekStart)
  }, [weekStart])

  const sessions = useLiveQuery(() => sessionsInWeek(weekStart), [weekStart]) ?? []
  const sets = useLiveQuery(
    () => db.sets.where('sessionId').anyOf(sessions.map((s) => s.id!)).toArray(),
    [sessions],
  ) ?? []
  const done = sessions.filter((s) => s.status === 'done')
  const fixed = sessions.filter((s) => !s.isExtra)

  async function addExtra(kind: SessionKind) {
    const id = await db.sessions.add({ day: today(), kind, status: 'planned', isExtra: true })
    navigate(`/sesion/${id}`)
  }

  return (
    <Page
      title={weekTitle(weekStart)}
      actions={
        <>
          <a className="icon-button" href={`#/semana?w=${addDays(weekStart, -7)}`} aria-label="Semana anterior">‹</a>
          <a className="icon-button" href={`#/semana?w=${addDays(weekStart, 7)}`} aria-label="Semana siguiente">›</a>
        </>
      }
    >
      <Card>
        <Row label="Entrenos fijos hechos" value={`${fixed.filter((s) => s.status === 'done').length} de ${fixed.length}`} />
        {done.some((s) => s.isExtra) && <Row label="Extras" value={done.filter((s) => s.isExtra).length} />}
        <Row label="Kilómetros" value={formatKm(done.reduce((t, s) => t + (s.distanceKm ?? 0), 0))} />
        <Row label="Series de fuerza" value={sets.length} />
      </Card>

      {daysOfWeek(weekStart).map((day) => {
        const daySessions = sessions.filter((s) => s.day === day)
        return (
          <Card key={day} title={dayTitle(day)} aside={day === today() ? 'Hoy' : undefined}>
            {daySessions.length === 0 && <div className="row muted">Descanso</div>}
            {daySessions.map((s) => (
              <SessionRow key={s.id} session={s} setCount={sets.filter((x) => x.sessionId === s.id).length} />
            ))}
          </Card>
        )
      })}

      {weekStart === startOfWeek(today()) && (
        <div className="button-row">
          <button onClick={() => addExtra('running')}>+ Running extra hoy</button>
          <button onClick={() => addExtra('strength')}>+ Fuerza extra hoy</button>
        </div>
      )}
    </Page>
  )
}
