import { Icon } from './Icon'
import { useEffect, useState, type ReactNode } from 'react'
import { parseQuantity } from '../lib/importer'
import { sessionTitle, statusLabel, type Session, type SessionStatus } from '../lib/types'
import { formatKm, formatPace } from '../lib/format'

export function Page({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <>
      <header className="page-header">
        <h1>{title}</h1>
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
        <Icon name={session.kind === 'strength' ? 'dumbbell' : 'run'} />
      </span>
      <span className="row-main">
        <strong>{sessionTitle(session)}</strong>
        {detail && <small className="muted">{detail}</small>}
      </span>
      <StatusBadge status={session.status} />
    </a>
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
