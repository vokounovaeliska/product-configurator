/**
 * Condition for when an image layer is shown.
 * When attributeId is set, the layer is shown only when that attribute has the given option/value.
 */
export type ImageLayerConditionDto = {
  attributeId?: string | null
  optionId?: string | null
}

export type ImageLayerDto = {
  id: string
  componentId: string
  imageUrl: string
  zIndex: number
  conditions: ImageLayerConditionDto[]
  createdAt: string
  modifiedAt: string
}

export type ImageLayerCreateRequestDto = {
  imageUrl: string
  zIndex?: number | null
  conditions: ImageLayerConditionDto[]
}

export type ImageLayerPatchRequestDto = {
  path: "/imageUrl" | "/zIndex" | "/conditions"
  value: string | number | ImageLayerConditionDto[] | null
  op: "replace" | "add" | "remove"
}
