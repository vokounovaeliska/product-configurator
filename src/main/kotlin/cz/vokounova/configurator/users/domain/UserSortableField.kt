package cz.vokounova.configurator.users.domain

import cz.vokounova.configurator.shared.pagination.SortableField
import cz.vokounova.configurator.shared.pagination.SortableFieldOrder
import cz.vokounova.configurator.shared.pagination.SortingConfig

enum class UserSortableField(
    override val fieldName: String,
) : SortableField {
    EMAIL("email"),
    FIRST_NAME("firstName"),
    SURNAME("surname"),
    CREATED_AT("createdAt"),
    MODIFIED_AT("modifiedAt"),
}

object UserSortingConfig : SortingConfig<UserSortableField> {
    override fun defaultFieldOrder(): SortableFieldOrder = SortableFieldOrder.DESC

    override fun defaultField(): UserSortableField = UserSortableField.CREATED_AT

    override fun getValue(field: String): UserSortableField = UserSortableField.entries.first { it.fieldName == field }
}
