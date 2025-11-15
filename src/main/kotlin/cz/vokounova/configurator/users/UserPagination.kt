package cz.vokounova.configurator.users

import com.fasterxml.jackson.annotation.JsonInclude
import cz.vokounova.configurator.generated.jooq.tables.records.UserRecord
import cz.vokounova.configurator.generated.jooq.tables.references.USER
import cz.vokounova.configurator.shared.pagination.OrderBy
import cz.vokounova.configurator.shared.pagination.jooq.PaginationMetadata
import cz.vokounova.configurator.shared.pagination.jooq.toJooqSortOrder
import cz.vokounova.configurator.users.domain.UserSortableField
import cz.vokounova.configurator.users.infrastructure.persistence.mapper.toJooqField
import org.jooq.Field
import org.jooq.SortOrder
import java.time.OffsetDateTime
import java.util.UUID

fun UserRecord.toPagination(fields: List<OrderBy<UserSortableField>>): UserPagination {
    val map = fields.associate { it.field to it.order }

    return UserPagination(
        id = id,
        email = map[UserSortableField.EMAIL]?.let { email },
        firstName = map[UserSortableField.FIRST_NAME]?.let { firstName },
        surname = map[UserSortableField.SURNAME]?.let { surname },
        createdAt = map[UserSortableField.CREATED_AT]?.let { createdAt },
        modifiedAt = map[UserSortableField.MODIFIED_AT]?.let { modifiedAt },
    )
}

@JsonInclude(JsonInclude.Include.NON_NULL)
data class UserPagination(
    override val id: UUID,
    val email: String? = null,
    val firstName: String? = null,
    val surname: String? = null,
    val createdAt: OffsetDateTime? = null,
    val modifiedAt: OffsetDateTime? = null,
) : PaginationMetadata {
    override fun toPaginationFieldsValueMap(): Map<Field<*>, Any> =
        listOfNotNull(
            email?.let { USER.EMAIL to it },
            firstName?.let { USER.FIRST_NAME to it },
            surname?.let { USER.SURNAME to it },
            createdAt?.let { USER.CREATED_AT to it },
            modifiedAt?.let { USER.MODIFIED_AT to it },
            USER.ID to id,
        ).toMap()

    companion object {
        fun toOrderFields(fields: List<OrderBy<UserSortableField>>): Map<Field<*>, SortOrder> =
            fields
                .associateTo(mutableMapOf()) { it.field.toJooqField() to it.order.toJooqSortOrder() }
                .also {
                    it.put(USER.ID, SortOrder.ASC)
                }.toMap()
    }
}
