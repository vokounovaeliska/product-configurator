package cz.vokounova.configurator.embed.infrastructure.rest

import cz.vokounova.configurator.products.api.dto.AttributeExternalDto
import cz.vokounova.configurator.products.api.dto.AttributeOptionExternalDto
import cz.vokounova.configurator.products.api.dto.AttributePricingRuleExternalDto
import cz.vokounova.configurator.products.api.dto.ComponentExternalDto

data class ConfiguratorPreferencesEmbedDto(
    val zoomDistanceDefault: Double?,
    val zoomDistanceEmbed: Double?,
    val embedShowProductName: Boolean?,
    val embedShowDescription: Boolean?,
    val embedShowComponents: Boolean?,
    val backgroundPreset: String?,
)

data class ProductEmbedFullDto(
    val product: ProductModelEmbedDto,
    val components: List<ComponentExternalDto>,
    val attributesByComponent: Map<String, List<AttributeExternalDto>>,
    val optionsByAttribute: Map<String, List<AttributeOptionExternalDto>>,
    val pricingRules: List<AttributePricingRuleExternalDto>,
    val configuratorPreferences: ConfiguratorPreferencesEmbedDto? = null,
)
