package cz.vokounova.configurator.embed.infrastructure.rest

import cz.vokounova.configurator.products.api.dto.ComponentExternalDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.response.AttributeDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.response.AttributeOptionDto
import cz.vokounova.configurator.products.pricing.infrastructure.rest.mapper.response.AttributePricingRuleDto

data class ConfiguratorPreferencesEmbedDto(
    val zoomDistanceDefault: Double?,
    val zoomDistanceEmbed: Double?,
    val embedShowProductName: Boolean?,
    val embedShowDescription: Boolean?,
    val embedShowComponents: Boolean?,
)

data class ProductEmbedFullDto(
    val product: ProductModelEmbedDto,
    val components: List<ComponentExternalDto>,
    val attributesByComponent: Map<String, List<AttributeDto>>,
    val optionsByAttribute: Map<String, List<AttributeOptionDto>>,
    val pricingRules: List<AttributePricingRuleDto>,
    val configuratorPreferences: ConfiguratorPreferencesEmbedDto? = null,
)
