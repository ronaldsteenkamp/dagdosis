// Waarschuwingen en cijfers over de vragen. Een waarschuwing houdt de build niet tegen,
// maar vraagt wel om aandacht. Draait alleen op inhoud die de validatie heeft doorstaan.
import type { Vraag } from '../types'

export const LETTERS = ['A', 'B', 'C', 'D']

/** Boven dit aandeel valt op dat het juiste antwoord vaak het langste is (bij toeval ±25%). */
export const LANGSTE_MAX = 0.35
/** Buiten deze grenzen is een letter te vaak of te weinig het juiste antwoord (bij toeval 25%). */
export const LETTER_MIN = 0.15
export const LETTER_MAX = 0.35

export interface Rapport {
  aantal: number
  langste: number
  perLetter: Record<string, number>
}

/** Vragen met vier opties A–D; andere vraagtypen tellen niet mee. */
function meerkeuze(vragen: Vraag[]) {
  return vragen.filter((v) => v.opties?.length === LETTERS.length && LETTERS.includes(v.juist))
}

/** Is de juiste optie strikt langer dan elke afleider? */
export function juisteIsLangste(vraag: Vraag) {
  const juist = vraag.opties.find((o) => o.id === vraag.juist)
  if (!juist) return false
  return vraag.opties.every((o) => o.id === vraag.juist || o.tekst.length < juist.tekst.length)
}

export function maakRapport(vragen: Vraag[]): Rapport {
  const lijst = meerkeuze(vragen)
  const perLetter = Object.fromEntries(LETTERS.map((l) => [l, lijst.filter((v) => v.juist === l).length]))
  return { aantal: lijst.length, langste: lijst.filter(juisteIsLangste).length, perLetter }
}

function procent(deel: number, geheel: number) {
  return geheel === 0 ? 0 : Math.round((deel / geheel) * 100)
}

export function rapportTekst(r: Rapport): string[] {
  return [
    `Juiste antwoord is het langste: ${r.langste} van ${r.aantal} (${procent(r.langste, r.aantal)}%).`,
    `Juiste letter: ${LETTERS.map((l) => `${l} ${r.perLetter[l]} (${procent(r.perLetter[l], r.aantal)}%)`).join(', ')}.`,
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
