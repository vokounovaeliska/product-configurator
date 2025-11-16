package cz.vokounova.configurator.shared.pagination

interface SortableField {
    val fieldName: String
}

enum class SortableFieldOrder { ASC, DESC }

data class OrderBy<T : SortableField>(
    val field: T,
    val order: SortableFieldOrder,
)
