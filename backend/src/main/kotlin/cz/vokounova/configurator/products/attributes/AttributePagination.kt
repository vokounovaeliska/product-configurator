package cz.vokounova.configurator.products.attributes

import com.fasterxml.jackson.annotation.JsonInclude
import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.generated.jooq.tables.records.AttributeDefinitionRecord
import cz.vokounova.configurator.generated.jooq.tables.references.ATTRIBUTE_DEFINITION
import cz.vokounova.configurator.products.attributes.domain.AttributeSortableField
import cz.vokounova.configurator.products.attributes.infrastructure.persistence.mapper.toField
import cz.vokounova.configurator.shared.pagination.OrderBy
import cz.vokounova.configurator.shared.pagination.jooq.PaginationMetadata
import cz.vokounova.configurator.shared.pagination.jooq.toJooqSortOrder
import org.jooq.Field
import org.jooq.SortOrder
import java.time.OffsetDateTime
import java.util.UUID

fun AttributeDefinitionRecord.toPagination(fields: List<OrderBy<AttributeSortableField>>): AttributePagination {
    val map = fields.associate { it.field to it.order }

    return AttributePagination(
        id = id,
        code = map[AttributeSortableField.CODE]?.let { code },
        sortOrder = map[AttributeSortableField.SORT_ORDER]?.let { sortOrder ?: 0 },
        createdAt = map[AttributeSortableField.CREATED_AT]?.let { createdAt },
        modifiedAt = map[AttributeSortableField.MODIFIED_AT]?.let { modifiedAt },
    )
}

@JsonInclude(JsonInclude.Include.NON_NULL)
data class AttributePagination(
    override val id: UUID,
    val code: String? = null,
    val sortOrder: Int? = null,
    val createdAt: OffsetDateTime? = null,
    val modifiedAt: OffsetDateTime? = null,
) : PaginationMetadata {
    override fun toPaginationFieldsValueMap(): Map<Field<*>, Any> =
        listOfNotNull(
            code?.let { ATTRIBUTE_DEFINITION.CODE to it },
            sortOrder?.let { ATTRIBUTE_DEFINITION.SORT_ORDER to it },
            createdAt?.let { ATTRIBUTE_DEFINITION.CREATED_AT to it },
            modifiedAt?.let { ATTRIBUTE_DEFINITION.MODIFIED_AT to it },
            ATTRIBUTE_DEFINITION.ID to id,
        ).toMap()

    companion object {
        fun toOrderFields(fields: List<OrderBy<AttributeSortableField>>): Map<Field<*>, SortOrder> =
            fields
                .associateTo(mutableMapOf()) { it.field.toField() to it.order.toJooqSortOrder() }
                .also {
                    it.put(ATTRIBUTE_DEFINITION.ID, SortOrder.ASC)
                }.toMap()
    }
}
