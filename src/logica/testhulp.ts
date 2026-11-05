import type { Antwoord, Instellingen, Vraag, VraagVoortgang, Zekerheid } from '../types'

export function maakVraag(id: string, extra: Partial<Vraag> = {}): Vraag {
  return {
    id,
    type: 'casus',
    insteek: 'farmacologie',
    themaIds: ['f1'],
    vraag: 'Vraag?',
    opties: [],
    juist: 'A',
    waarom: 'Daarom.',
    bron: { label: 'Bron' },
    status: 'concept',
    versie: 1,
    ...extra,
  }
}

export function maakAntwoord(extra: Partial<Antwoord> = {}): Antwoord {
  return {
    id: 'a',
    tijdstip: '2026-11-05T12:00:00.000Z',
    vraagId: 'v',
    versie: 1,
    datum: '2026-11-05',
    keuze: 'A',
    goed: true,
    zekerheid: 'zeker',
    duurMs: 30000,
    themaIds: ['f1'],
    ...extra,
  }
}

export function maakVoortgang(
  vraagId: string,
  volgendeDatum: string,
  extra: Partial<VraagVoortgang> & { goed?: boolean; zekerheid?: Zekerheid } = {},
): VraagVoortgang {
  const { goed = true, zekerheid = 'zeker', ...rest } = extra
  return {
    vraagId,
    versie: 1,
    bakje: 2,
    volgendeDatum,
    geschiedenis: [{ datum: '2026-11-01', keuze: 'A', goed, zekerheid }],
    ...rest,
  }
}

export function maakInstellingen(extra: Partial<Instellingen> = {}): Instellingen {
  return { insteek: 'gemengd', ritme: false, uitlegMetMechanisme: true, bijsturen: false, themaFrequentie: {}, ...extra }
}
