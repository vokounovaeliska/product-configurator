package cz.vokounova.configurator.products.application

import cz.vokounova.configurator.products.api.ProductConfigQueryFacade
import cz.vokounova.configurator.products.api.dto.AttributeExternalDto
import cz.vokounova.configurator.products.api.dto.AttributeOptionExternalDto
import cz.vokounova.configurator.products.api.dto.AttributePricingRuleExternalDto
import cz.vokounova.configurator.products.api.dto.ComponentExternalDto
import cz.vokounova.configurator.products.api.dto.ConfiguratorPreferencesExternalDto
import cz.vokounova.configurator.products.api.dto.FullProductConfigDto
import cz.vokounova.configurator.products.api.dto.ProductModelExternalDto
import cz.vokounova.configurator.products.attributes.domain.Attribute
import cz.vokounova.configurator.products.attributes.domain.AttributeFilter
import cz.vokounova.configurator.products.attributes.domain.AttributeOption
import cz.vokounova.configurator.products.attributes.ports.outbound.AttributeOptionRepository
import cz.vokounova.configurator.products.attributes.ports.outbound.AttributeRepository
import cz.vokounova.configurator.products.components.domain.Component
import cz.vokounova.configurator.products.components.domain.ComponentFilter
import cz.vokounova.configurator.products.components.ports.outbound.ComponentRepository
import cz.vokounova.configurator.products.models.domain.ProductModel
import cz.vokounova.configurator.products.models.domain.ProductModelId
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.products.models.ports.outbound.ProductModelConfiguratorPreferencesRepository
import cz.vokounova.configurator.products.pricing.domain.AttributePricingRule
import cz.vokounova.configurator.products.pricing.ports.outbound.AttributePricingRuleRepository
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import java.util.UUID

@org.springframework.stereotype.Component
class ProductConfigQueryService(
    private val productModelAPI: ProductModelAPI,
    private val componentRepository: ComponentRepository,
    private val attributeRepository: AttributeRepository,
    private val attributeOptionRepository: AttributeOptionRepository,
    private val attributePricingRuleRepository: AttributePricingRuleRepository,
    private val configuratorPreferencesRepository: ProductModelConfiguratorPreferencesRepository,
) : ProductConfigQueryFacade {
    override fun getPublishedProductByUrl(url: String): ProductModelExternalDto? = productModelAPI.getPublishedByUrl(url)?.toExternalDto()

    override fun isProductPublished(productModelId: UUID): Boolean {
        val model = productModelAPI.getOne(ProductModelId(productModelId))
        return model.isPublished
    }

    override fun getProductOwnerId(productModelId: UUID): UUID {
        val model = productModelAPI.getOne(ProductModelId(productModelId))
        return model.userId.value
    }

    override fun getFullConfigByProductUrl(url: String): FullProductConfigDto {
        val product =
            productModelAPI.getPublishedByUrl(url)
                ?: throw ResourceNotFoundException("Product not found or not published")
        val productId = ProductModelId(product.id.value)
        val components = componentRepository.findByFilter(ComponentFilter(productModelIds = listOf(productId)))
        val attributesByComponent =
            components.associate { component ->
                component.id.value.toString() to
                    attributeRepository.findByFilter(AttributeFilter(componentIds = listOf(component.id)))
            }
        val optionsByAttribute =
            attributesByComponent.values.flatten().associate { attr ->
                attr.id.value.toString() to attributeOptionRepository.findByAttributeId(attr.id)
            }
        val pricingRules = attributePricingRuleRepository.findByProductModelId(productId)
        val prefs = configuratorPreferencesRepository.findByProductModelId(productId)
        return FullProductConfigDto(
            product = product.toExternalDto(),
            components = components.map { it.toExternalDto() },
            attributesByComponent =
                attributesByComponent.mapValues { (_, attrs) ->
                    attrs.map { it.toAttributeExternalDto() }
                },
            optionsByAttribute =
                optionsByAttribute.mapValues { (_, opts) ->
                    opts.map { it.toAttributeOptionExternalDto() }
                },
            pricingRules = pricingRules.map { it.toAttributePricingRuleExternalDto() },
            configuratorPreferences =
                prefs?.let {
                    ConfiguratorPreferencesExternalDto(
                        zoomDistanceDefault = it.zoomDistanceDefault?.toDouble(),
                        zoomDistanceEmbed = it.zoomDistanceEmbed?.toDouble(),
                        embedShowProductName = it.embedShowProductName,
                        embedShowDescription = it.embedShowDescription,
                        embedShowComponents = it.embedShowComponents,
                        backgroundPreset = it.backgroundPreset,
                    )
                },
        )
    }

    private fun ProductModel.toExternalDto() =
        ProductModelExternalDto(
            id = id.value,
            name = name,
            description = description,
            price = price,
            currency = currency,
            model3dUrl = model3dUrl,
            model3dEffects = model3dEffects,
            url = url,
            isPublished = isPublished,
        )

    private fun Component.toExternalDto() =
        ComponentExternalDto(
            id = id.value,
            productModelId = productModelId.value,
            code = code,
            label = label,
            description = description,
            sortOrder = sortOrder,
            imageZIndex = imageZIndex,
            createdAt = createdAt,
            modifiedAt = modifiedAt,
        )

    private fun Attribute.toAttributeExternalDto() =
        AttributeExternalDto(
            id = id.value,
            componentId = componentId.value,
            code = code,
            label = label,
            type = type,
            isRequired = isRequired,
            minInt = minInt,
            maxInt = maxInt,
            minDecimal = minDecimal,
            maxDecimal = maxDecimal,
            defaultInt = defaultInt,
            defaultDecimal = defaultDecimal,
            unit = unit,
            sortOrder = sortOrder,
            createdAt = createdAt,
            modifiedAt = modifiedAt,
        )

    private fun AttributeOption.toAttributeOptionExternalDto() =
        AttributeOptionExternalDto(
            id = id.value,
            attributeId = attributeId.value,
            value = value,
            label = label,
            imageUrl = imageUrl,
            sortOrder = sortOrder,
            createdAt = createdAt,
            modifiedAt = modifiedAt,
        )

    private fun AttributePricingRule.toAttributePricingRuleExternalDto() =
        AttributePricingRuleExternalDto(
            id = id.value,
            productModelId = productModelId.value,
            componentId = componentId,
            attributeCode = attributeCode,
            operator = operator,
            value = value,
            toValue = toValue,
            price = price,
            createdAt = createdAt,
            modifiedAt = modifiedAt,
        )
}
