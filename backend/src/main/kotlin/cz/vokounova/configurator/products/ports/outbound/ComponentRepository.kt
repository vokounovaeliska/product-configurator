package cz.vokounova.configurator.products.ports.outbound

import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest
import cz.vokounova.configurator.products.domain.Component
import cz.vokounova.configurator.products.domain.ComponentFilter
import cz.vokounova.configurator.products.domain.ComponentId
import cz.vokounova.configurator.products.domain.ComponentSortableField

interface ComponentRepository {
    fun findById(
        id: ComponentId,
        lock: Boolean = false,
    ): Component?

    fun findByFilter(filter: ComponentFilter? = null): List<Component>

    fun create(component: Component): Component?

    fun update(component: Component): Component?

    fun delete(id: ComponentId): Int

    fun findByFilterPaginated(
        filter: ComponentFilter,
        paginationRequest: PaginationRequest<ComponentSortableField>,
    ): PaginatedResult<Component>
}
