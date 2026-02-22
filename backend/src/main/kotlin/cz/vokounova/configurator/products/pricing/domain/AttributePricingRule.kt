package cz.vokounova.configurator.products.pricing.domain

import cz.vokounova.configurator.products.models.domain.ProductModelId
import java.time.OffsetDateTime
import java.util.UUID

@JvmInline
value class AttributePricingRuleId(val value: UUID)

data class AttributePricingRule(
    val id: AttributePricingRuleId,
    val productModelId: ProductModelId,
    val componentId: UUID?,
    val attributeCode: String,
    val operator: String,
    val value: String,
    val toValue: String?,
    val priceDeltaCents: Int,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
)
