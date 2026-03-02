package cz.vokounova.configurator.embed.infrastructure.rest

import cz.vokounova.configurator.embed.application.EmbedService
import cz.vokounova.configurator.embed.infrastructure.rest.mapper.toEmbedDto
import cz.vokounova.configurator.products.attributes.infrastructure.rest.mapper.toDto
import cz.vokounova.configurator.products.components.infrastructure.rest.mapper.toDto
import cz.vokounova.configurator.products.models.ports.inbound.ProductModelAPI
import cz.vokounova.configurator.products.pricing.infrastructure.rest.mapper.toDto
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Public embed API – no authentication required.
 * Embed URL: /e/{url} – globally unique when published.
 */
@RestController
@RequestMapping("/embed/api/v1")
class EmbedController(
    private val productModelAPI: ProductModelAPI,
    private val embedService: EmbedService,
) {
    @GetMapping("/products/by-url/{url}")
    fun getPublishedProductByUrl(
        @PathVariable url: String,
    ): ResponseEntity<ProductModelEmbedDto> {
        val productModel =
            productModelAPI.getPublishedByUrl(url)
                ?: throw ResourceNotFoundException("Product not found or not published")
        return ResponseEntity.ok(productModel.toEmbedDto())
    }

    @GetMapping("/products/by-url/{url}/config")
    fun getPublishedProductConfigByUrl(
        @PathVariable url: String,
    ): ResponseEntity<ProductEmbedFullDto> {
        val config = embedService.getPublishedProductConfigByUrl(url)
        val dto =
            ProductEmbedFullDto(
                product = config.product.toEmbedDto(),
                components = config.components.map { it.toDto() },
                attributesByComponent =
                    config.attributesByComponent.mapValues { (_, attrs) ->
                        attrs.map { it.toDto() }
                    },
                optionsByAttribute =
                    config.optionsByAttribute.mapValues { (_, opts) ->
                        opts.map { it.toDto() }
                    },
                pricingRules = config.pricingRules.map { it.toDto() },
            )
        return ResponseEntity.ok(dto)
    }
}
