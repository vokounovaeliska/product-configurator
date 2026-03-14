package cz.vokounova.configurator.embed.infrastructure.rest

import cz.vokounova.configurator.embed.application.EmbedService
import cz.vokounova.configurator.embed.infrastructure.rest.mapper.toEmbedDto
import cz.vokounova.configurator.products.api.ProductConfigQueryFacade
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * Public embed API – no authentication required.
 * Embed URL: /e/{url} – globally unique when published.
 */
@RestController
@RequestMapping("/embed/api/v1")
class EmbedController(
    private val productConfigQueryFacade: ProductConfigQueryFacade,
    private val embedService: EmbedService,
) {
    @GetMapping("/products/by-url/{url}")
    fun getPublishedProductByUrl(
        @PathVariable url: String,
    ): ResponseEntity<ProductModelEmbedDto> {
        val product =
            productConfigQueryFacade.getPublishedProductByUrl(url)
                ?: throw ResourceNotFoundException("Product not found or not published")
        return ResponseEntity.ok(product.toEmbedDto())
    }

    @GetMapping("/products/by-url/{url}/config")
    fun getPublishedProductConfigByUrl(
        @PathVariable url: String,
    ): ResponseEntity<ProductEmbedFullDto> {
        val config = embedService.getPublishedProductConfigByUrl(url)
        val dto =
            ProductEmbedFullDto(
                product = config.product.toEmbedDto(),
                components = config.components,
                attributesByComponent = config.attributesByComponent,
                optionsByAttribute = config.optionsByAttribute,
                pricingRules = config.pricingRules,
                configuratorPreferences =
                    config.configuratorPreferences?.let {
                        ConfiguratorPreferencesEmbedDto(
                            zoomDistanceDefault = it.zoomDistanceDefault,
                            zoomDistanceEmbed = it.zoomDistanceEmbed,
                            embedShowProductName = it.embedShowProductName,
                            embedShowDescription = it.embedShowDescription,
                            embedShowComponents = it.embedShowComponents,
                            backgroundPreset = it.backgroundPreset,
                        )
                    },
            )
        return ResponseEntity.ok(dto)
    }

    @GetMapping("/products/by-id/{id}/config")
    fun getPublishedProductConfigById(
        @PathVariable id: UUID,
    ): ResponseEntity<ProductEmbedFullDto> {
        val config =
            embedService.getPublishedProductConfigById(id)
                ?: throw ResourceNotFoundException("Product not found or not published")
        val dto =
            ProductEmbedFullDto(
                product = config.product.toEmbedDto(),
                components = config.components,
                attributesByComponent = config.attributesByComponent,
                optionsByAttribute = config.optionsByAttribute,
                pricingRules = config.pricingRules,
                configuratorPreferences =
                    config.configuratorPreferences?.let {
                        ConfiguratorPreferencesEmbedDto(
                            zoomDistanceDefault = it.zoomDistanceDefault,
                            zoomDistanceEmbed = it.zoomDistanceEmbed,
                            embedShowProductName = it.embedShowProductName,
                            embedShowDescription = it.embedShowDescription,
                            embedShowComponents = it.embedShowComponents,
                            backgroundPreset = it.backgroundPreset,
                        )
                    },
            )
        return ResponseEntity.ok(dto)
    }
}
