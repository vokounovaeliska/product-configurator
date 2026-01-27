package cz.vokounova.configurator.products.components.infrastructure.rest

import cz.vokounova.configurator.products.components.domain.ComponentId
import cz.vokounova.configurator.products.components.domain.ComponentSortableField
import cz.vokounova.configurator.products.components.domain.ComponentSortingConfig
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.request.ComponentCreateRequestDto
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.request.ComponentPatchRequestDto
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.response.ComponentDto
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.response.ComponentPaginatedResponseDto
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.toDto
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.toFilter
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.toParams
import cz.vokounova.configurator.products.components.infrastructure.rest.request.ComponentListQueryParams
import cz.vokounova.configurator.products.components.infrastructure.rest.validation.ComponentCreateParamsValidator
import cz.vokounova.configurator.products.components.infrastructure.rest.validation.ComponentJsonPatchParamsValidator
import cz.vokounova.configurator.products.components.infrastructure.rest.validation.ComponentListQueryParamsValidator
import cz.vokounova.configurator.products.components.ports.inbound.ComponentAPI
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.shared.exceptions.throwIfNotEmpty
import cz.vokounova.configurator.shared.pagination.PaginationUtils
import cz.vokounova.configurator.shared.pagination.SortingUtils
import cz.vokounova.configurator.shared.rest.response.PaginatedResponseMetaDto
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
@RequestMapping("/products/api/v1/product-models/{productModelId}/components")
class ComponentsController(
    private val componentAPI: ComponentAPI,
    private val queryParamsValidator: ComponentListQueryParamsValidator,
    private val createParamsValidator: ComponentCreateParamsValidator,
    private val jsonPatchValidator: ComponentJsonPatchParamsValidator,
) {
    @PostMapping
    fun componentsCreate(
        @PathVariable productModelId: UUID,
        @RequestBody componentCreateRequestDto: ComponentCreateRequestDto,
    ): ResponseEntity<ComponentDto> {
        val params = componentCreateRequestDto.toParams(ProductModelId(productModelId))
        createParamsValidator.validate(params).throwIfNotEmpty()
        val component = componentAPI.create(params)

        return ResponseEntity.status(HttpStatus.CREATED).body(component.toDto())
    }

    @DeleteMapping("/{componentId}")
    fun componentsDelete(
        @PathVariable productModelId: UUID,
        @PathVariable componentId: UUID,
    ): ResponseEntity<Unit> {
        componentAPI.delete(ComponentId(componentId))
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build()
    }

    @GetMapping("/{componentId}")
    fun componentsGet(
        @PathVariable productModelId: UUID,
        @PathVariable componentId: UUID,
    ): ResponseEntity<ComponentDto> {
        val component = componentAPI.getOne(ComponentId(componentId))
        return ResponseEntity.status(HttpStatus.OK).body(component.toDto())
    }

    @GetMapping
    fun componentsPaginatedList(
        @PathVariable productModelId: UUID,
        @RequestParam(required = false) limit: Int?,
        @RequestParam(required = false) after: String?,
        @RequestParam(required = false) before: String?,
        @RequestParam(required = false) orderBy: List<String>?,
        @RequestParam(required = false) ids: List<UUID>?,
    ): ResponseEntity<ComponentPaginatedResponseDto> {
        val queryParamsDto =
            ComponentListQueryParams(
                productModelIds = listOf(productModelId),
                ids = ids,
                limit = limit,
                orderBy = orderBy,
            )

        queryParamsValidator.validate(queryParamsDto).throwIfNotEmpty()

        val sortableFields =
            SortingUtils.createSorting<ComponentSortableField>(
                orderBy,
                ComponentSortingConfig,
            )

        val paginatedRequest =
            PaginationUtils.createPaginationRequest(
                limit = limit,
                orderBy = sortableFields,
                after = after,
                before = before,
            )

        val response = componentAPI.getByFilterPaginated(queryParamsDto.toFilter(), paginatedRequest)
        return ResponseEntity.ok().body(
            ComponentPaginatedResponseDto(
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

    @PatchMapping("/{componentId}")
    fun componentsPatch(
        @PathVariable productModelId: UUID,
        @PathVariable componentId: UUID,
        @RequestBody componentPatchRequestDto: List<ComponentPatchRequestDto>,
    ): ResponseEntity<ComponentDto> {
        val params = componentPatchRequestDto.map { it.toParams() }
        jsonPatchValidator.validate(params).throwIfNotEmpty()

        val component = componentAPI.patch(ComponentId(componentId), params)

        return ResponseEntity.status(HttpStatus.OK).body(component.toDto())
    }
}
