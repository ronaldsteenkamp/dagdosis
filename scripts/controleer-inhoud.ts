// Controleert /content vóór elke build. Stopt met een duidelijke melding als iets niet klopt.
// Waarschuwingen en de verdeling van de antwoorden worden getoond, maar houden de build niet tegen.
import { readFileSync } from 'node:fs'
import { inhoudWaarschuwingen, maakRapport, rapportTekst } from '../src/inhoud/rapport.ts'
import { valideerInhoud } from '../src/inhoud/valideer.ts'
import { datumVan } from '../src/logica/datum.ts'
import type { Vraag } from '../src/types.ts'

const fouten: string[] = []

function lees(bestand: string): unknown {
  try {
    return JSON.parse(readFileSync(new URL(`../content/${bestand}`, import.meta.url), 'utf8'))
  } catch (fout) {
    fouten.push(`${bestand}: geen geldige JSON (${(fout as Error).message})`)
    return null
  }
}

const inhoud = { themas: lees('themas.json'), kaarten: lees('kaarten.json'), vragen: lees('vragen.json') }
if (fouten.length === 0) fouten.push(...valideerInhoud(inhoud))

if (fouten.length > 0) {
  console.error(`\nDe inhoud klopt niet (${fouten.length} ${fouten.length === 1 ? 'fout' : 'fouten'}):\n`)
  for (const fout of fouten) console.error(`  - ${fout}`)
  console.error('')
  process.exit(1)
}

const vragen = inhoud.vragen as Vraag[]
const waarschuwingen = inhoudWaarschuwingen(vragen, datumVan(), inhoud.kaarten as { id: string }[])
if (waarschuwingen.length > 0) {
  console.warn(`\nLet op (${waarschuwingen.length} ${waarschuwingen.length === 1 ? 'waarschuwing' : 'waarschuwingen'}):\n`)
  for (const w of waarschuwingen) console.warn(`  - ${w}`)
  console.warn('')
}

console.log(`Inhoud in orde: ${vragen.length} vragen.`)
for (const regel of rapportTekst(maakRapport(vragen))) console.log(regel)
