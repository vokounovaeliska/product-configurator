package cz.vokounova.configurator.users.infrastructure.persistence.mapper

import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.users.domain.UserSortableField
import org.jooq.Field

fun UserSortableField.toJooqField(): Field<*> =
    when (this) {
        UserSortableField.EMAIL -> USER.EMAIL
        UserSortableField.FIRST_NAME -> USER.FIRST_NAME
        UserSortableField.SURNAME -> USER.SURNAME
        UserSortableField.CREATED_AT -> USER.CREATED_AT
        UserSortableField.MODIFIED_AT -> USER.MODIFIED_AT
    }
