export type AttributePricingRuleDto = {
  id: string
  productModelId: string
  componentId: string | null
  attributeCode: string
  operator: string
  value: string
  toValue: string | null
  priceDeltaCents: number
  createdAt: string
  modifiedAt: string
}

export type AttributePricingRuleCreateDto = {
  componentId?: string | null
  attributeCode: string
  operator?: string
  value: string
  toValue?: string | null
  priceDeltaCents?: number
}

export type AttributePricingRuleUpdateDto = AttributePricingRuleCreateDto

export type ConfigurationPreviewSelectionDto = {
  componentId: string
  attributeCode: string
  value: string
}

export type ConfigurationPreviewRequestDto = {
  selections: ConfigurationPreviewSelectionDto[]
}

export type ConfigurationPreviewResponseDto = {
  totalPrice?: number
  modifiersCents?: number
}
