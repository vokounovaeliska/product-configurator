package cz.vokounova.configurator.products.models.ports.inbound

import cz.vokounova.configurator.products.models.domain.ProductModelConfiguratorPreferences
import cz.vokounova.configurator.products.models.domain.ProductModelId

interface ProductModelConfiguratorPreferencesAPI {
    /** Returns preferences for any product model (e.g. for embed). */
    fun getByProductModelId(productModelId: ProductModelId): ProductModelConfiguratorPreferences?

    /** Returns preferences only if current user owns the product model. */
    fun getByProductModelIdForCurrentUser(productModelId: ProductModelId): ProductModelConfiguratorPreferences?

    fun upsert(
        productModelId: ProductModelId,
        zoomDistanceDefault: Double?,
        zoomDistanceEmbed: Double?,
        embedShowProductName: Boolean?,
        embedShowDescription: Boolean?,
        embedShowComponents: Boolean?,
        backgroundPreset: String?,
    ): ProductModelConfiguratorPreferences
}
