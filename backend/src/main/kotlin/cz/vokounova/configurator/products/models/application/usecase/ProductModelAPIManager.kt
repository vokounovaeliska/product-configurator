package cz.vokounova.configurator.products.models.application.usecase

import cz.vokounova.configurator.products.models.application.exception.ProductModelErrorCode
import cz.vokounova.configurator.products.models.application.exception.ProductModelException
import cz.vokounova.configurator.products.models.domain.ProductModel
import cz.vokounova.configurator.products.models.domain.ProductModelCreateParams
import cz.vokounova.configurator.products.models.domain.ProductModelFilter
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.models.domain.ProductModelJsonPatchParams
import cz.vokounova.configurator.products.models.domain.ProductModelSortableField
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.products.models.ports.outbound.ProductModelRepository
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import cz.vokounova.configurator.shared.jsonpatch.JsonPatchUtils
import cz.vokounova.configurator.shared.pagination.PaginatedResult
import cz.vokounova.configurator.shared.pagination.PaginationRequest
import cz.vokounova.configurator.users.api.dto.UserIdDto
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Component
class ProductModelAPIManager(
    private val productModelRepository: ProductModelRepository,
    private val jsonPatchUtils: JsonPatchUtils,
) : ProductModelAPI {
    @Transactional
    override fun create(params: ProductModelCreateParams): ProductModel {
        val productModel = ProductModel.create(params)
        return productModelRepository.create(productModel) ?: throw ProductModelException(ProductModelErrorCode.CREATE_PRODUCT_MODEL_FAILED)
    }

    @Transactional
    override fun delete(id: ProductModelId) {
        val deletedCount = productModelRepository.delete(id)
        if (deletedCount == 0) {
            throw ResourceNotFoundException("Product model with id ${id.value} not found")
        }
    }

    override fun getOne(id: ProductModelId): ProductModel = findProductModel(id)

    override fun getOneForUser(
        id: ProductModelId,
        userId: UserIdDto,
    ): ProductModel = findProductModelForUser(id, userId)

    @Transactional
    override fun deleteForUser(
        id: ProductModelId,
        userId: UserIdDto,
    ) {
        findProductModelForUser(id, userId)
        val deletedCount = productModelRepository.delete(id)
        if (deletedCount == 0) {
            throw ResourceNotFoundException("Product model with id ${id.value} not found")
        }
    }

    @Transactional
    override fun patchForUser(
        id: ProductModelId,
        userId: UserIdDto,
        jsonPatchParams: List<ProductModelJsonPatchParams>,
    ): ProductModel {
        val existingProductModel = findProductModelForUser(id, userId, lock = true)
        val patched = jsonPatchUtils.applyAndMapJsonPatch(jsonPatchParams, existingProductModel)
        return productModelRepository.update(patched) ?: throw ProductModelException(ProductModelErrorCode.UPDATE_PRODUCT_MODEL_FAILED)
    }

    override fun getPublishedByUserIdAndUrl(
        userId: UUID,
        url: String,
    ): ProductModel? = productModelRepository.findPublishedByUserIdAndUrl(userId, url)

    override fun getList(): List<ProductModel> = productModelRepository.findByFilter()

    @Transactional
    override fun patch(
        id: ProductModelId,
        jsonPatchParams: List<ProductModelJsonPatchParams>,
    ): ProductModel {
        val existingProductModel = findProductModel(id, lock = true)

        val patched = jsonPatchUtils.applyAndMapJsonPatch(jsonPatchParams, existingProductModel)

        return productModelRepository.update(patched) ?: throw ProductModelException(ProductModelErrorCode.UPDATE_PRODUCT_MODEL_FAILED)
    }

    override fun getByFilterPaginated(
        filter: ProductModelFilter,
        paginationRequest: PaginationRequest<ProductModelSortableField>,
    ): PaginatedResult<ProductModel> = productModelRepository.findByFilterPaginated(filter, paginationRequest)

    private fun findProductModel(
        id: ProductModelId,
        lock: Boolean = false,
    ): ProductModel =
        productModelRepository.findById(id, lock)
            ?: throw ResourceNotFoundException("Product model with id ${id.value} is not found.")

    private fun findProductModelForUser(
        id: ProductModelId,
        userId: UserIdDto,
        lock: Boolean = false,
    ): ProductModel {
        val model =
            productModelRepository.findById(id, lock)
                ?: throw ResourceNotFoundException("Product model with id ${id.value} is not found.")
        if (model.userId != userId) {
            throw ResourceNotFoundException("Product model with id ${id.value} is not found.")
        }
        return model
    }
}
