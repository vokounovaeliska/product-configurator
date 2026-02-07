/**
 * Component API Types
 * These types match the backend DTOs
 */

export type ComponentDto = {
  /** Format: uuid */
  id: string
  /** Format: uuid */
  productModelId: string
  code: string
  label: string
  description: string | null
  /** Format: int32 */
  sortOrder: number
  /** Z-index for stacking component image (lower = back, higher = front). Format: int32 */
  imageZIndex: number
  /** Format: date-time */
  createdAt: string
  /** Format: date-time */
  modifiedAt: string
}

export type ComponentPaginatedResponseDto = {
  items: ComponentDto[]
  pageMetadata: {
    /** Format: int32 */
    pagesTotal: number
    nextPageAfter?: string
    prevPageBefore?: string
  }
}

export type ComponentCreateRequestDto = {
  code: string
  label: string
  description?: string | null
  sortOrder?: number | null
  imageZIndex?: number | null
}

export type ComponentPatchRequestDto = {
  /** @enum {string} */
  path: "SlashCode" | "SlashLabel" | "SlashDescription" | "SlashSortOrder" | "SlashImageZIndex"
  value?: unknown
  /** @enum {string} */
  op: "Replace"
}

export type ComponentListQueryParams = {
  limit?: number
  after?: string
  before?: string
  orderBy?: string[]
  ids?: string[]
  productModelIds?: string[]
}
