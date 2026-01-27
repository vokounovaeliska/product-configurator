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
  sortOrder?: number | null
}

export type AttributePatchRequestDto = {
  /** @enum {string} */
  path:
    | "SlashCode"
    | "SlashLabel"
    | "SlashType"
    | "SlashIsRequired"
    | "SlashMinInt"
    | "SlashMaxInt"
    | "SlashMinDecimal"
    | "SlashMaxDecimal"
    | "SlashSortOrder"
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
  /** Format: int32 */
  sortOrder: number
  /** Format: date-time */
  createdAt: string
  /** Format: date-time */
  modifiedAt: string
}
