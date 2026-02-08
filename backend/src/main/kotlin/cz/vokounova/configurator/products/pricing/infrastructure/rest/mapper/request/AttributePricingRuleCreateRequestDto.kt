package cz.vokounova.configurator.products.pricing.infrastructure.rest.mapper.request

import java.util.UUID

data class AttributePricingRuleCreateRequestDto(
    val componentId: UUID? = null,
    val attributeCode: String,
    val operator: String? = "EQ",
    val value: String,
    val toValue: String? = null,
    val priceDeltaCents: Int? = 0,
    val pricePerUnitCents: Int? = null,
)
