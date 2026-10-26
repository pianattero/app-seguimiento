import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Card, Page, Row } from '../components/ui'
import { dayTitle, parseDay, today } from '../lib/dates'
import { db } from '../lib/db'
import { formatKg, formatNumber } from '../lib/format'
import { parseQuantity } from '../lib/importer'
import type { WeightEntry } from '../lib/types'
import { deleteWeight, saveWeight, weighInDay, weightStats } from '../lib/weight'

const shortDate = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
const signedKg = (kg: number) => `${kg > 0 ? '+' : kg < 0 ? '−' : ''}${formatNumber(Math.abs(kg), 1)} kg`

export function WeightPage() {
  const entries = useLiveQuery(() => db.weights.orderBy('day').toArray()) ?? []
  const [day, setDay] = useState(weighInDay(today()))
  const [text, setText] = useState('')
  const stats = weightStats(entries)
  const existing = entries.find((e) => e.day === day)

  return (
    <Page title="Peso">
      <Card title="Pesaje del domingo" footer="Mejor en ayunas, después de ir al baño. Al guardar el último pesaje se recalculan tus calorías.">
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const kg = parseQuantity(text)?.value
            if (!day || day > today() || !kg || kg < 30 || kg > 300) return
            await saveWeight(day, kg)
            setText('')
          }}
        >
          <label className="row">
            <span>Día</span>
            <input className="text-input" type="date" value={day} max={today()} onChange={(e) => setDay(e.target.value)} aria-label="Día del pesaje" />
          </label>
          <label className="row">
            <span>Peso</span>
            <span className="row-value">
              <input
                className="num-input"
                type="text"
                inputMode="decimal"
                placeholder={existing ? formatNumber(existing.kg, 1) : '0,0'}
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="Peso en kg"
              />
              <span className="unit">kg</span>
            </span>
          </label>
          <button type="submit" className="row row-button">{existing ? 'Cambiar el pesaje de ese día' : 'Guardar pesaje'}</button>
        </form>
      </Card>

      {stats && (
        <Card title="Progreso">
          <Row label="Peso actual" value={formatKg(stats.last.kg)} />
          <Row label={`Desde el ${shortDate.format(parseDay(stats.first.day))}`} value={signedKg(stats.change)} />
          {stats.weeklyRate !== undefined && <Row label="Ritmo (últimas 4 semanas)" value={`${signedKg(stats.weeklyRate)} / semana`} />}
        </Card>
      )}

      {entries.length >= 2 ? (
        <Card title="Evolución">
          <WeightChart entries={entries} />
        </Card>
      ) : (
        <Card>
          <div className="row prose muted">Con dos pesajes ya verás aquí la gráfica de tu evolución.</div>
        </Card>
      )}

      {entries.length > 0 && (
        <Card title="Pesajes">
          {[...entries].reverse().map((e, i, list) => {
            const previous = list[i + 1]
            return (
              <div className="row" key={e.day}>
                <span className="row-main">
                  <span>{dayTitle(e.day)}</span>
                  {previous && <small className="muted">{signedKg(e.kg - previous.kg)} respecto al anterior</small>}
                </span>
                <span className="row-value">{formatKg(e.kg)}</span>
                <button className="icon-button danger" aria-label={`Borrar pesaje del ${e.day}`} onClick={() => deleteWeight(e.day)}>
                  <Icon name="close" />
                </button>
              </div>
            )
          })}
        </Card>
      )}
    </Page>
  )
}

const W = 340
const H = 180
const pad = { top: 16, right: 16, bottom: 26, left: 40 }

/** Línea del peso en el tiempo; tocar un punto muestra su valor. */
function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const [active, setActive] = useState<number>()
  const t0 = parseDay(entries[0].day).getTime()
  const t1 = parseDay(entries[entries.length - 1].day).getTime()
  const kgs = entries.map((e) => e.kg)
  const lo = Math.floor(Math.min(...kgs) - 0.5)
  const hi = Math.ceil(Math.max(...kgs) + 0.5)
  const x = (day: string) => pad.left + ((parseDay(day).getTime() - t0) / (t1 - t0 || 1)) * (W - pad.left - pad.right)
  const y = (kg: number) => pad.top + ((hi - kg) / (hi - lo)) * (H - pad.top - pad.bottom)
  const step = Math.max(1, Math.ceil((hi - lo) / 4))
  const ticks: number[] = []
  for (let v = lo; v <= hi; v += step) ticks.push(v)
  const points = entries.map((e) => ({ ...e, px: x(e.day), py: y(e.kg) }))
  const shown = points[active ?? points.length - 1]
  const half = (i: number) => (i === 0 ? pad.left : (points[i - 1].px + points[i].px) / 2)

  return (
    <div className="weight-chart">
      <p className="chart-readout" aria-live="polite">
        <strong>{formatKg(shown.kg)}</strong> <span className="muted">· {dayTitle(shown.day)}</span>
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Peso de ${formatKg(entries[0].kg)} a ${formatKg(shown.kg)}`} onMouseLeave={() => setActive(undefined)}>
        {ticks.map((v) => (
          <g key={v}>
            <line className="grid" x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} />
            <text className="axis" x={pad.left - 8} y={y(v) + 4} textAnchor="end">{v}</text>
          </g>
        ))}
        <text className="axis" x={pad.left} y={H - 6} textAnchor="start">{shortDate.format(parseDay(entries[0].day))}</text>
        <text className="axis" x={W - pad.right} y={H - 6} textAnchor="end">{shortDate.format(parseDay(entries[entries.length - 1].day))}</text>
        <polyline className="line" points={points.map((p) => `${p.px},${p.py}`).join(' ')} />
        {active !== undefined && <line className="crosshair" x1={shown.px} x2={shown.px} y1={pad.top} y2={H - pad.bottom} />}
        {points.map((p, i) => (
          <circle key={p.day} className={`dot${i === (active ?? points.length - 1) ? ' on' : ''}`} cx={p.px} cy={p.py} r={i === (active ?? points.length - 1) ? 5 : 4} />
        ))}
        {/* Zonas táctiles anchas, una por pesaje, mayores que el punto. */}
        {points.map((p, i) => (
          <rect
            key={p.day}
            className="hit"
            x={half(i)}
            y={0}
            width={(i === points.length - 1 ? W - pad.right : (p.px + points[i + 1].px) / 2) - half(i)}
            height={H}
            onMouseEnter={() => setActive(i)}
            onClick={() => setActive(i)}
          />
        ))}
      </svg>
    </div>
  )
}
