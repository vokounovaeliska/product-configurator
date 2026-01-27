package cz.vokounova.configurator.products.attributes.ports.outbound

import cz.vokounova.configurator.products.attributes.domain.AttributeId
import cz.vokounova.configurator.products.attributes.domain.AttributeOption
import cz.vokounova.configurator.products.attributes.domain.AttributeOptionId

interface AttributeOptionRepository {
    fun findByAttributeId(attributeId: AttributeId): List<AttributeOption>

    fun create(option: AttributeOption): AttributeOption?

    fun update(option: AttributeOption): AttributeOption?

    fun delete(id: AttributeOptionId): Int

    fun deleteByAttributeId(attributeId: AttributeId): Int
}
