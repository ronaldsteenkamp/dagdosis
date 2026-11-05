export function downloadCsv(bestandsnaam: string, inhoud: string) {
  const url = URL.createObjectURL(new Blob([inhoud], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = bestandsnaam
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
