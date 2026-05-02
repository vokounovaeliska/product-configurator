package cz.vokounova.configurator.analytics.domain

data class ConfiguratorAnalyticsHeadline(
    val configuratorOpens: Long,
    val changedAtLeastOnce: Long,
    val requestFormOpens: Long,
    val submissions: Long,
)
