// Leeroverzicht over een periode, voor een portfolio. Rekent alleen; het scherm maakt er een pagina van.
import type { Antwoord, Kaart, Reflectie, Thema, Vraag } from '../types'
import type { Datum } from './datum'

export interface Periode {
  van: Datum
  tot: Datum
}

export interface ThemaRegel {
  thema: Thema
  aantal: number
  goed: number
  /** Percentage goed, afgerond. */
  score: number
}

export interface Onderwerp {
  naam: string
  aantal: number
}

export interface Overzicht {
  leertijdMs: number
  aantalVragen: number
  aantalGoed: number
  /** Verschillende vragen, los van herhalingen. */
  aantalUniek: number
  aantalDagen: number
  perThema: ThemaRegel[]
  onderwerpen: Onderwerp[]
  reflecties: Reflectie[]
}

export function kalenderjaar(jaar: number): Periode {
  return { van: `${jaar}-01-01`, tot: `${jaar}-12-31` }
}

const binnen = (datum: Datum, p: Periode) => datum >= p.van && datum <= p.tot

/** De jaren waarin iets is gedaan, nieuwste eerst, en altijd het huidige jaar. */
export function jarenMetGegevens(antwoorden: Antwoord[], vandaag: Datum) {
  const jaren = new Set([Number(vandaag.slice(0, 4)), ...antwoorden.map((a) => Number(a.datum.slice(0, 4)))])
  return [...jaren].sort((a, b) => b - a)
}

export function maakOverzicht(invoer: {
  periode: Periode
  antwoorden: Antwoord[]
  reflecties: Reflectie[]
  themas: Thema[]
  vragen: Vraag[]
  kaarten: Kaart[]
}): Overzicht {
  const { periode, themas, vragen, kaarten } = invoer
  const antwoorden = invoer.antwoorden.filter((a) => binnen(a.datum, periode))

  const perThema = themas.flatMap((thema) => {
    const lijst = antwoorden.filter((a) => a.themaIds.includes(thema.id))
    if (lijst.length === 0) return []
    const goed = lijst.filter((a) => a.goed).length
    return [{ thema, aantal: lijst.length, goed, score: Math.round((goed / lijst.length) * 100) }]
  })

  // Onderwerp is de groep van de mechanismekaart. Vragen zonder kaart vallen onder hun eerste thema.
  const tellers = new Map<string, number>()
  for (const a of antwoorden) {
    const vraag = vragen.find((v) => v.id === a.vraagId)
    const kaart = kaarten.find((k) => k.id === vraag?.kaartId)
    const naam = kaart?.groep ?? themas.find((t) => t.id === a.themaIds[0])?.naam
    if (naam) tellers.set(naam, (tellers.get(naam) ?? 0) + 1)
  }
  const onderwerpen = [...tellers]
    .map(([naam, aantal]) => ({ naam, aantal }))
    .sort((a, b) => b.aantal - a.aantal || a.naam.localeCompare(b.naam, 'nl'))

  return {
    leertijdMs: antwoorden.reduce((som, a) => som + a.duurMs, 0),
    aantalVragen: antwoorden.length,
    aantalGoed: antwoorden.filter((a) => a.goed).length,
    aantalUniek: new Set(antwoorden.map((a) => a.vraagId)).size,
    aantalDagen: new Set(antwoorden.map((a) => a.datum)).size,
    perThema,
    onderwerpen,
    reflecties: invoer.reflecties
      .filter((r) => binnen(r.datum, periode))
      .sort((a, b) => a.tijdstip.localeCompare(b.tijdstip)),
  }
}
