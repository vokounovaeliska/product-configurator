function normalizeUnit(unit: string | null | undefined): string {
  return unit?.trim().toLowerCase() ?? ""
}

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
