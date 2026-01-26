package cz.vokounova.configurator.products.ports.inbound

import cz.vokounova.configurator.products.domain.ProductModel
import cz.vokounova.configurator.products.domain.ProductModelCreateParams
import cz.vokounova.configurator.products.domain.ProductModelFilter
import cz.vokounova.configurator.products.domain.ProductModelId
import cz.vokounova.configurator.products.domain.ProductModelJsonPatchParams
import cz.vokounova.configurator.products.domain.ProductModelSortableField
import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest

interface ProductModelAPI {
    fun create(params: ProductModelCreateParams): ProductModel

    fun delete(id: ProductModelId)

    fun getOne(id: ProductModelId): ProductModel

    fun getList(): List<ProductModel>

    fun patch(
        id: ProductModelId,
        jsonPatchParams: List<ProductModelJsonPatchParams>,
    ): ProductModel

    fun getByFilterPaginated(
        filter: ProductModelFilter,
        paginationRequest: PaginationRequest<ProductModelSortableField>,
    ): PaginatedResult<ProductModel>
}
