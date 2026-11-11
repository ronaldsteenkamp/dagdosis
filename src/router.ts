import { useSyncExternalStore } from 'react'

// Hash-routes werken op elke statische host, zonder rewrite-regels.
export type Route =
  | { naam: 'vandaag' }
  | { naam: 'voortgang' }
  | { naam: 'team' }
  | { naam: 'instellingen' }
  | { naam: 'overzicht' }
  | { naam: 'kaart'; id: string }
  | { naam: 'sessie'; kaartId?: string; terugval?: boolean }

export function leesRoute(hash: string): Route {
  const [eerste, tweede, derde] = hash.replace(/^#\/?/, '').split('/')
  switch (eerste) {
    case 'voortgang':
    case 'team':
    case 'instellingen':
    case 'overzicht':
      return { naam: eerste }
    case 'kaart':
      return tweede ? { naam: 'kaart', id: tweede } : { naam: 'vandaag' }
    case 'sessie':
      if (tweede === 'kaart' && derde) return { naam: 'sessie', kaartId: derde }
      if (tweede === 'terugval') return { naam: 'sessie', terugval: true }
      return { naam: 'sessie' }
    default:
      return { naam: 'vandaag' }
  }
}

function abonneer(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useHash() {
  return useSyncExternalStore(abonneer, () => window.location.hash)
}

export function ga(pad: string) {
  window.location.hash = pad
}
