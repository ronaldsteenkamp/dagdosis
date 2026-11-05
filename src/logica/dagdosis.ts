import type {
  Antwoord,
  Dosis,
  Insteek,
  InsteekKeuze,
  Instellingen,
  ThemaFrequentie,
  Vraag,
  VraagVoortgang,
} from '../types'
import { weekdagIndex, type Datum } from './datum'
import { geldigeVoortgang } from './herhaling'
import { themaScore, ZWAK_ONDER } from './voortgang'

export const VRAGEN_PER_DOSIS = 5

const GEWICHTEN: Record<ThemaFrequentie, number> = { vaak: 3, normaal: 2, 'af-en-toe': 1, uit: 0 }

const VERHOUDING: Record<InsteekKeuze, Record<Insteek, number>> = {
  farmacologie: { farmacologie: 5, praktijk: 0 },
  gemengd: { farmacologie: 2, praktijk: 3 },
  praktijk: { farmacologie: 0, praktijk: 5 },
}

type Rng = () => number
type VoortgangPerVraag = Record<string, VraagVoortgang>

/** Voorspelbare toevalsreeks per datum: dezelfde dag geeft dezelfde keuzes. */
export function maakRng(zaad: string): Rng {
  let h = 2166136261
  for (const teken of zaad) h = Math.imul(h ^ teken.charCodeAt(0), 16777619)
  return () => {
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function insteekVanDag(instellingen: Instellingen, datum: Datum): InsteekKeuze {
  if (!instellingen.ritme) return instellingen.insteek
  const dag = weekdagIndex(datum)
  return dag === 0 || dag === 3 ? 'farmacologie' : 'praktijk'
}

export function themaGewicht(themaId: string, instellingen: Instellingen, antwoorden: Antwoord[]) {
  const basis = GEWICHTEN[instellingen.themaFrequentie[themaId] ?? 'normaal']
  if (!instellingen.bijsturen) return basis
  const score = themaScore(antwoorden, themaId)
  return score !== null && score < ZWAK_ONDER ? basis * 2 : basis
}

function vraagGewicht(vraag: Vraag, instellingen: Instellingen, antwoorden: Antwoord[]) {
  return Math.max(...vraag.themaIds.map((id) => themaGewicht(id, instellingen, antwoorden)))
}

function laatsteWasZwak(voortgang: VraagVoortgang) {
  const laatste = voortgang.geschiedenis.at(-1)
  return !laatste || !laatste.goed || laatste.zekerheid === 'gok'
}

/** Aan de beurt, in volgorde: eerst fout of gegokt, dan het langst wachtend. */
export function herhalingenVoor(vragen: Vraag[], voortgang: VoortgangPerVraag, datum: Datum) {
  const aanDeBeurt = vragen.flatMap((vraag) => {
    const v = geldigeVoortgang(vraag, voortgang[vraag.id])
    return v && v.volgendeDatum <= datum ? [{ vraag, v }] : []
  })
  aanDeBeurt.sort(
    (a, b) =>
      Number(laatsteWasZwak(b.v)) - Number(laatsteWasZwak(a.v)) ||
      a.v.volgendeDatum.localeCompare(b.v.volgendeDatum) ||
      a.vraag.id.localeCompare(b.vraag.id),
  )
  return aanDeBeurt.map(({ vraag }) => vraag)
}

/** Hoeveel nieuwe vragen per insteek, als herhalingen al plekken van de verhouding innemen. */
function nogNodig(keuze: InsteekKeuze, herhalingen: Vraag[]) {
  const doel = VERHOUDING[keuze]
  const telt = (i: Insteek) => herhalingen.filter((v) => v.insteek === i).length
  const nodig = {
    farmacologie: Math.max(0, doel.farmacologie - telt('farmacologie')),
    praktijk: Math.max(0, doel.praktijk - telt('praktijk')),
  }
  const vrij = VRAGEN_PER_DOSIS - herhalingen.length
  while (nodig.farmacologie + nodig.praktijk > vrij) {
    if (nodig.praktijk >= nodig.farmacologie) nodig.praktijk--
    else nodig.farmacologie--
  }
  return nodig
}

function kiesGewogen(kandidaten: { vraag: Vraag; gewicht: number }[], aantal: number, rng: Rng) {
  const pool = [...kandidaten]
  const gekozen: Vraag[] = []
  while (gekozen.length < aantal && pool.length > 0) {
    let punt = rng() * pool.reduce((som, k) => som + k.gewicht, 0)
    let index = pool.findIndex((k) => (punt -= k.gewicht) < 0)
    if (index < 0) index = pool.length - 1
    gekozen.push(pool.splice(index, 1)[0].vraag)
  }
  return gekozen
}

/** Nieuwe vragen eerst; zijn die op, dan eerder geziene, met de vroegste geplande datum voorop. */
function vulAan(
  pool: Vraag[],
  aantal: number,
  voortgang: VoortgangPerVraag,
  instellingen: Instellingen,
  antwoorden: Antwoord[],
  rng: Rng,
) {
  const kandidaten = pool
    .map((vraag) => ({ vraag, gewicht: vraagGewicht(vraag, instellingen, antwoorden) }))
    .filter((k) => k.gewicht > 0)
  const gezien = (v: Vraag) => geldigeVoortgang(v, voortgang[v.id])
  const nieuw = kiesGewogen(kandidaten.filter((k) => !gezien(k.vraag)), aantal, rng)
  const eerder = kandidaten
    .filter((k) => gezien(k.vraag))
    .map((k) => k.vraag)
    .sort((a, b) => gezien(a)!.volgendeDatum.localeCompare(gezien(b)!.volgendeDatum) || a.id.localeCompare(b.id))
  return [...nieuw, ...eerder].slice(0, aantal)
}

/** Zet vragen bij dezelfde kaart niet na elkaar, en houdt verder de volgorde zoveel mogelijk aan. */
export function spreidKaarten(vragen: Vraag[]) {
  const rest = [...vragen]
  const volgorde: Vraag[] = []
  const aantalVan = (kaartId?: string) => rest.filter((v) => kaartId && v.kaartId === kaartId).length
  while (rest.length > 0) {
    const vorige = volgorde.at(-1)?.kaartId
    const mogelijk = rest.filter((v) => !v.kaartId || v.kaartId !== vorige)
    // Een kaart met nog veel vragen gaat voor; anders blijven die aan het eind over.
    const volgende = (mogelijk.length ? mogelijk : rest).reduce((beste, v) =>
      aantalVan(v.kaartId) > aantalVan(beste.kaartId) ? v : beste,
    )
    volgorde.push(volgende)
    rest.splice(rest.indexOf(volgende), 1)
  }
  return volgorde
}

export function stelDosisSamen(invoer: {
  datum: Datum
  vragen: Vraag[]
  voortgang: VoortgangPerVraag
  antwoorden: Antwoord[]
  instellingen: Instellingen
  rng?: Rng
}): Dosis {
  const { datum, vragen, voortgang, antwoorden, instellingen } = invoer
  const rng = invoer.rng ?? maakRng(datum)

  const herhalingen = herhalingenVoor(vragen, voortgang, datum).slice(0, VRAGEN_PER_DOSIS)
  const bezet = new Set(herhalingen.map((v) => v.id))
  const vrij = (insteek: Insteek) => vragen.filter((v) => v.insteek === insteek && !bezet.has(v.id))
  const vul = (insteek: Insteek, aantal: number) =>
    vulAan(vrij(insteek), aantal, voortgang, instellingen, antwoorden, rng)

  const keuze = insteekVanDag(instellingen, datum)
  const nodig = nogNodig(keuze, herhalingen)
  const farmacologie = vul('farmacologie', nodig.farmacologie)
  const praktijk = vul('praktijk', nodig.praktijk)
  const aanvulling = [...farmacologie, ...praktijk]

  // Bij Gemengd vult de andere insteek een tekort aan; bij een vaste keuze blijft de dosis korter.
  if (keuze === 'gemengd') {
    const tekort = VRAGEN_PER_DOSIS - herhalingen.length - aanvulling.length
    if (tekort > 0) {
      const gekozen = new Set(aanvulling.map((v) => v.id))
      const andere: Insteek = farmacologie.length < nodig.farmacologie ? 'praktijk' : 'farmacologie'
      const pool = vrij(andere).filter((v) => !gekozen.has(v.id))
      aanvulling.push(...vulAan(pool, tekort, voortgang, instellingen, antwoorden, rng))
    }
  }

  return {
    datum,
    vraagIds: spreidKaarten([...herhalingen, ...aanvulling]).map((v) => v.id),
    herhalingIds: herhalingen.map((v) => v.id),
    resultaten: [],
  }
}
