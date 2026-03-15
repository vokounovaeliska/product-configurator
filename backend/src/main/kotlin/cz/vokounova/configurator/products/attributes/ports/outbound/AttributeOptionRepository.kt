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

    /**
     * Returns true if any attribute option (excluding the given IDs) references [imageUrl].
     * Used to avoid deleting image files that are still referenced by other options (e.g. shared
     * textures from SketchUp import).
     */
    fun existsOtherOptionWithImageUrl(
        imageUrl: String,
        excludeOptionIds: Set<AttributeOptionId>,
    ): Boolean
}
