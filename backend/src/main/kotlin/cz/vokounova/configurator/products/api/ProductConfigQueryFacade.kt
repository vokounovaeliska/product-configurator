package cz.vokounova.configurator.products.api

import cz.vokounova.configurator.products.api.dto.FullProductConfigDto
import cz.vokounova.configurator.products.api.dto.ProductModelExternalDto
import java.util.UUID

interface ProductConfigQueryFacade {
    fun getPublishedProductByUserIdAndUrl(
        userId: UUID,
        url: String,
    ): ProductModelExternalDto?

    fun isProductPublished(productModelId: UUID): Boolean

    fun getProductOwnerId(productModelId: UUID): UUID

    fun getFullConfigByProductUrl(
        userId: UUID,
        url: String,
    ): FullProductConfigDto

    
    fun getFullConfigByProductId(productModelId: UUID): FullProductConfigDto?
}
