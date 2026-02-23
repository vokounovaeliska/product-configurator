/**
 * Attribute API Types
 * These types match the backend DTOs
 */

export type AttributeType = "ENUM" | "INTEGER" | "DECIMAL" | "BOOLEAN"

export type AttributeDto = {
  /** Format: uuid */
  id: string
  /** Format: uuid */
  componentId: string
  code: string
  label: string
  type: AttributeType
  isRequired: boolean
  minInt: number | null
  maxInt: number | null
  minDecimal: number | null
  maxDecimal: number | null
  /** Default value for INTEGER (within min..max when set). Optional for backward compat. */
  defaultInt?: number | null
  /** Default value for DECIMAL (within min..max when set). Optional for backward compat. */
  defaultDecimal?: number | null
  /** Optional unit for numeric attributes (e.g. "mm") */
  unit: string | null
  /** Format: int32 */
  sortOrder: number
  /** Format: date-time */
  createdAt: string
  /** Format: date-time */
  modifiedAt: string
}

export type AttributePaginatedResponseDto = {
  items: AttributeDto[]
  pageMetadata: {
    /** Format: int32 */
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

/** JSON Pointer path for attribute PATCH (RFC 6901). Backend accepts these path values. */
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
  /** @enum {string} */
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
  /** Format: uuid */
  id: string
  /** Format: uuid */
  attributeId: string
  value: string
  label: string
  imageUrl: string | null
  /** Hex color for 3D material (e.g. "#C49A6C"). Null when not set. */
  colorHex: string | null
  /** Format: int32 */
  sortOrder: number
  /** Format: date-time */
  createdAt: string
  /** Format: date-time */
  modifiedAt: string
}

export type AttributeOptionCreateRequestDto = {
  value: string
  label: string
  imageUrl?: string | null
  colorHex?: string | null
  sortOrder?: number | null
}

export type AttributeOptionPatchRequestDto = {
  path: "SlashValue" | "SlashLabel" | "SlashImageUrl" | "SlashColorHex" | "SlashSortOrder"
  value: unknown
  op: "Replace"
}
