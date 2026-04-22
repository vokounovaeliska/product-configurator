export function formatMoneyMainAndCurrency(amount: number, currency: string): string {
  const n = Math.round(amount)
  const formatted = new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
  return `${formatted} ${currency}`
}

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

export function formatIntegerCs(value: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

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

export function normalizeConditionValueForApi(raw: string): string {
  return raw.replace(/\s/g, "").replace(",", ".").trim()
}
