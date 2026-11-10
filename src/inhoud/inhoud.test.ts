import { describe, expect, it } from 'vitest'
import { inhoudFouten, kaarten, themas, vragen } from '.'

describe('startinhoud', () => {
  it('heeft geen validatiefouten', () => {
    expect(inhoudFouten).toEqual([])
  })

  it('bevat 17 thema\'s, 11 kaarten en 76 vragen', () => {
    expect([themas.length, kaarten.length, vragen.length]).toEqual([17, 11, 76])
  })

  it('heeft van elk nieuw vraagtype minstens 2 voorbeeldvragen', () => {
    for (const type of ['reken', 'medicatiebewaking']) {
      expect(vragen.filter((v) => v.type === type).length, type).toBeGreaterThanOrEqual(2)
    }
  })

  it('geeft elke kaart minstens 2 eigen vragen', () => {
    for (const k of kaarten) {
      expect(vragen.filter((v) => v.kaartId === k.id).length, k.id).toBeGreaterThanOrEqual(2)
    }
  })

  it('dekt alle thema\'s en vraagtypes', () => {
    for (const t of themas) {
      expect(vragen.filter((v) => v.themaIds.includes(t.id)).length, t.id).toBeGreaterThanOrEqual(3)
    }
    expect(new Set(vragen.map((v) => v.type)).size).toBeGreaterThanOrEqual(5)
  })

  it('verspreidt de juiste antwoorden over A tot en met D', () => {
    for (const letter of ['A', 'B', 'C', 'D']) {
      expect(vragen.filter((v) => 'opties' in v && v.juist === letter).length, letter).toBeGreaterThanOrEqual(6)
    }
  })

  it('geeft elke praktijkvraag een mechanismeRegel', () => {
    for (const v of vragen.filter((v) => v.insteek === 'praktijk')) {
      expect(v.mechanismeRegel, v.id).toBeTruthy()
    }
  })

  it('bevat de twee voorbeeldvragen uit de opdracht', () => {
    const schimmel = vragen.find((v) => v.id === 'sglt2-genitale-schimmel')!
    expect(schimmel.type).toBe('mechanisme-bijwerking')
    for (const woord of ['osmotische diurese', 'bloeddrukdaling', 'gewichtsverlies']) {
      expect(schimmel.waarom).toContain(woord)
    }
    const simva = vragen.find((v) => v.id === 'simvastatine-claritromycine')!
    expect(simva.mechanismeRegel).toBe(
      'sterke CYP3A4-remming → hogere simvastatinespiegel → risico op myopathie',
    )
  })
})
