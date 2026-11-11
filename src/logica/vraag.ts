// Wat per vraagtype verschilt: welke opties er zijn, wanneer een antwoord goed is en hoe je het toont.
// De schermen en de opslag gaan via deze functies, zodat ze het type niet zelf hoeven te kennen.
import type { Beslissing, Optie, RekenVraag, Vraag } from '../types'

export const BESLISSINGEN: { id: Beslissing; tekst: string }[] = [
  { id: 'afleveren', tekst: 'Afleveren' },
  { id: 'afleveren-met-advies', tekst: 'Afleveren met advies' },
  { id: 'overleggen', tekst: 'Overleggen met voorschrijver' },
  { id: 'niet-afleveren', tekst: 'Niet afleveren' },
]
const LETTERS = ['A', 'B', 'C', 'D']

/** De opties zoals het scherm ze toont. Een rekenvraag heeft er geen. */
export function optiesVan(vraag: Vraag): Optie[] {
  if (vraag.type === 'reken') return []
  if (vraag.type === 'medicatiebewaking') return BESLISSINGEN.map((b, i) => ({ id: LETTERS[i], tekst: b.tekst }))
  return vraag.opties
}

/** De juiste keuze in de vorm waarin een antwoord wordt opgeslagen. */
export function juisteKeuze(vraag: Vraag): string {
  if (vraag.type === 'reken') return String(vraag.antwoord)
  if (vraag.type === 'medicatiebewaking') return LETTERS[BESLISSINGEN.findIndex((b) => b.id === vraag.juist)]
  return vraag.juist
}

/** Leest een ingevoerd getal; een komma mag als decimaalteken. Geeft null bij geen geldig getal. */
export function leesGetal(tekst: string): number | null {
  const schoon = tekst.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(schoon)) return null
  const getal = Number(schoon)
  return Number.isFinite(getal) ? getal : null
}

/** Afrondingsruis van zwevendekommagetallen mag een antwoord op de grens niet fout maken. */
const SPELING = 1e-9

export function isGoed(vraag: Vraag, keuze: string): boolean {
  if (vraag.type !== 'reken') return keuze === juisteKeuze(vraag)
  const getal = leesGetal(keuze)
  return getal !== null && Math.abs(getal - vraag.antwoord) <= vraag.marge + SPELING
}

export function getalTekst(getal: number) {
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 6 }).format(getal)
}

function rekenTekst(vraag: RekenVraag, getal: number) {
  return `${getalTekst(getal)} ${vraag.eenheid}`
}

/** Het juiste antwoord als leesbare tekst, bijvoorbeeld "B. Tekst" of "52 ml/min (± 2)". */
export function juistTekst(vraag: Vraag): string {
  if (vraag.type === 'reken') {
    const marge = vraag.marge > 0 ? ` (goed tussen ${getalTekst(vraag.antwoord - vraag.marge)} en ${rekenTekst(vraag, vraag.antwoord + vraag.marge)})` : ''
    return `${rekenTekst(vraag, vraag.antwoord)}${marge}`
  }
  return keuzeTekst(vraag, juisteKeuze(vraag))
}

/** Een gegeven antwoord als leesbare tekst. */
export function keuzeTekst(vraag: Vraag, keuze: string): string {
  if (vraag.type === 'reken') {
    const getal = leesGetal(keuze)
    return getal === null ? keuze : rekenTekst(vraag, getal)
  }
  const optie = optiesVan(vraag).find((o) => o.id === keuze)
  return optie ? `${optie.id}. ${optie.tekst}` : keuze
}
