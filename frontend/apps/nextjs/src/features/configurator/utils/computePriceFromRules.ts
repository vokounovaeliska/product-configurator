import type { AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import type { AttributePricingRuleDto } from "@/api/pricingTypes"

type AttributeForPrice = {
  code: string
  type: string
  id: string
  defaultInt?: number | null
  defaultDecimal?: number | null
  minInt?: number | null
  minDecimal?: number | null
}
type AttributesByComponent = Record<string, AttributeForPrice[]>
type SelectedOptionsByComponent = Record<string, Record<string, AttributeOptionDto | null>>
type SelectedOtherValuesByComponent = Record<string, Record<string, number | boolean>>

/** Modifier in cents for an ENUM option (EQ rule on option `value`). Exported for configurator UI. */
export function getPriceForOption(
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
  return rule ? rule.price : null
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
        const fallback =
          attr.type === "INTEGER"
            ? (attr.defaultInt ?? attr.minInt ?? 0)
            : (attr.defaultDecimal ?? attr.minDecimal ?? 0)
        const value = typeof raw === "number" ? raw : Number.parseFloat(String(raw))
        const effective = typeof value === "number" && !Number.isNaN(value) ? value : fallback
        if (typeof effective === "number" && !Number.isNaN(effective)) {
          const rule = getRuleForNumericValue(pricingRules, component.id, attr.code, effective)
          if (rule) {
            totalCents += rule.price
          }
        }
      } else if (attr.type === "BOOLEAN") {
        const value = otherByAttr[attr.id]
        if (typeof value === "boolean") {
          const rule = getRuleForBoolean(pricingRules, component.id, attr.code, value)
          if (rule) totalCents += rule.price
        }
      }
    }
  }

  return totalCents
}
