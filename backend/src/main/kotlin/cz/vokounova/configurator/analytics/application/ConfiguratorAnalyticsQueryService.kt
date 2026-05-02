package cz.vokounova.configurator.analytics.application

import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsSummary
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsTimePreset
import cz.vokounova.configurator.analytics.events.ports.outbound.ConfiguratorAnalyticsEventRepository
import cz.vokounova.configurator.shared.security.AuthFacade
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class ConfiguratorAnalyticsQueryService(
    private val authFacade: AuthFacade,
    private val configuratorAnalyticsEventRepository: ConfiguratorAnalyticsEventRepository,
) {
    fun loadSummary(
        timePreset: ConfiguratorAnalyticsTimePreset,
        productModelId: UUID?,
    ): ConfiguratorAnalyticsSummary {
        val (fromAt, toAt) = timePreset.resolveBounds()
        val ownerId = authFacade.getCurrentAuthDetails().id().value

        val headline =
            if (productModelId != null) {
                configuratorAnalyticsEventRepository
                    .loadHeadline(ownerId, productModelId, fromAt, toAt)
            } else {
                null
            }
        val byProductModel =
            if (productModelId != null) {
                emptyList()
            } else {
                configuratorAnalyticsEventRepository
                    .loadAnalyticsPerProductModelForUser(ownerId, fromAt, toAt)
            }

        return ConfiguratorAnalyticsSummary(
            headline = headline,
            byProductModel = byProductModel,
        )
    }
}
