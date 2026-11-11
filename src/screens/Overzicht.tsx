import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Terugkop } from '../components/Kop'
import { kaarten, themas, vragen } from '../inhoud'
import { isDatum } from '../inhoud/valideer'
import { jarenMetGegevens, kalenderjaar, maakOverzicht, type Periode } from '../logica/overzicht'
import { useAppState } from '../state'

function leertijd(ms: number) {
  const minuten = Math.round(ms / 60000)
  const uren = Math.floor(minuten / 60)
  return uren > 0 ? `${uren} u ${minuten % 60} min` : `${minuten} min`
}

function datumTekst(datum: string) {
  const [j, m, d] = datum.split('-').map(Number)
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(j, m - 1, d),
  )
}

/** Afdrukbaar leeroverzicht over een periode. Via "Afdrukken" bewaar je het als PDF. */
export function Overzicht() {
  const { antwoorden, reflecties, vandaag } = useAppState()
  const [periode, zetPeriode] = useState<Periode>(() => kalenderjaar(Number(vandaag.slice(0, 4))))
  const [naam, zetNaam] = useState('')
  const geldig = isDatum(periode.van) && isDatum(periode.tot) && periode.van <= periode.tot
  const o = geldig ? maakOverzicht({ periode, antwoorden, reflecties, themas, vragen, kaarten }) : null
  const score = o && o.aantalVragen > 0 ? `${Math.round((o.aantalGoed / o.aantalVragen) * 100)}%` : '–'

  return (
    <main className="scherm">
      <div className="niet-afdrukken">
        <Terugkop titel="Leeroverzicht" />
      </div>

      <section className="kaart niet-afdrukken" aria-labelledby="periode-kop">
        <h2 id="periode-kop" className="sectiekop">
          Periode
        </h2>
        <div className="jaarknoppen">
          {jarenMetGegevens(antwoorden, vandaag).map((jaar) => (
            <button
              key={jaar}
              type="button"
              className={`knop ${periode.van === `${jaar}-01-01` && periode.tot === `${jaar}-12-31` ? 'knop-primair' : 'knop-licht'}`}
              onClick={() => zetPeriode(kalenderjaar(jaar))}
            >
              {jaar}
            </button>
          ))}
        </div>
        <div className="periode">
          <label>
            Van
            <input
              className="invoerveld"
              type="date"
              value={periode.van}
              onChange={(e) => zetPeriode({ ...periode, van: e.target.value })}
            />
          </label>
          <label>
            Tot en met
            <input
              className="invoerveld"
              type="date"
              value={periode.tot}
              onChange={(e) => zetPeriode({ ...periode, tot: e.target.value })}
            />
          </label>
        </div>
        <label className="klein gedempt">
          Naam op het overzicht (optioneel, wordt niet bewaard)
          <input className="invoerveld" value={naam} onChange={(e) => zetNaam(e.target.value)} autoComplete="name" />
        </label>
        {!geldig && <p className="klein">Kies een geldige periode: de begindatum ligt vóór de einddatum.</p>}
        <button type="button" className="knop knop-primair" disabled={!geldig} onClick={() => window.print()}>
          <Icon naam="download" maat={20} />
          Afdrukken of als PDF bewaren
        </button>
      </section>

      {o && (
        <>
          <header className="alleen-afdruk">
            <h1 className="titel-groot">Leeroverzicht Dagdosis</h1>
            {naam && <p>{naam}</p>}
          </header>
          <p className="klein">
            {datumTekst(periode.van)} tot en met {datumTekst(periode.tot)}
          </p>

          <div className="stats">
            <section className="kaart">
              <p className="stat-getal">{leertijd(o.leertijdMs)}</p>
              <p className="gedempt klein">leertijd</p>
            </section>
            <section className="kaart">
              <p className="stat-getal">{o.aantalVragen}</p>
              <p className="gedempt klein">
                vragen beantwoord, {o.aantalUniek} verschillende
              </p>
            </section>
            <section className="kaart">
              <p className="stat-getal">{score}</p>
              <p className="gedempt klein">goed</p>
            </section>
            <section className="kaart">
              <p className="stat-getal">{o.aantalDagen}</p>
              <p className="gedempt klein">{o.aantalDagen === 1 ? 'dag' : 'dagen'} geoefend</p>
            </section>
          </div>

          <section className="kaart" aria-labelledby="thema-kop">
            <h2 id="thema-kop" className="sectiekop">
              Scores per thema
            </h2>
            {o.perThema.length === 0 ? (
              <p className="gedempt">Geen antwoorden in deze periode.</p>
            ) : (
              <table className="overzicht-tabel">
                <thead>
                  <tr>
                    <th scope="col">Thema</th>
                    <th scope="col" className="getal">
                      Vragen
                    </th>
                    <th scope="col" className="getal">
                      Goed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {o.perThema.map((r) => (
                    <tr key={r.thema.id}>
                      <td>{r.thema.naam}</td>
                      <td className="getal">{r.aantal}</td>
                      <td className="getal">{r.score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {o.onderwerpen.length > 0 && (
            <section className="kaart" aria-labelledby="onderwerp-kop">
              <h2 id="onderwerp-kop" className="sectiekop">
                Onderwerpen
              </h2>
              <p>{o.onderwerpen.map((x) => `${x.naam} (${x.aantal})`).join(', ')}</p>
            </section>
          )}

          {o.reflecties.length > 0 && (
            <section className="kaart" aria-labelledby="reflecties-kop">
              <h2 id="reflecties-kop" className="sectiekop">
                Wat ik meeneem naar de praktijk
              </h2>
              <ul className="reflectielijst">
                {o.reflecties.map((r) => (
                  <li key={r.id}>
                    <span className="gedempt klein blok">
                      {datumTekst(r.datum)}
                    </span>
                    {r.tekst}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="gedempt klein">
            Eigen registratie uit Dagdosis, een leermiddel met vragen over farmacologie en apotheekpraktijk.
            Gemaakt op {datumTekst(vandaag)}. Leertijd is de tijd per vraag, met een maximum van 3 minuten.
          </p>
        </>
      )}
    </main>
  )
}
