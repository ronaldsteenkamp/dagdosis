import { useEffect } from 'react'
import { BottomNav } from './components/BottomNav'
import { inhoudFouten } from './inhoud'
import { leesRoute, useHash } from './router'
import { InhoudFout } from './screens/InhoudFout'
import { Instellingen } from './screens/Instellingen'
import { Mechanismekaart } from './screens/Mechanismekaart'
import { Overzicht } from './screens/Overzicht'
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

  if (inhoudFouten.length > 0) return <InhoudFout fouten={inhoudFouten} />

  const metBalk = route.naam === 'vandaag' || route.naam === 'voortgang' || route.naam === 'team'

  return (
    <AppStateProvider>
      {route.naam === 'vandaag' && <Vandaag />}
      {route.naam === 'voortgang' && <Voortgang />}
      {route.naam === 'team' && <Team />}
      {route.naam === 'instellingen' && <Instellingen />}
      {route.naam === 'overzicht' && <Overzicht />}
      {route.naam === 'kaart' && <Mechanismekaart key={route.id} id={route.id} />}
      {route.naam === 'sessie' && (
        <Sessie
          key={route.kaartId ?? (route.terugval ? 'terugval' : 'dagdosis')}
          kaartId={route.kaartId}
          terugval={route.terugval}
        />
      )}
      {metBalk && <BottomNav actief={route.naam} />}
    </AppStateProvider>
  )
}
