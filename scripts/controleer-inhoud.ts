// Controleert /content vóór elke build. Stopt met een duidelijke melding als iets niet klopt.
import { readFileSync } from 'node:fs'
import { valideerInhoud } from '../src/inhoud/valideer.ts'

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

const vragen = inhoud.vragen as unknown[]
console.log(`Inhoud in orde: ${vragen.length} vragen.`)
