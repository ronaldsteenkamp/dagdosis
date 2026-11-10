import { useEffect, useRef, useState } from 'react'
import { downloadBestand } from '../download'
import { backupBestandsnaam, backupSamenvatting, leesBackup, type Backup } from '../logica/backup'
import { useAppState } from '../state'
import { Icon } from './Icon'

function datumTekst(datum: string) {
  const [j, m, d] = datum.split('-').map(Number)
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(j, m - 1, d),
  )
}

/** Knop die een volledige back-up downloadt. */
export function BackupKnop({ licht = true }: { licht?: boolean }) {
  const { maakBackup, vandaag } = useAppState()
  return (
    <button
      type="button"
      className={`knop ${licht ? 'knop-licht' : 'knop-primair'}`}
      onClick={() =>
        downloadBestand(backupBestandsnaam(vandaag), JSON.stringify(maakBackup(), null, 1), 'application/json')
      }
    >
      <Icon naam="download" maat={20} />
      Back-up maken
    </button>
  )
}

export function BackupKaart() {
  const { meta, zetBackupTerug } = useAppState()
  const bestand = useRef<HTMLInputElement>(null)
  const dialoog = useRef<HTMLDialogElement>(null)
  const [kandidaat, zetKandidaat] = useState<Backup | null>(null)
  const [bericht, zetBericht] = useState('')
  const [vast, zetVast] = useState<boolean | null>(null)

  useEffect(() => {
    navigator.storage?.persisted?.().then(zetVast, () => zetVast(null))
  }, [])

  async function kies(file: File | undefined) {
    if (!file) return
    const uit = leesBackup(await file.text())
    if (bestand.current) bestand.current.value = ''
    if (!uit.ok) return zetBericht(uit.fout)
    zetBericht('')
    zetKandidaat(uit.backup)
    dialoog.current?.showModal()
  }

  async function bevestig() {
    if (!kandidaat) return
    try {
      await zetBackupTerug(kandidaat)
      zetBericht('De back-up is teruggezet.')
    } catch {
      zetBericht('Terugzetten is mislukt. Je gegevens zijn niet gewijzigd.')
    }
    zetKandidaat(null)
  }

  const s = kandidaat && backupSamenvatting(kandidaat)

  return (
    <section className="kaart" aria-labelledby="backup-kop">
      <h2 id="backup-kop" className="sectiekop">
        Back-up
      </h2>
      <p className="gedempt klein">
        Je voortgang staat alleen op dit toestel. Een back-up is één bestand met al je antwoorden,
        meldingen en instellingen. Zo neem je alles mee naar een ander toestel.
      </p>
      <p className="klein">
        {meta.laatsteBackupOp ? `Laatste back-up: ${datumTekst(meta.laatsteBackupOp)}.` : 'Nog geen back-up gemaakt.'}
        {vast === false && ' De browser kan je gegevens opruimen als er weinig ruimte is.'}
      </p>
      <BackupKnop />
      <button type="button" className="knop knop-licht" onClick={() => bestand.current?.click()}>
        <Icon naam="herhaal" maat={20} />
        Back-up terugzetten
      </button>
      <input
        ref={bestand}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => kies(e.target.files?.[0])}
      />
      {bericht && (
        <p className="klein" role="status">
          {bericht}
        </p>
      )}

      <dialog ref={dialoog} className="dialoog" aria-label="Back-up terugzetten" onClose={() => zetKandidaat(null)}>
        <form method="dialog" onSubmit={bevestig}>
          <h2 className="sectiekop">Back-up terugzetten?</h2>
          {s && (
            <p className="klein">
              Back-up van {s.gemaaktOp ? datumTekst(s.gemaaktOp) : 'onbekende datum'}: {s.antwoorden}{' '}
              {s.antwoorden === 1 ? 'antwoord' : 'antwoorden'} op {s.dagen} {s.dagen === 1 ? 'dag' : 'dagen'} en{' '}
              {s.meldingen} {s.meldingen === 1 ? 'melding' : 'meldingen'}.
            </p>
          )}
          <p className="klein">
            <strong>Alles wat nu op dit toestel staat, wordt overschreven.</strong> Maak eerst een back-up als je
            die gegevens wilt bewaren.
          </p>
          <div className="knoprij">
            <button type="button" className="knop knop-licht" onClick={() => dialoog.current?.close()}>
              Annuleren
            </button>
            <button type="submit" className="knop knop-primair">
              Overschrijven
            </button>
          </div>
        </form>
      </dialog>
    </section>
  )
}
