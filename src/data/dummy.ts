// Voorbeeldgegevens voor fase 1. Fase 2 vervangt de inhoud door /content,
// fase 3 de voortgangscijfers door echte gegevens uit IndexedDB.
import type { Instellingen, Kaart, Thema, Vraag } from '../types'

const kompas = { label: 'Farmacotherapeutisch Kompas', url: 'https://www.farmacotherapeutischkompas.nl/' }

export const themas: Thema[] = [
  { id: 'receptoren-targets', naam: 'Receptoren en targets', insteek: 'farmacologie' },
  { id: 'enzymen-transporters', naam: 'Enzymen en transporters (CYP, P-gp)', insteek: 'farmacologie' },
  { id: 'farmacokinetiek', naam: 'Farmacokinetiek', insteek: 'farmacologie' },
  { id: 'mechanisme-bijwerking', naam: 'Mechanisme → bijwerking', insteek: 'farmacologie' },
  { id: 'nieuwe-mechanismen', naam: 'Nieuwe werkingsmechanismen', insteek: 'farmacologie' },
  { id: 'oncolytica-biologicals', naam: 'Oncolytica en biologicals', insteek: 'farmacologie' },
  { id: 'interacties', naam: 'Interacties in de praktijk', insteek: 'praktijk' },
  { id: 'nierfunctie', naam: 'Nierfunctie en dosering', insteek: 'praktijk' },
  { id: 'zwangerschap-lactatie', naam: 'Zwangerschap en lactatie', insteek: 'praktijk' },
  { id: 'zelfzorg', naam: 'Zelfzorg', insteek: 'praktijk' },
]

export const kaarten: Kaart[] = [
  {
    id: 'sglt2-remmers',
    groep: 'SGLT2-remmers',
    voorbeelden: ['empagliflozine', 'dapagliflozine', 'canagliflozine'],
    aangrijpingspunt: 'SGLT2 in de proximale tubulus van de nier.',
    directEffect: 'Minder terugresorptie van glucose en natrium, dus glucose en water in de urine.',
    klinischEffect: 'Lagere bloedglucose, lichte bloeddrukdaling en gewichtsverlies.',
    afleidbareBijwerkingen: 'Genitale schimmelinfecties door glucosurie; volumedepletie door osmotische diurese.',
    letOp: 'Bij ziekte met weinig eten of drinken: kans op ketoacidose, ook bij een normale glucose.',
    bron: kompas,
    status: 'concept',
  },
  {
    id: 'ace-remmers',
    groep: 'ACE-remmers',
    voorbeelden: ['enalapril', 'lisinopril', 'perindopril'],
    aangrijpingspunt: 'Angiotensineconverterend enzym (ACE).',
    directEffect: 'Minder angiotensine II en minder afbraak van bradykinine.',
    klinischEffect: 'Vaatverwijding, minder aldosteron en een lagere bloeddruk.',
    afleidbareBijwerkingen: 'Prikkelhoest en angio-oedeem door bradykinine; hyperkaliëmie door minder aldosteron.',
    letOp: 'Combinatie met NSAID en diureticum kan de nierfunctie sterk verslechteren.',
    bron: kompas,
    status: 'concept',
  },
]

export const vragen: Vraag[] = [
  {
    id: 'dummy-1',
    type: 'mechanisme-bijwerking',
    insteek: 'farmacologie',
    themaIds: ['mechanisme-bijwerking'],
    kaartId: 'sglt2-remmers',
    casus: 'Iemand start met empagliflozine en vraagt aan de balie waarom genitale schimmelinfecties in de bijsluiter staan.',
    vraag: 'Wat is de beste verklaring?',
    opties: [
      { id: 'A', tekst: 'Onderdrukking van de lokale afweer door hogere cortisolspiegels' },
      { id: 'B', tekst: 'Glucosurie door geremde terugresorptie van glucose via SGLT2 in de proximale tubulus' },
      { id: 'C', tekst: 'Verstoring van de vaginale flora doordat empagliflozine in het slijmvlies stapelt' },
      { id: 'D', tekst: 'Verminderde urineproductie, waardoor de urinewegen minder worden gespoeld' },
    ],
    juist: 'B',
    waarom:
      'SGLT2-remming laat glucose in de urine achter, en dat is een voedingsbodem voor schimmels. Dezelfde glucose trekt water mee (osmotische diurese). Dat verklaart de lichte bloeddrukdaling, en het calorieverlies via de urine verklaart het gewichtsverlies.',
    onthoud: 'Suiker in de urine verklaart bijna het hele bijwerkingenprofiel.',
    bron: kompas,
    status: 'concept',
    versie: 1,
  },
  {
    id: 'dummy-2',
    type: 'casus',
    insteek: 'praktijk',
    themaIds: ['interacties'],
    casus: 'Iemand gebruikt simvastatine 40 mg en krijgt claritromycine voorgeschreven.',
    vraag: 'Wat is het beste advies?',
    opties: [
      { id: 'A', tekst: 'Beide doorgebruiken en spierklachten afwachten' },
      { id: 'B', tekst: 'Simvastatine en claritromycine minstens 4 uur na elkaar innemen' },
      { id: 'C', tekst: 'Simvastatine tijdens de kuur onderbreken, of overleggen over azitromycine' },
      { id: 'D', tekst: 'De dosering simvastatine tijdens de kuur verdubbelen' },
    ],
    juist: 'C',
    waarom:
      'Claritromycine remt CYP3A4 sterk, waardoor de simvastatinespiegel flink stijgt. Innemen op een ander moment helpt niet, want het gaat om enzymremming en niet om absorptie. Azitromycine remt CYP3A4 nauwelijks.',
    mechanismeRegel: 'sterke CYP3A4-remming → hogere simvastatinespiegel → risico op myopathie',
    onthoud: 'Bij enzymremming helpt spreiden van de inname niet.',
    bron: kompas,
    status: 'concept',
    versie: 1,
  },
  {
    id: 'dummy-3',
    type: 'mechanisme-bijwerking',
    insteek: 'farmacologie',
    themaIds: ['mechanisme-bijwerking'],
    kaartId: 'ace-remmers',
    vraag: 'Waardoor geeft een ACE-remmer wel prikkelhoest en een ARB meestal niet?',
    opties: [
      { id: 'A', tekst: 'ACE breekt ook bradykinine af; remming laat bradykinine stijgen' },
      { id: 'B', tekst: 'ACE-remmers blokkeren bètareceptoren in de luchtwegen' },
      { id: 'C', tekst: 'ARB’s hebben een eigen hoestdempend effect' },
      { id: 'D', tekst: 'ACE-remmers verhogen de angiotensine II-spiegel in de longen' },
    ],
    juist: 'A',
    waarom:
      'ACE zet angiotensine I om, maar breekt ook bradykinine af. Remming laat bradykinine stijgen, en dat prikkelt de luchtwegen. Een ARB blokkeert alleen de AT1-receptor en laat de bradykinineafbraak ongemoeid.',
    onthoud: 'Hoest hoort bij de bradykinine-kant van ACE, niet bij angiotensine.',
    bron: kompas,
    status: 'concept',
    versie: 1,
  },
  {
    id: 'dummy-4',
    type: 'kinetiek',
    insteek: 'farmacologie',
    themaIds: ['farmacokinetiek'],
    vraag: 'Een middel met lineaire kinetiek heeft een halfwaardetijd van 24 uur. Na hoeveel tijd is de steady state bij benadering bereikt?',
    opties: [
      { id: 'A', tekst: 'Na ongeveer 1 dag' },
      { id: 'B', tekst: 'Na ongeveer 2 dagen' },
      { id: 'C', tekst: 'Na ongeveer 4 tot 5 dagen' },
      { id: 'D', tekst: 'Na ongeveer 10 tot 12 dagen' },
    ],
    juist: 'C',
    waarom:
      'De steady state wordt na ongeveer 4 tot 5 halfwaardetijden bereikt, onafhankelijk van de dosering. Bij een halfwaardetijd van 24 uur is dat 4 tot 5 dagen.',
    onthoud: 'Vier tot vijf halfwaardetijden, zowel bij opbouw als bij uitwas.',
    bron: { label: 'Algemene farmacokinetiek' },
    status: 'concept',
    versie: 1,
  },
  {
    id: 'dummy-5',
    type: 'casus',
    insteek: 'praktijk',
    themaIds: ['nierfunctie'],
    casus: 'Iemand gebruikt metformine 2 dd 1000 mg. Uit recent lab blijkt een eGFR van 25 ml/min/1,73 m².',
    vraag: 'Wat is het juiste vervolg?',
    opties: [
      { id: 'A', tekst: 'Niets wijzigen, metformine wordt niet renaal geklaard' },
      { id: 'B', tekst: 'Contact met de voorschrijver: metformine is bij deze nierfunctie gecontra-indiceerd' },
      { id: 'C', tekst: 'De dosering verhogen om de lagere klaring te compenseren' },
      { id: 'D', tekst: 'Alleen het innamemoment verplaatsen naar de avond' },
    ],
    juist: 'B',
    waarom:
      'Metformine wordt onveranderd via de nier uitgescheiden en stapelt bij een slechte nierfunctie. Daardoor neemt het risico op lactaatacidose toe. Onder een eGFR van 30 is metformine gecontra-indiceerd.',
    mechanismeRegel: 'lagere eGFR → stapeling van metformine → risico op lactaatacidose',
    onthoud: 'eGFR onder 30: geen metformine.',
    bron: kompas,
    status: 'concept',
    versie: 1,
  },
]

export const startInstellingen: Instellingen = {
  insteek: 'gemengd',
  ritme: false,
  uitlegMetMechanisme: true,
  bijsturen: true,
  themaFrequentie: Object.fromEntries(themas.map((t) => [t.id, 'normaal'])),
}

export const dagdosis = {
  vraagIds: vragen.map((v) => v.id),
  herhalingen: 2,
  minuten: 3,
  themaChips: ['Mechanisme → bijwerking', 'Interacties', 'Nierfunctie'],
}

export const dummyVoortgang = {
  streak: 6,
  percentageGoed: 78,
  leertijdMinuten: 192,
  themaScores: [
    { themaId: 'receptoren-targets', pct: 82 },
    { themaId: 'enzymen-transporters', pct: 54 },
    { themaId: 'farmacokinetiek', pct: 71 },
    { themaId: 'mechanisme-bijwerking', pct: 88 },
    { themaId: 'nieuwe-mechanismen', pct: 63 },
    { themaId: 'oncolytica-biologicals', pct: 47 },
    { themaId: 'interacties', pct: 79 },
    { themaId: 'nierfunctie', pct: 74 },
    { themaId: 'zwangerschap-lactatie', pct: 58 },
    { themaId: 'zelfzorg', pct: 91 },
  ],
  morgen: ['2 herhalingen uit Enzymen en transporters', '1 herhaling uit Oncolytica en biologicals'],
}

/** Dummy-scores voor de dagen vóór vandaag; null is een gemiste dag. */
export const weekScores: (number | null)[] = [4, 5, null, 3, 5, 4]
