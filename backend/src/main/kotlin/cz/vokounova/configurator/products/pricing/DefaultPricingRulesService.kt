package cz.vokounova.configurator.products.pricing

import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRule
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRuleId
import cz.vokounova.configurator.products.pricing.ports.outbound.AttributePricingRuleRepository
import org.springframework.stereotype.Service
import java.time.OffsetDateTime
import java.util.UUID

/**
 * Creates default pricing rules for a more intuitive setup:
 * - Numeric attributes (INTEGER/DECIMAL): one BETWEEN rule for min..max with price 0 when none exist.
 * - ENUM options (materials): one EQ rule per option value with price 0 when none exists for that value.
 */
@Service
class DefaultPricingRulesService(
    private val attributePricingRuleRepository: AttributePricingRuleRepository,
) {
    /**
     * If the attribute has no pricing rules yet, creates one BETWEEN rule covering [minValue]..[maxValue]
     * with price delta 0. Call after creating an INTEGER or DECIMAL attribute with min and max set.
     */
    fun createDefaultsForNumericAttributeIfEmpty(
        productModelId: UUID,
        componentId: UUID,
        attributeCode: String,
        minValue: String,
        maxValue: String,
    ) {
        val productModelIdDomain = ProductModelId(productModelId)
        val existing =
            attributePricingRuleRepository.findByProductModelId(
                productModelIdDomain,
                componentId,
                attributeCode,
            )
        if (existing.isNotEmpty()) return

        val now = OffsetDateTime.now()
        val rule =
            AttributePricingRule(
                id = AttributePricingRuleId(UUID.randomUUID()),
                productModelId = productModelIdDomain,
                componentId = componentId,
                attributeCode = attributeCode,
                operator = "BETWEEN",
                value = minValue,
                toValue = maxValue,
                price = 0,
                createdAt = now,
                modifiedAt = now,
            )
        attributePricingRuleRepository.create(rule)
    }

    /**
     * If there is no pricing rule yet for this attribute and option value, creates one EQ rule
     * with price delta 0. Call after creating an ENUM attribute option (e.g. material).
     */
    fun createDefaultForOptionIfMissing(
        productModelId: UUID,
        componentId: UUID,
        attributeCode: String,
        optionValue: String,
    ) {
        val productModelIdDomain = ProductModelId(productModelId)
        val existing =
            attributePricingRuleRepository.findByProductModelId(
                productModelIdDomain,
                componentId,
                attributeCode,
            )
        val alreadyHasRuleForValue =
            existing.any { it.operator == "EQ" && it.value == optionValue }
        if (alreadyHasRuleForValue) return

        val now = OffsetDateTime.now()
        val rule =
            AttributePricingRule(
                id = AttributePricingRuleId(UUID.randomUUID()),
                productModelId = productModelIdDomain,
                componentId = componentId,
                attributeCode = attributeCode,
                operator = "EQ",
                value = optionValue,
                toValue = null,
                price = 0,
                createdAt = now,
                modifiedAt = now,
            )
        attributePricingRuleRepository.create(rule)
    }
}
