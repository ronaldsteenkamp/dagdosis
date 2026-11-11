// Herkent het toestel, zodat de app de juiste uitleg geeft om Dagdosis op het beginscherm te zetten.
// Een iPhone vraagt dat nooit zelf; Chrome op Android en de computer bieden een eigen knop aan.

export type Platform = 'ios' | 'android' | 'computer'

/** Een iPad met iPadOS doet zich voor als Mac, maar heeft een aanraakscherm. */
export function platformVan(userAgent: string, aanraakpunten: number): Platform {
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'ios'
  if (/Macintosh/.test(userAgent) && aanraakpunten > 1) return 'ios'
  if (/Android/.test(userAgent)) return 'android'
  return 'computer'
}

/** In een app in Instagram of Facebook kun je niets op het beginscherm zetten. */
export function inAppBrowser(userAgent: string) {
  return /FBAN|FBAV|Instagram|LinkedInApp|Line\//.test(userAgent)
}

/** Draait de app nu vanaf het beginscherm, als losse app? */
export function isGeinstalleerd(): boolean {
  const ios = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return ios || window.matchMedia?.('(display-mode: standalone)').matches === true
}

// Chrome en Edge sturen dit event vroeg, vaak al voor React draait. Daarom vangen we het hier op,
// zodra dit bestand geladen is, en onthouden we het tot iemand op "Installeren" tikt.
interface InstallatieVraag extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let vraag: InstallatieVraag | null = null
const luisteraars = new Set<() => void>()
const meld = () => luisteraars.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    vraag = e as InstallatieVraag
    meld()
  })
  window.addEventListener('appinstalled', () => {
    vraag = null
    meld()
  })
}

export const kanInstallatieVragen = () => vraag !== null

export function volgInstallatie(luisteraar: () => void) {
  luisteraars.add(luisteraar)
  return () => {
    luisteraars.delete(luisteraar)
  }
}

/** Toont de installatievraag van de browser. Geeft true als iemand op installeren tikte. */
export async function vraagInstallatie(): Promise<boolean> {
  if (!vraag) return false
  const v = vraag
  await v.prompt()
  const { outcome } = await v.userChoice
  // Een vraag mag maar één keer; de browser stuurt later zo nodig een nieuwe.
  vraag = null
  meld()
  return outcome === 'accepted'
}
