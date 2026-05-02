package cz.vokounova.configurator.analytics.domain

import java.util.UUID

data class ConfiguratorAnalyticsPerModelRow(
    val productModelId: UUID,
    val productModelName: String,
    val configuratorOpens: Long,
    val changedAtLeastOnce: Long,
    val requestFormOpens: Long,
    val submissions: Long,
)
