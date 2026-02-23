package cz.vokounova.configurator.products.attributes.infrastructure.rest

import cz.vokounova.configurator.generated.jooq.enums.AttributeType
import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.domain.AttributeSortableField
import cz.vokounova.configurator.products.attributes.domain.AttributeSortingConfig
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributeCreateRequestDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributePatchRequestDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.response.AttributeDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.response.AttributePaginatedResponseDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.toDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.toFilter
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.toParams
import cz.vokounova.configurator.products.attributes.infrastructure.rest.request.AttributeListQueryParams
import cz.vokounova.configurator.products.attributes.infrastructure.rest.validation.AttributeCreateParamsValidator
import cz.vokounova.configurator.products.attributes.infrastructure.rest.validation.AttributeJsonPatchParamsValidator
import cz.vokounova.configurator.products.attributes.infrastructure.rest.validation.AttributeListQueryParamsValidator
import cz.vokounova.configurator.products.attributes.ports.inbound.AttributeAPI
import cz.vokounova.configurator.products.components.domain.ComponentId
import cz.vokounova.configurator.products.components.ports.inbound.ComponentAPI
import cz.vokounova.configurator.products.pricing.DefaultPricingRulesService
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
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
@RequestMapping("/products/api/v1/product-models/{productModelId}/components/{componentId}/attributes")
class AttributesController(
    private val attributeAPI: AttributeAPI,
    private val componentAPI: ComponentAPI,
    private val queryParamsValidator: AttributeListQueryParamsValidator,
    private val createParamsValidator: AttributeCreateParamsValidator,
    private val jsonPatchValidator: AttributeJsonPatchParamsValidator,
    private val defaultPricingRulesService: DefaultPricingRulesService,
) {
    @PostMapping
    fun attributesCreate(
        @PathVariable productModelId: UUID,
        @PathVariable componentId: UUID,
        @RequestBody attributeCreateRequestDto: AttributeCreateRequestDto,
    ): ResponseEntity<AttributeDto> {
        val params = attributeCreateRequestDto.toParams(ComponentId(componentId))
        createParamsValidator.validate(params).throwIfNotEmpty()
        val attribute = attributeAPI.create(params)

        when {
            attribute.minInt != null &&
                attribute.maxInt != null &&
                attribute.type == AttributeType.INTEGER ->
                defaultPricingRulesService.createDefaultsForNumericAttributeIfEmpty(
                    productModelId,
                    componentId,
                    attribute.code,
                    attribute.minInt.toString(),
                    attribute.maxInt.toString(),
                )
            attribute.minDecimal != null &&
                attribute.maxDecimal != null &&
                attribute.type == AttributeType.DECIMAL ->
                defaultPricingRulesService.createDefaultsForNumericAttributeIfEmpty(
                    productModelId,
                    componentId,
                    attribute.code,
                    attribute.minDecimal.toString(),
                    attribute.maxDecimal.toString(),
                )
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(attribute.toDto())
    }

    @DeleteMapping("/{attributeId}")
    fun attributesDelete(
        @PathVariable productModelId: UUID,
        @PathVariable componentId: UUID,
        @PathVariable attributeId: UUID,
    ): ResponseEntity<Unit> {
        // Validate that component belongs to product model
        val component = componentAPI.getOne(ComponentId(componentId))
        if (component.productModelId.value != productModelId) {
            throw ResourceNotFoundException("Component with id $componentId does not belong to product model $productModelId")
        }

        // Validate that attribute belongs to component
        val attribute = attributeAPI.getOne(AttributeId(attributeId))
        if (attribute.componentId.value != componentId) {
            throw ResourceNotFoundException("Attribute with id $attributeId does not belong to component $componentId")
        }

        attributeAPI.delete(AttributeId(attributeId))
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build()
    }

    @GetMapping("/{attributeId}")
    fun attributesGet(
        @PathVariable productModelId: UUID,
        @PathVariable componentId: UUID,
        @PathVariable attributeId: UUID,
    ): ResponseEntity<AttributeDto> {
        // Validate that component belongs to product model
        val component = componentAPI.getOne(ComponentId(componentId))
        if (component.productModelId.value != productModelId) {
            throw ResourceNotFoundException("Component with id $componentId does not belong to product model $productModelId")
        }

        // Validate that attribute belongs to component
        val attribute = attributeAPI.getOne(AttributeId(attributeId))
        if (attribute.componentId.value != componentId) {
            throw ResourceNotFoundException("Attribute with id $attributeId does not belong to component $componentId")
        }

        return ResponseEntity.status(HttpStatus.OK).body(attribute.toDto())
    }

    @GetMapping
    fun attributesPaginatedList(
        @PathVariable productModelId: UUID,
        @PathVariable componentId: UUID,
        @RequestParam(required = false) limit: Int?,
        @RequestParam(required = false) after: String?,
        @RequestParam(required = false) before: String?,
        @RequestParam(required = false) orderBy: List<String>?,
        @RequestParam(required = false) ids: List<UUID>?,
        @RequestParam(required = false) types: List<AttributeType>?,
    ): ResponseEntity<AttributePaginatedResponseDto> {
        val queryParamsDto =
            AttributeListQueryParams(
                componentIds = listOf(componentId),
                ids = ids,
                types = types,
                limit = limit,
                orderBy = orderBy,
            )

        queryParamsValidator.validate(queryParamsDto).throwIfNotEmpty()

        val sortableFields =
            SortingUtils.createSorting<AttributeSortableField>(
                orderBy,
                AttributeSortingConfig,
            )

        val paginatedRequest =
            PaginationUtils.createPaginationRequest(
                limit = limit,
                orderBy = sortableFields,
                after = after,
                before = before,
            )

        val response = attributeAPI.getByFilterPaginated(queryParamsDto.toFilter(), paginatedRequest)
        return ResponseEntity.ok().body(
            AttributePaginatedResponseDto(
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

    @PatchMapping("/{attributeId}")
    fun attributesPatch(
        @PathVariable productModelId: UUID,
        @PathVariable componentId: UUID,
        @PathVariable attributeId: UUID,
        @RequestBody attributePatchRequestDto: List<AttributePatchRequestDto>,
    ): ResponseEntity<AttributeDto> {
        // Validate that component belongs to product model
        val component = componentAPI.getOne(ComponentId(componentId))
        if (component.productModelId.value != productModelId) {
            throw ResourceNotFoundException("Component with id $componentId does not belong to product model $productModelId")
        }

        // Validate that attribute belongs to component
        val existingAttribute = attributeAPI.getOne(AttributeId(attributeId))
        if (existingAttribute.componentId.value != componentId) {
            throw ResourceNotFoundException("Attribute with id $attributeId does not belong to component $componentId")
        }

        val params = attributePatchRequestDto.map { it.toParams() }
        jsonPatchValidator.validate(params).throwIfNotEmpty()

        val attribute = attributeAPI.patch(AttributeId(attributeId), params)

        return ResponseEntity.status(HttpStatus.OK).body(attribute.toDto())
    }
}
