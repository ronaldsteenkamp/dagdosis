import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Bronregel } from '../components/Bronregel'
import { Icon } from '../components/Icon'
import { Titel } from '../components/Kop'
import { kaarten, vragen } from '../inhoud'
import { geldigeVoortgang, gevolgTekst, planVolgende, teruggevallen } from '../logica/herhaling'
import { meldingUrl } from '../logica/melding'
import { berekenStreak } from '../logica/voortgang'
import { ga } from '../router'
import { useAppState } from '../state'
import type { Reflectie, Resultaat, Vraag, VraagType } from '../types'
import { Mechanismekaart } from './Mechanismekaart'

const typeLabel: Record<VraagType, string> = {
  casus: 'Casus',
  'mechanisme-bijwerking': 'Mechanisme → bijwerking',
  'mechanisme-middel': 'Mechanisme → middel',
  vergelijk: 'Vergelijk',
  kinetiek: 'Kinetiek',
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

function MeldFout({ vraag, keuze }: { vraag: Vraag; keuze?: string }) {
  const { meldingen, voegMeldingToe } = useAppState()
  const dialoog = useRef<HTMLDialogElement>(null)
  const [notitie, zetNotitie] = useState('')
  const gemeld = meldingen.some((m) => m.vraagId === vraag.id && m.versie === vraag.versie)

  return (
    <>
      <button type="button" className="tekstknop" onClick={() => dialoog.current?.showModal()}>
        <Icon naam="vlag" maat={16} />
        {gemeld ? 'Gemeld' : 'Meld fout'}
      </button>
      <dialog ref={dialoog} className="dialoog" aria-label="Fout melden">
        <form
          method="dialog"
          onSubmit={(e) => {
            const opGithub = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'github'
            voegMeldingToe(vraag, notitie, keuze)
            if (opGithub) window.open(meldingUrl(vraag, keuze), '_blank', 'noopener')
            zetNotitie('')
          }}
        >
          <h2 className="sectiekop">Fout melden</h2>
          <label className="klein gedempt">
            Wat klopt er niet? Je notitie blijft op dit toestel.
            <textarea value={notitie} required onChange={(e) => zetNotitie(e.target.value)} />
          </label>
          <p className="klein gedempt">
            Via GitHub zie de maker je melding. Daar staan de vraag, de versie en je keuze al ingevuld; je
            notitie neem je zelf over. Je hebt er een GitHub-account voor nodig. Vermeld geen patiënt- of
            persoonsgegevens.
          </p>
          <button type="submit" value="github" className="knop knop-primair" formNoValidate>
            Opslaan en melden op GitHub
          </button>
          <div className="knoprij">
            <button type="button" className="knop knop-licht" onClick={() => dialoog.current?.close()}>
              Annuleren
            </button>
            <button type="submit" value="lokaal" className="knop knop-licht">
              Alleen opslaan
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
  onOpenKaart,
  onVolgende,
}: {
  vraag: Vraag
  keuze: string
  positie: number
  totaal: number
  onOpenKaart: (id: string) => void
  onVolgende: () => void
}) {
  const { instellingen, voortgang } = useAppState()
  const goed = keuze === vraag.juist
  const juisteOptie = vraag.opties.find((o) => o.id === vraag.juist)
  const kaart = kaarten.find((k) => k.id === vraag.kaartId)
  const toonRegel =
    vraag.mechanismeRegel && vraag.insteek === 'praktijk' && instellingen.uitlegMetMechanisme
  const bakje = geldigeVoortgang(vraag, voortgang[vraag.id])?.bakje ?? 1

  return (
    <main className="scherm scherm-sessie">
      <Sessiekop positie={positie} totaal={totaal} />
      <div className={`uitslag ${goed ? 'uitslag-goed' : 'uitslag-fout'}`}>
        <Icon naam={goed ? 'check' : 'kruis'} />
        <div>
          <Titel className="uitslag-titel">{goed ? 'Goed' : 'Niet goed'}</Titel>
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
        {vraag.status === 'concept' && <MeldFout vraag={vraag} keuze={keuze} />}
      </div>
      {kaart && (
        <button type="button" className="linkrij" onClick={() => onOpenKaart(kaart.id)}>
          <Icon naam="keten" maat={20} />
          Mechanismekaart {kaart.groep}
        </button>
      )}

      <p className="gevolg" role="status">
        <Icon naam="herhaal" maat={18} />
        {gevolgTekst(planVolgende(bakje, goed, 'zeker').dagen)}
      </p>

      <button
        type="button"
        className="knop knop-primair"
        onClick={onVolgende}
      >
        {positie === totaal ? 'Bekijk samenvatting' : 'Volgende vraag'}
      </button>
    </main>
  )
}

function ReflectieVeld({ id, soort }: { id: string; soort: Reflectie['soort'] }) {
  const { reflecties, vandaag, zetReflectie } = useAppState()
  const bestaand = reflecties.find((r) => r.id === id)
  const [tekst, zetTekst] = useState(bestaand?.tekst ?? '')
  const bewaar = () => zetReflectie({ id, datum: bestaand?.datum ?? vandaag, soort, tekst: tekst.trim() })
  // Ook bewaren als iemand de sessie sluit zonder het veld te verlaten.
  const laatste = useRef(bewaar)
  laatste.current = bewaar
  useEffect(() => () => laatste.current(), [])

  return (
    <section className="kaart" aria-labelledby="reflectie-kop">
      <h2 id="reflectie-kop" className="sectiekop">
        Wat neem ik mee naar de praktijk?
      </h2>
      <label className="klein gedempt">
        Optioneel. Komt in je leerlog en je overzicht, en blijft op dit toestel. Schrijf geen patiëntgegevens op.
        <textarea className="invoerveld" value={tekst} onChange={(e) => zetTekst(e.target.value)} onBlur={bewaar} />
      </label>
    </section>
  )
}

function Samenvatting({
  lijst,
  resultaten,
  streak,
  reflectieId,
}: {
  lijst: Vraag[]
  resultaten: Resultaat[]
  streak?: number
  reflectieId: string
}) {
  const goed = resultaten.filter((r) => r.goed).length
  return (
    <main className="scherm scherm-sessie">
      <Titel className="titel-groot">{streak === undefined ? 'Test afgerond' : 'Dosis binnen'}</Titel>
      <section className="kaart" aria-label="Score">
        <p className="score-groot">
          {goed}/{resultaten.length}
        </p>
        <p className="gedempt">vragen goed beantwoord</p>
        {streak !== undefined && (
          <p className="pil pil-amber" style={{ alignSelf: 'flex-start' }}>
            <Icon naam="vlam" maat={18} />
            {streak} {streak === 1 ? 'dag' : 'dagen'} op rij
          </p>
        )}
      </section>
      <section className="kaart" aria-labelledby="overzicht-kop">
        <h2 id="overzicht-kop" className="sectiekop">
          Overzicht
        </h2>
        <ul>
          {resultaten.map((r) => (
            <li key={r.vraagId} className="samenvatting-rij">
              <span className={`status-rond ${r.goed ? 'status-goed' : 'status-fout'}`}>
                <Icon naam={r.goed ? 'check' : 'kruis'} maat={16} />
              </span>
              <span>
                <span className="sr-only">{r.goed ? 'Goed: ' : 'Niet goed: '}</span>
                {lijst.find((v) => v.id === r.vraagId)?.vraag}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <ReflectieVeld id={reflectieId} soort={streak === undefined ? 'test' : 'dagdosis'} />
      <div className="onderkant-vast">
        <a href="#/" className="knop knop-primair">
          Klaar
        </a>
      </div>
    </main>
  )
}

/** Een sessie is de dagdosis, of een losse test: per kaart of met teruggevallen vragen. */
export function Sessie({ kaartId, terugval }: { kaartId?: string; terugval?: boolean }) {
  const { beantwoord, dosis, dosissen, vandaag, voortgang } = useAppState()
  const isTest = !!kaartId || !!terugval
  // De lijst ligt vast bij de start, anders verdwijnt een vraag zodra je hem weer goed hebt.
  const [testId] = useState(() => `test-${crypto.randomUUID()}`)
  const [terugvalIds] = useState(() => (terugval ? teruggevallen(vragen, voortgang).map((t) => t.vraag.id) : []))
  const [testResultaten, zetTestResultaten] = useState<Resultaat[]>([])
  const [keuze, zetKeuze] = useState<string | null>(null)
  const [openKaart, zetOpenKaart] = useState<string | null>(null)
  const startTijd = useRef(0)
  const scrollVoorKaart = useRef(0)

  const lijst = kaartId
    ? vragen.filter((v) => v.kaartId === kaartId)
    : (terugval ? terugvalIds : dosis.vraagIds).flatMap((id) => vragen.filter((v) => v.id === id))
  const resultaten = isTest ? testResultaten : dosis.resultaten
  const vraag = lijst.find((v) => !resultaten.some((r) => r.vraagId === v.id))
  const positie = lijst.length - lijst.filter((v) => !resultaten.some((r) => r.vraagId === v.id)).length + 1

  useEffect(() => {
    if (lijst.length === 0) ga('#/')
  }, [lijst.length])

  // De leertijd loopt vanaf het openen van de vraag.
  useEffect(() => {
    startTijd.current = Date.now()
  }, [vraag?.id])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [vraag?.id, keuze])

  useLayoutEffect(() => {
    window.scrollTo(0, openKaart ? 0 : scrollVoorKaart.current)
  }, [openKaart])

  if (lijst.length === 0) return null
  if (!vraag) {
    return (
      <Samenvatting
        lijst={lijst}
        resultaten={resultaten}
        streak={isTest ? undefined : berekenStreak(dosissen, vandaag)}
        reflectieId={isTest ? testId : `dagdosis-${dosis.datum}`}
      />
    )
  }

  if (keuze === null) {
    return (
      <Vraagscherm
        key={vraag.id}
        vraag={vraag}
        positie={positie}
        totaal={lijst.length}
        onControleer={zetKeuze}
      />
    )
  }

  return (
    <>
      {openKaart && <Mechanismekaart id={openKaart} onTerug={() => zetOpenKaart(null)} />}
      <div hidden={!!openKaart}>
        <Uitlegscherm
          key={vraag.id}
          vraag={vraag}
          keuze={keuze}
          positie={positie}
          totaal={lijst.length}
          onOpenKaart={(id) => {
            scrollVoorKaart.current = window.scrollY
            zetOpenKaart(id)
          }}
          onVolgende={() => {
            beantwoord({
              vraag,
              keuze,
              zekerheid: 'zeker',
              duurMs: Date.now() - startTijd.current,
              inDosis: !isTest,
            })
            if (isTest) zetTestResultaten((r) => [...r, { vraagId: vraag.id, goed: keuze === vraag.juist }])
            zetKeuze(null)
          }}
        />
      </div>
    </>
  )
}
