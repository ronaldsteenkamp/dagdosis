# Dagdosis

Elke dag 5 vragen (± 3 minuten) om je kennis als apotheker op peil te houden.
Installeerbare webapp, alles blijft op het toestel. Gemaakt door Ronald.

**Stand:** fase 1. Alle schermen staan er, met voorbeeldgegevens uit `src/data/dummy.ts`.
Er wordt nog niets bewaard.

## Ontwikkelen

```bash
npm install
npm run dev
```

De app staat dan op http://localhost:5173/dagdosis/.

## Deployen

```bash
npm run deploy
```

Dit bouwt de app en zet `dist/` op de branch `gh-pages`. Voor een andere host, zoals een
Render Static Site: buildcommando `BASE_PATH=/ npm run build`, publicatiemap `dist`.
