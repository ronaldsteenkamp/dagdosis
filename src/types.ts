// Gelijk aan het inhoudsmodel uit de opdracht; fase 2 valideert deze vormen.
export type Insteek = 'farmacologie' | 'praktijk'
export type InsteekKeuze = Insteek | 'gemengd'
export type MeerkeuzeType = 'casus' | 'mechanisme-bijwerking' | 'mechanisme-middel' | 'vergelijk' | 'kinetiek'
export type VraagType = MeerkeuzeType | 'reken' | 'medicatiebewaking'
/** De vaste keuzes bij medicatiebewaking, in deze volgorde als A tot en met D. */
export type Beslissing = 'afleveren' | 'afleveren-met-advies' | 'overleggen' | 'niet-afleveren'
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

interface BasisVraag {
  id: string
  insteek: Insteek
  themaIds: string[]
  kaartId?: string
  casus?: string
  vraag: string
  waarom: string
  mechanismeRegel?: string
  onthoud?: string
  bron: Bron
  status: Status
  versie: number
  /** Wie de vraag heeft gecontroleerd. Verplicht bij status "gecontroleerd". */
  gecontroleerdDoor?: string
  /** Datum van de controle, JJJJ-MM-DD. Verplicht bij status "gecontroleerd". */
  gecontroleerdOp?: string
  /** Vóór deze datum (JJJJ-MM-DD) opnieuw nakijken. */
  herzienVoor?: string
}

/** Vier opties A–D, één juist. */
export interface MeerkeuzeVraag extends BasisVraag {
  type: MeerkeuzeType
  opties: Optie[]
  juist: string
}

/** Een getal invullen. Goed als het binnen antwoord ± marge valt. */
export interface RekenVraag extends BasisVraag {
  type: 'reken'
  antwoord: number
  eenheid: string
  /** Toegestane afwijking, in dezelfde eenheid. 0 betekent precies. */
  marge: number
}

/** Een recept of situatie, met de vaste keuzes van medicatiebewaking. */
export interface MedicatiebewakingVraag extends BasisVraag {
  type: 'medicatiebewaking'
  juist: Beslissing
}

export type Vraag = MeerkeuzeVraag | RekenVraag | MedicatiebewakingVraag

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
  /** De gekozen optie, als de vraag al beantwoord was. */
  keuze?: string
}

/** Wat iemand na een sessie meeneemt naar de praktijk. Optioneel, één per sessie. */
export interface Reflectie {
  /** Bij de dagdosis "dagdosis-JJJJ-MM-DD", zodat je hem later nog kunt aanpassen. */
  id: string
  datum: string
  tijdstip: string
  soort: 'dagdosis' | 'test'
  tekst: string
}

/** Losse gegevens over het gebruik van de app op dit toestel. */
export interface Meta {
  /** Datum waarop de uitleg bij de eerste start is weggeklikt. */
  welkomGezienOp?: string
  /** Datum waarop de browser om vaste opslag is gevraagd. */
  opslagGevraagdOp?: string
  /** Datum van de laatste volledige back-up. */
  laatsteBackupOp?: string
  /** Datum waarop de uitleg "zet op je beginscherm" op Vandaag is weggeklikt. */
  installatieUitlegWegOp?: string
}

/** Alles wat de app op het toestel bewaart. */
export interface Gegevens {
  voortgang: Record<string, VraagVoortgang>
  antwoorden: Antwoord[]
  dosissen: Record<string, Dosis>
  meldingen: Melding[]
  reflecties: Reflectie[]
  instellingen: Instellingen
  meta: Meta
}
