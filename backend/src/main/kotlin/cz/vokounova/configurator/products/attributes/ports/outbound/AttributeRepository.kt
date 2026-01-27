package cz.vokounova.configurator.products.attributes.ports.outbound

import cz.vokounova.configurator.products.attributes.domain.Attribute
import cz.vokounova.configurator.products.attributes.domain.AttributeFilter
import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.domain.AttributeSortableField
import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest

interface AttributeRepository {
    fun findById(
        id: AttributeId,
        lock: Boolean = false,
    ): Attribute?

    fun findByFilter(filter: AttributeFilter? = null): List<Attribute>

    fun create(attribute: Attribute): Attribute?

    fun update(attribute: Attribute): Attribute?

    fun delete(id: AttributeId): Int

    fun findByFilterPaginated(
        filter: AttributeFilter,
        paginationRequest: PaginationRequest<AttributeSortableField>,
    ): PaginatedResult<Attribute>
}
