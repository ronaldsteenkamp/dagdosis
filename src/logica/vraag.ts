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

/**
 * Een punt met precies drie cijfers erachter, zoals 18.000, is in het Nederlands een duizendtal,
 * maar in de rest van de wereld een decimaal. Zo'n invoer is dubbelzinnig en lezen we niet.
 * Met een 0 ervoor (0.125) kan het geen duizendtal zijn.
 */
const DUBBELZINNIGE_PUNT = /^-?[1-9]\d{0,2}\.\d{3}$/

/** Waarom een invoer geen geldig getal is, of null als hij wel te lezen is. */
export function getalProbleem(tekst: string): string | null {
  const schoon = tekst.trim().replace(/\s/g, '')
  if (DUBBELZINNIGE_PUNT.test(schoon)) {
    return 'Bedoel je een duizendtal of een decimaal? Gebruik een komma als decimaalteken, bijvoorbeeld 18,5.'
  }
  return leesGetal(schoon) === null ? 'Vul een getal in, bijvoorbeeld 52 of 0,5.' : null
}

/**
 * Leest een getal; een komma mag als decimaalteken. Geeft null bij geen geldig getal.
 * Voor opgeslagen antwoorden, die als "1.125" bewaard zijn. Voor wat iemand typt: leesInvoer.
 */
export function leesGetal(tekst: string): number | null {
  const schoon = tekst.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(schoon)) return null
  const getal = Number(schoon)
  return Number.isFinite(getal) ? getal : null
}

/** Leest wat iemand in het rekenveld typt. Weigert ook een dubbelzinnige punt, zoals 18.000. */
export function leesInvoer(tekst: string): number | null {
  return getalProbleem(tekst) === null ? leesGetal(tekst) : null
}

/** Afrondingsruis van zwevendekommagetallen mag een antwoord op de grens niet fout maken. */
const SPELING = 1e-9

export function isGoed(vraag: Vraag, keuze: string): boolean {
  if (vraag.type !== 'reken') return keuze === juisteKeuze(vraag)
  const getal = leesGetal(keuze)
  return getal !== null && Math.abs(getal - vraag.antwoord) <= vraag.marge + SPELING
}

export function getalTekst(getal: number) {
  // Zonder scheidingsteken voor duizendtallen: 1000, niet 1.000. Dat sluit aan bij wat de invoer accepteert.
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 6, useGrouping: false }).format(getal)
}

export function rekenTekst(vraag: RekenVraag, getal: number) {
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
