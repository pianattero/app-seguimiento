import { Component, type ReactNode } from 'react'

/** Si una pantalla falla, se muestra un aviso en vez de dejar la app en blanco. Al cambiar de pantalla se vuelve a intentar. */
export class ErrorBoundary extends Component<{ resetKey: string; children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {}

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidUpdate(previous: { resetKey: string }) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: undefined })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="page-body">
        <section className="card-block">
          <div className="card">
            <div className="row prose">
              Esta pantalla ha fallado. Tus datos guardados no se han perdido. Vuelve a Hoy o recarga la app.
            </div>
            <div className="row muted">
              <small>{this.state.error.message}</small>
            </div>
            <a className="row row-link" href="#/hoy">Volver a Hoy ›</a>
            <button className="row row-button" onClick={() => window.location.reload()}>Recargar</button>
          </div>
        </section>
      </div>
    )
  }
}
