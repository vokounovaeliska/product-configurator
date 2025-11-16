package cz.vokounova.configurator.shared.pagination.jooq

import cz.vokounova.configurator.shared.pagination.SortableFieldOrder
import org.jooq.Field
import org.jooq.SortField
import org.jooq.SortOrder

fun SortableFieldOrder.toJooqSortOrder(): SortOrder =
    when (this) {
        SortableFieldOrder.ASC -> SortOrder.ASC
        SortableFieldOrder.DESC -> SortOrder.DESC
    }

fun Field<*>.applySortOrder(order: SortOrder): SortField<*> = if (order == SortOrder.ASC) this.asc() else this.desc()

fun SortOrder.reversed(): SortOrder = if (this == SortOrder.ASC) SortOrder.DESC else SortOrder.ASC
