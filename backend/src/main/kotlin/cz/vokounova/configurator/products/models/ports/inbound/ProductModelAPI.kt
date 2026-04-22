package cz.vokounova.configurator.products.models.ports.inbound

import cz.vokounova.configurator.products.models.domain.ProductModel
import cz.vokounova.configurator.products.models.domain.ProductModelCreateParams
import cz.vokounova.configurator.products.models.domain.ProductModelFilter
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParams
import cz.vokounova.configurator.products.models.domain.ProductModelSortableField
import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest
import cz.vokounova.configurator.users.api.dto.UserIdDto
import java.util.UUID

interface ProductModelAPI {
    fun create(params: ProductModelCreateParams): ProductModel

    fun delete(id: ProductModelId)

    fun getOne(id: ProductModelId): ProductModel

    
    fun getOneForUser(
        id: ProductModelId,
        userId: UserIdDto,
    ): ProductModel

    fun deleteForUser(
        id: ProductModelId,
        userId: UserIdDto,
    )

    fun patchForUser(
        id: ProductModelId,
        userId: UserIdDto,
        jsonPatchParams: List<ProductModelJsonPatchParams>,
    ): ProductModel

    
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
