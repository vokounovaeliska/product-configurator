package cz.vokounova.configurator.products.api

import cz.vokounova.configurator.products.api.dto.FullProductConfigDto
import cz.vokounova.configurator.products.api.dto.ProductModelExternalDto
import java.util.UUID

interface ProductConfigQueryFacade {
    fun getPublishedProductByUrl(url: String): ProductModelExternalDto?

    fun isProductPublished(productModelId: UUID): Boolean

    fun getProductOwnerId(productModelId: UUID): UUID

    fun getFullConfigByProductUrl(url: String): FullProductConfigDto

    /** Returns full config for email choice formatting. Null if product not found. */
    fun getFullConfigByProductId(productModelId: UUID): FullProductConfigDto?
}
