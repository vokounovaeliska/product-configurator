import type { AttributeDto, AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"

type SelectedOptionsByComponent = Record<string, Record<string, AttributeOptionDto | null>>
type SelectedOtherValuesByComponent = Record<string, Record<string, number | boolean>>

export type FullConfiguration = {
  selectedOptionsByComponent: Record<string, Record<string, AttributeOptionDto | null>>
  selectedOtherValuesByComponent: Record<string, Record<string, number | boolean>>
}

export function buildFullConfigurationForRequest(
  components: ComponentDto[],
  attributesByComponent: Record<string, AttributeDto[]>,
  optionsByAttribute: Record<string, AttributeOptionDto[]>,
  selectedOptionsByComponent: SelectedOptionsByComponent,
  selectedOtherValuesByComponent: SelectedOtherValuesByComponent,
): FullConfiguration {
  const mergedOptions: Record<string, Record<string, AttributeOptionDto | null>> = {}
  const mergedOther: Record<string, Record<string, number | boolean>> = {}

  for (const component of components) {
    const attrs = attributesByComponent[component.id] ?? []
    const compOptions = selectedOptionsByComponent[component.id] ?? {}
    const compOther = selectedOtherValuesByComponent[component.id] ?? {}

    const mergedCompOptions: Record<string, AttributeOptionDto | null> = { ...compOptions }
    const mergedCompOther: Record<string, number | boolean> = { ...compOther }

    for (const attr of attrs) {
      if (attr.type === "ENUM") {
        const current = mergedCompOptions[attr.id]
        if (current === undefined) {
          const options = optionsByAttribute[attr.id] ?? []
          const first = [...options].sort((a, b) => a.sortOrder - b.sortOrder)[0]
          if (first) {
            mergedCompOptions[attr.id] = first
          }
        }
      } else if (attr.type === "INTEGER") {
        const current = mergedCompOther[attr.id]
        if (current === undefined) {
          mergedCompOther[attr.id] = attr.defaultInt ?? attr.minInt ?? 0
        }
      } else if (attr.type === "DECIMAL") {
        const current = mergedCompOther[attr.id]
        if (current === undefined) {
          mergedCompOther[attr.id] = attr.defaultDecimal ?? attr.minDecimal ?? 0
        }
      } else if (attr.type === "BOOLEAN") {
        const current = mergedCompOther[attr.id]
        if (current === undefined) {
          mergedCompOther[attr.id] = false
        }
      }
    }

    if (Object.keys(mergedCompOptions).length > 0) {
      mergedOptions[component.id] = mergedCompOptions
    }
    if (Object.keys(mergedCompOther).length > 0) {
      mergedOther[component.id] = mergedCompOther
    }
  }

  return {
    selectedOptionsByComponent: mergedOptions,
    selectedOtherValuesByComponent: mergedOther,
  }
}
