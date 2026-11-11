import { BackupKaart } from '../components/Backup'
import { Disclaimer } from '../components/Disclaimer'
import { Icon } from '../components/Icon'
import { InstallatieSectie } from '../components/Installeren'
import { Schakelaar, Segment } from '../components/Keuzes'
import { Terugkop } from '../components/Kop'
import { themas } from '../inhoud'
import { useAppState } from '../state'
import type { InsteekKeuze, ThemaFrequentie } from '../types'

const insteekUitleg: Record<InsteekKeuze, string> = {
  farmacologie: 'Nieuwe vragen gaan alleen over farmacologie: werkingsmechanismen, targets en kinetiek.',
  gemengd: 'Per dagdosis 2 vragen farmacologie en 3 vragen uit de praktijk.',
  praktijk: 'Nieuwe vragen gaan alleen over de praktijk: interacties, nierfunctie, zwangerschap en zelfzorg.',
}

const frequenties: { waarde: ThemaFrequentie; label: string }[] = [
  { waarde: 'vaak', label: 'Vaak' },
  { waarde: 'normaal', label: 'Normaal' },
  { waarde: 'af-en-toe', label: 'Af en toe' },
  { waarde: 'uit', label: 'Uit' },
]

export function Instellingen() {
  const { instellingen: i, zetInstellingen } = useAppState()

  return (
    <main className="scherm">
      <Terugkop titel="Instellingen" />
      <p className="gedempt klein">
        De dagdosis van vandaag staat vast. Keuzes voor de samenstelling gelden vanaf morgen.
      </p>

      <section className="kaart" aria-labelledby="insteek-kop">
        <h2 id="insteek-kop" className="sectiekop">
          Insteek
        </h2>
        <Segment<InsteekKeuze>
          label="Insteek"
          waarde={i.insteek}
          disabled={i.ritme}
          onChange={(insteek) => zetInstellingen({ ...i, insteek })}
          opties={[
            { waarde: 'farmacologie', label: 'Farmacologie' },
            { waarde: 'gemengd', label: 'Gemengd' },
            { waarde: 'praktijk', label: 'Praktijk' },
          ]}
        />
        <p className="gedempt klein">
          {i.ritme ? 'De vaste ritme-dagen bepalen nu de insteek.' : insteekUitleg[i.insteek]}
        </p>
      </section>

      <section className="kaart" aria-label="Opties">
        <Schakelaar
          label="Vaste ritme-dagen"
          uitleg="Ma en do farmacologie, de andere dagen praktijk."
          aan={i.ritme}
          onChange={(ritme) => zetInstellingen({ ...i, ritme })}
        />
        <hr className="scheiding" />
        <Schakelaar
          label="Uitleg altijd met mechanisme"
          uitleg="Toont bij praktijkvragen ook het mechanisme erachter."
          aan={i.uitlegMetMechanisme}
          onChange={(uitlegMetMechanisme) => zetInstellingen({ ...i, uitlegMetMechanisme })}
        />
        <hr className="scheiding" />
        <Schakelaar
          label="Bijsturen bij zwakke thema's"
          uitleg="Een thema onder 60% over de laatste 20 antwoorden telt dubbel."
          aan={i.bijsturen}
          onChange={(bijsturen) => zetInstellingen({ ...i, bijsturen })}
        />
      </section>

      <section className="kaart" aria-labelledby="themas-kop">
        <h2 id="themas-kop" className="sectiekop">
          Thema's
        </h2>
        {themas.map((t) => (
          <div key={t.id} className="themakeuze">
            <span className="themakeuze-naam">{t.naam}</span>
            <Segment<ThemaFrequentie>
              klein
              label={t.naam}
              waarde={i.themaFrequentie[t.id] ?? 'normaal'}
              opties={frequenties}
              onChange={(f) =>
                zetInstellingen({ ...i, themaFrequentie: { ...i.themaFrequentie, [t.id]: f } })
              }
            />
          </div>
        ))}
      </section>

      <p className="vaste-regel">
        <Icon naam="herhaal" maat={20} />
        Vragen die je eerder fout had, komen altijd eerst terug.
      </p>

      <InstallatieSectie />

      <BackupKaart />

      <section className="kaart" aria-labelledby="over-kop">
        <h2 id="over-kop" className="sectiekop">
          Over Dagdosis
        </h2>
        <Disclaimer />
      </section>
    </main>
  )
}
