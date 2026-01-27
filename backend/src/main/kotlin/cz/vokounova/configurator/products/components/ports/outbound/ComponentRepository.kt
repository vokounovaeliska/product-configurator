package cz.vokounova.configurator.products.components.ports.outbound

import cz.vokounova.configurator.products.components.domain.Component
import cz.vokounova.configurator.products.components.domain.ComponentFilter
import cz.vokounova.configurator.products.components.domain.ComponentId
import cz.vokounova.configurator.products.components.domain.ComponentSortableField
import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest

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
