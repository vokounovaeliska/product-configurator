package cz.vokounova.configurator.products.pricing.ports.outbound

import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRule
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRuleId
import java.util.UUID

interface AttributePricingRuleRepository {
    fun findByProductModelId(productModelId: ProductModelId): List<AttributePricingRule>

    
    fun findByProductModelId(
        productModelId: ProductModelId,
        componentId: UUID?,
        attributeCode: String?,
    ): List<AttributePricingRule>

    fun findById(id: AttributePricingRuleId): AttributePricingRule?

    fun create(rule: AttributePricingRule): AttributePricingRule?

    fun update(rule: AttributePricingRule): AttributePricingRule?

    fun delete(id: AttributePricingRuleId): Int

    
    fun deleteByProductModelComponentAttributeValue(
        productModelId: ProductModelId,
        componentId: UUID,
        attributeCode: String,
        optionValue: String,
    ): Int
}
