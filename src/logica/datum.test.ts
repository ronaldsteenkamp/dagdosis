import { describe, expect, it } from 'vitest'
import { dagenTussen, datumVan, maandagVan, plusDagen, weekdagIndex, weeknummer } from './datum'

describe('datum', () => {
  it('gebruikt de lokale datum, ook vlak voor middernacht', () => {
    expect(datumVan(new Date(2026, 10, 5, 23, 59))).toBe('2026-11-05')
    expect(datumVan(new Date(2026, 0, 1, 0, 1))).toBe('2026-01-01')
  })

  it('telt over maand, jaar en zomertijd heen', () => {
    expect(plusDagen('2026-12-31', 1)).toBe('2027-01-01')
    expect(plusDagen('2026-03-28', 2)).toBe('2026-03-30')
    expect(plusDagen('2026-10-24', 2)).toBe('2026-10-26')
    expect(dagenTussen('2026-03-28', '2026-03-30')).toBe(2)
  })

  it('begint de week op maandag', () => {
    expect(weekdagIndex('2026-11-02')).toBe(0)
    expect(weekdagIndex('2026-11-08')).toBe(6)
    expect(maandagVan('2026-11-08')).toBe('2026-11-02')
  })

  it('berekent ISO-weeknummers', () => {
    expect(weeknummer('2026-11-05')).toBe(45)
    expect(weeknummer('2026-01-01')).toBe(1)
    expect(weeknummer('2027-01-01')).toBe(53)
    expect(weeknummer('2024-12-30')).toBe(1)
  })
})
