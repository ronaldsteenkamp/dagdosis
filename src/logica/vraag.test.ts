import { describe, expect, it } from 'vitest'
import type { MedicatiebewakingVraag, RekenVraag } from '../types'
import { maakVraag } from './testhulp'
import { isGoed, juisteKeuze, juistTekst, keuzeTekst, leesGetal, optiesVan } from './vraag'

const basis = {
  insteek: 'praktijk' as const,
  themaIds: ['p1'],
  vraag: 'Vraag?',
  waarom: 'Daarom.',
  bron: { label: 'Testbron' },
  status: 'concept' as const,
  versie: 1,
}

// Testvragen voor de werking van de code, geen inhoud: de getallen betekenen niets.
const reken: RekenVraag = { ...basis, id: 'r', type: 'reken', antwoord: 52, eenheid: 'ml/min', marge: 2 }
const precies: RekenVraag = { ...reken, id: 'p', antwoord: 0.3, marge: 0 }
const bewaking: MedicatiebewakingVraag = { ...basis, id: 'm', type: 'medicatiebewaking', juist: 'overleggen' }

describe('leesGetal', () => {
  it.each([
    ['52', 52],
    [' 52,5 ', 52.5],
    ['0.25', 0.25],
    [',5', 0.5],
    ['-3', -3],
    ['1 000', 1000],
  ])('leest %j als %d', (tekst, getal) => {
    expect(leesGetal(tekst)).toBe(getal)
  })

  it.each(['', 'abc', '5 mg', '1,2,3', '1e3', '--1'])('weigert %j', (tekst) => {
    expect(leesGetal(tekst)).toBeNull()
  })
})

describe('rekenvraag', () => {
  it('is goed binnen de marge, grenzen inbegrepen', () => {
    expect(['50', '52', '54', '53,9'].map((k) => isGoed(reken, k))).toEqual([true, true, true, true])
    expect(['49,9', '54,1', 'abc', ''].map((k) => isGoed(reken, k))).toEqual([false, false, false, false])
  })

  it('rekent zonder last van afrondingsruis', () => {
    expect(isGoed(precies, String(0.1 + 0.2))).toBe(true)
    expect(isGoed(precies, '0,31')).toBe(false)
  })

  it('heeft geen opties en toont getallen met een komma', () => {
    expect(optiesVan(reken)).toEqual([])
    expect(juisteKeuze(reken)).toBe('52')
    expect(keuzeTekst(reken, '51.5')).toBe('51,5 ml/min')
    expect(juistTekst(reken)).toBe('52 ml/min (goed tussen 50 en 54 ml/min)')
    expect(juistTekst(precies)).toBe('0,3 ml/min')
  })
})

describe('medicatiebewaking', () => {
  it('heeft altijd dezelfde vier opties, in dezelfde volgorde', () => {
    expect(optiesVan(bewaking)).toEqual([
      { id: 'A', tekst: 'Afleveren' },
      { id: 'B', tekst: 'Afleveren met advies' },
      { id: 'C', tekst: 'Overleggen met voorschrijver' },
      { id: 'D', tekst: 'Niet afleveren' },
    ])
  })

  it('zet de beslissing om naar een letter', () => {
    expect(juisteKeuze(bewaking)).toBe('C')
    expect(isGoed(bewaking, 'C')).toBe(true)
    expect(isGoed(bewaking, 'B')).toBe(false)
    expect(juistTekst(bewaking)).toBe('C. Overleggen met voorschrijver')
  })
})

describe('meerkeuze', () => {
  it('werkt zoals voorheen', () => {
    const v = maakVraag('v', { juist: 'B', opties: ['A', 'B', 'C', 'D'].map((id) => ({ id, tekst: `Optie ${id}` })) })
    expect(isGoed(v, 'B')).toBe(true)
    expect(isGoed(v, 'A')).toBe(false)
    expect(juistTekst(v)).toBe('B. Optie B')
    expect(keuzeTekst(v, 'D')).toBe('D. Optie D')
  })
})
