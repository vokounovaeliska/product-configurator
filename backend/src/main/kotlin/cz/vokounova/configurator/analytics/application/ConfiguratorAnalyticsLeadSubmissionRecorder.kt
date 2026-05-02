package cz.vokounova.configurator.analytics.application

import cz.vokounova.configurator.analytics.api.ConfiguratorAnalyticsLeadRecordingFacade
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsEventRow
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsEventType
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsSurface
import cz.vokounova.configurator.analytics.events.ports.outbound.ConfiguratorAnalyticsEventRepository
import cz.vokounova.configurator.products.api.ProductConfigQueryFacade
import org.springframework.stereotype.Component
import java.util.UUID

/** Records a [ConfiguratorAnalyticsEventType.REQUEST_SUBMITTED] row after a lead is created (server-side only). */
@Component
class ConfiguratorAnalyticsLeadSubmissionRecorder(
    private val productConfigQueryFacade: ProductConfigQueryFacade,
    private val configuratorAnalyticsEventRepository: ConfiguratorAnalyticsEventRepository,
) : ConfiguratorAnalyticsLeadRecordingFacade {
    override fun recordRequestSubmitted(
        productModelId: UUID,
        customerRequestId: UUID,
        sessionId: String?,
        surface: String?,
        embedOwnerUserId: UUID?,
        embedProductUrl: String?,
    ) {
        val s = surface?.trim()?.takeIf { it.isNotEmpty() } ?: return
        if (!ConfiguratorAnalyticsSurface.isValid(s)) return
        val sid = sessionId?.trim()?.takeIf { it.isNotEmpty() } ?: return

        val published =
            productConfigQueryFacade.findPublishedForConfiguratorAnalytics(productModelId) ?: return

        if (s == ConfiguratorAnalyticsSurface.EMBED_IFRAME) {
            val owner =
                embedOwnerUserId
                    ?: return
            val url =
                embedProductUrl?.trim()?.takeIf { it.isNotEmpty() }
                    ?: return
            if (published.ownerUserId != owner) return
            val modelUrl =
                published.urlTrimmedOrNull
                    ?: return
            if (modelUrl != url.trim()) return
        }

        val embedUrl = embedProductUrl?.trim()?.takeIf { it.isNotEmpty() }
        configuratorAnalyticsEventRepository.insertEvents(
            listOf(
                ConfiguratorAnalyticsEventRow(
                    eventType = ConfiguratorAnalyticsEventType.REQUEST_SUBMITTED,
                    sessionId = sid,
                    productModelId = productModelId,
                    embedOwnerUserId = embedOwnerUserId,
                    embedProductUrl = embedUrl,
                    surface = s,
                    customerRequestId = customerRequestId,
                ),
            ),
        )
    }
}
