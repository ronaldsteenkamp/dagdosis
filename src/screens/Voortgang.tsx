import { BackupKnop } from '../components/Backup'
import { Icon } from '../components/Icon'
import { Titel } from '../components/Kop'
import { downloadCsv } from '../download'
import { themas, vragen } from '../inhoud'
import { backupHerinnering } from '../logica/backup'
import { teruggevallen } from '../logica/herhaling'
import {
  leertijdDitJaarMs,
  maakLeerlogCsv,
  maakMeldingenCsv,
  MIN_VOOR_PERCENTAGE,
  morgenAandacht,
  percentageGoed,
  tellingGoed,
  themaScore,
  themaTelling,
  ZWAK_ONDER,
} from '../logica/voortgang'
import { useAppState } from '../state'

function leertijd(ms: number) {
  const minuten = Math.round(ms / 60000)
  const uren = Math.floor(minuten / 60)
  return uren > 0 ? `${uren} u ${minuten % 60} min` : `${minuten} min`
}

export function Voortgang() {
  const { antwoorden, meldingen, meta, reflecties, voortgang, vandaag } = useAppState()
  const herinnering = backupHerinnering(meta.laatsteBackupOp, vandaag, antwoorden.length > 0)
  const percentage = percentageGoed(antwoorden, vandaag)
  const telling = tellingGoed(antwoorden, vandaag)
  const weinig = telling.totaal < MIN_VOOR_PERCENTAGE
  const aandacht = morgenAandacht(vragen, themas, voortgang, antwoorden, vandaag)
  const terugval = teruggevallen(vragen, voortgang)

  return (
    <main className="scherm scherm-met-balk">
      <Titel className="titel-groot">Voortgang</Titel>

      {herinnering && (
        <section className="kaart aandachtkaart" aria-labelledby="backup-herinnering-kop">
          <h2 id="backup-herinnering-kop" className="sectiekop">
            <Icon naam="waarschuwing" maat={20} />
            Maak een back-up
          </h2>
          <p>{herinnering} Je voortgang staat alleen op dit toestel.</p>
          <BackupKnop licht={false} />
        </section>
      )}

      <div className="stats">
        <section className="kaart">
          <p className="stat-getal">
            {percentage === null ? '–' : weinig ? `${telling.goed} van ${telling.totaal}` : `${percentage}%`}
          </p>
          <p className="gedempt klein">
            goed, laatste 30 dagen{percentage !== null && !weinig && ` (${telling.goed} van ${telling.totaal})`}
          </p>
        </section>
        <section className="kaart">
          <p className="stat-getal">{leertijd(leertijdDitJaarMs(antwoorden, vandaag))}</p>
          <p className="gedempt klein">leertijd dit jaar</p>
        </section>
      </div>

      <section className="kaart" aria-labelledby="themas-kop">
        <h2 id="themas-kop" className="sectiekop">
          Per thema
        </h2>
        <ul className="themabalken">
          {themas.map((t) => {
            const score = themaScore(antwoorden, t.id)
            const { goed, totaal } = themaTelling(antwoorden, t.id)
            return (
              <li key={t.id}>
                <div className="themabalk-kop">
                  <span>{t.naam}</span>
                  <span className="themabalk-score">
                    {score === null ? 'nog geen' : `${score}%`}
                    {score !== null && <span className="gedempt"> · {goed} van {totaal}</span>}
                  </span>
                </div>
                <div className="themabalk-spoor" aria-hidden="true">
                  <div
                    className={`themabalk-vulling${score !== null && score < ZWAK_ONDER ? ' zwak' : ''}`}
                    style={{ width: `${score ?? 0}%` }}
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
        {aandacht.length > 0 ? (
          <ul>
            {aandacht.map((regel) => (
              <li key={regel}>{regel}</li>
            ))}
          </ul>
        ) : (
          <p>Morgen staat er niets extra's klaar.</p>
        )}
      </section>

      {terugval.length > 0 && (
        <section className="kaart" aria-labelledby="terugval-kop">
          <h2 id="terugval-kop" className="sectiekop">
            Weggezakt
          </h2>
          <p className="gedempt klein">
            Vragen die je eerst goed had en later fout. Een vinkje betekent dat je ze inmiddels weer goed had.
          </p>
          <ul>
            {terugval.map((t) => (
              <li key={t.vraag.id} className="samenvatting-rij">
                <span className={`status-rond ${t.hersteld ? 'status-goed' : 'status-fout'}`}>
                  <Icon naam={t.hersteld ? 'check' : 'kruis'} maat={16} />
                </span>
                <span>
                  <span className="sr-only">{t.hersteld ? 'Inmiddels weer goed: ' : 'Nog niet hersteld: '}</span>
                  <span className="gedempt klein" style={{ display: 'block' }}>
                    {themas.find((th) => th.id === t.vraag.themaIds[0])?.naam}
                  </span>
                  {t.vraag.vraag}
                </span>
              </li>
            ))}
          </ul>
          <a href="#/sessie/terugval" className="knop knop-licht">
            <Icon naam="herhaal" maat={20} />
            Herhaal deze {terugval.length === 1 ? 'vraag' : `${terugval.length} vragen`}
          </a>
        </section>
      )}

      <a href="#/overzicht" className="knop knop-licht">
        <Icon naam="boek" maat={20} />
        Leeroverzicht voor je portfolio
      </a>

      <button
        type="button"
        className="knop knop-licht"
        onClick={() => downloadCsv(`dagdosis-leerlog-${vandaag}.csv`, maakLeerlogCsv(antwoorden, themas, reflecties))}
      >
        <Icon naam="download" maat={20} />
        Leerlog exporteren
      </button>

      {meldingen.length > 0 && (
        <button
          type="button"
          className="knop knop-licht"
          onClick={() => downloadCsv(`dagdosis-meldingen-${vandaag}.csv`, maakMeldingenCsv(meldingen))}
        >
          <Icon naam="vlag" maat={20} />
          Gemelde fouten exporteren ({meldingen.length})
        </button>
      )}
    </main>
  )
}
