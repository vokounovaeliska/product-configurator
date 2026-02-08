package cz.vokounova.configurator.products.pricing.infrastructure.rest

import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRule
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRuleId
import cz.vokounova.configurator.products.pricing.infrastructure.rest.mapper.request.AttributePricingRuleCreateRequestDto
import cz.vokounova.configurator.products.pricing.infrastructure.rest.mapper.response.AttributePricingRuleDto
import cz.vokounova.configurator.products.pricing.infrastructure.rest.mapper.toDto
import cz.vokounova.configurator.products.pricing.ports.outbound.AttributePricingRuleRepository
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.OffsetDateTime
import java.util.UUID

@RestController
@RequestMapping("/products/api/v1/product-models/{productModelId}/pricing-rules")
class PricingRulesController(
    private val attributePricingRuleRepository: AttributePricingRuleRepository,
) {
    @GetMapping
    fun list(
        @PathVariable productModelId: UUID,
        @RequestParam(required = false) componentId: UUID? = null,
        @RequestParam(required = false) attributeCode: String? = null,
    ): ResponseEntity<List<AttributePricingRuleDto>> {
        val rules =
            attributePricingRuleRepository.findByProductModelId(
                ProductModelId(productModelId),
                componentId,
                attributeCode,
            )
        return ResponseEntity.ok(rules.map { it.toDto() })
    }

    @PostMapping
    fun create(
        @PathVariable productModelId: UUID,
        @RequestBody body: AttributePricingRuleCreateRequestDto,
    ): ResponseEntity<AttributePricingRuleDto> {
        val now = OffsetDateTime.now()
        val rule =
            AttributePricingRule(
                id = AttributePricingRuleId(UUID.randomUUID()),
                productModelId = ProductModelId(productModelId),
                componentId = body.componentId,
                attributeCode = body.attributeCode,
                operator = body.operator ?: "EQ",
                value = body.value,
                toValue = body.toValue,
                priceDeltaCents = body.priceDeltaCents ?: 0,
                pricePerUnitCents = body.pricePerUnitCents,
                createdAt = now,
                modifiedAt = now,
            )
        val created =
            attributePricingRuleRepository.create(rule)
                ?: return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        return ResponseEntity.status(HttpStatus.CREATED).body(created.toDto())
    }

    @PutMapping("/{ruleId}")
    fun update(
        @PathVariable productModelId: UUID,
        @PathVariable ruleId: UUID,
        @RequestBody body: AttributePricingRuleCreateRequestDto,
    ): ResponseEntity<AttributePricingRuleDto> {
        val existing =
            attributePricingRuleRepository.findById(AttributePricingRuleId(ruleId))
                ?: return ResponseEntity.notFound().build()
        if (existing.productModelId != ProductModelId(productModelId)) {
            return ResponseEntity.notFound().build()
        }
        val updated =
            existing.copy(
                componentId = body.componentId,
                attributeCode = body.attributeCode,
                operator = body.operator ?: "EQ",
                value = body.value,
                toValue = body.toValue,
                priceDeltaCents = body.priceDeltaCents ?: 0,
                pricePerUnitCents = body.pricePerUnitCents,
            )
        val saved =
            attributePricingRuleRepository.update(updated)
                ?: return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        return ResponseEntity.ok(saved.toDto())
    }

    @DeleteMapping("/{ruleId}")
    fun delete(
        @PathVariable productModelId: UUID,
        @PathVariable ruleId: UUID,
    ): ResponseEntity<Unit> {
        val existing =
            attributePricingRuleRepository.findById(AttributePricingRuleId(ruleId))
                ?: return ResponseEntity.notFound().build()
        if (existing.productModelId != ProductModelId(productModelId)) {
            return ResponseEntity.notFound().build()
        }
        attributePricingRuleRepository.delete(AttributePricingRuleId(ruleId))
        return ResponseEntity.noContent().build()
    }
}
