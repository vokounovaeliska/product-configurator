package cz.vokounova.configurator.products.models.domain

import cz.vokounova.configurator.shared.pagination.SortableField
import cz.vokounova.configurator.shared.pagination.SortableFieldOrder
import cz.vokounova.configurator.shared.pagination.SortingConfig

enum class ProductModelSortableField(
    override val fieldName: String,
) : SortableField {
    NAME("name"),
    PRICE("price"),
    CURRENCY("currency"),
    IS_ACTIVE("isActive"),
    CREATED_AT("createdAt"),
    MODIFIED_AT("modifiedAt"),
}

object ProductModelSortingConfig : SortingConfig<ProductModelSortableField> {
    override fun defaultFieldOrder(): SortableFieldOrder = SortableFieldOrder.DESC

    override fun defaultField(): ProductModelSortableField = ProductModelSortableField.CREATED_AT

    override fun getValue(field: String): ProductModelSortableField = ProductModelSortableField.entries.first { it.fieldName == field }
}
