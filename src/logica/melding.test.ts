import { describe, expect, it } from 'vitest'
import { meldingUrl } from './melding'
import { maakVraag } from './testhulp'

const vraag = maakVraag('metformine-nier', {
  versie: 3,
  juist: 'B',
  opties: ['A', 'B', 'C', 'D'].map((id) => ({ id, tekst: `Optie ${id}` })),
})

function lees(url: string) {
  const u = new URL(url)
  return { basis: `${u.origin}${u.pathname}`, titel: u.searchParams.get('title')!, tekst: u.searchParams.get('body')! }
}

describe('meldingUrl', () => {
  it('opent een nieuwe issue met id, versie en keuze in titel en tekst', () => {
    const { basis, titel, tekst } = lees(meldingUrl(vraag, 'C'))
    expect(basis).toBe('https://github.com/ronaldsteenkamp/dagdosis/issues/new')
    expect(titel).toBe('Melding: metformine-nier (versie 3), gekozen C')
    expect(tekst).toContain('Vraag: metformine-nier')
    expect(tekst).toContain('Versie: 3')
    expect(tekst).toContain('Gekozen optie: C. Optie C')
    expect(tekst).toContain('Juiste antwoord volgens de app: B')
  })

  it('werkt ook vóór het antwoorden', () => {
    const { titel, tekst } = lees(meldingUrl(vraag))
    expect(titel).toBe('Melding: metformine-nier (versie 3)')
    expect(tekst).toContain('Gekozen optie: nog niet beantwoord')
  })

  it('bevat alleen gegevens uit de app', () => {
    const u = new URL(meldingUrl(vraag, 'A'))
    expect([...u.searchParams.keys()]).toEqual(['title', 'body'])
  })
})
