# Dagdosis

Elke dag 5 vragen (± 3 minuten) om je kennis als apotheker op peil te houden.
Installeerbare webapp, alles blijft op het toestel. Gemaakt door Ronald.

**Stand:** fase 2. De vragen en mechanismekaarten komen uit `/content`. De dagdosis en de
voortgang zijn nog voorbeeldgegevens uit `src/data/dummy.ts`, en er wordt nog niets bewaard.

## Ontwikkelen

```bash
npm install
npm run dev
```

De app staat dan op http://localhost:5173/dagdosis-site/.

## Inhoud

De inhoud staat in `content/themas.json`, `content/kaarten.json` en `content/vragen.json`.
Feiten waarover twijfel bestaat staan in `content/TWIJFELGEVALLEN.md`.

```bash
npm run controleer
```

Dit controleert de bestanden en noemt per fout het bestand, het id en het veld. `npm run build`
doet dit ook, dus een foutief bestand wordt nooit gepubliceerd.

## Testen

```bash
npm test
```

## Deployen

```bash
npm run deploy
```

Dit bouwt de app en zet `dist/` op de openbare repo `ronaldsteenkamp/dagdosis-site`.
De site staat op https://ronaldsteenkamp.github.io/dagdosis-site/. De broncode blijft privé,
maar de site zelf is openbaar, dus ook de vragen zijn voor iedereen met het adres leesbaar.

Voor een andere host, zoals een
Render Static Site: buildcommando `BASE_PATH=/ npm run build`, publicatiemap `dist`.
