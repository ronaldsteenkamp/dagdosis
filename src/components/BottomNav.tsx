import type { Route } from '../router'
import { Icon, type IconNaam } from './Icon'

/** Team blijft verborgen tot er een teammodus is. Het scherm en de route bestaan nog. */
const TEAM_ZICHTBAAR = false

const tabs: { naam: Route['naam']; label: string; pad: string; icoon: IconNaam }[] = [
  { naam: 'vandaag', label: 'Vandaag', pad: '#/', icoon: 'vandaag' },
  { naam: 'voortgang', label: 'Voortgang', pad: '#/voortgang', icoon: 'voortgang' },
  ...(TEAM_ZICHTBAAR ? [{ naam: 'team' as const, label: 'Team', pad: '#/team', icoon: 'team' as const }] : []),
]

export function BottomNav({ actief }: { actief: Route['naam'] }) {
  return (
    <nav className="onderbalk" aria-label="Hoofdnavigatie">
      {tabs.map((t) => (
        <a key={t.naam} href={t.pad} className="onderbalk-tab" aria-current={actief === t.naam ? 'page' : undefined}>
          <Icon naam={t.icoon} />
          <span>{t.label}</span>
        </a>
      ))}
    </nav>
  )
}
