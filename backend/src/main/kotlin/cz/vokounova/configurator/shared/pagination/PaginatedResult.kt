package cz.vokounova.configurator.shared.pagination

data class PaginatedResult<T>(
    val data: List<T>,
    val pagesTotal: Int,
    val cursorBefore: EncodedCursor? = null,
    val cursorAfter: EncodedCursor? = null,
)
