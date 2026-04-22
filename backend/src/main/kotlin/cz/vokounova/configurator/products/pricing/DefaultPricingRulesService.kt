package cz.vokounova.configurator.products.pricing

import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRule
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRuleId
import cz.vokounova.configurator.products.pricing.ports.outbound.AttributePricingRuleRepository
import org.springframework.stereotype.Service
import java.time.OffsetDateTime
import java.util.UUID

@Service
class DefaultPricingRulesService(
    private val attributePricingRuleRepository: AttributePricingRuleRepository,
) {
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

    fun deleteForOptionValue(
        productModelId: UUID,
        componentId: UUID,
        attributeCode: String,
        optionValue: String,
    ) {
        attributePricingRuleRepository.deleteByProductModelComponentAttributeValue(
            productModelId = ProductModelId(productModelId),
            componentId = componentId,
            attributeCode = attributeCode,
            optionValue = optionValue,
        )
    }
}
