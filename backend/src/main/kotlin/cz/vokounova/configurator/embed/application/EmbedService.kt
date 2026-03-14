package cz.vokounova.configurator.embed.application

import cz.vokounova.configurator.products.api.ProductConfigQueryFacade
import cz.vokounova.configurator.products.api.dto.FullProductConfigDto
import java.util.UUID
import org.springframework.stereotype.Service

@Service
class EmbedService(
    private val productConfigQueryFacade: ProductConfigQueryFacade,
) {
    fun getPublishedProductConfigByUrl(url: String): FullProductConfigDto =
        productConfigQueryFacade.getFullConfigByProductUrl(url)

    /** Returns full config for published product, null if not found or not published. */
    fun getPublishedProductConfigById(productModelId: UUID): FullProductConfigDto? =
        if (productConfigQueryFacade.isProductPublished(productModelId)) {
            productConfigQueryFacade.getFullConfigByProductId(productModelId)
        } else {
            null
        }
}
