import { describe, expect, it } from 'vitest'
import type { Instellingen, Vraag, VraagVoortgang } from '../types'
import { herhalingenVoor, insteekVanDag, maakRng, spreidKaarten, stelDosisSamen, themaGewicht } from './dagdosis'
import { maakAntwoord, maakInstellingen, maakVoortgang, maakVraag } from './testhulp'

const DATUM = '2026-11-05' // een donderdag

const farma = Array.from({ length: 10 }, (_, i) => maakVraag(`f${i}`))
const praktijk = Array.from({ length: 10 }, (_, i) =>
  maakVraag(`p${i}`, { insteek: 'praktijk', themaIds: ['p1'] }),
)
const alle = [...farma, ...praktijk]

function dosis(extra: {
  vragen?: Vraag[]
  voortgang?: Record<string, VraagVoortgang>
  instellingen?: Partial<Instellingen>
  datum?: string
  antwoorden?: ReturnType<typeof maakAntwoord>[]
} = {}) {
  return stelDosisSamen({
    datum: extra.datum ?? DATUM,
    vragen: extra.vragen ?? alle,
    voortgang: extra.voortgang ?? {},
    antwoorden: extra.antwoorden ?? [],
    instellingen: maakInstellingen(extra.instellingen),
  })
}

const aantalFarma = (ids: string[]) => ids.filter((id) => id.startsWith('f')).length

describe('verhouding', () => {
  it.each([
    ['farmacologie', 5],
    ['gemengd', 2],
    ['praktijk', 0],
  ] as const)('%s geeft %i farmacologievragen van de 5', (insteek, aantal) => {
    const d = dosis({ instellingen: { insteek } })
    expect(d.vraagIds).toHaveLength(5)
    expect(aantalFarma(d.vraagIds)).toBe(aantal)
  })

  it('ritme: ma en do farmacologie, de andere dagen praktijk', () => {
    const i = maakInstellingen({ ritme: true, insteek: 'gemengd' })
    expect(insteekVanDag(i, '2026-11-02')).toBe('farmacologie')
    expect(insteekVanDag(i, '2026-11-05')).toBe('farmacologie')
    for (const dag of ['03', '04', '06', '07', '08']) {
      expect(insteekVanDag(i, `2026-11-${dag}`)).toBe('praktijk')
    }
  })

  it('telt herhalingen mee in de verhouding', () => {
    const voortgang = {
      f0: maakVoortgang('f0', DATUM),
      f1: maakVoortgang('f1', DATUM),
    }
    const d = dosis({ voortgang })
    expect(d.herhalingIds.sort()).toEqual(['f0', 'f1'])
    expect(aantalFarma(d.vraagIds)).toBe(2)
    expect(d.vraagIds).toHaveLength(5)
  })

  it('blijft op 5 als herhalingen de verhouding overschrijden', () => {
    const voortgang = Object.fromEntries(['f0', 'f1', 'f2'].map((id) => [id, maakVoortgang(id, DATUM)]))
    const d = dosis({ voortgang })
    expect(d.vraagIds).toHaveLength(5)
    expect(aantalFarma(d.vraagIds)).toBe(3)
  })
})

describe('herhalingen', () => {
  it('gaan voor, met een maximum van 5; de rest schuift door', () => {
    const voortgang = Object.fromEntries(
      alle.slice(0, 7).map((v) => [v.id, maakVoortgang(v.id, '2026-11-01')]),
    )
    const d = dosis({ voortgang })
    expect(d.vraagIds).toHaveLength(5)
    expect(d.herhalingIds).toHaveLength(5)
    expect(herhalingenVoor(alle, voortgang, DATUM)).toHaveLength(7)
  })

  it('zetten fout en gegokt vooraan, daarna het langst wachtend', () => {
    const voortgang = {
      f0: maakVoortgang('f0', '2026-10-01'),
      f1: maakVoortgang('f1', DATUM, { goed: false }),
      f2: maakVoortgang('f2', '2026-11-04', { zekerheid: 'gok' }),
    }
    expect(herhalingenVoor(alle, voortgang, DATUM).map((v) => v.id)).toEqual(['f2', 'f1', 'f0'])
  })

  it('negeren vragen die nog niet aan de beurt zijn', () => {
    const d = dosis({ voortgang: { f0: maakVoortgang('f0', '2026-11-06') } })
    expect(d.herhalingIds).toEqual([])
  })

  it('tellen niet meer mee na een nieuwe versie van de vraag', () => {
    const vragen = alle.map((v) => (v.id === 'f0' ? { ...v, versie: 2 } : v))
    const d = dosis({ vragen, voortgang: { f0: maakVoortgang('f0', DATUM) } })
    expect(d.herhalingIds).toEqual([])
  })

  it('gaan ook voor als hun thema uit staat', () => {
    const d = dosis({
      voortgang: { f0: maakVoortgang('f0', DATUM, { goed: false }) },
      instellingen: { themaFrequentie: { f1: 'uit' } },
    })
    expect(d.herhalingIds).toEqual(['f0'])
  })
})

describe('aanvullen', () => {
  it('geeft voorrang aan vragen die nog niet gezien zijn', () => {
    const voortgang = Object.fromEntries(
      farma.slice(0, 8).map((v) => [v.id, maakVoortgang(v.id, '2026-12-01')]),
    )
    const d = dosis({ voortgang, instellingen: { insteek: 'farmacologie' } })
    expect(d.vraagIds).toEqual(expect.arrayContaining(['f8', 'f9']))
    expect(d.vraagIds).toHaveLength(5)
  })

  it('vult aan met eerder geziene vragen, vroegste datum eerst', () => {
    const voortgang = Object.fromEntries(
      farma.map((v, i) => [v.id, maakVoortgang(v.id, `2026-12-${String(20 - i).padStart(2, '0')}`)]),
    )
    const d = dosis({ voortgang, instellingen: { insteek: 'farmacologie' } })
    expect(d.vraagIds.sort()).toEqual(['f5', 'f6', 'f7', 'f8', 'f9'])
  })

  it('kiest niets uit een thema dat uit staat', () => {
    const d = dosis({ instellingen: { themaFrequentie: { f1: 'uit' } } })
    expect(aantalFarma(d.vraagIds)).toBe(0)
    expect(d.vraagIds).toHaveLength(5)
  })

  it('houdt een vraag zolang één van zijn thema\'s aan staat', () => {
    const vragen = [maakVraag('f0', { themaIds: ['f1', 'f2'] })]
    const d = dosis({ vragen, instellingen: { insteek: 'farmacologie', themaFrequentie: { f1: 'uit' } } })
    expect(d.vraagIds).toEqual(['f0'])
  })

  it('Gemengd vult een tekort aan met de andere insteek', () => {
    expect(dosis({ vragen: [...farma.slice(0, 1), ...praktijk] }).vraagIds).toHaveLength(5)
    expect(dosis({ vragen: [...farma, ...praktijk.slice(0, 1)] }).vraagIds).toHaveLength(5)
  })

  it('een vaste insteek blijft korter in plaats van te mengen', () => {
    const d = dosis({ vragen: [...farma.slice(0, 2), ...praktijk], instellingen: { insteek: 'farmacologie' } })
    expect(d.vraagIds.sort()).toEqual(['f0', 'f1'])
  })

  it('geeft een lege dosis als alles uit staat', () => {
    const d = dosis({ instellingen: { themaFrequentie: { f1: 'uit', p1: 'uit' } } })
    expect(d.vraagIds).toEqual([])
  })

  it('bevat nooit dezelfde vraag twee keer', () => {
    for (let dag = 1; dag <= 28; dag++) {
      const datum = `2026-11-${String(dag).padStart(2, '0')}`
      const voortgang = { f0: maakVoortgang('f0', datum), p0: maakVoortgang('p0', datum) }
      const { vraagIds } = dosis({ datum, voortgang })
      expect(new Set(vraagIds).size).toBe(vraagIds.length)
    }
  })

  it('is gelijk op dezelfde dag en verschilt tussen dagen', () => {
    expect(dosis().vraagIds).toEqual(dosis().vraagIds)
    const dagen = ['01', '02', '03', '04', '05', '06'].map((d) => dosis({ datum: `2026-11-${d}` }).vraagIds.join())
    expect(new Set(dagen).size).toBeGreaterThan(1)
  })
})

describe('thema-gewichten', () => {
  it('zijn Vaak 3, Normaal 2, Af en toe 1, Uit 0', () => {
    const i = maakInstellingen({ themaFrequentie: { a: 'vaak', b: 'normaal', c: 'af-en-toe', d: 'uit' } })
    expect(['a', 'b', 'c', 'd'].map((t) => themaGewicht(t, i, []))).toEqual([3, 2, 1, 0])
  })

  it('zijn Normaal voor een nieuw thema zonder instelling', () => {
    expect(themaGewicht('nieuw', maakInstellingen(), [])).toBe(2)
  })

  const fout = (n: number) => Array.from({ length: n }, () => maakAntwoord({ goed: false }))
  const goed = (n: number) => Array.from({ length: n }, () => maakAntwoord({ goed: true }))

  it('tellen dubbel bij bijsturen en een score onder 60%', () => {
    const i = maakInstellingen({ bijsturen: true })
    expect(themaGewicht('f1', i, [...goed(5), ...fout(5)])).toBe(4)
  })

  it('tellen niet dubbel bij precies 60%, zonder antwoorden of met bijsturen uit', () => {
    const aan = maakInstellingen({ bijsturen: true })
    expect(themaGewicht('f1', aan, [...goed(6), ...fout(4)])).toBe(2)
    expect(themaGewicht('f1', aan, [])).toBe(2)
    expect(themaGewicht('f1', maakInstellingen(), fout(10))).toBe(2)
  })

  it('kijken alleen naar de laatste 20 antwoorden', () => {
    const i = maakInstellingen({ bijsturen: true })
    expect(themaGewicht('f1', i, [...fout(30), ...goed(20)])).toBe(2)
  })

  it('sturen de keuze echt: een zwaar thema komt vaker voor', () => {
    const vragen = [
      ...Array.from({ length: 10 }, (_, i) => maakVraag(`z${i}`, { themaIds: ['zwaar'] })),
      ...Array.from({ length: 10 }, (_, i) => maakVraag(`l${i}`, { themaIds: ['licht'] })),
    ]
    let zwaar = 0
    for (let n = 0; n < 200; n++) {
      const d = stelDosisSamen({
        datum: DATUM,
        vragen,
        voortgang: {},
        antwoorden: [],
        instellingen: maakInstellingen({
          insteek: 'farmacologie',
          themaFrequentie: { zwaar: 'vaak', licht: 'af-en-toe' },
        }),
        rng: maakRng(String(n)),
      })
      zwaar += d.vraagIds.filter((id) => id.startsWith('z')).length
    }
    expect(zwaar / 1000).toBeGreaterThan(0.6)
  })
})

describe('spreidKaarten', () => {
  const k = (id: string, kaartId?: string) => maakVraag(id, { kaartId })

  function buren(vragen: Vraag[]) {
    return vragen.filter((v, i) => i > 0 && v.kaartId && v.kaartId === vragen[i - 1].kaartId).length
  }

  it('zet vragen bij dezelfde kaart niet achter elkaar', () => {
    const v = spreidKaarten([k('a', 'x'), k('b', 'x'), k('c', 'x'), k('d', 'y'), k('e')])
    expect(v).toHaveLength(5)
    expect(buren(v)).toBe(0)
  })

  it('laat een volgorde die al goed is staan', () => {
    const v = [k('a', 'x'), k('b', 'y'), k('c', 'x')]
    expect(spreidKaarten(v).map((q) => q.id)).toEqual(['a', 'b', 'c'])
  })

  it('ziet vragen zonder kaart niet als dezelfde kaart', () => {
    const v = [k('a'), k('b'), k('c')]
    expect(spreidKaarten(v).map((q) => q.id)).toEqual(['a', 'b', 'c'])
  })

  it('verliest geen vragen als spreiden niet kan', () => {
    expect(spreidKaarten([k('a', 'x'), k('b', 'x')])).toHaveLength(2)
  })

  it('werkt in een hele dosis', () => {
    const vragen = [
      ...['a', 'b', 'c'].map((id) => maakVraag(id, { kaartId: 'x' })),
      ...['d', 'e'].map((id) => maakVraag(id, { kaartId: 'y' })),
    ]
    const d = dosis({ vragen, instellingen: { insteek: 'farmacologie' } })
    const volgorde = d.vraagIds.map((id) => vragen.find((v) => v.id === id)!)
    expect(buren(volgorde)).toBe(0)
  })
})
