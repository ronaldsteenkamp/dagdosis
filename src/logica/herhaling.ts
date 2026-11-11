import type { Vraag, VraagVoortgang, Zekerheid } from '../types'
import { plusDagen, type Datum } from './datum'

/**
 * Interval per bakje: bakje 1 is 1 dag, bakje 8 is 180 dagen.
 * Bakjes 7 en 8 zijn later toegevoegd. Een vraag die al in bakje 6 stond, houdt de datum die
 * met 60 dagen is gepland en schuift bij het volgende goede antwoord door naar bakje 7.
 */
export const INTERVALLEN = [1, 3, 7, 14, 30, 60, 120, 180]
const HOOGSTE_BAKJE = INTERVALLEN.length
const TWIJFEL_DAGEN = 3

export interface Planning {
  bakje: number
  dagen: number
}

/** Een nieuwe vraag begint in bakje 1, dus goed en zeker betekent bakje 2: over 3 dagen. */
export function planVolgende(bakje: number, goed: boolean, zekerheid: Zekerheid): Planning {
  if (!goed || zekerheid === 'gok') return { bakje: 1, dagen: INTERVALLEN[0] }
  if (zekerheid === 'twijfel') return { bakje, dagen: TWIJFEL_DAGEN }
  const hoger = Math.min(bakje + 1, HOOGSTE_BAKJE)
  return { bakje: hoger, dagen: INTERVALLEN[hoger - 1] }
}

/** Voortgang telt alleen voor de huidige versie; een nieuwe versie begint opnieuw. */
export function geldigeVoortgang(vraag: Vraag, voortgang: VraagVoortgang | undefined) {
  return voortgang?.versie === vraag.versie ? voortgang : undefined
}

export function verwerkAntwoord(
  vraag: Vraag,
  voortgang: VraagVoortgang | undefined,
  antwoord: { datum: Datum; keuze: string; goed: boolean; zekerheid: Zekerheid },
): VraagVoortgang {
  const huidig = geldigeVoortgang(vraag, voortgang)
  const { bakje, dagen } = planVolgende(huidig?.bakje ?? 1, antwoord.goed, antwoord.zekerheid)
  return {
    vraagId: vraag.id,
    versie: vraag.versie,
    bakje,
    volgendeDatum: plusDagen(antwoord.datum, dagen),
    geschiedenis: [...(huidig?.geschiedenis ?? []), antwoord],
  }
}

export interface Terugval {
  vraag: Vraag
  /** Datum van het laatste foute antwoord na een eerder goed antwoord. */
  datum: string
  /** Het laatste antwoord was weer goed. */
  hersteld: boolean
}

/**
 * Vragen die je fout had terwijl je ze eerder al goed had: kennis die is weggezakt.
 * Telt alleen voor de huidige versie. Niet-herstelde vragen eerst, daarna de meest recente.
 */
export function teruggevallen(vragen: Vraag[], voortgang: Record<string, VraagVoortgang>): Terugval[] {
  const lijst = vragen.flatMap((vraag) => {
    const geschiedenis = geldigeVoortgang(vraag, voortgang[vraag.id])?.geschiedenis ?? []
    let ooitGoed = false
    let datum: string | undefined
    for (const punt of geschiedenis) {
      if (!punt.goed && ooitGoed) datum = punt.datum
      if (punt.goed) ooitGoed = true
    }
    return datum ? [{ vraag, datum, hersteld: !!geschiedenis.at(-1)?.goed }] : []
  })
  return lijst.sort(
    (a, b) => Number(a.hersteld) - Number(b.hersteld) || b.datum.localeCompare(a.datum) || a.vraag.id.localeCompare(b.vraag.id),
  )
}

export function gevolgTekst(dagen: number) {
  return dagen === 1 ? 'Deze vraag komt morgen terug.' : `Deze vraag komt over ${dagen} dagen terug.`
}
