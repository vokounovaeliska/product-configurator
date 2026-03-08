package cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.response

import java.time.OffsetDateTime
import java.util.UUID

data class AttributeOptionDto(
    val id: UUID,
    val attributeId: UUID,
    val value: String,
    val label: String,
    val imageUrl: String?,
    val sortOrder: Int,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
)
