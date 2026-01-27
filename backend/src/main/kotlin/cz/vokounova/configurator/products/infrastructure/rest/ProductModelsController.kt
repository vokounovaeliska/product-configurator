package cz.vokounova.configurator.products.infrastructure.rest

import cz.vokounova.configurator.products.domain.ProductModelId
import cz.vokounova.configurator.products.domain.ProductModelSortableField
import cz.vokounova.configurator.products.domain.ProductModelSortingConfig
import cz.vokounova.configurator.products.infrastructure.rest.mapper.request.ProductModelCreateRequestDto
import cz.vokounova.configurator.products.infrastructure.rest.mapper.request.ProductModelPatchRequestDto
import cz.vokounova.configurator.products.infrastructure.rest.mapper.response.ProductModelDto
import cz.vokounova.configurator.products.infrastructure.rest.mapper.response.ProductModelPaginatedResponseDto
import cz.vokounova.configurator.products.infrastructure.rest.mapper.toDto
import cz.vokounova.configurator.products.infrastructure.rest.mapper.toFilter
import cz.vokounova.configurator.products.infrastructure.rest.mapper.toParams
import cz.vokounova.configurator.products.infrastructure.rest.request.ProductModelListQueryParams
import cz.vokounova.configurator.products.infrastructure.rest.validation.ProductModelCreateParamsValidator
import cz.vokounova.configurator.products.infrastructure.rest.validation.ProductModelJsonPatchParamsValidator
import cz.vokounova.configurator.products.infrastructure.rest.validation.ProductModelListQueryParamsValidator
import cz.vokounova.configurator.products.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.shared.exceptions.throwIfNotEmpty
import cz.vokounova.configurator.shared.pagination.PaginationUtils
import cz.vokounova.configurator.shared.pagination.SortingUtils
import cz.vokounova.configurator.shared.rest.response.PaginatedResponseMetaDto
import cz.vokounova.configurator.shared.security.AuthFacade
import cz.vokounova.configurator.users.api.dto.UserIdDto
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/products/api/v1/product-models")
class ProductModelsController(
    private val productModelAPI: ProductModelAPI,
    private val queryParamsValidator: ProductModelListQueryParamsValidator,
    private val createParamsValidator: ProductModelCreateParamsValidator,
    private val jsonPatchValidator: ProductModelJsonPatchParamsValidator,
    private val authFacade: AuthFacade,
) {
    @PostMapping
    fun productModelsCreate(
        @RequestBody productModelCreateRequestDto: ProductModelCreateRequestDto,
    ): ResponseEntity<ProductModelDto> {
        val currentUserId = UserIdDto(authFacade.getCurrentAuthDetails().id().value)
        val params = productModelCreateRequestDto.toParams(currentUserId)
        createParamsValidator.validate(params).throwIfNotEmpty()
        val productModel = productModelAPI.create(params)

        return ResponseEntity.status(HttpStatus.CREATED).body(productModel.toDto())
    }

    @DeleteMapping("/{productModelId}")
    fun productModelsDelete(
        @PathVariable productModelId: UUID,
    ): ResponseEntity<Unit> {
        productModelAPI.delete(ProductModelId(productModelId))
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build()
    }

    @GetMapping("/{productModelId}")
    fun productModelsGet(
        @PathVariable productModelId: UUID,
    ): ResponseEntity<ProductModelDto> {
        val productModel = productModelAPI.getOne(ProductModelId(productModelId))
        return ResponseEntity.status(HttpStatus.OK).body(productModel.toDto())
    }

    @GetMapping
    fun productModelsPaginatedList(
        @RequestParam(required = false) limit: Int?,
        @RequestParam(required = false) after: String?,
        @RequestParam(required = false) before: String?,
        @RequestParam(required = false) orderBy: List<String>?,
        @RequestParam(required = false) ids: List<UUID>?,
        @RequestParam(required = false) userIds: List<UUID>?,
        @RequestParam(required = false) isActive: Boolean?,
    ): ResponseEntity<ProductModelPaginatedResponseDto> {
        val queryParamsDto =
            ProductModelListQueryParams(
                limit = limit,
                orderBy = orderBy,
                ids = ids,
                userIds = userIds,
                isActive = isActive,
            )

        queryParamsValidator.validate(queryParamsDto).throwIfNotEmpty()

        val sortableFields =
            SortingUtils.createSorting<ProductModelSortableField>(
                orderBy,
                ProductModelSortingConfig,
            )

        val paginatedRequest =
            PaginationUtils.createPaginationRequest(
                limit = limit,
                orderBy = sortableFields,
                after = after,
                before = before,
            )

        val response = productModelAPI.getByFilterPaginated(queryParamsDto.toFilter(), paginatedRequest)
        return ResponseEntity.ok().body(
            ProductModelPaginatedResponseDto(
                items = response.data.map { it.toDto() },
                pageMetadata =
                    PaginatedResponseMetaDto(
                        pagesTotal = response.pagesTotal,
                        nextPageAfter = response.cursorAfter?.value,
                        prevPageBefore = response.cursorBefore?.value,
                    ),
            ),
        )
    }

    @PatchMapping("/{productModelId}")
    fun productModelsPatch(
        @PathVariable productModelId: UUID,
        @RequestBody productModelPatchRequestDto: List<ProductModelPatchRequestDto>,
    ): ResponseEntity<ProductModelDto> {
        val params = productModelPatchRequestDto.map { it.toParams() }
        jsonPatchValidator.validate(params).throwIfNotEmpty()

        val productModel = productModelAPI.patch(ProductModelId(productModelId), params)

        return ResponseEntity.status(HttpStatus.OK).body(productModel.toDto())
    }
}
