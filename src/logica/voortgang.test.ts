import { describe, expect, it } from 'vitest'
import type { Dosis, Thema } from '../types'
import { maakAntwoord, maakVoortgang, maakVraag } from './testhulp'
import {
  begrensDuur,
  berekenStreak,
  isAfgerond,
  leertijdDitJaarMs,
  maakLeerlogCsv,
  maakMeldingenCsv,
  morgenAandacht,
  percentageGoed,
  tellingGoed,
  themaScore,
  themaTelling,
  weekOverzicht,
} from './voortgang'

const VANDAAG = '2026-11-05'
const themas: Thema[] = [
  { id: 'f1', naam: 'Farmacokinetiek', insteek: 'farmacologie' },
  { id: 'p1', naam: 'Zelfzorg', insteek: 'praktijk' },
]

function maakDosis(datum: string, afgerond = true, goed = 4): Dosis {
  const vraagIds = ['a', 'b', 'c', 'd', 'e']
  return {
    datum,
    vraagIds,
    herhalingIds: [],
    resultaten: afgerond ? vraagIds.map((vraagId, i) => ({ vraagId, goed: i < goed })) : [],
  }
}

function dosissen(...datums: string[]) {
  return Object.fromEntries(datums.map((d) => [d, maakDosis(d)]))
}

describe('leertijd', () => {
  it('begrenst een vraag op 3 minuten', () => {
    expect(begrensDuur(30_000)).toBe(30_000)
    expect(begrensDuur(180_000)).toBe(180_000)
    expect(begrensDuur(9_000_000)).toBe(180_000)
    expect(begrensDuur(-5)).toBe(0)
  })

  it('telt alleen dit kalenderjaar', () => {
    const antwoorden = [
      maakAntwoord({ datum: '2025-12-31', duurMs: 1000 }),
      maakAntwoord({ datum: '2026-01-01', duurMs: 2000 }),
      maakAntwoord({ datum: VANDAAG, duurMs: 3000 }),
    ]
    expect(leertijdDitJaarMs(antwoorden, VANDAAG)).toBe(5000)
  })
})

describe('scores', () => {
  it('rekent het percentage over precies de laatste 30 dagen', () => {
    const antwoorden = [
      maakAntwoord({ datum: '2026-10-06', goed: false }), // dag 31, valt erbuiten
      maakAntwoord({ datum: '2026-10-07', goed: true }), // dag 30
      maakAntwoord({ datum: VANDAAG, goed: false }),
    ]
    expect(percentageGoed(antwoorden, VANDAAG)).toBe(50)
    expect(tellingGoed(antwoorden, VANDAAG)).toEqual({ goed: 1, totaal: 2 })
  })

  it('telt per thema dezelfde 20 antwoorden als het percentage', () => {
    const antwoorden = [
      ...Array.from({ length: 5 }, () => maakAntwoord({ goed: false })),
      ...Array.from({ length: 20 }, (_, i) => maakAntwoord({ goed: i < 15 })),
    ]
    expect(themaTelling(antwoorden, 'f1')).toEqual({ goed: 15, totaal: 20 })
    expect(themaScore(antwoorden, 'f1')).toBe(75)
    expect(themaTelling(antwoorden, 'p1')).toEqual({ goed: 0, totaal: 0 })
  })

  it('geeft null zonder antwoorden', () => {
    expect(percentageGoed([], VANDAAG)).toBeNull()
    expect(themaScore([], 'f1')).toBeNull()
  })

  it('rekent per thema over de laatste 20 antwoorden', () => {
    const antwoorden = [
      ...Array.from({ length: 5 }, () => maakAntwoord({ goed: false })),
      ...Array.from({ length: 20 }, () => maakAntwoord({ goed: true })),
      maakAntwoord({ goed: false, themaIds: ['p1'] }),
    ]
    expect(themaScore(antwoorden, 'f1')).toBe(100)
    expect(themaScore(antwoorden, 'p1')).toBe(0)
  })

  it('telt een vraag mee bij al zijn thema\'s', () => {
    const antwoorden = [maakAntwoord({ themaIds: ['f1', 'p1'] })]
    expect([themaScore(antwoorden, 'f1'), themaScore(antwoorden, 'p1')]).toEqual([100, 100])
  })
})

describe('streak', () => {
  it('telt dagen op rij inclusief vandaag', () => {
    expect(berekenStreak(dosissen('2026-11-03', '2026-11-04', VANDAAG), VANDAAG)).toBe(3)
  })

  it('breekt niet zolang vandaag nog kan', () => {
    expect(berekenStreak(dosissen('2026-11-03', '2026-11-04'), VANDAAG)).toBe(2)
  })

  it('stopt bij een gemiste dag', () => {
    expect(berekenStreak(dosissen('2026-11-01', '2026-11-03', '2026-11-04'), VANDAAG)).toBe(2)
    expect(berekenStreak(dosissen('2026-11-01', '2026-11-03'), VANDAAG)).toBe(0)
  })

  it('telt alleen helemaal afgeronde dosissen', () => {
    const half: Dosis = { ...maakDosis(VANDAAG), resultaten: [{ vraagId: 'a', goed: true }] }
    expect(isAfgerond(half)).toBe(false)
    expect(berekenStreak({ ...dosissen('2026-11-04'), [VANDAAG]: half }, VANDAAG)).toBe(1)
  })

  it('telt een lege dosis niet als afgerond', () => {
    expect(isAfgerond({ datum: VANDAAG, vraagIds: [], herhalingIds: [], resultaten: [] })).toBe(false)
  })

  it('loopt door over een jaarwisseling', () => {
    expect(berekenStreak(dosissen('2026-12-31', '2027-01-01'), '2027-01-01')).toBe(2)
  })
})

describe('weekOverzicht', () => {
  it('toont ma t/m zo met de score van afgeronde dagen', () => {
    const week = weekOverzicht(
      { '2026-11-02': maakDosis('2026-11-02', true, 3), [VANDAAG]: maakDosis(VANDAAG, false) },
      VANDAAG,
    )
    expect(week.map((d) => d.datum)).toEqual([
      '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08',
    ])
    expect(week[0]).toMatchObject({ goed: 3, totaal: 5 })
    expect(week[3].goed).toBeNull()
  })
})

describe('morgenAandacht', () => {
  const vragen = [
    maakVraag('a'),
    maakVraag('b'),
    maakVraag('c', { themaIds: ['p1'] }),
    maakVraag('d', { themaIds: ['p1'] }),
  ]

  it('telt herhalingen tot en met morgen, per thema', () => {
    const voortgang = {
      a: maakVoortgang('a', '2026-11-06'),
      b: maakVoortgang('b', VANDAAG),
      c: maakVoortgang('c', '2026-11-06'),
      d: maakVoortgang('d', '2026-11-07'),
    }
    expect(morgenAandacht(vragen, themas, voortgang, [], VANDAAG)).toEqual([
      '2 herhalingen uit Farmacokinetiek',
      '1 herhaling uit Zelfzorg',
    ])
  })

  it('noemt zwakke thema\'s', () => {
    const antwoorden = [maakAntwoord({ goed: false }), maakAntwoord({ goed: true }), maakAntwoord({ goed: false })]
    expect(morgenAandacht(vragen, themas, {}, antwoorden, VANDAAG)).toEqual(['Farmacokinetiek staat op 33%'])
  })

  it('is leeg als er niets is', () => {
    expect(morgenAandacht(vragen, themas, {}, [], VANDAAG)).toEqual([])
  })
})

describe('leerlog', () => {
  it('maakt per dag een regel met tijd, aantallen en thema\'s', () => {
    const csv = maakLeerlogCsv(
      [
        maakAntwoord({ datum: '2026-11-05', duurMs: 90_000, goed: true, themaIds: ['p1'] }),
        maakAntwoord({ datum: '2026-11-04', duurMs: 60_000, goed: false }),
        maakAntwoord({ datum: '2026-11-05', duurMs: 30_000, goed: false, themaIds: ['f1', 'p1'] }),
      ],
      themas,
    )
    expect(csv.replace('﻿', '').trim().split('\r\n')).toEqual([
      "Datum;Tijd besteed (min);Aantal vragen;Aantal goed;Thema's;Reflectie",
      '2026-11-04;1,0;1;0;Farmacokinetiek;',
      '2026-11-05;2,0;2;1;Farmacokinetiek, Zelfzorg;',
    ])
  })

  it('zet de reflecties van een dag in de laatste kolom', () => {
    const r = (id: string, datum: string, tijdstip: string, tekst: string) =>
      ({ id, datum, tijdstip, soort: 'test' as const, tekst })
    const csv = maakLeerlogCsv(
      [maakAntwoord({ datum: '2026-11-05', duurMs: 60_000 })],
      themas,
      [r('b', '2026-11-05', '2026-11-05T12:00:00Z', 'Later'), r('a', '2026-11-05', '2026-11-05T09:00:00Z', 'Eerst; met puntkomma')],
    )
    expect(csv).toContain('2026-11-05;1,0;1;1;Farmacokinetiek;"Eerst; met puntkomma | Later"')
  })

  it('begint met een BOM, zodat Excel de tekens goed leest', () => {
    expect(maakLeerlogCsv([], themas).startsWith('﻿')).toBe(true)
  })

  it('zet tekst met scheidingstekens tussen aanhalingstekens', () => {
    const csv = maakMeldingenCsv([
      { id: 'm', datum: VANDAAG, vraagId: 'v', versie: 1, notitie: 'Klopt "niet"; zie\nregel 2' },
    ])
    expect(csv).toContain('2026-11-05;v;1;;"Klopt ""niet""; zie\nregel 2"')
  })

  it('zet de gekozen optie bij een melding', () => {
    const csv = maakMeldingenCsv([{ id: 'm', datum: VANDAAG, vraagId: 'v', versie: 2, keuze: 'C', notitie: 'x' }])
    expect(csv).toContain('Datum;Vraag;Versie;Gekozen;Notitie')
    expect(csv).toContain('2026-11-05;v;2;C;x')
  })
})
