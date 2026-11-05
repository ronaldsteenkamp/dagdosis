import { Icon } from '../components/Icon'
import { Titel } from '../components/Kop'
import { dagdosis, dummyVoortgang, weekScores } from '../data/dummy'
import { kaarten, themas, vragen } from '../inhoud'
import { useAppState } from '../state'

const dagen = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']

function begroeting(uur: number) {
  if (uur < 6) return 'Goedenacht'
  if (uur < 12) return 'Goedemorgen'
  if (uur < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

function Weekoverzicht({ scoreVandaag }: { scoreVandaag: number | null }) {
  const vandaagIndex = (new Date().getDay() + 6) % 7
  const totaal = dagdosis.vraagIds.length
  return (
    <section className="kaart" aria-labelledby="week-kop">
      <h2 id="week-kop" className="sectiekop">
        Deze week
      </h2>
      <ol className="week">
        {dagen.map((dag, i) => {
          const verleden = i < vandaagIndex
          const vandaag = i === vandaagIndex
          const score = vandaag ? scoreVandaag : verleden ? weekScores[i % weekScores.length] : null
          const gedaan = score !== null
          const beschrijving = gedaan
            ? `${dag}: ${score} van ${totaal} goed`
            : verleden
              ? `${dag}: niet gedaan`
              : vandaag
                ? `${dag}: nog te doen`
                : `${dag}: komt nog`
          return (
            <li key={dag} className={vandaag ? 'week-vandaag' : undefined}>
              <span aria-hidden="true">{dag.slice(0, 2)}</span>
              <span className={`week-dag${gedaan ? ' gedaan' : verleden ? ' gemist' : ''}`} aria-hidden="true">
                {gedaan ? `${score}/${totaal}` : ''}
              </span>
              <span className="sr-only">{beschrijving}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function Vandaag() {
  const { afgerond } = useAppState()
  const nu = new Date()
  const datum = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(nu)
  const streak = dummyVoortgang.streak + (afgerond ? 1 : 0)
  const kaartVanDeWeek = kaarten[0]
  const themaIds = new Set(
    dagdosis.vraagIds.flatMap((id) => vragen.find((v) => v.id === id)?.themaIds ?? []),
  )
  const themaChips = themas.filter((t) => themaIds.has(t.id)).map((t) => t.naam)

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

      <p className="pil pil-amber" style={{ alignSelf: 'flex-start' }}>
        <Icon naam="vlam" maat={18} />
        {streak} dagen op rij
      </p>

      <section className="kaart doskaart" aria-labelledby="dosis-kop">
        <h2 id="dosis-kop">Dagdosis van vandaag</h2>
        {afgerond ? (
          <>
            <p className="doskaart-feiten">
              <span>
                <Icon naam="check" maat={20} />
                Afgerond: {afgerond.goed} van {afgerond.totaal} goed
              </span>
            </p>
            <p>Morgen staat er een nieuwe dosis klaar.</p>
          </>
        ) : (
          <>
            <p className="doskaart-feiten">
              <span>{dagdosis.vraagIds.length} vragen</span>
              <span>
                <Icon naam="klok" maat={18} />± {dagdosis.minuten} minuten
              </span>
            </p>
            <ul className="pil-rij" aria-label="Thema's van vandaag">
              {themaChips.map((chip) => (
                <li key={chip} className="pil">
                  {chip}
                </li>
              ))}
              <li className="pil pil-amber">+ {dagdosis.herhalingen} herhaling</li>
            </ul>
            <a href="#/sessie" className="knop knop-wit">
              Start
              <Icon naam="pijlRechts" maat={20} />
            </a>
          </>
        )}
      </section>

      <a href={`#/kaart/${kaartVanDeWeek.id}`} className="kaart kaart-link">
        <span className="leeg-icoon" style={{ width: 44, height: 44 }}>
          <Icon naam="keten" />
        </span>
        <div>
          <p className="kaart-label">Groep van de week</p>
          <p className="kaart-titel">{kaartVanDeWeek.groep}</p>
        </div>
        <Icon naam="pijlRechts" maat={20} />
      </a>

      <Weekoverzicht scoreVandaag={afgerond?.goed ?? null} />
    </main>
  )
}
