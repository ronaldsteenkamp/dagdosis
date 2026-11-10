const KOMPAS = 'https://www.farmacotherapeutischkompas.nl'
const KENNISBANK = 'https://kennisbank.knmp.nl'

/** Korte, vaste tekst: wat de app wel en niet is. */
export function Disclaimer() {
  return (
    <p className="gedempt klein">
      Dagdosis is een leermiddel, geen naslagwerk. Vragen kunnen fouten bevatten of verouderd zijn, en
      vragen met het label "concept" zijn nog niet door een tweede apotheker nagekeken. Raadpleeg bij twijfel
      het{' '}
      <a href={KOMPAS} target="_blank" rel="noreferrer">
        Farmacotherapeutisch Kompas
      </a>{' '}
      of de{' '}
      <a href={KENNISBANK} target="_blank" rel="noreferrer">
        KNMP Kennisbank
      </a>
      .
    </p>
  )
}
