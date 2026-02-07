package cz.vokounova.configurator.products.attributes.infrastructure.rest

import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionId
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributeOptionCreateRequestDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.request.AttributeOptionPatchRequestDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.response.AttributeOptionDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.toDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.toParams
import cz.vokounova.configurator.products.attributes.infrastructure.rest.validation.AttributeOptionCreateParamsValidator
import cz.vokounova.configurator.products.attributes.infrastructure.rest.validation.AttributeOptionJsonPatchParamsValidator
import cz.vokounova.configurator.products.attributes.ports.inbound.AttributeOptionAPI
import cz.vokounova.configurator.shared.exceptions.throwIfNotEmpty
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/products/api/v1/product-models/{productModelId}/components/{componentId}/attributes/{attributeId}/options")
class AttributeOptionsController(
    private val attributeOptionAPI: AttributeOptionAPI,
    private val createParamsValidator: AttributeOptionCreateParamsValidator,
    private val jsonPatchValidator: AttributeOptionJsonPatchParamsValidator,
) {
    @PostMapping
    fun attributeOptionsCreate(
        @PathVariable productModelId: UUID,
        @PathVariable componentId: UUID,
        @PathVariable attributeId: UUID,
        @RequestBody attributeOptionCreateRequestDto: AttributeOptionCreateRequestDto,
    ): ResponseEntity<AttributeOptionDto> {
        val params = attributeOptionCreateRequestDto.toParams(AttributeId(attributeId))
        createParamsValidator.validate(params).throwIfNotEmpty()
        val option = attributeOptionAPI.create(params)

        return ResponseEntity.status(HttpStatus.CREATED).body(option.toDto())
    }

    @DeleteMapping("/{optionId}")
    fun attributeOptionsDelete(
        @PathVariable productModelId: UUID,
        @PathVariable componentId: UUID,
        @PathVariable attributeId: UUID,
        @PathVariable optionId: UUID,
    ): ResponseEntity<Unit> {
        attributeOptionAPI.delete(AttributeOptionId(optionId))
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build()
    }

    @GetMapping("/{optionId}")
    fun attributeOptionsGet(
        @PathVariable productModelId: UUID,
        @PathVariable componentId: UUID,
        @PathVariable attributeId: UUID,
        @PathVariable optionId: UUID,
    ): ResponseEntity<AttributeOptionDto> {
        val option = attributeOptionAPI.getOne(AttributeOptionId(optionId))
        return ResponseEntity.status(HttpStatus.OK).body(option.toDto())
    }

    @GetMapping
    fun attributeOptionsList(
        @PathVariable productModelId: UUID,
        @PathVariable componentId: UUID,
        @PathVariable attributeId: UUID,
    ): ResponseEntity<List<AttributeOptionDto>> {
        val options = attributeOptionAPI.getByAttributeId(AttributeId(attributeId))
        return ResponseEntity.ok().body(options.map { it.toDto() })
    }

    @PatchMapping("/{optionId}")
    fun attributeOptionsPatch(
        @PathVariable productModelId: UUID,
        @PathVariable componentId: UUID,
        @PathVariable attributeId: UUID,
        @PathVariable optionId: UUID,
        @RequestBody attributeOptionPatchRequestDto: List<AttributeOptionPatchRequestDto>,
    ): ResponseEntity<AttributeOptionDto> {
        val params = attributeOptionPatchRequestDto.map { it.toParams() }
        jsonPatchValidator.validate(params).throwIfNotEmpty()

        val option = attributeOptionAPI.patch(AttributeOptionId(optionId), params)

        return ResponseEntity.status(HttpStatus.OK).body(option.toDto())
    }
}
