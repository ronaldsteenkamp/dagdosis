import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

/** Schermtitel die de focus krijgt, zodat een schermlezer de wissel meekrijgt. */
export function Titel({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])
  return (
    <h1 ref={ref} tabIndex={-1} className={className}>
      {children}
    </h1>
  )
}

export function Terugkop({ titel, onTerug }: { titel: string; onTerug?: () => void }) {
  return (
    <header className="terugkop">
      {onTerug ? (
        <button type="button" className="icoonknop" aria-label="Terug" onClick={onTerug}>
          <Icon naam="terug" />
        </button>
      ) : (
        <a href="#/" className="icoonknop" aria-label="Terug">
          <Icon naam="terug" />
        </a>
      )}
      <Titel>{titel}</Titel>
    </header>
  )
}
