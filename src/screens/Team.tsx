import { Icon } from '../components/Icon'
import { Titel } from '../components/Kop'

export function Team() {
  return (
    <main className="scherm scherm-met-balk">
      <Titel className="titel-groot">Team</Titel>
      <section className="kaart leeg">
        <span className="leeg-icoon">
          <Icon naam="team" maat={36} />
        </span>
        <p className="sectiekop">Binnenkort</p>
        <p className="gedempt">Hier komt de teammodus.</p>
      </section>
    </main>
  )
}
