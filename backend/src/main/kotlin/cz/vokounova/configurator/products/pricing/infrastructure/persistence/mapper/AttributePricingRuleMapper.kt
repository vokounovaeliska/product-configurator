package cz.vokounova.configurator.products.pricing.infrastructure.persistence.mapper

import cz.vokounova.configurator.generated.jooq.tables.records.AttributePricingRuleRecord
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRule
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRuleId

fun AttributePricingRuleRecord.toDomain(): AttributePricingRule =
    AttributePricingRule(
        id = AttributePricingRuleId(id),
        productModelId = ProductModelId(productModelId),
        componentId = componentId,
        attributeCode = attributeCode,
        operator = operator!!.literal,
        value = value,
        toValue = toValue,
        priceDeltaCents = priceDeltaCents,
        pricePerUnitCents = pricePerUnitCents,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    )
