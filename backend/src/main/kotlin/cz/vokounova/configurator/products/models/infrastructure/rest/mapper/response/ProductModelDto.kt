package cz.vokounova.configurator.products.models.infrastructure.rest.mapper.response

import java.time.OffsetDateTime
import java.util.UUID

data class ProductModelDto(
    val id: UUID,
    val userId: UUID,
    val name: String,
    val description: String?,
    val price: Double,
    val currency: String,
    val isActive: Boolean,
    val model3dUrl: String? = null,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
)
