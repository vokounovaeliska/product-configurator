package cz.vokounova.configurator.products.pricing.infrastructure.persistence.mapper

import cz.vokounova.configurator.generated.jooq.enums.ConditionOperator
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

private fun operatorFromString(value: String): ConditionOperator =
    ConditionOperator.entries.find { it.literal == value } ?: ConditionOperator.EQ

fun AttributePricingRule.toPersistence(): AttributePricingRuleRecord =
    AttributePricingRuleRecord(
        id = id.value,
        productModelId = productModelId.value,
        componentId = componentId,
        attributeCode = attributeCode,
        operator = operatorFromString(operator),
        value = value,
        toValue = toValue,
        priceDeltaCents = priceDeltaCents,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
        pricePerUnitCents = pricePerUnitCents,
    )
