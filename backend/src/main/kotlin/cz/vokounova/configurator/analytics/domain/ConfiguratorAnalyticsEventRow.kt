package cz.vokounova.configurator.analytics.domain

import java.util.UUID

data class ConfiguratorAnalyticsEventRow(
    val eventType: String,
    val sessionId: String?,
    val productModelId: UUID,
    val embedOwnerUserId: UUID?,
    val embedProductUrl: String?,
    val surface: String,
    val customerRequestId: UUID? = null,
)
