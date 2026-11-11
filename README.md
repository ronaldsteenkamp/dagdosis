# Dagdosis

Elke dag 5 vragen (± 3 minuten) om je kennis als apotheker op peil te houden, met herhaling
op basis van je antwoorden. Installeerbare webapp die offline werkt. Gemaakt door Ronald.

Live: https://ronaldsteenkamp.github.io/dagdosis/

Alle voortgang staat alleen op het toestel, in IndexedDB. Er is geen backend en geen login.
Wis je de sitegegevens of wissel je van toestel, dan begin je opnieuw, tenzij je een back-up
hebt. Maak die onder Instellingen → Back-up.

## Vragen toevoegen of wijzigen

De inhoud staat in `/content`. Daarvoor hoef je geen code aan te passen.

| Bestand | Inhoud |
| --- | --- |
| `themas.json` | De thema's, elk met een insteek |
| `kaarten.json` | De mechanismekaarten |
| `vragen.json` | De vragen |
| `TWIJFELGEVALLEN.md` | Feiten die nog nagekeken moeten worden |
| `CONTROLELIJST.md` | Per vraag: klopt, aangepast of twijfel, met de gebruikte bron |

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
  "versie": 1,
  "herzienVoor": "2027-11-10"
}
```

| Veld | Regels |
| --- | --- |
| `id` | Uniek en daarna niet meer wijzigen, want de voortgang hangt eraan |
| `type` | `casus`, `mechanisme-bijwerking`, `mechanisme-middel`, `vergelijk` of `kinetiek` (meerkeuze), `reken` of `medicatiebewaking` (zie hieronder) |
| `insteek` | `farmacologie` of `praktijk` |
| `themaIds` | Minstens één id uit `themas.json`, waarvan één bij de insteek hoort |
| `opties` | Precies vier, met de id's A, B, C en D. Geen "alle bovenstaande" |
| `status` | `concept` of `gecontroleerd` |
| `versie` | Een heel getal vanaf 1 |
| `gecontroleerdDoor` | Wie de vraag heeft nagekeken. Verplicht bij `gecontroleerd` |
| `gecontroleerdOp` | Datum van die controle, `JJJJ-MM-DD`. Verplicht bij `gecontroleerd` |
| `herzienVoor` | Datum, `JJJJ-MM-DD`, waarvoor de vraag opnieuw nagekeken moet zijn |

`kaartId`, `casus`, `mechanismeRegel`, `onthoud`, `bron.url`, `gecontroleerdDoor`, `gecontroleerdOp`
en `herzienVoor` mag je weglaten, behalve de eerste twee bij `gecontroleerd`.
`mechanismeRegel` verschijnt alleen bij praktijkvragen, als "Uitleg altijd met mechanisme" aan staat.

### Een rekenvraag

Bij `"type": "reken"` vul je een getal in. Er zijn geen `opties` en geen `juist`, maar wel:

```json
"antwoord": 52,
"eenheid": "ml/min",
"marge": 2
```

| Veld | Regels |
| --- | --- |
| `antwoord` | Een getal, zonder aanhalingstekens. Decimalen met een punt: `0.5` |
| `eenheid` | Tekst achter het invoerveld, bijvoorbeeld `ml/min` of `mg/kg` |
| `marge` | Toegestane afwijking in dezelfde eenheid; goed is `antwoord ± marge`, grenzen inbegrepen. `0` is precies |

De gebruiker typt met een numeriek toetsenbord en mag een komma gebruiken. Zet in `waarom` de
berekening stap voor stap, en kies de marge zo dat afronden onderweg geen fout oplevert.

### Een medicatiebewakingsvraag

Bij `"type": "medicatiebewaking"` beschrijf je het recept of de situatie in `casus`. De opties liggen
vast en staan altijd in deze volgorde:

| Letter | `juist` | Tekst in de app |
| --- | --- | --- |
| A | `afleveren` | Afleveren |
| B | `afleveren-met-advies` | Afleveren met advies |
| C | `overleggen` | Overleggen met voorschrijver |
| D | `niet-afleveren` | Niet afleveren |

Er is dus geen `opties`. `juist` is een van de vier woorden uit de tweede kolom. Leg in `waarom` uit
waarom die beslissing past, en wat het advies of de vraag aan de voorschrijver is. Kies alleen
situaties waarin één beslissing eenduidig de beste is.

### Een vraag goedkeuren

Dit doet een apotheker, niet de maker van de vraag. Zet `status` op `gecontroleerd` en vul
`gecontroleerdDoor` en `gecontroleerdOp` in. Zonder die twee geeft `npm run controleer` een fout.
Het label "concept" en de knop "Meld fout" verdwijnen dan.

```json
"status": "gecontroleerd",
"gecontroleerdDoor": "R. Steenkamp",
"gecontroleerdOp": "2026-11-10",
"herzienVoor": "2027-11-10"
```

Zet `herzienVoor` op een jaar na de controle, of eerder als het advies in beweging is.

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

Daarnaast toont de controle waarschuwingen. Die houden de build niet tegen:

- een `herzienVoor` die verstreken is;
- het juiste antwoord is in meer dan 35% van de vragen het langste;
- een letter is in minder dan 15% of meer dan 35% van de vragen het juiste antwoord.

Reken- en medicatiebewakingsvragen tellen niet mee voor "langste" en de letters. Voor
medicatiebewaking toont de controle apart hoe vaak elke beslissing juist is.

Tot slot meldt de controle altijd de verdeling, bijvoorbeeld:

```text
Juiste antwoord is het langste: 8 van 30 (27%).
Juiste letter: A 7 (23%), B 8 (27%), C 8 (27%), D 7 (23%).
```

### Regels voor de inhoud

- Schrijf in eigen woorden en kopieer geen teksten uit naslagwerken of bijsluiters.
- Afleiders zijn aannemelijk, maar eenduidig fout.
- Laat het juiste antwoord niet steeds het langste zijn.
- Twijfel je over een feit, zet het dan in `TWIJFELGEVALLEN.md` en maak er geen vraag van.

## Deployen

Push naar `main`. GitHub controleert dan de inhoud, draait de tests, bouwt de app en zet hem op
GitHub Pages. De wijziging staat een paar minuten later online. Geïnstalleerde apps werken
zichzelf bij zodra ze online worden geopend.

Of het gelukt is zie je onder Actions, bij de workflow "Publiceer". Daar kun je hem ook met de
hand starten. Een fout in `/content` of een falende test houdt de publicatie tegen; de oude
versie blijft dan online.

Eenmalig in te stellen: Settings → Pages → Source: "GitHub Actions".

Deze repo en de site zijn openbaar: iedereen kan de code en de vragen lezen.

Op een andere host, zoals een Render Static Site, gebruik je als buildcommando
`BASE_PATH=/ npm run build` en als publicatiemap `dist`.

## Installeren op de telefoon

- **Android (Chrome):** open de site, kies in het menu "Toevoegen aan startscherm" of "App installeren".
- **iPhone (Safari):** open de site, tik op Delen en kies "Zet op beginscherm".

## Ontwikkelen

```bash
npm run dev
```

De app staat dan op http://localhost:5173/dagdosis/.

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
| `src/inhoud/` | Laden, valideren en rapporteren over `/content` |
| `src/opslag.ts` | IndexedDB |
| `src/state.tsx` | Gegevens en acties voor de schermen |
| `src/screens/` | De schermen |

Voor een latere backend: antwoorden, meldingen en dosissen zijn losse records met een eigen sleutel.
Alleen `src/opslag.ts` hoeft dan te veranderen.

## Leeroverzicht en reflectie

**Reflectie.** Onder de samenvatting van een sessie staat een optioneel veld "Wat neem ik mee naar de
praktijk?". Het wordt bewaard als je het veld verlaat of de sessie sluit. Bij de dagdosis is er één
reflectie per dag, die je later nog kunt aanpassen; elke losse test krijgt een eigen reflectie. Een
leeg veld verwijdert de reflectie. Reflecties staan in de leerlog-CSV (kolom "Reflectie", per dag
samengevoegd) en in het leeroverzicht.

**Leeroverzicht.** Voortgang → "Leeroverzicht voor je portfolio" (`#/overzicht`). Kies een
kalenderjaar of een eigen periode. Het overzicht toont leertijd, aantal vragen (en hoeveel
verschillende), percentage goed, aantal dagen, scores per thema, de onderwerpen en de reflecties.
Onderwerp is de groep van de mechanismekaart, of het eerste thema als een vraag geen kaart heeft.
"Afdrukken of als PDF bewaren" opent het afdrukvenster van de browser; knoppen en invoervelden
worden niet afgedrukt. Een naam op het overzicht is optioneel en wordt niet bewaard.

Het overzicht is een eigen registratie. De app zegt nergens iets over accreditatie, en dat moet zo
blijven.

## Back-up en meldingen

**Back-up.** Onder Instellingen staat "Back-up maken": één JSON-bestand met voortgang, antwoorden,
dosissen, meldingen, reflecties, instellingen en meta. Het bestand heeft een `formaat`-nummer (nu 2;
een back-up van formaat 1, zonder reflecties, wordt omgezet). Bij
"Back-up terugzetten" controleert de app het bestand eerst. Is het in orde, dan toont de app wat
erin staat en vraagt bevestiging. Pas na "Overschrijven" worden de gegevens op het toestel
vervangen, in één keer. Een back-up uit een nieuwere versie van de app wordt geweigerd.

Verandert de opbouw van de gegevens, verhoog dan `BACKUP_FORMAAT` in `src/logica/backup.ts` en zet
oudere formaten om in `zetOm`.

Voortgang toont een herinnering als er nog nooit, of langer dan 30 dagen geleden, een back-up is
gemaakt.

**Vaste opslag.** Bij de eerste start vraagt de app de browser om de gegevens niet zelf op te ruimen
(`navigator.storage.persist()`). Dat gebeurt één keer, omdat sommige browsers het de gebruiker vragen.

**Meld fout.** De melding blijft op het toestel, met de gekozen optie, en is te exporteren als CSV.
Met "Opslaan en melden op GitHub" opent ook een nieuwe issue in deze repo, met vraag-id, versie en
gekozen optie al ingevuld. De eigen notitie gaat niet mee in de link, omdat die persoonsgegevens kan
bevatten; die neemt de melder zelf over. Er is een GitHub-account voor nodig.

## Regels van de app

**Geen naslagwerk.** Bij de eerste start en onder Instellingen staat een korte tekst: de app is een
leermiddel, geen naslagwerk. Raadpleeg bij twijfel het Kompas of de KNMP Kennisbank.

**Herhaling.** Intervallen per bakje: 1, 3, 7, 14, 30, 60, 120 en 180 dagen. Een nieuwe vraag begint
in bakje 1. De bakjes van 120 en 180 dagen zijn later toegevoegd: een vraag die al in bakje 6 stond,
houdt zijn geplande datum en gaat bij het volgende goede antwoord naar bakje 7.

| Antwoord | Gevolg |
| --- | --- |
| Fout | Morgen opnieuw, terug naar bakje 1 |
| Goed | Een bakje hoger |

Oudere antwoorden die als twijfel of gok zijn opgeslagen, tellen nog volgens de oude regels.

**Weggezakt.** Voortgang toont de vragen die je fout had nadat je ze eerder goed had, binnen de
huidige versie. Nog niet herstelde vragen staan bovenaan. "Herhaal deze vragen" start een test met
die lijst. Zo'n test telt mee zoals "Test jezelf".

**Team.** Het tabblad is verborgen tot er een teammodus is (`TEAM_ZICHTBAAR` in
`src/components/BottomNav.tsx`). Het scherm staat nog in de code.

**Dagdosis.** Eén keer per dag samengesteld, daarna vast.

1. Herhalingen die aan de beurt zijn gaan voor, maximaal 5. Fout en gegokt staan vooraan.
2. Daarna aanvullen tot 5 volgens de insteek, waarbij herhalingen meetellen in de verhouding.
3. Binnen de insteek wegen de thema's mee: Vaak 3, Normaal 2, Af en toe 1, Uit 0. Met bijsturen telt
   een thema onder 60% over de laatste 20 antwoorden dubbel.
4. Nieuwe vragen gaan voor. Zijn die op, dan volgen eerder geziene vragen, vroegst geplande eerst.
5. Bij Gemengd vult de andere insteek een tekort aan. Bij een vaste insteek blijft de dosis korter.
6. Vragen bij dezelfde kaart staan niet achter elkaar.

"Test jezelf" telt mee voor herhaling, scores en leertijd, maar niet voor de streak.

**Antwoorden.** Een antwoord wordt opgeslagen zodra je op "Controleer" tikt, dus ook als je de app
daarna sluit zonder de uitleg uit te lezen. De leertijd van een vraag loopt van openen tot "Volgende"
(maximaal 3 minuten). Bij een rekenvraag weigert de app een punt met precies drie cijfers erachter,
zoals 18.000, omdat dat een duizendtal of een decimaal kan zijn; een komma is het decimaalteken.
