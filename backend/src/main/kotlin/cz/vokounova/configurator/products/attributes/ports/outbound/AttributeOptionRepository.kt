package cz.vokounova.configurator.products.attributes.ports.outbound

import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.domain.AttributeOption
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionId

interface AttributeOptionRepository {
    fun findById(id: AttributeOptionId): AttributeOption?

    fun findByAttributeId(attributeId: AttributeId): List<AttributeOption>

    fun create(option: AttributeOption): AttributeOption?

    fun update(option: AttributeOption): AttributeOption?

    fun delete(id: AttributeOptionId): Int

    fun deleteByAttributeId(attributeId: AttributeId): Int

    fun existsOtherOptionWithImageUrl(
        imageUrl: String,
        excludeOptionIds: Set<AttributeOptionId>,
    ): Boolean
}
