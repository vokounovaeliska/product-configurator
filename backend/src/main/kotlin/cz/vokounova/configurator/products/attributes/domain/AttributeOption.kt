package cz.vokounova.configurator.products.attributes.domain

import java.time.OffsetDateTime
import java.util.UUID

@JvmInline
value class AttributeOptionId(
    val value: UUID,
)

data class AttributeOption(
    val id: AttributeOptionId,
    val attributeId: AttributeId,
    val value: String,
    val label: String,
    val imageUrl: String?,
    val colorHex: String?,
    val sortOrder: Int,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
) {
    companion object {
        fun create(params: AttributeOptionCreateParams): AttributeOption {
            val timestamp = OffsetDateTime.now()
            return AttributeOption(
                id = AttributeOptionId(UUID.randomUUID()),
                attributeId = params.attributeId,
                value = params.value,
                label = params.label,
                imageUrl = params.imageUrl,
                colorHex = params.colorHex,
                sortOrder = params.sortOrder ?: 0,
                createdAt = timestamp,
                modifiedAt = timestamp,
            )
        }
    }
}

data class AttributeOptionCreateParams(
    val attributeId: AttributeId,
    val value: String,
    val label: String,
    val imageUrl: String? = null,
    val colorHex: String? = null,
    val sortOrder: Int? = null,
)
