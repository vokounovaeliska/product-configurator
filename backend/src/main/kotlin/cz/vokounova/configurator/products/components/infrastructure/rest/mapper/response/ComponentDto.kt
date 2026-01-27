package cz.vokounova.configurator.products.components.infrastructure.rest.mapper.response

import java.time.OffsetDateTime
import java.util.UUID

data class ComponentDto(
    val id: UUID,
    val productModelId: UUID,
    val code: String,
    val label: String,
    val description: String?,
    val sortOrder: Int,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
)
