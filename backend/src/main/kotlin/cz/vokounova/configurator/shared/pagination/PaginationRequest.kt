package cz.vokounova.configurator.shared.pagination

open class PaginationRequest<T>(
    open val limit: Int,
    open val orderByFields: List<OrderBy<T>>,
) where T : SortableField

data class FinalPageRequest<T>(
    override val limit: Int,
    override val orderByFields: List<OrderBy<T>>,
) : PaginationRequest<T>(limit, orderByFields)
    where T : SortableField

data class PageAfterRequest<T>(
    val after: EncodedCursor,
    override val limit: Int,
    override val orderByFields: List<OrderBy<T>>,
) : PaginationRequest<T>(limit, orderByFields)
    where T : SortableField

data class PageBeforeRequest<T>(
    val before: EncodedCursor,
    override val limit: Int,
    override val orderByFields: List<OrderBy<T>>,
) : PaginationRequest<T>(limit, orderByFields)
    where T : SortableField

data class PaginationParams(
    val limit: Int,
    val afterCursor: String? = null,
    val beforeCursor: String? = null,
)
