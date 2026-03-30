package cz.vokounova.configurator.products.models.ports.inbound

import cz.vokounova.configurator.products.models.domain.ProductModel
import cz.vokounova.configurator.products.models.domain.ProductModelCreateParams
import cz.vokounova.configurator.products.models.domain.ProductModelFilter
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParams
import cz.vokounova.configurator.products.models.domain.ProductModelSortableField
import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest
import java.util.UUID

interface ProductModelAPI {
    fun create(params: ProductModelCreateParams): ProductModel

    fun delete(id: ProductModelId)

    fun getOne(id: ProductModelId): ProductModel

    /** Get published product model by owner embed path (for embed, no auth). Unique per user when published. */
    fun getPublishedByUserIdAndUrl(
        userId: UUID,
        url: String,
    ): ProductModel?

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
