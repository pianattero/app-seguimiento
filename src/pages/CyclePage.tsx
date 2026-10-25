import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Card, NumberInput, Page, Row } from '../components/ui'
import { cycleFor, phaseInfo } from '../lib/cycle'
import { dayTitle, today } from '../lib/dates'
import { db } from '../lib/db'
import type { Profile } from '../lib/types'

export function CyclePage() {
  const profile = useLiveQuery(() => db.profile.get('main'))
  const periods = useLiveQuery(() => db.periods.orderBy('start').reverse().toArray()) ?? []
  const [newStart, setNewStart] = useState(today())
  const starts = periods.map((p) => p.start)
  const info = profile ? cycleFor(today(), profile, starts) : undefined

  return (
    <Page title="Ciclo">
      {info ? (
        <>
          <Card title="Hoy">
            <Row label="Fase" value={phaseInfo[info.phase].label} />
            <Row label="Día del ciclo" value={`${info.dayOfCycle} de ${info.cycleLength}`} />
            <Row label="Próxima regla (aprox.)" value={dayTitle(info.nextPeriod)} />
          </Card>
          <Card title={`Fase ${phaseInfo[info.phase].label.toLowerCase()}`}>
            <div className="row prose"><b>Comida.</b> {phaseInfo[info.phase].food}</div>
            <div className="row prose"><b>Entreno.</b> {phaseInfo[info.phase].training}</div>
          </Card>
        </>
      ) : (
        <Card>
          <div className="row prose">Apunta el primer día de tu última regla para calcular las fases, o envíalo desde Salud con el Atajo de abajo.</div>
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
            <button className="icon-button danger" aria-label={`Borrar ${p.start}`} onClick={() => db.periods.delete(p.start)}>×</button>
          </div>
        ))}
      </Card>

      {profile && <CycleSettings profile={profile} />}

      <Card title="Traer el ciclo desde Salud" footer="Si un paso no aparece igual en tu iPhone, dímelo y lo adaptamos.">
        <ol className="steps">
          <li>En <b>Atajos</b>, crea uno nuevo llamado «Enviar ciclo».</li>
          <li>Añade <b>Buscar muestras de salud</b>: tipo <b>Menstruación</b>, fecha de inicio <b>en los últimos 6 meses</b>.</li>
          <li>Añade <b>Repetir con cada elemento</b> y dentro <b>Formatear fecha</b> (la Fecha de inicio) con formato personalizado <code>yyyy-MM-dd</code>.</li>
          <li>Después del bloque, añade <b>Combinar texto</b> con el resultado, separado por comas.</li>
          <li>
            Añade <b>Texto</b> con esta dirección, cambiando FECHAS por el texto combinado, y luego <b>Abrir URL</b>:
            <code className="code">{`${window.location.origin}${window.location.pathname}#/ciclo/importar?dias=FECHAS`}</code>
          </li>
        </ol>
      </Card>
    </Page>
  )
}

function CycleSettings({ profile }: { profile: Profile }) {
  const save = (changes: Partial<Profile>) => db.profile.update('main', changes)
  return (
    <Card title="Ajustes del ciclo" footer="En la fase lútea el déficit baja 150 kcal. Es una sugerencia: la evidencia es limitada y cada cuerpo es distinto.">
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
