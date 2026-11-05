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

export function Terugkop({ titel, terug = '#/' }: { titel: string; terug?: string }) {
  return (
    <header className="terugkop">
      <a href={terug} className="icoonknop" aria-label="Terug">
        <Icon naam="terug" />
      </a>
      <Titel>{titel}</Titel>
    </header>
  )
}
