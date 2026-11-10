import type { Vraag } from '../types'
import { juistTekst, keuzeTekst } from './vraag'

export const ISSUE_URL = 'https://github.com/ronaldsteenkamp/dagdosis/issues/new'

/**
 * Een vooraf ingevulde GitHub-issue. Bevat alleen gegevens uit de app: vraag, versie en keuze.
 * De eigen notitie gaat er bewust niet in, want die kan persoonsgegevens bevatten.
 */
export function meldingUrl(vraag: Vraag, keuze?: string) {
  const gekozen = keuze ? keuzeTekst(vraag, keuze) : 'nog niet beantwoord'
  const titel = `Melding: ${vraag.id} (versie ${vraag.versie})${keuze ? `, gekozen ${keuze}` : ''}`
  const tekst = [
    `Vraag: ${vraag.id}`,
    `Versie: ${vraag.versie}`,
    `Gekozen optie: ${gekozen}`,
    `Juiste antwoord volgens de app: ${juistTekst(vraag)}`,
    '',
    '## Wat klopt er niet?',
    '',
    '(Licht toe en noem zo mogelijk een bron. Vermeld geen patiënt- of persoonsgegevens.)',
  ].join('\n')
  return `${ISSUE_URL}?${new URLSearchParams({ title: titel, body: tekst })}`
}
