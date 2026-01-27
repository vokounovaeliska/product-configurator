package cz.vokounova.configurator.products.attributes.ports.inbound

import cz.vokounova.configurator.products.attributes.domain.Attribute
import cz.vokounova.configurator.products.attributes.domain.AttributeCreateParams
import cz.vokounova.configurator.products.attributes.domain.AttributeFilter
import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.domain.AttributeJsonPatchParams
import cz.vokounova.configurator.products.attributes.domain.AttributeSortableField
import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest

interface AttributeAPI {
    fun create(params: AttributeCreateParams): Attribute

    fun delete(id: AttributeId)

    fun getOne(id: AttributeId): Attribute

    fun getList(): List<Attribute>

    fun patch(
        id: AttributeId,
        jsonPatchParams: List<AttributeJsonPatchParams>,
    ): Attribute

    fun getByFilterPaginated(
        filter: AttributeFilter,
        paginationRequest: PaginationRequest<AttributeSortableField>,
    ): PaginatedResult<Attribute>
}
