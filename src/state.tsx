import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { themas } from './inhoud'
import type { Instellingen } from './types'

// Fase 1 houdt alles in het geheugen; fase 3 en 4 zetten dit in IndexedDB.
export interface Afgerond {
  goed: number
  totaal: number
}

export interface Foutmelding {
  vraagId: string
  notitie: string
}

interface AppState {
  instellingen: Instellingen
  zetInstellingen: (i: Instellingen) => void
  afgerond: Afgerond | null
  zetAfgerond: (a: Afgerond) => void
  meldingen: Foutmelding[]
  voegMeldingToe: (m: Foutmelding) => void
}

const startInstellingen: Instellingen = {
  insteek: 'gemengd',
  ritme: false,
  uitlegMetMechanisme: true,
  bijsturen: true,
  themaFrequentie: Object.fromEntries(themas.map((t) => [t.id, 'normaal'])),
}

const Context = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [instellingen, zetInstellingen] = useState(startInstellingen)
  const [afgerond, zetAfgerond] = useState<Afgerond | null>(null)
  const [meldingen, zetMeldingen] = useState<Foutmelding[]>([])

  const waarde = useMemo(
    () => ({
      instellingen,
      zetInstellingen,
      afgerond,
      zetAfgerond,
      meldingen,
      voegMeldingToe: (m: Foutmelding) => zetMeldingen((oud) => [...oud, m]),
    }),
    [instellingen, afgerond, meldingen],
  )

  return <Context.Provider value={waarde}>{children}</Context.Provider>
}

export function useAppState() {
  const waarde = useContext(Context)
  if (!waarde) throw new Error('useAppState buiten AppStateProvider')
  return waarde
}
