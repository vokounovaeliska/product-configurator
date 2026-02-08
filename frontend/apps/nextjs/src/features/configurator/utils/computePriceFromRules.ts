import type { AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import type { AttributePricingRuleDto } from "@/api/pricingTypes"

type AttributesByComponent = Record<string, { code: string; type: string; id: string }[]>
type SelectedOptionsByComponent = Record<string, Record<string, AttributeOptionDto | null>>
type SelectedOtherValuesByComponent = Record<string, Record<string, number | boolean>>

function getPriceForOption(
  rules: AttributePricingRuleDto[],
  componentId: string,
  attributeCode: string,
  optionValue: string,
): number | null {
  const rule = rules.find(
    (r) =>
      (r.componentId === componentId || r.componentId == null) &&
      r.attributeCode === attributeCode &&
      r.operator === "EQ" &&
      r.value === optionValue,
  )
  return rule ? rule.priceDeltaCents : null
}

function getRuleForNumericValue(
  rules: AttributePricingRuleDto[],
  componentId: string,
  attributeCode: string,
  currentValue: number,
): AttributePricingRuleDto | undefined {
  return rules.find((r) => {
    if (r.componentId !== componentId && r.componentId != null) return false
    if (r.attributeCode !== attributeCode) return false
    const from = Number.parseFloat(r.value)
    if (Number.isNaN(from)) return false
    if (r.operator === "EQ") return currentValue === from
    if (r.operator === "BETWEEN") {
      const to = r.toValue != null ? Number.parseFloat(r.toValue) : from
      return !Number.isNaN(to) && currentValue >= from && currentValue <= to
    }
    return false
  })
}

function getRuleForBoolean(
  rules: AttributePricingRuleDto[],
  componentId: string,
  attributeCode: string,
  isChecked: boolean,
): AttributePricingRuleDto | undefined {
  return rules.find(
    (r) =>
      (r.componentId === componentId || r.componentId == null) &&
      r.attributeCode === attributeCode &&
      r.operator === "EQ" &&
      r.value === String(isChecked),
  )
}

/**
 * Computes total modifier in cents from current selection and pricing rules.
 * Uses the same rule-matching logic as the option table (e.g. Barva → +500 Kč).
 */
export function computeModifiersCents(
  pricingRules: AttributePricingRuleDto[],
  components: ComponentDto[],
  attributesByComponent: AttributesByComponent,
  selectedOptionsByComponent: SelectedOptionsByComponent,
  selectedOtherValuesByComponent: SelectedOtherValuesByComponent,
): number {
  let totalCents = 0

  for (const component of components) {
    const attributes = attributesByComponent[component.id] ?? []
    const optionsByAttr = selectedOptionsByComponent[component.id] ?? {}
    const otherByAttr = selectedOtherValuesByComponent[component.id] ?? {}

    for (const attr of attributes) {
      if (attr.type === "ENUM") {
        const option = optionsByAttr[attr.id]
        const value = option?.value ?? ""
        if (value !== "") {
          const delta = getPriceForOption(pricingRules, component.id, attr.code, value)
          if (delta != null) totalCents += delta
        }
      } else if (attr.type === "INTEGER" || attr.type === "DECIMAL") {
        const raw = otherByAttr[attr.id]
        const value = typeof raw === "number" ? raw : Number.parseFloat(String(raw))
        if (typeof value === "number" && !Number.isNaN(value)) {
          const rule = getRuleForNumericValue(pricingRules, component.id, attr.code, value)
          if (rule) {
            if (rule.pricePerUnitCents != null) {
              totalCents += Math.round(value * rule.pricePerUnitCents)
            } else {
              totalCents += rule.priceDeltaCents
            }
          }
        }
      } else if (attr.type === "BOOLEAN") {
        const value = otherByAttr[attr.id]
        if (typeof value === "boolean") {
          const rule = getRuleForBoolean(pricingRules, component.id, attr.code, value)
          if (rule) totalCents += rule.priceDeltaCents
        }
      }
    }
  }

  return totalCents
}
