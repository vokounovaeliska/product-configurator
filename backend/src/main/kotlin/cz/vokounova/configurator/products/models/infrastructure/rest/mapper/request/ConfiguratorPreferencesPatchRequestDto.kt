package cz.vokounova.configurator.products.models.infrastructure.rest.mapper.request

import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ConfiguratorPreferencesPatchRequestDto(
    val zoomDistanceDefault: Double? = null,
    val zoomDistanceEmbed: Double? = null,
    val embedShowProductName: Boolean? = null,
    val embedShowDescription: Boolean? = null,
    val embedShowComponents: Boolean? = null,
)
