package cz.vokounova.configurator.products.models.domain

import java.math.BigDecimal
import java.time.OffsetDateTime

data class ProductModelConfiguratorPreferences(
    val productModelId: ProductModelId,
    val zoomDistanceDefault: BigDecimal?,
    val zoomDistanceEmbed: BigDecimal?,
    val embedShowProductName: Boolean?,
    val embedShowDescription: Boolean?,
    val embedShowComponents: Boolean?,
    val createdAt: OffsetDateTime,
    val modifiedAt: OffsetDateTime,
)
