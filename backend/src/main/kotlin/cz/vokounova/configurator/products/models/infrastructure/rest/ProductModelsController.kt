package cz.vokounova.configurator.products.models.infrastructure.rest

import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.models.domain.ProductModelSortableField
import cz.vokounova.configurator.products.models.domain.ProductModelSortingConfig
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.request.ConfiguratorPreferencesPatchRequestDto
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.request.ProductModelCreateRequestDto
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.request.ProductModelPatchRequestDto
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.response.ConfiguratorPreferencesDto
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.response.ProductModelDto
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.response.ProductModelPaginatedResponseDto
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.toDto
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.toFilter
import cz.vokounova.configurator.products.models.infrastructure.rest.mapper.toParams
import cz.vokounova.configurator.products.models.infrastructure.rest.request.ProductModelListQueryParams
import cz.vokounova.configurator.products.models.infrastructure.rest.validation.ProductModelCreateParamsValidator
import cz.vokounova.configurator.products.models.infrastructure.rest.validation.ProductModelJsonPatchParamsValidator
import cz.vokounova.configurator.products.models.infrastructure.rest.validation.ProductModelListQueryParamsValidator
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelConfiguratorPreferencesAPI
import cz.vokounova.configurator.shared.exceptions.throwIfNotEmpty
import cz.vokounova.configurator.shared.pagination.PaginationUtils
import cz.vokounova.configurator.shared.pagination.SortingUtils
import cz.vokounova.configurator.shared.rest.response.PaginatedResponseMetaDto
import cz.vokounova.configurator.shared.security.AuthFacade
import cz.vokounova.configurator.users.api.dto.UserIdDto
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
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

@Tag(
    name = "Product models",
    description =
        "Configurable products: CRUD, paginated listing, and per-user configurator UI preferences " +
            "(zoom, embed panels, background).",
)
@RestController
@RequestMapping("/products/api/v1/product-models")
class ProductModelsController(
    private val productModelAPI: ProductModelAPI,
    private val configuratorPreferencesAPI: ProductModelConfiguratorPreferencesAPI,
    private val queryParamsValidator: ProductModelListQueryParamsValidator,
    private val createParamsValidator: ProductModelCreateParamsValidator,
    private val jsonPatchValidator: ProductModelJsonPatchParamsValidator,
    private val authFacade: AuthFacade,
) {
    @Operation(
        summary = "Create product model",
        description = "Creates a product model owned by the current user.",
    )
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

    @Operation(summary = "Delete product model", description = "Removes a product model by id.")
    @DeleteMapping("/{productModelId}")
    fun productModelsDelete(
        @PathVariable productModelId: UUID,
    ): ResponseEntity<Unit> {
        val currentUserId = UserIdDto(authFacade.getCurrentAuthDetails().id().value)
        productModelAPI.deleteForUser(ProductModelId(productModelId), currentUserId)
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build()
    }

    @Operation(summary = "Get product model", description = "Returns one product model by id.")
    @GetMapping("/{productModelId}")
    fun productModelsGet(
        @PathVariable productModelId: UUID,
    ): ResponseEntity<ProductModelDto> {
        val currentUserId = UserIdDto(authFacade.getCurrentAuthDetails().id().value)
        val productModel = productModelAPI.getOneForUser(ProductModelId(productModelId), currentUserId)
        return ResponseEntity.status(HttpStatus.OK).body(productModel.toDto())
    }

    @Operation(
        summary = "List product models",
        description =
            "List for the authenticated user only (other users' models are never returned). " +
                "Optional filters: ids, active flag, published flag, sort order. Query param userIds is ignored.",
    )
    @GetMapping
    fun productModelsPaginatedList(
        @RequestParam(required = false) limit: Int?,
        @RequestParam(required = false) after: String?,
        @RequestParam(required = false) before: String?,
        @RequestParam(required = false) orderBy: List<String>?,
        @RequestParam(required = false) ids: List<UUID>?,
        @RequestParam(required = false) userIds: List<UUID>?,
        @RequestParam(required = false) isActive: Boolean?,
        @RequestParam(required = false) isPublished: Boolean?,
    ): ResponseEntity<ProductModelPaginatedResponseDto> {
        val queryParamsDto =
            ProductModelListQueryParams(
                limit = limit,
                orderBy = orderBy,
                ids = ids,
                userIds = userIds,
                isActive = isActive,
                isPublished = isPublished,
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

        val currentUserId = UserIdDto(authFacade.getCurrentAuthDetails().id().value)
        val filter =
            queryParamsDto.toFilter().copy(
                userIds = listOf(currentUserId),
            )
        val response = productModelAPI.getByFilterPaginated(filter, paginatedRequest)
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

    @Operation(
        summary = "Patch product model",
        description = "Applies JSON Patch operations to update product model fields.",
    )
    @PatchMapping("/{productModelId}")
    fun productModelsPatch(
        @PathVariable productModelId: UUID,
        @RequestBody productModelPatchRequestDto: List<ProductModelPatchRequestDto>,
    ): ResponseEntity<ProductModelDto> {
        val params = productModelPatchRequestDto.map { it.toParams() }
        jsonPatchValidator.validate(params).throwIfNotEmpty()

        val currentUserId = UserIdDto(authFacade.getCurrentAuthDetails().id().value)
        val productModel =
            productModelAPI.patchForUser(ProductModelId(productModelId), currentUserId, params)

        return ResponseEntity.status(HttpStatus.OK).body(productModel.toDto())
    }

    @Operation(
        summary = "Get configurator preferences",
        description = "Returns saved viewer preferences for the current user and this product (defaults for app and embed).",
    )
    @GetMapping("/{productModelId}/configurator-preferences")
    fun getConfiguratorPreferences(
        @PathVariable productModelId: UUID,
    ): ResponseEntity<ConfiguratorPreferencesDto> {
        val prefs = configuratorPreferencesAPI.getByProductModelIdForCurrentUser(ProductModelId(productModelId))
        return ResponseEntity.ok(
            ConfiguratorPreferencesDto(
                zoomDistanceDefault = prefs?.zoomDistanceDefault?.toDouble(),
                zoomDistanceEmbed = prefs?.zoomDistanceEmbed?.toDouble(),
                embedShowProductName = prefs?.embedShowProductName,
                embedShowDescription = prefs?.embedShowDescription,
                embedShowComponents = prefs?.embedShowComponents,
                backgroundPreset = prefs?.backgroundPreset,
                cameraHorizontalAngleRad = prefs?.cameraHorizontalAngleRad,
                cameraVerticalAngleRad = prefs?.cameraVerticalAngleRad,
            ),
        )
    }

    @Operation(
        summary = "Update configurator preferences",
        description = "Creates or updates configurator preferences for the current user (zoom, embed visibility, background).",
    )
    @PatchMapping("/{productModelId}/configurator-preferences")
    fun patchConfiguratorPreferences(
        @PathVariable productModelId: UUID,
        @RequestBody request: ConfiguratorPreferencesPatchRequestDto,
    ): ResponseEntity<ConfiguratorPreferencesDto> {
        val prefs =
            configuratorPreferencesAPI.upsert(
                ProductModelId(productModelId),
                zoomDistanceDefault = request.zoomDistanceDefault,
                zoomDistanceEmbed = request.zoomDistanceEmbed,
                embedShowProductName = request.embedShowProductName,
                embedShowDescription = request.embedShowDescription,
                embedShowComponents = request.embedShowComponents,
                backgroundPreset = request.backgroundPreset,
                cameraHorizontalAngleRad = request.cameraHorizontalAngleRad,
                cameraVerticalAngleRad = request.cameraVerticalAngleRad,
                clearSavedCameraAngles = request.clearSavedCameraAngles,
            )
        return ResponseEntity.ok(
            ConfiguratorPreferencesDto(
                zoomDistanceDefault = prefs.zoomDistanceDefault?.toDouble(),
                zoomDistanceEmbed = prefs.zoomDistanceEmbed?.toDouble(),
                embedShowProductName = prefs.embedShowProductName,
                embedShowDescription = prefs.embedShowDescription,
                embedShowComponents = prefs.embedShowComponents,
                backgroundPreset = prefs.backgroundPreset,
                cameraHorizontalAngleRad = prefs.cameraHorizontalAngleRad,
                cameraVerticalAngleRad = prefs.cameraVerticalAngleRad,
            ),
        )
    }
}
