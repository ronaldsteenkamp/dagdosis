import { describe, expect, it } from 'vitest'
import { valideerInhoud } from './valideer'

const thema = { id: 'interacties', naam: 'Interacties', insteek: 'praktijk' }
const kaart = {
  id: 'k1',
  groep: 'Groep',
  voorbeelden: ['middel'],
  aangrijpingspunt: 'a',
  directEffect: 'b',
  klinischEffect: 'c',
  afleidbareBijwerkingen: 'd',
  bron: { label: 'Bron' },
  status: 'concept',
}
const vraag = {
  id: 'v1',
  type: 'casus',
  insteek: 'praktijk',
  themaIds: ['interacties'],
  kaartId: 'k1',
  vraag: 'Vraag?',
  opties: ['A', 'B', 'C', 'D'].map((id) => ({ id, tekst: `Optie ${id}` })),
  juist: 'B',
  waarom: 'Daarom.',
  bron: { label: 'Bron', url: 'https://voorbeeld.nl' },
  status: 'concept',
  versie: 1,
}

function fouten(wijziging: Record<string, unknown>) {
  return valideerInhoud({ themas: [thema], kaarten: [kaart], vragen: [{ ...vraag, ...wijziging }] })
}

describe('valideerInhoud', () => {
  it('keurt geldige inhoud goed', () => {
    expect(fouten({})).toEqual([])
  })

  it('noemt bestand, id en veld in de foutmelding', () => {
    expect(fouten({ juist: 'E' })).toEqual([
      'vragen.json › v1 › juist: "E" is geen optie; kies uit A, B, C, D',
    ])
  })

  it.each([
    ['onbekend type', { type: 'quiz' }, 'type'],
    ['onbekende status', { status: 'klaar' }, 'status'],
    ['versie 0', { versie: 0 }, 'versie'],
    ['lege uitleg', { waarom: ' ' }, 'waarom'],
    ['drie opties', { opties: vraag.opties.slice(0, 3) }, 'opties'],
    ['onbekend thema', { themaIds: ['bestaat-niet'] }, 'themaIds'],
    ['geen thema', { themaIds: [] }, 'themaIds'],
    ['thema van de verkeerde insteek', { insteek: 'farmacologie' }, 'themaIds'],
    ['onbekende kaart', { kaartId: 'bestaat-niet' }, 'kaartId'],
    ['typefout in veldnaam', { mechanismeregel: 'x' }, 'mechanismeregel'],
    ['ongeldige bronlink', { bron: { label: 'Bron', url: 'www.voorbeeld.nl' } }, 'url'],
  ])('vindt: %s', (_naam, wijziging, veld) => {
    expect(fouten(wijziging).join('\n')).toContain(veld)
  })

  it('weigert "alle bovenstaande" als optie', () => {
    const opties = vraag.opties.map((o) => (o.id === 'D' ? { ...o, tekst: 'Alle bovenstaande' } : o))
    expect(fouten({ opties }).join('\n')).toContain('alle bovenstaande')
  })

  it('vindt dubbele id\'s en een verkeerde vorm', () => {
    expect(
      valideerInhoud({ themas: [thema], kaarten: [kaart], vragen: [vraag, vraag] }).join('\n'),
    ).toContain('vaker')
    expect(valideerInhoud({ themas: {}, kaarten: [], vragen: [] })).toEqual([
      'themas.json: moet een lijst zijn: [ ... ]',
    ])
  })
})
