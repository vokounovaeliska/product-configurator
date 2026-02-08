package cz.vokounova.configurator.products.pricing.ports.outbound

import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRule
import java.util.UUID

interface AttributePricingRuleRepository {
    fun findByProductModelId(productModelId: ProductModelId): List<AttributePricingRule>

    /**
     * Find rules for a product model, optionally filtered by component and attribute code.
     * When both componentId and attributeCode are non-null, only rules for that attribute are returned.
     */
    fun findByProductModelId(
        productModelId: ProductModelId,
        componentId: UUID?,
        attributeCode: String?,
    ): List<AttributePricingRule>
}
