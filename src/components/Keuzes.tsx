import { useId } from 'react'

/** Gesegmenteerde keuze op echte radioknoppen: toetsenbord en schermlezer werken vanzelf. */
export function Segment<T extends string>({
  label,
  opties,
  waarde,
  onChange,
  disabled,
  klein,
}: {
  label: string
  opties: { waarde: T; label: string }[]
  waarde: T | undefined
  onChange: (w: T) => void
  disabled?: boolean
  klein?: boolean
}) {
  const naam = useId()
  return (
    <div role="radiogroup" aria-label={label} className={`segment${klein ? ' segment-klein' : ''}`}>
      {opties.map((o) => (
        <label key={o.waarde} className="segment-optie">
          <input
            type="radio"
            name={naam}
            checked={o.waarde === waarde}
            disabled={disabled}
            onChange={() => onChange(o.waarde)}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  )
}

export function Schakelaar({
  label,
  uitleg,
  aan,
  onChange,
}: {
  label: string
  uitleg?: string
  aan: boolean
  onChange: (aan: boolean) => void
}) {
  const id = useId()
  return (
    <div className="schakelrij">
      <div>
        <span id={id} className="schakelrij-label">
          {label}
        </span>
        {uitleg && <p className="gedempt klein">{uitleg}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={aan}
        aria-labelledby={id}
        className="schakelaar"
        onClick={() => onChange(!aan)}
      >
        <span className="schakelaar-spoor">
          <span className="schakelaar-knop" />
        </span>
      </button>
    </div>
  )
}
