package cz.vokounova.configurator.shared.pagination

object PaginationUtils {
    const val LAST_PAGE = "lastPage"
    const val DEFAULT_LIMIT = 20

    inline fun <reified T> createPaginationRequest(
        limit: Int?,
        orderBy: List<OrderBy<T>>,
        after: String? = null,
        before: String? = null,
    ): PaginationRequest<T>
            where T : SortableField {
        val paginationLimit = limit ?: DEFAULT_LIMIT
        return when {
            after != null -> PageAfterRequest(EncodedCursor(after), paginationLimit, orderBy)
            before == LAST_PAGE -> FinalPageRequest(paginationLimit, orderBy)
            before != null ->
                PageBeforeRequest(EncodedCursor(before), paginationLimit, orderBy)

            else -> PaginationRequest(paginationLimit, orderBy)
        }
    }
}
