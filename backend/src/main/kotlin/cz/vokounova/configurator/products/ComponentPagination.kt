package cz.vokounova.configurator.products

import com.fasterxml.jackson.annotation.JsonInclude
import cz.vokounova.configurator.generated.jooq.tables.records.ComponentDefinitionRecord
import cz.vokounova.configurator.generated.jooq.tables.references.COMPONENT_DEFINITION
import cz.vokounova.configurator.products.domain.ComponentSortableField
import cz.vokounova.configurator.products.infrastructure.persistence.mapper.toField
import cz.vokounova.configurator.shared.pagination.OrderBy
import cz.vokounova.configurator.shared.pagination.jooq.PaginationMetadata
import cz.vokounova.configurator.shared.pagination.jooq.toJooqSortOrder
import org.jooq.Field
import org.jooq.SortOrder
import java.time.OffsetDateTime
import java.util.UUID

fun ComponentDefinitionRecord.toPagination(fields: List<OrderBy<ComponentSortableField>>): ComponentPagination {
    val map = fields.associate { it.field to it.order }

    return ComponentPagination(
        id = id,
        code = map[ComponentSortableField.CODE]?.let { code },
        sortOrder = map[ComponentSortableField.SORT_ORDER]?.let { sortOrder ?: 0 },
        createdAt = map[ComponentSortableField.CREATED_AT]?.let { createdAt },
        modifiedAt = map[ComponentSortableField.MODIFIED_AT]?.let { modifiedAt },
    )
}

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ComponentPagination(
    override val id: UUID,
    val code: String? = null,
    val sortOrder: Int? = null,
    val createdAt: OffsetDateTime? = null,
    val modifiedAt: OffsetDateTime? = null,
) : PaginationMetadata {
    override fun toPaginationFieldsValueMap(): Map<Field<*>, Any> =
        listOfNotNull(
            code?.let { COMPONENT_DEFINITION.CODE to it },
            sortOrder?.let { COMPONENT_DEFINITION.SORT_ORDER to it },
            createdAt?.let { COMPONENT_DEFINITION.CREATED_AT to it },
            modifiedAt?.let { COMPONENT_DEFINITION.MODIFIED_AT to it },
            COMPONENT_DEFINITION.ID to id,
        ).toMap()

    companion object {
        fun toOrderFields(fields: List<OrderBy<ComponentSortableField>>): Map<Field<*>, SortOrder> =
            fields
                .associateTo(mutableMapOf()) { it.field.toField() to it.order.toJooqSortOrder() }
                .also {
                    it.put(COMPONENT_DEFINITION.ID, SortOrder.ASC)
                }.toMap()
    }
}
