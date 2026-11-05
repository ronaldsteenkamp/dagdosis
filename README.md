# Dagdosis

Elke dag 5 vragen (± 3 minuten) om je kennis als apotheker op peil te houden, met herhaling
op basis van hoe zeker je was. Installeerbare webapp die offline werkt. Gemaakt door Ronald.

Live: https://ronaldsteenkamp.github.io/dagdosis-site/

Alle voortgang staat alleen op het toestel, in IndexedDB. Er is geen backend en geen login.
Wis je de sitegegevens of wissel je van toestel, dan begin je opnieuw. Exporteer je leerlog
dus regelmatig als je die voor je portfolio bewaart.

## Vragen toevoegen of wijzigen

De inhoud staat in `/content`. Daarvoor hoef je geen code aan te passen.

| Bestand | Inhoud |
| --- | --- |
| `themas.json` | De thema's, elk met een insteek |
| `kaarten.json` | De mechanismekaarten |
| `vragen.json` | De vragen |
| `TWIJFELGEVALLEN.md` | Feiten die nog nagekeken moeten worden |

### Een vraag toevoegen

Voeg een blok toe aan de lijst in `vragen.json`:

```json
{
  "id": "korte-unieke-naam",
  "type": "casus",
  "insteek": "praktijk",
  "themaIds": ["interacties"],
  "kaartId": "statines",
  "casus": "De situatie aan de balie.",
  "vraag": "Wat is het beste advies?",
  "opties": [
    { "id": "A", "tekst": "Eerste optie" },
    { "id": "B", "tekst": "Tweede optie" },
    { "id": "C", "tekst": "Derde optie" },
    { "id": "D", "tekst": "Vierde optie" }
  ],
  "juist": "B",
  "waarom": "Uitleg in 2 tot 4 zinnen.",
  "mechanismeRegel": "oorzaak → gevolg → risico",
  "onthoud": "Eén zin om te onthouden.",
  "bron": { "label": "Naam van de bron", "url": "https://..." },
  "status": "concept",
  "versie": 1
}
```

| Veld | Regels |
| --- | --- |
| `id` | Uniek en daarna niet meer wijzigen, want de voortgang hangt eraan |
| `type` | `casus`, `mechanisme-bijwerking`, `mechanisme-middel`, `vergelijk` of `kinetiek` |
| `insteek` | `farmacologie` of `praktijk` |
| `themaIds` | Minstens één id uit `themas.json`, waarvan één bij de insteek hoort |
| `opties` | Precies vier, met de id's A, B, C en D. Geen "alle bovenstaande" |
| `status` | `concept` of `gecontroleerd` |
| `versie` | Een heel getal vanaf 1 |

`kaartId`, `casus`, `mechanismeRegel`, `onthoud` en `bron.url` mag je weglaten.
`mechanismeRegel` verschijnt alleen bij praktijkvragen, als "Uitleg altijd met mechanisme" aan staat.

### Een vraag goedkeuren

Zet `status` op `gecontroleerd`. Het label "concept" en de knop "Meld fout" verdwijnen dan.

### Een vraag inhoudelijk wijzigen

Verhoog `versie` met 1. De herhaling van die vraag begint dan opnieuw. Bij een typefout hoeft dat
niet. Eerdere antwoorden blijven in je scores en leerlog staan.

### Een kaart of thema toevoegen

- **Kaart:** voeg een blok toe aan `kaarten.json`, met dezelfde velden als de bestaande kaarten.
  De kaart rouleert daarna vanzelf mee als groep van de week.
- **Thema:** voeg een regel toe aan `themas.json`. Het thema verschijnt vanzelf in Voortgang en
  Instellingen, en staat standaard op Normaal.

### Controleren

```bash
npm run controleer
```

Dit noemt elke fout met bestand, id en veld, bijvoorbeeld:

```text
vragen.json › sglt2-genitale-schimmel › juist: "E" is geen optie; kies uit A, B, C, D
```

`npm run build` doet deze controle ook, dus een foutief bestand wordt niet gepubliceerd.

### Regels voor de inhoud

- Schrijf in eigen woorden en kopieer geen teksten uit naslagwerken of bijsluiters.
- Afleiders zijn aannemelijk, maar eenduidig fout.
- Laat het juiste antwoord niet steeds het langste zijn.
- Twijfel je over een feit, zet het dan in `TWIJFELGEVALLEN.md` en maak er geen vraag van.

## Deployen

Eenmalig:

```bash
npm install
```

Daarna, na elke wijziging:

```bash
npm run deploy
```

Dit controleert de inhoud, bouwt de app en zet `dist/` op de openbare repo
`ronaldsteenkamp/dagdosis-site`. De wijziging staat een minuut later online. Geïnstalleerde apps
werken zichzelf bij zodra ze online worden geopend. Commit en push je broncode daarnaast zelf.

GitHub Pages werkt op een gratis plan niet vanuit een privé-repo. Daarom staat alleen de gebouwde
site in een aparte openbare repo. De site zelf is openbaar: iedereen met het adres kan de vragen
lezen.

Op een andere host, zoals een Render Static Site, gebruik je als buildcommando
`BASE_PATH=/ npm run build` en als publicatiemap `dist`.

## Installeren op de telefoon

- **Android (Chrome):** open de site, kies in het menu "Toevoegen aan startscherm" of "App installeren".
- **iPhone (Safari):** open de site, tik op Delen en kies "Zet op beginscherm".

## Ontwikkelen

```bash
npm run dev
```

De app staat dan op http://localhost:5173/dagdosis-site/.

| Commando | Doel |
| --- | --- |
| `npm test` | Tests voor logica, validatie en startinhoud |
| `npm run controleer` | Inhoud controleren |
| `npm run build` | Inhoud controleren, typen controleren en bouwen |
| `npm run iconen` | PNG-iconen maken uit `public/icon.svg` |

| Map | Inhoud |
| --- | --- |
| `content/` | Thema's, kaarten en vragen |
| `src/logica/` | Herhaling, dagdosis, scores en export, zonder afhankelijkheid van de schermen |
| `src/inhoud/` | Laden en valideren van `/content` |
| `src/opslag.ts` | IndexedDB |
| `src/state.tsx` | Gegevens en acties voor de schermen |
| `src/screens/` | De schermen |

Voor een latere backend: antwoorden, meldingen en dosissen zijn losse records met een eigen sleutel.
Alleen `src/opslag.ts` hoeft dan te veranderen.

## Regels van de app

**Herhaling.** Intervallen per bakje: 1, 3, 7, 14, 30 en 60 dagen. Een nieuwe vraag begint in bakje 1.

| Antwoord | Gevolg |
| --- | --- |
| Fout, of goed maar gegokt | Morgen opnieuw, terug naar bakje 1 |
| Goed met twijfel | Over 3 dagen, bakje blijft gelijk |
| Goed en zeker | Een bakje hoger |

"Weet ik niet zeker" telt als fout.

**Dagdosis.** Eén keer per dag samengesteld, daarna vast.

1. Herhalingen die aan de beurt zijn gaan voor, maximaal 5. Fout en gegokt staan vooraan.
2. Daarna aanvullen tot 5 volgens de insteek, waarbij herhalingen meetellen in de verhouding.
3. Binnen de insteek wegen de thema's mee: Vaak 3, Normaal 2, Af en toe 1, Uit 0. Met bijsturen telt
   een thema onder 60% over de laatste 20 antwoorden dubbel.
4. Nieuwe vragen gaan voor. Zijn die op, dan volgen eerder geziene vragen, vroegst geplande eerst.
5. Bij Gemengd vult de andere insteek een tekort aan. Bij een vaste insteek blijft de dosis korter.
6. Vragen bij dezelfde kaart staan niet achter elkaar.

"Test jezelf" telt mee voor herhaling, scores en leertijd, maar niet voor de streak.
