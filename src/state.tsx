import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { themas, vragen } from './inhoud'
import { stelDosisSamen } from './logica/dagdosis'
import { datumVan } from './logica/datum'
import { verwerkAntwoord } from './logica/herhaling'
import { begrensDuur } from './logica/voortgang'
import { bewaarAntwoord, bewaarDosis, bewaarInstellingen, bewaarMelding, bewaarMeta, laadAlles } from './opslag'
import type { Antwoord, Dosis, Instellingen, Melding, Meta, Vraag, VraagVoortgang, Zekerheid } from './types'

const startInstellingen: Instellingen = {
  insteek: 'gemengd',
  ritme: false,
  uitlegMetMechanisme: true,
  bijsturen: true,
  themaFrequentie: Object.fromEntries(themas.map((t) => [t.id, 'normaal'])),
}

interface Gegevens {
  voortgang: Record<string, VraagVoortgang>
  antwoorden: Antwoord[]
  dosissen: Record<string, Dosis>
  meldingen: Melding[]
  instellingen: Instellingen
  meta: Meta
}

interface AppState extends Gegevens {
  vandaag: string
  dosis: Dosis
  zetInstellingen: (i: Instellingen) => void
  beantwoord: (invoer: {
    vraag: Vraag
    keuze: string
    zekerheid: Zekerheid
    duurMs: number
    inDosis: boolean
  }) => void
  voegMeldingToe: (vraag: Vraag, notitie: string) => void
  bevestigWelkom: () => void
}

const Context = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [gegevens, zetGegevens] = useState<Gegevens | null>(null)
  const [opslagFout, zetOpslagFout] = useState(false)
  const [vandaag, zetVandaag] = useState(() => datumVan())

  const meldFout = () => zetOpslagFout(true)

  useEffect(() => {
    laadAlles()
      .then((g) => zetGegevens({ ...g, instellingen: g.instellingen ?? startInstellingen }))
      .catch(meldFout)
    // Vraagt de browser de gegevens niet zomaar op te ruimen.
    navigator.storage?.persist?.()
  }, [])

  // Een app die 's nachts open blijft staan, moet de volgende dag een nieuwe dosis krijgen.
  useEffect(() => {
    const controleer = () => zetVandaag(datumVan())
    document.addEventListener('visibilitychange', controleer)
    return () => document.removeEventListener('visibilitychange', controleer)
  }, [])

  // De dosis wordt één keer per dag samengesteld en blijft daarna staan.
  useEffect(() => {
    if (!gegevens || gegevens.dosissen[vandaag]) return
    const dosis = stelDosisSamen({ datum: vandaag, vragen, ...gegevens })
    zetGegevens({ ...gegevens, dosissen: { ...gegevens.dosissen, [vandaag]: dosis } })
    bewaarDosis(dosis).catch(meldFout)
  }, [gegevens, vandaag])

  if (opslagFout) {
    return (
      <main className="scherm">
        <p className="tipvlak">
          Je voortgang kan niet worden opgeslagen op dit toestel. Controleer of de browser opslag toestaat
          en open de app opnieuw.
        </p>
      </main>
    )
  }

  const dosis = gegevens?.dosissen[vandaag]
  if (!gegevens || !dosis) return null

  const waarde: AppState = {
    ...gegevens,
    vandaag,
    dosis,

    zetInstellingen(instellingen) {
      const dosissen = { ...gegevens.dosissen }
      // Een lege dosis (alles uit) mag opnieuw, zodat de nieuwe instelling meteen telt.
      if (dosis.vraagIds.length === 0) delete dosissen[vandaag]
      zetGegevens({ ...gegevens, instellingen, dosissen })
      bewaarInstellingen(instellingen).catch(meldFout)
    },

    beantwoord({ vraag, keuze, zekerheid, duurMs, inDosis }) {
      const datum = datumVan()
      const goed = keuze === vraag.juist
      const punt = { datum, keuze, goed, zekerheid }
      const voortgang = verwerkAntwoord(vraag, gegevens.voortgang[vraag.id], punt)
      const antwoord: Antwoord = {
        ...punt,
        id: crypto.randomUUID(),
        tijdstip: new Date().toISOString(),
        vraagId: vraag.id,
        versie: vraag.versie,
        duurMs: begrensDuur(duurMs),
        themaIds: vraag.themaIds,
      }
      const nieuweDosis = inDosis
        ? { ...dosis, resultaten: [...dosis.resultaten, { vraagId: vraag.id, goed }] }
        : undefined
      zetGegevens({
        ...gegevens,
        voortgang: { ...gegevens.voortgang, [vraag.id]: voortgang },
        antwoorden: [...gegevens.antwoorden, antwoord],
        dosissen: nieuweDosis ? { ...gegevens.dosissen, [dosis.datum]: nieuweDosis } : gegevens.dosissen,
      })
      bewaarAntwoord(voortgang, antwoord, nieuweDosis).catch(meldFout)
    },

    voegMeldingToe(vraag, notitie) {
      const melding: Melding = {
        id: crypto.randomUUID(),
        datum: datumVan(),
        vraagId: vraag.id,
        versie: vraag.versie,
        notitie,
      }
      zetGegevens({ ...gegevens, meldingen: [...gegevens.meldingen, melding] })
      bewaarMelding(melding).catch(meldFout)
    },

    bevestigWelkom() {
      const meta = { ...gegevens.meta, welkomGezienOp: datumVan() }
      zetGegevens({ ...gegevens, meta })
      bewaarMeta(meta).catch(meldFout)
    },
  }

  return <Context.Provider value={waarde}>{children}</Context.Provider>
}

export function useAppState() {
  const waarde = useContext(Context)
  if (!waarde) throw new Error('useAppState buiten AppStateProvider')
  return waarde
}
