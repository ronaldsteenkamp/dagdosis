import { Disclaimer } from '../components/Disclaimer'
import { Icon } from '../components/Icon'
import { Titel } from '../components/Kop'
import { kaarten, themas, vragen } from '../inhoud'
import { weeknummer, weekdagIndex } from '../logica/datum'
import { berekenStreak, isAfgerond, weekOverzicht } from '../logica/voortgang'
import { useAppState } from '../state'

const SECONDEN_PER_VRAAG = 36
const dagen = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']

function begroeting(uur: number) {
  if (uur < 6) return 'Goedenacht'
  if (uur < 12) return 'Goedemorgen'
  if (uur < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

function Weekoverzicht() {
  const { dosissen, vandaag } = useAppState()
  const vandaagIndex = weekdagIndex(vandaag)
  return (
    <section className="kaart" aria-labelledby="week-kop">
      <h2 id="week-kop" className="sectiekop">
        Deze week
      </h2>
      <ol className="week">
        {weekOverzicht(dosissen, vandaag).map(({ datum, goed, totaal }, i) => {
          const dag = dagen[i]
          const gedaan = goed !== null
          const verleden = i < vandaagIndex
          const beschrijving = gedaan
            ? `${dag}: ${goed} van ${totaal} goed`
            : verleden
              ? `${dag}: niet gedaan`
              : i === vandaagIndex
                ? `${dag}: nog te doen`
                : `${dag}: komt nog`
          return (
            <li key={datum} className={i === vandaagIndex ? 'week-vandaag' : undefined}>
              <span aria-hidden="true">{dag.slice(0, 2)}</span>
              <span className={`week-dag${gedaan ? ' gedaan' : verleden ? ' gemist' : ''}`} aria-hidden="true">
                {gedaan ? `${goed}/${totaal}` : ''}
              </span>
              <span className="sr-only">{beschrijving}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function Doskaart() {
  const { dosis } = useAppState()
  const totaal = dosis.vraagIds.length

  if (totaal === 0) {
    return (
      <>
        <p>Er zijn vandaag geen vragen, omdat alle thema's van deze insteek uit staan.</p>
        <a href="#/instellingen" className="knop knop-wit">
          Naar instellingen
        </a>
      </>
    )
  }

  if (isAfgerond(dosis)) {
    const goed = dosis.resultaten.filter((r) => r.goed).length
    return (
      <>
        <p className="doskaart-feiten">
          <span>
            <Icon naam="check" maat={20} />
            Afgerond: {goed} van {totaal} goed
          </span>
        </p>
        <p>Morgen staat er een nieuwe dosis klaar.</p>
        <a href="#/sessie" className="knop knop-wit">
          Bekijk samenvatting
        </a>
      </>
    )
  }

  const herhalingen = new Set(dosis.herhalingIds)
  const themaIds = new Set(
    dosis.vraagIds
      .filter((id) => !herhalingen.has(id))
      .flatMap((id) => vragen.find((v) => v.id === id)?.themaIds ?? []),
  )
  const minuten = Math.max(1, Math.round((totaal * SECONDEN_PER_VRAAG) / 60))
  const gedaan = dosis.resultaten.length

  return (
    <>
      <p className="doskaart-feiten">
        <span>{gedaan > 0 ? `${gedaan} van ${totaal} gedaan` : `${totaal} vragen`}</span>
        <span>
          <Icon naam="klok" maat={18} />± {minuten} {minuten === 1 ? 'minuut' : 'minuten'}
        </span>
      </p>
      <ul className="pil-rij" aria-label="Thema's van vandaag">
        {themas
          .filter((t) => themaIds.has(t.id))
          .map((t) => (
            <li key={t.id} className="pil">
              {t.naam}
            </li>
          ))}
        {herhalingen.size > 0 && <li className="pil pil-amber">+ {herhalingen.size} herhaling</li>}
      </ul>
      <a href="#/sessie" className="knop knop-wit">
        {gedaan > 0 ? 'Verder' : 'Start'}
        <Icon naam="pijlRechts" maat={20} />
      </a>
    </>
  )
}

function Welkom() {
  const { bevestigWelkom } = useAppState()
  return (
    <section className="kaart" aria-labelledby="welkom-kop">
      <h2 id="welkom-kop" className="sectiekop">
        Welkom
      </h2>
      <Disclaimer />
      <button type="button" className="knop knop-licht" onClick={bevestigWelkom}>
        Begrepen
      </button>
    </section>
  )
}

export function Vandaag() {
  const { dosissen, meta, vandaag } = useAppState()
  const nu = new Date()
  const datum = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(nu)
  const streak = berekenStreak(dosissen, vandaag)
  const kaartVanDeWeek = kaarten[weeknummer(vandaag) % kaarten.length]

  return (
    <main className="scherm scherm-met-balk">
      <header className="vandaag-kop">
        <div>
          <p className="gedempt">{datum}</p>
          <Titel className="titel-groot">{begroeting(nu.getHours())}</Titel>
        </div>
        <a href="#/instellingen" className="icoonknop" aria-label="Instellingen">
          <Icon naam="instellingen" />
        </a>
      </header>

      {!meta.welkomGezienOp && <Welkom />}

      <p className="pil pil-amber los">
        <Icon naam="vlam" maat={18} />
        {streak === 0 ? 'Begin vandaag je reeks' : `${streak} ${streak === 1 ? 'dag' : 'dagen'} op rij`}
      </p>

      <section className="kaart doskaart" aria-labelledby="dosis-kop">
        <h2 id="dosis-kop">Dagdosis van vandaag</h2>
        <Doskaart />
      </section>

      <a href={`#/kaart/${kaartVanDeWeek.id}`} className="kaart kaart-link">
        <span className="leeg-icoon leeg-icoon-klein">
          <Icon naam="keten" />
        </span>
        <div>
          <p className="kaart-label">Groep van de week</p>
          <p className="kaart-titel">{kaartVanDeWeek.groep}</p>
        </div>
        <Icon naam="pijlRechts" maat={20} />
      </a>

      <Weekoverzicht />
    </main>
  )
}
