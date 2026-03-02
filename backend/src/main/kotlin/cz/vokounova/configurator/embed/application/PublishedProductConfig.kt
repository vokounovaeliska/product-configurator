package cz.vokounova.configurator.embed.application

import cz.vokounova.configurator.products.attributes.domain.Attribute
import cz.vokounova.configurator.products.attributes.domain.AttributeOption
import cz.vokounova.configurator.products.components.domain.Component
import cz.vokounova.configurator.products.models.domain.ProductModel
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRule

data class PublishedProductConfig(
    val product: ProductModel,
    val components: List<Component>,
    val attributesByComponent: Map<String, List<Attribute>>,
    val optionsByAttribute: Map<String, List<AttributeOption>>,
    val pricingRules: List<AttributePricingRule>,
)
