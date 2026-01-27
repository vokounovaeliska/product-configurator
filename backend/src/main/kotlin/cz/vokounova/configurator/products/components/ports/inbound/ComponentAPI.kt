package cz.vokounova.configurator.products.components.ports.inbound

import cz.vokounova.configurator.products.components.domain.Component
import cz.vokounova.configurator.products.components.domain.ComponentCreateParams
import cz.vokounova.configurator.products.components.domain.ComponentFilter
import cz.vokounova.configurator.products.components.domain.ComponentId
import cz.vokounova.configurator.products.components.domain.ComponentJsonPatchParams
import cz.vokounova.configurator.products.components.domain.ComponentSortableField
import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest

interface ComponentAPI {
    fun create(params: ComponentCreateParams): Component

    fun delete(id: ComponentId)

    fun getOne(id: ComponentId): Component

    fun getList(): List<Component>

    fun patch(
        id: ComponentId,
        jsonPatchParams: List<ComponentJsonPatchParams>,
    ): Component

    fun getByFilterPaginated(
        filter: ComponentFilter,
        paginationRequest: PaginationRequest<ComponentSortableField>,
    ): PaginatedResult<Component>
}
