import { Icon } from '../components/Icon'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card, MacroBar, Page, Ring, SessionRow } from '../components/ui'
import { phaseInfo } from '../lib/cycle'
import { parseDay, startOfWeek, today, weekdayIndex, weekdayNames } from '../lib/dates'
import { planForDay } from '../lib/dayPlan'
import { db } from '../lib/db'
import { formatNumber } from '../lib/format'
import { totals } from '../lib/meals'
import { mealSlots } from '../lib/recipes'
import { needsWeighIn } from '../lib/weight'
import { MealRow } from './MealsPage'

const dayMonth = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' })

export function TodayPage() {
  const day = today()
  const profile = useLiveQuery(() => db.profile.get('main'))
  const sessions = useLiveQuery(() => db.sessions.where('day').equals(day).toArray(), [day])
  const meals = useLiveQuery(() => db.meals.where('day').equals(day).toArray(), [day]) ?? []
  const periods = useLiveQuery(() => db.periods.toArray())
  const weights = useLiveQuery(() => db.weights.toArray())
  const setCounts = useLiveQuery(async () => {
    const counts: Record<number, number> = {}
    for (const s of sessions ?? []) counts[s.id!] = await db.sets.where('sessionId').equals(s.id!).count()
    return counts
  }, [sessions])

  const plan = profile && sessions && periods ? planForDay(day, profile, sessions, periods.map((p) => p.start)) : undefined
  const planned = totals(meals)

  return (
    <Page eyebrow={weekdayNames[weekdayIndex(day)]} title={dayMonth.format(parseDay(day))}>
      {profile && !profile.configured && (
        <Card>
          <a className="row row-link highlight-pink" href="#/ajustes">
            <Icon name="sliders" className="row-icon" />
            <span className="row-main">
              <strong>Completa tus datos</strong>
              <small>Peso, altura y edad, para calcular bien tus calorías ›</small>
            </span>
          </a>
        </Card>
      )}

      {weights && needsWeighIn(weights, day) && (
        <Card>
          <a className="row row-link highlight" href="#/peso">
            <Icon name="scale" className="row-icon" />
            <span className="row-main">
              <strong>{weekdayIndex(day) === 6 ? 'Hoy toca pesarse' : 'Te falta el pesaje del domingo'}</strong>
              <small>Apunta tu peso para ver tu progreso ›</small>
            </span>
          </a>
        </Card>
      )}

      {plan && profile && (
        <Card
          title="Objetivo de hoy"
          footer={`Según tu metabolismo basal, el entreno de hoy y un déficit de ${plan.deficit} kcal${plan.deficit !== profile.deficitKcal ? ' (más suave por la fase del ciclo)' : ''}.`}
        >
          <div className="today-hero">
            <Ring value={meals.length ? planned.kcal : 0} max={plan.target.kcal}>
              <strong>{meals.length ? formatNumber(planned.kcal) : plan.target.kcal}</strong>
              <small>{meals.length ? `de ${plan.target.kcal} kcal` : 'kcal objetivo'}</small>
            </Ring>
            <div className="macros">
              <MacroBar label="Proteína" value={meals.length ? planned.proteinG : undefined} max={plan.target.proteinG} color="var(--pink)" />
              <MacroBar label="Hidratos" value={meals.length ? planned.carbsG : undefined} max={plan.target.carbsG} color="var(--yellow)" />
              <MacroBar label="Grasa" value={meals.length ? planned.fatG : undefined} max={plan.target.fatG} color="var(--blue)" />
            </div>
          </div>
        </Card>
      )}

      <Card title="Entreno de hoy">
        {sessions?.length === 0 && <div className="row muted"><Icon name="rest" className="row-icon" /> Descanso</div>}
        {sessions?.map((s) => <SessionRow key={s.id} session={s} setCount={setCounts?.[s.id!]} />)}
      </Card>

      <Card
        title="Comidas de hoy"
        aside={meals.length > 0 ? `${formatNumber(planned.kcal)} kcal` : undefined}
      >
        {meals.length === 0 && (
          <a className="row row-link" href={`#/comidas?w=${startOfWeek(day)}`}>Aún no hay menú para hoy. Ir a Comidas ›</a>
        )}
        {meals.length > 0 && mealSlots.map((slot) => (
          <MealRow key={slot} day={day} slot={slot} meal={meals.find((m) => m.slot === slot)} />
        ))}
      </Card>

      <Card title="Ciclo">
        {plan?.cycle ? (
          <a className="row row-link" href="#/ciclo">
            <span className={`phase-dot ph-${plan.cycle.phase}`} aria-hidden />
            <span className="row-main">
              <strong>Fase {phaseInfo[plan.cycle.phase].label.toLowerCase()} · día {plan.cycle.dayOfCycle}</strong>
              <small className="muted">{phaseInfo[plan.cycle.phase].training}</small>
            </span>
          </a>
        ) : (
          <a className="row row-link" href="#/ciclo">Registra tu ciclo para ajustar comidas y entrenos ›</a>
        )}
      </Card>
    </Page>
  )
}
