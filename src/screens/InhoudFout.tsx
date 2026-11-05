import { Icon } from '../components/Icon'
import { Titel } from '../components/Kop'

export function InhoudFout({ fouten }: { fouten: string[] }) {
  return (
    <main className="scherm">
      <Titel className="titel-groot">De inhoud klopt niet</Titel>
      <p className="tipvlak">
        <Icon naam="waarschuwing" maat={20} />
        <span>
          De app start niet, omdat een bestand in /content fouten bevat. Herstel de {fouten.length}{' '}
          {fouten.length === 1 ? 'fout' : 'fouten'} hieronder.
        </span>
      </p>
      <ul className="kaart foutenlijst">
        {fouten.map((fout) => (
          <li key={fout}>{fout}</li>
        ))}
      </ul>
    </main>
  )
}
