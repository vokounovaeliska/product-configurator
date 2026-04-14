/**
 * Embed API response types. Shared by configurator (prefetched config) and embed feature.
 */

import type { AttributeDto, AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import type { AttributePricingRuleDto } from "@/api/pricingTypes"

export type ProductModelEmbedDto = {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  model3dUrl: string | null
  model3dEffects: string | null
  url: string | null
}

export type ConfiguratorPreferencesEmbedDto = {
  zoomDistanceDefault: number | null
  zoomDistanceEmbed: number | null
  embedShowProductName: boolean | null
  embedShowDescription: boolean | null
  embedShowComponents: boolean | null
  backgroundPreset: string | null
  cameraHorizontalAngleRad: number | null
  cameraVerticalAngleRad: number | null
}

export type ProductEmbedFullDto = {
  product: ProductModelEmbedDto
  components: ComponentDto[]
  attributesByComponent: Record<string, AttributeDto[]>
  optionsByAttribute: Record<string, AttributeOptionDto[]>
  pricingRules: AttributePricingRuleDto[]
  configuratorPreferences?: ConfiguratorPreferencesEmbedDto | null
}
