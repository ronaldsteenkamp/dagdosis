// Volledige back-up: alle gegevens van het toestel in één JSON-bestand.
// Het formaatnummer gaat omhoog als de opbouw verandert; oudere formaten blijven inleesbaar
// zolang zetOm ze kan omzetten.
import type { Gegevens } from '../types'
import { dagenTussen, type Datum } from './datum'

export const BACKUP_FORMAAT = 1
export const BACKUP_HERINNERING_DAGEN = 30

export interface Backup {
  app: 'dagdosis'
  formaat: number
  gemaaktOp: string
  gegevens: Gegevens
}

export function maakBackup(gegevens: Gegevens, moment = new Date()): Backup {
  return { app: 'dagdosis', formaat: BACKUP_FORMAAT, gemaaktOp: moment.toISOString(), gegevens }
}

export function backupBestandsnaam(vandaag: Datum) {
  return `dagdosis-backup-${vandaag}.json`
}

// ——— Controle bij het inlezen ———

type Item = Record<string, unknown>
const ZEKERHEDEN = ['zeker', 'twijfel', 'gok']
const INSTEKEN = ['farmacologie', 'praktijk', 'gemengd']
const FREQUENTIES = ['vaak', 'normaal', 'af-en-toe', 'uit']
const DATUM = /^\d{4}-\d{2}-\d{2}$/

const isItem = (w: unknown): w is Item => typeof w === 'object' && w !== null && !Array.isArray(w)
const isTekst = (w: unknown): w is string => typeof w === 'string'
const isDatum = (w: unknown) => isTekst(w) && DATUM.test(w)
const isGeheel = (w: unknown, min = 0) => Number.isInteger(w) && (w as number) >= min
const isTekstLijst = (w: unknown) => Array.isArray(w) && w.every(isTekst)

/** Per soort record: welke velden er moeten zijn en wat ze mogen bevatten. */
const REGELS: Record<string, Record<string, (w: unknown) => boolean>> = {
  historie: {
    datum: isDatum,
    keuze: isTekst,
    goed: (w) => typeof w === 'boolean',
    zekerheid: (w) => ZEKERHEDEN.includes(w as string),
  },
  resultaat: { vraagId: isTekst, goed: (w) => typeof w === 'boolean' },
}

function voldoet(item: unknown, regels: Record<string, (w: unknown) => boolean>) {
  return isItem(item) && Object.entries(regels).every(([veld, ok]) => ok(item[veld]))
}

const isAntwoord = (w: unknown) =>
  voldoet(w, {
    ...REGELS.historie,
    id: isTekst,
    tijdstip: isTekst,
    vraagId: isTekst,
    versie: (x) => isGeheel(x, 1),
    duurMs: (x) => typeof x === 'number' && x >= 0,
    themaIds: isTekstLijst,
  })

const isVoortgang = (w: unknown) =>
  voldoet(w, {
    vraagId: isTekst,
    versie: (x) => isGeheel(x, 1),
    bakje: (x) => isGeheel(x, 1),
    volgendeDatum: isDatum,
    geschiedenis: (x) => Array.isArray(x) && x.every((h) => voldoet(h, REGELS.historie)),
  })

const isDosis = (w: unknown) =>
  voldoet(w, {
    datum: isDatum,
    vraagIds: isTekstLijst,
    herhalingIds: isTekstLijst,
    resultaten: (x) => Array.isArray(x) && x.every((r) => voldoet(r, REGELS.resultaat)),
  })

const isMelding = (w: unknown) =>
  voldoet(w, {
    id: isTekst,
    datum: isDatum,
    vraagId: isTekst,
    versie: (x) => isGeheel(x, 1),
    notitie: isTekst,
    keuze: (x) => x === undefined || isTekst(x),
  })

const isInstellingen = (w: unknown) =>
  voldoet(w, {
    insteek: (x) => INSTEKEN.includes(x as string),
    ritme: (x) => typeof x === 'boolean',
    uitlegMetMechanisme: (x) => typeof x === 'boolean',
    bijsturen: (x) => typeof x === 'boolean',
    themaFrequentie: (x) => isItem(x) && Object.values(x).every((f) => FREQUENTIES.includes(f as string)),
  })

const isMeta = (w: unknown) =>
  isItem(w) && Object.values(w).every((x) => x === undefined || isDatum(x))

/** Oudere formaten omzetten naar het huidige. Er is nu alleen formaat 1. */
function zetOm(ruw: Item): Item {
  return ruw
}

export type Inlezen = { ok: true; backup: Backup } | { ok: false; fout: string }

export function leesBackup(tekst: string): Inlezen {
  let ruw: unknown
  try {
    ruw = JSON.parse(tekst)
  } catch {
    return { ok: false, fout: 'Dit is geen geldig JSON-bestand.' }
  }
  if (!isItem(ruw) || ruw.app !== 'dagdosis') {
    return { ok: false, fout: 'Dit is geen back-up van Dagdosis.' }
  }
  if (!isGeheel(ruw.formaat, 1)) return { ok: false, fout: 'Het formaatnummer ontbreekt.' }
  if ((ruw.formaat as number) > BACKUP_FORMAAT) {
    return { ok: false, fout: 'Deze back-up komt uit een nieuwere versie van de app. Werk de app eerst bij.' }
  }

  const b = zetOm(ruw)
  const g = b.gegevens
  if (!isItem(g)) return { ok: false, fout: 'De gegevens ontbreken.' }

  const fouten: string[] = []
  // Antwoorden en meldingen zijn een lijst, voortgang en dosissen een object per vraag of dag.
  const lijst = (veld: string, ok: (w: unknown) => boolean, naam: string, alsLijst: boolean) => {
    const waarde = g[veld]
    if (alsLijst ? !Array.isArray(waarde) : !isItem(waarde)) return fouten.push(`${naam}: ontbreekt`)
    const items = Object.values(waarde)
    const fout = items.findIndex((x) => !ok(x))
    if (fout >= 0) fouten.push(`${naam}: record ${fout + 1} klopt niet`)
  }
  lijst('voortgang', isVoortgang, 'Voortgang', false)
  lijst('antwoorden', isAntwoord, 'Antwoorden', true)
  lijst('dosissen', isDosis, 'Dosissen', false)
  lijst('meldingen', isMelding, 'Meldingen', true)
  if (!isInstellingen(g.instellingen)) fouten.push('Instellingen: klopt niet')
  if (g.meta !== undefined && !isMeta(g.meta)) fouten.push('Meta: klopt niet')
  if (fouten.length > 0) return { ok: false, fout: `De back-up is beschadigd: ${fouten.join('; ')}.` }

  return {
    ok: true,
    backup: {
      app: 'dagdosis',
      formaat: BACKUP_FORMAAT,
      gemaaktOp: isTekst(b.gemaaktOp) ? b.gemaaktOp : '',
      gegevens: { ...(g as unknown as Gegevens), meta: (g.meta as Gegevens['meta']) ?? {} },
    },
  }
}

/** Korte samenvatting voor de bevestigingsvraag. */
export function backupSamenvatting(b: Backup) {
  const g = b.gegevens
  const dagen = new Set(g.antwoorden.map((a) => a.datum)).size
  return {
    gemaaktOp: b.gemaaktOp.slice(0, 10),
    antwoorden: g.antwoorden.length,
    dagen,
    meldingen: g.meldingen.length,
  }
}

/** Tekst voor de herinnering in Voortgang, of null als er niets te melden is. */
export function backupHerinnering(laatsteBackupOp: Datum | undefined, vandaag: Datum, heeftGegevens: boolean) {
  if (!heeftGegevens) return null
  if (!laatsteBackupOp) return 'Je hebt nog nooit een back-up gemaakt.'
  const dagen = dagenTussen(laatsteBackupOp, vandaag)
  return dagen > BACKUP_HERINNERING_DAGEN ? `Je laatste back-up is ${dagen} dagen oud.` : null
}
