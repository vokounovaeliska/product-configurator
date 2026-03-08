package cz.vokounova.configurator.embed.infrastructure.rest

import java.util.UUID

/** Public DTO for embed – product model data needed for configurator (no userId). */
data class ProductModelEmbedDto(
    val id: UUID,
    val name: String,
    val description: String?,
    val price: Double,
    val currency: String,
    val model3dUrl: String?,
    val model3dEffects: String? = null,
    val url: String?,
)
