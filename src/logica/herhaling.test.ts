import { describe, expect, it } from 'vitest'
import { geldigeVoortgang, gevolgTekst, planVolgende, verwerkAntwoord } from './herhaling'
import { maakVoortgang, maakVraag } from './testhulp'

describe('planVolgende', () => {
  it('fout: morgen opnieuw en terug naar bakje 1, ongeacht de zekerheid', () => {
    for (const z of ['zeker', 'twijfel', 'gok'] as const) {
      expect(planVolgende(5, false, z)).toEqual({ bakje: 1, dagen: 1 })
    }
  })

  it('goed maar gegokt: morgen opnieuw en terug naar bakje 1', () => {
    expect(planVolgende(4, true, 'gok')).toEqual({ bakje: 1, dagen: 1 })
  })

  it('goed met twijfel: over 3 dagen, bakje blijft gelijk', () => {
    expect(planVolgende(1, true, 'twijfel')).toEqual({ bakje: 1, dagen: 3 })
    expect(planVolgende(5, true, 'twijfel')).toEqual({ bakje: 5, dagen: 3 })
  })

  it('goed en zeker: een bakje hoger, volgens 1 → 3 → 7 → 14 → 30 → 60', () => {
    expect([1, 2, 3, 4, 5].map((b) => planVolgende(b, true, 'zeker'))).toEqual([
      { bakje: 2, dagen: 3 },
      { bakje: 3, dagen: 7 },
      { bakje: 4, dagen: 14 },
      { bakje: 5, dagen: 30 },
      { bakje: 6, dagen: 60 },
    ])
  })

  it('blijft in het hoogste bakje', () => {
    expect(planVolgende(6, true, 'zeker')).toEqual({ bakje: 6, dagen: 60 })
  })
})

describe('verwerkAntwoord', () => {
  const vraag = maakVraag('v')
  const antwoord = { datum: '2026-11-05', keuze: 'A', goed: true, zekerheid: 'zeker' as const }

  it('begint een nieuwe vraag in bakje 1 en legt de geschiedenis vast', () => {
    const v = verwerkAntwoord(vraag, undefined, antwoord)
    expect(v).toMatchObject({ vraagId: 'v', versie: 1, bakje: 2, volgendeDatum: '2026-11-08' })
    expect(v.geschiedenis).toEqual([antwoord])
  })

  it('bouwt voort op bestaande voortgang', () => {
    const v = verwerkAntwoord(vraag, maakVoortgang('v', '2026-11-05', { bakje: 3 }), antwoord)
    expect(v).toMatchObject({ bakje: 4, volgendeDatum: '2026-11-19' })
    expect(v.geschiedenis).toHaveLength(2)
  })

  it('begint opnieuw als de versie van de vraag is verhoogd', () => {
    const nieuw = maakVraag('v', { versie: 2 })
    const oud = maakVoortgang('v', '2027-01-01', { bakje: 6 })
    expect(geldigeVoortgang(nieuw, oud)).toBeUndefined()
    const v = verwerkAntwoord(nieuw, oud, antwoord)
    expect(v).toMatchObject({ versie: 2, bakje: 2 })
    expect(v.geschiedenis).toHaveLength(1)
  })
})

describe('gevolgTekst', () => {
  it('zegt morgen of het aantal dagen', () => {
    expect(gevolgTekst(1)).toBe('Deze vraag komt morgen terug.')
    expect(gevolgTekst(3)).toBe('Deze vraag komt over 3 dagen terug.')
  })
})
