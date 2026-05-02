package cz.vokounova.configurator.analytics.api

import cz.vokounova.configurator.analytics.api.dto.ConfiguratorAnalyticsEventBatchRequestDto
import java.util.UUID

fun interface ConfiguratorAnalyticsLeadRecordingFacade {
    fun recordRequestSubmitted(
        productModelId: UUID,
        customerRequestId: UUID,
        sessionId: String?,
        surface: String?,
        embedOwnerUserId: UUID?,
        embedProductUrl: String?,
    )
}

fun interface PublicConfiguratorAnalyticsFacade {
    fun receive(batch: ConfiguratorAnalyticsEventBatchRequestDto)
}
