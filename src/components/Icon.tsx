const paden = {
  vandaag: <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M8.5 3v4M15.5 3v4" /></>,
  voortgang: <path d="M5 20v-6M12 20V5M19 20v-9" />,
  team: <><circle cx="9" cy="9" r="3.5" /><path d="M3 20c.6-3.6 3-5.5 6-5.5s5.4 1.9 6 5.5" /><path d="M15.5 5.8a3.5 3.5 0 0 1 0 6.4M17.5 14.9c1.9.8 3.1 2.5 3.5 5.1" /></>,
  instellingen: <><path d="M4 7h9M18 7h2M4 17h2M11 17h9" /><circle cx="15.5" cy="7" r="2.5" /><circle cx="8.5" cy="17" r="2.5" /></>,
  sluit: <path d="M6 6l12 12M18 6L6 18" />,
  terug: <path d="M15 5l-7 7 7 7" />,
  vlam: <path d="M12 3c.5 3.5 5.5 6 5.5 11a5.5 5.5 0 0 1-11 0c0-2 .9-3.4 2-4.5.2 1.5.9 2.3 1.8 2.7C10 9 10.5 6 12 3z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  kruis: <path d="M7 7l10 10M17 7L7 17" />,
  pijlRechts: <path d="M5 12h14M13 6l6 6-6 6" />,
  pijlOmlaag: <path d="M12 4v15M6.5 13.5L12 19l5.5-5.5" />,
  klok: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5.2l3.3 2" /></>,
  lamp: <><path d="M9 17.5h6M10 20.5h4" /><path d="M12 3.5a6 6 0 0 0-3.5 10.9c.6.5.9 1 1 1.6h5c.1-.6.4-1.1 1-1.6A6 6 0 0 0 12 3.5z" /></>,
  link: <path d="M9 6H6.5A2.5 2.5 0 0 0 4 8.5v9A2.5 2.5 0 0 0 6.5 20h9a2.5 2.5 0 0 0 2.5-2.5V15M13 4h7v7M20 4l-9 9" />,
  boek: <><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z" /><path d="M5 20.5A2.5 2.5 0 0 0 7.5 21H19v-3" /></>,
  keten: <><rect x="7" y="3" width="10" height="5" rx="2" /><rect x="7" y="16" width="10" height="5" rx="2" /><path d="M12 8v8" /></>,
  waarschuwing: <><path d="M12 4l9 16H3z" /><path d="M12 10v4.5M12 17.3v.2" /></>,
  vlag: <path d="M6 21V4M6 5h11l-2.5 4 2.5 4H6" />,
  download: <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />,
  herhaal: <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5" />,
} as const

export type IconNaam = keyof typeof paden

export function Icon({ naam, maat = 24 }: { naam: IconNaam; maat?: number }) {
  return (
    <svg
      className="icon"
      width={maat}
      height={maat}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paden[naam]}
    </svg>
  )
}
