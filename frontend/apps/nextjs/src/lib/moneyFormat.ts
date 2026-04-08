/**
 * Whole currency amounts: display with cs-CZ grouping (e.g. 10 000) + ISO currency code.
 * Inputs are major units (e.g. CZK); pricing rules API uses minor units (cents).
 */

export function formatMoneyMainAndCurrency(amount: number, currency: string): string {
  const n = Math.round(amount)
  const formatted = new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
  return `${formatted} ${currency}`
}

/** Parse editable price text (digits, spaces, comma decimal) to whole major units. */
export function parseWholeCurrencyInput(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".").trim()
  if (cleaned === "") return null
  const n = Number.parseFloat(cleaned)
  if (Number.isNaN(n)) return null
  return Math.round(n)
}

export function majorUnitsToCents(major: number): number {
  return Math.round(major) * 100
}

export function parseMajorUnitsToCents(raw: string): number | null {
  const major = parseWholeCurrencyInput(raw)
  if (major === null) return null
  return majorUnitsToCents(major)
}

/** Whole numbers with thousands grouped (e.g. 10 000). */
export function formatIntegerCs(value: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

/**
 * Format a stored or typed numeric string for display (grouping; comma decimal in cs-CZ).
 * Use maxFractionDigits 0 for INTEGER, 2 for DECIMAL conditions.
 */
export function formatDraftNumberCs(raw: string, maxFractionDigits: number): string {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".").trim()
  if (cleaned === "") return ""
  const n = Number.parseFloat(cleaned)
  if (Number.isNaN(n)) return raw
  return new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(n)
}

/** Strip grouping spaces and normalize decimal separator for API storage. */
export function normalizeConditionValueForApi(raw: string): string {
  return raw.replace(/\s/g, "").replace(",", ".").trim()
}
