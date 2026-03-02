package cz.vokounova.configurator.products.api.dto

import java.time.OffsetDateTime
import java.util.UUID

data class ComponentExternalDto(
    val id: UUID,
    val productModelId: UUID,
    val code: String,
    val label: String,
    val description: String?,
    val sortOrder: Int,
    val imageZIndex: Int,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
)
