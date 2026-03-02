package cz.vokounova.configurator.embed.infrastructure.rest

import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.response.AttributeDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.response.AttributeOptionDto
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.response.ComponentDto
import cz.vokounova.configurator.products.pricing.infrastructure.rest.mapper.response.AttributePricingRuleDto

data class ProductEmbedFullDto(
    val product: ProductModelEmbedDto,
    val components: List<ComponentDto>,
    val attributesByComponent: Map<String, List<AttributeDto>>,
    val optionsByAttribute: Map<String, List<AttributeOptionDto>>,
    val pricingRules: List<AttributePricingRuleDto>,
)
