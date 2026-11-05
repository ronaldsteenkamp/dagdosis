// Voorbeeldgegevens tot fase 3: dan komen de dagdosis en de voortgang uit de echte logica.
export const dagdosis = {
  vraagIds: [
    'sglt2-genitale-schimmel',
    'simvastatine-claritromycine',
    'kinetiek-steady-state',
    'ace-diureticum-nsaid',
    'metformine-ernstige-nierfunctiestoornis',
  ],
  herhalingen: 2,
  minuten: 3,
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
