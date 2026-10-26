import { useState } from 'react'
import { Card, Page, Row } from '../components/ui'
import { dayTitle } from '../lib/dates'
import { formatDuration, formatKm, formatPace } from '../lib/format'
import { parseWorkoutParams } from '../lib/importer'
import { mergeWorkout } from '../lib/planner'
import { navigate } from '../lib/router'
import { kindLabel } from '../lib/types'

/** Pantalla que abre el Atajo: muestra lo recibido y lo guarda al confirmar. */
export function ImportPage({ params }: { params: URLSearchParams }) {
  const result = parseWorkoutParams(params)
  const [saving, setSaving] = useState(false)

  if (!result.ok) {
    return (
      <Page title="Importar entreno">
        <Card title="No se ha podido leer el entreno" footer="Revisa el Atajo: los datos recibidos están arriba.">
          <div className="row">{result.error}</div>
          {[...params.entries()].map(([k, v]) => <Row key={k} label={k} value={v} />)}
        </Card>
      </Page>
    )
  }

  const w = result.workout
  return (
    <Page title="Importar entreno">
      <Card title={`${kindLabel[w.kind]} · ${dayTitle(w.day)}`}>
        {w.distanceKm !== undefined && <Row label="Distancia" value={formatKm(w.distanceKm)} />}
        {w.durationMin !== undefined && <Row label="Tiempo" value={formatDuration(w.durationMin)} />}
        {w.distanceKm && w.durationMin ? <Row label="Ritmo medio" value={formatPace(w.durationMin, w.distanceKm)} /> : null}
        {w.avgHeartRate !== undefined && <Row label="Pulso medio" value={`${w.avgHeartRate} ppm`} />}
        {w.maxHeartRate !== undefined && <Row label="Pulso máximo" value={`${w.maxHeartRate} ppm`} />}
        {w.activeKcal !== undefined && <Row label="Calorías activas" value={`${w.activeKcal} kcal`} />}
      </Card>
      <div className="button-row">
        <button onClick={() => navigate('/hoy')}>Cancelar</button>
        <button
          className="primary"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            try {
              const id = await mergeWorkout(w)
              navigate(`/sesion/${id}`)
            } finally {
              // Si falla, el aviso de arriba lo explica y se puede volver a intentar.
              setSaving(false)
            }
          }}
        >
          Guardar
        </button>
      </div>
    </Page>
  )
}
