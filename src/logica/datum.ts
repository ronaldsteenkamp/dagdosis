// Datums zijn tekst in de vorm JJJJ-MM-DD, in lokale tijd. Rekenen gaat via UTC,
// zodat de wisseling van zomer- en wintertijd geen dag kan verschuiven.
export type Datum = string

const DAG_MS = 86_400_000

function utc(datum: Datum) {
  const [j, m, d] = datum.split('-').map(Number)
  return Date.UTC(j, m - 1, d)
}

function tekst(ms: number): Datum {
  return new Date(ms).toISOString().slice(0, 10)
}

export function datumVan(moment = new Date()): Datum {
  const m = String(moment.getMonth() + 1).padStart(2, '0')
  const d = String(moment.getDate()).padStart(2, '0')
  return `${moment.getFullYear()}-${m}-${d}`
}

export function plusDagen(datum: Datum, dagen: number): Datum {
  return tekst(utc(datum) + dagen * DAG_MS)
}

export function dagenTussen(van: Datum, tot: Datum) {
  return Math.round((utc(tot) - utc(van)) / DAG_MS)
}

/** 0 is maandag, 6 is zondag. */
export function weekdagIndex(datum: Datum) {
  return (new Date(utc(datum)).getUTCDay() + 6) % 7
}

export function maandagVan(datum: Datum): Datum {
  return plusDagen(datum, -weekdagIndex(datum))
}

/** ISO-weeknummer: week 1 is de week met de eerste donderdag van het jaar. */
export function weeknummer(datum: Datum) {
  const donderdag = plusDagen(maandagVan(datum), 3)
  const jaarStart = `${donderdag.slice(0, 4)}-01-01`
  return Math.floor(dagenTussen(jaarStart, donderdag) / 7) + 1
}
