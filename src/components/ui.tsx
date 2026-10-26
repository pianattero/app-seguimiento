import { Icon, type IconName } from './Icon'
import { useEffect, useState, type ReactNode } from 'react'
import { parseQuantity } from '../lib/importer'
import { sessionTitle, statusLabel, type Session, type SessionKind, type SessionStatus } from '../lib/types'
import { formatKm, formatPace } from '../lib/format'

export function Page({ title, eyebrow, actions, children }: { title: string; eyebrow?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <>
      <header className="page-header">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
        </div>
        {actions && <div className="header-actions">{actions}</div>}
      </header>
      <div className="page-body">{children}</div>
    </>
  )
}

export function Card({ title, aside, footer, children }: { title?: ReactNode; aside?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <section className="card-block">
      {(title || aside) && (
        <div className="card-title">
          <h2>{title}</h2>
          {aside && <span className="muted">{aside}</span>}
        </div>
      )}
      <div className="card">{children}</div>
      {footer && <p className="card-footer">{footer}</p>}
    </section>
  )
}

export function Row({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="row">
      <span>{label}</span>
      <span className="row-value">{value}</span>
    </div>
  )
}

export function StatusBadge({ status }: { status: SessionStatus }) {
  return <span className={`badge badge-${status}`}>{statusLabel[status]}</span>
}

const kindIcon: Record<SessionKind, IconName> = { strength: 'dumbbell', running: 'run', dance: 'music' }

export function SessionRow({ session, setCount }: { session: Session; setCount?: number }) {
  let detail: string | undefined
  if (session.kind === 'running' && session.distanceKm) {
    detail = formatKm(session.distanceKm)
    if (session.durationMin) detail += ` · ${formatPace(session.durationMin, session.distanceKm)}`
  } else if (session.kind === 'strength' && setCount) {
    detail = `${setCount} series`
  }
  return (
    <a className="row row-link" href={`#/sesion/${session.id}`}>
      <span className={`kind-icon kind-${session.kind}`} aria-hidden>
        <Icon name={kindIcon[session.kind]} />
      </span>
      <span className="row-main">
        <strong>{sessionTitle(session)}</strong>
        {detail && <small className="muted">{detail}</small>}
      </span>
      <StatusBadge status={session.status} />
    </a>
  )
}

/** Anillo de progreso: cuánto del objetivo de kcal llevas planificado. */
export function Ring({ value, max, children }: { value: number; max: number; children: ReactNode }) {
  const r = 52
  const length = 2 * Math.PI * r
  const ratio = max > 0 ? Math.min(value / max, 1) : 0
  return (
    <div className="ring">
      <svg viewBox="0 0 120 120" aria-hidden>
        <circle className="ring-track" cx="60" cy="60" r={r} />
        {ratio > 0 && <circle className={`ring-fill${value > max * 1.05 ? ' over' : ''}`} cx="60" cy="60" r={r} strokeDasharray={`${ratio * length} ${length}`} />}
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  )
}

/** Barra de un macronutriente con su color pastel. */
export function MacroBar({ label, value, max, color }: { label: string; value?: number; max: number; color: string }) {
  const ratio = value !== undefined && max > 0 ? Math.min(value / max, 1) : 0
  return (
    <div className="macro">
      <div className="macro-head">
        <span>{label}</span>
        <span className="muted">{value !== undefined ? `${Math.round(value)} / ${max} g` : `${max} g`}</span>
      </div>
      <div className="macro-track"><div className="macro-fill" style={{ width: `${ratio * 100}%`, background: color }} /></div>
    </div>
  )
}

/** Dato destacado en una cuadrícula de tarjetas pequeñas. */
export function StatTile({ label, value, hint, tone, wide }: { label: string; value: ReactNode; hint?: ReactNode; tone?: string; wide?: boolean }) {
  return (
    <div className={`stat-tile${wide ? ' wide' : ''}`} style={tone ? { background: tone, color: 'var(--ink)', borderColor: 'transparent' } : undefined}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  )
}

/** Campo numérico que acepta coma decimal (teclado español del iPhone) y guarda al salir. */
export function NumberInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  decimals = true,
  className,
}: {
  value: number | undefined
  onChange: (value: number | undefined) => void
  placeholder?: string
  ariaLabel: string
  decimals?: boolean
  className?: string
}) {
  const show = (v: number | undefined) => (v === undefined ? '' : String(v).replace('.', ','))
  const [text, setText] = useState(show(value))
  useEffect(() => setText(show(value)), [value])
  return (
    <input
      className={className ?? 'num-input'}
      type="text"
      inputMode={decimals ? 'decimal' : 'numeric'}
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => {
        const parsed = parseQuantity(text)?.value
        if (parsed !== value) onChange(parsed)
        setText(show(parsed))
      }}
    />
  )
}
