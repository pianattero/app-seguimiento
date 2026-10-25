import { useState } from 'react'
import { Card, Page } from '../components/ui'
import { periodStartsFromFlowDays } from '../lib/cycle'
import { dayTitle, toDayString } from '../lib/dates'
import { db } from '../lib/db'
import { parseDate } from '../lib/importer'
import { navigate } from '../lib/router'

/** Pantalla que abre el Atajo «Enviar ciclo»: días con regla separados por comas o saltos de línea. */
export function CycleImportPage({ params }: { params: URLSearchParams }) {
  const raw = [...params.getAll('dias'), ...params.getAll('inicio')].flatMap((v) => v.split(/[,;\n]+/))
  const days = raw.map((d) => parseDate(d.trim())).filter((d): d is Date => d !== undefined).map(toDayString)
  const starts = periodStartsFromFlowDays(days)
  const [saving, setSaving] = useState(false)

  return (
    <Page title="Importar ciclo">
      {starts.length === 0 ? (
        <Card title="No se han encontrado fechas" footer="Revisa el Atajo: las fechas deben ir como 2026-10-25, separadas por comas.">
          <div className="row prose">{raw.join(', ') || 'Sin datos'}</div>
        </Card>
      ) : (
        <>
          <Card title={`${starts.length} reglas encontradas`} footer={`A partir de ${days.length} días con regla.`}>
            {starts.map((s) => <div className="row" key={s}>{dayTitle(s)}</div>)}
          </Card>
          <div className="button-row">
            <button onClick={() => navigate('/ciclo')}>Cancelar</button>
            <button
              className="primary"
              disabled={saving}
              onClick={async () => {
                setSaving(true)
                await db.periods.bulkPut(starts.map((start) => ({ start })))
                navigate('/ciclo')
              }}
            >
              Guardar
            </button>
          </div>
        </>
      )}
    </Page>
  )
}
