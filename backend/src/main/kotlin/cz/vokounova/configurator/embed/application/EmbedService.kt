package cz.vokounova.configurator.embed.application

import cz.vokounova.configurator.products.attributes.domain.AttributeFilter
import cz.vokounova.configurator.products.attributes.ports.outbound.AttributeOptionRepository
import cz.vokounova.configurator.products.attributes.ports.outbound.AttributeRepository
import cz.vokounova.configurator.products.components.domain.ComponentFilter
import cz.vokounova.configurator.products.components.ports.outbound.ComponentRepository
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.products.pricing.ports.outbound.AttributePricingRuleRepository
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import org.springframework.stereotype.Service

@Service
class EmbedService(
    private val productModelAPI: ProductModelAPI,
    private val componentRepository: ComponentRepository,
    private val attributeRepository: AttributeRepository,
    private val attributeOptionRepository: AttributeOptionRepository,
    private val attributePricingRuleRepository: AttributePricingRuleRepository,
) {
    fun getPublishedProductConfigByUrl(url: String): PublishedProductConfig {
        val product =
            productModelAPI.getPublishedByUrl(url)
                ?: throw ResourceNotFoundException("Product not found or not published")
        val productId = ProductModelId(product.id.value)
        val components = componentRepository.findByFilter(ComponentFilter(productModelIds = listOf(productId)))
        val attributesByComponent =
            components.associate { component ->
                component.id.value.toString() to attributeRepository.findByFilter(AttributeFilter(componentIds = listOf(component.id)))
            }
        val optionsByAttribute =
            attributesByComponent.values.flatten().associate { attr ->
                attr.id.value.toString() to attributeOptionRepository.findByAttributeId(attr.id)
            }
        val pricingRules = attributePricingRuleRepository.findByProductModelId(productId)
        return PublishedProductConfig(
            product = product,
            components = components,
            attributesByComponent = attributesByComponent,
            optionsByAttribute = optionsByAttribute,
            pricingRules = pricingRules,
        )
    }
}
