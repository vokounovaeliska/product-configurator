package cz.vokounova.configurator.products.pricing.infrastructure.rest

import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.pricing.infrastructure.rest.mapper.response.AttributePricingRuleDto
import cz.vokounova.configurator.products.pricing.infrastructure.rest.mapper.toDto
import cz.vokounova.configurator.products.pricing.ports.outbound.AttributePricingRuleRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
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
}
