package cz.vokounova.configurator.products.api.dto

import cz.vokounova.configurator.products.attributes.domain.Attribute
import cz.vokounova.configurator.products.attributes.domain.AttributeOption
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRule

data class ConfiguratorPreferencesExternalDto(
    val zoomDistanceDefault: Double?,
    val zoomDistanceEmbed: Double?,
    val embedShowProductName: Boolean?,
    val embedShowDescription: Boolean?,
    val embedShowComponents: Boolean?,
)

data class FullProductConfigDto(
    val product: ProductModelExternalDto,
    val components: List<ComponentExternalDto>,
    val attributesByComponent: Map<String, List<Attribute>>,
    val optionsByAttribute: Map<String, List<AttributeOption>>,
    val pricingRules: List<AttributePricingRule>,
    val configuratorPreferences: ConfiguratorPreferencesExternalDto? = null,
)
