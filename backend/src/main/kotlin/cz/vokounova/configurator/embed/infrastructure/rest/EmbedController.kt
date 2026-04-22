package cz.vokounova.configurator.embed.infrastructure.rest

import cz.vokounova.configurator.embed.application.EmbedService
import cz.vokounova.configurator.embed.infrastructure.rest.mapper.toEmbedDto
import cz.vokounova.configurator.products.api.ProductConfigQueryFacade
import cz.vokounova.configurator.shared.exceptions.ResourceNotFoundException
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID


@Tag(
    name = "Public embed",
    description = "Unauthenticated APIs for the embedded configurator: published product config and customer lead submission.",
)
@RestController
@RequestMapping("/embed/api/v1")
class EmbedController(
    private val productConfigQueryFacade: ProductConfigQueryFacade,
    private val embedService: EmbedService,
) {
    @Operation(
        summary = "Published product by embed URL",
        description = "Lightweight product metadata for a published path (public embed). userId is the product owner's id.",
    )
    @GetMapping("/products/by-user/{userId}/url/{url}")
    fun getPublishedProductByUserIdAndUrl(
        @PathVariable userId: UUID,
        @PathVariable url: String,
    ): ResponseEntity<ProductModelEmbedDto> {
        val product =
            productConfigQueryFacade.getPublishedProductByUserIdAndUrl(userId, url)
                ?: throw ResourceNotFoundException("Product not found or not published")
        return ResponseEntity.ok(product.toEmbedDto())
    }

    @Operation(
        summary = "Full config by embed URL",
        description = "Components, attributes, options, pricing rules, and embed preferences for the published path.",
    )
    @GetMapping("/products/by-user/{userId}/url/{url}/config")
    fun getPublishedProductConfigByUserIdAndUrl(
        @PathVariable userId: UUID,
        @PathVariable url: String,
    ): ResponseEntity<ProductEmbedFullDto> {
        val config = embedService.getPublishedProductConfigByUserIdAndUrl(userId, url)
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
                            cameraHorizontalAngleRad = it.cameraHorizontalAngleRad,
                            cameraVerticalAngleRad = it.cameraVerticalAngleRad,
                        )
                    },
            )
        return ResponseEntity.ok(dto)
    }

    @Operation(
        summary = "Full config by product id",
        description = "Same as by-url config but keyed by product model id (must be published).",
    )
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
                            cameraHorizontalAngleRad = it.cameraHorizontalAngleRad,
                            cameraVerticalAngleRad = it.cameraVerticalAngleRad,
                        )
                    },
            )
        return ResponseEntity.ok(dto)
    }
}
