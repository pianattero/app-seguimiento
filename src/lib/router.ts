import { useEffect, useState } from 'react'

/** Rutas con hash ("#/semana?w=2026-10-26") para que funcione en cualquier alojamiento estático. */
export interface Route {
  path: string[]
  params: URLSearchParams
}

function readRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '')
  const [path, query = ''] = hash.split('?')
  return { path: path.split('/').filter(Boolean).map(decodeURIComponent), params: new URLSearchParams(query) }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(readRoute)
  useEffect(() => {
    const onChange = () => {
      setRoute(readRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function navigate(to: string) {
  window.location.hash = to
}
