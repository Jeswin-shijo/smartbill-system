import { useEffect, useState } from 'react'

export type Route =
  | { name: 'dashboard' }
  | { name: 'invoices' }
  | { name: 'invoice-new' }
  | { name: 'invoice-edit'; id: number }
  | { name: 'invoice-detail'; id: number }
  | { name: 'customers' }
  | { name: 'customer-new' }
  | { name: 'customer-edit'; id: number }
  | { name: 'items' }
  | { name: 'item-new' }
  | { name: 'item-edit'; id: number }
  | { name: 'settings' }

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '')
  const segments = clean.split('/').filter(Boolean)

  if (segments.length === 0 || segments[0] === 'dashboard') return { name: 'dashboard' }

  if (segments[0] === 'invoices') {
    if (segments.length === 1) return { name: 'invoices' }
    if (segments[1] === 'new') return { name: 'invoice-new' }
    const id = Number(segments[1])
    if (!Number.isFinite(id) || id <= 0) return { name: 'invoices' }
    if (segments[2] === 'edit') return { name: 'invoice-edit', id }
    return { name: 'invoice-detail', id }
  }

  if (segments[0] === 'customers') {
    if (segments.length === 1) return { name: 'customers' }
    if (segments[1] === 'new') return { name: 'customer-new' }
    const id = Number(segments[1])
    if (!Number.isFinite(id) || id <= 0) return { name: 'customers' }
    if (segments[2] === 'edit') return { name: 'customer-edit', id }
    return { name: 'customer-edit', id }
  }

  if (segments[0] === 'items') {
    if (segments.length === 1) return { name: 'items' }
    if (segments[1] === 'new') return { name: 'item-new' }
    const id = Number(segments[1])
    if (!Number.isFinite(id) || id <= 0) return { name: 'items' }
    if (segments[2] === 'edit') return { name: 'item-edit', id }
    return { name: 'item-edit', id }
  }

  if (segments[0] === 'settings') return { name: 'settings' }

  return { name: 'dashboard' }
}

export function navigate(path: string) {
  const target = path.startsWith('#') ? path : `#${path.startsWith('/') ? path : `/${path}`}`
  if (window.location.hash === target) {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = target
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))
  useEffect(() => {
    const handler = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  return route
}

export function topNavGroup(route: Route): 'dashboard' | 'invoices' | 'customers' | 'items' | 'settings' {
  if (route.name === 'dashboard') return 'dashboard'
  if (route.name.startsWith('invoice')) return 'invoices'
  if (route.name.startsWith('customer')) return 'customers'
  if (route.name.startsWith('item')) return 'items'
  return 'settings'
}
