package cz.vokounova.configurator.products.ports.outbound

import cz.vokounova.configurator.products.domain.ProductModel
import cz.vokounova.configurator.products.domain.ProductModelFilter
import cz.vokounova.configurator.products.domain.ProductModelId
import cz.vokounova.configurator.products.domain.ProductModelSortableField
import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest

interface ProductModelRepository {
    fun findById(
        id: ProductModelId,
        lock: Boolean,
    ): ProductModel?

    fun findByFilter(filter: ProductModelFilter? = null): List<ProductModel>

    fun create(productModel: ProductModel): ProductModel?

    fun update(productModel: ProductModel): ProductModel?

    fun delete(id: ProductModelId): Int

    fun findByFilterPaginated(
        filter: ProductModelFilter,
        paginationRequest: PaginationRequest<ProductModelSortableField>,
    ): PaginatedResult<ProductModel>
}
