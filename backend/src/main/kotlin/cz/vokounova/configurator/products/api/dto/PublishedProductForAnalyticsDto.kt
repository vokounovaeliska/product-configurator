package cz.vokounova.configurator.products.api.dto

import java.util.UUID

/** Published product facts exposed to configurator analytics (cross-module). */
data class PublishedProductForAnalyticsDto(
    val ownerUserId: UUID,
    val urlTrimmedOrNull: String?,
)
