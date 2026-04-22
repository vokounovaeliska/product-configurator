const FALLBACK_COLOR_MAP: Record<string, string> = {
  oak: "#C49A6C",
  black: "#1A1A1A",
  white: "#F5F5F5",
  walnut: "#5C4033",
  ash: "#DEB887",
  gray: "#808080",
  grey: "#808080",
  brown: "#8B4513",
  natural: "#DEB887",
  beech: "#DEB887",
  maple: "#D2691E",
  cherry: "#8B4513",
  oak2: "#C49A6C",
  black2: "#1A1A1A",
} as const

const DEFAULT_COLOR = "#8B4513"

export function getColorForOption(
  colorHex: string | null | undefined,
  value: string,
  label: string,
): string {
  if (colorHex) return colorHex

  const key = value.toLowerCase().replace(/[^a-z0-9áčďéěíňóřšťúůýž]/g, "_")
  const labelKey = label.toLowerCase().replace(/[^a-z0-9áčďéěíňóřšťúůýž]/g, "_")
  return FALLBACK_COLOR_MAP[key] ?? FALLBACK_COLOR_MAP[labelKey] ?? DEFAULT_COLOR
}
