import { describe, expect, it } from 'vitest'
import type { Kaart, Reflectie, Thema } from '../types'
import { jarenMetGegevens, kalenderjaar, maakOverzicht } from './overzicht'
import { maakAntwoord, maakVraag } from './testhulp'

const themas: Thema[] = [
  { id: 'f1', naam: 'Farmacokinetiek', insteek: 'farmacologie' },
  { id: 'p1', naam: 'Zelfzorg', insteek: 'praktijk' },
  { id: 'p2', naam: 'Nierfunctie', insteek: 'praktijk' },
]
const kaarten = [{ id: 'statines', groep: 'Statines' }] as Kaart[]
const vragen = [maakVraag('v1', { kaartId: 'statines' }), maakVraag('v2'), maakVraag('v3', { themaIds: ['p1'] })]

const antwoorden = [
  maakAntwoord({ vraagId: 'v1', datum: '2025-12-31', duurMs: 99_000, themaIds: ['f1'] }),
  maakAntwoord({ vraagId: 'v1', datum: '2026-01-01', duurMs: 30_000, goed: true, themaIds: ['f1'] }),
  maakAntwoord({ vraagId: 'v1', datum: '2026-03-01', duurMs: 30_000, goed: false, themaIds: ['f1'] }),
  maakAntwoord({ vraagId: 'v2', datum: '2026-03-01', duurMs: 60_000, goed: true, themaIds: ['f1'] }),
  maakAntwoord({ vraagId: 'v3', datum: '2026-12-31', duurMs: 60_000, goed: false, themaIds: ['p1'] }),
]

const reflectie = (id: string, datum: string): Reflectie => ({
  id,
  datum,
  tijdstip: `${datum}T10:00:00Z`,
  soort: 'dagdosis',
  tekst: `Les van ${datum}`,
})

const overzicht = maakOverzicht({
  periode: kalenderjaar(2026),
  antwoorden,
  reflecties: [reflectie('b', '2026-03-01'), reflectie('a', '2025-06-01'), reflectie('c', '2026-01-01')],
  themas,
  vragen,
  kaarten,
})

describe('maakOverzicht', () => {
  it('telt alleen antwoorden binnen de periode, grenzen inbegrepen', () => {
    expect(overzicht).toMatchObject({
      leertijdMs: 180_000,
      aantalVragen: 4,
      aantalGoed: 2,
      aantalUniek: 3,
      aantalDagen: 3,
    })
  })

  it('geeft per thema het aantal en de score, zonder lege thema\'s', () => {
    expect(overzicht.perThema.map((r) => [r.thema.id, r.aantal, r.goed, r.score])).toEqual([
      ['f1', 3, 2, 67],
      ['p1', 1, 0, 0],
    ])
  })

  it('noemt de onderwerpen: kaartgroep, anders het eerste thema', () => {
    expect(overzicht.onderwerpen).toEqual([
      { naam: 'Statines', aantal: 2 },
      { naam: 'Farmacokinetiek', aantal: 1 },
      { naam: 'Zelfzorg', aantal: 1 },
    ])
  })

  it('neemt de reflecties uit de periode op, op volgorde', () => {
    expect(overzicht.reflecties.map((r) => r.id)).toEqual(['c', 'b'])
  })
})

describe('jarenMetGegevens', () => {
  it('geeft de jaren met antwoorden en het huidige jaar, nieuwste eerst', () => {
    expect(jarenMetGegevens(antwoorden, '2027-02-01')).toEqual([2027, 2026, 2025])
  })
})
