import { useEffect, useRef, useState } from 'react'
import { Bronregel } from '../components/Bronregel'
import { Icon } from '../components/Icon'
import { Segment } from '../components/Keuzes'
import { Titel } from '../components/Kop'
import { dagdosis, kaarten, vragen } from '../data/dummy'
import { ga } from '../router'
import { useAppState } from '../state'
import type { Vraag, VraagType, Zekerheid } from '../types'

const typeLabel: Record<VraagType, string> = {
  casus: 'Casus',
  'mechanisme-bijwerking': 'Mechanisme → bijwerking',
  'mechanisme-middel': 'Mechanisme → middel',
  vergelijk: 'Vergelijk',
  kinetiek: 'Kinetiek',
}

const ONZEKER = 'onzeker'

interface Resultaat {
  vraag: Vraag
  goed: boolean
}

// Tijdelijke tekst; fase 3 berekent dit met de echte herhalingslogica.
function gevolgTekst(goed: boolean, zekerheid: Zekerheid) {
  if (!goed || zekerheid === 'gok') return 'Deze vraag komt morgen terug.'
  if (zekerheid === 'twijfel') return 'Deze vraag komt over 3 dagen terug.'
  return 'Deze vraag komt over 7 dagen terug.'
}

function Sessiekop({ positie, totaal }: { positie: number; totaal: number }) {
  return (
    <header className="sessiekop">
      <a href="#/" className="icoonknop" aria-label="Sluiten">
        <Icon naam="sluit" />
      </a>
      <div
        className="balk-segmenten"
        role="progressbar"
        aria-label="Voortgang"
        aria-valuemin={0}
        aria-valuemax={totaal}
        aria-valuenow={positie}
      >
        {Array.from({ length: totaal }, (_, i) => (
          <span key={i} className={i < positie ? 'vol' : undefined} />
        ))}
      </div>
      <span className="sessiekop-teller">
        {positie}/{totaal}
      </span>
    </header>
  )
}

function MeldFout({ vraag }: { vraag: Vraag }) {
  const { voegMeldingToe } = useAppState()
  const dialoog = useRef<HTMLDialogElement>(null)
  const [notitie, zetNotitie] = useState('')
  const [opgeslagen, zetOpgeslagen] = useState(false)

  return (
    <>
      <button type="button" className="tekstknop" onClick={() => dialoog.current?.showModal()}>
        <Icon naam="vlag" maat={16} />
        {opgeslagen ? 'Gemeld' : 'Meld fout'}
      </button>
      <dialog ref={dialoog} className="dialoog" aria-labelledby={`meld-${vraag.id}`}>
        <form
          method="dialog"
          onSubmit={() => {
            voegMeldingToe({ vraagId: vraag.id, notitie })
            zetOpgeslagen(true)
          }}
        >
          <h2 id={`meld-${vraag.id}`} className="sectiekop">
            Fout melden
          </h2>
          <label className="klein gedempt" htmlFor={`notitie-${vraag.id}`}>
            Wat klopt er niet? De notitie blijft op dit toestel.
          </label>
          <textarea
            id={`notitie-${vraag.id}`}
            value={notitie}
            required
            onChange={(e) => zetNotitie(e.target.value)}
          />
          <div className="knoprij">
            <button type="button" className="knop knop-licht" onClick={() => dialoog.current?.close()}>
              Annuleren
            </button>
            <button type="submit" className="knop knop-primair">
              Opslaan
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}

function Vraagscherm({
  vraag,
  positie,
  totaal,
  onControleer,
}: {
  vraag: Vraag
  positie: number
  totaal: number
  onControleer: (keuze: string) => void
}) {
  const [keuze, zetKeuze] = useState<string | null>(null)
  return (
    <main className="scherm scherm-sessie">
      <Sessiekop positie={positie} totaal={totaal} />
      <div className="vraagmeta">
        <span className="pil pil-blauw">{typeLabel[vraag.type]}</span>
        {vraag.status === 'concept' && <span className="pil pil-amber">concept</span>}
        {vraag.status === 'concept' && <MeldFout vraag={vraag} />}
      </div>
      {vraag.casus && <p className="casus">{vraag.casus}</p>}
      <Titel className="vraagtekst">{vraag.vraag}</Titel>
      <fieldset className="opties">
        <legend className="sr-only">Antwoordopties</legend>
        {vraag.opties.map((o) => (
          <label key={o.id} className="optie">
            <input type="radio" name="antwoord" checked={keuze === o.id} onChange={() => zetKeuze(o.id)} />
            <span className="optie-letter">{o.id}</span>
            <span className="optie-tekst">{o.tekst}</span>
          </label>
        ))}
        <label className="optie optie-onzeker">
          <input type="radio" name="antwoord" checked={keuze === ONZEKER} onChange={() => zetKeuze(ONZEKER)} />
          <span className="optie-tekst">Weet ik niet zeker — laat me het antwoord zien</span>
        </label>
      </fieldset>
      <div className="onderkant-vast">
        <button
          type="button"
          className="knop knop-primair"
          disabled={keuze === null}
          onClick={() => keuze && onControleer(keuze)}
        >
          Controleer
        </button>
      </div>
    </main>
  )
}

function Uitlegscherm({
  vraag,
  keuze,
  positie,
  totaal,
  onVolgende,
}: {
  vraag: Vraag
  keuze: string
  positie: number
  totaal: number
  onVolgende: () => void
}) {
  const { instellingen } = useAppState()
  const goed = keuze === vraag.juist
  const onzeker = keuze === ONZEKER
  const [zekerheid, zetZekerheid] = useState<Zekerheid | undefined>(onzeker ? 'gok' : undefined)
  const juisteOptie = vraag.opties.find((o) => o.id === vraag.juist)
  const kaart = kaarten.find((k) => k.id === vraag.kaartId)
  const toonRegel =
    vraag.mechanismeRegel && vraag.insteek === 'praktijk' && instellingen.uitlegMetMechanisme

  return (
    <main className="scherm scherm-sessie">
      <Sessiekop positie={positie} totaal={totaal} />
      <div className={`uitslag ${goed ? 'uitslag-goed' : 'uitslag-fout'}`}>
        <Icon naam={goed ? 'check' : onzeker ? 'lamp' : 'kruis'} />
        <div>
          <Titel className="uitslag-titel">{goed ? 'Goed' : onzeker ? 'Het juiste antwoord' : 'Niet goed'}</Titel>
          <p className="uitslag-tekst">
            {vraag.juist}. {juisteOptie?.tekst}
          </p>
        </div>
      </div>

      <section className="kaart" aria-labelledby="waarom-kop">
        <h2 id="waarom-kop" className="sectiekop">
          Waarom
        </h2>
        <p>{vraag.waarom}</p>
      </section>

      {toonRegel && (
        <p className="mechanismeregel">
          <strong>Mechanisme</strong>
          {vraag.mechanismeRegel}
        </p>
      )}

      {vraag.onthoud && (
        <p className="tipvlak">
          <Icon naam="lamp" maat={20} />
          <span>{vraag.onthoud}</span>
        </p>
      )}

      <div className="uitleg-voet">
        <Bronregel bron={vraag.bron} />
        {vraag.status === 'concept' && <MeldFout vraag={vraag} />}
      </div>
      {kaart && (
        <a href={`#/kaart/${kaart.id}`} className="linkrij">
          <Icon naam="keten" maat={20} />
          Mechanismekaart {kaart.groep}
        </a>
      )}

      <section className="kaart" aria-labelledby="zeker-kop">
        {!onzeker && (
          <>
            <h2 id="zeker-kop" className="sectiekop">
              Hoe zeker was je?
            </h2>
            <Segment<Zekerheid>
              label="Hoe zeker was je?"
              waarde={zekerheid}
              onChange={zetZekerheid}
              opties={[
                { waarde: 'zeker', label: 'Zeker' },
                { waarde: 'twijfel', label: 'Twijfel' },
                { waarde: 'gok', label: 'Gok' },
              ]}
            />
          </>
        )}
        {zekerheid && (
          <p className="gevolg" role="status">
            <Icon naam="herhaal" maat={18} />
            {gevolgTekst(goed, zekerheid)}
          </p>
        )}
      </section>

      <button type="button" className="knop knop-primair" disabled={!zekerheid} onClick={onVolgende}>
        {positie === totaal ? 'Bekijk samenvatting' : 'Volgende vraag'}
      </button>
    </main>
  )
}

function Samenvatting({ resultaten }: { resultaten: Resultaat[] }) {
  const goed = resultaten.filter((r) => r.goed).length
  return (
    <main className="scherm scherm-sessie">
      <Titel className="titel-groot">Dosis binnen</Titel>
      <section className="kaart" aria-label="Score">
        <p className="score-groot">
          {goed}/{resultaten.length}
        </p>
        <p className="gedempt">vragen goed beantwoord</p>
      </section>
      <section className="kaart" aria-labelledby="overzicht-kop">
        <h2 id="overzicht-kop" className="sectiekop">
          Overzicht
        </h2>
        <ul>
          {resultaten.map(({ vraag, goed }) => (
            <li key={vraag.id} className="samenvatting-rij">
              <span className={`status-rond ${goed ? 'status-goed' : 'status-fout'}`}>
                <Icon naam={goed ? 'check' : 'kruis'} maat={16} />
              </span>
              <span>
                <span className="sr-only">{goed ? 'Goed: ' : 'Niet goed: '}</span>
                {vraag.vraag}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <div className="onderkant-vast">
        <a href="#/" className="knop knop-primair">
          Klaar
        </a>
      </div>
    </main>
  )
}

export function Sessie({ kaartId }: { kaartId?: string }) {
  const { zetAfgerond } = useAppState()
  const lijst = kaartId
    ? vragen.filter((v) => v.kaartId === kaartId)
    : dagdosis.vraagIds.map((id) => vragen.find((v) => v.id === id)!)

  const [index, zetIndex] = useState(0)
  const [keuze, zetKeuze] = useState<string | null>(null)
  const [resultaten, zetResultaten] = useState<Resultaat[]>([])

  const klaar = index >= lijst.length
  const score = resultaten.filter((r) => r.goed).length

  useEffect(() => {
    window.scrollTo(0, 0)
    if (klaar && !kaartId) zetAfgerond({ goed: score, totaal: lijst.length })
  }, [index, keuze, klaar, kaartId, score, lijst.length, zetAfgerond])

  if (lijst.length === 0) {
    ga('#/')
    return null
  }
  if (klaar) return <Samenvatting resultaten={resultaten} />

  const vraag = lijst[index]
  if (keuze === null) {
    return (
      <Vraagscherm
        key={vraag.id}
        vraag={vraag}
        positie={index + 1}
        totaal={lijst.length}
        onControleer={zetKeuze}
      />
    )
  }
  return (
    <Uitlegscherm
      key={vraag.id}
      vraag={vraag}
      keuze={keuze}
      positie={index + 1}
      totaal={lijst.length}
      onVolgende={() => {
        zetResultaten((r) => [...r, { vraag, goed: keuze === vraag.juist }])
        zetKeuze(null)
        zetIndex((i) => i + 1)
      }}
    />
  )
}
