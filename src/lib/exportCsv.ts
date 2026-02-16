/**
 * Escapes a CSV field value by handling special characters.
 * Fields containing commas, double quotes, or newlines are wrapped in double quotes.
 * Any existing double quotes within the field are escaped by doubling them.
 */
function escapeField(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Generates a CSV file and triggers a browser download.
 *
 * @param filename - The name of the downloaded file (should end with .csv)
 * @param headers - Array of column header strings
 * @param rows - 2D array of string values, one sub-array per row
 */
export function exportToCsv(filename: string, headers: string[], rows: string[][]): void {
  const BOM = '\uFEFF'
  const headerLine = headers.map(escapeField).join(',')
  const bodyLines = rows.map((row) => row.map(escapeField).join(','))
  const csvContent = BOM + [headerLine, ...bodyLines].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()

  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
