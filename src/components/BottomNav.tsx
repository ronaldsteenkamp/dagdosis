import type { Route } from '../router'
import { Icon, type IconNaam } from './Icon'

const tabs: { naam: Route['naam']; label: string; pad: string; icoon: IconNaam }[] = [
  { naam: 'vandaag', label: 'Vandaag', pad: '#/', icoon: 'vandaag' },
  { naam: 'voortgang', label: 'Voortgang', pad: '#/voortgang', icoon: 'voortgang' },
  { naam: 'team', label: 'Team', pad: '#/team', icoon: 'team' },
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
