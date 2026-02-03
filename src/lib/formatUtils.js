/**
 * Format a number as currency for display (fr-FR style: 1 234,56)
 */
export function formatCurrency(value, currency = 'EUR') {
  if (value === '' || value == null || Number.isNaN(Number(value))) return ''
  const n = Number(value)
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Parse user input to number (accepts comma or dot as decimal separator, spaces ignored)
 */
export function parseCurrency(input) {
  if (input === '' || input == null) return ''
  const s = String(input).replace(/\s/g, '').replace(',', '.')
  const n = parseFloat(s)
  return Number.isNaN(n) ? '' : n
}

/**
 * Format Date or ISO string to datetime-local value (YYYY-MM-DDTHH:mm)
 */
export function toDateTimeLocal(isoOrDate) {
  if (!isoOrDate) return ''
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

/**
 * Parse datetime-local value to ISO string
 */
export function fromDateTimeLocal(value) {
  if (!value || !value.trim()) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

/** Suggestions for service types (admin project form) */
export const SUGGESTIONS_SERVICE_TYPES = [
  'Design',
  'Développement',
  'Conseil',
  'Stratégie',
  'Rédaction',
  'SEO',
  'Maquettage',
  'Intégration',
  'Formation',
  'Maintenance',
  'Autre',
]

/** Suggestions for deliverable types */
export const SUGGESTIONS_DELIVERABLE_TYPES = [
  'Maquettes',
  'Code source',
  'Documentation',
  'Cahier des charges',
  'Rapport',
  'Contenu',
  'Assets',
  'Lien',
  'Fichiers',
  'Autre',
]

/** Suggestions for tags */
export const SUGGESTIONS_TAGS = [
  'urgent',
  'refonte',
  'nouveau',
  'maintenance',
  'prestation',
  'récurrent',
  'prioritaire',
]
