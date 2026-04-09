/**
 * Convert numeric attribute bounds/defaults when the user changes length unit (e.g. cm → mm).
 * Values are interpreted in the *previous* unit and written in the *new* unit so the physical range stays the same.
 */

function normalizeUnit(unit: string | null | undefined): string {
  return unit?.trim().toLowerCase() ?? ""
}

/** Millimeters represented by one unit of `unit` (length). */
function mmPerUnit(unit: string | null | undefined): number | null {
  const u = normalizeUnit(unit)
  if (u === "mm") return 1
  if (u === "cm") return 10
  if (u === "m") return 1000
  if (u === "in" || u === "inch" || u === "inches") return 25.4
  return null
}

export function canConvertLengthUnits(
  fromUnit: string | null | undefined,
  toUnit: string | null | undefined,
): boolean {
  return mmPerUnit(fromUnit) != null && mmPerUnit(toUnit) != null
}

/**
 * Converts a single numeric value from `fromUnit` to `toUnit`.
 * INTEGER results are rounded; DECIMAL results are stabilized against float noise.
 */
export function convertLengthValue(
  value: number,
  fromUnit: string | null | undefined,
  toUnit: string | null | undefined,
  mode: "INTEGER" | "DECIMAL",
): number | null {
  const fromMm = mmPerUnit(fromUnit)
  const toMm = mmPerUnit(toUnit)
  if (fromMm == null || toMm == null || toMm === 0) return null
  const valueMm = value * fromMm
  const raw = valueMm / toMm
  if (mode === "INTEGER") return Math.round(raw)
  return Number.parseFloat(raw.toPrecision(12))
}

export function convertLengthNullable(
  value: number | null | undefined,
  fromUnit: string | null | undefined,
  toUnit: string | null | undefined,
  mode: "INTEGER" | "DECIMAL",
): number | null {
  if (value == null) return null
  return convertLengthValue(value, fromUnit, toUnit, mode)
}
