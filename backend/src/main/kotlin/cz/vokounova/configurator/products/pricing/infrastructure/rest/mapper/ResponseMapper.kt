package cz.vokounova.configurator.products.pricing.infrastructure.rest.mapper

import cz.vokounova.configurator.products.pricing.domain.AttributePricingRule
import cz.vokounova.configurator.products.pricing.infrastructure.rest.mapper.response.AttributePricingRuleDto

fun AttributePricingRule.toDto(): AttributePricingRuleDto =
    AttributePricingRuleDto(
        id = id.value,
        productModelId = productModelId.value,
        componentId = componentId,
        attributeCode = attributeCode,
        operator = operator,
        value = value,
        toValue = toValue,
        priceDeltaCents = priceDeltaCents,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )
