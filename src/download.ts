export function downloadBestand(bestandsnaam: string, inhoud: string, type: string) {
  const url = URL.createObjectURL(new Blob([inhoud], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = bestandsnaam
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadCsv(bestandsnaam: string, inhoud: string) {
  downloadBestand(bestandsnaam, inhoud, 'text/csv;charset=utf-8')
}
