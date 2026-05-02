package cz.vokounova.configurator.analytics.api.dto

import java.util.UUID

data class ConfiguratorAnalyticsClientEventDto(
    val type: String,
    val sessionId: String,
    val productModelId: UUID,
    val surface: String,
    val embedOwnerUserId: UUID? = null,
    val embedProductUrl: String? = null,
)

data class ConfiguratorAnalyticsEventBatchRequestDto(
    val events: List<ConfiguratorAnalyticsClientEventDto>,
)
