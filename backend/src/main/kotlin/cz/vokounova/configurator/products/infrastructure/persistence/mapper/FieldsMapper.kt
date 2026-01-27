package cz.vokounova.configurator.products.infrastructure.persistence.mapper

import cz.vokounova.configurator.generated.jooq.tables.references.PRODUCT_MODEL
import cz.vokounova.configurator.products.domain.ProductModelSortableField
import org.jooq.Field

fun ProductModelSortableField.toJooqField(): Field<*> =
    when (this) {
        ProductModelSortableField.NAME -> PRODUCT_MODEL.NAME
        ProductModelSortableField.PRICE -> PRODUCT_MODEL.PRICE
        ProductModelSortableField.CURRENCY -> PRODUCT_MODEL.CURRENCY
        ProductModelSortableField.IS_ACTIVE -> PRODUCT_MODEL.IS_ACTIVE
        ProductModelSortableField.CREATED_AT -> PRODUCT_MODEL.CREATED_AT
        ProductModelSortableField.MODIFIED_AT -> PRODUCT_MODEL.MODIFIED_AT
    }
