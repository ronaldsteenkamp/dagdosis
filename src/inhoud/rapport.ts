// Waarschuwingen en cijfers over de vragen. Een waarschuwing houdt de build niet tegen,
// maar vraagt wel om aandacht. Draait alleen op inhoud die de validatie heeft doorstaan.
// Alleen type-imports: npm run controleer draait dit bestand direct in Node, zonder bundler.
import type { Beslissing, MeerkeuzeVraag, Vraag } from '../types'

export const LETTERS = ['A', 'B', 'C', 'D']
const BESLISSINGEN: Beslissing[] = ['afleveren', 'afleveren-met-advies', 'overleggen', 'niet-afleveren']

/** Boven dit aandeel valt op dat het juiste antwoord vaak het langste is (bij toeval ±25%). */
export const LANGSTE_MAX = 0.35
/** Buiten deze grenzen is een letter te vaak of te weinig het juiste antwoord (bij toeval 25%). */
export const LETTER_MIN = 0.15
export const LETTER_MAX = 0.35

export interface Rapport {
  aantal: number
  langste: number
  perLetter: Record<string, number>
  /** Hoe vaak elke beslissing juist is bij medicatiebewaking. */
  perBeslissing: Record<Beslissing, number>
}

/** Vragen met vier eigen opties A–D. Reken- en medicatiebewakingsvragen tellen niet mee. */
function meerkeuze(vragen: Vraag[]) {
  return vragen.filter(
    (v): v is MeerkeuzeVraag =>
      v.type !== 'reken' && v.type !== 'medicatiebewaking' && v.opties?.length === LETTERS.length && LETTERS.includes(v.juist),
  )
}

/** Is de juiste optie strikt langer dan elke afleider? */
export function juisteIsLangste(vraag: MeerkeuzeVraag) {
  const juist = vraag.opties.find((o) => o.id === vraag.juist)
  if (!juist) return false
  return vraag.opties.every((o) => o.id === vraag.juist || o.tekst.length < juist.tekst.length)
}

export function maakRapport(vragen: Vraag[]): Rapport {
  const lijst = meerkeuze(vragen)
  const perLetter = Object.fromEntries(LETTERS.map((l) => [l, lijst.filter((v) => v.juist === l).length]))
  const bewaking = vragen.filter((v) => v.type === 'medicatiebewaking')
  const perBeslissing = Object.fromEntries(
    BESLISSINGEN.map((b) => [b, bewaking.filter((v) => v.juist === b).length]),
  ) as Record<Beslissing, number>
  return { aantal: lijst.length, langste: lijst.filter(juisteIsLangste).length, perLetter, perBeslissing }
}

function procent(deel: number, geheel: number) {
  return geheel === 0 ? 0 : Math.round((deel / geheel) * 100)
}

export function rapportTekst(r: Rapport): string[] {
  const bewaking = Object.values(r.perBeslissing).reduce((a, b) => a + b, 0)
  const regelBewaking = bewaking
    ? [`Medicatiebewaking (${bewaking}): ${BESLISSINGEN.map((b) => `${b} ${r.perBeslissing[b]}`).join(', ')}.`]
    : []
  return [
    `Juiste antwoord is het langste: ${r.langste} van ${r.aantal} (${procent(r.langste, r.aantal)}%).`,
    `Juiste letter: ${LETTERS.map((l) => `${l} ${r.perLetter[l]} (${procent(r.perLetter[l], r.aantal)}%)`).join(', ')}.`,
    ...regelBewaking,
  ]
}

// Notatieregels voor getallen en eenheden. Een verkeerd gelezen getal of eenheid is een bekende
// oorzaak van een tienvoudige of duizendvoudige doseerfout; een leerapp moet het goede voorbeeld geven.
const NOTATIE: { patroon: RegExp; uitleg: string; behalve?: RegExp }[] = [
  {
    // Geen \b ervoor: µ telt niet als letter, dus "50 µg" zou dan niet gevonden worden.
    patroon: /(?<![a-z])(mcg|µg|μg|ug)\b/i,
    uitleg: 'schrijf microgram als "microg"; µg lijkt op mg',
  },
  {
    // Tijden als 16.00 uur zijn wel goed.
    patroon: /\d\.\d/,
    behalve: /^\d{1,2}\.\d{2}\s?uur/,
    uitleg: 'een punt in een getal: gebruik een komma als decimaalteken en geen punt tussen duizendtallen',
  },
  {
    patroon: /(^|[\s(]),\d/,
    uitleg: 'een getal begint met een komma: zet er een 0 voor (0,5, niet ,5)',
  },
  {
    // Bij een dosis kan 5,0 mg als 50 mg gelezen worden. Labwaarden in een bereik (1,0 mmol/l) mogen wel.
    patroon: /\b\d+,0\s?(mg|ml|microg|g|IE|E)\b/,
    uitleg: 'een dosis met ,0 erachter: laat de nul weg (5 mg, niet 5,0 mg)',
  },
]

/** Alle teksten van een vraag of kaart die iemand in de app leest. */
function teksten(item: Record<string, unknown>): string[] {
  const velden = ['casus', 'vraag', 'waarom','mechanismeRegel', 'onthoud', 'groep', 'aangrijpingspunt',
    'directEffect', 'klinischEffect', 'afleidbareBijwerkingen', 'letOp']
  const lijst = velden.map((v) => item[v]).filter((t): t is string => typeof t === 'string')
  const opties = Array.isArray(item.opties) ? item.opties.map((o: { tekst?: unknown }) => o.tekst) : []
  const voorbeelden = Array.isArray(item.voorbeelden) ? item.voorbeelden : []
  return [...lijst, ...opties, ...voorbeelden].filter((t): t is string => typeof t === 'string')
}

/** Waarschuwt bij een getal- of eenheidnotatie die tot verkeerd lezen kan leiden. */
export function notatieWaarschuwingen(bestand: string, items: { id: string }[]): string[] {
  const waarschuwingen: string[] = []
  for (const item of items) {
    for (const tekst of teksten(item as unknown as Record<string, unknown>)) {
      for (const regel of NOTATIE) {
        const treffer = new RegExp(regel.patroon.source, regel.patroon.flags + 'g')
        for (const m of tekst.matchAll(treffer)) {
          const vanaf = m.index ?? 0
          // Begin bij het hele getal, zodat "16.00 uur" als tijd herkend wordt.
          const start = tekst.slice(0, vanaf + 1).search(/\d+$/)
          if (regel.behalve?.test(tekst.slice(start === -1 ? vanaf : start))) continue
          const fragment = tekst.slice(Math.max(0, vanaf - 15), vanaf + 20).trim()
          waarschuwingen.push(`${bestand} › ${item.id}: ${regel.uitleg} ("…${fragment}…")`)
        }
      }
    }
  }
  return waarschuwingen
}

export function inhoudWaarschuwingen(vragen: Vraag[], vandaag: string, kaarten: { id: string }[] = []): string[] {
  const waarschuwingen: string[] = [
    ...notatieWaarschuwingen('vragen.json', vragen),
    ...notatieWaarschuwingen('kaarten.json', kaarten),
  ]
  for (const v of vragen) {
    if (v.herzienVoor && v.herzienVoor < vandaag) {
      waarschuwingen.push(`vragen.json › ${v.id} › herzienVoor: ${v.herzienVoor} is verlopen; kijk de vraag opnieuw na`)
    }
  }

  const r = maakRapport(vragen)
  if (r.aantal === 0) return waarschuwingen
  if (r.langste / r.aantal > LANGSTE_MAX) {
    waarschuwingen.push(
      `vragen.json: het juiste antwoord is te vaak het langste (${procent(r.langste, r.aantal)}%, liefst hooguit ${LANGSTE_MAX * 100}%)`,
    )
  }
  for (const l of LETTERS) {
    const aandeel = r.perLetter[l] / r.aantal
    if (aandeel < LETTER_MIN || aandeel > LETTER_MAX) {
      waarschuwingen.push(
        `vragen.json: ${l} is in ${procent(r.perLetter[l], r.aantal)}% van de vragen juist (liefst ${LETTER_MIN * 100}–${LETTER_MAX * 100}%)`,
      )
    }
  }
  return waarschuwingen
}
