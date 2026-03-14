package cz.vokounova.configurator.products.pricing

import cz.vokounova.configurator.generated.jooq.enums.ConditionOperator
import cz.vokounova.configurator.generated.jooq.tables.references.ATTRIBUTE_PRICING_RULE
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRule
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRuleId
import cz.vokounova.configurator.products.pricing.infrastructure.persistence.mapper.toDomain
import cz.vokounova.configurator.products.pricing.infrastructure.persistence.mapper.toPersistence
import cz.vokounova.configurator.products.pricing.ports.outbound.AttributePricingRuleRepository
import org.jooq.DSLContext
import java.time.OffsetDateTime
import java.util.UUID
import org.springframework.stereotype.Component as ComponentStereotype

@ComponentStereotype
class AttributePricingRuleRepositoryDB(
    private val dslContext: DSLContext,
) : AttributePricingRuleRepository {
    override fun findByProductModelId(productModelId: ProductModelId): List<AttributePricingRule> =
        findByProductModelId(productModelId, null, null)

    override fun findByProductModelId(
        productModelId: ProductModelId,
        componentId: UUID?,
        attributeCode: String?,
    ): List<AttributePricingRule> {
        var condition = ATTRIBUTE_PRICING_RULE.PRODUCT_MODEL_ID.eq(productModelId.value)
        if (componentId != null) {
            condition = condition.and(ATTRIBUTE_PRICING_RULE.COMPONENT_ID.eq(componentId))
        }
        if (attributeCode != null) {
            condition = condition.and(ATTRIBUTE_PRICING_RULE.ATTRIBUTE_CODE.eq(attributeCode))
        }
        return dslContext
            .selectFrom(ATTRIBUTE_PRICING_RULE)
            .where(condition)
            .orderBy(ATTRIBUTE_PRICING_RULE.CREATED_AT)
            .fetch()
            .map { it.toDomain() }
    }

    override fun findById(id: AttributePricingRuleId): AttributePricingRule? =
        dslContext
            .selectFrom(ATTRIBUTE_PRICING_RULE)
            .where(ATTRIBUTE_PRICING_RULE.ID.eq(id.value))
            .fetchOne()
            ?.toDomain()

    override fun create(rule: AttributePricingRule): AttributePricingRule? {
        val record = rule.toPersistence()
        return dslContext
            .insertInto(ATTRIBUTE_PRICING_RULE)
            .set(record)
            .returning()
            .fetchOne()
            ?.toDomain()
    }

    override fun update(rule: AttributePricingRule): AttributePricingRule? {
        val updated = rule.copy(modifiedAt = OffsetDateTime.now())
        val record = updated.toPersistence()
        return dslContext
            .update(ATTRIBUTE_PRICING_RULE)
            .set(record)
            .where(ATTRIBUTE_PRICING_RULE.ID.eq(record.id))
            .returning()
            .fetchOne()
            ?.toDomain()
    }

    override fun delete(id: AttributePricingRuleId): Int =
        dslContext
            .deleteFrom(ATTRIBUTE_PRICING_RULE)
            .where(ATTRIBUTE_PRICING_RULE.ID.eq(id.value))
            .execute()

    override fun deleteByProductModelComponentAttributeValue(
        productModelId: ProductModelId,
        componentId: UUID,
        attributeCode: String,
        optionValue: String,
    ): Int =
        dslContext
            .deleteFrom(ATTRIBUTE_PRICING_RULE)
            .where(
                ATTRIBUTE_PRICING_RULE.PRODUCT_MODEL_ID.eq(productModelId.value)
                    .and(ATTRIBUTE_PRICING_RULE.COMPONENT_ID.eq(componentId))
                    .and(ATTRIBUTE_PRICING_RULE.ATTRIBUTE_CODE.eq(attributeCode))
                    .and(ATTRIBUTE_PRICING_RULE.OPERATOR.eq(ConditionOperator.EQ))
                    .and(ATTRIBUTE_PRICING_RULE.VALUE.eq(optionValue)),
            )
            .execute()
}
