package cz.vokounova.configurator.products.ports.inbound

import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest
import cz.vokounova.configurator.products.domain.Component
import cz.vokounova.configurator.products.domain.ComponentCreateParams
import cz.vokounova.configurator.products.domain.ComponentFilter
import cz.vokounova.configurator.products.domain.ComponentId
import cz.vokounova.configurator.products.domain.ComponentJsonPatchParams
import cz.vokounova.configurator.products.domain.ComponentSortableField

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
