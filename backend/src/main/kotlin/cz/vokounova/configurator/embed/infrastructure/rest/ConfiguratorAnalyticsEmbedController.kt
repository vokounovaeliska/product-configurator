package cz.vokounova.configurator.embed.infrastructure.rest

import cz.vokounova.configurator.analytics.api.PublicConfiguratorAnalyticsFacade
import cz.vokounova.configurator.analytics.api.dto.ConfiguratorAnalyticsEventBatchRequestDto
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@Tag(
    name = "Public embed",
    description = "Unauthenticated analytics for the published configurator.",
)
@RestController
@RequestMapping("/embed/api/v1")
class ConfiguratorAnalyticsEmbedController(
    private val publicConfiguratorAnalyticsFacade: PublicConfiguratorAnalyticsFacade,
) {
    @Operation(summary = "Receive public configurator analytics events (batch)")
    @PostMapping("/configurator-analytics/events")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun receiveEvents(
        @RequestBody body: ConfiguratorAnalyticsEventBatchRequestDto,
    ) {
        publicConfiguratorAnalyticsFacade.receive(body)
    }
}
