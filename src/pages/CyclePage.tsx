import { Icon } from '../components/Icon'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Card, Page, Row, StatTile } from '../components/ui'
import { cycleFor, phaseInfo, type CyclePhase } from '../lib/cycle'
import { dayTitle, daysBetween, monthGrid, parseDay, today } from '../lib/dates'
import { db } from '../lib/db'
import type { Profile } from '../lib/types'

export function CyclePage({ month }: { month?: string }) {
  const profile = useLiveQuery(() => db.profile.get('main'))
  const periods = useLiveQuery(() => db.periods.orderBy('start').reverse().toArray()) ?? []
  const [newStart, setNewStart] = useState(today())
  const starts = periods.map((p) => p.start)
  const info = profile ? cycleFor(today(), profile, starts) : undefined

  return (
    <Page title="Ciclo">
      {profile && <CycleCalendar month={month ?? today().slice(0, 7)} profile={profile} starts={starts} />}

      {info ? (
        <>
          <section className="card-block">
            <div className="card-title"><h2>Hoy</h2></div>
            <div className="stat-grid">
              <StatTile label="Fase" value={phaseInfo[info.phase].label} hint={`Día ${info.dayOfCycle} de ${info.cycleLength}`} tone={phaseTone[info.phase]} />
              <StatTile label="Próxima regla" value={nextPeriodFormat.format(parseDay(info.nextPeriod))} hint={`en ${daysBetween(today(), info.nextPeriod)} días (aprox.)`} />
            </div>
          </section>
          <Card title={`Fase ${phaseInfo[info.phase].label.toLowerCase()}`}>
            <div className="row prose"><b>Comida.</b> {phaseInfo[info.phase].food}</div>
            <div className="row prose"><b>Entreno.</b> {phaseInfo[info.phase].training}</div>
          </Card>
        </>
      ) : (
        <Card>
          <div className="row prose">Toca en el calendario el primer día de tu última regla, o escríbelo abajo, para calcular las fases.</div>
        </Card>
      )}

      <Card title="Reglas registradas">
        <form
          className="row"
          onSubmit={async (e) => {
            e.preventDefault()
            if (newStart) await db.periods.put({ start: newStart })
          }}
        >
          <input className="text-input grow" type="date" value={newStart} max={today()} onChange={(e) => setNewStart(e.target.value)} aria-label="Primer día de la regla" />
          <button type="submit">Añadir</button>
        </form>
        {periods.map((p) => (
          <div className="row" key={p.start}>
            <span className="row-main">{dayTitle(p.start)}</span>
            <button className="icon-button danger" aria-label={`Borrar ${p.start}`} onClick={() => db.periods.delete(p.start)}><Icon name="close" /></button>
          </div>
        ))}
      </Card>

    </Page>
  )
}

const phaseTone: Record<CyclePhase, string> = { menstrual: 'var(--pink)', folicular: 'var(--green)', ovulatoria: 'var(--yellow)', lutea: 'var(--blue)' }
const nextPeriodFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })

const phaseClass: Record<CyclePhase, string> = { menstrual: 'ph-menstrual', folicular: 'ph-folicular', ovulatoria: 'ph-ovulatoria', lutea: 'ph-lutea' }

/** Calendario del mes con la fase de cada día. Tocar un día permite marcar o quitar el inicio de la regla. */
function CycleCalendar({ month, profile, starts }: { month: string; profile: Profile; starts: string[] }) {
  const [selected, setSelected] = useState<string>()
  const { days, prev: prevMonth, next: nextMonth, title } = monthGrid(month)
  const periodLength = profile.periodLengthDays ?? 5
  const isRecordedPeriod = (day: string) => starts.some((s) => { const d = daysBetween(s, day); return d >= 0 && d < periodLength })
  const sel = selected ? cycleFor(selected, profile, starts) : undefined

  return (
    <>
      <div className="month-nav">
        <a className="icon-button" href={`#/ciclo?m=${prevMonth}`} aria-label="Mes anterior"><Icon name="left" /></a>
        <h2>{title}</h2>
        <a className="icon-button" href={`#/ciclo?m=${nextMonth}`} aria-label="Mes siguiente"><Icon name="right" /></a>
      </div>
      <div className="month-grid" role="grid" aria-label={`Ciclo de ${title}`}>
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => <div key={d} className="month-head">{d}</div>)}
        {days.map((day) => {
          const info = cycleFor(day, profile, starts)
          const inMonth = day.slice(0, 7) === month
          const recorded = isRecordedPeriod(day)
          const predicted = !recorded && info?.phase === 'menstrual'
          const cls = [
            'month-day',
            inMonth ? '' : 'out',
            info ? phaseClass[info.phase] : '',
            recorded ? 'recorded' : '',
            predicted ? 'predicted' : '',
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
        <span><i className="ph-menstrual recorded" />Regla</span>
        <span><i className="ph-menstrual predicted" />Regla prevista</span>
        <span><i className="ph-folicular" />Folicular</span>
        <span><i className="ph-ovulatoria" />Ovulación</span>
        <span><i className="ph-lutea" />Lútea</span>
      </div>

      {selected && (
        <Card title={dayTitle(selected)}>
          {sel ? <Row label={`Fase ${phaseInfo[sel.phase].label.toLowerCase()}`} value={`día ${sel.dayOfCycle}`} /> : <div className="row muted">Sin datos del ciclo para este día.</div>}
          {starts.includes(selected) ? (
            <button className="row row-button danger" onClick={() => db.periods.delete(selected)}>Quitar inicio de regla</button>
          ) : (
            selected <= today() && <button className="row row-button" onClick={() => db.periods.put({ start: selected })}>Marcar como primer día de regla</button>
          )}
        </Card>
      )}
    </>
  )
}
