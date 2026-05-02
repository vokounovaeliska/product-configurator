package cz.vokounova.configurator.analytics.events.ports.outbound

import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsEventRow
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsHeadline
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsPerModelRow
import java.time.OffsetDateTime
import java.util.UUID

interface ConfiguratorAnalyticsEventRepository {
    fun insertEvents(rows: List<ConfiguratorAnalyticsEventRow>)

    fun loadHeadline(
        ownerId: UUID,
        productModelId: UUID,
        fromAt: OffsetDateTime,
        toAt: OffsetDateTime,
    ): ConfiguratorAnalyticsHeadline

    fun loadAnalyticsPerProductModelForUser(
        ownerId: UUID,
        fromAt: OffsetDateTime,
        toAt: OffsetDateTime,
    ): List<ConfiguratorAnalyticsPerModelRow>
}
