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
