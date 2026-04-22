package cz.vokounova.configurator.products.models.ports.inbound

import cz.vokounova.configurator.products.models.domain.ProductModelConfiguratorPreferences
import cz.vokounova.configurator.products.models.domain.ProductModelId

interface ProductModelConfiguratorPreferencesAPI {
    
    fun getByProductModelId(productModelId: ProductModelId): ProductModelConfiguratorPreferences?

    
    fun getByProductModelIdForCurrentUser(productModelId: ProductModelId): ProductModelConfiguratorPreferences?

    fun upsert(
        productModelId: ProductModelId,
        zoomDistanceDefault: Double?,
        zoomDistanceEmbed: Double?,
        embedShowProductName: Boolean?,
        embedShowDescription: Boolean?,
        embedShowComponents: Boolean?,
        backgroundPreset: String?,
        cameraHorizontalAngleRad: Double?,
        cameraVerticalAngleRad: Double?,
        clearSavedCameraAngles: Boolean?,
    ): ProductModelConfiguratorPreferences
}
