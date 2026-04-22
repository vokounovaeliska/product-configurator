import type { AttributePricingRuleDto } from "@/api/pricingTypes"

function parseNumericBound(raw: string | null | undefined): number | null {
  if (raw == null || raw.trim() === "") return null
  const n = Number.parseFloat(raw.replace(/\s/g, "").replace(",", "."))
  return Number.isFinite(n) ? n : null
}

export function getMaxUpperBoundForAttributeRules(
  rules: AttributePricingRuleDto[],
  componentId: string | null | undefined,
  attributeCode: string,
): number | null {
  const compKey = componentId ?? null
  const codeNorm = attributeCode.toLowerCase().trim()

  const relevant = rules.filter(
    (r) => (r.componentId ?? null) === compKey && r.attributeCode.toLowerCase().trim() === codeNorm,
  )

  let maxEnd = -Infinity
  for (const r of relevant) {
    if (r.operator === "BETWEEN") {
      const upper = parseNumericBound(r.toValue) ?? parseNumericBound(r.value)
      if (upper != null) maxEnd = Math.max(maxEnd, upper)
    } else if (r.operator === "EQ") {
      const v = parseNumericBound(r.value)
      if (v != null) maxEnd = Math.max(maxEnd, v)
    }
  }

  if (!Number.isFinite(maxEnd) || maxEnd === -Infinity) return null
  return maxEnd
}

export function suggestNextBetweenLowerBound(options: {
  maxUpper: number | null
  isDecimal: boolean
  numericMax: number
}): string | null {
  const { maxUpper, isDecimal, numericMax } = options
  if (maxUpper == null) return null
  const increment = isDecimal ? 0.01 : 1
  const next = maxUpper + increment
  if (next > numericMax) return null
  if (!isDecimal) return String(Math.round(next))
  return String(Number(next.toFixed(2)))
}
