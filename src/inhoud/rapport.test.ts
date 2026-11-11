import { describe, expect, it } from 'vitest'
import { maakVraag } from '../logica/testhulp'
import type { MedicatiebewakingVraag, MeerkeuzeVraag, RekenVraag } from '../types'
import { inhoudWaarschuwingen, juisteIsLangste, maakRapport, rapportTekst } from './rapport'

function vraag(id: string, juist: string, lengtes = [5, 5, 5, 5], extra: Partial<MeerkeuzeVraag> = {}) {
  const opties = ['A', 'B', 'C', 'D'].map((l, i) => ({ id: l, tekst: `${l}${'x'.repeat(lengtes[i])}` }))
  return maakVraag(id, { opties, juist, ...extra })
}

/** Vier vragen, elk met een andere juiste letter: een nette verdeling. */
const evenwichtig = ['A', 'B', 'C', 'D'].map((l, i) => vraag(`v${i}`, l))

describe('juisteIsLangste', () => {
  it('telt alleen als de juiste optie strikt het langst is', () => {
    expect(juisteIsLangste(vraag('v', 'B', [3, 9, 4, 5]))).toBe(true)
    expect(juisteIsLangste(vraag('v', 'B', [9, 9, 4, 5]))).toBe(false)
    expect(juisteIsLangste(vraag('v', 'B', [3, 2, 4, 5]))).toBe(false)
  })
})

describe('maakRapport', () => {
  it('telt de letters en het aandeel langste', () => {
    const r = maakRapport([...evenwichtig, vraag('l', 'A', [9, 1, 1, 1])])
    expect(r).toMatchObject({ aantal: 5, langste: 1, perLetter: { A: 2, B: 1, C: 1, D: 1 } })
    expect(rapportTekst(r)).toEqual([
      'Juiste antwoord is het langste: 1 van 5 (20%).',
      'Juiste letter: A 2 (40%), B 1 (20%), C 1 (20%), D 1 (20%).',
    ])
  })

  it('laat reken- en medicatiebewakingsvragen buiten de letters, en telt de beslissingen', () => {
    const basis = { ...maakVraag('x'), opties: undefined, juist: undefined }
    const reken = { ...basis, id: 'r', type: 'reken', antwoord: 1, eenheid: 'mg', marge: 0 } as unknown as RekenVraag
    const bewaking = (id: string, juist: string) =>
      ({ ...basis, id, type: 'medicatiebewaking', juist }) as unknown as MedicatiebewakingVraag
    const r = maakRapport([...evenwichtig, reken, bewaking('m1', 'overleggen'), bewaking('m2', 'overleggen')])
    expect(r.aantal).toBe(4)
    expect(r.perBeslissing).toEqual({ afleveren: 0, 'afleveren-met-advies': 0, overleggen: 2, 'niet-afleveren': 0 })
    expect(rapportTekst(r).at(-1)).toBe(
      'Medicatiebewaking (2): afleveren 0, afleveren-met-advies 0, overleggen 2, niet-afleveren 0.',
    )
    expect(rapportTekst(maakRapport(evenwichtig))).toHaveLength(2)
  })
})

describe('inhoudWaarschuwingen', () => {
  it('geeft niets bij een nette verdeling', () => {
    expect(inhoudWaarschuwingen(evenwichtig, '2026-11-10')).toEqual([])
  })

  it('waarschuwt bij een verlopen herzienVoor, niet bij vandaag of later', () => {
    const lijst = [
      vraag('oud', 'A', undefined, { herzienVoor: '2026-11-09' }),
      vraag('vandaag', 'B', undefined, { herzienVoor: '2026-11-10' }),
      vraag('later', 'C', undefined, { herzienVoor: '2027-11-10' }),
      vraag('geen', 'D'),
    ]
    expect(inhoudWaarschuwingen(lijst, '2026-11-10')).toEqual([
      'vragen.json › oud › herzienVoor: 2026-11-09 is verlopen; kijk de vraag opnieuw na',
    ])
  })

  it('waarschuwt als het juiste antwoord te vaak het langste is', () => {
    const lijst = ['A', 'B', 'C', 'D'].map((l, i) => {
      const lengtes = [1, 1, 1, 1]
      lengtes[i] = 9
      return vraag(`v${i}`, l, lengtes)
    })
    expect(inhoudWaarschuwingen(lijst, '2026-11-10').join('\n')).toContain('te vaak het langste')
  })

  it('waarschuwt bij een scheve verdeling van de letters', () => {
    const lijst = [...evenwichtig, vraag('a1', 'A'), vraag('a2', 'A')]
    const tekst = inhoudWaarschuwingen(lijst, '2026-11-10').join('\n')
    expect(tekst).toContain('A is in 50%')
  })
})
