package cz.vokounova.configurator.analytics.infrastructure.rest.dto

import java.util.UUID

data class ConfiguratorAnalyticsHeadlineDto(
    val configuratorOpens: Long,
    val changedAtLeastOnce: Long,
    val requestFormOpens: Long,
    val submissions: Long,
)

data class ConfiguratorAnalyticsPerModelRowDto(
    val productModelId: UUID,
    val productModelName: String,
    val configuratorOpens: Long,
    val changedAtLeastOnce: Long,
    val requestFormOpens: Long,
    val submissions: Long,
)

data class ConfiguratorAnalyticsSummaryResponseDto(
    val headline: ConfiguratorAnalyticsHeadlineDto?,
    val byProductModel: List<ConfiguratorAnalyticsPerModelRowDto>,
)
