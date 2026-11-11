import { useEffect, useState } from 'react'
import {
  inAppBrowser,
  isGeinstalleerd,
  kanInstallatieVragen,
  platformVan,
  vraagInstallatie,
  volgInstallatie,
  type Platform,
} from '../logica/installatie'
import { useAppState } from '../state'
import { BackupKnop } from './Backup'
import { Icon } from './Icon'

function useInstallatie() {
  const [platform] = useState<Platform>(() => platformVan(navigator.userAgent, navigator.maxTouchPoints ?? 0))
  const [inApp] = useState(() => inAppBrowser(navigator.userAgent))
  const [geinstalleerd, zetGeinstalleerd] = useState(isGeinstalleerd)
  const [kanVragen, zetKanVragen] = useState(kanInstallatieVragen)
  useEffect(
    () =>
      volgInstallatie(() => {
        zetKanVragen(kanInstallatieVragen())
        zetGeinstalleerd(isGeinstalleerd())
      }),
    [],
  )
  return { platform, inApp, geinstalleerd, kanVragen }
}

/** Het deelicoon van Safari: een vierkant met een pijl omhoog. */
function DeelIcoon() {
  return (
    <svg className="icon icoon-inline" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 3v12M8 7l4-4 4 4M7 11H5.5A1.5 1.5 0 0 0 4 12.5v7A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H17" />
    </svg>
  )
}

function StappenIos() {
  return (
    <ol className="stappen">
      <li>
        Tik in Safari op de deelknop <DeelIcoon /> <span className="sr-only">(een vierkant met een pijl omhoog)</span>.
        Zie je die niet, tik dan eerst op ••• of op de adresbalk.
      </li>
      <li>
        Kies <strong>Zet op beginscherm</strong>. Staat het er niet tussen, scrol dan omlaag in het menu.
      </li>
      <li>
        Tik op <strong>Voeg toe</strong>. Open Dagdosis voortaan via het icoon op je beginscherm.
      </li>
    </ol>
  )
}

function StappenAndroid() {
  return (
    <ol className="stappen">
      <li>
        Tik in Chrome rechtsboven op het menu <strong>⋮</strong>.
      </li>
      <li>
        Kies <strong>App installeren</strong> of <strong>Toevoegen aan startscherm</strong>.
      </li>
      <li>Bevestig. Dagdosis staat daarna tussen je apps.</li>
    </ol>
  )
}

function Uitleg({ platform, inApp, kanVragen }: { platform: Platform; inApp: boolean; kanVragen: boolean }) {
  const { antwoorden } = useAppState()
  if (inApp) {
    return (
      <p>
        Je opent Dagdosis nu in een andere app. Open de link in {platform === 'ios' ? 'Safari' : 'Chrome'}, dan kun
        je hem op je beginscherm zetten.
      </p>
    )
  }
  return (
    <>
      {kanVragen && (
        <button type="button" className="knop knop-primair" onClick={() => void vraagInstallatie()}>
          <Icon naam="download" maat={20} />
          Installeer Dagdosis
        </button>
      )}
      {!kanVragen && platform === 'ios' && <StappenIos />}
      {!kanVragen && platform === 'android' && <StappenAndroid />}
      {!kanVragen && platform === 'computer' && (
        <p className="klein">
          Op een computer installeer je Dagdosis in Chrome of Edge via het installatie-icoon rechts in de adresbalk.
          Op je telefoon zet je hem op je beginscherm.
        </p>
      )}
      {/* Op de iPhone heeft de app op het beginscherm eigen opslag, los van Safari. */}
      {platform === 'ios' && antwoorden.length > 0 && (
        <div className="letop letop-klein">
          <p className="klein">
            <strong>Neem je voortgang mee.</strong> Op de iPhone begint de app op je beginscherm leeg: je antwoorden
            in Safari gaan niet vanzelf mee. Maak hier eerst een back-up. Open daarna de app op je beginscherm en kies
            Instellingen → Back-up terugzetten.
          </p>
          <BackupKnop />
        </div>
      )}
    </>
  )
}

function voordeel(platform: Platform) {
  const basis = 'Dan open je hem met één tik, als losse app en ook zonder internet.'
  // Safari kan gegevens van een site die je een tijd niet opent opruimen; een app op het beginscherm niet.
  return platform === 'ios' ? `${basis} Je voortgang blijft zo ook beter bewaard.` : basis
}

/** Kaart op Vandaag, alleen op een telefoon die de app nog niet op het beginscherm heeft. */
export function InstallatieKaart() {
  const { meta, verbergInstallatieUitleg } = useAppState()
  const { platform, inApp, geinstalleerd, kanVragen } = useInstallatie()
  const telefoon = platform === 'ios' || platform === 'android'
  if (geinstalleerd || !telefoon || meta.installatieUitlegWegOp || !meta.welkomGezienOp) return null

  return (
    <section className="kaart" aria-labelledby="installeren-kop">
      <h2 id="installeren-kop" className="sectiekop">
        Zet Dagdosis op je beginscherm
      </h2>
      <p className="gedempt klein">{voordeel(platform)}</p>
      <Uitleg platform={platform} inApp={inApp} kanVragen={kanVragen} />
      <button type="button" className="tekstknop los" onClick={verbergInstallatieUitleg}>
        Niet nu; deze uitleg staat ook onder Instellingen
      </button>
    </section>
  )
}

/** Vast blok in Instellingen, op elk toestel. */
export function InstallatieSectie() {
  const { platform, inApp, geinstalleerd, kanVragen } = useInstallatie()
  return (
    <section className="kaart" aria-labelledby="app-kop">
      <h2 id="app-kop" className="sectiekop">
        Op je beginscherm
      </h2>
      {geinstalleerd ? (
        <p className="klein">
          <Icon naam="check" maat={18} /> Je gebruikt Dagdosis als app vanaf je beginscherm.
        </p>
      ) : (
        <>
          <p className="gedempt klein">{voordeel(platform)}</p>
          <Uitleg platform={platform} inApp={inApp} kanVragen={kanVragen} />
        </>
      )}
    </section>
  )
}
