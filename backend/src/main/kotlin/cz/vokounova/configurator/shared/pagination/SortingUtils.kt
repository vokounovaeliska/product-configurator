package cz.vokounova.configurator.shared.pagination

object SortingUtils {
    const val SORT_ORDER_PREFIX = "-"

    fun <T : SortableField> createSorting(
        orderList: List<String>?,
        config: SortingConfig<T>,
    ): List<OrderBy<T>> =
        orderList?.let {
            it.map { listItem ->
                val itemWithoutPrefix = listItem.removePrefix(SORT_ORDER_PREFIX)
                val sortOrder = if (listItem.startsWith(SORT_ORDER_PREFIX)) SortableFieldOrder.DESC else SortableFieldOrder.ASC

                OrderBy(config.getValue(itemWithoutPrefix), sortOrder)
            }
        } ?: listOf(
            OrderBy(
                field = config.defaultField(),
                order = config.defaultFieldOrder(),
            ),
        )
}

interface SortingConfig<T : SortableField> {
    fun defaultFieldOrder(): SortableFieldOrder

    fun defaultField(): T

    fun getValue(field: String): T
}
