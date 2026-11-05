import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Titel } from '../components/Kop'
import { dummyVoortgang, themas } from '../data/dummy'

const ZWAK_ONDER = 60

function leertijd(minuten: number) {
  const uren = Math.floor(minuten / 60)
  return uren > 0 ? `${uren} u ${minuten % 60} min` : `${minuten} min`
}

export function Voortgang() {
  const [melding, zetMelding] = useState('')
  const v = dummyVoortgang

  return (
    <main className="scherm scherm-met-balk">
      <Titel className="titel-groot">Voortgang</Titel>

      <div className="stats">
        <section className="kaart">
          <p className="stat-getal">{v.percentageGoed}%</p>
          <p className="gedempt klein">goed, laatste 30 dagen</p>
        </section>
        <section className="kaart">
          <p className="stat-getal">{leertijd(v.leertijdMinuten)}</p>
          <p className="gedempt klein">leertijd dit jaar</p>
        </section>
      </div>

      <section className="kaart" aria-labelledby="themas-kop">
        <h2 id="themas-kop" className="sectiekop">
          Per thema
        </h2>
        <ul className="themabalken">
          {v.themaScores.map(({ themaId, pct }) => {
            const naam = themas.find((t) => t.id === themaId)?.naam ?? themaId
            return (
              <li key={themaId}>
                <div className="themabalk-kop">
                  <span>{naam}</span>
                  <span>{pct}%</span>
                </div>
                <div className="themabalk-spoor" aria-hidden="true">
                  <div
                    className={`themabalk-vulling${pct < ZWAK_ONDER ? ' zwak' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="kaart aandachtkaart" aria-labelledby="morgen-kop">
        <h2 id="morgen-kop" className="sectiekop">
          <Icon naam="waarschuwing" maat={20} />
          Morgen extra aandacht
        </h2>
        <ul>
          {v.morgen.map((regel) => (
            <li key={regel}>{regel}</li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        className="knop knop-licht"
        onClick={() => zetMelding('De export werkt vanaf fase 3, met je echte leerlog.')}
      >
        <Icon naam="download" maat={20} />
        Leerlog exporteren
      </button>
      <p className="gedempt klein" role="status">
        {melding}
      </p>
    </main>
  )
}
