import { describe, it, expect } from 'vitest'
import { formatCurrency, parseCurrency, toDateTimeLocal, fromDateTimeLocal } from '../formatUtils'

describe('formatCurrency', () => {
  it('formats a normal number with two decimals (fr-FR style)', () => {
    const result = formatCurrency(1234.5)
    // fr-FR uses narrow no-break space (U+202F) or non-breaking space as thousands separator
    expect(result).toMatch(/1[\s\u00A0\u202F]234,50/)
  })

  it('returns empty string for empty string input', () => {
    expect(formatCurrency('')).toBe('')
  })

  it('returns empty string for null', () => {
    expect(formatCurrency(null)).toBe('')
  })

  it('returns empty string for NaN', () => {
    expect(formatCurrency(NaN)).toBe('')
  })

  it('returns empty string for non-numeric string', () => {
    expect(formatCurrency('abc')).toBe('')
  })

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('0,00')
  })

  it('formats string number correctly', () => {
    const result = formatCurrency('99.9')
    expect(result).toBe('99,90')
  })
})

describe('parseCurrency', () => {
  it('parses a string with comma as decimal separator', () => {
    expect(parseCurrency('1234,56')).toBe(1234.56)
  })

  it('ignores spaces in the input', () => {
    expect(parseCurrency('1 234,56')).toBe(1234.56)
  })

  it('returns empty string for empty input', () => {
    expect(parseCurrency('')).toBe('')
  })

  it('returns empty string for null', () => {
    expect(parseCurrency(null)).toBe('')
  })

  it('returns empty string for invalid (non-numeric) input', () => {
    expect(parseCurrency('abc')).toBe('')
  })

  it('parses a dot-separated decimal', () => {
    expect(parseCurrency('99.9')).toBe(99.9)
  })
})

describe('toDateTimeLocal', () => {
  it('converts a valid ISO date string to datetime-local format', () => {
    const iso = '2024-06-15T14:30:00.000Z'
    const result = toDateTimeLocal(iso)
    // The result depends on local timezone, but the format should be YYYY-MM-DDTHH:mm
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('returns empty string for null', () => {
    expect(toDateTimeLocal(null)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(toDateTimeLocal('')).toBe('')
  })

  it('returns empty string for an invalid date string', () => {
    expect(toDateTimeLocal('not-a-date')).toBe('')
  })

  it('handles a Date object', () => {
    const d = new Date(2024, 0, 15, 10, 30)
    const result = toDateTimeLocal(d)
    expect(result).toBe('2024-01-15T10:30')
  })
})

describe('fromDateTimeLocal', () => {
  it('converts a valid datetime-local value to an ISO string', () => {
    const result = fromDateTimeLocal('2024-06-15T14:30')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    // Should be a parseable ISO string
    expect(new Date(result).getFullYear()).toBe(2024)
  })

  it('returns empty string for empty input', () => {
    expect(fromDateTimeLocal('')).toBe('')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(fromDateTimeLocal('   ')).toBe('')
  })

  it('returns empty string for an invalid datetime value', () => {
    expect(fromDateTimeLocal('not-a-date')).toBe('')
  })
})
