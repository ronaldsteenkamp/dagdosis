import { openDB, type DBSchema } from 'idb'
import type { Antwoord, Dosis, Instellingen, Melding, VraagVoortgang } from './types'

interface Schema extends DBSchema {
  voortgang: { key: string; value: VraagVoortgang }
  antwoorden: { key: string; value: Antwoord }
  dosissen: { key: string; value: Dosis }
  meldingen: { key: string; value: Melding }
  instellingen: { key: string; value: Instellingen }
}

const INSTELLINGEN_SLEUTEL = 'instellingen'

const db = () =>
  openDB<Schema>('dagdosis', 1, {
    upgrade(d) {
      d.createObjectStore('voortgang', { keyPath: 'vraagId' })
      d.createObjectStore('antwoorden', { keyPath: 'id' })
      d.createObjectStore('dosissen', { keyPath: 'datum' })
      d.createObjectStore('meldingen', { keyPath: 'id' })
      d.createObjectStore('instellingen')
    },
  })

export async function laadAlles() {
  const d = await db()
  const [voortgang, antwoorden, dosissen, meldingen, instellingen] = await Promise.all([
    d.getAll('voortgang'),
    d.getAll('antwoorden'),
    d.getAll('dosissen'),
    d.getAll('meldingen'),
    d.get('instellingen', INSTELLINGEN_SLEUTEL),
  ])
  return {
    voortgang: Object.fromEntries(voortgang.map((v) => [v.vraagId, v])),
    antwoorden: antwoorden.sort((a, b) => a.tijdstip.localeCompare(b.tijdstip)),
    dosissen: Object.fromEntries(dosissen.map((x) => [x.datum, x])),
    meldingen,
    instellingen,
  }
}

/** Slaat één beantwoorde vraag in één keer op: alles of niets. */
export async function bewaarAntwoord(voortgang: VraagVoortgang, antwoord: Antwoord, dosis?: Dosis) {
  const d = await db()
  const tx = d.transaction(['voortgang', 'antwoorden', 'dosissen'], 'readwrite')
  await Promise.all([
    tx.objectStore('voortgang').put(voortgang),
    tx.objectStore('antwoorden').put(antwoord),
    dosis && tx.objectStore('dosissen').put(dosis),
    tx.done,
  ])
}

export async function bewaarDosis(dosis: Dosis) {
  await (await db()).put('dosissen', dosis)
}

export async function bewaarMelding(melding: Melding) {
  await (await db()).put('meldingen', melding)
}

export async function bewaarInstellingen(instellingen: Instellingen) {
  await (await db()).put('instellingen', instellingen, INSTELLINGEN_SLEUTEL)
}
