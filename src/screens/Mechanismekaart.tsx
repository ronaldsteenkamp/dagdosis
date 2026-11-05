import { Bronregel } from '../components/Bronregel'
import { Icon } from '../components/Icon'
import { Terugkop } from '../components/Kop'
import { kaarten, vragen } from '../inhoud'

function Blok({ titel, tekst, kleur }: { titel: string; tekst: string; kleur: 'blauw' | 'wit' | 'amber' }) {
  return (
    <div className={`keten-blok keten-${kleur}`}>
      <h2>{titel}</h2>
      <p>{tekst}</p>
    </div>
  )
}

function Pijl() {
  return (
    <div className="keten-pijl" aria-hidden="true">
      <Icon naam="pijlOmlaag" />
    </div>
  )
}

export function Mechanismekaart({ id }: { id: string }) {
  const kaart = kaarten.find((k) => k.id === id)
  if (!kaart) {
    return (
      <main className="scherm">
        <Terugkop titel="Kaart niet gevonden" />
      </main>
    )
  }
  const heeftVragen = vragen.some((v) => v.kaartId === id)

  return (
    <main className="scherm">
      <Terugkop titel={kaart.groep} />
      <p className="gedempt">{kaart.voorbeelden.join(', ')}</p>

      <div className="keten">
        <Blok titel="Aangrijpingspunt" tekst={kaart.aangrijpingspunt} kleur="blauw" />
        <Pijl />
        <Blok titel="Direct effect" tekst={kaart.directEffect} kleur="wit" />
        <Pijl />
        <Blok titel="Klinisch effect" tekst={kaart.klinischEffect} kleur="blauw" />
        <Pijl />
        <Blok titel="Bijwerkingen die je kunt afleiden" tekst={kaart.afleidbareBijwerkingen} kleur="amber" />
      </div>

      {kaart.letOp && (
        <section className="letop">
          <h2>
            <Icon naam="waarschuwing" maat={18} />
            Let op / interacties
          </h2>
          <p>{kaart.letOp}</p>
        </section>
      )}

      {heeftVragen && (
        <a href={`#/sessie/kaart/${kaart.id}`} className="knop knop-primair">
          Test jezelf op deze groep
        </a>
      )}
      <Bronregel bron={kaart.bron} />
    </main>
  )
}
