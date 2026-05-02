package cz.vokounova.configurator.analytics.domain

data class ConfiguratorAnalyticsSummary(
    val headline: ConfiguratorAnalyticsHeadline?,
    val byProductModel: List<ConfiguratorAnalyticsPerModelRow>,
)
