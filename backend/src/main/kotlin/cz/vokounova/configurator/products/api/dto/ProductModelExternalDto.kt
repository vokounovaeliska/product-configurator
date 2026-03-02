package cz.vokounova.configurator.products.api.dto

import java.util.UUID

data class ProductModelExternalDto(
    val id: UUID,
    val name: String,
    val description: String?,
    val price: Double,
    val currency: String,
    val model3dUrl: String?,
    val url: String?,
    val isPublished: Boolean,
)
