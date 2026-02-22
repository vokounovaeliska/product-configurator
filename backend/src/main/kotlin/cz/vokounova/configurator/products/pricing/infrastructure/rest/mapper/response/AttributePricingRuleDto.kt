package cz.vokounova.configurator.products.pricing.infrastructure.rest.mapper.response

import java.time.OffsetDateTime
import java.util.UUID

data class AttributePricingRuleDto(
    val id: UUID,
    val productModelId: UUID,
    val componentId: UUID?,
    val attributeCode: String,
    val operator: String,
    val value: String,
    val toValue: String?,
    val priceDeltaCents: Int,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
)
