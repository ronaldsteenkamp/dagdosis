// Gelijk aan het inhoudsmodel uit de opdracht; fase 2 valideert deze vormen.
export type Insteek = 'farmacologie' | 'praktijk'
export type InsteekKeuze = Insteek | 'gemengd'
export type VraagType = 'casus' | 'mechanisme-bijwerking' | 'mechanisme-middel' | 'vergelijk' | 'kinetiek'
export type Status = 'concept' | 'gecontroleerd'
export type Zekerheid = 'zeker' | 'twijfel' | 'gok'
export type ThemaFrequentie = 'vaak' | 'normaal' | 'af-en-toe' | 'uit'

export interface Bron {
  label: string
  url?: string
}

export interface Thema {
  id: string
  naam: string
  insteek: Insteek
}

export interface Kaart {
  id: string
  groep: string
  voorbeelden: string[]
  aangrijpingspunt: string
  directEffect: string
  klinischEffect: string
  afleidbareBijwerkingen: string
  letOp?: string
  bron: Bron
  status: Status
}

export interface Optie {
  id: string
  tekst: string
}

export interface Vraag {
  id: string
  type: VraagType
  insteek: Insteek
  themaIds: string[]
  kaartId?: string
  casus?: string
  vraag: string
  opties: Optie[]
  juist: string
  waarom: string
  mechanismeRegel?: string
  onthoud?: string
  bron: Bron
  status: Status
  versie: number
}

export interface Instellingen {
  insteek: InsteekKeuze
  ritme: boolean
  uitlegMetMechanisme: boolean
  bijsturen: boolean
  themaFrequentie: Record<string, ThemaFrequentie>
}

// Alles hieronder staat op het toestel. Antwoorden zijn een oplopend logboek met unieke id's,
// zodat een backend ze later kan overnemen zonder de opbouw te wijzigen.
export interface HistoriePunt {
  datum: string
  keuze: string
  goed: boolean
  zekerheid: Zekerheid
}

export interface VraagVoortgang {
  vraagId: string
  versie: number
  bakje: number
  volgendeDatum: string
  geschiedenis: HistoriePunt[]
}

export interface Antwoord extends HistoriePunt {
  id: string
  tijdstip: string
  vraagId: string
  versie: number
  duurMs: number
  themaIds: string[]
}

export interface Resultaat {
  vraagId: string
  goed: boolean
}

export interface Dosis {
  datum: string
  vraagIds: string[]
  herhalingIds: string[]
  resultaten: Resultaat[]
}

export interface Melding {
  id: string
  datum: string
  vraagId: string
  versie: number
  notitie: string
}
