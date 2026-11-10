import type { Antwoord, Dosis, Melding, Reflectie, Thema, Vraag, VraagVoortgang } from '../types'
import { maandagVan, plusDagen, type Datum } from './datum'
import { geldigeVoortgang } from './herhaling'

export const ZWAK_ONDER = 60
export const MAX_DUUR_MS = 3 * 60 * 1000
const THEMA_VENSTER = 20
const PERCENTAGE_DAGEN = 30

function percentage(antwoorden: Antwoord[]) {
  if (antwoorden.length === 0) return null
  return Math.round((antwoorden.filter((a) => a.goed).length / antwoorden.length) * 100)
}

export function begrensDuur(duurMs: number) {
  return Math.max(0, Math.min(duurMs, MAX_DUUR_MS))
}

/** Percentage goed over de laatste 20 antwoorden binnen een thema; null als er nog geen zijn. */
export function themaScore(antwoorden: Antwoord[], themaId: string) {
  return percentage(antwoorden.filter((a) => a.themaIds.includes(themaId)).slice(-THEMA_VENSTER))
}

export function percentageGoed(antwoorden: Antwoord[], vandaag: Datum) {
  const vanaf = plusDagen(vandaag, -(PERCENTAGE_DAGEN - 1))
  return percentage(antwoorden.filter((a) => a.datum >= vanaf && a.datum <= vandaag))
}

export function leertijdDitJaarMs(antwoorden: Antwoord[], vandaag: Datum) {
  const jaar = vandaag.slice(0, 4)
  return antwoorden.filter((a) => a.datum.startsWith(jaar)).reduce((som, a) => som + a.duurMs, 0)
}

export function isAfgerond(dosis: Dosis | undefined) {
  return !!dosis && dosis.vraagIds.length > 0 && dosis.resultaten.length >= dosis.vraagIds.length
}

/** Telt door vanaf vandaag, of vanaf gisteren zolang vandaag nog niet is afgerond. */
export function berekenStreak(dosissen: Record<Datum, Dosis>, vandaag: Datum) {
  let dag = isAfgerond(dosissen[vandaag]) ? vandaag : plusDagen(vandaag, -1)
  let streak = 0
  while (isAfgerond(dosissen[dag])) {
    streak++
    dag = plusDagen(dag, -1)
  }
  return streak
}

export interface Weekdag {
  datum: Datum
  goed: number | null
  totaal: number
}

export function weekOverzicht(dosissen: Record<Datum, Dosis>, vandaag: Datum): Weekdag[] {
  const maandag = maandagVan(vandaag)
  return Array.from({ length: 7 }, (_, i) => {
    const datum = plusDagen(maandag, i)
    const dosis = dosissen[datum]
    return isAfgerond(dosis)
      ? { datum, goed: dosis.resultaten.filter((r) => r.goed).length, totaal: dosis.vraagIds.length }
      : { datum, goed: null, totaal: 0 }
  })
}

/** Regels voor de kaart "Morgen extra aandacht". */
export function morgenAandacht(
  vragen: Vraag[],
  themas: Thema[],
  voortgang: Record<string, VraagVoortgang>,
  antwoorden: Antwoord[],
  vandaag: Datum,
) {
  const morgen = plusDagen(vandaag, 1)
  const perThema = new Map<string, number>()
  for (const vraag of vragen) {
    const v = geldigeVoortgang(vraag, voortgang[vraag.id])
    if (v && v.volgendeDatum <= morgen) {
      perThema.set(vraag.themaIds[0], (perThema.get(vraag.themaIds[0]) ?? 0) + 1)
    }
  }
  const herhalingen = themas.flatMap((t) => {
    const aantal = perThema.get(t.id)
    return aantal ? [`${aantal} ${aantal === 1 ? 'herhaling' : 'herhalingen'} uit ${t.naam}`] : []
  })
  const zwak = themas.flatMap((t) => {
    const score = themaScore(antwoorden, t.id)
    return score !== null && score < ZWAK_ONDER ? [`${t.naam} staat op ${score}%`] : []
  })
  return [...herhalingen, ...zwak]
}

function csvVeld(waarde: string | number) {
  const tekst = String(waarde)
  return /[;"\r\n]/.test(tekst) ? `"${tekst.replaceAll('"', '""')}"` : tekst
}

/** Met puntkomma's en een BOM: zo opent Excel met Nederlandse instellingen het goed. */
function csv(rijen: (string | number)[][]) {
  return `﻿${rijen.map((rij) => rij.map(csvVeld).join(';')).join('\r\n')}\r\n`
}

export function maakLeerlogCsv(antwoorden: Antwoord[], themas: Thema[], reflecties: Reflectie[] = []) {
  const perDag = new Map<Datum, Antwoord[]>()
  for (const a of antwoorden) perDag.set(a.datum, [...(perDag.get(a.datum) ?? []), a])
  for (const r of reflecties) if (!perDag.has(r.datum)) perDag.set(r.datum, [])
  const naam = (id: string) => themas.find((t) => t.id === id)?.naam ?? id

  const rijen = [...perDag.keys()].sort().map((datum) => {
    const dag = perDag.get(datum)!
    const minuten = dag.reduce((som, a) => som + a.duurMs, 0) / 60000
    const themaNamen = [...new Set(dag.flatMap((a) => a.themaIds))].map(naam).sort()
    const reflectie = reflecties
      .filter((r) => r.datum === datum)
      .sort((a, b) => a.tijdstip.localeCompare(b.tijdstip))
      .map((r) => r.tekst)
    return [
      datum,
      minuten.toFixed(1).replace('.', ','),
      dag.length,
      dag.filter((a) => a.goed).length,
      themaNamen.join(', '),
      reflectie.join(' | '),
    ]
  })
  return csv([['Datum', 'Tijd besteed (min)', 'Aantal vragen', 'Aantal goed', "Thema's", 'Reflectie'], ...rijen])
}

export function maakMeldingenCsv(meldingen: Melding[]) {
  const rijen = meldingen.map((m) => [m.datum, m.vraagId, m.versie, m.keuze ?? '', m.notitie])
  return csv([['Datum', 'Vraag', 'Versie', 'Gekozen', 'Notitie'], ...rijen])
}
