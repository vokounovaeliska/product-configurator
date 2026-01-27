package cz.vokounova.configurator.products.components.domain

import cz.vokounova.configurator.shared.pagination.SortableField
import cz.vokounova.configurator.shared.pagination.SortableFieldOrder
import cz.vokounova.configurator.shared.pagination.SortingConfig

enum class ComponentSortableField(
    override val fieldName: String,
) : SortableField {
    CODE("code"),
    LABEL("label"),
    SORT_ORDER("sortOrder"),
    CREATED_AT("createdAt"),
    MODIFIED_AT("modifiedAt"),
}

object ComponentSortingConfig : SortingConfig<ComponentSortableField> {
    override fun defaultFieldOrder(): SortableFieldOrder = SortableFieldOrder.ASC

    override fun defaultField(): ComponentSortableField = ComponentSortableField.SORT_ORDER

    override fun getValue(field: String): ComponentSortableField = ComponentSortableField.entries.first { it.fieldName == field }
}
