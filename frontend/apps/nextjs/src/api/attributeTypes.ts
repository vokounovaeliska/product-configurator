export type AttributeType = "ENUM" | "INTEGER" | "DECIMAL" | "BOOLEAN"

export type AttributeDto = {
  id: string

  componentId: string
  code: string
  label: string
  type: AttributeType
  isRequired: boolean
  minInt: number | null
  maxInt: number | null
  minDecimal: number | null
  maxDecimal: number | null

  defaultInt?: number | null

  defaultDecimal?: number | null

  unit: string | null

  sortOrder: number

  createdAt: string

  modifiedAt: string
}

export type AttributePaginatedResponseDto = {
  items: AttributeDto[]
  pageMetadata: {
    pagesTotal: number
    nextPageAfter?: string
    prevPageBefore?: string
  }
}

export type AttributeCreateRequestDto = {
  code: string
  label: string
  type: AttributeType
  isRequired?: boolean | null
  minInt?: number | null
  maxInt?: number | null
  minDecimal?: number | null
  maxDecimal?: number | null
  defaultInt?: number | null
  defaultDecimal?: number | null
  unit?: string | null
  sortOrder?: number | null
}

export type AttributePatchPath =
  | "/code"
  | "/label"
  | "/type"
  | "/isRequired"
  | "/minInt"
  | "/maxInt"
  | "/minDecimal"
  | "/maxDecimal"
  | "/defaultInt"
  | "/defaultDecimal"
  | "/unit"
  | "/sortOrder"

export type AttributePatchRequestDto = {
  path: AttributePatchPath
  value?: unknown

  op: "Replace"
}

export type AttributeListQueryParams = {
  limit?: number
  after?: string
  before?: string
  orderBy?: string[]
  ids?: string[]
  componentIds?: string[]
  types?: AttributeType[]
}

export type AttributeOptionDto = {
  id: string

  attributeId: string
  value: string
  label: string
  imageUrl: string | null

  sortOrder: number

  createdAt: string

  modifiedAt: string
}

export type AttributeOptionCreateRequestDto = {
  value: string
  label: string
  imageUrl?: string | null
  sortOrder?: number | null
}

export type AttributeOptionPatchRequestDto = {
  path: "SlashValue" | "SlashLabel" | "SlashImageUrl" | "SlashSortOrder"
  value: unknown
  op: "Replace"
}
