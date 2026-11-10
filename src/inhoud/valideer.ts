// Controleert de JSON-bestanden uit /content. Draait in de app, in de build en in de tests.
// Elke fout noemt het bestand, het item en het veld, zodat je hem direct kunt vinden.

export interface RuweInhoud {
  themas: unknown
  kaarten: unknown
  vragen: unknown
}

const INSTEKEN = ['farmacologie', 'praktijk']
const STATUSSEN = ['concept', 'gecontroleerd']
const VRAAGTYPES = ['casus', 'mechanisme-bijwerking', 'mechanisme-middel', 'vergelijk', 'kinetiek']
const OPTIE_IDS = ['A', 'B', 'C', 'D']
const VERBODEN_OPTIE = /(alle|geen van de) (bovenstaande|bovengenoemde|voorgaande)/i

const THEMA_VELDEN = ['id', 'naam', 'insteek']
const KAART_VELDEN = [
  'id', 'groep', 'voorbeelden', 'aangrijpingspunt', 'directEffect', 'klinischEffect',
  'afleidbareBijwerkingen', 'letOp', 'bron', 'status',
]
const VRAAG_VELDEN = [
  'id', 'type', 'insteek', 'themaIds', 'kaartId', 'casus', 'vraag', 'opties', 'juist',
  'waarom', 'mechanismeRegel', 'onthoud', 'bron', 'status', 'versie',
  'gecontroleerdDoor', 'gecontroleerdOp', 'herzienVoor',
]
const DATUM_VELDEN = ['gecontroleerdOp', 'herzienVoor']

type Item = Record<string, unknown>

function isItem(w: unknown): w is Item {
  return typeof w === 'object' && w !== null && !Array.isArray(w)
}

function isTekst(w: unknown): w is string {
  return typeof w === 'string' && w.trim() !== ''
}

/** Een bestaande datum in de vorm JJJJ-MM-DD. */
export function isDatum(w: unknown): w is string {
  if (typeof w !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(w)) return false
  const [j, m, d] = w.split('-').map(Number)
  const datum = new Date(Date.UTC(j, m - 1, d))
  return datum.getUTCFullYear() === j && datum.getUTCMonth() === m - 1 && datum.getUTCDate() === d
}

class Controle {
  fouten: string[] = []

  fout(plek: string, bericht: string) {
    this.fouten.push(`${plek}: ${bericht}`)
  }

  tekst(item: Item, veld: string, plek: string) {
    if (!isTekst(item[veld])) this.fout(`${plek} › ${veld}`, 'moet een tekst zijn en mag niet leeg zijn')
  }

  optioneleTekst(item: Item, veld: string, plek: string) {
    if (item[veld] !== undefined) this.tekst(item, veld, plek)
  }

  keuze(item: Item, veld: string, toegestaan: string[], plek: string) {
    if (!toegestaan.includes(item[veld] as string)) {
      this.fout(`${plek} › ${veld}`, `"${String(item[veld])}" mag niet; kies uit ${toegestaan.join(', ')}`)
    }
  }

  bekendeVelden(item: Item, velden: string[], plek: string) {
    for (const veld of Object.keys(item)) {
      if (!velden.includes(veld)) this.fout(`${plek} › ${veld}`, 'onbekend veld (typefout?)')
    }
  }

  bron(item: Item, plek: string) {
    const bron = item.bron
    if (!isItem(bron)) return this.fout(`${plek} › bron`, 'ontbreekt; verwacht { label, url? }')
    this.bekendeVelden(bron, ['label', 'url'], `${plek} › bron`)
    this.tekst(bron, 'label', `${plek} › bron`)
    if (bron.url !== undefined && !(isTekst(bron.url) && /^https?:\/\//.test(bron.url))) {
      this.fout(`${plek} › bron › url`, 'moet beginnen met http:// of https://')
    }
  }

  /** Geeft de geldige items terug, met hun plek, en controleert id's op dubbelen. */
  lijst(waarde: unknown, bestand: string): { item: Item; plek: string }[] {
    if (!Array.isArray(waarde)) {
      this.fout(bestand, 'moet een lijst zijn: [ ... ]')
      return []
    }
    const gezien = new Set<string>()
    const items: { item: Item; plek: string }[] = []
    waarde.forEach((item, i) => {
      if (!isItem(item)) return this.fout(`${bestand} › item ${i + 1}`, 'moet een object zijn: { ... }')
      const plek = `${bestand} › ${isTekst(item.id) ? item.id : `item ${i + 1}`}`
      this.tekst(item, 'id', plek)
      if (isTekst(item.id)) {
        if (gezien.has(item.id)) this.fout(plek, 'dit id komt vaker voor')
        gezien.add(item.id)
      }
      items.push({ item, plek })
    })
    return items
  }
}

function controleerVraag(c: Controle, v: Item, plek: string, themas: Map<string, string>, kaartIds: Set<string>) {
  c.bekendeVelden(v, VRAAG_VELDEN, plek)
  c.keuze(v, 'type', VRAAGTYPES, plek)
  c.keuze(v, 'insteek', INSTEKEN, plek)
  c.keuze(v, 'status', STATUSSEN, plek)
  c.tekst(v, 'vraag', plek)
  c.tekst(v, 'waarom', plek)
  for (const veld of ['casus', 'mechanismeRegel', 'onthoud']) c.optioneleTekst(v, veld, plek)
  c.bron(v, plek)

  if (!Number.isInteger(v.versie) || (v.versie as number) < 1) {
    c.fout(`${plek} › versie`, 'moet een heel getal van 1 of hoger zijn')
  }

  c.optioneleTekst(v, 'gecontroleerdDoor', plek)
  for (const veld of DATUM_VELDEN) {
    if (v[veld] !== undefined && !isDatum(v[veld])) {
      c.fout(`${plek} › ${veld}`, `"${String(v[veld])}" is geen datum; gebruik JJJJ-MM-DD`)
    }
  }
  if (v.status === 'gecontroleerd') {
    for (const veld of ['gecontroleerdDoor', 'gecontroleerdOp']) {
      if (v[veld] === undefined) c.fout(`${plek} › ${veld}`, 'ontbreekt; verplicht bij status "gecontroleerd"')
    }
  }

  if (v.kaartId !== undefined && !kaartIds.has(v.kaartId as string)) {
    c.fout(`${plek} › kaartId`, `kaart "${String(v.kaartId)}" bestaat niet in kaarten.json`)
  }

  if (!Array.isArray(v.themaIds) || v.themaIds.length === 0) {
    c.fout(`${plek} › themaIds`, 'moet een lijst met minstens één thema zijn')
  } else {
    for (const id of v.themaIds) {
      if (!themas.has(id)) c.fout(`${plek} › themaIds`, `thema "${String(id)}" bestaat niet in themas.json`)
    }
    if (
      v.themaIds.every((id) => themas.has(id)) &&
      !v.themaIds.some((id) => themas.get(id) === v.insteek)
    ) {
      c.fout(`${plek} › themaIds`, `geen enkel thema hoort bij insteek "${String(v.insteek)}"`)
    }
  }

  if (!Array.isArray(v.opties) || v.opties.length !== OPTIE_IDS.length) {
    c.fout(`${plek} › opties`, `moet precies ${OPTIE_IDS.length} opties hebben`)
    return
  }
  const teksten = new Set<string>()
  v.opties.forEach((optie: unknown, i: number) => {
    const optiePlek = `${plek} › opties › ${OPTIE_IDS[i]}`
    if (!isItem(optie)) return c.fout(optiePlek, 'verwacht { id, tekst }')
    c.bekendeVelden(optie, ['id', 'tekst'], optiePlek)
    if (optie.id !== OPTIE_IDS[i]) c.fout(optiePlek, `id moet "${OPTIE_IDS[i]}" zijn`)
    c.tekst(optie, 'tekst', optiePlek)
    if (isTekst(optie.tekst)) {
      if (teksten.has(optie.tekst)) c.fout(optiePlek, 'deze tekst staat er twee keer')
      if (VERBODEN_OPTIE.test(optie.tekst)) c.fout(optiePlek, 'geen "alle bovenstaande" als antwoord')
      teksten.add(optie.tekst)
    }
  })
  if (!OPTIE_IDS.includes(v.juist as string)) {
    c.fout(`${plek} › juist`, `"${String(v.juist)}" is geen optie; kies uit ${OPTIE_IDS.join(', ')}`)
  }
}

export function valideerInhoud(ruw: RuweInhoud): string[] {
  const c = new Controle()

  const themas = new Map<string, string>()
  for (const { item, plek } of c.lijst(ruw.themas, 'themas.json')) {
    c.bekendeVelden(item, THEMA_VELDEN, plek)
    c.tekst(item, 'naam', plek)
    c.keuze(item, 'insteek', INSTEKEN, plek)
    if (isTekst(item.id)) themas.set(item.id, item.insteek as string)
  }

  const kaartIds = new Set<string>()
  for (const { item, plek } of c.lijst(ruw.kaarten, 'kaarten.json')) {
    c.bekendeVelden(item, KAART_VELDEN, plek)
    for (const veld of ['groep', 'aangrijpingspunt', 'directEffect', 'klinischEffect', 'afleidbareBijwerkingen']) {
      c.tekst(item, veld, plek)
    }
    c.optioneleTekst(item, 'letOp', plek)
    if (!Array.isArray(item.voorbeelden) || item.voorbeelden.length === 0 || !item.voorbeelden.every(isTekst)) {
      c.fout(`${plek} › voorbeelden`, 'moet een lijst met minstens één tekst zijn')
    }
    c.keuze(item, 'status', STATUSSEN, plek)
    c.bron(item, plek)
    if (isTekst(item.id)) kaartIds.add(item.id)
  }

  for (const { item, plek } of c.lijst(ruw.vragen, 'vragen.json')) {
    controleerVraag(c, item, plek, themas, kaartIds)
  }

  return c.fouten
}
