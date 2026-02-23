package cz.vokounova.configurator.products.pricing.application.validation

import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.pricing.application.exception.DuplicatePricingRuleException
import cz.vokounova.configurator.products.pricing.ports.outbound.AttributePricingRuleRepository
import org.springframework.stereotype.Component
import java.util.UUID

@Component
class PricingRuleValidator(
    private val attributePricingRuleRepository: AttributePricingRuleRepository,
) {
    /**
     * Validates that no duplicate EQ rule exists for the same option value.
     * Each ENUM option can have only one pricing rule.
     * @throws DuplicatePricingRuleException if a rule already exists for this option
     */
    fun validateNoDuplicateOptionRule(
        productModelId: UUID,
        componentId: UUID?,
        attributeCode: String,
        value: String,
    ) {
        if (attributeCode.isBlank() || value.isBlank()) return

        val existing =
            attributePricingRuleRepository.findByProductModelId(
                ProductModelId(productModelId),
                componentId,
                attributeCode,
            )
        val duplicate = existing.any { it.operator == "EQ" && it.value == value }
        if (duplicate) {
            throw DuplicatePricingRuleException()
        }
    }
}
