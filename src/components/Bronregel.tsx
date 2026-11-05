import type { Bron } from '../types'
import { Icon } from './Icon'

export function Bronregel({ bron }: { bron: Bron }) {
  return (
    <p className="bronregel">
      <Icon naam="boek" maat={18} />
      <span>
        Bron:{' '}
        {bron.url ? (
          <a href={bron.url} target="_blank" rel="noreferrer">
            {bron.label}
            <span className="sr-only"> (opent in een nieuw venster)</span>
          </a>
        ) : (
          bron.label
        )}
      </span>
    </p>
  )
}
