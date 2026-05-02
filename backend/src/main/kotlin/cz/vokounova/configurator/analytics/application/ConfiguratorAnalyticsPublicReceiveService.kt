package cz.vokounova.configurator.analytics.application

import cz.vokounova.configurator.analytics.api.PublicConfiguratorAnalyticsFacade
import cz.vokounova.configurator.analytics.api.dto.ConfiguratorAnalyticsEventBatchRequestDto
import cz.vokounova.configurator.analytics.application.exception.ConfiguratorAnalyticsEventRejectedException
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsEventRow
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsEventType
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsSurface
import cz.vokounova.configurator.analytics.events.ports.outbound.ConfiguratorAnalyticsEventRepository
import cz.vokounova.configurator.products.api.ProductConfigQueryFacade
import org.springframework.stereotype.Service

/** Validates and persists analytics events received from public embed / configurator pages (browser). */
@Service
class ConfiguratorAnalyticsPublicReceiveService(
    private val productConfigQueryFacade: ProductConfigQueryFacade,
    private val configuratorAnalyticsEventRepository: ConfiguratorAnalyticsEventRepository,
) : PublicConfiguratorAnalyticsFacade {
    override fun receive(batch: ConfiguratorAnalyticsEventBatchRequestDto) {
        val events = batch.events
        if (events.size > MAX_BATCH) {
            ConfiguratorAnalyticsEventRejectedException.reject()
        }
        if (events.isEmpty()) return

        val rows =
            events.map { dto ->
                if (!ConfiguratorAnalyticsEventType.isClientAllowed(dto.type)) {
                    ConfiguratorAnalyticsEventRejectedException.reject()
                }
                if (!ConfiguratorAnalyticsSurface.isValid(dto.surface)) {
                    ConfiguratorAnalyticsEventRejectedException.reject()
                }
                if (dto.sessionId.isBlank()) {
                    ConfiguratorAnalyticsEventRejectedException.reject()
                }

                val published =
                    productConfigQueryFacade.findPublishedForConfiguratorAnalytics(dto.productModelId)
                        ?: ConfiguratorAnalyticsEventRejectedException.reject()

                if (dto.surface == ConfiguratorAnalyticsSurface.EMBED_IFRAME) {
                    val ownerId =
                        dto.embedOwnerUserId ?: ConfiguratorAnalyticsEventRejectedException.reject()
                    val url =
                        dto.embedProductUrl?.trim()?.takeIf { it.isNotEmpty() }
                            ?: ConfiguratorAnalyticsEventRejectedException.reject()
                    if (published.ownerUserId != ownerId) {
                        ConfiguratorAnalyticsEventRejectedException.reject()
                    }
                    val modelUrl =
                        published.urlTrimmedOrNull
                            ?: ConfiguratorAnalyticsEventRejectedException.reject()
                    if (modelUrl != url.trim()) {
                        ConfiguratorAnalyticsEventRejectedException.reject()
                    }
                }

                val embedOwner = dto.embedOwnerUserId
                val embedUrl =
                    dto.embedProductUrl?.trim()?.takeIf { it.isNotEmpty() }
                ConfiguratorAnalyticsEventRow(
                    eventType = dto.type,
                    sessionId = dto.sessionId.trim(),
                    productModelId = dto.productModelId,
                    embedOwnerUserId = embedOwner,
                    embedProductUrl = embedUrl,
                    surface = dto.surface,
                    customerRequestId = null,
                )
            }
        configuratorAnalyticsEventRepository.insertEvents(rows)
    }

    companion object {
        private const val MAX_BATCH = 32
    }
}
