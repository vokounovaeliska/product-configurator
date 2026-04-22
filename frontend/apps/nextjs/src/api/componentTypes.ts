export type ComponentDto = {
  id: string

  productModelId: string
  code: string
  label: string
  description: string | null

  sortOrder: number

  imageZIndex: number

  createdAt: string

  modifiedAt: string
}

export type ComponentPaginatedResponseDto = {
  items: ComponentDto[]
  pageMetadata: {
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
  path: "SlashCode" | "SlashLabel" | "SlashDescription" | "SlashSortOrder" | "SlashImageZIndex"
  value?: unknown

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
