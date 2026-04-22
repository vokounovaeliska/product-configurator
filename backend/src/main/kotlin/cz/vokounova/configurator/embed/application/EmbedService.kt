package cz.vokounova.configurator.embed.application

import cz.vokounova.configurator.products.api.ProductConfigQueryFacade
import cz.vokounova.configurator.products.api.dto.FullProductConfigDto
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class EmbedService(
    private val productConfigQueryFacade: ProductConfigQueryFacade,
) {
    fun getPublishedProductConfigByUserIdAndUrl(
        userId: UUID,
        url: String,
    ): FullProductConfigDto = productConfigQueryFacade.getFullConfigByProductUrl(userId, url)

    fun getPublishedProductConfigById(productModelId: UUID): FullProductConfigDto? =
        if (productConfigQueryFacade.isProductPublished(productModelId)) {
            productConfigQueryFacade.getFullConfigByProductId(productModelId)
        } else {
            null
        }
}
