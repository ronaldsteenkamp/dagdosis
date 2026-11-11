import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Bronregel, herzieningVerlopen } from '../components/Bronregel'
import { Icon } from '../components/Icon'
import { Titel } from '../components/Kop'
import { kaarten, vragen } from '../inhoud'
import { geldigeVoortgang, gevolgTekst, planVolgende, teruggevallen } from '../logica/herhaling'
import { meldingUrl } from '../logica/melding'
import { getalProbleem, isGoed, juistTekst, keuzeTekst, leesInvoer, optiesVan, rekenTekst } from '../logica/vraag'
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
  reken: 'Rekenen',
  medicatiebewaking: 'Medicatiebewaking',
}

/** De balk telt beantwoorde vragen; de teller noemt de vraag waar je nu bent. */
function Sessiekop({ positie, totaal, beantwoord }: { positie: number; totaal: number; beantwoord: boolean }) {
  const gedaan = beantwoord ? positie : positie - 1
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
        aria-valuenow={gedaan}
        aria-valuetext={`${gedaan} van ${totaal} beantwoord`}
      >
        {Array.from({ length: totaal }, (_, i) => (
          <span key={i} className={i < gedaan ? 'vol' : undefined} />
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

/**
 * Sneltoetsen voor wie achter de computer werkt. Doet niets terwijl je typt (rekenveld, notitie)
 * of als de dialoog "Fout melden" open is, en laat Ctrl-, Cmd- en Alt-combinaties met rust.
 * Enter op een knop, link of in het formulier laat de browser zelf afhandelen, anders telt hij dubbel.
 */
function useSneltoetsen(opToets: (toets: string) => boolean) {
  const laatste = useRef(opToets)
  laatste.current = opToets
  useEffect(() => {
    const luister = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      const doel = e.target instanceof Element ? e.target : null
      if (doel?.closest('textarea, select, [contenteditable], input:not([type=radio])')) return
      if (document.querySelector('dialog[open]')) return
      if (e.key === 'Enter' && doel?.closest('form, button, a')) return
      if (laatste.current(e.key)) e.preventDefault()
    }
    window.addEventListener('keydown', luister)
    return () => window.removeEventListener('keydown', luister)
  }, [])
}

function SneltoetsHint({ children }: { children: ReactNode }) {
  return (
    <p className="sneltoetsen gedempt klein" aria-hidden="true">
      {children}
    </p>
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
  const ingevuld = keuze !== null && keuze.trim() !== ''
  const probleem = vraag.type === 'reken' && ingevuld ? getalProbleem(keuze) : null
  const gelezen = vraag.type === 'reken' && ingevuld ? leesInvoer(keuze) : null
  const geldig = keuze !== null && (vraag.type !== 'reken' || gelezen !== null)
  const opties = optiesVan(vraag)
  const verstuur = () => {
    // Een rekenantwoord wordt als gewoon getal bewaard: "0,5" wordt "0.5".
    if (geldig && keuze !== null) onControleer(vraag.type === 'reken' ? String(gelezen) : keuze)
  }
  useSneltoetsen((toets) => {
    const optie = opties.find((o) => o.id === toets.toUpperCase())
    if (optie) {
      zetKeuze(optie.id)
      return true
    }
    if (toets === 'Enter' && geldig) {
      verstuur()
      return true
    }
    return false
  })
  return (
    <main className="scherm scherm-sessie">
      <Sessiekop positie={positie} totaal={totaal} beantwoord={false} />
      <div className="vraagmeta">
        <span className="pil pil-blauw">{typeLabel[vraag.type]}</span>
        {vraag.status === 'concept' && <span className="pil pil-amber">concept</span>}
        {herzieningVerlopen(vraag) && <span className="pil pil-fout">herziening verlopen</span>}
        {(vraag.status === 'concept' || herzieningVerlopen(vraag)) && <MeldFout vraag={vraag} />}
      </div>
      {vraag.casus && <p className="casus">{vraag.casus}</p>}
      <Titel className="vraagtekst">{vraag.vraag}</Titel>
      <form
        className="vraagformulier"
        onSubmit={(e) => {
          e.preventDefault()
          verstuur()
        }}
      >
        {vraag.type === 'reken' ? (
          <>
            <label className="rekeninvoer">
              <span className="sr-only">Je antwoord, in {vraag.eenheid}</span>
              <input
                className="invoerveld"
                type="text"
                inputMode="decimal"
                enterKeyHint="done"
                autoComplete="off"
                placeholder="Je antwoord"
                value={keuze ?? ''}
                onChange={(e) => zetKeuze(e.target.value)}
                aria-invalid={probleem !== null}
                aria-describedby="rekeninvoer-melding"
              />
              <span className="rekeninvoer-eenheid" aria-hidden="true">
                {vraag.eenheid}
              </span>
            </label>
            {/* Altijd aanwezig, zodat de schermlezer een nieuwe foutmelding voorleest. */}
            <p id="rekeninvoer-melding" className={probleem ? 'veldmelding veldmelding-fout' : 'veldmelding'} aria-live="polite">
              {probleem && <Icon naam="waarschuwing" maat={18} />}
              {probleem ?? (gelezen !== null ? `Gelezen als ${rekenTekst(vraag, gelezen)}` : '')}
            </p>
          </>
        ) : (
          <fieldset className="opties">
            <legend className="sr-only">Antwoordopties</legend>
            {opties.map((o) => (
              <label key={o.id} className="optie">
                <input type="radio" name="antwoord" checked={keuze === o.id} onChange={() => zetKeuze(o.id)} />
                <span className="optie-letter">{o.id}</span>
                <span className="optie-tekst">{o.tekst}</span>
              </label>
            ))}
          </fieldset>
        )}
        <div className="onderkant-vast">
          {vraag.type !== 'reken' && <SneltoetsHint>Toets A–D om te kiezen en Enter om te controleren.</SneltoetsHint>}
          <button type="submit" className="knop knop-primair" disabled={!geldig}>
            Controleer
          </button>
        </div>
      </form>
    </main>
  )
}

function Uitlegscherm({
  vraag,
  keuze,
  positie,
  totaal,
  dagen,
  sneltoetsen,
  onOpenKaart,
  onVolgende,
}: {
  vraag: Vraag
  keuze: string
  positie: number
  totaal: number
  /** Over hoeveel dagen de vraag terugkomt; berekend op het moment van controleren. */
  dagen: number
  /** Uit terwijl er een mechanismekaart over de uitleg ligt. */
  sneltoetsen: boolean
  onOpenKaart: (id: string) => void
  onVolgende: () => void
}) {
  const { instellingen } = useAppState()
  useSneltoetsen((toets) => {
    if (!sneltoetsen || (toets !== 'Enter' && toets !== 'ArrowRight')) return false
    onVolgende()
    return true
  })
  const goed = isGoed(vraag, keuze)
  const kaart = kaarten.find((k) => k.id === vraag.kaartId)
  const toonRegel =
    vraag.mechanismeRegel && vraag.insteek === 'praktijk' && instellingen.uitlegMetMechanisme

  return (
    <main className="scherm scherm-sessie">
      <Sessiekop positie={positie} totaal={totaal} beantwoord />
      <div className={`uitslag ${goed ? 'uitslag-goed' : 'uitslag-fout'}`}>
        <Icon naam={goed ? 'check' : 'kruis'} />
        <div className="uitslag-inhoud">
          <Titel className="uitslag-titel">{goed ? 'Goed' : 'Niet goed'}</Titel>
          <p className="uitslag-regel">
            <Icon naam="check" maat={18} />
            <span>
              <strong>Juist antwoord:</strong> {juistTekst(vraag)}
            </span>
          </p>
          {/* Bij een rekenvraag ook bij goed, zodat je ziet hoe je invoer gelezen is. */}
          {(!goed || vraag.type === 'reken') && (
            <p className="uitslag-regel uitslag-jouw">
              <Icon naam={goed ? 'check' : 'kruis'} maat={18} />
              <span>
                <strong>Jouw antwoord:</strong> {keuzeTekst(vraag, keuze)}
              </span>
            </p>
          )}
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
        <Bronregel bron={vraag.bron} controle={vraag} />
        {(vraag.status === 'concept' || herzieningVerlopen(vraag)) && <MeldFout vraag={vraag} keuze={keuze} />}
      </div>
      {kaart && (
        <button type="button" className="linkrij" onClick={() => onOpenKaart(kaart.id)}>
          <Icon naam="keten" maat={20} />
          Mechanismekaart {kaart.groep}
        </button>
      )}

      <p className="gevolg" role="status">
        <Icon naam="herhaal" maat={18} />
        {gevolgTekst(dagen)}
      </p>

      <SneltoetsHint>Enter of → voor verder.</SneltoetsHint>
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
          <p className="pil pil-amber los">
            <Icon naam="vlam" maat={18} />
            {streak} {streak === 1 ? 'dag' : 'dagen'} op rij
          </p>
        )}
      </section>
      <section className="kaart" aria-labelledby="overzicht-kop">
        <h2 id="overzicht-kop" className="sectiekop">
          Overzicht
        </h2>
        <p className="gedempt klein">Tik op een vraag om het antwoord en de uitleg terug te lezen.</p>
        <ul>
          {resultaten.map((r) => {
            const v = lijst.find((x) => x.id === r.vraagId)
            if (!v) return null
            return (
              <li key={r.vraagId} className="samenvatting-rij">
                <details open={!r.goed && resultaten.filter((x) => !x.goed).length === 1}>
                  <summary>
                    <span className={`status-rond ${r.goed ? 'status-goed' : 'status-fout'}`}>
                      <Icon naam={r.goed ? 'check' : 'kruis'} maat={16} />
                    </span>
                    <span className="samenvatting-vraag">
                      <span className="sr-only">{r.goed ? 'Goed: ' : 'Niet goed: '}</span>
                      {v.casus && <span className="samenvatting-casus">{v.casus}</span>}
                      {v.vraag}
                    </span>
                  </summary>
                  <div className="samenvatting-uitleg">
                    <p>
                      <strong>Juist antwoord:</strong> {juistTekst(v)}
                    </p>
                    <p>{v.waarom}</p>
                    <Bronregel bron={v.bron} />
                  </div>
                </details>
              </li>
            )
          })}
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
  const { beantwoord, dosis, dosissen, vandaag, voortgang, zetLeertijd } = useAppState()
  const isTest = !!kaartId || !!terugval
  // De lijst ligt vast bij de start, anders verdwijnt een vraag zodra je hem weer goed hebt.
  const [testId] = useState(() => `test-${crypto.randomUUID()}`)
  const [terugvalIds] = useState(() => (terugval ? teruggevallen(vragen, voortgang).map((t) => t.vraag.id) : []))
  const [testResultaten, zetTestResultaten] = useState<Resultaat[]>([])
  // Het antwoord is al opgeslagen zodra de uitleg verschijnt. Sluit je de sessie tijdens de uitleg
  // (telefoon, klant aan de balie), dan telt het antwoord dus gewoon mee.
  const [uitleg, zetUitleg] = useState<{ vraagId: string; keuze: string; antwoordId: string; dagen: number } | null>(
    null,
  )
  const [openKaart, zetOpenKaart] = useState<string | null>(null)
  const startTijd = useRef(0)
  const scrollVoorKaart = useRef(0)

  const lijst = kaartId
    ? vragen.filter((v) => v.kaartId === kaartId)
    : (terugval ? terugvalIds : dosis.vraagIds).flatMap((id) => vragen.filter((v) => v.id === id))
  const resultaten = isTest ? testResultaten : dosis.resultaten
  const aantalBeantwoord = lijst.filter((v) => resultaten.some((r) => r.vraagId === v.id)).length
  const vraag = uitleg
    ? lijst.find((v) => v.id === uitleg.vraagId)
    : lijst.find((v) => !resultaten.some((r) => r.vraagId === v.id))
  // Tijdens de uitleg is de vraag al beantwoord en dus meegeteld.
  const positie = uitleg ? aantalBeantwoord : aantalBeantwoord + 1

  useEffect(() => {
    if (lijst.length === 0) ga('#/')
  }, [lijst.length])

  // De leertijd loopt vanaf het openen van de vraag tot "Volgende".
  useEffect(() => {
    startTijd.current = Date.now()
  }, [vraag?.id])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [vraag?.id, uitleg])

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

  if (!uitleg) {
    return (
      <Vraagscherm
        key={vraag.id}
        vraag={vraag}
        positie={positie}
        totaal={lijst.length}
        onControleer={(keuze) => {
          const goed = isGoed(vraag, keuze)
          // Plannen met de voortgang van vóór dit antwoord.
          const bakje = geldigeVoortgang(vraag, voortgang[vraag.id])?.bakje ?? 1
          const { dagen } = planVolgende(bakje, goed, 'zeker')
          const antwoordId = beantwoord({
            vraag,
            keuze,
            zekerheid: 'zeker',
            duurMs: Date.now() - startTijd.current,
            inDosis: !isTest,
          })
          if (isTest) zetTestResultaten((r) => [...r, { vraagId: vraag.id, goed }])
          zetUitleg({ vraagId: vraag.id, keuze, antwoordId, dagen })
        }}
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
          keuze={uitleg.keuze}
          positie={positie}
          totaal={lijst.length}
          dagen={uitleg.dagen}
          sneltoetsen={!openKaart}
          onOpenKaart={(id) => {
            scrollVoorKaart.current = window.scrollY
            zetOpenKaart(id)
          }}
          onVolgende={() => {
            zetLeertijd(uitleg.antwoordId, Date.now() - startTijd.current)
            zetUitleg(null)
          }}
        />
      </div>
    </>
  )
}
