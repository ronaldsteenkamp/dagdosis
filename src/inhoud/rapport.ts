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

export function inhoudWaarschuwingen(vragen: Vraag[], vandaag: string): string[] {
  const waarschuwingen: string[] = []
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
