package cz.vokounova.configurator.shared.rest.response

data class PaginatedResponseMetaDto(
    val pagesTotal: Int,
    val nextPageAfter: String?,
    val prevPageBefore: String?,
)
