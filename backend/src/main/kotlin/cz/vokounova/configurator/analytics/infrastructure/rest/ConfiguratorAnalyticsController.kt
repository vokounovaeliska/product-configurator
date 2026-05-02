package cz.vokounova.configurator.analytics.infrastructure.rest

import cz.vokounova.configurator.analytics.application.ConfiguratorAnalyticsQueryService
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsHeadline
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsPerModelRow
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsSummary
import cz.vokounova.configurator.analytics.domain.ConfiguratorAnalyticsTimePreset
import cz.vokounova.configurator.analytics.infrastructure.rest.dto.ConfiguratorAnalyticsHeadlineDto
import cz.vokounova.configurator.analytics.infrastructure.rest.dto.ConfiguratorAnalyticsPerModelRowDto
import cz.vokounova.configurator.analytics.infrastructure.rest.dto.ConfiguratorAnalyticsSummaryResponseDto
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@Tag(name = "Configurator analytics", description = "Seller dashboard metrics for public configurator usage")
@RestController
@RequestMapping("/products/api/v1/configurator-analytics")
class ConfiguratorAnalyticsController(
    private val configuratorAnalyticsQueryService: ConfiguratorAnalyticsQueryService,
) {
    @Operation(summary = "Summary metrics by time preset and optional product model")
    @GetMapping("/summary")
    fun summary(
        @RequestParam timePreset: String,
        @RequestParam(required = false) productModelId: UUID?,
    ): ResponseEntity<ConfiguratorAnalyticsSummaryResponseDto> {
        val preset =
            ConfiguratorAnalyticsTimePreset.fromParam(timePreset)
                ?: return ResponseEntity.badRequest().build()
        val domain = configuratorAnalyticsQueryService.loadSummary(preset, productModelId)
        return ResponseEntity.ok(domain.toResponseDto())
    }

    private fun ConfiguratorAnalyticsSummary.toResponseDto(): ConfiguratorAnalyticsSummaryResponseDto =
        ConfiguratorAnalyticsSummaryResponseDto(
            headline = headline?.toDto(),
            byProductModel = byProductModel.map { it.toDto() },
        )

    private fun ConfiguratorAnalyticsHeadline.toDto(): ConfiguratorAnalyticsHeadlineDto =
        ConfiguratorAnalyticsHeadlineDto(
            configuratorOpens = configuratorOpens,
            changedAtLeastOnce = changedAtLeastOnce,
            requestFormOpens = requestFormOpens,
            submissions = submissions,
        )

    private fun ConfiguratorAnalyticsPerModelRow.toDto(): ConfiguratorAnalyticsPerModelRowDto =
        ConfiguratorAnalyticsPerModelRowDto(
            productModelId = productModelId,
            productModelName = productModelName,
            configuratorOpens = configuratorOpens,
            changedAtLeastOnce = changedAtLeastOnce,
            requestFormOpens = requestFormOpens,
            submissions = submissions,
        )
}
