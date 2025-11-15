package cz.vokounova.configurator.api.dto

data class PaginatedResponseMetaDto(
    val pagesTotal: Int,
    val nextPageAfter: String?,
    val prevPageBefore: String?,
)
