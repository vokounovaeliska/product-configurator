import type { AttributeDto, AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"

export type Model3dConfig = {
  components: ComponentDto[]
  attributesByComponent: Record<string, AttributeDto[]>
  selectedOptionsByComponent: Record<string, Record<string, AttributeOptionDto | null>>
  selectedOtherValuesByComponent: Record<string, Record<string, number | boolean>>
  /** Options per attribute (for default color when none selected). attributeId → options. */
  optionsByAttribute?: Record<string, AttributeOptionDto[]>
}
