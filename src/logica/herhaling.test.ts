import { describe, expect, it } from 'vitest'
import { geldigeVoortgang, gevolgTekst, planVolgende, teruggevallen, verwerkAntwoord } from './herhaling'
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

  it('goed en zeker: een bakje hoger, volgens 1 → 3 → 7 → 14 → 30 → 60 → 120 → 180', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((b) => planVolgende(b, true, 'zeker'))).toEqual([
      { bakje: 2, dagen: 3 },
      { bakje: 3, dagen: 7 },
      { bakje: 4, dagen: 14 },
      { bakje: 5, dagen: 30 },
      { bakje: 6, dagen: 60 },
      { bakje: 7, dagen: 120 },
      { bakje: 8, dagen: 180 },
    ])
  })

  it('blijft in het hoogste bakje', () => {
    expect(planVolgende(8, true, 'zeker')).toEqual({ bakje: 8, dagen: 180 })
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

describe('overgang naar bakjes van 120 en 180 dagen', () => {
  const vraag = maakVraag('v')
  // Opgeslagen toen bakje 6 nog het hoogste was: 60 dagen na 2026-09-01.
  const oud = maakVoortgang('v', '2026-10-31', { bakje: 6 })

  it('laat een eerder geplande datum staan', () => {
    expect(geldigeVoortgang(vraag, oud)).toBe(oud)
  })

  it('schuift bij goed door naar bakje 7, over 120 dagen', () => {
    const v = verwerkAntwoord(vraag, oud, { datum: '2026-10-31', keuze: 'A', goed: true, zekerheid: 'zeker' })
    expect(v).toMatchObject({ bakje: 7, volgendeDatum: '2027-02-28' })
    const verder = verwerkAntwoord(vraag, v, { datum: '2027-02-28', keuze: 'A', goed: true, zekerheid: 'zeker' })
    expect(verder).toMatchObject({ bakje: 8, volgendeDatum: '2027-08-27' })
  })

  it('valt bij fout nog steeds terug naar bakje 1', () => {
    const v = verwerkAntwoord(vraag, oud, { datum: '2026-10-31', keuze: 'B', goed: false, zekerheid: 'zeker' })
    expect(v).toMatchObject({ bakje: 1, volgendeDatum: '2026-11-01' })
  })
})

describe('teruggevallen', () => {
  const punt = (datum: string, goed: boolean) => ({ datum, keuze: goed ? 'A' : 'B', goed, zekerheid: 'zeker' as const })
  const vragen = ['a', 'b', 'c', 'd', 'e'].map((id) => maakVraag(id))
  const voortgang = {
    // eerst goed, toen fout: teruggevallen
    a: maakVoortgang('a', '2026-11-06', { geschiedenis: [punt('2026-10-01', true), punt('2026-11-05', false)] }),
    // eerst fout, toen goed: gewoon geleerd
    b: maakVoortgang('b', '2026-11-08', { geschiedenis: [punt('2026-10-01', false), punt('2026-10-02', true)] }),
    // teruggevallen en daarna weer goed
    c: maakVoortgang('c', '2026-11-08', {
      geschiedenis: [punt('2026-09-01', true), punt('2026-10-03', false), punt('2026-10-04', true)],
    }),
    // teruggevallen, maar in een oude versie
    d: maakVoortgang('d', '2026-11-06', { versie: 0, geschiedenis: [punt('2026-10-01', true), punt('2026-11-05', false)] }),
    // teruggevallen, eerder dan a
    e: maakVoortgang('e', '2026-11-06', { geschiedenis: [punt('2026-10-01', true), punt('2026-10-20', false)] }),
  }

  it('vindt vragen die na een goed antwoord fout gingen, open eerst en recent eerst', () => {
    expect(teruggevallen(vragen, voortgang).map((t) => [t.vraag.id, t.datum, t.hersteld])).toEqual([
      ['a', '2026-11-05', false],
      ['e', '2026-10-20', false],
      ['c', '2026-10-03', true],
    ])
  })

  it('is leeg zonder voortgang', () => {
    expect(teruggevallen(vragen, {})).toEqual([])
  })
})

describe('gevolgTekst', () => {
  it('zegt morgen of het aantal dagen', () => {
    expect(gevolgTekst(1)).toBe('Deze vraag komt morgen terug.')
    expect(gevolgTekst(3)).toBe('Deze vraag komt over 3 dagen terug.')
  })
})
