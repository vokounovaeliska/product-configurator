package cz.vokounova.configurator.products

import com.fasterxml.jackson.annotation.JsonInclude
import cz.vokounova.configurator.generated.jooq.tables.records.ProductModelRecord
import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import cz.vokounova.configurator.products.domain.ProductModelSortableField
import cz.vokounova.configurator.products.infrastructure.persistence.mapper.toJooqField
import cz.vokounova.configurator.shared.pagination.OrderBy
import cz.vokounova.configurator.shared.pagination.jooq.PaginationMetadata
import cz.vokounova.configurator.shared.pagination.jooq.toJooqSortOrder
import org.jooq.Field
import org.jooq.SortOrder
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

fun ProductModelRecord.toPagination(fields: List<OrderBy<ProductModelSortableField>>): ProductModelPagination {
    val map = fields.associate { it.field to it.order }

    return ProductModelPagination(
        id = id,
        name = map[ProductModelSortableField.NAME]?.let { name },
        price = map[ProductModelSortableField.PRICE]?.let { price },
        currency = map[ProductModelSortableField.CURRENCY]?.let { currency },
        isActive = map[ProductModelSortableField.IS_ACTIVE]?.let { isActive },
        createdAt = map[ProductModelSortableField.CREATED_AT]?.let { createdAt },
        modifiedAt = map[ProductModelSortableField.MODIFIED_AT]?.let { modifiedAt },
    )
}

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ProductModelPagination(
    override val id: UUID,
    val name: String? = null,
    val price: BigDecimal? = null,
    val currency: String? = null,
    val isActive: Boolean? = null,
    val createdAt: OffsetDateTime? = null,
    val modifiedAt: OffsetDateTime? = null,
) : PaginationMetadata {
    override fun toPaginationFieldsValueMap(): Map<Field<*>, Any> =
        listOfNotNull(
            name?.let { PRODUCT_MODEL.NAME to it },
            price?.let { PRODUCT_MODEL.PRICE to it },
            currency?.let { PRODUCT_MODEL.CURRENCY to it },
            isActive?.let { PRODUCT_MODEL.IS_ACTIVE to it },
            createdAt?.let { PRODUCT_MODEL.CREATED_AT to it },
            modifiedAt?.let { PRODUCT_MODEL.MODIFIED_AT to it },
            PRODUCT_MODEL.ID to id,
        ).toMap()

    companion object {
        fun toOrderFields(fields: List<OrderBy<ProductModelSortableField>>): Map<Field<*>, SortOrder> =
            fields
                .associateTo(mutableMapOf()) { it.field.toJooqField() to it.order.toJooqSortOrder() }
                .also {
                    it.put(PRODUCT_MODEL.ID, SortOrder.ASC)
                }.toMap()
    }
}
