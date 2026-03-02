/**
 * Product Model API Types
 * These types match the backend DTOs
 */

export type ProductModelDto = {
  /** Format: uuid */
  id: string
  /** Format: uuid */
  userId: string
  name: string
  description: string | null
  price: number
  currency: string
  isActive: boolean
  /** URL to 3D model (GLB) for configurator preview */
  model3dUrl?: string | null
  /** Embed URL path (e.g. my-product). Globally unique when published. */
  url?: string | null
  /** When true, product is available at /e/{url} for embedding. */
  isPublished?: boolean
  /** Format: date-time */
  createdAt: string
  /** Format: date-time */
  modifiedAt: string
}

export type ProductModelPaginatedResponseDto = {
  items: ProductModelDto[]
  pageMetadata: {
    /** Format: int32 */
    pagesTotal: number
    nextPageAfter?: string
    prevPageBefore?: string
  }
}

export type ProductModelCreateRequestDto = {
  name: string
  description?: string | null
  price?: number | null
  currency?: string | null
  isActive?: boolean | null
}

export type ProductModelPatchRequestDto = {
  /** @enum {string} */
  path:
    | "SlashName"
    | "SlashDescription"
    | "SlashPrice"
    | "SlashCurrency"
    | "SlashIsActive"
    | "SlashUrl"
    | "SlashIsPublished"
  value?: unknown
  /** @enum {string} */
  op: "Replace"
}

export type ProductModelListQueryParams = {
  limit?: number
  after?: string
  before?: string
  orderBy?: string[]
  ids?: string[]
  userIds?: string[]
  isActive?: boolean
}
