package cz.vokounova.configurator.embed.application

import cz.vokounova.configurator.products.api.ProductConfigQueryFacade
import cz.vokounova.configurator.products.api.dto.FullProductConfigDto
import org.springframework.stereotype.Service

@Service
class EmbedService(
    private val productConfigQueryFacade: ProductConfigQueryFacade,
) {
    fun getPublishedProductConfigByUrl(url: String): FullProductConfigDto = productConfigQueryFacade.getFullConfigByProductUrl(url)
}
