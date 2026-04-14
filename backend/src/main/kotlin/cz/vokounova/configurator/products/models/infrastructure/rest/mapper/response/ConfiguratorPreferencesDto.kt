package cz.vokounova.configurator.products.models.infrastructure.rest.mapper.response

data class ConfiguratorPreferencesDto(
    val zoomDistanceDefault: Double?,
    val zoomDistanceEmbed: Double?,
    val embedShowProductName: Boolean?,
    val embedShowDescription: Boolean?,
    val embedShowComponents: Boolean?,
    val backgroundPreset: String?,
    val cameraHorizontalAngleRad: Double?,
    val cameraVerticalAngleRad: Double?,
)
