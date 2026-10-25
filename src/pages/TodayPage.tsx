import { useLiveQuery } from 'dexie-react-hooks'
import { Card, Page, Row, SessionRow } from '../components/ui'
import { dayTitle, today } from '../lib/dates'
import { db } from '../lib/db'
import { dayTarget, trainingKcal } from '../lib/nutrition'

export function TodayPage() {
  const day = today()
  const profile = useLiveQuery(() => db.profile.get('main'))
  const sessions = useLiveQuery(() => db.sessions.where('day').equals(day).toArray(), [day])
  const setCounts = useLiveQuery(async () => {
    const counts: Record<number, number> = {}
    for (const s of sessions ?? []) counts[s.id!] = await db.sets.where('sessionId').equals(s.id!).count()
    return counts
  }, [sessions])

  const target = profile && sessions
    ? dayTarget(profile.person, trainingKcal(sessions), profile.deficitKcal, profile.proteinPerKg)
    : undefined

  return (
    <Page title={dayTitle(day)}>
      {profile && !profile.configured && (
        <Card>
          <a className="row row-link" href="#/ajustes">
            <span className="row-main">
              <strong>Completa tus datos</strong>
              <small className="muted">Peso, altura y edad, para calcular bien tus calorías ›</small>
            </span>
          </a>
        </Card>
      )}
      <Card title="Entreno de hoy">
        {sessions?.length === 0 && <div className="row muted">Descanso 😴</div>}
        {sessions?.map((s) => <SessionRow key={s.id} session={s} setCount={setCounts?.[s.id!]} />)}
      </Card>

      {target && profile && (
        <Card
          title="Objetivo de hoy"
          footer={`Según tu metabolismo basal, el entreno de hoy y un déficit de ${profile.deficitKcal} kcal. El plan de comidas llega en la fase 3.`}
        >
          <Row label="Calorías" value={`${target.kcal} kcal`} />
          <Row label="Proteína" value={`${target.proteinG} g`} />
          <Row label="Hidratos" value={`${target.carbsG} g`} />
          <Row label="Grasa" value={`${target.fatG} g`} />
        </Card>
      )}
    </Page>
  )
}
