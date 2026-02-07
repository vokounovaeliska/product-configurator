package cz.vokounova.configurator.products.attributes.domain

import cz.vokounova.configurator.shared.pagination.SortableField
import cz.vokounova.configurator.shared.pagination.SortableFieldOrder
import cz.vokounova.configurator.shared.pagination.SortingConfig

enum class AttributeSortableField(
    override val fieldName: String,
) : SortableField {
    CODE("code"),
    LABEL("label"),
    TYPE("type"),
    SORT_ORDER("sortOrder"),
    CREATED_AT("createdAt"),
    MODIFIED_AT("modifiedAt"),
}

object AttributeSortingConfig : SortingConfig<AttributeSortableField> {
    override fun defaultFieldOrder(): SortableFieldOrder = SortableFieldOrder.ASC

    override fun defaultField(): AttributeSortableField = AttributeSortableField.SORT_ORDER

    override fun getValue(field: String): AttributeSortableField =
        AttributeSortableField.entries.first {
            it.fieldName == field
        }
}
