package cz.vokounova.configurator.shared.pagination.jooq

import org.jooq.Field
import java.util.*

interface PaginationMetadata {
    val id: UUID

    fun toPaginationFieldsValueMap(): Map<Field<*>, Any>
}
