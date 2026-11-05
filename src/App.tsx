import { useEffect } from 'react'
import { BottomNav } from './components/BottomNav'
import { leesRoute, useHash } from './router'
import { Instellingen } from './screens/Instellingen'
import { Mechanismekaart } from './screens/Mechanismekaart'
import { Sessie } from './screens/Sessie'
import { Team } from './screens/Team'
import { Vandaag } from './screens/Vandaag'
import { Voortgang } from './screens/Voortgang'
import { AppStateProvider } from './state'

export function App() {
  const hash = useHash()
  const route = leesRoute(hash)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [hash])

  const metBalk = route.naam === 'vandaag' || route.naam === 'voortgang' || route.naam === 'team'

  return (
    <AppStateProvider>
      {route.naam === 'vandaag' && <Vandaag />}
      {route.naam === 'voortgang' && <Voortgang />}
      {route.naam === 'team' && <Team />}
      {route.naam === 'instellingen' && <Instellingen />}
      {route.naam === 'kaart' && <Mechanismekaart key={route.id} id={route.id} />}
      {route.naam === 'sessie' && <Sessie key={route.kaartId ?? 'dagdosis'} kaartId={route.kaartId} />}
      {metBalk && <BottomNav actief={route.naam} />}
    </AppStateProvider>
  )
}
