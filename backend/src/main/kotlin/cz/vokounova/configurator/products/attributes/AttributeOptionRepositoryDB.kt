package cz.vokounova.configurator.products.attributes

import cz.vokounova.configurator.generated.jooq.tables.references.ATTRIBUTE_OPTION
import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.domain.AttributeOption
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionId
import cz.vokounova.configurator.products.attributes.infrastructure.persistence.mapper.toDomain
import cz.vokounova.configurator.products.attributes.infrastructure.persistence.mapper.toPersistence
import cz.vokounova.configurator.products.attributes.ports.outbound.AttributeOptionRepository
import org.jooq.DSLContext
import java.time.OffsetDateTime
import org.springframework.stereotype.Component as ComponentStereotype

@ComponentStereotype
class AttributeOptionRepositoryDB(
    private val dslContext: DSLContext,
) : AttributeOptionRepository {
    override fun findById(id: AttributeOptionId): AttributeOption? =
        dslContext
            .selectFrom(ATTRIBUTE_OPTION)
            .where(ATTRIBUTE_OPTION.ID.eq(id.value))
            .fetchOne()
            ?.toDomain()

    override fun findByAttributeId(attributeId: AttributeId): List<AttributeOption> =
        dslContext
            .selectFrom(ATTRIBUTE_OPTION)
            .where(ATTRIBUTE_OPTION.ATTRIBUTE_ID.eq(attributeId.value))
            .orderBy(ATTRIBUTE_OPTION.SORT_ORDER.asc(), ATTRIBUTE_OPTION.LABEL.asc())
            .fetch()
            .map { it.toDomain() }

    override fun create(option: AttributeOption): AttributeOption? {
        val record = option.toPersistence()

        return dslContext
            .insertInto(ATTRIBUTE_OPTION)
            .set(record)
            .returning()
            .fetchOne()
            ?.toDomain()
    }

    override fun update(option: AttributeOption): AttributeOption? {
        val updatedOption = option.copy(modifiedAt = OffsetDateTime.now())
        val record = updatedOption.toPersistence()

        return dslContext
            .update(ATTRIBUTE_OPTION)
            .set(record)
            .where(ATTRIBUTE_OPTION.ID.eq(record.id))
            .returning()
            .fetchOne()
            ?.toDomain()
    }

    override fun delete(id: AttributeOptionId): Int =
        dslContext
            .deleteFrom(ATTRIBUTE_OPTION)
            .where(ATTRIBUTE_OPTION.ID.eq(id.value))
            .execute()

    override fun deleteByAttributeId(attributeId: AttributeId): Int =
        dslContext
            .deleteFrom(ATTRIBUTE_OPTION)
            .where(ATTRIBUTE_OPTION.ATTRIBUTE_ID.eq(attributeId.value))
            .execute()

    override fun existsOtherOptionWithImageUrl(
        imageUrl: String,
        excludeOptionIds: Set<AttributeOptionId>,
    ): Boolean {
        var condition = ATTRIBUTE_OPTION.IMAGE_URL.eq(imageUrl)
        if (excludeOptionIds.isNotEmpty()) {
            condition = condition.and(ATTRIBUTE_OPTION.ID.notIn(excludeOptionIds.map { it.value }))
        }
        return dslContext.fetchExists(
            dslContext.selectFrom(ATTRIBUTE_OPTION).where(condition),
        )
    }
}
