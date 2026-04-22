export type ProductModelDto = {
  id: string

  userId: string
  name: string
  description: string | null
  price: number
  currency: string
  isActive: boolean

  model3dUrl?: string | null

  model3dEffects?: string | null

  url?: string | null

  isPublished?: boolean

  createdAt: string

  modifiedAt: string
}

export type ProductModelPaginatedResponseDto = {
  items: ProductModelDto[]
  pageMetadata: {
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
  path:
    | "SlashName"
    | "SlashDescription"
    | "SlashPrice"
    | "SlashCurrency"
    | "SlashIsActive"
    | "SlashUrl"
    | "SlashIsPublished"
  value?: unknown

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
