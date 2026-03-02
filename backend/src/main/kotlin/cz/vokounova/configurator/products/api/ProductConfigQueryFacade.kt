package cz.vokounova.configurator.products.api

import cz.vokounova.configurator.products.api.dto.FullProductConfigDto
import cz.vokounova.configurator.products.api.dto.ProductModelExternalDto
import java.util.UUID

interface ProductConfigQueryFacade {
    fun getPublishedProductByUrl(url: String): ProductModelExternalDto?

    fun isProductPublished(productModelId: UUID): Boolean

    fun getFullConfigByProductUrl(url: String): FullProductConfigDto
}
