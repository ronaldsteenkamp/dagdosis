import type { Bron, Status } from '../types'
import { Icon } from './Icon'

/** Wie de inhoud heeft nagekeken en wanneer. Zonder dit toont de regel alleen de bron. */
export interface Controle {
  status: Status
  gecontroleerdDoor?: string
  gecontroleerdOp?: string
}

const datumTekst = (datum: string) =>
  new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(`${datum}T12:00:00`),
  )

function controleTekst({ status, gecontroleerdDoor, gecontroleerdOp }: Controle) {
  if (status === 'concept') return 'Concept: nog niet nagekeken door een tweede apotheker.'
  const door = gecontroleerdDoor ? ` door ${gecontroleerdDoor}` : ''
  const op = gecontroleerdOp ? ` op ${datumTekst(gecontroleerdOp)}` : ''
  return `Nagekeken${door}${op}.`
}

export function Bronregel({ bron, controle }: { bron: Bron; controle?: Controle }) {
  return (
    <div className="bronregel">
      <Icon naam="boek" maat={18} />
      <div>
        <p>
          Bron:{' '}
          {bron.url ? (
            <a href={bron.url} target="_blank" rel="noreferrer">
              {bron.label}
              <span className="sr-only"> (opent in een nieuw venster)</span>
            </a>
          ) : (
            bron.label
          )}
        </p>
        {controle && <p className="bronregel-controle">{controleTekst(controle)}</p>}
      </div>
    </div>
  )
}
