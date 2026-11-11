import { describe, expect, it } from 'vitest'
import type { Gegevens } from '../types'
import { backupHerinnering, backupSamenvatting, leesBackup, maakBackup } from './backup'
import { maakAntwoord, maakInstellingen, maakVoortgang } from './testhulp'

const gegevens: Gegevens = {
  voortgang: { v1: maakVoortgang('v1', '2026-11-08') },
  antwoorden: [maakAntwoord({ id: 'a1' }), maakAntwoord({ id: 'a2', datum: '2026-11-06' })],
  dosissen: {
    '2026-11-05': { datum: '2026-11-05', vraagIds: ['v1'], herhalingIds: [], resultaten: [{ vraagId: 'v1', goed: true }] },
  },
  meldingen: [{ id: 'm1', datum: '2026-11-05', vraagId: 'v1', versie: 1, notitie: 'Klopt niet', keuze: 'B' }],
  reflecties: [
    { id: 'dagdosis-2026-11-05', datum: '2026-11-05', tijdstip: '2026-11-05T12:00:00Z', soort: 'dagdosis', tekst: 'Let op nierfunctie' },
  ],
  instellingen: maakInstellingen({ themaFrequentie: { f1: 'vaak' } }),
  meta: { welkomGezienOp: '2026-11-01' },
}

const tekst = (b: unknown) => JSON.stringify(b)
const geldig = () => JSON.parse(tekst(maakBackup(gegevens, new Date('2026-11-10T09:00:00Z'))))

describe('back-up', () => {
  it('leest een eigen back-up ongewijzigd terug', () => {
    const uit = leesBackup(tekst(maakBackup(gegevens)))
    expect(uit.ok && uit.backup.gegevens).toEqual(gegevens)
  })

  it('zet een formaatnummer en de app-naam in het bestand', () => {
    expect(geldig()).toMatchObject({ app: 'dagdosis', formaat: 2, gemaaktOp: '2026-11-10T09:00:00.000Z' })
  })

  it('zet een back-up van formaat 1 om: zonder reflecties', () => {
    const b = geldig()
    b.formaat = 1
    delete b.gegevens.reflecties
    const uit = leesBackup(tekst(b))
    expect(uit.ok && uit.backup.formaat).toBe(2)
    expect(uit.ok && uit.backup.gegevens.reflecties).toEqual([])
  })

  it('vult een ontbrekende meta aan', () => {
    const b = geldig()
    delete b.gegevens.meta
    const uit = leesBackup(tekst(b))
    expect(uit.ok && uit.backup.gegevens.meta).toEqual({})
  })

  it.each([
    ['geen JSON', 'hallo', 'geen geldig JSON'],
    ['ander bestand', tekst({ naam: 'iets' }), 'geen back-up van Dagdosis'],
    ['geen formaat', tekst({ ...geldig(), formaat: undefined }), 'formaatnummer'],
    ['nieuwer formaat', tekst({ ...geldig(), formaat: 99 }), 'nieuwere versie'],
    ['geen gegevens', tekst({ ...geldig(), gegevens: null }), 'gegevens ontbreken'],
  ])('weigert: %s', (_naam, invoer, melding) => {
    const uit = leesBackup(invoer)
    expect(uit.ok).toBe(false)
    expect(!uit.ok && uit.fout).toContain(melding)
  })

  it.each([
    ['antwoord zonder id', (b: any) => delete b.gegevens.antwoorden[1].id, 'Antwoorden: record 2'],
    ['voortgang met bakje 0', (b: any) => (b.gegevens.voortgang.v1.bakje = 0), 'Voortgang'],
    ['dosis met verkeerde datum', (b: any) => (b.gegevens.dosissen['2026-11-05'].datum = '5-11-2026'), 'Dosissen'],
    ['melding zonder notitie', (b: any) => delete b.gegevens.meldingen[0].notitie, 'Meldingen'],
    ['onbekende insteek', (b: any) => (b.gegevens.instellingen.insteek = 'alles'), 'Instellingen'],
    ['dosissen als lijst', (b: any) => (b.gegevens.dosissen = []), 'Dosissen: ontbreekt'],
    ['reflectie van onbekende soort', (b: any) => (b.gegevens.reflecties[0].soort = 'cursus'), 'Reflecties'],
    ['formaat 2 zonder reflecties', (b: any) => delete b.gegevens.reflecties, 'Reflecties: ontbreekt'],
    ['ontbrekende antwoorden', (b: any) => delete b.gegevens.antwoorden, 'Antwoorden: ontbreekt'],
  ])('vindt een beschadigde back-up: %s', (_naam, beschadig, melding) => {
    const b = geldig()
    beschadig(b)
    const uit = leesBackup(tekst(b))
    expect(!uit.ok && uit.fout).toContain(melding)
  })

  it('vat de inhoud samen voor de bevestiging', () => {
    const uit = leesBackup(tekst(geldig()))
    expect(uit.ok && backupSamenvatting(uit.backup)).toEqual({
      gemaaktOp: '2026-11-10',
      antwoorden: 2,
      dagen: 2,
      meldingen: 1,
      reflecties: 1,
    })
  })
})

describe('backupHerinnering', () => {
  it('zwijgt zolang er niets te bewaren is', () => {
    expect(backupHerinnering(undefined, '2026-11-10', false)).toBeNull()
  })

  it('meldt dat er nooit een back-up is gemaakt', () => {
    expect(backupHerinnering(undefined, '2026-11-10', true)).toContain('nog nooit')
  })

  it('meldt een back-up van meer dan 30 dagen oud', () => {
    expect(backupHerinnering('2026-10-11', '2026-11-10', true)).toBeNull()
    expect(backupHerinnering('2026-10-10', '2026-11-10', true)).toBe('Je laatste back-up is 31 dagen oud.')
  })
})
