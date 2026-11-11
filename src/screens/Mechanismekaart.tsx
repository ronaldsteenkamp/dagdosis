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

/** Met onTerug is dit een tussenstap in een sessie, zonder eigen test. */
export function Mechanismekaart({ id, onTerug }: { id: string; onTerug?: () => void }) {
  const kaart = kaarten.find((k) => k.id === id)
  if (!kaart) {
    return (
      <main className="scherm">
        <Terugkop titel="Kaart niet gevonden" onTerug={onTerug} />
        <p>
          Deze mechanismekaart bestaat niet (meer). Misschien is de link verouderd, of is de kaart hernoemd.
        </p>
        {onTerug ? (
          <button type="button" className="knop knop-licht" onClick={onTerug}>
            Terug naar de vraag
          </button>
        ) : (
          <a href="#/" className="knop knop-licht">
            Naar Vandaag
          </a>
        )}
      </main>
    )
  }
  const kanTesten = !onTerug && vragen.some((v) => v.kaartId === id)

  return (
    <main className="scherm">
      <Terugkop titel={kaart.groep} onTerug={onTerug} />
      <p className="gedempt">{kaart.voorbeelden.join(', ')}</p>
      {kaart.status === 'concept' && (
        <p className="pil pil-amber los">
          concept
        </p>
      )}

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

      {kanTesten && (
        <a href={`#/sessie/kaart/${kaart.id}`} className="knop knop-primair">
          Test jezelf op deze groep
        </a>
      )}
      <Bronregel bron={kaart.bron} controle={kaart} />
    </main>
  )
}
